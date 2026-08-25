import { describe, expect, it } from 'vitest';

const CONTRACT_PATH = './leanPassportProjection.domain';
const FINGERPRINT = `sha256:v1:${'f'.repeat(64)}`;

type ProjectionContract = {
  readonly inspectLeanPassportProjectionTopology: () => {
    readonly compatibilityGuarantees: readonly string[];
    readonly immutableBoundaries: readonly string[];
    readonly releasePolicy: {
      readonly minimumNextPatchAfter: string;
      readonly currentCandidateMaySetVersion: false;
      readonly currentCandidateMayPublish: false;
    };
  };
  readonly createLeanPassportProjection: (readModel: {
    readonly findSource: () => unknown;
    readonly listObservations: () => readonly unknown[];
    readonly findKernelFact: () => unknown;
    readonly findHumanDecision: () => unknown;
    readonly findCorrelation: () => unknown;
    readonly findRicisBasis: () => unknown;
    readonly findAgentConflict: () => unknown;
    readonly findLegacyExternalLean: () => unknown;
  }) => {
    readonly present: (query: { readonly sourceFingerprint: string; readonly nodeId?: string; readonly requestedDisclosure: 'SOURCE_AND_BASIS' }) => unknown;
  };
};

const loadContract = () => import(CONTRACT_PATH) as Promise<ProjectionContract>;
const absent = () => ({ kind: 'ABSENT' } as const);

const safeReadModel = () => ({
  findSource: () => ({ kind: 'FOUND', value: { fingerprint: FINGERPRINT, sourceName: 'owner.lean', sourceBytes: new TextEncoder().encode('theorem owner : True := by trivial'), byteLength: 40, idempotencyKey: 'owner-capture' } } as const),
  listObservations: () => [],
  findKernelFact: () => absent(),
  findHumanDecision: () => absent(),
  findCorrelation: () => absent(),
  findRicisBasis: () => absent(),
  findAgentConflict: () => absent(),
  findLegacyExternalLean: () => absent(),
});

describe('RICIS-LEAN-PASSPORT-REVALIDATION-01 red baseline: regression and immutable release boundaries', () => {
  it('LPR-QA-36 declares published consent-preservation regressions as mandatory related QA', async () => {
    const contract = await loadContract();
    expect(contract.inspectLeanPassportProjectionTopology().compatibilityGuarantees).toEqual(expect.arrayContaining([
      'LEAN_CONSENT_SOURCE_PRESERVATION',
      'NO_AUTOMATIC_STATE_DEMOTION',
      'BROWSER_SELF_CERTIFICATION_FORBIDDEN',
    ]));
  });

  it('LPR-QA-37 declares OIR source preservation as a mandatory related QA boundary', async () => {
    const contract = await loadContract();
    expect(contract.inspectLeanPassportProjectionTopology().compatibilityGuarantees).toEqual(expect.arrayContaining([
      'OIR_PROOF_LATEX_EXTERNAL_LEAN_IDENTITY_PRESERVED',
      'NO_TEMPLATE_PROOF_REWRITE',
    ]));
  });

  it('LPR-QA-38 preserves immutable RICIS III and owner-source boundaries without mutation semantics', async () => {
    const contract = await loadContract();
    expect(contract.inspectLeanPassportProjectionTopology().immutableBoundaries).toEqual(expect.arrayContaining([
      'RICIS_III_V7_7', 'L0', 'L1', 'SP1', 'SP2', 'SP3', 'SP4', 'A1', 'A4', 'A5', 'A6', 'A7', 'A10',
      'OWNER_AUTHORIZED_P_EQUALS_NP', 'USER_LEAN_TEX_EXACT_SOURCE',
    ]));
    const view = contract.createLeanPassportProjection(safeReadModel()).present({ sourceFingerprint: FINGERPRINT, nodeId: 'informatics-complexity', requestedDisclosure: 'SOURCE_AND_BASIS' });
    expect(JSON.stringify(view)).not.toContain('classical hypothesis');
  });

  it('LPR-QA-39 leaves versioning outside the red baseline and reserves a new patch after v0.4.44', async () => {
    const contract = await loadContract();
    const policy = contract.inspectLeanPassportProjectionTopology().releasePolicy;
    expect(policy.minimumNextPatchAfter).toBe('0.4.44');
    expect(policy.currentCandidateMaySetVersion).toBe(false);
  });

  it('LPR-QA-40 never grants commit, push or publication authority from a Passport contract', async () => {
    const contract = await loadContract();
    expect(contract.inspectLeanPassportProjectionTopology().releasePolicy.currentCandidateMayPublish).toBe(false);
  });
});
