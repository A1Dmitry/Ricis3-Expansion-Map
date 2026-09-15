import { describe, expect, it } from 'vitest';
import { initialMap } from './initialMap';

describe('RICIS-III Singularity Resolution & Graph Completion Verification', () => {
  it('scen_1 (Task 1): verifies math-singularity is fully resolved with A4/A6 axioms and DOI 10.5281/zenodo.22124493', () => {
    const node = initialMap.nodes.find(n => n.id === 'math-singularity');
    expect(node).toBeDefined();
    expect(node?.state).toBe('resolved');
    expect(node?.sourceUrl).toBe('https://doi.org/10.5281/zenodo.22124493');
    expect(node?.targetFunction).toContain('ResolveSingularity');

    const proof = initialMap.proofs['math-singularity'];
    expect(proof).toBeDefined();
    expect(proof.axiomsUsed).toContain('A4_ZERO_RATIO');
    expect(proof.axiomsUsed).toContain('A6_GEOMETRIC_BRIDGE');
    expect(proof.axiomsUsed).toContain('10.5281/zenodo.22124493');
  });

  it('scen_2 (Task 2): verifies core-agi-target is fully resolved with Goal_P invariant and DOI 10.5281/zenodo.22225762', () => {
    const node = initialMap.nodes.find(n => n.id === 'core-agi-target');
    expect(node).toBeDefined();
    expect(node?.state).toBe('resolved');
    expect(node?.sourceUrl).toBe('https://doi.org/10.5281/zenodo.22225762');
    expect(node?.targetFunction).toContain('FormalizeAGITarget');

    const proof = initialMap.proofs['core-agi-target'];
    expect(proof).toBeDefined();
    expect(proof.axiomsUsed).toContain('L1_IDENTITY');
    expect(proof.axiomsUsed).toContain('SP4');
    expect(proof.axiomsUsed).toContain('10.5281/zenodo.22225762');
  });

  // Contract-layers merge (expand_phys_field_bridge_contract_layers, 0.4.193):
  // phys-unified is partial BY DESIGN — the prior det-only resolved marking was an
  // overclaim (continuum QM–GR unification was never established). Owner-authorized
  // correction; every other seed node must remain resolved.
  it('scen_3: verifies 100% resolution of all core research nodes except documented partial-by-design', () => {
    const unresolved = initialMap.nodes.filter(n => n.state !== 'resolved');
    expect(unresolved.map(n => n.id).sort()).toEqual(['phys-unified']);
  });

  it('scen_3b: phys-unified stays partial (never unresolved) with OPEN continuum proof', () => {
    const node = initialMap.nodes.find(n => n.id === 'phys-unified');
    expect(node?.state).toBe('partial');
    expect(initialMap.proofs['phys-unified'].finalResult).toContain('OPEN');
  });
});
