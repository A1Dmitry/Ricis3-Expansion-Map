import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CoreExecutionFailure } from './ricisCore/IRicisCoreEngine';
import {
  isCoreRecoveryRoute,
  probeRicisCoreHealth,
  readStoredCoreRecovery,
  returnFromCoreRecovery,
  writeCoreRecovery,
} from './coreRecovery';

function failure(overrides: Partial<CoreExecutionFailure> = {}): CoreExecutionFailure {
  return {
    success: false,
    code: 'CORE_UNAVAILABLE',
    userMessage: 'Ricis.Core unavailable.',
    diagnostic: {
      origin: 'terminal',
      runtime: 'not_ready',
      retryable: true,
      safeDetail: 'health check failed',
      occurredAt: 1_700_000_000_000,
    },
    ...overrides,
  };
}

describe('core recovery routing', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', 'http://localhost:3000/');
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('stores a sanitised diagnostic and keeps expression-like details out of the URL', () => {
    const coreFailure = failure({
      userMessage: 'Core rejected x => secretToken / 0',
      diagnostic: {
        ...failure().diagnostic,
        safeDetail: 'Expression: x => secretToken / 0\nStack: hidden',
      },
    });

    writeCoreRecovery(coreFailure);

    expect(isCoreRecoveryRoute(window.location.search)).toBe(true);
    expect(window.location.search).toContain('code=CORE_UNAVAILABLE');
    expect(window.location.search).toContain('origin=terminal');
    expect(window.location.href).not.toContain('secretToken');
    expect(window.location.href).not.toContain('Stack');

    const stored = readStoredCoreRecovery(window.location.search);
    expect(stored.code).toBe('CORE_UNAVAILABLE');
    expect(stored.diagnostic.origin).toBe('terminal');
    expect(stored.diagnostic.safeDetail).toContain('secretToken');
  });

  it('renders a safe default when session storage has no recovery DTO', () => {
    window.history.replaceState({}, '', 'http://localhost:3000/?view=core-recovery&code=CORE_INPUT_REJECTED&origin=node_trace');

    const stored = readStoredCoreRecovery(window.location.search);

    expect(stored.code).toBe('CORE_INPUT_REJECTED');
    expect(stored.diagnostic.origin).toBe('node_trace');
    expect(stored.userMessage).toContain('отклонил');
  });

  it('normalises untrusted query values to a controlled infrastructure status', () => {
    window.history.replaceState({}, '', 'http://localhost:3000/?view=core-recovery&code=alert(1)&origin=<script>');

    const stored = readStoredCoreRecovery(window.location.search);

    expect(stored.code).toBe('CORE_INFRASTRUCTURE_ERROR');
    expect(stored.diagnostic.origin).toBe('unknown');
  });

  it('removes only recovery query parameters when returning to the map', () => {
    window.history.replaceState({}, '', 'http://localhost:3000/?node=NAV_STOKES&view=core-recovery&code=CORE_UNAVAILABLE&origin=terminal');

    returnFromCoreRecovery();

    expect(window.location.search).toBe('?node=NAV_STOKES');
  });

  it('checks Core health without evaluating a fallback expression', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ready' }),
    }));

    await expect(probeRicisCoreHealth()).resolves.toEqual({ available: true });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(init.headers).toEqual({ accept: 'application/json' });
    // Incident 2026-09-17 CM-4: health probe must carry a client-side deadline.
    expect(init.signal).toBeDefined();
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});
