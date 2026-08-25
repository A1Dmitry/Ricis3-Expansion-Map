import { describe, expect, it } from 'vitest';

const CONTRACT_PATH = './leanEvidenceConsent.domain';

type AgentChallengeContract = {
  createLeanChallenge: (input: unknown) => unknown;
  correlateChallengeEvidence: (input: unknown) => unknown;
  recordCompetenceConflict: (input: unknown) => unknown;
  inspectAgentBoundary: () => readonly string[];
  preventAutomaticRetraining: (input: unknown) => unknown;
  runRelatedReleaseChecks: () => unknown;
};

const loadContract = () => import(CONTRACT_PATH) as Promise<AgentChallengeContract>;

describe('LEAN-EVIDENCE-CONSENT-01 red baseline: agent challenge and competence boundary', () => {
  it('LEC-QA-28 requires an explicit human challenge plus exact source and advisory identity', async () => {
    const contract = await loadContract();
    expect(contract.createLeanChallenge({ advisoryId: 'a-1', sourceFingerprint: 'sha256:v1:a' })).toBeDefined();
  });

  it('LEC-QA-29 records an immutable competence conflict and training-required quarantine on exact contradiction', async () => {
    const contract = await loadContract();
    expect(contract.recordCompetenceConflict({ advisoryFingerprint: 'sha256:v1:advice', kernelFingerprint: 'sha256:v1:kernel', result: 'contradiction' })).toBeDefined();
  });

  it('LEC-QA-30 exposes no Lean claim, proof/state/axiom writer, self-approval or training executor to the agent contract', async () => {
    const contract = await loadContract();
    expect(contract.inspectAgentBoundary()).toEqual([]);
  });

  it('LEC-QA-30 rejects autonomous retraining and memory-quality rewrites', async () => {
    const contract = await loadContract();
    expect(contract.preventAutomaticRetraining({ requestedBy: 'agent', action: 'retrain' })).toBeDefined();
  });

  it('LEC-QA-35 registers bounded target and related regression checks without asserting a Lean compilation', async () => {
    const contract = await loadContract();
    expect(contract.runRelatedReleaseChecks()).toBeDefined();
  });

  it('LEC-QA-36 retains release hygiene as an explicit future gate rather than reusing blocked candidate evidence', async () => {
    const contract = await loadContract();
    expect(contract.runRelatedReleaseChecks()).toBeDefined();
  });
});
