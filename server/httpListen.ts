/**
 * Honest HTTP listen for the development / production Express server.
 *
 * ============================================================================
 * WHY THIS FILE EXISTS (incident 2026-09-17, "интерфейс периодически слетает")
 * ============================================================================
 * `express@5` wraps the `app.listen(port, cb)` callback in `once()` and attaches
 * it to BOTH `listening` and `error` (lib/application.js). When the port is
 * already taken, the callback still fires — with an `Error(code=EADDRINUSE)` as
 * its only argument — and `server.ts` printed «Server running on …» anyway. The
 * process stayed alive, held no port and served nothing, so the platform preview
 * intermittently pointed at a server that did not exist. `express@4` had no
 * `server.once('error', done)` line, so the same situation crashed loudly; the
 * defect became invisible with the Express 5 upgrade.
 *
 * The contract here is: the single signal a human or a platform reads
 * («Server running …») must be TRUE. We therefore
 *   1. resolve the port from the environment (`PORT`) instead of a hard-coded 3000;
 *   2. reject on the `error` event instead of treating it as a success callback;
 *   3. verify `server.address()` and self-probe `GET /api/health` before reporting
 *      success — a listening socket that cannot answer is not a running server.
 * The caller decides what to do with a rejection (server.ts exits with code 1).
 */
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

/** Environment variable that sets the HTTP port of `npm run dev` / `npm start`. */
export const SERVER_PORT_ENV = 'PORT';

/** Port used when `PORT` is unset — kept at the historical value for platform previews. */
export const DEFAULT_SERVER_PORT = 3000;

/** Route the self-probe hits; it must be registered before `listenHonestly()` is called. */
export const SELF_PROBE_PATH = '/api/health';

const SELF_PROBE_TIMEOUT_MS = 2_000;

/**
 * Parses the `PORT` variable. A malformed value is a configuration error and is
 * rejected loudly rather than silently replaced by the default: falling back to
 * 3000 on a typo would recreate the "port conflict nobody asked for" class.
 */
export function resolveServerPort(raw: string | undefined): number {
  if (raw === undefined || raw.trim().length === 0) return DEFAULT_SERVER_PORT;
  const trimmed = raw.trim();
  if (!/^\d{1,5}$/u.test(trimmed)) {
    throw new Error(`${SERVER_PORT_ENV}="${raw}" is not a TCP port (expected an integer 1–65535).`);
  }
  const port = Number(trimmed);
  if (port < 1 || port > 65535) {
    throw new Error(`${SERVER_PORT_ENV}=${port} is outside the TCP port range 1–65535.`);
  }
  return port;
}

export interface ListenTarget {
  readonly port: number;
  readonly host: string;
}

export interface ListenResult {
  readonly server: Server;
  readonly port: number;
  readonly host: string;
  /** Milliseconds the self-probe took to get an HTTP 200 back. */
  readonly selfProbeMs: number;
}

/** Minimal shape of an Express application (or any `http.createServer` handler owner). */
export interface ListenableApp {
  listen(port: number, host: string): Server;
}

function describeListenError(error: NodeJS.ErrnoException, target: ListenTarget): string {
  if (error.code === 'EADDRINUSE') {
    return (
      `port ${target.port} on ${target.host} is already in use — another process (probably a previous ` +
      `dev server) holds it. Stop that process or start this one with ${SERVER_PORT_ENV}=<free port>.`
    );
  }
  if (error.code === 'EACCES') {
    return `no permission to bind port ${target.port} on ${target.host} (${error.code}).`;
  }
  return `could not listen on ${target.host}:${target.port}: ${error.code ?? error.name}: ${error.message}`;
}

async function selfProbe(port: number): Promise<number> {
  const startedAt = Date.now();
  // Probe via loopback regardless of the bind host: 0.0.0.0 is not a connectable address.
  const url = `http://127.0.0.1:${port}${SELF_PROBE_PATH}`;
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(SELF_PROBE_TIMEOUT_MS) });
  } catch (error) {
    throw new Error(
      `self-probe GET ${url} failed within ${SELF_PROBE_TIMEOUT_MS} ms: ` +
        `${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (!response.ok) {
    throw new Error(`self-probe GET ${url} answered HTTP ${response.status}; the server is bound but not serving.`);
  }
  return Date.now() - startedAt;
}

/**
 * Binds the application and resolves ONLY when the socket is listening and the
 * process can answer its own `GET /api/health`. Rejects with a human-readable
 * message on `EADDRINUSE` / `EACCES` / any other bind failure or a failed probe.
 * On failure the server is closed so no half-open listener survives.
 */
export function listenHonestly(app: ListenableApp, target: ListenTarget): Promise<ListenResult> {
  return new Promise<ListenResult>((resolve, reject) => {
    const server = app.listen(target.port, target.host);
    let settled = false;

    const fail = (error: Error): void => {
      if (settled) return;
      settled = true;
      server.close(() => reject(error));
    };

    server.once('error', (error: NodeJS.ErrnoException) => {
      fail(new Error(`Server did not start: ${describeListenError(error, target)}`));
    });

    server.once('listening', () => {
      const address = server.address();
      if (address === null || typeof address === 'string') {
        fail(new Error('Server did not start: listening event fired but server.address() is not a TCP address.'));
        return;
      }
      const bound = address as AddressInfo;
      selfProbe(bound.port)
        .then((selfProbeMs) => {
          if (settled) return;
          settled = true;
          resolve({ server, port: bound.port, host: target.host, selfProbeMs });
        })
        .catch((error: unknown) => {
          fail(new Error(`Server did not start: ${error instanceof Error ? error.message : String(error)}`));
        });
    });
  });
}
