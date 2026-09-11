import { describe, it, expect } from 'vitest';
import { exampleCatalogService } from '../exampleCatalogData';

describe('QA Specification: ExampleCatalogService & Knowledge Fractal', () => {
  it('should contain exactly 66 canonical examples from L0 to L66', () => {
    const all = exampleCatalogService.getAllExamples();
    expect(all.length).toBe(66);

    const ids = new Set(all.map(e => e.id));
    expect(ids.size).toBe(66);
    expect(ids.has('L0')).toBe(true);
    expect(ids.has('L6')).toBe(true);
    expect(ids.has('L38')).toBe(true);
    expect(ids.has('L66')).toBe(true);
  });

  it('should correctly filter examples by category', () => {
    const zeroZero = exampleCatalogService.getFilteredExamples({ category: 'singularity_zero_zero' });
    expect(zeroZero.length).toBeGreaterThan(0);
    expect(zeroZero.every(e => e.category === 'singularity_zero_zero')).toBe(true);

    const physics = exampleCatalogService.getFilteredExamples({ category: 'physics_quantum' });
    expect(physics.some(e => e.id === 'L38')).toBe(true); // Schwarzschild
  });

  it('should search examples by query string', () => {
    const searchRes = exampleCatalogService.getFilteredExamples({ searchQuery: 'sin(x)' });
    expect(searchRes.length).toBeGreaterThan(0);
    expect(searchRes.some(e => e.id === 'L6')).toBe(true);
  });

  it('should return all categories with non-zero counts', () => {
    const categories = exampleCatalogService.getCategories();
    expect(categories.length).toBe(7);
    expect(categories.every(c => c.count > 0)).toBe(true);
  });
});
