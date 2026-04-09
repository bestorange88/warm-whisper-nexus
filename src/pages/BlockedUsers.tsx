import { useAuth } from '@/hooks/useAuth';
import { useBlocks, useUnblockUser } from '@/hooks/useContacts';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { Ban } from 'lucide-react';

export default function BlockedUsers() {
  const { user } = useAuth();
  const { data: blocks, isLoading } = useBlocks(user?.id);
  const unblock = useUnblockUser();

  const handleUnblock = (blockedId: string) => {
    if (!user) return;
    if (confirm('确定要取消拉黑该用户吗？')) {
      unblock.mutate({ blocker_id: user.id, blocked_id: blockedId });
    }
  };

  if (isLoading) return <FullPageLoading />;

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="黑名单" />
      <div className="flex-1 overflow-y-auto">
        {!blocks || blocks.length === 0 ? (
          <EmptyState icon={<Ban className="h-16 w-16" />} title="黑名单为空" description="你没有拉黑任何用户" />
        ) : (
          <div className="divide-y divide-stone-50">
            {blocks.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                <UserAvatar src={b.blocked_user?.avatar_url} name={b.blocked_user?.display_name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">
                    {b.blocked_user?.display_name || b.blocked_user?.username}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleUnblock(b.blocked_id)}>
                  取消拉黑
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
