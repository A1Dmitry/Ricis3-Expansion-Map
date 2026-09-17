/**
 * Transport boundary for the Zenodo integration.
 *
 * Routes:
 *   GET /api/zenodo/v1/profile
 *     → project identity parsed from the repository's SEO assets
 *       (index.html JSON-LD/meta, package.json, CITATION.cff, robots.txt,
 *       sitemap.xml). Fully offline and deterministic.
 *   GET /api/zenodo/v1/dumps
 *     → live "List available dumps" (`GET https://zenodo.org/api/exporter`,
 *       https://developers.zenodo.org/#list-available-dumps) normalized to
 *       typed DTOs and served next to the SEO-derived project context
 *       (the SEO-derived User-Agent identifies the request to Zenodo).
 *
 * Availability contract (honest degradation, never crash):
 *   - SEO profile unparseable     → 502 `kind: seo_profile_unavailable`;
 *     the dumps route fails closed and does NOT call the Zenodo API.
 *   - Zenodo network/HTTP/shape   → 502 `kind: zenodo_unavailable`
 *     (504 for TIMEOUT) with a typed error code.
 * Responses never reflect request payloads, upstream error bodies or secrets.
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type express from 'express';
import {
  ZENODO_API_VERSION,
  type ZenodoProfileConsistency,
  type ZenodoProjectProfile,
} from '../src/services/zenodo/contracts';
import { loadZenodoProjectProfile } from '../src/services/zenodo/seoProjectProfile';
import {
  ZENODO_DEFAULT_BASE_URL,
  listAvailableDumps,
} from '../src/services/zenodo/zenodoDumpsClient';

const ZENODO_BASE_URL_ENV = 'ZENODO_API_BASE_URL';
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 20_000;

interface DumpsCacheEntry {
  readonly fetchedAt: number;
  readonly body: Record<string, unknown>;
}

export interface ZenodoRouteOptions {
  /** Repository root with the SEO assets. Default: the repository root. */
  readonly rootDir?: string;
  /** Zenodo REST API base URL override (else `ZENODO_API_BASE_URL`, else default). */
  readonly zenodoBaseUrl?: string;
  /** Injectable fetch for deterministic tests (dependency inversion). */
  readonly fetchImpl?: typeof fetch;
  /** Request timeout for the Zenodo call in milliseconds. Default: 20000. */
  readonly timeoutMs?: number;
  /** In-memory cache TTL for the dumps directory. Default: 5 minutes. */
  readonly cacheTtlMs?: number;
  /** Injectable clock for deterministic cache tests. Default: Date.now. */
  readonly now?: () => number;
}

function defaultRootDir(): string {
  // The repository root is one level above this module in both build shapes:
  //   ESM (tsx dev / vitest): import.meta.url is authoritative;
  //   CJS (dist/server.cjs): esbuild shims import.meta without `url`, so the
  //   CJS `__dirname` (the dist/ directory) is used instead.
  const candidates: string[] = [];
  const metaUrl: unknown = (import.meta as { readonly url?: unknown })?.url;
  if (typeof metaUrl === 'string' && metaUrl.length > 0) {
    try {
      candidates.push(join(dirname(fileURLToPath(metaUrl)), '..'));
    } catch {
      // Non-file URL (e.g. bundled worker context) — fall through to __dirname.
    }
  }
  if (typeof __dirname !== 'undefined') {
    candidates.push(join(__dirname, '..'));
  }
  if (candidates.length > 0) return candidates[0];
  return process.cwd();
}

function resolveBaseUrl(options: ZenodoRouteOptions): string {
  const candidate =
    options.zenodoBaseUrl ??
    (typeof process !== 'undefined' ? process.env[ZENODO_BASE_URL_ENV] : undefined);
  if (candidate !== undefined && candidate.trim().length > 0) {
    return candidate.trim();
  }
  return ZENODO_DEFAULT_BASE_URL;
}

