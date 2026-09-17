/**
 * Zenodo "List available dumps" client.
 *
 * Implements `GET {baseUrl}/api/exporter` as documented at
 * https://developers.zenodo.org/#list-available-dumps and normalizes the
 * payload into typed {@link ZenodoDumpDirectory} values.
 *
 * All failure classes (network, timeout, HTTP error, invalid shape) resolve
 * to a typed {@link ZenodoDumpsResult} — this function never throws for an
 * expected failure and never returns `NaN`-ish partial data.
 */

import type {
  ZenodoClientOptions,
  ZenodoDumpDirectory,
  ZenodoDumpsFailure,
  ZenodoDumpsResult,
  ZenodoDumpVersion,
} from './contracts';

export const ZENODO_DEFAULT_BASE_URL = 'https://zenodo.org';
export const ZENODO_EXPORTER_PATH = '/api/exporter';
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_USER_AGENT = 'RICIS3-Expansion-Map zenodo-dumps/1.0';

function normalizeVersion(raw: unknown): ZenodoDumpVersion | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined;
  const entry = raw as Record<string, unknown>;

  const versionId = entry['version_id'];
  const created = entry['created'];
  const size = entry['size'];
  const checksum = entry['checksum'];
  const links = entry['links'];
  if (typeof versionId !== 'string' || versionId.trim().length === 0) return undefined;
  if (typeof created !== 'string' || created.trim().length === 0) return undefined;
  if (typeof size !== 'number' || !Number.isSafeInteger(size) || size < 0) return undefined;
  if (typeof checksum !== 'string' || checksum.trim().length === 0) return undefined;
  if (typeof links !== 'object' || links === null || Array.isArray(links)) return undefined;
  const linkSet = links as Record<string, unknown>;
  const self = linkSet['self'];
  if (typeof self !== 'string' || !/^https:\/\//u.test(self)) return undefined;

  const isHead = entry['is_head'] === true;
  const selfHead = linkSet['self_head'];
  const normalized: ZenodoDumpVersion = {
    versionId,
    created,
    isHead,
    size,
    checksum,
    self,
  };
  if (isHead && typeof selfHead === 'string' && selfHead.trim().length > 0) {
    return { ...normalized, selfHead };
  }
  return normalized;
}

function normalizeDirectory(payload: unknown): ZenodoDumpDirectory | undefined {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return undefined;
  }
  const source = payload as Record<string, unknown>;
  const directory: Record<string, readonly ZenodoDumpVersion[]> = {};
  for (const [key, rawVersions] of Object.entries(source)) {
    if (key.trim().length === 0) return undefined;
    if (!Array.isArray(rawVersions)) return undefined;
    const versions: ZenodoDumpVersion[] = [];
    for (const raw of rawVersions) {
      const version = normalizeVersion(raw);
      if (version === undefined) return undefined;
      versions.push(version);
    }
    // At most one head per variant (a variant may transiently be empty).
    if (versions.filter((version) => version.isHead).length > 1) return undefined;
    directory[key] = versions;
  }
  if (Object.keys(directory).length === 0) return undefined;
  return directory;
}

/**
 * Lists the currently available Zenodo metadata dumps.
 *
 * @param options client options; `fetchImpl` is injectable for tests,
 * `userAgent` is expected to be the SEO-derived project User-Agent.
 */
export async function listAvailableDumps(
  options: ZenodoClientOptions = {},
): Promise<ZenodoDumpsResult> {
  const baseUrl = (options.baseUrl ?? ZENODO_DEFAULT_BASE_URL).replace(/\/+$/u, '');
  const sourceUrl = `${baseUrl}${ZENODO_EXPORTER_PATH}`;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const userAgent =
    options.userAgent !== undefined && options.userAgent.trim().length > 0
      ? options.userAgent
      : DEFAULT_USER_AGENT;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetchImpl(sourceUrl, {
      method: 'GET',
      headers: { accept: 'application/json', 'user-agent': userAgent },
      signal: controller.signal,
    });
  } catch (error) {
    const timedOut = controller.signal.aborted;
    // The raw rejection detail is intentionally excluded from the public
    // failure message: it is an upstream error and may carry sensitive text.
    void error;
    const failure: ZenodoDumpsFailure = timedOut
      ? {
          code: 'TIMEOUT',
          message: `Zenodo API request timed out after ${timeoutMs} ms: ${sourceUrl}`,
        }
      : {
          code: 'NETWORK',
          message: `Zenodo API request failed (network): ${sourceUrl}`,
        };
    return { ok: false, error: failure };
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const failure: ZenodoDumpsFailure = {
      code: 'HTTP_ERROR',
      message: `Zenodo API returned HTTP ${response.status} for ${sourceUrl}`,
      httpStatus: response.status,
    };
    return { ok: false, error: failure };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    const failure: ZenodoDumpsFailure = {
      code: 'INVALID_RESPONSE',
      message: `Zenodo API response is not valid JSON: ${sourceUrl}`,
    };
    void error;
    return { ok: false, error: failure };
  }

  const dumps = normalizeDirectory(payload);
  if (dumps === undefined) {
    const failure: ZenodoDumpsFailure = {
      code: 'INVALID_RESPONSE',
      message: `Zenodo API response does not match the documented /api/exporter shape: ${sourceUrl}`,
    };
    return { ok: false, error: failure };
  }

  return { ok: true, dumps, sourceUrl };
}
