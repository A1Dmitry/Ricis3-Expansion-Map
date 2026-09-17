// @vitest-environment node
import { createServer, type Server } from 'node:http';
import express from 'express';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_SERVER_PORT,
  SELF_PROBE_PATH,
  listenHonestly,
  resolveServerPort,
} from './httpListen';

/**
 * Incident 2026-09-17 (finding A) regression tests. These are transport-level
 * probes — a real socket is bound and a real HTTP request is made — not a text
 * search of server.ts, because the defect was invisible to every file-reading test.
 */

const openServers: Server[] = [];

function closeAll(): Promise<void> {
  const pending = openServers.splice(0).map(
    (server) => new Promise<void>((resolve) => server.close(() => resolve())),
  );
  return Promise.all(pending).then(() => undefined);
}

async function occupyPort(): Promise<number> {
  const blocker = createServer((_req, res) => res.end('busy'));
  await new Promise<void>((resolve) => blocker.listen(0, '127.0.0.1', () => resolve()));
  openServers.push(blocker);
  const address = blocker.address();
  if (address === null || typeof address === 'string') throw new Error('blocker has no TCP address');
  return address.port;
}

function healthyApp(): express.Express {
  const app = express();
  app.get(SELF_PROBE_PATH, (_req, res) => {
    res.json({ status: 'ok' });
  });
  return app;
}

afterEach(closeAll);

describe('resolveServerPort', () => {
  it('defaults to 3000 when PORT is unset or blank', () => {
    expect(resolveServerPort(undefined)).toBe(DEFAULT_SERVER_PORT);
    expect(resolveServerPort('')).toBe(DEFAULT_SERVER_PORT);
    expect(resolveServerPort('   ')).toBe(DEFAULT_SERVER_PORT);
  });

  it('accepts a valid PORT and rejects garbage loudly instead of silently falling back', () => {
    expect(resolveServerPort('8080')).toBe(8080);
    expect(resolveServerPort(' 4173 ')).toBe(4173);
    expect(() => resolveServerPort('abc')).toThrow(/not a TCP port/u);
    expect(() => resolveServerPort('0')).toThrow(/outside the TCP port range/u);
    expect(() => resolveServerPort('70000')).toThrow(/outside the TCP port range/u);
    expect(() => resolveServerPort('30.5')).toThrow(/not a TCP port/u);
  });
});

describe('listenHonestly', () => {
  it('rejects with an EADDRINUSE explanation when the port is already taken (no false «Server running»)', async () => {
    const busyPort = await occupyPort();

    await expect(
      listenHonestly(healthyApp(), { port: busyPort, host: '127.0.0.1' }),
    ).rejects.toThrow(new RegExp(`port ${busyPort} on 127\\.0\\.0\\.1 is already in use`, 'u'));
  });

  it('resolves only after the socket is bound and the self-probe returned HTTP 200', async () => {
    const result = await listenHonestly(healthyApp(), { port: 0, host: '127.0.0.1' });
    openServers.push(result.server);

    expect(result.port).toBeGreaterThan(0);
    expect(result.selfProbeMs).toBeGreaterThanOrEqual(0);

    const response = await fetch(`http://127.0.0.1:${result.port}${SELF_PROBE_PATH}`);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });

  it('rejects and closes the socket when the process is bound but cannot answer its own health route', async () => {
    // An app without /api/health: the socket listens, yet the server is not serving.
    const app = express();
    app.get('/other', (_req, res) => {
      res.end('x');
    });

    await expect(
      listenHonestly(app, { port: 0, host: '127.0.0.1' }),
    ).rejects.toThrow(/self-probe .* answered HTTP 404; the server is bound but not serving/u);
  });

  it('control: express@5 really calls the listen callback with an Error on EADDRINUSE (the mechanism this module replaces)', async () => {
    const busyPort = await occupyPort();
    const app = express();

    const callbackArgument = await new Promise<unknown>((resolve) => {
      const server = app.listen(busyPort, '127.0.0.1', (...args: unknown[]) => resolve(args[0]));
      openServers.push(server);
    });

    expect(callbackArgument).toBeInstanceOf(Error);
    expect((callbackArgument as NodeJS.ErrnoException).code).toBe('EADDRINUSE');
  });
});
