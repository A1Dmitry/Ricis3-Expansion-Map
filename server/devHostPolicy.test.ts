// @vitest-environment node
import { request as httpRequest, createServer as createHttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer as createViteServer, type ViteDevServer } from 'vite';
import { afterAll, describe, expect, it } from 'vitest';
import {
  DEV_ALLOWED_HOSTS_ENV,
  describeDevAllowedHosts,
  resolveDevAllowedHosts,
  type DevAllowedHosts,
} from './devHostPolicy';

/**
 * Incident 2026-09-16 regression guard ("приложение не отображается"):
 * Vite's host check answered `403 Blocked request. This host … is not allowed.`
 * for the proxied preview host before any application code could run, so the
 * preview showed no application at all. These tests lock the policy that keeps
 * proxied preview hosts reachable in development, and — crucially — prove that
 * the probe is not vacuous by asserting the strict policy still rejects them.
 */

interface HostProbeResult {
  readonly status: number;
  readonly body: string;
}

interface ProbeServer {
  readonly requestWithHost: (path: string, host: string) => Promise<HostProbeResult>;
  readonly close: () => Promise<void>;
}

function requestWithHost(port: number, path: string, host: string): Promise<HostProbeResult> {
  return new Promise((resolvePromise, rejectPromise) => {
    const req = httpRequest(
      { host: '127.0.0.1', port, path, method: 'GET', headers: { Host: host } },
      res => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => resolvePromise({ status: res.statusCode ?? 0, body }));
      },
    );
    req.on('error', rejectPromise);
    req.end();
  });
}

/**
 * Boots the real Vite development middleware (the same component `npm run dev`
 * mounts inside Express) and exposes it over HTTP, so the request passes through
 * Vite's own host-validation middleware rather than a stub of it.
 */
async function startProbeServer(allowedHosts: DevAllowedHosts): Promise<ProbeServer> {
  const vite: ViteDevServer = await createViteServer({
    configFile: false,
    root: process.cwd(),
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: false, allowedHosts },
    appType: 'spa',
  });

  const server = createHttpServer((req, res) => {
    vite.middlewares(req, res, () => {
      res.statusCode = 404;
      res.end('not found');
    });
  });

  await new Promise<void>(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
  const { port } = server.address() as AddressInfo;

  return {
    requestWithHost: (path, host) => requestWithHost(port, path, host),
    close: async () => {
      await vite.close();
      await new Promise<void>(resolveClose => server.close(() => resolveClose()));
    },
  };
}

const openProbeServers: ProbeServer[] = [];

async function probeServer(allowedHosts: DevAllowedHosts): Promise<ProbeServer> {
  const server = await startProbeServer(allowedHosts);
  openProbeServers.push(server);
  return server;
}

afterAll(async () => {
  await Promise.all(openProbeServers.map(server => server.close()));
});

describe('development host policy (incident 2026-09-16)', () => {
  it('allows proxied preview hosts by default, so the SPA document is served', async () => {
    const server = await probeServer(resolveDevAllowedHosts(undefined));

    const response = await server.requestWithHost('/', '3000-abcdef123456.e2b.app');

    expect(response.status).toBe(200);
    expect(response.body).toContain('id="root"');
  });

  it('is not vacuous: the same proxied host is still rejected in strict mode', async () => {
    const server = await probeServer(resolveDevAllowedHosts('false'));

    const blocked = await server.requestWithHost('/', '3000-abcdef123456.e2b.app');
    expect(blocked.status).toBe(403);
    expect(blocked.body).toContain('Blocked request');

    // Strict mode must keep the local development host usable.
    const local = await server.requestWithHost('/', 'localhost');
    expect(local.status).toBe(200);
  });

  it('accepts an explicit host allowlist and rejects hosts outside it', async () => {
    const server = await probeServer(resolveDevAllowedHosts('.e2b.app'));

    expect((await server.requestWithHost('/', '3000-abc.e2b.app')).status).toBe(200);
    expect((await server.requestWithHost('/', 'evil.example.com')).status).toBe(403);
  });
});

describe('resolveDevAllowedHosts', () => {
  it('treats an unset or blank override as the proxied-preview default', () => {
    expect(resolveDevAllowedHosts(undefined)).toBe(true);
    expect(resolveDevAllowedHosts(null)).toBe(true);
    expect(resolveDevAllowedHosts('')).toBe(true);
    expect(resolveDevAllowedHosts('   ')).toBe(true);
  });

  it('accepts the documented explicit values', () => {
    expect(resolveDevAllowedHosts('true')).toBe(true);
    expect(resolveDevAllowedHosts('TRUE')).toBe(true);
    expect(resolveDevAllowedHosts('false')).toEqual([]);
    expect(resolveDevAllowedHosts('False')).toEqual([]);
  });

  it('parses a comma-separated allowlist without empty entries', () => {
    expect(resolveDevAllowedHosts('.e2b.app')).toEqual(['.e2b.app']);
    expect(resolveDevAllowedHosts(' proxy.internal , .example.test ')).toEqual([
      'proxy.internal',
      '.example.test',
    ]);
    // A value that carries no usable entries (or numeric port strings like "3000") must not lock the preview out silently.
    expect(resolveDevAllowedHosts('3000')).toBe(true);
    expect(resolveDevAllowedHosts(',,,')).toBe(true);
    expect(resolveDevAllowedHosts(' , , ')).toBe(true);
  });

  it('describes every policy for the startup log', () => {
    expect(describeDevAllowedHosts(true)).toContain('all hosts');
    expect(describeDevAllowedHosts([])).toContain('localhost');
    expect(describeDevAllowedHosts(['.e2b.app'])).toContain('.e2b.app');
  });
});

describe('wiring contract: every dev entry point uses the shared policy', () => {
  const serverSource = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
  const viteConfigSource = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf8');

  it('mounts Vite in server.ts with the resolved policy, never with an undefined host list', () => {
    expect(serverSource).toContain('resolveDevAllowedHosts(process.env[DEV_ALLOWED_HOSTS_ENV])');
    expect(serverSource).toContain('allowedHosts,');
    // The regression that caused the incident: an opt-in gate that nothing set.
    expect(serverSource).not.toContain('allowedHosts: process.env.VITE_ALLOWED_HOSTS === "true" ? true : undefined');
  });

  it('applies the same policy to a standalone vite dev server and to vite preview', () => {
    expect(viteConfigSource).toContain("from './server/devHostPolicy.ts'");
    // Both Vite servers keep their own allowlist with the same blocking default.
    const occurrences = viteConfigSource.match(
      /allowedHosts: resolveDevAllowedHosts\(process\.env\[DEV_ALLOWED_HOSTS_ENV\]\)/gu,
    );
    expect(occurrences).toHaveLength(2);
    expect(viteConfigSource).toMatch(/preview:\s*\{[\s\S]*allowedHosts:/u);
  });

  it('names the environment variable in one place only', () => {
    expect(DEV_ALLOWED_HOSTS_ENV).toBe('VITE_ALLOWED_HOSTS');
    const policySource = readFileSync(resolve(process.cwd(), 'server/devHostPolicy.ts'), 'utf8');
    expect(policySource).toContain("'VITE_ALLOWED_HOSTS'");
  });
});
