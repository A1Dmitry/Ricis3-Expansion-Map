import { describe, expect, it } from 'vitest';
import type { ProblemNode, Proof } from '../model/types';
import { getProofTrustPresentation } from './ProofTrustBadge';

const baseNode: Pick<ProblemNode, 'state' | 'leanErrors' | 'leanWarnings'> = {
  state: 'resolved',
};

const baseProof: Proof = {
  nodeId: 'proof-node',
  targetFunction: 'F / G',
  steps: [],
  finalResult: 'F / G',
  latex: 'F / G',
};

describe('getProofTrustPresentation', () => {
  it('does not mistake a resolved workflow state for Lean kernel verification', () => {
    expect(getProofTrustPresentation(baseNode, baseProof)).toMatchObject({
      code: 'NODE_STATE_ONLY',
      label: 'Resolved workflow state',
    });
  });

  it('shows only explicit external Lean kernel evidence as LEAN_VERIFIED', () => {
    const proof: Proof = {
      ...baseProof,
      externalLean: {
        sourceHash: 'fnv1a:abc',
        submittedAt: '2026-08-18T00:00:00.000Z',
        sourceLocked: true,
        trustStatus: 'LEAN_VERIFIED',
        kernelEvidence: {
          toolchain: 'leanprover/lean4:v4.33.0',
          command: 'lake env lean Proof.lean',
          compilerOutput: 'ok',
          axiomReport: 'does not depend on any axioms',
          verifiedAt: '2026-08-18T00:00:01.000Z',
        },
      },
    };

    expect(getProofTrustPresentation(baseNode, proof).code).toBe('LEAN_VERIFIED');
  });

  it('keeps partial drafts below the Core/Lean trust boundary', () => {
    expect(getProofTrustPresentation({ state: 'partial' }, baseProof)).toMatchObject({
      code: 'REQUIRES_CORE_LEAN',
      tone: 'amber',
    });
  });

  it('shows a rejection when Lean diagnostics contain errors', () => {
    expect(getProofTrustPresentation({ state: 'resolved', leanErrors: ['unknown constant'] }, baseProof)).toMatchObject({
      code: 'REJECTED',
      tone: 'rose',
    });
  });
});
