import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Switch } from '@/components/ui/switch';
import { MessageSquare, Phone, Users, Volume2, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  ensureNotificationPermission,
  getNotificationPermission,
  notifyForeground,
} from '@/lib/notifications/feedback';
import { toast } from 'sonner';

interface SettingRowProps { label: string; description: string; checked: boolean; onCheckedChange: (v: boolean) => void; }
function SettingRow({ label, description, checked, onCheckedChange }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

interface SectionProps { icon: React.ReactNode; title: string; children: React.ReactNode; }
function Section({ icon, title, children }: SectionProps) {
  return (
    <div className="mt-2 border-t border-border">
      <div className="flex items-center gap-2 px-4 py-3">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

export default function NotificationSettings() {
  const { t } = useTranslation();
  const [msgEnabled, setMsgEnabled] = useState(true);
  const [msgSound, setMsgSound] = useState(true);
  const [msgPreview, setMsgPreview] = useState(true);
  const [callEnabled, setCallEnabled] = useState(true);
  const [callVibrate, setCallVibrate] = useState(true);
  const [friendReq, setFriendReq] = useState(true);
  const [groupInvite, setGroupInvite] = useState(true);
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    setBrowserPerm(getNotificationPermission());
  }, []);

  const handleEnableBrowser = async () => {
    const ok = await ensureNotificationPermission();
    setBrowserPerm(getNotificationPermission());
    if (ok) {
      // 立即弹一个示例通知，让用户确认成功
      notifyForeground({
        title: t('app.name', { defaultValue: 'Archimi Chat' }),
        body: t('notification.browserNotifTestBody', { defaultValue: 'Notifications are working!' }),
        tag: 'notif-test',
      });
      toast.success(t('notification.browserNotifEnabled', { defaultValue: 'Browser notifications enabled' }));
    } else if (Notification.permission === 'denied') {
      toast.error(t('notification.browserNotifBlocked', { defaultValue: 'Notifications are blocked. Enable them in your browser settings.' }));
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <PageHeader title={t('notification.title')} />
      <div className="flex-1 overflow-y-auto pb-8">
        <Section icon={<Bell className="h-4 w-4 text-primary" />} title={t('notification.systemNotification', { defaultValue: 'System notifications' })}>
          <div className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {t('notification.browserNotif', { defaultValue: 'Browser system notifications' })}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {browserPerm === 'unsupported'
                    ? t('notification.browserNotifUnsupported', { defaultValue: 'Your browser does not support system notifications.' })
                    : browserPerm === 'granted'
                      ? t('notification.browserNotifGranted', { defaultValue: 'Enabled — you will see system notifications when the app is in the background.' })
                      : browserPerm === 'denied'
                        ? t('notification.browserNotifDenied', { defaultValue: 'Blocked. Enable notifications for this site in your browser settings.' })
                        : t('notification.browserNotifPrompt', { defaultValue: 'Allow this app to show notifications even when minimized.' })}
                </p>
              </div>
              {browserPerm !== 'granted' && browserPerm !== 'unsupported' && (
                <Button size="sm" onClick={handleEnableBrowser} disabled={browserPerm === 'denied'}>
                  {t('notification.enable', { defaultValue: 'Enable' })}
                </Button>
              )}
            </div>
          </div>
        </Section>
        <Section icon={<MessageSquare className="h-4 w-4 text-primary" />} title={t('notification.newMessage')}>
          <SettingRow label={t('notification.newMessageNotification')} description={t('notification.newMessageDesc')} checked={msgEnabled} onCheckedChange={setMsgEnabled} />
          <SettingRow label={t('notification.notificationSound')} description={t('notification.notificationSoundDesc')} checked={msgSound} onCheckedChange={setMsgSound} />
          <SettingRow label={t('notification.messagePreview')} description={t('notification.messagePreviewDesc')} checked={msgPreview} onCheckedChange={setMsgPreview} />
        </Section>
        <Section icon={<Phone className="h-4 w-4 text-primary" />} title={t('notification.callNotification')}>
          <SettingRow label={t('notification.incomingCall')} description={t('notification.incomingCallDesc')} checked={callEnabled} onCheckedChange={setCallEnabled} />
          <SettingRow label={t('notification.callVibrate')} description={t('notification.callVibrateDesc')} checked={callVibrate} onCheckedChange={setCallVibrate} />
        </Section>
        <Section icon={<Users className="h-4 w-4 text-primary" />} title={t('notification.friendsAndGroups')}>
          <SettingRow label={t('notification.friendRequest')} description={t('notification.friendRequestDesc')} checked={friendReq} onCheckedChange={setFriendReq} />
          <SettingRow label={t('notification.groupInvite')} description={t('notification.groupInviteDesc')} checked={groupInvite} onCheckedChange={setGroupInvite} />
        </Section>
        <div className="mt-6 px-4">
          <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
            <Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{t('notification.inAppOnly')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
