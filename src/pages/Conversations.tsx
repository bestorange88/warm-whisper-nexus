import { useNavigate } from 'react-router-dom';
import { MessageCircle, Plus, Search, Image, FileText, Phone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { EmptyState } from '@/components/common/EmptyState';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Message } from '@/types';

function messagePreview(msg?: Message): { icon?: React.ReactNode; text: string } {
  if (!msg) return { text: '暂无消息' };
  if (msg.is_deleted) return { text: '[消息已撤回]' };
  switch (msg.type) {
    case 'image': return { icon: <Image className="h-3 w-3 shrink-0" />, text: '图片' };
    case 'file': return { icon: <FileText className="h-3 w-3 shrink-0" />, text: msg.file_name || '文件' };
    case 'audio': return { icon: <Phone className="h-3 w-3 shrink-0" />, text: '语音消息' };
    case 'video': return { icon: <Phone className="h-3 w-3 shrink-0" />, text: '视频消息' };
    case 'system': return { text: msg.content || '系统消息' };
    default: return { text: msg.content || '' };
  }
}

export default function Conversations() {
  const { user } = useAuth();
  const { data: conversations, isLoading } = useConversations(user?.id);
  const navigate = useNavigate();

  if (isLoading) return <FullPageLoading />;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-2">
        <button
          onClick={() => navigate('/search')}
          className="flex h-9 flex-1 items-center gap-2 rounded-lg bg-stone-100 px-3 text-sm text-stone-400"
        >
          <Search className="h-4 w-4" />
          <span>搜索</span>
        </button>
        <button
          onClick={() => navigate('/add-friend')}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        {!conversations || conversations.length === 0 ? (
          <EmptyState
            icon={<MessageCircle className="h-16 w-16" />}
            title="暂无会话"
            description="添加好友开始聊天吧"
          />
        ) : (
          <div className="divide-y divide-stone-50">
            {conversations.map((conv) => {
              const displayName = conv.type === 'direct'
                ? (conv.other_user?.display_name || conv.other_user?.username || '未命名')
                : (conv.name || '群聊');
              const displayAvatar = conv.type === 'direct'
                ? conv.other_user?.avatar_url
                : conv.avatar_url;
              const unread = conv.unread_count ?? 0;
              const preview = messagePreview(conv.last_message);

              return (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50 active:bg-stone-100"
                >
                  <div className="relative shrink-0">
                    <UserAvatar src={displayAvatar} name={displayName} size="lg" />
                    {unread > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        'truncate text-sm text-stone-900',
                        unread > 0 ? 'font-semibold' : 'font-medium'
                      )}>
                        {displayName}
                      </span>
                      {conv.last_message && (
                        <span className="ml-2 shrink-0 text-[11px] text-stone-400">
                          {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: true, locale: zhCN })}
                        </span>
                      )}
                    </div>
                    <div className={cn(
                      'mt-0.5 flex items-center gap-1 truncate text-xs',
                      unread > 0 ? 'text-stone-600' : 'text-stone-400'
                    )}>
                      {preview.icon}
                      <span className="truncate">{preview.text}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