function projectSummary(profile: ZenodoProjectProfile): Record<string, unknown> {
  return {
    name: profile.name,
    version: profile.version,
    url: profile.url,
    repositoryUrl: profile.repositoryUrl,
    authors: profile.authors.map((author) => ({ name: author.name, orcid: author.orcid })),
    keywords: profile.keywords,
    userAgent: profile.userAgent,
  };
}

/**
 * Registers the Zenodo route namespace.
 *
 * @param app Express application.
 * @param options DI options (root, base URL, fetch, timeouts, cache).
 */
export function registerZenodoRoutes(app: express.Express, options: ZenodoRouteOptions = {}): void {
  const rootDir = options.rootDir ?? defaultRootDir();
  const baseUrl = resolveBaseUrl(options);
  const fetchImpl = options.fetchImpl;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  const now = options.now ?? Date.now;
  let dumpsCache: DumpsCacheEntry | null = null;

  app.get('/api/zenodo/v1/profile', (request, response) => {
    void request;
    try {
      const result = loadZenodoProjectProfile(rootDir);
      if (!result.ok) {
        response.status(502).json({
          apiVersion: ZENODO_API_VERSION,
          kind: 'seo_profile_unavailable',
          authoritative: false,
          error: result.error,
        });
        return;
      }
      response.status(200).json({
        apiVersion: ZENODO_API_VERSION,
        source: 'project-seo-assets',
        project: result.profile,
        consistency: result.consistency,
      });
    } catch (error) {
      console.warn('[zenodo] Unexpected error while loading SEO profile:', error);
      response.status(502).json({
        apiVersion: ZENODO_API_VERSION,
        kind: 'seo_profile_unavailable',
        authoritative: false,
        error: {
          code: 'SEO_PARSE_ERROR',
          message: 'Failed to load the project SEO profile.',
        },
      });
    }
  });

  app.get('/api/zenodo/v1/dumps', async (request, response) => {
    void request;
    let profile: ZenodoProjectProfile;
    let profileConsistency: ZenodoProfileConsistency;
    try {
      const result = loadZenodoProjectProfile(rootDir);
      if (!result.ok) {
        response.status(502).json({
          apiVersion: ZENODO_API_VERSION,
          kind: 'seo_profile_unavailable',
          authoritative: false,
          error: result.error,
        });
        return;
      }
      profile = result.profile;
      profileConsistency = result.consistency;
    } catch {
      response.status(502).json({
        apiVersion: ZENODO_API_VERSION,
        kind: 'seo_profile_unavailable',
        authoritative: false,
        error: {
          code: 'SEO_PARSE_ERROR',
          message: 'Failed to load the project SEO profile.',
        },
      });
      return;
    }

    try {
      const cacheHit =
        dumpsCache !== null && now() - dumpsCache.fetchedAt < cacheTtlMs ? dumpsCache : null;
      if (cacheHit !== null) {
        response.status(200).json({ ...cacheHit.body, cached: true });
        return;
      }

      const result = await listAvailableDumps({
        baseUrl,
        userAgent: profile.userAgent,
        timeoutMs,
        fetchImpl,
      });

      if (!result.ok) {
        const status = result.error.code === 'TIMEOUT' ? 504 : 502;
        response.status(status).json({
          apiVersion: ZENODO_API_VERSION,
          kind: 'zenodo_unavailable',
          authoritative: false,
          error: result.error,
          project: projectSummary(profile),
        });
        return;
      }

      const body = {
        apiVersion: ZENODO_API_VERSION,
        sourceUrl: result.sourceUrl,
        generatedAt: new Date(now()).toISOString(),
        cached: false,
        project: projectSummary(profile),
        consistency: profileConsistency,
        dumps: result.dumps,
      };
      dumpsCache = { fetchedAt: now(), body };
      response.status(200).json(body);
    } catch (error) {
      console.warn('[zenodo] Unexpected error while listing available dumps:', error);
      response.status(502).json({
        apiVersion: ZENODO_API_VERSION,
        kind: 'zenodo_unavailable',
        authoritative: false,
        error: {
          code: 'NETWORK',
          message: `Zenodo API request failed (internal): ${baseUrl}`,
        },
        project: projectSummary(profile),
      });
    }
  });
}
