import { useNavigate } from 'react-router-dom';
import { UserPlus, Users, Bell, MessageCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFriends, useFriendRequests } from '@/hooks/useContacts';
import { useFindOrCreateDirectChat } from '@/hooks/useConversations';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { EmptyState } from '@/components/common/EmptyState';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export default function Contacts() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: friends, isLoading } = useFriends(user?.id);
  const { data: requests } = useFriendRequests(user?.id);
  const findOrCreateChat = useFindOrCreateDirectChat();
  const navigate = useNavigate();
  const pendingCount = requests?.length ?? 0;
  const [chattingWith, setChattingWith] = useState<string | null>(null);

  const handleStartChat = async (friendId: string) => {
    if (!user || chattingWith) return;
    setChattingWith(friendId);
    try {
      const conv = await findOrCreateChat.mutateAsync({ currentUserId: user.id, otherUserId: friendId });
      navigate(`/chat/${conv.id}`);
    } catch (err) {
      console.error('Failed to start chat:', err);
    } finally {
      setChattingWith(null);
    }
  };

  if (isLoading) return <FullPageLoading />;

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-1 px-4 py-2">
        <button onClick={() => navigate('/friend-requests')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-stone-50">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light"><Bell className="h-5 w-5 text-brand" /></div>
          <span className="flex-1 text-sm font-medium text-stone-700">{t('contacts.friendRequests')}</span>
          {pendingCount > 0 && <Badge variant="destructive">{pendingCount}</Badge>}
        </button>
        <button onClick={() => navigate('/create-group')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-stone-50">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light"><Users className="h-5 w-5 text-brand" /></div>
          <span className="flex-1 text-sm font-medium text-stone-700">{t('contacts.createGroup')}</span>
        </button>
        <button onClick={() => navigate('/add-friend')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-stone-50">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light"><UserPlus className="h-5 w-5 text-brand" /></div>
          <span className="flex-1 text-sm font-medium text-stone-700">{t('contacts.addFriend')}</span>
        </button>
      </div>
      <div className="px-4 py-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-stone-400">{t('contacts.contactsCount', { count: friends?.length ?? 0 })}</h3>
      </div>
      <ScrollArea className="flex-1">
        {!friends || friends.length === 0 ? (
          <EmptyState icon={<Users className="h-16 w-16" />} title={t('contacts.noContacts')} description={t('contacts.noContactsDesc')} />
        ) : (
          <div className="divide-y divide-stone-50">
            {friends.map((friendship) => {
              const isChatting = chattingWith === friendship.friend_id;
              return (
                <div key={friendship.id} className="flex w-full items-center gap-3 px-4 py-3">
                  <button onClick={() => navigate(`/profile/${friendship.friend_id}`)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <UserAvatar src={friendship.friend?.avatar_url} name={friendship.friend?.display_name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-stone-900">{friendship.friend?.display_name || friendship.friend?.username}</p>
                      <p className="truncate text-xs text-stone-400">{friendship.friend?.bio || ''}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleStartChat(friendship.friend_id)}
                    disabled={!!chattingWith}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-brand disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isChatting ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
