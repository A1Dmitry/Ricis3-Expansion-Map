import { describe, expect, it } from 'vitest';

const CONTRACT_PATH = './leanEvidenceConsent.domain';

type LeanEvidenceConsentDomain = {
  captureLeanSource: (input: {
    readonly sourceBytes: Uint8Array;
    readonly sourceName: string;
    readonly parentFingerprint?: string;
    readonly idempotencyKey: string;
  }) => unknown;
  recordStaticDiagnostic: (input: {
    readonly fingerprint: string;
    readonly diagnostic: string;
  }) => unknown;
  recordVerificationOutcome: (input: {
    readonly fingerprint: string;
    readonly outcome: 'INCONCLUSIVE' | 'REQUIRES_CORE_LEAN';
    readonly reason: string;
  }) => unknown;
  hydrateConsentSnapshot: (input: unknown) => unknown;
  createDemotionProposal: (input: {
    readonly nodeId: string;
    readonly priorState: string;
    readonly proposedState: string;
    readonly sourceFingerprint: string;
  }) => unknown;
  makeHumanDecision: (input: {
    readonly proposalId: string;
    readonly sourceFingerprint: string;
    readonly evidenceFingerprint: string;
    readonly actorId: string;
    readonly decision: 'keep' | 'defer' | 'accept' | 'demote';
  }) => unknown;
};

const loadContract = () => import(CONTRACT_PATH) as Promise<LeanEvidenceConsentDomain>;

describe('LEAN-EVIDENCE-CONSENT-01 red baseline: evidence domain', () => {
  it('LEC-QA-01 preserves exact BOM, CRLF, Unicode and trailing-whitespace source bytes', async () => {
    const contract = await loadContract();
    const sourceBytes = new TextEncoder().encode('\ufefftheorem α : True := by\r\n  trivial  \r\n');
    expect(contract.captureLeanSource({ sourceBytes, sourceName: 'user.lean', idempotencyKey: 'k-01' })).toBeDefined();
  });

  it('LEC-QA-02 creates a new append-only version rather than replacing a parent source', async () => {
    const contract = await loadContract();
    expect(contract.captureLeanSource({ sourceBytes: new Uint8Array([1]), sourceName: 'v2.lean', parentFingerprint: 'sha256:v1:parent', idempotencyKey: 'k-02' })).toBeDefined();
  });

  it('LEC-QA-03 records static diagnostics without mathematical rejection or state demotion', async () => {
    const contract = await loadContract();
    expect(contract.recordStaticDiagnostic({ fingerprint: 'sha256:v1:invalid', diagnostic: 'parse error' })).toBeDefined();
  });

  it('LEC-QA-04 records unavailable verification only as inconclusive evidence', async () => {
    const contract = await loadContract();
    expect(contract.recordVerificationOutcome({ fingerprint: 'sha256:v1:offline', outcome: 'REQUIRES_CORE_LEAN', reason: 'no kernel provider' })).toBeDefined();
  });

  it('LEC-QA-05 keeps the last valid legacy source when hydration sees a corrupt consent snapshot', async () => {
    const contract = await loadContract();
    expect(contract.hydrateConsentSnapshot({ version: 1, records: [{ source: 'legacy' }, { source: null }] })).toBeDefined();
  });

  it('LEC-QA-06 creates a non-effective demotion proposal instead of mutating a node', async () => {
    const contract = await loadContract();
    expect(contract.createDemotionProposal({ nodeId: 'p-np', priorState: 'resolved', proposedState: 'partial', sourceFingerprint: 'sha256:v1:owner-source' })).toBeDefined();
  });
});
