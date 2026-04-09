import { useNavigate } from 'react-router-dom';
import { MessageCircle, Plus, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { EmptyState } from '@/components/common/EmptyState';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

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

              return (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50 active:bg-stone-100"
                >
                  <UserAvatar
                    src={displayAvatar}
                    name={displayName}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-medium text-stone-900">
                        {displayName}
                      </span>
                      {conv.last_message && (
                        <span className="ml-2 shrink-0 text-xs text-stone-400">
                          {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: true, locale: zhCN })}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-stone-400">
                      {conv.last_message?.content || '暂无消息'}
                    </p>
                  </div>
                  {(conv.unread_count ?? 0) > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
