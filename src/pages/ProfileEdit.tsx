import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { Camera, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setPhone(profile.phone || '');
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = '';

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('profile.avatarTooLarge'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.avatarInvalidType'));
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/avatar_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('chat-media').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = await supabase.storage.from('chat-media').createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (!urlData?.signedUrl) throw new Error('Failed to generate URL');
      setAvatarUrl(urlData.signedUrl);
      toast.success(t('profile.avatarUploaded'));
    } catch (err) {
      console.error('Avatar upload failed:', err);
      toast.error(t('profile.avatarUploadFailed'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        id: user.id,
        display_name: displayName,
        bio,
        phone,
        avatar_url: avatarUrl || undefined,
      });
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
            <UserAvatar src={avatarUrl} name={displayName || profile?.username} size="xl" />
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white shadow-lg disabled:opacity-50"
            >
              {uploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <p className="mb-4 text-center text-xs text-stone-400">{t('profile.tapToChangeAvatar')}</p>
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
