import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en.json';
import zhHant from './zh-Hant.json';

const resources = {
  en: {
    translation: en,
  },
  'zh-Hant': {
    translation: zhHant,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;

export type Language = 'en' | 'zh-Hant';

export function setLanguage(lang: Language): void {
  i18n.changeLanguage(lang);
}

export function getCurrentLanguage(): Language {
  return (i18n.language as Language) || 'en';
}
