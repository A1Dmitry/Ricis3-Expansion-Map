import { describe, expect, it } from 'vitest';

const CONTRACT_PATH = './leanPassportProjection.domain';
const FINGERPRINT = `sha256:v1:${'e'.repeat(64)}`;

type ProjectionContract = {
  readonly createUnavailablePassportReadModel: () => {
    readonly findSource: (fingerprint: string) => { readonly kind: string };
    readonly listObservations: (fingerprint: string) => readonly unknown[];
    readonly findKernelFact: (fingerprint: string) => { readonly kind: string };
    readonly findHumanDecision: (fingerprint: string) => { readonly kind: string };
    readonly findCorrelation: (fingerprint: string) => { readonly kind: string };
    readonly findRicisBasis: (nodeId?: string) => { readonly kind: string };
    readonly findAgentConflict: (fingerprint: string) => { readonly kind: string };
    readonly findLegacyExternalLean: (nodeId?: string) => { readonly kind: string };
  };
  readonly inspectLeanPassportProjectionTopology: () => {
    readonly domainImports: readonly string[];
    readonly uiImports: readonly string[];
    readonly runtimeCalls: readonly string[];
    readonly ownedOperations: readonly string[];
    readonly forbiddenCapabilities: readonly string[];
    readonly legacyCandidateImports: readonly string[];
  };
  readonly inspectPassportProjectionQueryContract: () => {
    readonly allowedFields: readonly string[];
    readonly forbiddenFields: readonly string[];
  };
  readonly createLeanPassportProjection: (readModel: unknown) => {
    readonly present: (query: { readonly sourceFingerprint: string; readonly requestedDisclosure: 'SOURCE_AND_BASIS' }) => {
      readonly state: string;
      readonly capabilities: { readonly canMutate: false; readonly canVerify: false; readonly canUpload: false };
    };
  };
};

const loadContract = () => import(CONTRACT_PATH) as Promise<ProjectionContract>;

const forbiddenImports = [
  'mapStore', 'persistence', 'react', 'fetch', 'http', 'axios', 'AXLE', 'live.lean.org', 'github', 'docker', 'ci',
  'window.open', 'postMessage', 'WebSocket', 'child_process', 'RicisWasmBridge', 'agentGateway', 'lean', 'lake', 'elan',
  'authoritativeProofStatePolicy', 'leanEvidenceConsent.domain', 'leanPassport', 'template',
];

describe('RICIS-LEAN-PASSPORT-REVALIDATION-01 red baseline: one-way topology and unavailable default', () => {
  it('LPR-QA-32 provides an unavailable read model that has no provider, map or runtime dependency', async () => {
    const contract = await loadContract();
    const unavailable = contract.createUnavailablePassportReadModel();
    const view = contract.createLeanPassportProjection(unavailable).present({ sourceFingerprint: FINGERPRINT, requestedDisclosure: 'SOURCE_AND_BASIS' });
    expect(unavailable.findSource(FINGERPRINT)).toEqual({ kind: 'INCONCLUSIVE', reason: 'PASSPORT_READ_MODEL_UNAVAILABLE' });
    expect(view.state).toBe('INCONCLUSIVE');
    expect(view.capabilities).toEqual({ canMutate: false, canVerify: false, canUpload: false });
  });

  it('LPR-QA-33 has no forbidden provider, browser, process, Core, agent or compiler import/call topology', async () => {
    const contract = await loadContract();
    const topology = contract.inspectLeanPassportProjectionTopology();
    const allTopology = [...topology.domainImports, ...topology.uiImports, ...topology.runtimeCalls];
    for (const forbidden of forbiddenImports) {
      expect(allTopology.join('\n').toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
    expect(topology.domainImports).toEqual([]);
    expect(topology.uiImports).toEqual([]);
    expect(topology.runtimeCalls).toEqual([]);
  });

  it('LPR-QA-34 preserves one-way dependency: read contracts only, no consent/private map/state-policy/Core writer', async () => {
    const contract = await loadContract();
    const topology = contract.inspectLeanPassportProjectionTopology();
    expect(topology.forbiddenCapabilities).toEqual(expect.arrayContaining([
      'SOURCE_CAPTURE', 'EVIDENCE_WRITE', 'STATE_WRITE', 'PROOF_WRITE', 'AXIOM_WRITE', 'TRUST_WRITE',
      'PROVIDER_SELECT', 'NETWORK', 'POPUP', 'TRAINING', 'CORE_WRITE',
    ]));
    expect(topology.ownedOperations).toEqual([]);
  });

  it('LPR-QA-35 identifies no legacy candidate namespace, import or metadata reuse', async () => {
    const contract = await loadContract();
    expect(contract.inspectLeanPassportProjectionTopology().legacyCandidateImports).toEqual([]);
  });

});
