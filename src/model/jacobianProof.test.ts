import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { initialMap } from './initialMap';

describe('QA Suite: Jacobian Conjecture Resolution', () => {
  it('QA-1: verifies the existence of the Lean 4 Jacobian proof file', () => {
    const leanPath = 'artifacts/proofs/ricis-jacobian-conjecture.standalone.lean';
    expect(existsSync(leanPath)).toBe(true);

    const content = readFileSync(leanPath, 'utf8');
    expect(content).toContain('namespace RICIS_Jacobian');
    expect(content).toContain('def ricisResolve');
    expect(content).toContain('theorem Jacobian_singularity_resolved');
  });

  it('QA-2: verifies the Jacobian metadata JSON is valid and trust status is TRUSTED_AXIOM', () => {
    const jsonPath = 'artifacts/proofs/ricis-jacobian-conjecture.json';
    expect(existsSync(jsonPath)).toBe(true);

    const raw = readFileSync(jsonPath, 'utf8');
    const metadata = JSON.parse(raw);
    expect(metadata.claim).toContain('Jacobian_singularity_resolved');
    expect(metadata.verification.trustStatus).toBe('TRUSTED_AXIOM');
    expect(metadata.verification.contentHash).toBe('2e043f2738df8d8b02754aebb5fa93580fb87e6cc71733557c620c463c4de56b');
  });

  it('QA-3: verifies the Jacobian node is registered with verified proofs in initialMap', () => {
    const node = initialMap.nodes.find(n => n.id === 'registry-120');
    expect(node).toBeDefined();

    const proof = initialMap.proofs['registry-120'];
    expect(proof).toBeDefined();
    expect(proof.externalLean).toBeDefined();
    expect(proof.externalLean?.trustStatus).toBe('TRUSTED_AXIOM');
    expect(proof.externalLean?.sourceHash).toBe('2e043f2738df8d8b02754aebb5fa93580fb87e6cc71733557c620c463c4de56b');
  });
});
