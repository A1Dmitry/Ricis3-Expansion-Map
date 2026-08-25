import { describe, expect, it } from 'vitest';

const CONTRACT_PATH = './leanPassportProjection.domain';
const FINGERPRINT = `sha256:v1:${'a'.repeat(64)}`;
const OTHER_FINGERPRINT = `sha256:v1:${'b'.repeat(64)}`;

type ReadResult<T> =
  | { readonly kind: 'FOUND'; readonly value: T }
  | { readonly kind: 'ABSENT' }
  | { readonly kind: 'INCONCLUSIVE'; readonly reason: string };

type SourceSnapshot = {
  readonly fingerprint: string;
  readonly sourceName: string;
  readonly sourceBytes: Uint8Array;
  readonly byteLength: number;
  readonly parentFingerprint?: string;
  readonly idempotencyKey: string;
};

type Observation = {
  readonly fingerprint: string;
  readonly status: 'LOCAL_DIAGNOSTIC_ONLY' | 'INCONCLUSIVE' | 'REQUIRES_CORE_LEAN' | 'HOSTED_ADVISORY_ONLY';
  readonly authority: 'LOCAL' | 'HOSTED' | 'UNAVAILABLE' | 'MANUAL' | 'KERNEL_CANDIDATE';
  readonly reason: string;
};

type KernelFact = {
  readonly sourceFingerprint: string;
  readonly toolchain: string;
  readonly command: string;
  readonly compilerOutput: string;
  readonly axiomReport: string;
  readonly runnerIdentity: string;
  readonly signature: string;
  readonly imageOrLock: string;
};

type HumanDecision = {
  readonly sourceFingerprint: string;
  readonly evidenceFingerprint: string;
  readonly proposalId: string;
  readonly actorId: string;
  readonly decision: 'keep' | 'defer' | 'accept' | 'demote';
};

type Correlation = {
  readonly sourceFingerprint: string;
  readonly evidenceFingerprint: string;
  readonly authoritySnapshotId: string;
  readonly kernelFactFingerprint: string;
  readonly basis: 'LEAN_KERNEL_VERIFIED';
};

type ReadModel = {
  readonly findSource: (fingerprint: string) => ReadResult<SourceSnapshot>;
  readonly listObservations: (fingerprint: string) => readonly Observation[];
  readonly findKernelFact: (fingerprint: string) => ReadResult<KernelFact>;
  readonly findHumanDecision: (fingerprint: string) => ReadResult<HumanDecision>;
  readonly findCorrelation: (fingerprint: string) => ReadResult<Correlation>;
  readonly findRicisBasis: (nodeId?: string) => ReadResult<{ readonly basis: 'RICIS_III_SOLVED'; readonly sourceReference: string }>;
};

type PassportView = {
  readonly state: string;
  readonly source?: {
    readonly fingerprint: string;
    readonly byteLength: number;
    readonly parentFingerprint?: string;
    readonly text: string;
  };
  readonly observations: readonly { readonly status: string; readonly reason: string }[];
  readonly basis: {
    readonly ricis?: string;
    readonly lean?: string;
    readonly human?: string;
    readonly diagnostic?: string;
  };
  readonly diagnostics: readonly { readonly code: string; readonly reason: string }[];
  readonly capabilities: { readonly canMutate: false; readonly canVerify: false; readonly canUpload: false };
};

type ProjectionContract = {
  readonly createLeanPassportProjection: (readModel: ReadModel) => {
    readonly present: (query: { readonly sourceFingerprint: string; readonly nodeId?: string; readonly requestedDisclosure: 'SOURCE_AND_BASIS' | 'SAFE_EVIDENCE_DETAILS' }) => PassportView;
  };
  readonly createUnavailablePassportReadModel: () => ReadModel;
  readonly inspectLeanPassportProjectionTopology: () => {
    readonly domainImports: readonly string[];
    readonly uiImports: readonly string[];
    readonly ownedOperations: readonly string[];
    readonly forbiddenCapabilities: readonly string[];
  };
  readonly inspectPassportProjectionQueryContract: () => {
    readonly allowedFields: readonly string[];
    readonly forbiddenFields: readonly string[];
  };
};

const loadContract = () => import(CONTRACT_PATH) as Promise<ProjectionContract>;

const source = (text = 'theorem ownerSource : True := by trivial'): SourceSnapshot => ({
  fingerprint: FINGERPRINT,
  sourceName: 'owner.lean',
  sourceBytes: new TextEncoder().encode(text),
  byteLength: new TextEncoder().encode(text).byteLength,
  parentFingerprint: OTHER_FINGERPRINT,
  idempotencyKey: 'canonical-owner-capture',
});

const found = <T,>(value: T): ReadResult<T> => ({ kind: 'FOUND', value });
const absent = <T,>(): ReadResult<T> => ({ kind: 'ABSENT' });

