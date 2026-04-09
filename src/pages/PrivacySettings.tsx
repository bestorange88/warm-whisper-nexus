import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from 'react-i18next';

export default function PrivacySettings() {
  const { t } = useTranslation();
  const [onlineVisible, setOnlineVisible] = useState(true);
  const [lastSeenVisible, setLastSeenVisible] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={t('privacy.title')} />
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-stone-100">
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-medium text-stone-700">{t('privacy.onlineStatus')}</p>
              <p className="text-xs text-stone-400">{t('privacy.onlineStatusDesc')}</p>
            </div>
            <Switch checked={onlineVisible} onCheckedChange={setOnlineVisible} />
          </div>
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-medium text-stone-700">{t('privacy.lastSeen')}</p>
              <p className="text-xs text-stone-400">{t('privacy.lastSeenDesc')}</p>
            </div>
            <Switch checked={lastSeenVisible} onCheckedChange={setLastSeenVisible} />
          </div>
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-medium text-stone-700">{t('privacy.readReceipts')}</p>
              <p className="text-xs text-stone-400">{t('privacy.readReceiptsDesc')}</p>
            </div>
            <Switch checked={readReceipts} onCheckedChange={setReadReceipts} />
          </div>
        </div>
      </div>
    </div>
  );
}
