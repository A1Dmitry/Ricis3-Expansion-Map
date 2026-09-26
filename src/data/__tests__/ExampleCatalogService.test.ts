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

  it('strictly validates that EVERY example specifies RICIS-III axioms and classical failure explanation', () => {
    const all = exampleCatalogService.getAllExamples();
    const validAxioms = new Set(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'SP1', 'SP2', 'SP3', 'SP4', 'SP5', 'L0', 'L1', 'Δ_plane']);

    for (const item of all) {
      // 1. RICIS Axiom specification
      expect(item.ricisAxioms, `Item ${item.id} must define ricisAxioms`).toBeDefined();
      expect(item.ricisAxioms!.length, `Item ${item.id} must have at least one ricisAxiom`).toBeGreaterThan(0);
      for (const ax of item.ricisAxioms!) {
        expect(validAxioms.has(ax), `Item ${item.id} axiom ${ax} must be a canonical RICIS-III axiom`).toBe(true);
      }

      // 2. RICIS Resolution Method
      expect(item.ricisResolutionMethod, `Item ${item.id} must have ricisResolutionMethod`).toBeDefined();
      expect(item.ricisResolutionMethod!.trim().length).toBeGreaterThan(5);

      // 3. Classical Failure Demonstration
      expect(item.classicalFailureExplanation, `Item ${item.id} must have classicalFailureExplanation`).toBeDefined();
      expect(item.classicalFailureExplanation!.trim().length).toBeGreaterThan(5);

      // 4. Classical Status
      expect(item.classicalStatus, `Item ${item.id} must have classicalStatus`).toBeDefined();

      // 5. Singularity entries must demonstrate classical failure (not smooth)
      if (item.category === 'singularity_zero_zero' || item.category === 'singularity_inf_inf' || item.singularityPoint !== undefined) {
        expect(
          item.classicalStatus,
          `Singular item ${item.id} must demonstrate classical failure (NAN, DIVIDE_BY_ZERO, INDETERMINATE_FORM, or NUMERICAL_INSTABILITY)`
        ).not.toBe('SMOOTH_INVARIANT');
      }
    }
  });

  it('guarantees that classical solutions are referenced ONLY to demonstrate their inability to resolve the point', () => {
    const all = exampleCatalogService.getAllExamples();
    for (const item of all) {
      // The RICIS resolution method must NOT invoke Cauchy limits or L'Hôpital
      expect(item.ricisResolutionMethod).not.toMatch(/L'H[ôo]pital|Лопитал|lim_\{|предел Коши/i);

      // Singularities (0/0) must have classical failure explicitly noted as NaN or limit requirement
      if (item.category === 'singularity_zero_zero') {
        expect(item.classicalFailureExplanation).toMatch(/0\/0|NaN|предел|Лопитал|неопредел/i);
      }
    }
  });
});

