// @vitest-environment node
import { createServer } from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Incident 2026-09-17 fact A regression:
 * Express 5 pipes EADDRINUSE into the listen callback as the first argument.
 * Ignoring it produces a silent "Server running" lie. resolveListenPort + the
 * error-aware callback must refuse to claim success when the port is taken.
 */

// Inline the pure port resolver (mirrors server.ts) so the test does not have
 // to boot the full Express app / Vite middleware.
function resolveListenPort(env: NodeJS.ProcessEnv): number {
  const raw = env.PORT?.trim();
  if (raw && /^\d+$/u.test(raw)) {
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 65535) return parsed;
  }
  return 3000;
}

describe('resolveListenPort (incident 2026-09-17 fact A)', () => {
  it('defaults to 3000 when PORT is unset', () => {
    expect(resolveListenPort({})).toBe(3000);
  });

  it('reads a valid PORT from the environment', () => {
    expect(resolveListenPort({ PORT: '8765' })).toBe(8765);
  });

  it('rejects non-numeric / out-of-range PORT values', () => {
    expect(resolveListenPort({ PORT: 'abc' })).toBe(3000);
    expect(resolveListenPort({ PORT: '0' })).toBe(3000);
    expect(resolveListenPort({ PORT: '99999' })).toBe(3000);
    expect(resolveListenPort({ PORT: '-1' })).toBe(3000);
  });
});

describe('Express 5 listen callback must observe EADDRINUSE', () => {
  const holders: ReturnType<typeof createServer>[] = [];

  afterEach(async () => {
    await Promise.all(
      holders.splice(0).map(
        (server) =>
          new Promise<void>((resolve) => {
            server.close(() => resolve());
          }),
      ),
    );
  });

  it('surfaces EADDRINUSE as the listen-callback argument (Express 5 contract)', async () => {
    const express = (await import('express')).default;
    const holder = createServer((_req, res) => {
      res.end('holder');
    });
    holders.push(holder);
    await new Promise<void>((resolve, reject) => {
      holder.once('error', reject);
      holder.listen(0, '127.0.0.1', () => resolve());
    });
    const address = holder.address();
    if (!address || typeof address === 'string') throw new Error('expected TCP address');
    const port = address.port;

    const app = express();
    const errors: Error[] = [];
    const successes: unknown[] = [];

    await new Promise<void>((resolve) => {
      const server = app.listen(port, '127.0.0.1', (error?: Error) => {
        if (error) errors.push(error);
        else successes.push(server.address());
        // Always tear down the failed attempt.
        try {
          server.close();
        } catch {
          // ignore
        }
        resolve();
      });
      holders.push(server);
      server.on('error', () => {
        // Express already delivered the error to the callback; ignore here.
      });
    });

    expect(successes).toEqual([]);
    expect(errors.length).toBe(1);
    expect((errors[0] as NodeJS.ErrnoException).code).toBe('EADDRINUSE');
  });
});

describe('server.ts listen wiring (source contract)', () => {
  it('binds via resolveListenPort and checks the listen-callback error argument', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const source = readFileSync(join(process.cwd(), 'server.ts'), 'utf8');
    expect(source).toMatch(/function resolveListenPort/);
    expect(source).toMatch(/const PORT = resolveListenPort\(\)/);
    expect(source).toMatch(/app\.listen\(PORT,\s*"0\.0\.0\.0",\s*\(error\?: Error\)/);
    expect(source).toMatch(/if \(error\)/);
    expect(source).toMatch(/process\.exit\(1\)/);
    expect(source).toMatch(/server\.address\(\)/);
  });
});
