import { describe, expect, it } from 'vitest';

const CONTRACT_PATH = './leanPassportProjection.domain';
const FINGERPRINT = `sha256:v1:${'c'.repeat(64)}`;
const EVIDENCE_FINGERPRINT = `sha256:v1:${'d'.repeat(64)}`;

type ReadResult<T> =
  | { readonly kind: 'FOUND'; readonly value: T }
  | { readonly kind: 'ABSENT' }
  | { readonly kind: 'INCONCLUSIVE'; readonly reason: string };

type ProjectionContract = {
  readonly createLeanPassportProjection: (readModel: {
    readonly findSource: () => ReadResult<unknown>;
    readonly listObservations: () => readonly unknown[];
    readonly findKernelFact: () => ReadResult<unknown>;
    readonly findHumanDecision: () => ReadResult<unknown>;
    readonly findCorrelation: () => ReadResult<unknown>;
    readonly findRicisBasis: () => ReadResult<unknown>;
    readonly findAgentConflict: () => ReadResult<unknown>;
    readonly findLegacyExternalLean: () => ReadResult<unknown>;
  }) => {
    readonly present: (query: { readonly sourceFingerprint: string; readonly requestedDisclosure: 'SOURCE_AND_BASIS' | 'SAFE_EVIDENCE_DETAILS' }) => {
      readonly state: string;
      readonly source?: { readonly fingerprint: string; readonly text: string; readonly byteLength: number; readonly redactionPolicyVersion?: string; readonly disclosedOutputFingerprint?: string };
      readonly diagnostics: readonly { readonly code: string; readonly reason: string }[];
      readonly basis: { readonly ricis?: string; readonly lean?: string; readonly human?: string; readonly diagnostic?: string };
      readonly agent?: { readonly competenceState: string; readonly effective: false };
      readonly legacy?: { readonly state: string; readonly sourceHash?: string };
      readonly safeCopyText?: string;
      readonly capabilities: { readonly canMutate: false; readonly canVerify: false; readonly canUpload: false };
    };
  };
};

const loadContract = () => import(CONTRACT_PATH) as Promise<ProjectionContract>;
const found = <T,>(value: T): ReadResult<T> => ({ kind: 'FOUND', value });
const absent = <T,>(): ReadResult<T> => ({ kind: 'ABSENT' });

const canonicalSource = (text = 'theorem safe : True := by trivial') => ({
  fingerprint: FINGERPRINT,
  sourceName: 'safe.lean',
  sourceBytes: new TextEncoder().encode(text),
  byteLength: new TextEncoder().encode(text).byteLength,
  idempotencyKey: 'canonical-capture',
});

const buildModel = (overrides: Record<string, unknown> = {}) => ({
  findSource: () => found(canonicalSource()),
  listObservations: () => [],
  findKernelFact: () => absent(),
  findHumanDecision: () => absent(),
  findCorrelation: () => absent(),
  findRicisBasis: () => absent(),
  findAgentConflict: () => absent(),
  findLegacyExternalLean: () => absent(),
  ...overrides,
});

const present = async (overrides: Record<string, unknown> = {}, disclosure: 'SOURCE_AND_BASIS' | 'SAFE_EVIDENCE_DETAILS' = 'SAFE_EVIDENCE_DETAILS') => {
  const contract = await loadContract();
  return contract.createLeanPassportProjection(buildModel(overrides)).present({ sourceFingerprint: FINGERPRINT, requestedDisclosure: disclosure });
};

