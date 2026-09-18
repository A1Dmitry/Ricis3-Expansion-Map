import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const CORE_PORT = Number(process.env.RICIS_CORE_PORT || 5044);
const CORE_URL = process.env.RICIS_CORE_URL || `http://127.0.0.1:${CORE_PORT}`;
const DOTNET_BIN = process.env.RICIS_CORE_DOTNET_BIN || 'dotnet';
const CORE_REPO = path.resolve(process.cwd(), process.env.RICIS_CORE_REPO || '../Ricis.Core');
const CORE_RUNTIME = path.resolve(process.cwd(), process.env.RICIS_CORE_RUNTIME || 'runtime/ricis-core');
const CORE_DLL = path.resolve(CORE_RUNTIME, 'Ricis.WebApi.dll');
const CORE_PROJECT = path.resolve(
  CORE_REPO,
  process.env.RICIS_CORE_PROJECT || 'Ricis.WebApi/Ricis.WebApi.csproj',
);

/** Hard cap for the async `dotnet --version` probe (incident 2026-09-17 fact B). */
const DOTNET_PROBE_TIMEOUT_MS = Number(process.env.RICIS_CORE_DOTNET_PROBE_TIMEOUT_MS || 2_000);
/**
 * After a failed host probe, skip re-probing for this long so every
 * `/api/ricis-core/*` call does not re-freeze the event loop.
 */
const DOTNET_PROBE_COOLDOWN_MS = Number(process.env.RICIS_CORE_DOTNET_PROBE_COOLDOWN_MS || 30_000);

let coreProcess: ChildProcess | null = null;
let startPromise: Promise<void> | null = null;
let lastLaunchError: string | null = null;

/** Cached result of the async `dotnet --version` probe (null = not yet probed). */
let dotnetHostProbe: { readonly ok: true } | { readonly ok: false; readonly error: string } | null = null;
let dotnetHostProbePromise: Promise<void> | null = null;
let dotnetHostProbeFailedAt = 0;

function healthUrl(): string {
  return `${CORE_URL.replace(/\/$/, '')}/health`;
}

async function isHealthy(): Promise<boolean> {
  try {
    const response = await fetch(healthUrl(), { signal: AbortSignal.timeout(750) });
    return response.ok;
  } catch {
    return false;
  }
}

function assertCoreRuntime(): void {
  if (existsSync(CORE_DLL)) return;
  if (existsSync(CORE_PROJECT)) return;
  throw new Error(
    `Ricis.Core runtime was not found. Checked bundled path ${path.relative(process.cwd(), CORE_DLL)} ` +
    `and source project ${path.relative(process.cwd(), CORE_PROJECT)}.`,
  );
}

/**
 * Async `dotnet --version` probe. Replaces the previous `spawnSync` call that
 * blocked the Node event loop for up to 10 s on every request when the host
 * was missing or slow (incident 2026-09-17 fact B: measured 9.7 s freeze +
 * ECONNRESET on GET /). Result is cached for the process lifetime on success
 * and for DOTNET_PROBE_COOLDOWN_MS on failure.
 */
function probeDotnetHostAsync(): Promise<void> {
  if (dotnetHostProbe?.ok === true) {
    return Promise.resolve();
  }
  if (
    dotnetHostProbe?.ok === false &&
    Date.now() - dotnetHostProbeFailedAt < DOTNET_PROBE_COOLDOWN_MS
  ) {
    return Promise.reject(new Error(dotnetHostProbe.error));
  }
  if (dotnetHostProbePromise) {
    return dotnetHostProbePromise;
  }

  dotnetHostProbePromise = new Promise<void>((resolve, reject) => {
    let settled = false;
    const child = spawn(DOTNET_BIN, ['--version'], {
      stdio: 'ignore',
    });

    const finish = (error: Error | null): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        child.kill('SIGKILL');
      } catch {
        // already exited
      }
      if (error) {
        const message =
          `dotnet host "${DOTNET_BIN}" is not available: ${error.message}. ` +
          'Install the .NET SDK/Runtime or unset the Ricis.Core supervisor routes.';
        dotnetHostProbe = { ok: false, error: message };
        dotnetHostProbeFailedAt = Date.now();
        reject(new Error(message));
        return;
      }
      dotnetHostProbe = { ok: true };
      resolve();
    };

    const timer = setTimeout(() => {
      finish(new Error(`version probe timed out after ${DOTNET_PROBE_TIMEOUT_MS}ms`));
    }, DOTNET_PROBE_TIMEOUT_MS);

    child.once('error', (error: Error) => {
      finish(error);
    });
    child.once('exit', (code, signal) => {
      if (code === 0) {
        finish(null);
        return;
      }
      finish(
        new Error(
          `version probe failed (exit code ${code ?? 'null'}, signal ${signal ?? 'none'})`,
        ),
      );
    });
  }).finally(() => {
    dotnetHostProbePromise = null;
  });

  return dotnetHostProbePromise;
}

async function assertDotnetHost(): Promise<void> {
  await probeDotnetHostAsync();
}

