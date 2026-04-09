import { useAuth } from '@/hooks/useAuth';
import { useFriendRequests, useRespondFriendRequest } from '@/hooks/useContacts';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

export default function FriendRequests() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { data: requests, isLoading } = useFriendRequests(user?.id);
  const respond = useRespondFriendRequest();
  const dateLocale = i18n.language === 'zh-CN' ? zhCN : enUS;

  const handleRespond = (requestId: string, status: 'accepted' | 'rejected', senderId: string) => {
    if (!user) return;
    respond.mutate({ requestId, status, senderId, receiverId: user.id });
  };

  if (isLoading) return <FullPageLoading />;

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={t('contacts.friendRequests')} />
      <div className="flex-1 overflow-y-auto">
        {!requests || requests.length === 0 ? (
          <EmptyState icon={<UserPlus className="h-16 w-16" />} title={t('contacts.noFriendRequests')} />
        ) : (
          <div className="divide-y divide-stone-50">
            {requests.map((req) => (
              <div key={req.id} className="flex items-center gap-3 px-4 py-3">
                <UserAvatar src={req.sender?.avatar_url} name={req.sender?.display_name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">{req.sender?.display_name || req.sender?.username}</p>
                  {req.message && <p className="truncate text-xs text-stone-400">{req.message}</p>}
                  <p className="text-xs text-stone-300">{formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: dateLocale })}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleRespond(req.id, 'accepted', req.sender_id)}>{t('contacts.accept')}</Button>
                  <Button size="sm" variant="outline" onClick={() => handleRespond(req.id, 'rejected', req.sender_id)}>{t('contacts.reject')}</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
