// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { ZENODO_DEFAULT_BASE_URL, ZENODO_EXPORTER_PATH, listAvailableDumps } from './zenodoDumpsClient';

/** Live-shaped sample (trimmed from a real `GET /api/exporter` response). */
const livePayload = {
  'records-json.tar.gz': [
    {
      checksum: 'md5:fe58b885ce18309b240c691c4b93a521',
      created: '2026-09-05T17:16:41.165675+00:00',
      is_head: true,
      links: {
        self: 'https://zenodo.org/api/exporter/records-json.tar.gz/571ba30d-0f93-4115-af9d-9668690f45d6',
        self_head: 'https://zenodo.org/api/exporter/records-json.tar.gz',
      },
      size: 12850571662,
      version_id: '571ba30d-0f93-4115-af9d-9668690f45d6',
    },
  ],
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
    {
      checksum: 'md5:cc7bc7d396b903d857315071852b6b73',
      created: '2026-07-10T03:31:53.010006+00:00',
      is_head: false,
      links: { self: 'https://zenodo.org/api/exporter/records-xml.tar.gz/ef906a19-4382-429a-8642-64338a99e953' },
      size: 5763877865,
      version_id: 'ef906a19-4382-429a-8642-64338a99e953',
    },
  ],
};

interface RecordedCall {
  url: string;
  headers: Record<string, string>;
  aborted: boolean;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function makeFakeFetch(handler: (call: RecordedCall) => Response | Promise<Response>): {
  fetchImpl: typeof fetch;
  calls: RecordedCall[];
} {
  const calls: RecordedCall[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const call: RecordedCall = {
      url: String(input),
      headers: Object.fromEntries(Object.entries(init?.headers ?? {}).map(([k, v]) => [k, String(v)])),
      aborted: Boolean(init?.signal?.aborted),
    };
    calls.push(call);
    const rawSignal = init?.signal ?? null;
    if (rawSignal !== null) {
      rawSignal.addEventListener('abort', () => {
        call.aborted = true;
      });
    }
    const result = Promise.resolve(handler(call));
    if (rawSignal !== null) {
      // Race the response against an abort that fires while pending.
      const outcome = await Promise.race([
        result.then((response) => ({ kind: 'response' as const, response })),
        new Promise<{ kind: 'abort' }>((resolveAbort) => {
          if (rawSignal.aborted) return resolveAbort({ kind: 'abort' });
          rawSignal.addEventListener('abort', () => resolveAbort({ kind: 'abort' }), { once: true });
        }),
      ]);
      if (outcome.kind === 'abort') {
        const abortError = new Error('The operation was aborted.');
        abortError.name = 'AbortError';
        throw abortError;
      }
      return outcome.response;
    }
    return result;
  }) as typeof fetch;
  return { fetchImpl, calls };
}

