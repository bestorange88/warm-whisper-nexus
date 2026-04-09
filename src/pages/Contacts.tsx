import { useNavigate } from 'react-router-dom';
import { UserPlus, Users, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFriends, useFriendRequests } from '@/hooks/useContacts';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { EmptyState } from '@/components/common/EmptyState';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export default function Contacts() {
  const { user } = useAuth();
  const { data: friends, isLoading } = useFriends(user?.id);
  const { data: requests } = useFriendRequests(user?.id);
  const navigate = useNavigate();

  if (isLoading) return <FullPageLoading />;

  const pendingCount = requests?.length ?? 0;

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-1 px-4 py-2">
        <button
          onClick={() => navigate('/contacts/requests')}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-stone-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light">
            <Bell className="h-5 w-5 text-brand" />
          </div>
          <span className="flex-1 text-sm font-medium text-stone-700">好友请求</span>
          {pendingCount > 0 && <Badge variant="destructive">{pendingCount}</Badge>}
        </button>
        <button
          onClick={() => navigate('/groups/create')}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-stone-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light">
            <Users className="h-5 w-5 text-brand" />
          </div>
          <span className="flex-1 text-sm font-medium text-stone-700">创建群聊</span>
        </button>
        <button
          onClick={() => navigate('/contacts/add')}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-stone-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light">
            <UserPlus className="h-5 w-5 text-brand" />
          </div>
          <span className="flex-1 text-sm font-medium text-stone-700">添加好友</span>
        </button>
      </div>

      <div className="px-4 py-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-stone-400">
          联系人 ({friends?.length ?? 0})
        </h3>
      </div>

      <ScrollArea className="flex-1">
        {!friends || friends.length === 0 ? (
          <EmptyState
            icon={<Users className="h-16 w-16" />}
            title="暂无联系人"
            description="添加好友开始聊天"
          />
        ) : (
          <div className="divide-y divide-stone-50">
            {friends.map((friendship) => (
              <button
                key={friendship.id}
                onClick={() => navigate(`/profile/${friendship.friend_id}`)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-50"
              >
                <UserAvatar
                  src={friendship.friend?.avatar_url}
                  name={friendship.friend?.display_name}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">
                    {friendship.friend?.display_name || friendship.friend?.username}
                  </p>
                  <p className="truncate text-xs text-stone-400">{friendship.friend?.bio || ''}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
