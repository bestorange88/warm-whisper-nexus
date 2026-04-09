import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Image, Paperclip, Phone, Video, MoreVertical, X, FileText, Download, Loader2, Check, CheckCheck, Copy, Trash2, Undo2, Reply } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMessages, useSendMessage, useConversation, useRecallMessage, useDeleteMessage, useReadReceipt } from '@/hooks/useConversations';
import { useProfile } from '@/hooks/useProfile';
import { useCallContext } from '@/features/calling/CallProvider';
import { CallMessageRenderer } from '@/features/calling/components/CallMessageRenderer';
import { isCallMessage } from '@/features/calling/callMessageBuilder';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Message } from '@/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const RECALL_WINDOW_MS = 2 * 60 * 1000;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMessagePreviewText(msg: Message | undefined): string {
  if (!msg) return '[消息不存在]';
  if (msg.is_deleted) return '[消息已撤回]';
  switch (msg.type) {
    case 'image': return '[图片]';
    case 'file': return `[文件] ${msg.file_name || ''}`;
    case 'audio': return '[语音]';
    case 'video': return '[视频]';
    default: return msg.content || '';
  }
}

interface MessageMenuProps {
  msg: Message;
  isOwn: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onRecall: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onReply: () => void;
}

function MessageContextMenu({ msg, isOwn, position, onClose, onRecall, onDelete, onCopy, onReply }: MessageMenuProps) {
  const canRecall = isOwn && Date.now() - new Date(msg.created_at).getTime() < RECALL_WINDOW_MS;

  useEffect(() => {
    const handler = () => onClose();
    document.addEventListener('click', handler);
    document.addEventListener('scroll', handler, true);
    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('scroll', handler, true);
    };
  }, [onClose]);

  return (
    <div
      className="fixed z-50 rounded-xl border border-border bg-background shadow-lg py-1 min-w-[120px] animate-in fade-in zoom-in-95"
      style={{ top: position.y, left: position.x, transform: 'translate(-50%, -100%)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <button onClick={onReply} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted">
        <Reply className="h-4 w-4" /> 回复
      </button>
      {msg.type === 'text' && msg.content && (
        <button onClick={onCopy} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted">
          <Copy className="h-4 w-4" /> 复制
        </button>
      )}
      {canRecall && (
        <button onClick={onRecall} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted">
          <Undo2 className="h-4 w-4" /> 撤回
        </button>
      )}
      {isOwn && (
        <button onClick={onDelete} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-muted">
          <Trash2 className="h-4 w-4" /> 删除
        </button>
      )}
    </div>
  );
}

/** Quoted message block shown inside a reply bubble */
function QuotedMessage({ replyToId, messagesMap, isOwn }: { replyToId: string; messagesMap: Map<string, Message>; isOwn: boolean }) {
  const original = messagesMap.get(replyToId);
  const senderName = original?.sender?.display_name || original?.sender?.username || '未知';
  const preview = getMessagePreviewText(original);

  return (
    <div
      className={cn(
        'mb-1 rounded-lg border-l-2 px-2.5 py-1.5 text-xs',
        isOwn
          ? 'border-white/40 bg-white/15 text-white/80'
          : 'border-stone-300 bg-stone-50 text-stone-500'
      )}
    >
      <p className="font-medium">{senderName}</p>
      <p className="mt-0.5 truncate">{preview.length > 40 ? preview.slice(0, 40) + '…' : preview}</p>
    </div>
  );
}

export default function ChatDetail() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const { data: conversation } = useConversation(conversationId);
  const { data: messages, isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const recallMessage = useRecallMessage();
  const deleteMessage = useDeleteMessage();
  const { initiateCall } = useCallContext();
  const [input, setInput] = useState('');
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ msg: Message; x: number; y: number } | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  // Build a map for quick message lookup (for quoted messages)
  const messagesMap = useMemo(() => {
    const map = new Map<string, Message>();
    messages?.forEach((m) => map.set(m.id, m));
    return map;
  }, [messages]);

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

  const isDirectChat = conversation?.type === 'direct';
  const { data: otherLastRead } = useReadReceipt(
    isDirectChat ? conversationId : undefined,
    isDirectChat ? otherUserId : undefined
  );

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
    const replyToId = replyTo?.id;
    setReplyTo(null);
    await sendMessage.mutateAsync({
      conversation_id: conversationId,
      sender_id: user.id,
      type: 'text',
      content,
      ...(replyToId ? { reply_to: replyToId } : {}),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCall = (callType: 'audio' | 'video') => {
    if (!otherUserId || !conversationId) return;
    initiateCall(conversationId, otherUserId, callType, otherProfile?.display_name || otherProfile?.username, otherProfile?.avatar_url || undefined);
  };

  const uploadFile = useCallback(async (file: File, type: 'image' | 'file') => {
    if (!user || !conversationId) return;
    if (file.size > MAX_FILE_SIZE) { toast.error('文件大小不能超过 10MB'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${user.id}/${conversationId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('chat-media').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(path);
      await sendMessage.mutateAsync({
        conversation_id: conversationId,
        sender_id: user.id,
        type,
        content: type === 'image' ? '[图片]' : `[文件] ${file.name}`,
        media_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
      });
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  }, [user, conversationId, sendMessage]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, 'image');
    e.target.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile(file, IMAGE_TYPES.includes(file.type) ? 'image' : 'file');
    e.target.value = '';
  };

  // Long press / context menu
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleMsgTouchStart = (e: React.TouchEvent, msg: Message) => {
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => { setContextMenu({ msg, x: touch.clientX, y: touch.clientY - 10 }); }, 500);
  };
  const handleMsgTouchEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };
  const handleMsgContextMenu = (e: React.MouseEvent, msg: Message) => { e.preventDefault(); setContextMenu({ msg, x: e.clientX, y: e.clientY - 10 }); };

  const handleRecall = async () => {
    if (!contextMenu || !user || !conversationId) return;
    const msg = contextMenu.msg;
    setContextMenu(null);
    try {
      await recallMessage.mutateAsync({ messageId: msg.id, conversationId, senderId: user.id, createdAt: msg.created_at });
      toast.success('消息已撤回');
    } catch (err: any) { toast.error(err.message || '撤回失败'); }
  };

  const handleDelete = async () => {
    if (!contextMenu || !user || !conversationId) return;
    const msg = contextMenu.msg;
    setContextMenu(null);
    try {
      await deleteMessage.mutateAsync({ messageId: msg.id, conversationId, senderId: user.id });
      toast.success('消息已删除');
    } catch { toast.error('删除失败'); }
  };

  const handleCopy = () => {
    if (!contextMenu?.msg.content) return;
    navigator.clipboard.writeText(contextMenu.msg.content);
    setContextMenu(null);
    toast.success('已复制');
  };

  const handleReply = () => {
    if (!contextMenu) return;
    setReplyTo(contextMenu.msg);
    setContextMenu(null);
    inputRef.current?.focus();
  };

  const isMessageRead = useCallback((msg: Message) => {
    if (!isDirectChat || !otherLastRead) return false;
    return new Date(msg.created_at) <= new Date(otherLastRead);
  }, [isDirectChat, otherLastRead]);

  if (isLoading) return <FullPageLoading />;

  const chatName = isDirectChat
    ? (otherProfile?.display_name || otherProfile?.username || '聊天')
    : (conversation?.name || '群聊');
  const chatAvatar = isDirectChat ? otherProfile?.avatar_url : conversation?.avatar_url;

  return (
    <div className="flex h-full flex-col bg-stone-50">
      {/* Header */}
      <header className="safe-area-top flex h-12 shrink-0 items-center gap-2 border-b border-stone-100 bg-white px-3">
        <button onClick={() => navigate(-1)} className="text-stone-600"><ArrowLeft className="h-5 w-5" /></button>
        <UserAvatar src={chatAvatar} name={chatName} size="sm" />
        <h1 className="flex-1 truncate text-base font-semibold text-stone-900">{chatName}</h1>
        {isDirectChat && (
          <>
            <button onClick={() => handleCall('audio')} className="p-1.5 text-stone-500 hover:text-brand"><Phone className="h-5 w-5" /></button>
            <button onClick={() => handleCall('video')} className="p-1.5 text-stone-500 hover:text-brand"><Video className="h-5 w-5" /></button>
          </>
        )}
        {!isDirectChat && (
          <button onClick={() => navigate(`/group/${conversationId}`)} className="p-1.5 text-stone-500 hover:text-stone-700"><MoreVertical className="h-5 w-5" /></button>
        )}
        {isDirectChat && (
          <button onClick={() => navigate(`/profile/${otherUserId}`)} className="p-1.5 text-stone-500 hover:text-stone-700"><MoreVertical className="h-5 w-5" /></button>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages?.map((msg: Message) => {
          const isOwn = msg.sender_id === user?.id;

          if (msg.type === 'system' && isCallMessage(msg.content)) {
            return <CallMessageRenderer key={msg.id} content={msg.content!} />;
          }

          return (
            <div
              key={msg.id}
              className={cn('mb-3 flex', isOwn ? 'justify-end' : 'justify-start')}
              onTouchStart={(e) => handleMsgTouchStart(e, msg)}
              onTouchEnd={handleMsgTouchEnd}
              onTouchMove={handleMsgTouchEnd}
              onContextMenu={(e) => handleMsgContextMenu(e, msg)}
            >
              <div className={cn('flex max-w-[75%] gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
                <UserAvatar src={msg.sender?.avatar_url} name={msg.sender?.display_name} size="sm" className="mt-1 shrink-0" />
                <div>
                  {!isOwn && msg.sender && (
                    <p className="mb-0.5 text-xs text-stone-400">{msg.sender.display_name}</p>
                  )}
                  <div
                    className={cn(
                      'rounded-2xl text-sm leading-relaxed',
                      msg.type === 'image' ? 'overflow-hidden p-0' : 'px-3.5 py-2',
                      isOwn ? 'rounded-tr-md bg-brand text-white' : 'rounded-tl-md bg-white text-stone-800 shadow-sm'
                    )}
                  >
                    {/* Quoted message */}
                    {msg.reply_to && (
                      <QuotedMessage replyToId={msg.reply_to} messagesMap={messagesMap} isOwn={isOwn} />
                    )}

                    {msg.type === 'image' && msg.media_url ? (
                      <img
                        src={msg.media_url}
                        alt="图片"
                        className="max-h-60 max-w-full cursor-pointer rounded-lg object-cover"
                        onClick={() => setPreviewFile({ url: msg.media_url!, name: '图片', type: 'image' })}
                        loading="lazy"
                      />
                    ) : msg.type === 'file' && msg.media_url ? (
                      <a
                        href={msg.media_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn('flex items-center gap-2.5 no-underline', isOwn ? 'text-white' : 'text-stone-800')}
                      >
                        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', isOwn ? 'bg-white/20' : 'bg-stone-100')}>
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{msg.file_name || '文件'}</p>
                          {msg.file_size && (
                            <p className={cn('text-xs', isOwn ? 'text-white/70' : 'text-stone-400')}>{formatFileSize(msg.file_size)}</p>
                          )}
                        </div>
                        <Download className="h-4 w-4 shrink-0 opacity-60" />
                      </a>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                  </div>
                  {/* Time + read receipt */}
                  <div className={cn('mt-0.5 flex items-center gap-1 text-xs text-stone-300', isOwn ? 'justify-end' : 'justify-start')}>
                    <span>{format(new Date(msg.created_at), 'HH:mm')}</span>
                    {isOwn && isDirectChat && (
                      isMessageRead(msg) ? <CheckCheck className="h-3.5 w-3.5 text-blue-400" /> : <Check className="h-3.5 w-3.5" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Context menu */}
      {contextMenu && (
        <MessageContextMenu
          msg={contextMenu.msg}
          isOwn={contextMenu.msg.sender_id === user?.id}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onRecall={handleRecall}
          onDelete={handleDelete}
          onCopy={handleCopy}
          onReply={handleReply}
        />
      )}

      {/* Reply preview bar */}
      {replyTo && (
        <div className="flex items-center gap-2 border-t border-stone-100 bg-stone-50 px-4 py-2">
          <Reply className="h-4 w-4 shrink-0 text-brand" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-brand">
              回复 {replyTo.sender?.display_name || replyTo.sender?.username || ''}
            </p>
            <p className="truncate text-xs text-stone-400">
              {getMessagePreviewText(replyTo)}
            </p>
          </div>
          <button onClick={() => setReplyTo(null)} className="shrink-0 p-1 text-stone-400 hover:text-stone-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="safe-area-bottom shrink-0 border-t border-stone-100 bg-white px-3 py-2">
        <div className="flex items-end gap-2">
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          <input ref={fileInputRef} type="file" accept="*/*" className="hidden" onChange={handleFileSelect} />
          <button onClick={() => imageInputRef.current?.click()} disabled={uploading} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 disabled:opacity-50">
            <Image className="h-5 w-5" />
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 disabled:opacity-50">
            <Paperclip className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              rows={1}
              className="w-full resize-none rounded-2xl border-0 bg-stone-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          {uploading ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-brand" />
            </div>
          ) : (
            <Button size="icon" className="h-10 w-10 shrink-0 rounded-full" onClick={handleSend} disabled={!input.trim()}>
              <Send className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Image preview modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setPreviewFile(null)}>
          <button className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white" onClick={() => setPreviewFile(null)}>
            <X className="h-6 w-6" />
          </button>
          <img src={previewFile.url} alt={previewFile.name} className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
