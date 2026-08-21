import { describe, expect, it } from 'vitest';
import { AVAILABLE_GEMINI_MODELS } from './modelPool.types';
import { SERVER_GEMINI_MODEL_POOL } from './geminiCatalogProjection';

describe('Gemini catalog server projection regression tests', () => {
  it('projects the existing public Gemini catalog to the server fallback pool without duplicate hard-coded model IDs', () => {
    expect(SERVER_GEMINI_MODEL_POOL).toEqual(AVAILABLE_GEMINI_MODELS.map((model) => model.id));
  });

  it('keeps the public catalog and server projection immutable', () => {
    expect(Object.isFrozen(SERVER_GEMINI_MODEL_POOL)).toBe(true);
    expect(SERVER_GEMINI_MODEL_POOL).toContain('gemini-3.7-flash');
    expect(SERVER_GEMINI_MODEL_POOL).toContain('gemini-2.5-pro');
  });
});
