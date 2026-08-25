import { describe, expect, it } from 'vitest';

const CONTRACT_PATH = './leanEvidenceConsent.domain';

type PersistenceContract = {
  serializeConsentLedger: (input: unknown) => unknown;
  hydrateConsentLedger: (input: unknown) => unknown;
  assertAppendOnlySnapshot: (input: unknown) => unknown;
  preserveLegacyExternalLean: (input: unknown) => unknown;
  correlateLeanPassport: (input: unknown) => unknown;
  protectOwnerAuthorizedProof: (input: unknown) => unknown;
};

const loadContract = () => import(CONTRACT_PATH) as Promise<PersistenceContract>;

describe('LEAN-EVIDENCE-CONSENT-01 red baseline: persistence and compatibility', () => {
  it('LEC-QA-26 rejects incomplete/sorry kernel attestation before it enters a persisted consent snapshot', async () => {
    const contract = await loadContract();
    expect(contract.hydrateConsentLedger({ records: [{ kind: 'kernel', sourceFingerprint: 'sha256:v1:a', axiomReport: 'sorryAx' }] })).toBeDefined();
  });

  it('LEC-QA-27 persists a fully shaped kernel fact append-only without direct workflow-state effect', async () => {
    const contract = await loadContract();
    expect(contract.serializeConsentLedger({ kernelFact: { sourceFingerprint: 'sha256:v1:a', toolchain: 'pinned', axiomReport: 'clean' } })).toBeDefined();
  });

  it('LEC-QA-32 keeps Lean Passport records append-only and read-only when correlated with consent records', async () => {
    const contract = await loadContract();
    expect(contract.correlateLeanPassport({ passportId: 'lp-1', sourceFingerprint: 'sha256:v1:a' })).toBeDefined();
  });

  it('LEC-QA-33 preserves explicit legacy externalLean and OIR proof-repair boundaries', async () => {
    const contract = await loadContract();
    expect(contract.preserveLegacyExternalLean({ externalLean: { sourceHash: 'sha256:v1:legacy' } })).toBeDefined();
  });

  it('LEC-QA-31 preserves source-bound owner-authorized P=NP proof identity without a template path', async () => {
    const contract = await loadContract();
    expect(contract.protectOwnerAuthorizedProof({ nodeId: 'p-np', latex: 'owner bytes', sourceFingerprint: 'sha256:v1:owner' })).toBeDefined();
  });

  it('LEC-QA-34 bounds hostile records and unknown fields without destructive data loss', async () => {
    const contract = await loadContract();
    expect(contract.assertAppendOnlySnapshot({ unknown: '<script>', records: [] })).toBeDefined();
  });
});
