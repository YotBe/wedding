import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import he from './he.json';
import en from './en.json';

export const SUPPORTED_LANGS = ['he', 'en'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];
export const DEFAULT_LANG: Lang = 'he';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      he: { translation: he },
      en: { translation: en },
    },
    fallbackLng: DEFAULT_LANG,
    supportedLngs: [...SUPPORTED_LANGS],
    load: 'languageOnly',
    detection: {
      // No 'navigator': first-time visitors always see Hebrew (the default),
      // returning visitors get whatever they last picked.
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'lang',
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
