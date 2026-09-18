import { mkdtempSync, rmSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * BUG-01 + incident 2026-09-17 fact B regression:
 * - a missing/unstartable dotnet host must produce a rejected ensureRicisCoreApi()
 *   promise (-> honest HTTP 503) and must NEVER surface as an unhandled
 *   child-process 'error' event that kills the whole Node process;
 * - the host probe must be async (no spawnSync on the request path) and must
 *   cache failures so every subsequent /api/ricis-core/* call does not re-freeze
 *   the event loop.
 */

const PREVIOUS_ENV = { ...process.env };

async function importSupervisor(): Promise<typeof import('./ricisCoreSupervisor')> {
  vi.resetModules();
  return import('./ricisCoreSupervisor');
}

describe('ricisCoreSupervisor spawn safety (BUG-01 + fact B)', () => {
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
    process.env.RICIS_CORE_DOTNET_PROBE_TIMEOUT_MS = '500';
    process.env.RICIS_CORE_DOTNET_PROBE_COOLDOWN_MS = '60_000';
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

  it('does not use spawnSync on the request path (source contract)', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const source = readFileSync(join(process.cwd(), 'server/ricisCoreSupervisor.ts'), 'utf8');
    // Strip block/line comments so historical mentions of spawnSync in prose
    // do not count as executable imports/calls.
    const withoutComments = source
      .replace(/\/\*[\s\S]*?\*\//gu, '')
      .replace(/(^|[^:])\/\/[^\n]*/gu, '$1');
    expect(withoutComments).not.toMatch(/\bspawnSync\b/);
    expect(withoutComments).not.toMatch(/from ['"]node:child_process['"].*spawnSync|spawnSync[, }]/u);
    expect(source).toMatch(/probeDotnetHostAsync/);
    expect(source).toMatch(/DOTNET_PROBE_COOLDOWN_MS/);
  });

  it('caches a failed probe so a slow host is not re-probed within the cooldown window', async () => {
    // Create a "slow" fake host that sleeps longer than the probe timeout.
    const slowHost = path.join(tempRuntimeDir, 'slow-dotnet');
    writeFileSync(
      slowHost,
      `#!/usr/bin/env node\nsetTimeout(() => process.exit(0), 30_000);\n`,
    );
    chmodSync(slowHost, 0o755);
    process.env.RICIS_CORE_DOTNET_BIN = slowHost;
    process.env.RICIS_CORE_DOTNET_PROBE_TIMEOUT_MS = '200';
    process.env.RICIS_CORE_DOTNET_PROBE_COOLDOWN_MS = '60_000';

    const supervisor = await importSupervisor();
    const t0 = Date.now();
    await expect(supervisor.ensureRicisCoreApi()).rejects.toThrow(/dotnet host/u);
    const firstMs = Date.now() - t0;
    expect(firstMs).toBeLessThan(3_000);

    // Second call must hit the cooldown cache and return immediately.
    const t1 = Date.now();
    await expect(supervisor.ensureRicisCoreApi()).rejects.toThrow(/dotnet host/u);
    const secondMs = Date.now() - t1;
    expect(secondMs).toBeLessThan(500);
  });
});
