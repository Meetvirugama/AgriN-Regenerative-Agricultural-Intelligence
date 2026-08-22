import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationHI from './locales/hi/translation.json';
import translationGU from './locales/gu/translation.json';

const resources = {
  'en-US': { translation: translationEN },
  'hi-IN': { translation: translationHI },
  'gu-IN': { translation: translationGU }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en-US',
    debug: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'agri_lang',
      caches: ['localStorage']
    }
  });

export default i18n;
