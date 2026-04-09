import { useState } from 'react';
import { Search as SearchIcon, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSearchUsers, useSendFriendRequest } from '@/hooks/useContacts';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export default function AddFriend() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { data: results, isLoading } = useSearchUsers(query);
  const sendRequest = useSendFriendRequest();

  const handleSendRequest = async (receiverId: string) => {
    if (!user) return;
    try {
      await sendRequest.mutateAsync({ sender_id: user.id, receiver_id: receiverId });
      setSentIds((prev) => new Set(prev).add(receiverId));
      toast.success(t('contacts.requestSent'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'already_friends') toast.error(t('contacts.alreadyFriends'));
      else if (message === 'request_already_sent') toast.error(t('contacts.requestSentAlready'));
      else if (message === 'request_received_pending') toast.error(t('contacts.requestReceivedPending'));
      else toast.error(t('contacts.sendRequestFailed'));
    }
  };

  const filteredResults = results?.filter((u) => u.id !== user?.id) || [];

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={t('contacts.addFriend')} />
      <div className="px-4 py-2">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('contacts.searchPlaceholder')} className="pl-9" autoFocus />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <LoadingSpinner className="mt-8" />
        ) : query.length < 2 ? (
          <EmptyState icon={<UserPlus className="h-16 w-16" />} title={t('contacts.searchUsers')} description={t('contacts.searchUsersDesc')} />
        ) : filteredResults.length === 0 ? (
          <EmptyState icon={<SearchIcon className="h-16 w-16" />} title={t('contacts.noResults')} />
        ) : (
          <div className="divide-y divide-stone-50">
            {filteredResults.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                <UserAvatar src={u.avatar_url} name={u.display_name || u.username} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">{u.display_name || u.username}</p>
                  <p className="truncate text-xs text-stone-400">@{u.username}</p>
                </div>
                {sentIds.has(u.id) ? (
                  <span className="text-xs text-stone-400">{t('contacts.requestSent')}</span>
                ) : (
                  <Button size="sm" onClick={() => handleSendRequest(u.id)}>{t('contacts.add')}</Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
