import { create } from 'zustand';
import { DICTIONARY, resolveDictionaryText, SupportedLocale, TranslationKey } from '../model/i18n.types';

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
const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['ru', 'en', 'en-US', 'fr-CA', 'de-DE', 'hi-IN', 'ms-MY'];

function parseSupportedLocale(value: string | null): SupportedLocale | undefined {
  if (!value) return undefined;
  return SUPPORTED_LOCALES.includes(value as SupportedLocale) ? value as SupportedLocale : undefined;
}

export function detectInitialLocale(): SupportedLocale {
  try {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLocale = parseSupportedLocale(urlParams.get('lang'));
      if (urlLocale) return urlLocale;

      const savedLocale = parseSupportedLocale(localStorage.getItem('ricis_language'));
      if (savedLocale) return savedLocale;

      const browserLangs = navigator.languages || [navigator.language || ''];
      for (const lang of browserLangs) {
        const exactLocale = parseSupportedLocale(lang);
        if (exactLocale) return exactLocale;
        const normalized = lang.toLowerCase();
        if (normalized.startsWith('ru') || normalized.startsWith('be') || normalized.startsWith('uk') || normalized.startsWith('kk')) return 'ru';
        if (normalized.startsWith('fr-ca')) return 'fr-CA';
        if (normalized.startsWith('de')) return 'de-DE';
        if (normalized.startsWith('hi')) return 'hi-IN';
        if (normalized.startsWith('ms')) return 'ms-MY';
        if (normalized.startsWith('en')) return 'en-US';
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

    let text: string = resolveDictionaryText(entry, locale) || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
      });
    }

    return text;
  }
}));
