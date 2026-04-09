import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useConversation } from '@/hooks/useConversations';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { Users, LogOut, Flag, Bell, BellOff } from 'lucide-react';
import { useState } from 'react';

export default function GroupDetail() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const { data: conversation, isLoading } = useConversation(conversationId);
  const navigate = useNavigate();
  const [muted, setMuted] = useState(false);

  if (isLoading) return <FullPageLoading />;
  if (!conversation) return <div className="p-4 text-center text-stone-400">群组不存在</div>;

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="群聊详情" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-6 py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-light">
            <Users className="h-8 w-8 text-brand" />
          </div>
          <h2 className="mt-3 text-lg font-bold text-stone-900">{conversation.name || '群聊'}</h2>
          <p className="text-sm text-stone-400">
            {conversation.members?.length || 0} 位成员
          </p>
        </div>

        <div className="mx-4 mb-4 rounded-xl bg-stone-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-stone-700">群成员</h3>
          <div className="flex flex-wrap gap-3">
            {conversation.members?.map((m) => (
              <button
                key={m.user_id}
                onClick={() => m.user_id !== user?.id && navigate(`/profile/${m.user_id}`)}
                className="flex flex-col items-center gap-1"
              >
                <UserAvatar src={m.profile?.avatar_url} name={m.profile?.display_name} size="sm" />
                <span className="max-w-[56px] truncate text-xs text-stone-500">
                  {m.profile?.display_name || m.profile?.username}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mx-4 space-y-2">
          <button
            onClick={() => setMuted(!muted)}
            className="flex w-full items-center gap-3 rounded-lg border border-stone-200 px-4 py-3 text-left hover:bg-stone-50"
          >
            {muted ? <BellOff className="h-5 w-5 text-stone-400" /> : <Bell className="h-5 w-5 text-brand" />}
            <span className="text-sm font-medium text-stone-700">{muted ? '取消免打扰' : '消息免打扰'}</span>
          </button>

          <button
            onClick={() => navigate(`/report/user/${conversationId}`)}
            className="flex w-full items-center gap-3 rounded-lg border border-stone-200 px-4 py-3 text-left hover:bg-stone-50"
          >
            <Flag className="h-5 w-5 text-stone-400" />
            <span className="text-sm font-medium text-stone-700">举报群聊</span>
          </button>

          <Button variant="destructive" className="mt-4 w-full gap-2">
            <LogOut className="h-4 w-4" />
            退出群聊
          </Button>
        </div>
      </div>
    </div>
  );
}
