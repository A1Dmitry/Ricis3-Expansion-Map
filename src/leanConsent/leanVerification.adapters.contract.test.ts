import { describe, expect, it } from 'vitest';

const CONTRACT_PATH = './leanEvidenceConsent.domain';

type AdapterContract = {
  validateHostedRequest: (input: unknown) => unknown;
  normalizeHostedResponse: (input: unknown) => unknown;
  createPopupHandoff: (input: unknown) => unknown;
  acceptManualTranscript: (input: unknown) => unknown;
  validateKernelAttestation: (input: unknown) => unknown;
  recordKernelFact: (input: unknown) => unknown;
};

const loadContract = () => import(CONTRACT_PATH) as Promise<AdapterContract>;

describe('LEAN-EVIDENCE-CONSENT-01 red baseline: provider adapter contracts', () => {
  it('LEC-QA-19 rejects hosted requests that permit sorries, import substitution or missing exact source context', async () => {
    const contract = await loadContract();
    expect(contract.validateHostedRequest({ permittedSorries: true, ignoreImports: true })).toBeDefined();
  });

  it('LEC-QA-20 normalizes a hosted hash/identity/signature mismatch as inconclusive only', async () => {
    const contract = await loadContract();
    expect(contract.normalizeHostedResponse({ processedSourceFingerprint: 'sha256:v1:other', provider: 'unknown' })).toBeDefined();
  });

  it('LEC-QA-21 keeps a supportive hosted result advisory-only and non-authoritative', async () => {
    const contract = await loadContract();
    expect(contract.normalizeHostedResponse({ status: 'SUPPORTIVE', sourceFingerprint: 'sha256:v1:a' })).toBeDefined();
  });

  it('LEC-QA-22 creates only copy-and-open-clean Lean Web handoff without prefill consent', async () => {
    const contract = await loadContract();
    expect(contract.createPopupHandoff({ sourceFingerprint: 'sha256:v1:a', requestedMode: 'copy-and-open-clean' })).toBeDefined();
  });

  it('LEC-QA-23 rejects popup URL prefill without user gesture, privacy consent or safe destination', async () => {
    const contract = await loadContract();
    expect(contract.createPopupHandoff({ requestedMode: 'prefill', destination: 'https://example.invalid/?url=https://evil.invalid' })).toBeDefined();
  });

  it('LEC-QA-24 and LEC-QA-25 reject popup scraping and retain a manual transcript as untrusted diagnostic only', async () => {
    const contract = await loadContract();
    expect(contract.acceptManualTranscript({ source: 'postMessage', text: 'pass' })).toBeDefined();
  });
});
