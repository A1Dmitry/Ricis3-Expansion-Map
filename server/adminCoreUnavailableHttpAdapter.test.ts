import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { describe, expect, it, vi } from 'vitest';
import {
  registerAdminCoreUnavailableRoutes,
  UnconfiguredAdminCoreRuntimeCapabilities,
} from './adminCoreUnavailableHttpAdapter';
import type { IAdminCoreRuntimeCapabilities } from './adminCoreRuntimeCapabilities';

async function withUnavailableServer(
  capabilities: IAdminCoreRuntimeCapabilities | undefined,
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const app = express();
  app.use(express.json());
  registerAdminCoreUnavailableRoutes(app, capabilities);

  const listener = app.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const { port } = listener.address() as AddressInfo;

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    listener.close();
    await once(listener, 'close');
  }
}

const expectedDefault = {
  apiVersion: 'v1',
  kind: 'backend_unconfigured',
  authoritative: false,
  reasonCode: 'SERVER_CONTROL_PLANE_NOT_CONFIGURED',
  messageKey: 'adminCore.backend.unconfigured',
};

describe('Admin Core optional unavailable HTTP adapter', () => {
  it('returns an exact typed 503 at the status endpoint with no deployment configuration', async () => {
    await withUnavailableServer(undefined, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/admin-core/v1/status`);

      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual(expectedDefault);
    });
  });

  it('fails closed for every nested namespace route and does not reflect arbitrary query or body data', async () => {
    const sentinel = 'https://internal.example.invalid/secret?token=never-reflect';
    await withUnavailableServer(undefined, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/admin-core/v1/hosts/arbitrary?action=${encodeURIComponent(sentinel)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ baseUrl: sentinel, authorization: 'Bearer never-reflect' }),
      });

      expect(response.status).toBe(503);
      const text = await response.text();
      expect(text).not.toContain(sentinel);
      expect(text).not.toContain('authorization');
      expect(JSON.parse(text)).toEqual(expectedDefault);
    });
  });

  it('uses an injected unavailable capability result without invoking Core, network, host or persistence work', async () => {
    const inspect = vi.fn().mockResolvedValue({
      kind: 'control_plane_unavailable',
      unavailable: {
        ...expectedDefault,
        reasonCode: 'HOST_CHANNEL_REQUIRED',
      },
    });
    const capability: IAdminCoreRuntimeCapabilities = { inspect };

    await withUnavailableServer(capability, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/admin-core/v1/status`);
      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual({
        ...expectedDefault,
        reasonCode: 'HOST_CHANNEL_REQUIRED',
      });
    });

    expect(inspect).toHaveBeenCalledTimes(1);
  });

  it('maps ready or throwing capability ports to generic safe 503 instead of enabling a route or leaking failures', async () => {
    const ready: IAdminCoreRuntimeCapabilities = {
      inspect: vi.fn().mockResolvedValue({ kind: 'control_plane_ready' }),
    };
    const throwing: IAdminCoreRuntimeCapabilities = {
      inspect: vi.fn().mockRejectedValue(new Error('PRIVATE_KEY=/srv/ricis/secret.key upstream=https://10.0.0.7')),
    };

    await withUnavailableServer(ready, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/admin-core/v1/status`);
      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual(expectedDefault);
    });

    await withUnavailableServer(throwing, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/admin-core/v1/status`);
      expect(response.status).toBe(503);
      const text = await response.text();
      expect(text).not.toContain('PRIVATE_KEY');
      expect(text).not.toContain('/srv/ricis');
      expect(text).not.toContain('10.0.0.7');
      expect(JSON.parse(text)).toEqual(expectedDefault);
    });
  });

  it('keeps default capability deterministic and requires no environment/deployment component to construct', async () => {
    const capabilities = new UnconfiguredAdminCoreRuntimeCapabilities();
    await expect(capabilities.inspect()).resolves.toEqual({
      kind: 'control_plane_unavailable',
      unavailable: expectedDefault,
    });
  });

  it('keeps optional adapter isolated from Core supervisor, network clients, environment secrets and browser state', async () => {
    const [adapterSource, serverSource] = await Promise.all([
      readFile(resolve(import.meta.dirname, 'adminCoreUnavailableHttpAdapter.ts'), 'utf8'),
      readFile(resolve(import.meta.dirname, '..', 'server.ts'), 'utf8'),
    ]);

    for (const forbidden of [
      'fetch(',
      'ensureRicisCoreApi',
      'ricisCoreSupervisor',
      'process.env',
      'spawn(',
      'localStorage',
      'sessionStorage',
      'privateKey',
      'oauth',
    ]) {
      expect(adapterSource).not.toContain(forbidden);
    }
    expect(serverSource).toContain('registerAdminCoreUnavailableRoutes(app)');
  });
});
