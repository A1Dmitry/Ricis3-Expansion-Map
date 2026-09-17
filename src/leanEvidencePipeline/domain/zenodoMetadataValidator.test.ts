import { describe, it, expect } from 'vitest';
import {
  validateZenodoMetadata,
  formatZenodoMetadataPayload,
} from './zenodoMetadataValidator';
import type { ZenodoDepositionMetadata } from './types';

describe('Zenodo Metadata Validator (InvenioRDM API compliance)', () => {
  const validCanonicalMeta: ZenodoDepositionMetadata = {
    title: 'RICIS-III Formal Proof: Monolith Resolution',
    description: '<p>Complete formalization of RICIS-III Monolith Algebra in Lean 4.33.1.</p>',
    upload_type: 'publication',
    publication_type: 'technicalnote',
    creators: [
      {
        name: 'Aleinikov, Dmitry V.',
        affiliation: 'Independent Researcher',
        orcid: '0009-0004-3226-7700',
      },
    ],
    access_right: 'open',
    license: 'cc-by-4.0',
    publication_date: '2026-09-17',
    keywords: ['RICIS-III', 'Lean 4', 'Singularity'],
    version: '0.4.206',
    language: 'eng',
    related_identifiers: [
      {
        identifier: '10.5281/zenodo.17872755',
        relation: 'isSupplementTo',
        scheme: 'doi',
      },
    ],
  };

  it('accepts valid canonical metadata with all required and optional fields', () => {
    const res = validateZenodoMetadata(validCanonicalMeta);
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
    expect(res.sanitizedMetadata).toBeDefined();
    expect(res.sanitizedMetadata?.title).toBe(validCanonicalMeta.title);
  });

  it('rejects metadata missing title or having empty title', () => {
    const invalid = { ...validCanonicalMeta, title: '   ' };
    const res = validateZenodoMetadata(invalid);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('"title" is required'))).toBe(true);
  });

  it('rejects metadata with invalid upload_type', () => {
    const invalid = { ...validCanonicalMeta, upload_type: 'invalid_category' as any };
    const res = validateZenodoMetadata(invalid);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('"upload_type" is required'))).toBe(true);
  });

  it('requires publication_type when upload_type is publication', () => {
    const invalid = { ...validCanonicalMeta, publication_type: undefined };
    const res = validateZenodoMetadata(invalid);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('"publication_type" is required'))).toBe(true);
  });

  it('rejects metadata with short or empty description', () => {
    const invalid = { ...validCanonicalMeta, description: 'ab' };
    const res = validateZenodoMetadata(invalid);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('"description" is required'))).toBe(true);
  });

  it('rejects empty creators array', () => {
    const invalid = { ...validCanonicalMeta, creators: [] };
    const res = validateZenodoMetadata(invalid);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('"creators" is required'))).toBe(true);
  });

  it('validates ORCID format for creators when provided', () => {
    const invalidOrcid = {
      ...validCanonicalMeta,
      creators: [{ name: 'Aleinikov, Dmitry V.', orcid: 'not-an-orcid' }],
    };
    const res = validateZenodoMetadata(invalidOrcid);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('must match standard ORCID format'))).toBe(true);
  });

  it('validates publication_date format as YYYY-MM-DD', () => {
    const invalidDate = {
      ...validCanonicalMeta,
      publication_date: '17/09/2026',
    };
    const res = validateZenodoMetadata(invalidDate);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('must follow ISO YYYY-MM-DD format'))).toBe(true);
  });

  it('formats clean Zenodo InvenioRDM payload correctly', () => {
    const payload = formatZenodoMetadataPayload(validCanonicalMeta);
    expect(payload.title).toBe(validCanonicalMeta.title);
    expect(payload.upload_type).toBe('publication');
    expect(payload.publication_type).toBe('technicalnote');
    expect(payload.access_right).toBe('open');
    expect(payload.license).toBe('cc-by-4.0');
    expect(Array.isArray(payload.creators)).toBe(true);
    expect((payload.creators as any[])[0].name).toBe('Aleinikov, Dmitry V.');
    expect((payload.creators as any[])[0].orcid).toBe('0009-0004-3226-7700');
  });
});
