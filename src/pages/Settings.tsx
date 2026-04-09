import { useNavigate } from 'react-router-dom';
import { User, Shield, Bell, Ban, HelpCircle, FileText, Lock, Info, Trash2, LogOut, Globe } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

function SettingItem({ icon, label, onClick, destructive }: SettingItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50 ${destructive ? 'text-red-500' : 'text-stone-700'}`}
    >
      {icon}
      <span className="flex-1 text-sm font-medium">{label}</span>
      <span className="text-stone-300">›</span>
    </button>
  );
}

const LANGUAGES = [
  { code: 'zh-CN' as const, label: '简体中文' },
  { code: 'en' as const, label: 'English' },
];

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showLang, setShowLang] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleLanguageChange = async (lng: 'zh-CN' | 'en') => {
    await changeLanguage(lng, user?.id);
    setShowLang(false);
    toast.success(t('settings.languageChanged'));
  };

  return (
    <ScrollArea className="h-full">
      <div className="pb-8">
        <button
          onClick={() => navigate('/profile')}
          className="flex w-full items-center gap-3 px-4 py-4 hover:bg-stone-50"
        >
          <UserAvatar
            src={user?.user_metadata?.avatar_url}
            name={user?.user_metadata?.display_name || user?.email}
            size="lg"
          />
          <div className="min-w-0 flex-1 text-left">
            <p className="text-base font-semibold text-stone-900">
              {user?.user_metadata?.display_name || user?.user_metadata?.username || t('profile.noNickname')}
            </p>
            <p className="text-sm text-stone-400">{user?.email}</p>
          </div>
          <span className="text-stone-300">›</span>
        </button>

        <div className="mt-2 border-t border-stone-100">
          <div className="px-4 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">{t('settings.accountSecurity')}</p>
          </div>
          <SettingItem icon={<User className="h-5 w-5 text-brand" />} label={t('settings.personalInfo')} onClick={() => navigate('/profile/edit')} />
          <SettingItem icon={<Shield className="h-5 w-5 text-brand" />} label={t('settings.privacy')} onClick={() => navigate('/settings/privacy')} />
          <SettingItem icon={<Bell className="h-5 w-5 text-brand" />} label={t('settings.notifications')} onClick={() => navigate('/settings/notifications')} />
          <SettingItem icon={<Globe className="h-5 w-5 text-brand" />} label={t('settings.language')} onClick={() => setShowLang(true)} />
          <SettingItem icon={<Ban className="h-5 w-5 text-brand" />} label={t('settings.blocklist')} onClick={() => navigate('/settings/blocked')} />
        </div>

        <div className="mt-2 border-t border-stone-100">
          <div className="px-4 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">{t('settings.helpSupport')}</p>
          </div>
          <SettingItem icon={<HelpCircle className="h-5 w-5 text-brand" />} label={t('settings.helpCenter')} onClick={() => navigate('/settings/help')} />
          <SettingItem icon={<FileText className="h-5 w-5 text-brand" />} label={t('settings.termsOfService')} onClick={() => navigate('/terms')} />
          <SettingItem icon={<Lock className="h-5 w-5 text-brand" />} label={t('settings.privacyPolicy')} onClick={() => navigate('/privacy')} />
          <SettingItem icon={<Info className="h-5 w-5 text-brand" />} label={t('settings.aboutUs')} onClick={() => navigate('/settings/about')} />
        </div>

        <div className="mt-2 border-t border-stone-100">
          <div className="px-4 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">{t('settings.accountManagement')}</p>
          </div>
          <SettingItem icon={<Trash2 className="h-5 w-5 text-red-400" />} label={t('settings.deleteAccount')} onClick={() => navigate('/settings/delete-account')} destructive />
          <SettingItem icon={<LogOut className="h-5 w-5 text-red-400" />} label={t('settings.logout')} onClick={handleLogout} destructive />
        </div>
      </div>

      <Dialog open={showLang} onOpenChange={setShowLang}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>{t('settings.language')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                  i18n.language === lang.code ? 'bg-brand-light text-brand' : 'text-stone-700 hover:bg-stone-50'
                )}
              >
                {lang.label}
                {i18n.language === lang.code && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}
