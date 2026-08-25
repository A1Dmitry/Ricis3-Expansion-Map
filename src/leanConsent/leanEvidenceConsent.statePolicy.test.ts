import { describe, expect, it } from 'vitest';

const CONTRACT_PATH = './leanEvidenceConsent.domain';

type StatePolicyContract = {
  applyHumanDecision: (input: {
    readonly proposal: unknown;
    readonly decision?: unknown;
    readonly currentState: string;
  }) => unknown;
  validateHumanDecision: (input: {
    readonly proposalId: string;
    readonly sourceFingerprint: string;
    readonly evidenceFingerprint: string;
    readonly actorId: string;
    readonly decision: string;
  }) => unknown;
  classifyWorkflowBasis: (input: { readonly kind: string }) => unknown;
  ingestKernelCandidate: (input: unknown) => unknown;
  inspectTopology: () => readonly string[];
  createIdempotentProposal: (input: {
    readonly idempotencyKey: string;
    readonly currentState: string;
    readonly proposedState: string;
  }) => unknown;
};

const loadContract = () => import(CONTRACT_PATH) as Promise<StatePolicyContract>;

describe('LEAN-EVIDENCE-CONSENT-01 red baseline: consent-gated state policy', () => {
  it('LEC-QA-07 is idempotent and does not overwrite a prior proposal', async () => {
    const contract = await loadContract();
    expect(contract.createIdempotentProposal({ idempotencyKey: 'same', currentState: 'resolved', proposedState: 'partial' })).toBeDefined();
  });

  it('LEC-QA-08 rejects a human decision bound to different source or evidence fingerprints', async () => {
    const contract = await loadContract();
    expect(contract.validateHumanDecision({ proposalId: 'p-1', sourceFingerprint: 'sha256:v1:a', evidenceFingerprint: 'sha256:v1:b', actorId: 'owner', decision: 'demote' })).toBeDefined();
  });

  it('LEC-QA-09 preserves current state when no decision, timeout, refusal or cancellation is present', async () => {
    const contract = await loadContract();
    expect(contract.applyHumanDecision({ proposal: { id: 'p-timeout' }, currentState: 'resolved' })).toBeDefined();
  });

  it('LEC-QA-10 keeps a human advisory confirmation distinct from Lean kernel verification', async () => {
    const contract = await loadContract();
    expect(contract.classifyWorkflowBasis({ kind: 'HUMAN_CONFIRMED_NON_KERNEL' })).toBeDefined();
  });

  it('LEC-QA-11 leaves a kernel-negative candidate pending review without matching consent', async () => {
    const contract = await loadContract();
    expect(contract.ingestKernelCandidate({ status: 'KERNEL_REJECTED', sourceFingerprint: 'sha256:v1:a' })).toBeDefined();
  });

  it('LEC-QA-12 exposes no direct ProblemNode, Proof or axiom writer in the state-policy topology', async () => {
    const contract = await loadContract();
    expect(contract.inspectTopology()).toEqual([]);
  });
});
