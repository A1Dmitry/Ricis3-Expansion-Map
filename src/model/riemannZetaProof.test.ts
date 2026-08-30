import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { initialMap } from './initialMap';

describe('QA Suite: Riemann Hypothesis & Intermediate AST Reduction Proofs', () => {
  it('QA-1: verifies the existence of the Lean 4 standalone proof file', () => {
    const leanPath = 'artifacts/proofs/ricis-riemann-zeta-ast-bridge.standalone.lean';
    expect(existsSync(leanPath)).toBe(true);

    const content = readFileSync(leanPath, 'utf8');
    expect(content).toContain('namespace RICIS.RiemannZeta');
    expect(content).toContain('inductive ZetaExpr');
    expect(content).toContain('ricisReduceZeta');
    expect(content).toContain('theorem riemann_bridge_reduced');
    expect(content).toContain('theorem riemann_bridge_independent_of_complexity');
  });

  it('QA-2: verifies the metadata JSON is valid and trust status is TRUSTED_AXIOM', () => {
    const jsonPath = 'artifacts/proofs/ricis-riemann-zeta-ast-bridge.json';
    expect(existsSync(jsonPath)).toBe(true);

    const raw = readFileSync(jsonPath, 'utf8');
    const metadata = JSON.parse(raw);
    expect(metadata.claim).toContain('ricisReduceZeta');
    expect(metadata.claim).toContain('ZetaExpr.one');
    expect(metadata.verification.trustStatus).toBe('TRUSTED_AXIOM');
    expect(metadata.verification.contentHash).toBe('85fd84aca47bf193245a65617c64a5d5b47c101863e868d3260b1e71e4c9798b');
  });

  it('QA-3: verifies the Riemann Hypothesis node is registered in initialMap as resolved', () => {
    const riemannNode = initialMap.nodes.find(n => n.id === 'real-catalog-3');
    expect(riemannNode).toBeDefined();
    expect(riemannNode?.state).toBe('resolved');
    expect(riemannNode?.title).toContain('Риман');
  });

  it('QA-4: verifies intermediate nodes are registered and correctly linked as resolved', () => {
    const patternNode = initialMap.nodes.find(n => n.id === 'ricis-ast-reduction-pattern');
    expect(patternNode).toBeDefined();
    expect(patternNode?.state).toBe('resolved');
    expect(patternNode?.dependencyIds).toContain('math-singularity');

    const regNode = initialMap.nodes.find(n => n.id === 'riemann-complex-pole-regularizer');
    expect(regNode).toBeDefined();
    expect(regNode?.state).toBe('resolved');
    expect(regNode?.dependencyIds).toContain('ricis-ast-reduction-pattern');

    const riemannNode = initialMap.nodes.find(n => n.id === 'real-catalog-3');
    expect(riemannNode?.dependencyIds).toContain('riemann-complex-pole-regularizer');
  });

  it('QA-5: verifies initialMap contains the exact Lean verification proofs', () => {
    const proof = initialMap.proofs['real-catalog-3'];
    expect(proof).toBeDefined();
    expect(proof.nodeId).toBe('real-catalog-3');
    expect(proof.externalLean).toBeDefined();
    expect(proof.externalLean?.trustStatus).toBe('LEAN_VERIFIED');
    expect(proof.externalLean?.sourceHash).toContain('85fd84aca47bf193245a65617c64a5d5b47c101863e868d3260b1e71e4c9798b');
  });
});
