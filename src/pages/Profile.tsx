import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile(user?.id);
  const navigate = useNavigate();

  if (isLoading) return <FullPageLoading />;

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={t('profile.title')} rightAction={
        <button onClick={() => navigate('/profile/edit')} className="text-brand">
          <Edit2 className="h-5 w-5" />
        </button>
      } />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-6 py-8">
          <UserAvatar src={profile?.avatar_url} name={profile?.display_name || profile?.username} size="xl" />
          <h2 className="mt-4 text-xl font-bold text-stone-900">
            {profile?.display_name || profile?.username || t('profile.noNickname')}
          </h2>
          <p className="mt-1 text-sm text-stone-400">@{profile?.username}</p>
          {profile?.bio && <p className="mt-3 text-center text-sm text-stone-500">{profile.bio}</p>}
        </div>
        <div className="mx-4 space-y-3 rounded-xl bg-stone-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-500">{t('profile.email')}</span>
            <span className="text-sm text-stone-700">{profile?.email || user?.email || '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-500">{t('profile.phone')}</span>
            <span className="text-sm text-stone-700">{profile?.phone || t('profile.phoneNotSet')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-500">{t('profile.language')}</span>
            <span className="text-sm text-stone-700">{profile?.language === 'zh-CN' ? '中文' : 'English'}</span>
          </div>
        </div>
        <div className="p-4">
          <Button variant="outline" className="w-full" onClick={() => navigate('/profile/edit')}>
            {t('profile.editProfile')}
          </Button>
        </div>
      </div>
    </div>
  );
}