async function launchCoreProcess(): Promise<void> {
  if (coreProcess && coreProcess.exitCode === null) return;

  lastLaunchError = null;
  assertCoreRuntime();
  await assertDotnetHost();
  const bundledRuntimeAvailable = existsSync(CORE_DLL);
  const args = bundledRuntimeAvailable
    ? [CORE_DLL, '--urls', CORE_URL]
    : ['run', '--project', CORE_PROJECT, '--no-launch-profile', '--urls', CORE_URL];
  coreProcess = spawn(DOTNET_BIN, args, {
      cwd: bundledRuntimeAvailable ? CORE_RUNTIME : CORE_REPO,
      env: { ...process.env, ASPNETCORE_ENVIRONMENT: process.env.ASPNETCORE_ENVIRONMENT || 'Production' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  coreProcess.stdout?.on('data', (chunk: Buffer) => console.log(`[Ricis.Core] ${chunk.toString().trimEnd()}`));
  coreProcess.stderr?.on('data', (chunk: Buffer) => console.warn(`[Ricis.Core] ${chunk.toString().trimEnd()}`));
  // Mandatory: an 'error' event (e.g. ENOENT when dotnet is missing) must never
  // stay unhandled — that would crash the entire server process.
  coreProcess.once('error', (error: Error) => {
    lastLaunchError = `Failed to start Ricis.Core via "${DOTNET_BIN}": ${error.message}`;
    console.warn(`[Ricis.Core] ${lastLaunchError}`);
    coreProcess = null;
  });
  coreProcess.once('exit', (code, signal) => {
    console.warn(`[Ricis.Core] stopped (code=${code ?? 'null'}, signal=${signal ?? 'none'})`);
    coreProcess = null;
  });
}

export async function ensureRicisCoreApi(): Promise<void> {
  if (await isHealthy()) return;
  if (!startPromise) {
    startPromise = (async () => {
      await launchCoreProcess();
      const deadline = Date.now() + Number(process.env.RICIS_CORE_START_TIMEOUT_MS || 30_000);
      while (Date.now() < deadline) {
        if (lastLaunchError) {
          throw new Error(lastLaunchError);
        }
        if (await isHealthy()) return;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      throw new Error(`Ricis.Core Web API did not become healthy at ${CORE_URL}.`);
    })().finally(() => {
      startPromise = null;
    });
  }
  await startPromise;
}

export async function proxyRicisCoreApi(
  operation: 'simplify' | 'derivative' | 'system',
  body: unknown,
): Promise<{ status: number; body: unknown }> {
  await ensureRicisCoreApi();
  const response = await fetch(`${CORE_URL.replace(/\/$/, '')}/api/expressions/${operation}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // Preserve a non-JSON infrastructure response as text.
  }
  return { status: response.status, body: parsed };
}

export type RicisCoreProofOperation =
  | { readonly kind: 'create'; readonly body: unknown }
  | { readonly kind: 'getRun'; readonly proofRunId: string }
  | { readonly kind: 'getDocument'; readonly proofRunId: string; readonly format: 'Academic' | 'Json' | 'Latex' | 'Log' | 'Lean' }
  | { readonly kind: 'capabilities' };

/**
 * Proxies only the fixed PEP-01 proof-v1 route set to the local C# Core API.
 * The caller provides a typed operation, never an arbitrary upstream path.
 */
export async function proxyRicisCoreProofApi(operation: RicisCoreProofOperation): Promise<{ status: number; body: unknown }> {
  await ensureRicisCoreApi();
  const coreBase = CORE_URL.replace(/\/$/, '');
  const route = operation.kind === 'create'
    ? '/api/proofs/v1/runs'
    : operation.kind === 'getRun'
      ? `/api/proofs/v1/runs/${operation.proofRunId}`
      : operation.kind === 'getDocument'
        ? `/api/proofs/v1/runs/${operation.proofRunId}/documents/${operation.format}`
        : '/api/proofs/v1/capabilities';
  const response = await fetch(`${coreBase}${route}`, {
    method: operation.kind === 'create' ? 'POST' : 'GET',
    headers: operation.kind === 'create'
      ? { 'content-type': 'application/json', accept: 'application/json' }
      : { accept: 'application/json' },
    body: operation.kind === 'create' ? JSON.stringify(operation.body) : undefined,
  });
  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // Preserve a non-JSON infrastructure response as non-authoritative text.
  }
  return { status: response.status, body: parsed };
}

export function getRicisCoreIntegrationInfo() {
  return {
    url: CORE_URL,
    relativeRepository: path.relative(process.cwd(), CORE_REPO) || '.',
    relativeRuntime: path.relative(process.cwd(), CORE_RUNTIME),
    relativeProject: path.relative(process.cwd(), CORE_PROJECT),
    mode: existsSync(CORE_DLL) ? 'bundled-dll' : 'adjacent-source',
    dotnetHost: DOTNET_BIN,
    running: Boolean(coreProcess && coreProcess.exitCode === null),
  };
}

/** Test-only: reset in-memory probe cache between vitest cases. */
export function __resetDotnetHostProbeForTests(): void {
  dotnetHostProbe = null;
  dotnetHostProbePromise = null;
  dotnetHostProbeFailedAt = 0;
  lastLaunchError = null;
  startPromise = null;
  if (coreProcess) {
    try {
      coreProcess.kill('SIGKILL');
    } catch {
      // ignore
    }
    coreProcess = null;
  }
}
