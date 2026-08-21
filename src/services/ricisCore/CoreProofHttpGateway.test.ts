import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProofRunResponse } from './IRicisProofGateway';
import { CoreProofHttpGateway } from './CoreProofHttpGateway';

const runFixture: ProofRunResponse = {
  apiVersion: 'v1',
  proofRunId: '00000000-0000-4000-8000-000000000001',
  correlationId: 'proof-correlation-001',
  createdAtUtc: '2026-08-21T00:00:00.000Z',
  expiresAtUtc: '2026-08-21T00:15:00.000Z',
  coreVersion: '8.0.0',
  canonicalClaim: 'x => x',
  normalizedClaim: 'x => x',
  structuralVerification: 'StructurallyVerified',
  trustStatus: 'RequiresCoreLean',
  evidenceBoundaryResourceKey: 'proof.core.lean.requiresCore',
  trace: [],
  documents: [{ format: 'Json', contentHash: 'a'.repeat(64) }],
};

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CoreProofHttpGateway', () => {
  it('sends createRun only to the fixed Core v1 route and accepts a complete authoritative snapshot', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse(runFixture));
    vi.stubGlobal('fetch', fetchSpy);
    const gateway = new CoreProofHttpGateway(() => ({ baseUrl: '/api/ricis-core', source: 'same_origin' }));

    const result = await gateway.createRun({
      claim: 'x => x',
      expected: 'x => x',
      requestedFormats: ['Json'],
    });

    expect(result).toEqual(runFixture);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith('/api/ricis-core/proofs/v1/runs', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ apiVersion: 'v1', claim: 'x => x', expected: 'x => x', requestedFormats: ['Json'] }),
      signal: expect.any(AbortSignal),
    });
  });

  it('turns a malformed 2xx body into typed Core recovery without any fallback result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ apiVersion: 'v1', proofRunId: runFixture.proofRunId })));
    const result = await new CoreProofHttpGateway(() => ({ baseUrl: '/api/ricis-core', source: 'same_origin' })).getRun(runFixture.proofRunId);

    expect(result).toMatchObject({ success: false, code: 'CORE_INVALID_RESPONSE' });
    expect('invariant' in result).toBe(false);
    expect('proof' in result).toBe(false);
  });

  it('rejects invalid run IDs and formats before fetch, preventing path injection', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const gateway = new CoreProofHttpGateway(() => ({ baseUrl: '/api/ricis-core', source: 'same_origin' }));

    const invalidId = await gateway.getRun('../secrets');
    const invalidFormat = await gateway.getDocument(runFixture.proofRunId, 'Json/../../escape' as never);

    expect(invalidId).toMatchObject({ success: false, code: 'CORE_INPUT_REJECTED' });
    expect(invalidFormat).toMatchObject({ success: false, code: 'CORE_INPUT_REJECTED' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('uses fixed GET document and capability routes and validates their compact v1 payloads', async () => {
    const documentFixture = {
      apiVersion: 'v1',
      proofRunId: runFixture.proofRunId,
      correlationId: runFixture.correlationId,
      format: 'Json',
      contentType: 'application/json',
      content: '{"proofRunId":"00000000-0000-4000-8000-000000000001"}',
      contentHash: 'a'.repeat(64),
      trustStatus: 'RequiresCoreLean',
      evidenceBoundaryResourceKey: 'proof.core.lean.requiresCore',
    };
    const capabilitiesFixture = {
      apiVersion: 'v1',
      scenarios: ['ExpressionEquivalence'],
      formats: ['Academic', 'Json', 'Latex', 'Log'],
      leanBoundaryResourceKey: 'proof.core.lean.genericUnsupported',
      isDurableSnapshotStore: false,
    };
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce(jsonResponse(documentFixture))
      .mockResolvedValueOnce(jsonResponse(capabilitiesFixture));
    vi.stubGlobal('fetch', fetchSpy);
    const gateway = new CoreProofHttpGateway(() => ({ baseUrl: '/api/ricis-core', source: 'same_origin' }));

    await expect(gateway.getDocument(runFixture.proofRunId, 'Json')).resolves.toEqual(documentFixture);
    await expect(gateway.getCapabilities()).resolves.toEqual(capabilitiesFixture);
    expect(fetchSpy.mock.calls.map(([url]) => url)).toEqual([
      `/api/ricis-core/proofs/v1/runs/${runFixture.proofRunId}/documents/Json`,
      '/api/ricis-core/proofs/v1/capabilities',
    ]);
  });
});
