import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const CORE_PORT = Number(process.env.RICIS_CORE_PORT || 5044);
const CORE_URL = process.env.RICIS_CORE_URL || `http://127.0.0.1:${CORE_PORT}`;
const CORE_REPO = path.resolve(process.cwd(), process.env.RICIS_CORE_REPO || '../Ricis.Core');
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

function assertCoreProject(): void {
  if (!existsSync(CORE_PROJECT)) {
    throw new Error(
      `Ricis.Core Web API project was not found at relative path ${path.relative(process.cwd(), CORE_PROJECT)}. ` +
      'Place Ricis.Core next to Ricis3-Expansion-Map or set RICIS_CORE_REPO.',
    );
  }
}

function launchCoreProcess(): void {
  if (coreProcess && coreProcess.exitCode === null) return;

  assertCoreProject();
  coreProcess = spawn(
    'dotnet',
    ['run', '--project', CORE_PROJECT, '--no-launch-profile', '--urls', CORE_URL],
    {
      cwd: CORE_REPO,
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

export function getRicisCoreIntegrationInfo() {
  return {
    url: CORE_URL,
    relativeRepository: path.relative(process.cwd(), CORE_REPO) || '.',
    relativeProject: path.relative(process.cwd(), CORE_PROJECT),
    running: Boolean(coreProcess && coreProcess.exitCode === null),
  };
}
