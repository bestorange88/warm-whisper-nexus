import { PageHeader } from '@/components/layout/PageHeader';
import { APP_NAME_ZH, APP_NAME_EN, APP_VERSION, SUPPORT_EMAIL } from '@/lib/constants';
import logoImage from '@/assets/logo.png';
import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={t('about.title')} />
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="flex flex-col items-center">
          <img src={logoImage} alt={APP_NAME_ZH} className="h-20 w-20 rounded-2xl shadow-lg" />
          <h1 className="mt-4 text-xl font-bold text-stone-900">{APP_NAME_ZH}</h1>
          <p className="text-sm text-stone-400">{APP_NAME_EN}</p>
          <p className="mt-1 text-xs text-stone-300">{t('app.version', { version: APP_VERSION })}</p>
        </div>

        <div className="mt-8 space-y-4 text-center">
          <p className="text-sm text-stone-600">
            {t('about.description', { appName: APP_NAME_ZH })}
          </p>

          <div className="rounded-xl bg-stone-50 p-4">
            <h3 className="text-sm font-semibold text-stone-700">{t('about.coreFeatures')}</h3>
            <ul className="mt-2 space-y-1 text-sm text-stone-500">
              <li>{t('about.featureMessaging')}</li>
              <li>{t('about.featureChats')}</li>
              <li>{t('about.featureCalls')}</li>
              <li>{t('about.featureMedia')}</li>
              <li>{t('about.featurePrivacy')}</li>
            </ul>
          </div>

          <div className="rounded-xl bg-stone-50 p-4">
            <h3 className="text-sm font-semibold text-stone-700">{t('about.contactUs')}</h3>
            <p className="mt-2 text-sm text-stone-500">{SUPPORT_EMAIL}</p>
          </div>

          <p className="text-xs text-stone-300">
            © {new Date().getFullYear()} {APP_NAME_EN}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
