import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en.json';
import frTranslation from './locales/fr.json';
import deTranslation from './locales/de.json';
import esTranslation from './locales/es.json';

const resources = {
  en: { translation: enTranslation },
  fr: { translation: frTranslation },
  de: { translation: deTranslation },
  es: { translation: esTranslation },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;

// Helper to get supported languages
export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
];

// Helper for date locale mapping
export const dateLocaleMap: Record<string, any> = {
  en: () => import('date-fns/locale/en-US'),
  fr: () => import('date-fns/locale/fr'),
  de: () => import('date-fns/locale/de'),
  es: () => import('date-fns/locale/es'),
};