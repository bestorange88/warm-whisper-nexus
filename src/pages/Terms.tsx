import { PageHeader } from '@/components/layout/PageHeader';
import { APP_NAME_ZH, APP_NAME_EN, SUPPORT_EMAIL } from '@/lib/constants';
import { useTranslation } from 'react-i18next';

export default function Terms() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={t('terms.title')} />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="prose prose-sm prose-stone max-w-none">
          <p className="text-xs text-stone-400">{t('terms.lastUpdated', { date: '2025-01-01' })}</p>

          <h2 className="text-base font-semibold">{t('terms.s1Title')}</h2>
          <p>{t('terms.s1Body', { appNameZh: APP_NAME_ZH, appNameEn: APP_NAME_EN })}</p>

          <h2 className="text-base font-semibold">{t('terms.s2Title')}</h2>
          <p>{t('terms.s2Body')}</p>

          <h2 className="text-base font-semibold">{t('terms.s3Title')}</h2>
          <p>{t('terms.s3Body')}</p>
          <ul className="list-disc pl-4 text-sm">
            <li>{t('terms.s3i1')}</li>
            <li>{t('terms.s3i2')}</li>
            <li>{t('terms.s3i3')}</li>
            <li>{t('terms.s3i4')}</li>
            <li>{t('terms.s3i5')}</li>
          </ul>

          <h2 className="text-base font-semibold">{t('terms.s4Title')}</h2>
          <p>{t('terms.s4Body')}</p>

          <h2 className="text-base font-semibold">{t('terms.s5Title')}</h2>
          <p>{t('terms.s5Body')}</p>

          <h2 className="text-base font-semibold">{t('terms.s6Title')}</h2>
          <p>{t('terms.s6Body')}</p>

          <h2 className="text-base font-semibold">{t('terms.s7Title')}</h2>
          <p>{t('terms.s7Body')}</p>

          <h2 className="text-base font-semibold">{t('terms.s8Title')}</h2>
          <p>{t('terms.s8Body')}</p>

          <h2 className="text-base font-semibold">{t('terms.s9Title')}</h2>
          <p>{t('terms.s9Body', { email: SUPPORT_EMAIL })}</p>
        </div>
      </div>
    </div>
  );
}
