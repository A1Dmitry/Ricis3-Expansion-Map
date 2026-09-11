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

  it('scen_3: verifies 100% resolution of all core research nodes in initialMap', () => {
    const unresolved = initialMap.nodes.filter(n => n.state !== 'resolved');
    expect(unresolved.length).toBe(0);
  });
});
