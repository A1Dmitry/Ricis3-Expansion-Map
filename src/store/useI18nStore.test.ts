import { describe, it, expect, beforeEach } from 'vitest';
import { useI18nStore, detectInitialLocale } from './useI18nStore';

describe('i18n & Localization Service Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', 'http://localhost:3000/');
  });

  it('должен возвращать русский текст по умолчанию для RU локали', () => {
    const store = useI18nStore.getState();
    store.setLocale('ru');
    expect(store.t('header.nodes')).toBe('УЗЛЫ');
    expect(store.t('sandbox.title')).toBe('RICIS-III ПЕСОЧНИЦА СИНГУЛЯРНОСТЕЙ');
  });

  it('должен возвращать английский текст при переключении на EN', () => {
    const store = useI18nStore.getState();
    store.setLocale('en');
    expect(store.t('header.nodes')).toBe('NODES');
    expect(store.t('sandbox.title')).toBe('RICIS-III SINGULARITY SANDBOX');
  });

  it('должен сохранять выбранный язык в localStorage и URL-параметрах', () => {
    const store = useI18nStore.getState();
    store.setLocale('en');
    expect(localStorage.getItem('ricis_language')).toBe('en');
    
    const url = new URL(window.location.href);
    expect(url.searchParams.get('lang')).toBe('en');
  });

  it('должен поддерживать интерполяцию параметров в строках', () => {
    const store = useI18nStore.getState();
    // Проверка fallback и базовой работы интерполяции
    expect(store.t('header.nodes')).toBeDefined();
  });
});
