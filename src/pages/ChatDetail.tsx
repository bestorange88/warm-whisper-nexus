import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Image, Paperclip, Phone, Video, MoreVertical } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMessages, useSendMessage, useConversation } from '@/hooks/useConversations';
import { useProfile } from '@/hooks/useProfile';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/types';

export default function ChatDetail() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const { data: conversation } = useConversation(conversationId);
  const { data: messages, isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const [input, setInput] = useState('');
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Get other user id for direct chats
  useEffect(() => {
    if (!conversationId || !user || conversation?.type !== 'direct') return;
    supabase
      .from('conversation_members')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .then(({ data }) => {
        const other = data?.find((m) => m.user_id !== user.id);
        if (other) setOtherUserId(other.user_id);
      });
  }, [conversationId, user, conversation?.type]);

  const { data: otherProfile } = useProfile(conversation?.type === 'direct' ? otherUserId ?? undefined : undefined);

  // Mark messages as read
  useEffect(() => {
    if (!conversationId || !user) return;
    supabase
      .from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .then(() => {});
  }, [conversationId, user, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user || !conversationId) return;
    const content = input.trim();
    setInput('');
    await sendMessage.mutateAsync({
      conversation_id: conversationId,
      sender_id: user.id,
      type: 'text',
      content,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) return <FullPageLoading />;

  const chatName = conversation?.type === 'direct'
    ? (otherProfile?.display_name || otherProfile?.username || '聊天')
    : (conversation?.name || '群聊');

  const chatAvatar = conversation?.type === 'direct'
    ? otherProfile?.avatar_url
    : conversation?.avatar_url;

  return (
    <div className="flex h-full flex-col bg-stone-50">
      <header className="safe-area-top flex h-12 shrink-0 items-center gap-2 border-b border-stone-100 bg-white px-3">
        <button onClick={() => navigate(-1)} className="text-stone-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <UserAvatar src={chatAvatar} name={chatName} size="sm" />
        <h1 className="flex-1 truncate text-base font-semibold text-stone-900">{chatName}</h1>
        <button className="p-1.5 text-stone-500 hover:text-stone-700">
          <Phone className="h-5 w-5" />
        </button>
        <button className="p-1.5 text-stone-500 hover:text-stone-700">
          <Video className="h-5 w-5" />
        </button>
        <button className="p-1.5 text-stone-500 hover:text-stone-700">
          <MoreVertical className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages?.map((msg: Message) => {
          const isOwn = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={cn('mb-3 flex', isOwn ? 'justify-end' : 'justify-start')}>
              <div className={cn('flex max-w-[75%] gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
                <UserAvatar
                  src={msg.sender?.avatar_url}
                  name={msg.sender?.display_name}
                  size="sm"
                  className="mt-1 shrink-0"
                />
                <div>
                  {!isOwn && msg.sender && (
                    <p className="mb-0.5 text-xs text-stone-400">{msg.sender.display_name}</p>
                  )}
                  <div
                    className={cn(
                      'rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                      isOwn
                        ? 'rounded-tr-md bg-brand text-white'
                        : 'rounded-tl-md bg-white text-stone-800 shadow-sm'
                    )}
                  >
                    {msg.type === 'image' && msg.media_url ? (
                      <img src={msg.media_url} alt="图片" className="max-w-full rounded-lg" />
                    ) : msg.type === 'file' ? (
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        <span className="truncate">{msg.file_name || '文件'}</span>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                  </div>
                  <p className={cn('mt-0.5 text-xs text-stone-300', isOwn ? 'text-right' : 'text-left')}>
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="safe-area-bottom shrink-0 border-t border-stone-100 bg-white px-3 py-2">
        <div className="flex items-end gap-2">
          <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100">
            <Image className="h-5 w-5" />
          </button>
          <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100">
            <Paperclip className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              rows={1}
              className="w-full resize-none rounded-2xl border-0 bg-stone-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <Button
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