describe('Zenodo "List available dumps" client (GET /api/exporter)', () => {
  it('normalizes the documented response into typed camelCase DTOs', async () => {
    const { fetchImpl } = makeFakeFetch(() => jsonResponse(livePayload));
    const result = await listAvailableDumps({ fetchImpl });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sourceUrl).toBe(`${ZENODO_DEFAULT_BASE_URL}${ZENODO_EXPORTER_PATH}`);
    expect(Object.keys(result.dumps).sort()).toEqual(['records-json.tar.gz', 'records-xml.tar.gz']);

    const head = result.dumps['records-xml.tar.gz'][0];
    expect(head).toEqual({
      versionId: 'ca2186e2-f35b-4193-82c9-e6d2203669c7',
      created: '2026-09-05T17:18:15.784624+00:00',
      isHead: true,
      size: 6237851985,
      checksum: 'md5:1399117324e9d195881f8f293c41daf7',
      self: 'https://zenodo.org/api/exporter/records-xml.tar.gz/ca2186e2-f35b-4193-82c9-e6d2203669c7',
      selfHead: 'https://zenodo.org/api/exporter/records-xml.tar.gz',
    });
    const previous = result.dumps['records-xml.tar.gz'][1];
    expect(previous?.isHead).toBe(false);
    expect(previous).not.toHaveProperty('selfHead');
  });

  it('requests the exporter endpoint with the SEO-derived User-Agent and JSON Accept header', async () => {
    const { fetchImpl, calls } = makeFakeFetch(() => jsonResponse(livePayload));
    const seoUserAgent =
      'RICIS3-Expansion-Map/0.4.203 (+https://a1dmitry.github.io/Ricis3-Expansion-Map/) zenodo-dumps/1.0';

    const result = await listAvailableDumps({ fetchImpl, userAgent: seoUserAgent });
    expect(result.ok).toBe(true);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe('https://zenodo.org/api/exporter');
    expect(calls[0]?.headers['user-agent']).toBe(seoUserAgent);
    expect(calls[0]?.headers['accept']).toBe('application/json');
  });

  it('strips a trailing slash from the base URL without duplicating the path', async () => {
    const { fetchImpl, calls } = makeFakeFetch(() => jsonResponse(livePayload));
    const result = await listAvailableDumps({ fetchImpl, baseUrl: 'https://zenodo.org/' });
    expect(result.ok).toBe(true);
    expect(calls[0]?.url).toBe('https://zenodo.org/api/exporter');
  });

  it('maps a non-200 answer to a typed HTTP_ERROR with the status', async () => {
    const { fetchImpl } = makeFakeFetch(() => jsonResponse({ message: 'not found', status: 404 }, 404));
    const result = await listAvailableDumps({ fetchImpl });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toEqual({
      code: 'HTTP_ERROR',
      message: 'Zenodo API returned HTTP 404 for https://zenodo.org/api/exporter',
      httpStatus: 404,
    });
  });

  it('maps a network rejection to a typed NETWORK failure without leaking upstream details', async () => {
    const fetchImpl = (async () => {
      throw new Error('PRIVATE_KEY=/srv/ricis/secret.key upstream=https://10.0.0.7');
    }) as unknown as typeof fetch;
    const result = await listAvailableDumps({ fetchImpl });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NETWORK');
    expect(result.error.message).not.toContain('PRIVATE_KEY');
    expect(result.error.message).not.toContain('10.0.0.7');
    expect(result.error.message).toBe(
      'Zenodo API request failed (network): https://zenodo.org/api/exporter',
    );
  });

  it('maps an abort after the timeout to a typed TIMEOUT failure', async () => {
    const { fetchImpl, calls } = makeFakeFetch(() => new Promise<Response>(() => undefined));
    const result = await listAvailableDumps({ fetchImpl, timeoutMs: 25 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('TIMEOUT');
    expect(result.error.message).toContain('timed out after 25 ms');
    expect(calls[0]?.aborted).toBe(true);
  });

  it('rejects a non-JSON body as INVALID_RESPONSE', async () => {
    const fetchImpl = (async () =>
      new Response('<html>proxy error</html>', { status: 200 })) as unknown as typeof fetch;
    const result = await listAvailableDumps({ fetchImpl });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('INVALID_RESPONSE');
  });

  it.each([
    ['an array payload', [1, 2, 3]],
    ['an empty object', {}],
    ['a version list that is not an array', { 'records-xml.tar.gz': 'nope' }],
    [
      'a version missing version_id',
      { 'records-xml.tar.gz': [{ created: '2026-01-01', is_head: true, size: 1, checksum: 'md5:x', links: { self: 'https://a/x' } }] },
    ],
    [
      'a version with a non-integer size',
      { 'records-xml.tar.gz': [{ version_id: 'v', created: '2026-01-01', is_head: true, size: 'big', checksum: 'md5:x', links: { self: 'https://a/x' } }] },
    ],
    [
      'a version with an http:// self link',
      { 'records-xml.tar.gz': [{ version_id: 'v', created: '2026-01-01', is_head: true, size: 1, checksum: 'md5:x', links: { self: 'http://insecure.example/x' } }] },
    ],
    [
      'two head versions in one variant',
      {
        'records-xml.tar.gz': [
          { version_id: 'a', created: '2026-01-01', is_head: true, size: 1, checksum: 'md5:x', links: { self: 'https://a/x' } },
          { version_id: 'b', created: '2025-01-01', is_head: true, size: 1, checksum: 'md5:y', links: { self: 'https://a/y' } },
        ],
      },
    ],
  ])('rejects %s as INVALID_RESPONSE', async (_label, payload) => {
    const { fetchImpl } = makeFakeFetch(() => jsonResponse(payload));
    const result = await listAvailableDumps({ fetchImpl });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('INVALID_RESPONSE');
  });

  it('keeps a transiently empty variant instead of failing the whole directory', async () => {
    const { fetchImpl } = makeFakeFetch(() => jsonResponse({ 'records-json.tar.gz': [] }));
    const result = await listAvailableDumps({ fetchImpl });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.dumps['records-json.tar.gz']).toEqual([]);
    }
  });
});
