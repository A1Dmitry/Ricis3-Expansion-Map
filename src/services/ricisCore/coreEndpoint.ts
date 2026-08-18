export type RicisCoreApiEndpointSource = 'same_origin' | 'remote' | 'invalid_remote';

export interface RicisCoreApiEndpoint {
  readonly baseUrl: string;
  readonly source: RicisCoreApiEndpointSource;
  readonly safeDetail?: string;
}

const SAME_ORIGIN_CORE_API_BASE = '/api/ricis-core';
const REMOTE_CORE_API_ENV = 'VITE_RICIS_CORE_API_BASE_URL';
const INVALID_REMOTE_ENDPOINT_DETAIL =
  'Production Core endpoint must be an absolute HTTPS URL without credentials, query, or fragment.';

function configuredCoreApiBase(): unknown {
  return import.meta.env.VITE_RICIS_CORE_API_BASE_URL;
}

/**
 * Resolves the one API base used by both calculation and recovery health checks.
 *
 * Empty configuration preserves the existing same-origin Express proxy. A remote
 * deployment is explicitly opt-in at build time through
 * `VITE_RICIS_CORE_API_BASE_URL=https://core.example/api/ricis-core`.
 */
export function resolveRicisCoreApiEndpoint(configuredBase: unknown = configuredCoreApiBase()): RicisCoreApiEndpoint {
  if (typeof configuredBase !== 'string' || configuredBase.trim().length === 0) {
    return { baseUrl: SAME_ORIGIN_CORE_API_BASE, source: 'same_origin' };
  }

  try {
    const parsed = new URL(configuredBase.trim());
    if (
      parsed.protocol !== 'https:' ||
      parsed.username.length > 0 ||
      parsed.password.length > 0 ||
      parsed.search.length > 0 ||
      parsed.hash.length > 0
    ) {
      return { baseUrl: '', source: 'invalid_remote', safeDetail: INVALID_REMOTE_ENDPOINT_DETAIL };
    }

    const normalizedPath = parsed.pathname.replace(/\/+$/u, '');
    return {
      baseUrl: `${parsed.origin}${normalizedPath}`,
      source: 'remote',
    };
  } catch {
    return { baseUrl: '', source: 'invalid_remote', safeDetail: INVALID_REMOTE_ENDPOINT_DETAIL };
  }
}

export function ricisCoreApiUrl(endpoint: RicisCoreApiEndpoint, path: string): string | null {
  if (endpoint.source === 'invalid_remote') return null;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${endpoint.baseUrl}${normalizedPath}`;
}

export const RICIS_CORE_API_CONFIGURATION = {
  environmentVariable: REMOTE_CORE_API_ENV,
  sameOriginBase: SAME_ORIGIN_CORE_API_BASE,
} as const;
