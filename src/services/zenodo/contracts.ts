/**
 * Zenodo integration contracts (DTO + typed diagnostic statuses).
 *
 * The project keeps a machine-readable link to Zenodo ("List available dumps",
 * https://developers.zenodo.org/#list-available-dumps → `GET /api/exporter`).
 * The project identity used in Zenodo requests (name, version, URL, authors)
 * is NOT hardcoded: it is parsed from the project's SEO assets
 * (index.html JSON-LD/meta, package.json, CITATION.cff, robots.txt, sitemap.xml).
 *
 * Per the project philosophy, failures are propagated as typed statuses,
 * never as `NaN`, unhandled exceptions or silent empty results.
 */

export const ZENODO_API_VERSION = 'v1' as const;

/** Author entry as declared in CITATION.cff (`family-names, given-names`). */
export interface ZenodoAuthor {
  readonly name: string;
  readonly orcid?: string;
}

/**
 * Project identity parsed from the project's SEO assets.
 * Canonical version is `package.json.version`; canonical URL is the JSON-LD
 * SoftwareApplication `url` (cross-checked against the canonical link).
 */
export interface ZenodoProjectProfile {
  readonly name: string;
  readonly alternateName: string;
  readonly version: string;
  readonly description: string;
  readonly url: string;
  readonly siteUrl: string;
  readonly license: string;
  readonly image: string;
  readonly language: string;
  readonly isAccessibleForFree: boolean;
  readonly repositoryUrl: string;
  readonly citationTitle: string;
  readonly citationDateReleased: string;
  readonly authors: readonly ZenodoAuthor[];
  readonly keywords: readonly string[];
  /** Polite-crawler User-Agent derived from SEO name/version/URL. */
  readonly userAgent: string;
  /** SEO asset files that were successfully read (relative paths). */
  readonly sourceFiles: readonly string[];
}

export type ZenodoProfileErrorCode = 'SEO_SOURCE_MISSING' | 'SEO_PARSE_ERROR';

export interface ZenodoProfileFailure {
  readonly code: ZenodoProfileErrorCode;
  readonly message: string;
}

export type ZenodoProfileConsistency =
  | { readonly status: 'consistent' }
  | { readonly status: 'inconsistent'; readonly mismatches: readonly string[] };

export type ZenodoProjectProfileResult =
  | {
      readonly ok: true;
      readonly profile: ZenodoProjectProfile;
      readonly consistency: ZenodoProfileConsistency;
    }
  | { readonly ok: false; readonly error: ZenodoProfileFailure };

/** One available dump version as declared by `GET /api/exporter`. */
export interface ZenodoDumpVersion {
  readonly versionId: string;
  readonly created: string;
  readonly isHead: boolean;
  readonly size: number;
  readonly checksum: string;
  readonly self: string;
  /** Present only for the head version (per Zenodo API documentation). */
  readonly selfHead?: string;
}

/** Map: dump variant key (e.g. `records-xml.tar.gz`) → recent versions. */
export type ZenodoDumpDirectory = Readonly<
  Record<string, readonly ZenodoDumpVersion[]>
>;

export type ZenodoDumpsErrorCode =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'HTTP_ERROR'
  | 'INVALID_RESPONSE';

export interface ZenodoDumpsFailure {
  readonly code: ZenodoDumpsErrorCode;
  /** Safe for public exposure: never contains request payloads or secrets. */
  readonly message: string;
  readonly httpStatus?: number;
}

export type ZenodoDumpsResult =
  | { readonly ok: true; readonly dumps: ZenodoDumpDirectory; readonly sourceUrl: string }
  | { readonly ok: false; readonly error: ZenodoDumpsFailure };

export interface ZenodoClientOptions {
  /** Zenodo REST API base URL. Default: `https://zenodo.org`. */
  readonly baseUrl?: string;
  /** User-Agent for the request; the adapter passes the SEO-derived one. */
  readonly userAgent?: string;
  /** Request timeout in milliseconds. Default: 20000. */
  readonly timeoutMs?: number;
  /** Injectable fetch for deterministic tests (dependency inversion). */
  readonly fetchImpl?: typeof fetch;
}
