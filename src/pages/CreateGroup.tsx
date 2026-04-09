import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useContacts';
import { useCreateConversation } from '@/hooks/useConversations';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export default function CreateGroup() {
  const { user } = useAuth();
  const { data: friends, isLoading } = useFriends(user?.id);
  const createConversation = useCreateConversation();
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  const toggleMember = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!user || !groupName.trim() || selected.size === 0) return;
    setCreating(true);
    try {
      const conv = await createConversation.mutateAsync({
        type: 'group',
        name: groupName.trim(),
        memberIds: [user.id, ...Array.from(selected)],
        createdBy: user.id,
      });
      navigate(`/chat/${conv.id}`);
    } catch {
      // handled by mutation
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) return <FullPageLoading />;

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="创建群聊" rightAction={
        <Button size="sm" onClick={handleCreate} disabled={creating || !groupName.trim() || selected.size === 0}>
          {creating ? '创建中...' : '创建'}
        </Button>
      } />
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3">
          <label className="mb-1.5 block text-sm font-medium text-stone-700">群名称</label>
          <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="输入群名称" />
        </div>
        <div className="px-4 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
            选择成员 ({selected.size})
          </p>
        </div>
        <div className="divide-y divide-stone-50">
          {friends?.map((f) => (
            <button
              key={f.id}
              onClick={() => toggleMember(f.friend_id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-50"
            >
              <div className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border-2",
                selected.has(f.friend_id) ? "border-brand bg-brand" : "border-stone-300"
              )}>
                {selected.has(f.friend_id) && <Check className="h-3 w-3 text-white" />}
              </div>
              <UserAvatar src={f.friend?.avatar_url} name={f.friend?.display_name} />
              <span className="text-sm font-medium text-stone-700">
                {f.friend?.display_name || f.friend?.username}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
