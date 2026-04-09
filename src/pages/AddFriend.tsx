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

export default function AddFriend() {
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
    } catch {
      // handled by mutation
    }
  };

  const filteredResults = results?.filter((u) => u.id !== user?.id) || [];

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="添加好友" />
      <div className="px-4 py-2">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索用户名..." className="pl-9" autoFocus />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <LoadingSpinner className="mt-8" />
        ) : query.length < 2 ? (
          <EmptyState icon={<UserPlus className="h-16 w-16" />} title="搜索用户" description="输入用户名或昵称添加好友" />
        ) : filteredResults.length === 0 ? (
          <EmptyState icon={<SearchIcon className="h-16 w-16" />} title="未找到用户" />
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
                  <span className="text-xs text-stone-400">已发送</span>
                ) : (
                  <Button size="sm" onClick={() => handleSendRequest(u.id)}>添加</Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
