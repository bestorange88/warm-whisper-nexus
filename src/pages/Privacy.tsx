import { PageHeader } from '@/components/layout/PageHeader';
import { APP_NAME_ZH, APP_NAME_EN, SUPPORT_EMAIL } from '@/lib/constants';
import { useTranslation } from 'react-i18next';

export default function Privacy() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={t('privacyPage.title')} />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="prose prose-sm prose-stone max-w-none">
          <p className="text-xs text-stone-400">{t('privacyPage.lastUpdated', { date: '2026-04-11' })}</p>

          <h2 className="text-base font-semibold">{t('privacyPage.s1Title')}</h2>
          <p>{t('privacyPage.s1Body', { appNameZh: APP_NAME_ZH, appNameEn: APP_NAME_EN })}</p>
          <ul className="list-disc pl-4 text-sm">
            <li>{t('privacyPage.s1i1')}</li>
            <li>{t('privacyPage.s1i2')}</li>
            <li>{t('privacyPage.s1i3')}</li>
            <li>{t('privacyPage.s1i4')}</li>
          </ul>

          <h2 className="text-base font-semibold">{t('privacyPage.s2Title')}</h2>
          <p>{t('privacyPage.s2Body')}</p>
          <ul className="list-disc pl-4 text-sm">
            <li>{t('privacyPage.s2i1')}</li>
            <li>{t('privacyPage.s2i2')}</li>
            <li>{t('privacyPage.s2i3')}</li>
            <li>{t('privacyPage.s2i4')}</li>
          </ul>

          <h2 className="text-base font-semibold">{t('privacyPage.s3Title')}</h2>
          <p>{t('privacyPage.s3Body')}</p>

          <h2 className="text-base font-semibold">{t('privacyPage.s4Title')}</h2>
          <p>{t('privacyPage.s4Body')}</p>
          <ul className="list-disc pl-4 text-sm">
            <li>{t('privacyPage.s4i1')}</li>
            <li>{t('privacyPage.s4i2')}</li>
            <li>{t('privacyPage.s4i3')}</li>
          </ul>

          <h2 className="text-base font-semibold">{t('privacyPage.s5Title')}</h2>
          <p>{t('privacyPage.s5Body')}</p>
          <ul className="list-disc pl-4 text-sm">
            <li>{t('privacyPage.s5i1')}</li>
            <li>{t('privacyPage.s5i2')}</li>
            <li>{t('privacyPage.s5i3')}</li>
            <li>{t('privacyPage.s5i4')}</li>
          </ul>

          <h2 className="text-base font-semibold">{t('privacyPage.s6Title')}</h2>
          <p>{t('privacyPage.s6Body')}</p>

          <h2 className="text-base font-semibold">{t('privacyPage.s7Title')}</h2>
          <p>{t('privacyPage.s7Body')}</p>

          <h2 className="text-base font-semibold">{t('privacyPage.s8Title')}</h2>
          <p>{t('privacyPage.s8Body')}</p>

          <h2 className="text-base font-semibold">{t('privacyPage.s9Title')}</h2>
          <p>{t('privacyPage.s9Body', { email: SUPPORT_EMAIL })}</p>
        </div>
      </div>
    </div>
  );
}