const buildModel = (overrides: Partial<ReadModel> = {}): ReadModel => ({
  findSource: () => found(source()),
  listObservations: () => [],
  findKernelFact: () => absent(),
  findHumanDecision: () => absent(),
  findCorrelation: () => absent(),
  findRicisBasis: () => absent(),
  ...overrides,
});

const present = async (readModel: ReadModel, disclosure: 'SOURCE_AND_BASIS' | 'SAFE_EVIDENCE_DETAILS' = 'SOURCE_AND_BASIS') => {
  const contract = await loadContract();
  return contract.createLeanPassportProjection(readModel).present({ sourceFingerprint: FINGERPRINT, nodeId: 'informatics-complexity', requestedDisclosure: disclosure });
};

describe('RICIS-LEAN-PASSPORT-REVALIDATION-01 red baseline: canonical ownership and authority classification', () => {
  it('LPR-QA-01 accepts only the published canonical fingerprint shape', async () => {
    const contract = await loadContract();
    const projection = contract.createLeanPassportProjection(buildModel());
    expect(() => projection.present({ sourceFingerprint: 'bare-zero', requestedDisclosure: 'SOURCE_AND_BASIS' })).toThrow('INVALID_CANONICAL_FINGERPRINT');
  });

  it('LPR-QA-02 projects exact canonical identity and lineage without recomputing it', async () => {
    const view = await present(buildModel());
    expect(view.source).toMatchObject({ fingerprint: FINGERPRINT, byteLength: source().byteLength, parentFingerprint: OTHER_FINGERPRINT });
  });

  it('LPR-QA-03 has no Passport-owned hash, capture, idempotency or lifecycle operation', async () => {
    const contract = await loadContract();
    expect(contract.inspectLeanPassportProjectionTopology().ownedOperations).toEqual([]);
  });

  it('LPR-QA-04 returns a disclosure detached from mutable source bytes', async () => {
    const canonical = source('theorem immutable : True := by trivial');
    const view = await present(buildModel({ findSource: () => found(canonical) }));
    canonical.sourceBytes[0] = 0;
    expect(view.source?.text).toContain('theorem immutable');
    expect(Object.prototype.hasOwnProperty.call(view.source ?? {}, 'sourceBytes')).toBe(false);
  });

  it('LPR-QA-05 deterministically distinguishes absent and inconclusive read results', async () => {
    const absentView = await present(buildModel({ findSource: () => absent() }));
    const contract = await loadContract();
    const inconclusiveView = contract.createLeanPassportProjection(buildModel({ findSource: () => ({ kind: 'INCONCLUSIVE', reason: 'LEDGER_UNAVAILABLE' }) })).present({ sourceFingerprint: FINGERPRINT, requestedDisclosure: 'SOURCE_AND_BASIS' });
    expect(absentView.state).toBe('INCONCLUSIVE');
    expect(inconclusiveView.diagnostics).toContainEqual(expect.objectContaining({ code: 'LEDGER_UNAVAILABLE' }));
  });

  it('LPR-QA-06 exposes no writer capability in any view', async () => {
    const view = await present(buildModel());
    expect(view.capabilities).toEqual({ canMutate: false, canVerify: false, canUpload: false });
  });

  it('LPR-QA-07 accepts a query contract with only fingerprint, optional node and disclosure', async () => {
    const contract = await loadContract();
    expect(contract.inspectPassportProjectionQueryContract()).toEqual({
      allowedFields: ['sourceFingerprint', 'nodeId', 'requestedDisclosure'],
      forbiddenFields: expect.arrayContaining(['sourceBytes', 'providerId', 'targetState', 'decision', 'url', 'credential', 'command']),
    });
  });

  it('LPR-QA-08 renders captured source as requires-core-Lean without a workflow conclusion', async () => {
    const view = await present(buildModel());
    expect(view.state).toBe('SOURCE_CAPTURED');
    expect(view.basis.diagnostic).toBe('REQUIRES_CORE_LEAN');
  });

  it('LPR-QA-09 keeps local diagnostics outside Lean-kernel authority', async () => {
    const view = await present(buildModel({ listObservations: () => [{ fingerprint: FINGERPRINT, status: 'LOCAL_DIAGNOSTIC_ONLY', authority: 'LOCAL', reason: 'syntax advisory' }] }));
    expect(view.state).toBe('DIAGNOSTIC_ONLY');
    expect(view.basis).toMatchObject({ diagnostic: 'LOCAL_DIAGNOSTIC_ONLY' });
    expect(view.basis.lean).not.toBe('LEAN_KERNEL_VERIFIED');
  });

  it('LPR-QA-10 keeps hosted advisory outside Lean-kernel authority and provider dispatch', async () => {
    const view = await present(buildModel({ listObservations: () => [{ fingerprint: FINGERPRINT, status: 'HOSTED_ADVISORY_ONLY', authority: 'HOSTED', reason: 'hosted advisory' }] }));
    expect(view.state).toBe('DIAGNOSTIC_ONLY');
    expect(view.basis).toMatchObject({ diagnostic: 'HOSTED_ADVISORY_ONLY' });
  });

  it('LPR-QA-11 keeps manual observations diagnostic-only', async () => {
    const view = await present(buildModel({ listObservations: () => [{ fingerprint: FINGERPRINT, status: 'LOCAL_DIAGNOSTIC_ONLY', authority: 'MANUAL', reason: 'manual transcript' }] }));
    expect(view.state).toBe('DIAGNOSTIC_ONLY');
    expect(view.basis.lean).toBeUndefined();
  });

  it('LPR-QA-12 makes unavailable default deterministic and non-demoting', async () => {
    const contract = await loadContract();
    const view = contract.createLeanPassportProjection(contract.createUnavailablePassportReadModel()).present({ sourceFingerprint: FINGERPRINT, requestedDisclosure: 'SOURCE_AND_BASIS' });
    expect(view.state).toBe('INCONCLUSIVE');
    expect(view.basis.diagnostic).toBe('REQUIRES_CORE_LEAN');
  });

  it('LPR-QA-13 never treats an uncorrelated kernel fact as a verified Passport', async () => {
    const kernel: KernelFact = { sourceFingerprint: FINGERPRINT, toolchain: 'lean-4', command: 'lean file.lean', compilerOutput: 'ok', axiomReport: '#print axioms', runnerIdentity: 'runner', signature: 'signature', imageOrLock: 'lock' };
    const view = await present(buildModel({ findKernelFact: () => found(kernel) }));
    expect(view.state).toBe('INCONCLUSIVE');
    expect(view.basis.lean).not.toBe('LEAN_KERNEL_VERIFIED');
  });

  it('LPR-QA-14 displays only a snapshot-reported kernel basis after exact read-only correlation', async () => {
    const kernel: KernelFact = { sourceFingerprint: FINGERPRINT, toolchain: 'lean-4', command: 'lean file.lean', compilerOutput: 'ok', axiomReport: '#print axioms', runnerIdentity: 'runner', signature: 'signature', imageOrLock: 'lock' };
    const correlation: Correlation = { sourceFingerprint: FINGERPRINT, evidenceFingerprint: FINGERPRINT, authoritySnapshotId: 'snapshot:1', kernelFactFingerprint: FINGERPRINT, basis: 'LEAN_KERNEL_VERIFIED' };
    const view = await present(buildModel({ findKernelFact: () => found(kernel), findCorrelation: () => found(correlation) }));
    expect(view.state).toBe('CORRELATED_READ_ONLY');
    expect(view.basis.lean).toBe('LEAN_KERNEL_VERIFIED');
    expect(view.capabilities.canMutate).toBe(false);
  });

  it('LPR-QA-15 separates a matching human non-kernel decision from Lean verification', async () => {
    const decision: HumanDecision = { sourceFingerprint: FINGERPRINT, evidenceFingerprint: FINGERPRINT, proposalId: 'proposal:1', actorId: 'owner', decision: 'accept' };
    const view = await present(buildModel({ findHumanDecision: () => found(decision) }));
    expect(view.state).toBe('HUMAN_CONFIRMED_NON_KERNEL');
    expect(view.basis.human).toBe('HUMAN_CONFIRMED_NON_KERNEL');
    expect(view.basis.lean).not.toBe('LEAN_KERNEL_VERIFIED');
  });

  it('LPR-QA-16 preserves RICIS III owner basis separately, including P=NP source', async () => {
    const view = await present(buildModel({ findRicisBasis: () => found({ basis: 'RICIS_III_SOLVED', sourceReference: 'P=NP owner-authorized RICIS III source' }) }));
    expect(view.basis.ricis).toBe('RICIS_III_SOLVED');
    expect(view.state).not.toBe('LEAN_KERNEL_VERIFIED');
  });

  it('LPR-QA-17 gives integrity and unavailable conditions precedence over friendly badges', async () => {
    const view = await present(buildModel({
      listObservations: () => [{ fingerprint: FINGERPRINT, status: 'HOSTED_ADVISORY_ONLY', authority: 'HOSTED', reason: 'advisory' }],
      findCorrelation: () => ({ kind: 'INCONCLUSIVE', reason: 'STALE_SNAPSHOT' }),
    }));
    expect(view.state).toBe('INCONCLUSIVE');
    expect(view.diagnostics).toContainEqual(expect.objectContaining({ code: 'STALE_SNAPSHOT' }));
  });
});
