/// <reference types="vitest/globals" />

type TrustStatus = 'REQUIRES_CORE_LEAN' | 'LEAN_VERIFIED' | 'TRUSTED_AXIOM' | 'REJECTED';

type SessionReference = Readonly<{
  nodeId: string;
  sourceFingerprint: string;
  submittedAt: string;
  trustStatus: TrustStatus;
  sourceLocked: true;
}>;

type SessionView = Readonly<{
  state: 'SOURCE_BOUND_READ_ONLY';
  reference: SessionReference;
  basis: 'SOURCE_LOCKED_PROVENANCE';
  disclosures: readonly string[];
  capabilities: Readonly<{
    canMutate: false;
    canVerify: false;
    canUpload: false;
    canPersist: false;
    canRevealRawSource: false;
  }>;
}>;

type DomainContract = {
  createEphemeralPassportSession: (reference: unknown) => SessionView;
};

const MODULE_PATH: string = './leanPassportSession.domain';
const FINGERPRINT = 'sha256:v1:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

const reference = (overrides: Partial<SessionReference> = {}): SessionReference => ({
  nodeId: 'source-bound-node',
  sourceFingerprint: FINGERPRINT,
  submittedAt: '2026-08-26T00:00:00.000Z',
  trustStatus: 'REQUIRES_CORE_LEAN',
  sourceLocked: true,
  ...overrides,
});

async function loadDomain(): Promise<DomainContract> {
  return await import(MODULE_PATH) as DomainContract;
}

describe('RICIS-LEAN-PASSPORT-ROUTE-B1 — pure ephemeral reference red baseline', () => {
  it('LPB1-QA-01 creates a read-only session for an exact locked reference', async () => {
    const domain = await loadDomain();
    expect(domain.createEphemeralPassportSession(reference()).state).toBe('SOURCE_BOUND_READ_ONLY');
  });

  it('LPB1-QA-02 preserves the exact node ID without a fallback identity', async () => {
    const domain = await loadDomain();
    expect(domain.createEphemeralPassportSession(reference()).reference.nodeId).toBe('source-bound-node');
  });

  it('LPB1-QA-03 preserves the exact source fingerprint without recalculation', async () => {
    const domain = await loadDomain();
    expect(domain.createEphemeralPassportSession(reference()).reference.sourceFingerprint).toBe(FINGERPRINT);
  });

  it('LPB1-QA-04 preserves submission metadata as display-only provenance', async () => {
    const domain = await loadDomain();
    expect(domain.createEphemeralPassportSession(reference()).reference.submittedAt).toBe('2026-08-26T00:00:00.000Z');
  });

  it('LPB1-QA-05 displays REQUIRES_CORE_LEAN without creating a verification claim', async () => {
    const domain = await loadDomain();
    expect(domain.createEphemeralPassportSession(reference()).reference.trustStatus).toBe('REQUIRES_CORE_LEAN');
  });

  it('LPB1-QA-06 preserves LEAN_VERIFIED as metadata without deciding application state', async () => {
    const domain = await loadDomain();
    expect(domain.createEphemeralPassportSession(reference({ trustStatus: 'LEAN_VERIFIED' })).reference.trustStatus).toBe('LEAN_VERIFIED');
  });

  it('LPB1-QA-07 preserves TRUSTED_AXIOM as metadata without deciding application state', async () => {
    const domain = await loadDomain();
    expect(domain.createEphemeralPassportSession(reference({ trustStatus: 'TRUSTED_AXIOM' })).reference.trustStatus).toBe('TRUSTED_AXIOM');
  });

  it('LPB1-QA-08 preserves REJECTED as metadata without deciding application state', async () => {
    const domain = await loadDomain();
    expect(domain.createEphemeralPassportSession(reference({ trustStatus: 'REJECTED' })).reference.trustStatus).toBe('REJECTED');
  });

  it('LPB1-QA-09 exposes SOURCE_LOCKED_PROVENANCE rather than an authority basis', async () => {
    const domain = await loadDomain();
    expect(domain.createEphemeralPassportSession(reference()).basis).toBe('SOURCE_LOCKED_PROVENANCE');
  });

  it('LPB1-QA-10 refuses an empty node ID', async () => {
    const domain = await loadDomain();
    expect(() => domain.createEphemeralPassportSession({ ...reference(), nodeId: '' })).toThrow();
  });

  it('LPB1-QA-11 refuses an empty source fingerprint', async () => {
    const domain = await loadDomain();
    expect(() => domain.createEphemeralPassportSession({ ...reference(), sourceFingerprint: '' })).toThrow();
  });

  it('LPB1-QA-12 refuses an absent submission marker', async () => {
    const domain = await loadDomain();
    expect(() => domain.createEphemeralPassportSession({ ...reference(), submittedAt: '' })).toThrow();
  });

  it('LPB1-QA-13 refuses an unlocked source reference', async () => {
    const domain = await loadDomain();
    expect(() => domain.createEphemeralPassportSession({ ...reference(), sourceLocked: false })).toThrow();
  });

  it('LPB1-QA-14 refuses an unknown trust-status token', async () => {
    const domain = await loadDomain();
    expect(() => domain.createEphemeralPassportSession({ ...reference(), trustStatus: 'UNVERIFIED_UNKNOWN' })).toThrow();
  });

  it('LPB1-QA-15 declares every mutating, verification and storage capability false', async () => {
    const domain = await loadDomain();
    expect(domain.createEphemeralPassportSession(reference()).capabilities).toEqual({
      canMutate: false,
      canVerify: false,
      canUpload: false,
      canPersist: false,
      canRevealRawSource: false,
    });
  });

  it('LPB1-QA-16 returns an immutable session view', async () => {
    const domain = await loadDomain();
    expect(Object.isFrozen(domain.createEphemeralPassportSession(reference()))).toBe(true);
  });

  it('LPB1-QA-17 provides fixed disclosures and no raw-source field', async () => {
    const domain = await loadDomain();
    const view = domain.createEphemeralPassportSession(reference()) as Record<string, unknown>;
    expect(view.disclosures).toEqual(expect.any(Array));
    expect(view).not.toHaveProperty('latex');
    expect(view).not.toHaveProperty('sourceBytes');
  });
});
