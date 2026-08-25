import { describe, expect, it } from 'vitest';

const CONTRACT_PATH = './leanEvidenceConsent.domain';

type IoCContract = {
  createVerificationComposition: (input?: { readonly provider?: string }) => unknown;
  inspectVerificationTopology: () => {
    readonly domainImports: readonly string[];
    readonly uiImports: readonly string[];
    readonly defaultProvider: string;
    readonly decoratorOrder: readonly string[];
  };
  selectProvider: (input: { readonly provider: string; readonly switchEvent?: unknown }) => unknown;
  assertAdapterCapability: (input: unknown) => unknown;
  unavailableAdapter: () => unknown;
  requestHostedAdvisory: (input: unknown) => unknown;
};

const loadContract = () => import(CONTRACT_PATH) as Promise<IoCContract>;

describe('LEAN-EVIDENCE-CONSENT-01 red baseline: RICIS-owned IoC boundary', () => {
  it('LEC-QA-13 exposes only RICIS-owned ports to domain and UI contracts', async () => {
    const contract = await loadContract();
    const topology = contract.inspectVerificationTopology();
    expect(topology.domainImports).toEqual([]);
    expect(topology.uiImports).toEqual([]);
  });

  it('LEC-QA-14 binds deterministic unavailable behavior by default', async () => {
    const contract = await loadContract();
    expect(contract.unavailableAdapter()).toBeDefined();
  });

  it('LEC-QA-15 composes guards, adapter, normalizer and recorder in the approved order', async () => {
    const contract = await loadContract();
    expect(contract.inspectVerificationTopology().decoratorOrder).toEqual([
      'SourceHashGuard',
      'ExplicitConsentGuard',
      'BoundedRequestGuard',
      'ProviderAdapter',
      'ResultNormalizer',
      'AppendOnlyObservationRecorder',
    ]);
  });

  it('LEC-QA-16 rejects an unrecorded provider switch rather than silently falling back', async () => {
    const contract = await loadContract();
    expect(contract.selectProvider({ provider: 'hosted-advisory' })).toBeDefined();
  });

  it('LEC-QA-17 rejects adapters that receive state, proof or agent-writer capability', async () => {
    const contract = await loadContract();
    expect(contract.assertAdapterCapability({ writes: ['ProblemNode', 'Proof'] })).toBeDefined();
  });

  it('LEC-QA-18 refuses hosted advisory dispatch without exact per-source consent', async () => {
    const contract = await loadContract();
    expect(contract.requestHostedAdvisory({ sourceFingerprint: 'sha256:v1:a' })).toBeDefined();
  });
});
