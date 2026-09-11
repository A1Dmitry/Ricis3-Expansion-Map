import { describe, expect, it } from 'vitest';
import { initialMap } from './initialMap';
import { auditProofContent } from './ricisCoreRules';
import { verifyLeanProof } from './leanVerifier';

describe('RICIS-III Core AGI Target Proof Integrity Suite', () => {
  it('has a canonical proof for core-agi-target in initialMap.proofs', () => {
    const proof = initialMap.proofs['core-agi-target'];
    expect(proof).toBeDefined();
    expect(proof?.latex).toBeDefined();
    expect(proof?.latex.length).toBeGreaterThan(50);
  });

  it('passes auditProofContent with zero issues and isValid === true', () => {
    const node = initialMap.nodes.find((n) => n.id === 'core-agi-target');
    expect(node).toBeDefined();
    const proof = initialMap.proofs['core-agi-target'];
    expect(proof).toBeDefined();

    const audit = auditProofContent(proof!.latex);
    expect(audit.isValid).toBe(true);
    expect(audit.issues).toEqual([]);
    expect(audit.score).toBeGreaterThanOrEqual(70);
  });

  it('passes static Lean verification without errors or sorry markers', () => {
    const node = initialMap.nodes.find((n) => n.id === 'core-agi-target');
    const proof = initialMap.proofs['core-agi-target'];
    const leanAudit = verifyLeanProof(proof!.latex, node!.title, node!.targetFunction || '');

    expect(leanAudit.errors).toEqual([]);
    expect(proof!.latex).not.toContain('REQUIRES_CORE_LEAN');
    expect(proof!.latex).not.toContain('sorry');
  });

  it('contains mandatory Lean 4 and Master Registry DOI references', () => {
    const proof = initialMap.proofs['core-agi-target'];
    expect(proof!.latex).toContain('10.5281/zenodo.21836220');
    expect(proof!.latex).toContain('10.5281/zenodo.21529989');
    expect(proof!.latex).toContain('10.5281/zenodo.17872755');
  });

  it('ensures node in initialMap does not have active leanErrors', () => {
    const node = initialMap.nodes.find((n) => n.id === 'core-agi-target');
    expect(node?.leanErrors || []).toEqual([]);
  });
});
