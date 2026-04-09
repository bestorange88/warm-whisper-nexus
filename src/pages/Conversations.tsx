import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Plus, Search, Image, FileText, Phone, Pin, PinOff, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useConversations, useTogglePin } from '@/hooks/useConversations';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { EmptyState } from '@/components/common/EmptyState';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Message, Conversation } from '@/types';

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

interface ConvMenuProps {
  conv: Conversation;
  position: { x: number; y: number };
  onClose: () => void;
  onPin: () => void;
  onDelete: () => void;
}

function ConversationContextMenu({ conv, position, onClose, onPin, onDelete }: ConvMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 min-w-[140px] rounded-xl border border-border bg-background py-1 shadow-lg animate-in fade-in zoom-in-95"
        style={{
          top: Math.min(position.y, window.innerHeight - 120),
          left: Math.min(position.x, window.innerWidth - 160),
        }}
      >
        <button onClick={onPin} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted">
          {conv.is_pinned
            ? <><PinOff className="h-4 w-4" /> 取消置顶</>
            : <><Pin className="h-4 w-4" /> 置顶会话</>
          }
        </button>
        <button onClick={onDelete} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-muted">
          <Trash2 className="h-4 w-4" /> 删除会话
        </button>
      </div>
    </>
  );
}

export default function Conversations() {
  const { user } = useAuth();
  const { data: conversations, isLoading, refetch } = useConversations(user?.id);
  const togglePin = useTogglePin();
  const navigate = useNavigate();
  const [contextMenu, setContextMenu] = useState<{ conv: Conversation; x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent, conv: Conversation) => {
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      setContextMenu({ conv, x: touch.clientX, y: touch.clientY });
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, conv: Conversation) => {
    e.preventDefault();
    setContextMenu({ conv, x: e.clientX, y: e.clientY });
  }, []);

  const handlePin = async () => {
    if (!contextMenu || !user) return;
    const conv = contextMenu.conv;
    setContextMenu(null);
    try {
      await togglePin.mutateAsync({
        conversationId: conv.id,
        userId: user.id,
        pinned: !conv.is_pinned,
      });
      toast.success(conv.is_pinned ? '已取消置顶' : '已置顶');
    } catch {
      toast.error('操作失败');
    }
  };

  const handleDelete = async () => {
    if (!contextMenu || !user) return;
    const conv = contextMenu.conv;
    setContextMenu(null);
    try {
      // Leave the conversation (remove membership)
      await supabase
        .from('conversation_members')
        .delete()
        .eq('conversation_id', conv.id)
        .eq('user_id', user.id);
      toast.success('会话已删除');
      refetch();
    } catch {
      toast.error('删除失败');
    }
  };

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
                  onTouchStart={(e) => handleTouchStart(e, conv)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                  onContextMenu={(e) => handleContextMenu(e, conv)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50 active:bg-stone-100',
                    conv.is_pinned && 'bg-amber-50/60'
                  )}
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
                      <div className="flex items-center gap-1 min-w-0">
                        {conv.is_pinned && <Pin className="h-3 w-3 shrink-0 text-amber-500" />}
                        <span className={cn(
                          'truncate text-sm text-stone-900',
                          unread > 0 ? 'font-semibold' : 'font-medium'
                        )}>
                          {displayName}
                        </span>
                      </div>
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

      {contextMenu && (
        <ConversationContextMenu
          conv={contextMenu.conv}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onPin={handlePin}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
