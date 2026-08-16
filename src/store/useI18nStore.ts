import { create } from 'zustand';
import { DICTIONARY, SupportedLocale, TranslationKey } from '../model/i18n.types';

interface I18nStoreState {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

/**
 * Определение языка по умолчанию:
 * 1. URL-параметр ?lang=en или ?lang=ru
 * 2. localStorage ('ricis_language')
 * 3. navigator.languages / navigator.language (заголовки браузера)
 */
export function detectInitialLocale(): SupportedLocale {
  try {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get('lang');
      if (urlLang === 'en' || urlLang === 'ru') {
        return urlLang;
      }

      const savedLang = localStorage.getItem('ricis_language');
      if (savedLang === 'en' || savedLang === 'ru') {
        return savedLang;
      }

      const browserLangs = navigator.languages || [navigator.language || ''];
      for (const lang of browserLangs) {
        if (lang.toLowerCase().startsWith('ru') || lang.toLowerCase().startsWith('be') || lang.toLowerCase().startsWith('uk') || lang.toLowerCase().startsWith('kk')) {
          return 'ru';
        }
      }
    }
  } catch (e) {
    console.warn('Failed to detect initial locale, fallback to en/ru:', e);
  }

  // Для международных браузеров - en
  return 'ru';
}

export const useI18nStore = create<I18nStoreState>((set, get) => ({
  locale: detectInitialLocale(),

  setLocale: (locale: SupportedLocale) => {
    try {
      localStorage.setItem('ricis_language', locale);
      const url = new URL(window.location.href);
      url.searchParams.set('lang', locale);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      console.warn('Failed to persist locale:', e);
    }
    set({ locale });
  },

  t: (key: TranslationKey, params?: Record<string, string | number>): string => {
    const { locale } = get();
    const entry = DICTIONARY[key];
    if (!entry) return key;

    let text: string = entry[locale] || entry['en'] || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
      });
    }

    return text;
  }
}));
