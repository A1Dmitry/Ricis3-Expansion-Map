import { describe, expect, it, vi } from 'vitest';
import { RicisWasmBridge } from './RicisWasmBridge';
import { RicisFallbackEngine } from './RicisFallbackEngine';
import type { IRicisProofGateway, ProofRunResponse } from './IRicisProofGateway';

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
  documents: [],
};

describe('RicisWasmBridge authoritative proof adapter', () => {
  it('delegates createRun to the injected authoritative gateway and does not call the legacy proof engine', async () => {
    const gateway: IRicisProofGateway = {
      createRun: vi.fn().mockResolvedValue(runFixture),
      getRun: vi.fn(),
      getDocument: vi.fn(),
      getCapabilities: vi.fn(),
    };
    const fallbackSpy = vi.spyOn(RicisFallbackEngine.prototype, 'generateFormalProof');
    const bridge = new RicisWasmBridge(gateway);

    await expect(bridge.createRun({ claim: 'x => x', expected: 'x => x', requestedFormats: ['Json'] })).resolves.toEqual(runFixture);
    expect(gateway.createRun).toHaveBeenCalledTimes(1);
    expect(fallbackSpy).not.toHaveBeenCalled();
  });

  it('preserves a gateway failure without calling legacy proveSystem or verifyProofChain', async () => {
    const failure = {
      success: false as const,
      code: 'CORE_UNAVAILABLE' as const,
      userMessage: 'proof.core.gateway.CORE_UNAVAILABLE',
      diagnostic: { origin: 'proof_console' as const, runtime: 'csharp_api' as const, retryable: true, occurredAt: 0 },
    };
    const gateway: IRicisProofGateway = {
      createRun: vi.fn().mockResolvedValue(failure),
      getRun: vi.fn().mockResolvedValue(failure),
      getDocument: vi.fn().mockResolvedValue(failure),
      getCapabilities: vi.fn().mockResolvedValue(failure),
    };
    const proveSystemSpy = vi.spyOn(RicisFallbackEngine.prototype, 'proveSystem');
    const verifySpy = vi.spyOn(RicisFallbackEngine.prototype, 'verifyProofChain');
    const bridge = new RicisWasmBridge(gateway);

    await expect(bridge.getRun('00000000-0000-4000-8000-000000000001')).resolves.toEqual(failure);
    await expect(bridge.getCapabilities()).resolves.toEqual(failure);
    expect(proveSystemSpy).not.toHaveBeenCalled();
    expect(verifySpy).not.toHaveBeenCalled();
  });
});
