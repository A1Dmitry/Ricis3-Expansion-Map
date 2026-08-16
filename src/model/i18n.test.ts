import { describe, it, expect } from 'vitest';
import { DICTIONARY, TranslationKey } from '../model/i18n.types';

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
