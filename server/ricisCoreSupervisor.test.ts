// @vitest-environment node
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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

/**
 * Incident 2026-09-17 (finding B) regression tests: the dotnet probe must not block
 * the event loop, must be bounded in time, and must not be repeated on every request
 * while the host is known to be unavailable.
 */
describe('ricisCoreSupervisor dotnet probe does not freeze the server (incident 2026-09-17)', () => {
  let tempRuntimeDir: string;

  beforeEach(() => {
    tempRuntimeDir = mkdtempSync(path.join(tmpdir(), 'ricis-core-supervisor-probe-'));
    writeFileSync(path.join(tempRuntimeDir, 'Ricis.WebApi.dll'), 'fake-dll');
    process.env.RICIS_CORE_RUNTIME = tempRuntimeDir;
    process.env.RICIS_CORE_URL = 'http://127.0.0.1:1';
    process.env.RICIS_CORE_START_TIMEOUT_MS = '3000';
  });

  afterEach(() => {
    process.env = { ...PREVIOUS_ENV };
    rmSync(tempRuntimeDir, { recursive: true, force: true });
  });

  it('keeps the event loop responsive while a slow dotnet host is being probed, and gives up within the probe budget', async () => {
    const slowHost = path.join(tempRuntimeDir, 'slow-dotnet.sh');
    writeFileSync(slowHost, '#!/bin/sh\nsleep 30\n');
    chmodSync(slowHost, 0o755);
    process.env.RICIS_CORE_DOTNET_BIN = slowHost;
    process.env.RICIS_CORE_DOTNET_PROBE_TIMEOUT_MS = '400';

    const supervisor = await importSupervisor();

    // Independent heartbeat: with the old spawnSync probe (timeout 10 s) no timer
    // could fire until the child returned — the whole HTTP server was frozen.
    let ticks = 0;
    const heartbeat = setInterval(() => { ticks += 1; }, 20);
    const startedAt = Date.now();
    try {
      await expect(supervisor.ensureRicisCoreApi()).rejects.toThrow(/did not answer the version probe within 400 ms/u);
    } finally {
      clearInterval(heartbeat);
    }
    const elapsed = Date.now() - startedAt;

    expect(elapsed).toBeLessThan(3_000);
    expect(ticks).toBeGreaterThanOrEqual(5);
  });

  it('caches a failed probe verdict so repeated requests do not re-spawn the host during the cooldown', async () => {
    const countingHost = path.join(tempRuntimeDir, 'counting-dotnet.sh');
    const counterFile = path.join(tempRuntimeDir, 'invocations');
    writeFileSync(counterFile, '');
    writeFileSync(countingHost, `#!/bin/sh\nprintf x >> "${counterFile}"\nexit 3\n`);
    chmodSync(countingHost, 0o755);
    process.env.RICIS_CORE_DOTNET_BIN = countingHost;
    process.env.RICIS_CORE_PROBE_COOLDOWN_MS = '60000';

    const supervisor = await importSupervisor();
    const { readFileSync } = await import('node:fs');

    await expect(supervisor.ensureRicisCoreApi()).rejects.toThrow(/failed the version probe \(exit code 3/u);
    await expect(supervisor.ensureRicisCoreApi()).rejects.toThrow(/failed the version probe \(exit code 3/u);
    await expect(supervisor.ensureRicisCoreApi()).rejects.toThrow(/failed the version probe \(exit code 3/u);

    expect(readFileSync(counterFile, 'utf8')).toBe('x');
    expect(supervisor.getRicisCoreIntegrationInfo().dotnetProbe).toBe('failed');
  });

  it('shares one in-flight probe between concurrent requests', async () => {
    const countingHost = path.join(tempRuntimeDir, 'concurrent-dotnet.sh');
    const counterFile = path.join(tempRuntimeDir, 'concurrent-invocations');
    writeFileSync(counterFile, '');
    writeFileSync(countingHost, `#!/bin/sh\nprintf x >> "${counterFile}"\nsleep 0.2\nexit 0\n`);
    chmodSync(countingHost, 0o755);
    process.env.RICIS_CORE_DOTNET_BIN = countingHost;
    // The host "works", so the launch proceeds to spawning the fake dll with the same
    // script and then waits for health that never comes; keep that wait short.
    process.env.RICIS_CORE_START_TIMEOUT_MS = '600';

    const supervisor = await importSupervisor();
    const { readFileSync } = await import('node:fs');

    const results = await Promise.allSettled([
      supervisor.ensureRicisCoreApi(),
      supervisor.ensureRicisCoreApi(),
      supervisor.ensureRicisCoreApi(),
    ]);

    expect(results.every((result) => result.status === 'rejected')).toBe(true);
    // One probe (+ the actual launch spawn of the same script) — never three probes.
    expect(readFileSync(counterFile, 'utf8').length).toBeLessThanOrEqual(2);
    expect(supervisor.getRicisCoreIntegrationInfo().dotnetProbe).toBe('ok');
  });
});
