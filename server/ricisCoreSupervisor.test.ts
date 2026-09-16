import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

type SupervisorModule = typeof import('./ricisCoreSupervisor');

async function loadSupervisorWithEnv(env: Record<string, string>): Promise<SupervisorModule> {
  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key, value);
  }
  vi.resetModules();
  return import('./ricisCoreSupervisor');
}

/** A PATH directory with no executables at all — `dotnet` cannot be found. */
function makeEmptyBinDir(): string {
  return mkdtempSync(join(tmpdir(), 'ricis-no-dotnet-'));
}

/**
 * A PATH directory whose only executable is a fake `dotnet` that answers
 * `--version` normally but dies when actually launched — simulates an
 * installed .NET runtime whose core process fails to start.
 */
function makeBrokenDotnetDir(exitCode: number): string {
  const dir = mkdtempSync(join(tmpdir(), 'ricis-fake-dotnet-'));
  const dotnet = join(dir, 'dotnet');
  writeFileSync(
    dotnet,
    `#!/bin/sh\nif [ "$1" = "--version" ]; then echo "8.0.0-fake"; exit 0; fi\necho "fake dotnet failure" 1>&2\nexit ${exitCode}\n`,
  );
  chmodSync(dotnet, 0o755);
  return dir;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('ricisCoreSupervisor (BUG-01 regression: one request must never kill the server)', () => {
  it('rejects cleanly when dotnet is missing — no unhandled "error" event, no process crash', async () => {
    const supervisor = await loadSupervisorWithEnv({
      RICIS_CORE_URL: 'http://127.0.0.1:59999',
      RICIS_CORE_START_TIMEOUT_MS: '2000',
      PATH: makeEmptyBinDir(),
    });

    const info = supervisor.getRicisCoreIntegrationInfo();
    expect(info.dotnet.available).toBe(false);

    // The old code spawned anyway, then died from an unhandled 'error' event
    // (spawn dotnet ENOENT). Now the probe fails before spawn with a clean,
    // catchable error that the HTTP layer turns into an honest 503.
    await expect(supervisor.ensureRicisCoreApi()).rejects.toThrow(/dotnet executable not found/i);
  }, 15000);

  it('fails fast when the dotnet process dies instead of waiting for the full start timeout', async () => {
    const supervisor = await loadSupervisorWithEnv({
      RICIS_CORE_URL: 'http://127.0.0.1:59999',
      RICIS_CORE_START_TIMEOUT_MS: '60000', // would hang a full minute with the old code
      PATH: makeBrokenDotnetDir(3),
    });

    const startedAt = Date.now();
    await expect(supervisor.ensureRicisCoreApi()).rejects.toThrow(/exited before becoming healthy/i);
    // The fake dotnet exits immediately; the supervisor must notice within a
    // couple of poll cycles, long before the configured 60s timeout.
    expect(Date.now() - startedAt).toBeLessThan(10_000);
  }, 20000);

  it('survives consecutive failed launches and keeps reporting honest state', async () => {
    const supervisor = await loadSupervisorWithEnv({
      RICIS_CORE_URL: 'http://127.0.0.1:59999',
      RICIS_CORE_START_TIMEOUT_MS: '3000',
      PATH: makeEmptyBinDir(),
    });

    await expect(supervisor.ensureRicisCoreApi()).rejects.toThrow(/dotnet executable not found/i);
    // A second visitor hitting the same endpoint must get the same clean
    // error — not a crash and not a stale in-flight promise.
    await expect(supervisor.ensureRicisCoreApi()).rejects.toThrow(/dotnet executable not found/i);
    expect(supervisor.getRicisCoreIntegrationInfo().running).toBe(false);
  }, 15000);
});
