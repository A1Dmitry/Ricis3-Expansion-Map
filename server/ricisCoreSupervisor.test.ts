import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * BUG-01 regression tests: a missing/unstartable dotnet host must produce a
 * rejected ensureRicisCoreApi() promise (-> honest HTTP 503 from the routes)
 * and must NEVER surface as an unhandled child-process 'error' event that
 * kills the whole Node process.
 */

const PREVIOUS_ENV = { ...process.env };

async function importSupervisor(): Promise<typeof import('./ricisCoreSupervisor')> {
  vi.resetModules();
  return import('./ricisCoreSupervisor');
}

describe('ricisCoreSupervisor spawn safety (BUG-01)', () => {
  let tempRuntimeDir: string;

  beforeEach(() => {
    tempRuntimeDir = mkdtempSync(path.join(tmpdir(), 'ricis-core-supervisor-test-'));
    // A fake bundled DLL so assertCoreRuntime() passes and the launch path
    // reaches the actual dotnet spawn/probe.
    writeFileSync(path.join(tempRuntimeDir, 'Ricis.WebApi.dll'), 'fake-dll');
    process.env.RICIS_CORE_RUNTIME = tempRuntimeDir;
    // Nothing listens on this port: isHealthy() is always false.
    process.env.RICIS_CORE_URL = 'http://127.0.0.1:1';
    process.env.RICIS_CORE_START_TIMEOUT_MS = '3000';
    process.env.RICIS_CORE_DOTNET_BIN = path.join(tempRuntimeDir, 'definitely-missing-dotnet');
  });

  afterEach(() => {
    process.env = { ...PREVIOUS_ENV };
    rmSync(tempRuntimeDir, { recursive: true, force: true });
  });

  it('rejects with a clear dotnet-host error instead of crashing the process', async () => {
    const supervisor = await importSupervisor();

    await expect(supervisor.ensureRicisCoreApi()).rejects.toThrow(/dotnet host .* is not available/u);
  });

  it('reports the dotnet host in the integration info payload', async () => {
    const supervisor = await importSupervisor();
    const info = supervisor.getRicisCoreIntegrationInfo();
    expect(info.dotnetHost).toContain('definitely-missing-dotnet');
  });

  it('keeps rejecting on repeated calls (no unhandled error leak, no zombie start promise)', async () => {
    const supervisor = await importSupervisor();
    await expect(supervisor.ensureRicisCoreApi()).rejects.toThrow(/dotnet host/u);
    await expect(supervisor.ensureRicisCoreApi()).rejects.toThrow(/dotnet host/u);
  });
});
