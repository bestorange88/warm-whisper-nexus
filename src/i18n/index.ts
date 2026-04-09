import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import zhCN from './locales/zh-CN.json';
import en from './locales/en.json';

const resources = {
  'zh-CN': { translation: zhCN },
  en: { translation: en },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh-CN',
    supportedLngs: ['zh-CN', 'en'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // Priority: localStorage → navigator → fallback
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18n_language',
      caches: ['localStorage'],
      // Map any zh* to zh-CN
      convertDetectedLanguage: (lng: string) => {
        if (lng.startsWith('zh')) return 'zh-CN';
        if (lng.startsWith('en')) return 'en';
        return lng;
      },
    },
  });

export default i18n;

/**
 * Change language and persist.
 * Optionally syncs to user profile in the database.
 */
export async function changeLanguage(lng: 'zh-CN' | 'en', userId?: string) {
  await i18n.changeLanguage(lng);
  localStorage.setItem('i18n_language', lng);

  if (userId) {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase
        .from('profiles')
        .update({ language: lng })
        .eq('id', userId);
    } catch (err) {
      console.warn('Failed to sync language to profile:', err);
    }
  }
}

/**
 * Initialize language from user profile (call after login).
 */
export async function syncLanguageFromProfile(language?: string | null) {
  if (language && ['zh-CN', 'en'].includes(language)) {
    await i18n.changeLanguage(language);
    localStorage.setItem('i18n_language', language);
  }
}
