import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const CORE_PORT = Number(process.env.RICIS_CORE_PORT || 5044);
const CORE_URL = process.env.RICIS_CORE_URL || `http://127.0.0.1:${CORE_PORT}`;
const CORE_REPO = path.resolve(process.cwd(), process.env.RICIS_CORE_REPO || '../Ricis.Core');
const CORE_RUNTIME = path.resolve(process.cwd(), process.env.RICIS_CORE_RUNTIME || 'runtime/ricis-core');
const CORE_DLL = path.resolve(CORE_RUNTIME, 'Ricis.WebApi.dll');
const CORE_PROJECT = path.resolve(
  CORE_REPO,
  process.env.RICIS_CORE_PROJECT || 'Ricis.WebApi/Ricis.WebApi.csproj',
);

let coreProcess: ChildProcess | null = null;
let startPromise: Promise<void> | null = null;
let lastLaunchError: string | null = null;

type DotnetProbe = { readonly available: boolean; readonly detail: string };

let dotnetProbe: DotnetProbe | null = null;

/**
 * Checks that the `dotnet` executable is reachable on PATH. Cached: the
 * availability of a host runtime does not change for the lifetime of a
 * single server process. BUG-01: spawn() emits 'error' (ENOENT) instead of
 * starting the child when dotnet is missing — we must never rely on that
 * async event for liveness checks.
 */
function probeDotnet(): DotnetProbe {
  if (dotnetProbe) return dotnetProbe;
  let result: DotnetProbe;
  try {
    const probe = spawnSync('dotnet', ['--version'], { stdio: 'ignore', timeout: 10_000 });
    if (probe.error) {
      const errnoCode = (probe.error as NodeJS.ErrnoException).code;
      result = {
        available: false,
        detail: `dotnet executable not found on PATH (${errnoCode ?? probe.error.message})`,
      };
    } else if (probe.status === 0) {
      result = { available: true, detail: 'dotnet runtime available' };
    } else {
      result = { available: false, detail: `dotnet --version exited with code ${probe.status}` };
    }
  } catch (error) {
    result = { available: false, detail: error instanceof Error ? error.message : String(error) };
  }
  dotnetProbe = result;
  return result;
}

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

function assertDotnetRuntime(): void {
  const dotnet = probeDotnet();
  if (!dotnet.available) {
    throw new Error(
      `Ricis.Core cannot be started: ${dotnet.detail}. ` +
      `Install the .NET runtime or point RICIS_CORE_URL at an already running core instance.`,
    );
  }
}

function launchCoreProcess(): void {
  if (coreProcess && coreProcess.exitCode === null) {
    lastLaunchError = null;
    return;
  }

  lastLaunchError = null;
  assertCoreRuntime();
  assertDotnetRuntime();
  const bundledRuntimeAvailable = existsSync(CORE_DLL);
  const args = bundledRuntimeAvailable
    ? [CORE_DLL, '--urls', CORE_URL]
    : ['run', '--project', CORE_PROJECT, '--no-launch-profile', '--urls', CORE_URL];
  const spawned = spawn('dotnet', args, {
      cwd: bundledRuntimeAvailable ? CORE_RUNTIME : CORE_REPO,
      env: { ...process.env, ASPNETCORE_ENVIRONMENT: process.env.ASPNETCORE_ENVIRONMENT || 'Production' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  coreProcess = spawned;

  spawned.stdout?.on('data', (chunk: Buffer) => console.log(`[Ricis.Core] ${chunk.toString().trimEnd()}`));
  spawned.stderr?.on('data', (chunk: Buffer) => console.warn(`[Ricis.Core] ${chunk.toString().trimEnd()}`));
  // BUG-01: without this handler Node throws an unhandled 'error' event
  // (e.g. ENOENT for a missing dotnet) and the whole server process dies.
  spawned.once('error', (error) => {
    lastLaunchError = lastLaunchError ?? `failed to start dotnet process: ${error.message}`;
    console.warn(`[Ricis.Core] ${lastLaunchError}`);
    if (coreProcess === spawned) coreProcess = null;
  });
  spawned.once('exit', (code, signal) => {
    console.warn(`[Ricis.Core] stopped (code=${code ?? 'null'}, signal=${signal ?? 'none'})`);
    if (lastLaunchError === null && (code !== 0 || signal !== null)) {
      lastLaunchError = `dotnet process exited before becoming healthy (code=${code ?? 'null'}, signal=${signal ?? 'none'})`;
    }
    if (coreProcess === spawned) coreProcess = null;
  });
}

export async function ensureRicisCoreApi(): Promise<void> {
  if (await isHealthy()) return;
  if (!startPromise) {
    startPromise = (async () => {
      launchCoreProcess();
      const deadline = Date.now() + Number(process.env.RICIS_CORE_START_TIMEOUT_MS || 30_000);
      while (Date.now() < deadline) {
        if (await isHealthy()) return;
        // Fail fast when the launch itself is known to be broken instead of
        // holding the request until the full start timeout.
        if (lastLaunchError) throw new Error(lastLaunchError);
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
    running: Boolean(coreProcess && coreProcess.exitCode === null),
    dotnet: probeDotnet(),
  };
}
