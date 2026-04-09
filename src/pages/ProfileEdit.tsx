import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ProfileEdit() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile(user?.id);
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) { setDisplayName(profile.display_name || ''); setBio(profile.bio || ''); setPhone(profile.phone || ''); }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile.mutateAsync({ id: user.id, display_name: displayName, bio, phone });
      navigate(-1);
    } catch {} finally { setSaving(false); }
  };

  if (isLoading) return <FullPageLoading />;

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={t('profile.editProfile')} rightAction={
        <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? t('common.saving') : t('common.save')}</Button>
      } />
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <UserAvatar src={profile?.avatar_url} name={displayName || profile?.username} size="xl" />
            <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white shadow-lg">
              <Camera className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">{t('profile.nickname')}</label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t('profile.nicknamePlaceholder')} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">{t('profile.bio')}</label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t('profile.bioPlaceholder')} rows={3} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">{t('profile.phone')}</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('profile.phonePlaceholder')} type="tel" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">{t('profile.usernameLabel')}</label>
            <Input value={profile?.username || ''} disabled className="bg-stone-100 text-stone-400" />
            <p className="mt-1 text-xs text-stone-400">{t('profile.usernameReadonly')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
