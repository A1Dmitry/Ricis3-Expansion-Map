import { spawn, type ChildProcess } from 'node:child_process';
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

function launchCoreProcess(): void {
  if (coreProcess && coreProcess.exitCode === null) return;

  assertCoreRuntime();
  const bundledRuntimeAvailable = existsSync(CORE_DLL);
  const args = bundledRuntimeAvailable
    ? [CORE_DLL, '--urls', CORE_URL]
    : ['run', '--project', CORE_PROJECT, '--no-launch-profile', '--urls', CORE_URL];
  coreProcess = spawn('dotnet', args, {
      cwd: bundledRuntimeAvailable ? CORE_RUNTIME : CORE_REPO,
      env: { ...process.env, ASPNETCORE_ENVIRONMENT: process.env.ASPNETCORE_ENVIRONMENT || 'Production' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  coreProcess.stdout?.on('data', (chunk: Buffer) => console.log(`[Ricis.Core] ${chunk.toString().trimEnd()}`));
  coreProcess.stderr?.on('data', (chunk: Buffer) => console.warn(`[Ricis.Core] ${chunk.toString().trimEnd()}`));
  coreProcess.once('exit', (code, signal) => {
    console.warn(`[Ricis.Core] stopped (code=${code ?? 'null'}, signal=${signal ?? 'none'})`);
    coreProcess = null;
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
  };
}
