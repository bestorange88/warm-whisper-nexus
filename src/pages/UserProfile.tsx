import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useSendFriendRequest, useBlockUser } from '@/hooks/useContacts';
import { useFindOrCreateDirectChat } from '@/hooks/useConversations';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { MessageCircle, Flag, Ban } from 'lucide-react';
import { useState } from 'react';

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile(userId);
  const sendRequest = useSendFriendRequest();
  const blockUser = useBlockUser();
  const findOrCreateChat = useFindOrCreateDirectChat();
  const navigate = useNavigate();
  const [requestSent, setRequestSent] = useState(false);

  const handleAddFriend = async () => {
    if (!user || !userId) return;
    await sendRequest.mutateAsync({ sender_id: user.id, receiver_id: userId });
    setRequestSent(true);
  };

  const handleStartChat = async () => {
    if (!user || !userId) return;
    const conv = await findOrCreateChat.mutateAsync({
      currentUserId: user.id,
      otherUserId: userId,
    });
    navigate(`/chat/${conv.id}`);
  };

  const handleBlock = async () => {
    if (!user || !userId) return;
    if (confirm('确定要拉黑该用户吗？拉黑后将无法互相发送消息。')) {
      await blockUser.mutateAsync({ blocker_id: user.id, blocked_id: userId });
      navigate(-1);
    }
  };

  if (isLoading) return <FullPageLoading />;
  if (!profile) return <div className="p-4 text-center text-stone-400">用户不存在</div>;

  const isOwnProfile = user?.id === userId;

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="用户资料" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-6 py-8">
          <UserAvatar src={profile.avatar_url} name={profile.display_name || profile.username} size="xl" />
          <h2 className="mt-4 text-xl font-bold text-stone-900">{profile.display_name || profile.username}</h2>
          <p className="mt-1 text-sm text-stone-400">@{profile.username}</p>
          {profile.bio && <p className="mt-3 text-center text-sm text-stone-500">{profile.bio}</p>}
        </div>

        {!isOwnProfile && (
          <div className="space-y-3 px-4">
            <Button className="w-full gap-2" onClick={handleStartChat}>
              <MessageCircle className="h-4 w-4" />
              发送消息
            </Button>
            <Button variant="outline" className="w-full gap-2" onClick={handleAddFriend} disabled={requestSent}>
              {requestSent ? '已发送请求' : '添加好友'}
            </Button>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" size="sm" className="flex-1 gap-1 text-stone-500" onClick={() => navigate(`/report/user/${userId}`)}>
                <Flag className="h-4 w-4" /> 举报
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 gap-1 text-red-500" onClick={handleBlock}>
                <Ban className="h-4 w-4" /> 拉黑
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
