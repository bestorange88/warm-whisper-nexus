import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useContacts';
import { useConversation } from '@/hooks/useConversations';
import { useLeaveGroup, useRemoveMember, useAddMembers, useRenameGroup } from '@/hooks/useGroupActions';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { Users, LogOut, Flag, Bell, BellOff, UserPlus, Pencil, X, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export default function GroupDetail() {
  const { t } = useTranslation();
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const { data: conversation, isLoading } = useConversation(conversationId);
  const { data: friends } = useFriends(user?.id);
  const navigate = useNavigate();

  const leaveGroup = useLeaveGroup();
  const removeMember = useRemoveMember();
  const addMembers = useAddMembers();
  const renameGroup = useRenameGroup();

  const [muted, setMuted] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());

  if (isLoading) return <FullPageLoading />;
  if (!conversation) return <div className="p-4 text-center text-stone-400">{t('group.notFound')}</div>;

  const isOwner = conversation.members?.some(
    (m) => m.user_id === user?.id && m.role === 'owner'
  );
  const memberIds = new Set(conversation.members?.map((m) => m.user_id) || []);
  const invitableFriends = friends?.filter((f) => !memberIds.has(f.friend_id)) || [];

  const handleLeave = async () => {
    if (!user || !conversationId) return;
    if (!confirm(t('group.leaveConfirm'))) return;
    try {
      await leaveGroup.mutateAsync({ conversationId, userId: user.id });
      toast.success(t('group.left'));
      navigate('/conversations');
    } catch {
      toast.error(t('group.leaveFailed'));
    }
  };

  const handleRemove = async (memberId: string, memberName?: string) => {
    if (!conversationId) return;
    if (!confirm(t('group.removeConfirm', { name: memberName || '' }))) return;
    try {
      await removeMember.mutateAsync({ conversationId, userId: memberId });
      toast.success(t('group.removed'));
    } catch {
      toast.error(t('group.removeFailed'));
    }
  };

  const handleInvite = async () => {
    if (!conversationId || selectedFriends.size === 0) return;
    try {
      await addMembers.mutateAsync({
        conversationId,
        userIds: Array.from(selectedFriends),
      });
      toast.success(t('group.invited', { count: selectedFriends.size }));
      setShowInvite(false);
      setSelectedFriends(new Set());
    } catch {
      toast.error(t('group.inviteFailed'));
    }
  };

  const handleRename = async () => {
    if (!conversationId || !newName.trim()) return;
    try {
      await renameGroup.mutateAsync({ conversationId, name: newName.trim() });
      toast.success(t('group.renamed'));
      setShowRename(false);
    } catch {
      toast.error(t('group.renameFailed'));
    }
  };

  const toggleFriend = (id: string) => {
    setSelectedFriends((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={t('group.detail')} />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-6 py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
            <Users className="h-8 w-8 text-brand" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <h2 className="text-lg font-bold text-stone-900">{conversation.name || t('chat.groupChat')}</h2>
            {isOwner && (
              <button
                onClick={() => { setNewName(conversation.name || ''); setShowRename(true); }}
                className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-stone-400">
            {t('group.membersCount', { count: conversation.members?.length || 0 })}
          </p>
        </div>

        <div className="mx-4 mb-4 rounded-xl bg-stone-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-700">{t('group.members')}</h3>
            <button
              onClick={() => { setSelectedFriends(new Set()); setShowInvite(true); }}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand hover:bg-orange-50"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {t('group.invite')}
            </button>
          </div>
          <div className="space-y-2">
            {conversation.members?.map((m) => {
              const name = m.profile?.display_name || m.profile?.username || t('calling.unknownUser');
              const isSelf = m.user_id === user?.id;
              return (
                <div key={m.user_id} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                  <button
                    onClick={() => !isSelf && navigate(`/profile/${m.user_id}`)}
                    className="flex items-center gap-3"
                    disabled={isSelf}
                  >
                    <UserAvatar src={m.profile?.avatar_url} name={name} size="sm" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-stone-700">{name}</span>
                      {m.role === 'owner' && (
                        <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                          {t('group.owner')}
                        </span>
                      )}
                      {isSelf && (
                        <span className="text-[10px] text-stone-400">({t('group.me')})</span>
                      )}
                    </div>
                  </button>
                  {isOwner && !isSelf && (
                    <button
                      onClick={() => handleRemove(m.user_id, name)}
                      className="ml-auto rounded-full p-1 text-stone-300 hover:bg-red-50 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mx-4 space-y-2 pb-8">
          <button
            onClick={() => setMuted(!muted)}
            className="flex w-full items-center gap-3 rounded-lg border border-stone-200 px-4 py-3 text-left hover:bg-stone-50"
          >
            {muted ? <BellOff className="h-5 w-5 text-stone-400" /> : <Bell className="h-5 w-5 text-brand" />}
            <span className="text-sm font-medium text-stone-700">{muted ? t('group.unmute') : t('group.mute')}</span>
          </button>

          <button
            onClick={() => navigate(`/report/user/${conversationId}`)}
            className="flex w-full items-center gap-3 rounded-lg border border-stone-200 px-4 py-3 text-left hover:bg-stone-50"
          >
            <Flag className="h-5 w-5 text-stone-400" />
            <span className="text-sm font-medium text-stone-700">{t('group.reportGroup')}</span>
          </button>

          <Button
            variant="destructive"
            className="mt-4 w-full gap-2"
            onClick={handleLeave}
            disabled={leaveGroup.isPending}
          >
            <LogOut className="h-4 w-4" />
            {leaveGroup.isPending ? t('group.leaving') : t('group.leaveGroup')}
          </Button>
        </div>
      </div>

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-h-[80vh] max-w-sm overflow-hidden">
          <DialogHeader>
            <DialogTitle>{t('group.inviteFriends')}</DialogTitle>
          </DialogHeader>
          {invitableFriends.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-400">{t('group.noInvitable')}</p>
          ) : (
            <>
              <div className="max-h-60 overflow-y-auto">
                {invitableFriends.map((f) => (
                  <button
                    key={f.friend_id}
                    onClick={() => toggleFriend(f.friend_id)}
                    className="flex w-full items-center gap-3 px-2 py-2.5 text-left hover:bg-stone-50"
                  >
                    <div className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border-2',
                      selectedFriends.has(f.friend_id) ? 'border-brand bg-brand' : 'border-stone-300'
                    )}>
                      {selectedFriends.has(f.friend_id) && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <UserAvatar src={f.friend?.avatar_url} name={f.friend?.display_name} size="sm" />
                    <span className="text-sm font-medium text-stone-700">
                      {f.friend?.display_name || f.friend?.username}
                    </span>
                  </button>
                ))}
              </div>
              <Button
                onClick={handleInvite}
                disabled={selectedFriends.size === 0 || addMembers.isPending}
                className="w-full"
              >
                {addMembers.isPending ? t('common.submitting') : `${t('group.invite')} (${selectedFriends.size})`}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showRename} onOpenChange={setShowRename}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('group.rename')}</DialogTitle>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('group.renamePlaceholder')}
            maxLength={30}
          />
          <Button
            onClick={handleRename}
            disabled={!newName.trim() || renameGroup.isPending}
            className="w-full"
          >
            {renameGroup.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
