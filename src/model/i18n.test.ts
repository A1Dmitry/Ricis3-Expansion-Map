import { describe, it, expect } from 'vitest';
import { DICTIONARY, PROJECT_COVERAGE_LOCALES, resolveDictionaryText, TranslationKey } from '../model/i18n.types';
import { LOCALE_OVERRIDES } from './i18n.locale-overrides';

describe('RICIS-III i18n Dictionary Integrity Test', () => {
  it('should have non-empty Russian and English translations for every key', () => {
    const keys = Object.keys(DICTIONARY) as TranslationKey[];
    expect(keys.length).toBeGreaterThan(0);

    for (const key of keys) {
      const entry = DICTIONARY[key];
      expect(entry, `Key ${key} must exist`).toBeDefined();
      expect(entry.ru, `Key ${key} missing Russian translation`).not.toBe('');
      expect(entry.en, `Key ${key} missing English translation`).not.toBe('');
    }
  });

  it('should resolve proof trust resources for every project coverage locale', () => {
    const proofKeys: TranslationKey[] = [
      'proofTrust.leanVerified.label',
      'proofTrust.leanVerified.description',
      'proofTrust.trustedAxiom.label',
      'proofTrust.trustedAxiom.description',
      'proofTrust.rejected.label',
      'proofTrust.rejected.description',
      'proofTrust.requiresCoreLean.label',
      'proofTrust.requiresCoreLean.description',
      'proofTrust.nodeStateOnly.label',
      'proofTrust.nodeStateOnly.description',
      'proofTrust.noProof.label',
      'proofTrust.noProof.description',
    ];

    for (const locale of PROJECT_COVERAGE_LOCALES) {
      for (const key of proofKeys) {
        expect(resolveDictionaryText(DICTIONARY[key], locale), `${key} missing ${locale} fallback`).toBeTruthy();
      }
    }
  });

  it('should resolve the Proof Console close control for every project coverage locale without Cyrillic leakage', () => {
    for (const locale of PROJECT_COVERAGE_LOCALES) {
      const translated = LOCALE_OVERRIDES['proofConsole.close']?.[locale]
        ?? resolveDictionaryText(DICTIONARY['proofConsole.close'], locale);
      expect(translated, `proofConsole.close missing ${locale} translation`).toBeTruthy();
      expect(translated).not.toMatch(/[\u0400-\u04FF]/);
    }
  });

  it('should provide explicit translations for every project coverage locale', () => {
    const keys = Object.keys(DICTIONARY) as TranslationKey[];
    for (const locale of PROJECT_COVERAGE_LOCALES.filter((candidate) => candidate !== 'en-US')) {
      for (const key of keys) {
        const translated = LOCALE_OVERRIDES[key]?.[locale];
        expect(translated, `${key} missing explicit ${locale} translation`).toBeTruthy();
        expect(translated).not.toMatch(/[\u0400-\u04FF]/);
      }
    }
  });

  it('should require the complete Agent Log localized presentation contract with explicit coverage locales', () => {
    const agentLogKeys = [
      'agentLog.title',
      'agentLog.close',
      'agentLog.filter.all',
      'agentLog.filter.ricis',
      'agentLog.filter.success',
      'agentLog.filter.info',
      'agentLog.filter.warn',
      'agentLog.filter.error',
      'agentLog.search.placeholder',
      'agentLog.autoScroll',
      'agentLog.copy',
      'agentLog.copy.complete',
      'agentLog.copy.title',
      'agentLog.clear',
      'agentLog.empty',
      'agentLog.nodeLink',
      'agentLog.total',
      'agentLog.footerHint',
      'agentLog.clipboard.details',
    ] as const;

    for (const key of agentLogKeys) {
      const translationKey = key as TranslationKey;
      const entry = DICTIONARY[translationKey];
      expect(entry, `${key} must be present in DICTIONARY`).toBeDefined();
      expect(entry?.ru, `${key} must have base Russian text`).toBeTruthy();
      expect(entry?.en, `${key} must have base English text`).toBeTruthy();

      for (const locale of PROJECT_COVERAGE_LOCALES.filter((candidate) => candidate !== 'en-US')) {
        expect(LOCALE_OVERRIDES[translationKey]?.[locale], `${key} missing explicit ${locale} override`).toBeTruthy();
      }
    }

    expect(DICTIONARY['agentLog.filter.all' as TranslationKey]?.en).toContain('{count}');
    expect(DICTIONARY['agentLog.total' as TranslationKey]?.en).toContain('{count}');
    expect(DICTIONARY['agentLog.clipboard.details' as TranslationKey]?.en).toContain('{details}');
  });

  it('should have exact translation coverage for critical UI components', () => {
    const requiredKeys: TranslationKey[] = [
      'header.title',
      'header.nodes',
      'header.available',
      'header.locked',
      'header.resolved',
      'search.placeholder',
      'filter.quickActions',
      'filter.scientificFields',
      'filter.availableToSolve',
      'filter.saveAndExport',
      'filter.aiAgent',
      'sandbox.title',
      'modal.addTitle',
      'node.targetFunction',
      'node.formalVerification',
      'node.traceRicis',
      'settings.title',
      'physics.title',
    ];

    for (const reqKey of requiredKeys) {
      expect(DICTIONARY[reqKey]).toBeDefined();
      expect(DICTIONARY[reqKey].ru.length).toBeGreaterThan(0);
      expect(DICTIONARY[reqKey].en.length).toBeGreaterThan(0);
    }
  });
});