describe('RICIS-LEAN-PASSPORT-REVALIDATION-01 red baseline: retention, disclosure and quarantine', () => {
  it('LPR-QA-18 retains static evidence as a diagnostic without destructive rejection or demotion', async () => {
    const view = await present({ listObservations: () => [{ fingerprint: FINGERPRINT, status: 'LOCAL_DIAGNOSTIC_ONLY', authority: 'LOCAL', reason: 'static only' }] });
    expect(view.source?.fingerprint).toBe(FINGERPRINT);
    expect(view.state).toBe('DIAGNOSTIC_ONLY');
    expect(view.diagnostics.some((diagnostic) => diagnostic.code === 'REJECTED')).toBe(false);
  });

  it('LPR-QA-19 makes sorry evidence an integrity diagnostic while retaining source identity', async () => {
    const view = await present({ findKernelFact: () => found({ sourceFingerprint: FINGERPRINT, axiomReport: 'uses sorryAx', toolchain: 'lean-4', command: 'lean file.lean', compilerOutput: 'ok', runnerIdentity: 'runner', signature: 'signature', imageOrLock: 'lock' }) });
    expect(view.state).toBe('INTEGRITY_DIAGNOSTIC');
    expect(view.source?.fingerprint).toBe(FINGERPRINT);
    expect(view.diagnostics).toContainEqual(expect.objectContaining({ code: 'UNSAFE_AXIOM_EVIDENCE' }));
  });

  it('LPR-QA-20 fails closed on a source/evidence/snapshot mismatch without rewriting identity', async () => {
    const view = await present({ findCorrelation: () => found({ sourceFingerprint: EVIDENCE_FINGERPRINT, evidenceFingerprint: EVIDENCE_FINGERPRINT, authoritySnapshotId: 'wrong-source', kernelFactFingerprint: EVIDENCE_FINGERPRINT, basis: 'LEAN_KERNEL_VERIFIED' }) });
    expect(view.state).toBe('INTEGRITY_DIAGNOSTIC');
    expect(view.source?.fingerprint).toBe(FINGERPRINT);
    expect(view.diagnostics).toContainEqual(expect.objectContaining({ code: 'CORRELATION_FINGERPRINT_MISMATCH' }));
  });

  it('LPR-QA-21 refuses stale human context instead of displaying or applying a decision', async () => {
    const view = await present({ findHumanDecision: () => found({ sourceFingerprint: FINGERPRINT, evidenceFingerprint: EVIDENCE_FINGERPRINT, proposalId: 'proposal:stale', actorId: 'owner', decision: 'demote' }) });
    expect(view.state).not.toBe('HUMAN_CONFIRMED_NON_KERNEL');
    expect(view.basis.human).toBeUndefined();
    expect(view.diagnostics).toContainEqual(expect.objectContaining({ code: 'STALE_HUMAN_DECISION_CONTEXT' }));
  });

  it('LPR-QA-22 displays agent conflict as immutable TRAINING_REQUIRED quarantine', async () => {
    const view = await present({ findAgentConflict: () => found({ advisoryFingerprint: FINGERPRINT, kernelFingerprint: EVIDENCE_FINGERPRINT, competenceState: 'TRAINING_REQUIRED', effective: false }) });
    expect(view.agent).toEqual({ competenceState: 'TRAINING_REQUIRED', effective: false });
    expect(view.capabilities).toEqual({ canMutate: false, canVerify: false, canUpload: false });
  });

  it('LPR-QA-23 preserves legacy externalLean provenance exactly when no canonical correlation exists', async () => {
    const legacy = { sourceHash: 'fnv1:legacy-value', source: 'legacy Lean bytes', verified: false };
    const view = await present({ findLegacyExternalLean: () => found(legacy) });
    expect(view.legacy).toEqual({ state: 'LEGACY_PROVENANCE_UNCORRELATED', sourceHash: 'fnv1:legacy-value' });
    expect(legacy).toEqual({ sourceHash: 'fnv1:legacy-value', source: 'legacy Lean bytes', verified: false });
  });

  it('LPR-QA-24 has no generic template, regex rewrite or scalar coercion operation in its public view', async () => {
    const view = await present();
    const serialized = JSON.stringify(view);
    expect(serialized).not.toContain('template');
    expect(serialized).not.toContain('parseFloat');
    expect(serialized).not.toContain('regexRewrite');
  });

  it('LPR-QA-25 escapes hostile source as text and never produces raw HTML', async () => {
    const sourceText = '<script>window.pwned=true</script><img src=x onerror=alert(1)>';
    const view = await present({ findSource: () => found(canonicalSource(sourceText)) });
    expect(view.source?.text).not.toContain('<script>');
    expect(view.source?.text).toContain('&lt;script&gt;');
  });

  it('LPR-QA-26 redacts bearer tokens, private paths and shell-like evidence fragments under a versioned policy', async () => {
    const view = await present({ listObservations: () => [{ fingerprint: FINGERPRINT, status: 'LOCAL_DIAGNOSTIC_ONLY', authority: 'LOCAL', reason: 'Bearer abc.def.ghi /home/owner/private $(rm -rf /)' }] });
    expect(JSON.stringify(view)).not.toContain('abc.def.ghi');
    expect(JSON.stringify(view)).not.toContain('/home/owner/private');
    expect(JSON.stringify(view)).not.toContain('$(rm -rf /)');
    expect(view.source?.redactionPolicyVersion).toBeDefined();
  });

  it('LPR-QA-27 bounds disclosure while retaining canonical byte length and disclosure fingerprint', async () => {
    const oversized = `theorem bounded : True := by\n${'x'.repeat(20_000)}`;
    const view = await present({ findSource: () => found(canonicalSource(oversized)) });
    expect(view.source?.text.length).toBeLessThan(oversized.length);
    expect(view.source?.byteLength).toBe(new TextEncoder().encode(oversized).byteLength);
    expect(view.source?.disclosedOutputFingerprint).toMatch(/^display:v1:/);
  });

  it('LPR-QA-28 emits only local safe copy text without URL, upload or executable command', async () => {
    const view = await present();
    expect(view.safeCopyText).toBeDefined();
    expect(view.safeCopyText).not.toMatch(/https?:\/\//i);
    expect(view.safeCopyText).not.toMatch(/window\.open|upload|curl|lean\s+file/i);
  });

  it('LPR-QA-29 fixes every presentation capability to false', async () => {
    const view = await present();
    expect(view.capabilities).toEqual({ canMutate: false, canVerify: false, canUpload: false });
  });

  it('LPR-QA-30 exposes no credential, popup URL or transport result in a Passport view', async () => {
    const view = await present({ listObservations: () => [{ fingerprint: FINGERPRINT, status: 'HOSTED_ADVISORY_ONLY', authority: 'HOSTED', reason: 'response secret=do-not-disclose' }] });
    const serialized = JSON.stringify(view);
    expect(serialized).not.toContain('do-not-disclose');
    expect(serialized).not.toContain('popupUrl');
    expect(serialized).not.toContain('credential');
  });

  it('LPR-QA-31 converts malformed read data into a safe reason code instead of throwing raw data', async () => {
    const view = await present({ findSource: () => found({ fingerprint: FINGERPRINT, sourceName: 7, sourceBytes: 'not-bytes', byteLength: -1 }) });
    expect(view.state).toBe('INTEGRITY_DIAGNOSTIC');
    expect(view.diagnostics).toContainEqual(expect.objectContaining({ code: 'MALFORMED_SOURCE_SNAPSHOT' }));
  });
});
