// @vitest-environment node
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerZenodoRoutes } from './zenodoHttpAdapter';
import type { ZenodoRouteOptions } from './zenodoHttpAdapter';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const dumpsPayload = {
  'records-xml.tar.gz': [
    {
      checksum: 'md5:1399117324e9d195881f8f293c41daf7',
      created: '2026-09-05T17:18:15.784624+00:00',
      is_head: true,
      links: {
        self: 'https://zenodo.org/api/exporter/records-xml.tar.gz/ca2186e2-f35b-4193-82c9-e6d2203669c7',
        self_head: 'https://zenodo.org/api/exporter/records-xml.tar.gz',
      },
      size: 6237851985,
      version_id: 'ca2186e2-f35b-4193-82c9-e6d2203669c7',
    },
  ],
};

async function withServer(options: ZenodoRouteOptions, run: (baseUrl: string) => Promise<void>): Promise<void> {
  const app = express();
  registerZenodoRoutes(app, options);
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

const jsonBody = async (response: Response): Promise<Record<string, any>> =>
  JSON.parse(await response.text()) as Record<string, any>;

let savedZenodoEnv: string | undefined;

beforeEach(() => {
  savedZenodoEnv = process.env.ZENODO_API_BASE_URL;
  delete process.env.ZENODO_API_BASE_URL;
});

afterEach(() => {
  if (savedZenodoEnv === undefined) {
    delete process.env.ZENODO_API_BASE_URL;
  } else {
    process.env.ZENODO_API_BASE_URL = savedZenodoEnv;
  }
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('Zenodo HTTP adapter', () => {
  it('serves the SEO-derived project profile from repository assets', async () => {
    await withServer({ rootDir: repositoryRoot }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/zenodo/v1/profile`);
      expect(response.status).toBe(200);
      const body = await jsonBody(response);
      expect(body.apiVersion).toBe('v1');
      expect(body.source).toBe('project-seo-assets');
      expect(body.project.name).toBe('RICIS Expansion Map');
      expect(body.project.url).toBe('https://a1dmitry.github.io/Ricis3-Expansion-Map/');
      expect(body.project.version).toMatch(/^\d+\.\d+\.\d+$/u);
      expect(body.project.authors).toEqual([
        { name: 'Aleinikov, Dmitry', orcid: 'https://orcid.org/0009-0004-3226-7700' },
      ]);
      expect(body.project.userAgent).toContain(`(+${body.project.url})`);
      expect(body.consistency).toEqual({ status: 'consistent' });
    });
  });

  it('serves the live dumps directory next to the SEO project context and caches within the TTL', async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json(dumpsPayload, { status: 200 }),
    );
    const now = vi.fn(() => 1_000_000);

    await withServer(
      { rootDir: repositoryRoot, fetchImpl: fetchImpl as unknown as typeof fetch, now },
      async (baseUrl) => {
        const first = await fetch(`${baseUrl}/api/zenodo/v1/dumps`);
        expect(first.status).toBe(200);
        const firstBody = await jsonBody(first);

        expect(firstBody.apiVersion).toBe('v1');
        expect(firstBody.sourceUrl).toBe('https://zenodo.org/api/exporter');
        expect(firstBody.cached).toBe(false);
        expect(firstBody.generatedAt).toBe(new Date(1_000_000).toISOString());
        expect(firstBody.project.name).toBe('RICIS Expansion Map');
        expect(firstBody.project.userAgent).toContain(
          `(+${firstBody.project.url})`,
        );
        expect(firstBody.consistency).toEqual({ status: 'consistent' });
        expect(firstBody.dumps['records-xml.tar.gz'][0]).toMatchObject({
          versionId: 'ca2186e2-f35b-4193-82c9-e6d2203669c7',
          isHead: true,
          size: 6237851985,
          selfHead: 'https://zenodo.org/api/exporter/records-xml.tar.gz',
        });

        const second = await fetch(`${baseUrl}/api/zenodo/v1/dumps`);
        expect(second.status).toBe(200);
        const secondBody = await jsonBody(second);
        expect(secondBody.cached).toBe(true);
        expect(fetchImpl).toHaveBeenCalledTimes(1);
      },
    );

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://zenodo.org/api/exporter');
    expect((init?.headers as Record<string, string>)['user-agent']).toContain('zenodo-dumps/1.0');
    expect((init?.headers as Record<string, string>)['user-agent']).toContain(
      'https://a1dmitry.github.io/Ricis3-Expansion-Map/',
    );
  });

  it('refetches after the cache TTL expires', async () => {
    const fetchImpl = vi.fn(async () => Response.json(dumpsPayload, { status: 200 }));
    let clock = 1_000_000;
    const now = vi.fn(() => clock);

    await withServer(
      {
        rootDir: repositoryRoot,
        fetchImpl: fetchImpl as unknown as typeof fetch,
        now,
        cacheTtlMs: 1000,
      },
      async (baseUrl) => {
        await fetch(`${baseUrl}/api/zenodo/v1/dumps`);
        clock += 999;
        const within = await jsonBody(await fetch(`${baseUrl}/api/zenodo/v1/dumps`));
        expect(within.cached).toBe(true);
        clock += 2;
        const after = await jsonBody(await fetch(`${baseUrl}/api/zenodo/v1/dumps`));
        expect(after.cached).toBe(false);
      },
    );
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('maps a Zenodo network failure to a typed 502 without leaking upstream details', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('PRIVATE_KEY=/srv/ricis/secret.key');
    }) as unknown as typeof fetch;

    await withServer({ rootDir: repositoryRoot, fetchImpl }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/zenodo/v1/dumps`);
      expect(response.status).toBe(502);
      const body = await jsonBody(response);
      expect(body.kind).toBe('zenodo_unavailable');
      expect(body.authoritative).toBe(false);
      expect(body.error.code).toBe('NETWORK');
      expect(body.project.name).toBe('RICIS Expansion Map');
      const text = JSON.stringify(body);
      expect(text).not.toContain('PRIVATE_KEY');
      expect(text).not.toContain('/srv/ricis');
    });
  });

  it('maps a Zenodo timeout to a typed 504', async () => {
    const fetchImpl = vi.fn(
      (_url: string | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal ?? null;
          if (signal === null) return;
          signal.addEventListener('abort', () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }),
    ) as unknown as typeof fetch;

    await withServer({ rootDir: repositoryRoot, fetchImpl, timeoutMs: 25 }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/zenodo/v1/dumps`);
      expect(response.status).toBe(504);
      const body = await jsonBody(response);
      expect(body.kind).toBe('zenodo_unavailable');
      expect(body.error.code).toBe('TIMEOUT');
    });
  });

  it('maps an invalid Zenodo payload to a typed 502 INVALID_RESPONSE', async () => {
    const fetchImpl = vi.fn(async () => Response.json({ unexpected: true }, { status: 200 })) as unknown as typeof fetch;
    await withServer({ rootDir: repositoryRoot, fetchImpl }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/zenodo/v1/dumps`);
      expect(response.status).toBe(502);
      const body = await jsonBody(response);
      expect(body.kind).toBe('zenodo_unavailable');
      expect(body.error.code).toBe('INVALID_RESPONSE');
    });
  });

  it('fails closed on unparseable SEO assets: 502 and no Zenodo call at all', async () => {
    const emptyRoot = mkdtempSync(join(tmpdir(), 'zenodo-empty-'));
    const fetchImpl = vi.fn(async () => Response.json(dumpsPayload));

    await withServer({ rootDir: emptyRoot, fetchImpl }, async (baseUrl) => {
      const profile = await fetch(`${baseUrl}/api/zenodo/v1/profile`);
      expect(profile.status).toBe(502);
      const profileBody = await jsonBody(profile);
      expect(profileBody.kind).toBe('seo_profile_unavailable');
      expect(profileBody.error.code).toBe('SEO_SOURCE_MISSING');

      const dumps = await fetch(`${baseUrl}/api/zenodo/v1/dumps`);
      expect(dumps.status).toBe(502);
      const dumpsBody = await jsonBody(dumps);
      expect(dumpsBody.kind).toBe('seo_profile_unavailable');
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('respects the ZENODO_API_BASE_URL environment override', async () => {
    const original = process.env.ZENODO_API_BASE_URL;
    try {
      process.env.ZENODO_API_BASE_URL = 'https://sandbox.zenodo.org';
      const rawFetch = vi.fn(
        async (_url: string | URL, _init?: RequestInit) => Response.json(dumpsPayload),
      );
      const fetchImpl = rawFetch as unknown as typeof fetch;
      await withServer({ rootDir: repositoryRoot, fetchImpl }, async (baseUrl) => {
        await fetch(`${baseUrl}/api/zenodo/v1/dumps`);
      });
      expect(rawFetch).toHaveBeenCalledTimes(1);
      expect(rawFetch.mock.calls[0]?.[0]).toBe('https://sandbox.zenodo.org/api/exporter');
    } finally {
      if (original === undefined) delete process.env.ZENODO_API_BASE_URL;
      else process.env.ZENODO_API_BASE_URL = original;
    }
  });

  it('is wired into the application server', async () => {
    const serverSource = await readFile(resolve(import.meta.dirname, '..', 'server.ts'), 'utf8');
    expect(serverSource).toContain('import { registerZenodoRoutes } from "./server/zenodoHttpAdapter"');
    expect(serverSource).toContain('registerZenodoRoutes(app)');
  });
});
