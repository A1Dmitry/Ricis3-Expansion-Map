import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { initialMap } from './initialMap';

describe('QA Suite: RICIS v7.9 Unified Monolith Proof', () => {
  it('QA-1: verifies the existence of the Lean 4 v79 monolith proof file', () => {
    const leanPath = 'artifacts/proofs/ricis-v79-monolith.standalone.lean';
    expect(existsSync(leanPath)).toBe(true);

    const content = readFileSync(leanPath, 'utf8');
    expect(content).toContain('namespace RICIS_v79');
    expect(content).toContain('inductive RExpr');
    expect(content).toContain('def ricisResolve');
    expect(content).toContain('def fullResolve');
    expect(content).toContain('theorem RICIS_v79_unified');
  });

  it('QA-2: verifies the v79 metadata JSON is valid and trust status is TRUSTED_AXIOM', () => {
    const jsonPath = 'artifacts/proofs/ricis-v79-monolith.json';
    expect(existsSync(jsonPath)).toBe(true);

    const raw = readFileSync(jsonPath, 'utf8');
    const metadata = JSON.parse(raw);
    expect(metadata.claim).toContain('RICIS_v79_unified');
    expect(metadata.verification.trustStatus).toBe('TRUSTED_AXIOM');
    expect(metadata.verification.contentHash).toBe('fbd99bbdefd05aaff83fe4325377681f7e3b7099a3c9f5234b3ff4def86077e2');
  });

  it('QA-3: verifies the intermediate learning nodes are registered with verified proofs in initialMap', () => {
    const patternNode = initialMap.nodes.find(n => n.id === 'ricis-ast-reduction-pattern');
    expect(patternNode).toBeDefined();

    const patternProof = initialMap.proofs['ricis-ast-reduction-pattern'];
    expect(patternProof).toBeDefined();
    expect(patternProof.externalLean).toBeDefined();
    expect(patternProof.externalLean?.trustStatus).toBe('LEAN_VERIFIED');
    expect(patternProof.externalLean?.sourceHash).toContain('fbd99bbdefd05aaff83fe4325377681f7e3b7099a3c9f5234b3ff4def86077e2');

    const regNode = initialMap.nodes.find(n => n.id === 'riemann-complex-pole-regularizer');
    expect(regNode).toBeDefined();

    const regProof = initialMap.proofs['riemann-complex-pole-regularizer'];
    expect(regProof).toBeDefined();
    expect(regProof.externalLean).toBeDefined();
    expect(regProof.externalLean?.trustStatus).toBe('LEAN_VERIFIED');
    expect(regProof.externalLean?.sourceHash).toContain('fbd99bbdefd05aaff83fe4325377681f7e3b7099a3c9f5234b3ff4def86077e2');
  });
});
