/**
 * Project identity source for the Zenodo integration.
 *
 * Parses the project's SEO assets and produces a typed
 * {@link ZenodoProjectProfile} plus a consistency verdict between the
 * version/URL facts declared in the different SEO surfaces.
 *
 * Sources (all relative to the repository root):
 *   - index.html          → JSON-LD (@graph: SoftwareApplication, WebSite),
 *                           meta description, canonical link, og:image;
 *   - package.json        → canonical version, repository, homepage, keywords;
 *   - CITATION.cff        → citation title, date-released, authors (+ ORCID),
 *                           url, license, keywords;
 *   - public/robots.txt   → Sitemap discovery URL (optional);
 *   - public/sitemap.xml  → indexed page URLs (optional).
 *
 * Diagnostics are typed ({@link ZenodoProjectProfileResult}); this module
 * never throws for missing/malformed SEO input.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  ZenodoAuthor,
  ZenodoProfileConsistency,
  ZenodoProjectProfile,
  ZenodoProjectProfileResult,
} from './contracts';

const REQUIRED_SEO_FILES = ['index.html', 'package.json', 'CITATION.cff'] as const;
const OPTIONAL_SEO_FILES = ['public/robots.txt', 'public/sitemap.xml'] as const;

interface JsonLdApplication {
  readonly name?: string;
  readonly alternateName?: string;
  readonly url?: string;
  readonly softwareVersion?: string;
  readonly description?: string;
  readonly image?: string;
  readonly license?: string;
  readonly inLanguage?: string;
  readonly isAccessibleForFree?: boolean;
}

interface JsonLdWebsite {
  readonly name?: string;
  readonly url?: string;
  readonly description?: string;
}

/** Mutable while parsing; the exported profile stays readonly-typed. */
interface CffDocument {
  title?: string;
  version?: string;
  dateReleased?: string;
  url?: string;
  repositoryCode?: string;
  license?: string;
  abstract?: string;
  authors: ZenodoAuthor[];
  keywords: string[];
}

function fail(code: 'SEO_SOURCE_MISSING' | 'SEO_PARSE_ERROR', message: string): ZenodoProjectProfileResult {
  return { ok: false, error: { code, message } };
}

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/** Extracts the single JSON-LD graph entries from index.html; throws when absent. */
function extractJsonLd(indexHtml: string): { application: JsonLdApplication; website: JsonLdWebsite } {
  const match = indexHtml.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/u);
  if (!match?.[1]) {
    throw new Error('index.html must contain one parseable JSON-LD script.');
  }
  const parsed = JSON.parse(match[1]) as { readonly '@graph'?: readonly Record<string, unknown>[] };
  const graph = parsed['@graph'];
  if (!Array.isArray(graph)) {
    throw new Error('JSON-LD must expose an @graph array.');
  }
  const application = graph.find((entry) => entry['@type'] === 'SoftwareApplication') as
    | JsonLdApplication
    | undefined;
  const website = graph.find((entry) => entry['@type'] === 'WebSite') as JsonLdWebsite | undefined;
  if (!application) {
    throw new Error('JSON-LD @graph must contain a SoftwareApplication entry.');
  }
  if (!website) {
    throw new Error('JSON-LD @graph must contain a WebSite entry.');
  }
  return { application, website };
}

function extractMetaContent(indexHtml: string, name: string): string | undefined {
  const meta = indexHtml.match(
    new RegExp(
      `<meta\\s+(?:name|property)=["']${name}["']\\s+content=["']([^"']*)["']`,
      'iu',
    ),
  );
  return meta?.[1];
}

function extractCanonicalUrl(indexHtml: string): string | undefined {
  const link = indexHtml.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/iu);
  return link?.[1];
}

/** Minimal deterministic CFF subset parser (top-level scalars + authors/keywords blocks). */
function parseCitationCff(raw: string): CffDocument {
  const document: CffDocument = { authors: [], keywords: [] };
  let block: 'authors' | 'keywords' | null = null;
  let currentAuthor: Record<string, string> | null = null;

  const commitAuthor = (): void => {
    if (!currentAuthor) return;
    const family = currentAuthor['family-names'] ?? '';
    const given = currentAuthor['given-names'] ?? '';
    const name = [family, given].filter((part) => part.length > 0).join(', ');
    if (name.length > 0) {
      const orcid = currentAuthor['orcid'];
      document.authors = [...document.authors, orcid ? { name, orcid } : { name }];
    }
    currentAuthor = null;
  };

  for (const rawLine of raw.split(/\r?\n/u)) {
    const line = rawLine.replace(/\t/gu, '  ');
    if (line.trim().length === 0 || line.trim().startsWith('#')) continue;

    if (!/^\s/u.test(line)) {
      commitAuthor();
      block = null;
      const separator = line.indexOf(':');
      if (separator < 0) continue;
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      switch (key) {
        case 'title':
          document.title = stripQuotes(value);
          break;
        case 'version':
          document.version = stripQuotes(value);
          break;
        case 'date-released':
          document.dateReleased = stripQuotes(value);
          break;
        case 'url':
          document.url = stripQuotes(value);
          break;
        case 'repository-code':
          document.repositoryCode = stripQuotes(value);
          break;
        case 'license':
          document.license = stripQuotes(value);
          break;
        case 'abstract':
          document.abstract = stripQuotes(value);
          break;
        case 'authors':
          block = 'authors';
          break;
        case 'keywords':
          block = 'keywords';
          break;
        default:
          break;
      }
      continue;
    }

    if (block === 'keywords') {
      const item = line.trim().replace(/^-\s*/u, '');
      if (item.length > 0) document.keywords = [...document.keywords, stripQuotes(item)];
      continue;
    }
    if (block === 'authors') {
      if (line.trim().startsWith('-')) {
        commitAuthor();
        currentAuthor = {};
        const rest = line.trim().slice(1).trim();
        const separator = rest.indexOf(':');
        if (separator >= 0) {
          currentAuthor[rest.slice(0, separator).trim()] = stripQuotes(rest.slice(separator + 1));
        }
      } else if (currentAuthor) {
        const separator = line.trim().indexOf(':');
        if (separator >= 0) {
          currentAuthor[line.trim().slice(0, separator).trim()] = stripQuotes(
            line.trim().slice(separator + 1),
          );
        }
      }
    }
  }
  commitAuthor();
  return document;
}

function extractSitemapUrl(robotsTxt: string): string | undefined {
  const match = robotsTxt.match(/^Sitemap:\s*(\S+)/imu);
  return match?.[1];
}

function extractSitemapLocs(sitemapXml: string): string[] {
  const locs = [...sitemapXml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gu)];
  return locs.map((entry) => entry[1]);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Normalizes `git+https://…/.git` repository URLs to a bare HTTPS form. */
function normalizeRepositoryUrl(raw: string): string {
  if (raw.length === 0) return '';
  return raw.replace(/^git\+/u, '').replace(/\.git$/u, '');
}

/**
 * Loads the Zenodo project profile from the repository's SEO assets.
 *
 * @param rootDir repository root containing the SEO assets.
 */
export function loadZenodoProjectProfile(rootDir: string): ZenodoProjectProfileResult {
  const files = new Map<string, string>();
  for (const relativePath of [...REQUIRED_SEO_FILES, ...OPTIONAL_SEO_FILES]) {
    try {
      files.set(relativePath, readFileSync(join(rootDir, relativePath), 'utf8'));
    } catch {
      if ((REQUIRED_SEO_FILES as readonly string[]).includes(relativePath)) {
        return fail('SEO_SOURCE_MISSING', `SEO source file is missing: ${relativePath}`);
      }
    }
  }

  const indexHtml = files.get('index.html');
  const packageJsonRaw = files.get('package.json');
  const cffRaw = files.get('CITATION.cff');
  if (indexHtml === undefined || packageJsonRaw === undefined || cffRaw === undefined) {
    // Unreachable after the required-file loop; keeps the type system honest.
    return fail('SEO_SOURCE_MISSING', 'SEO source files are missing.');
  }

  let jsonLd: { application: JsonLdApplication; website: JsonLdWebsite };
  let packageManifest: {
    readonly name: string;
    readonly version: string;
    readonly description?: string;
    readonly homepage?: string;
    readonly license?: string;
    readonly repository?: { readonly url?: string };
    readonly keywords?: readonly string[];
  };
  let cff: CffDocument;
  try {
    jsonLd = extractJsonLd(indexHtml);
    packageManifest = JSON.parse(packageJsonRaw) as typeof packageManifest;
    cff = parseCitationCff(cffRaw);
  } catch (error) {
    return fail(
      'SEO_PARSE_ERROR',
      `SEO assets failed to parse: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const application = jsonLd.application;
  const website = jsonLd.website;
  const canonicalVersion = isNonEmptyString(packageManifest.version) ? packageManifest.version : '';
  const name = isNonEmptyString(application.name) ? application.name : packageManifest.name;
  const alternateName = isNonEmptyString(application.alternateName)
    ? application.alternateName
    : packageManifest.name;
  const url = isNonEmptyString(application.url)
    ? application.url
    : (extractCanonicalUrl(indexHtml) ?? '');
  const siteUrl = isNonEmptyString(website.url) ? website.url : url;
  const description = isNonEmptyString(application.description)
    ? application.description
    : isNonEmptyString(packageManifest.description)
      ? packageManifest.description
      : (extractMetaContent(indexHtml, 'description') ?? '');
  const repositoryUrl = normalizeRepositoryUrl(
    isNonEmptyString(packageManifest.repository?.url)
      ? packageManifest.repository?.url
      : isNonEmptyString(cff.repositoryCode)
        ? cff.repositoryCode
        : '',
  );
  const license = isNonEmptyString(application.license)
    ? application.license
    : isNonEmptyString(cff.license)
      ? cff.license
      : (isNonEmptyString(packageManifest.license) ? packageManifest.license : '');
  const image = isNonEmptyString(application.image)
    ? application.image
    : (extractMetaContent(indexHtml, 'og:image') ?? '');
  const keywords = new Set<string>([
    ...(Array.isArray(packageManifest.keywords) ? packageManifest.keywords : []),
    ...cff.keywords,
  ]);

  const profile: ZenodoProjectProfile = {
    name,
    alternateName,
    version: canonicalVersion,
    description,
    url,
    siteUrl,
    license,
    image,
    language: isNonEmptyString(application.inLanguage) ? application.inLanguage : 'ru',
    isAccessibleForFree: application.isAccessibleForFree === true,
    repositoryUrl,
    citationTitle: cff.title ?? name,
    citationDateReleased: cff.dateReleased ?? '',
    authors: cff.authors,
    keywords: [...keywords].sort(),
    userAgent: `RICIS3-Expansion-Map/${canonicalVersion} (+${url}) zenodo-dumps/1.0`,
    // `files` holds exactly the SEO assets that were successfully read.
    sourceFiles: [...files.keys()],
  };

  const mismatches: string[] = [];
  if (canonicalVersion.length > 0) {
    if (isNonEmptyString(application.softwareVersion) && application.softwareVersion !== canonicalVersion) {
      mismatches.push(
        `version: package.json=${canonicalVersion} vs index.html JSON-LD softwareVersion=${application.softwareVersion}`,
      );
    }
    if (isNonEmptyString(cff.version) && cff.version !== canonicalVersion) {
      mismatches.push(
        `version: package.json=${canonicalVersion} vs CITATION.cff version=${cff.version}`,
      );
    }
  }
  if (isNonEmptyString(url)) {
    const canonicalLink = extractCanonicalUrl(indexHtml);
    if (canonicalLink !== undefined && canonicalLink !== url) {
      mismatches.push(`url: JSON-LD url=${url} vs canonical link=${canonicalLink}`);
    }
    if (isNonEmptyString(website.url) && website.url !== url) {
      mismatches.push(`url: JSON-LD url=${url} vs JSON-LD WebSite url=${website.url}`);
    }
    if (isNonEmptyString(cff.url) && cff.url !== url) {
      mismatches.push(`url: JSON-LD url=${url} vs CITATION.cff url=${cff.url}`);
    }
    if (isNonEmptyString(packageManifest.homepage) && packageManifest.homepage !== url) {
      mismatches.push(`url: JSON-LD url=${url} vs package.json homepage=${packageManifest.homepage}`);
    }
  }
  const robotsTxt = files.get('public/robots.txt');
  const sitemapXml = files.get('public/sitemap.xml');
  if (robotsTxt !== undefined && sitemapXml !== undefined && url.length > 0) {
    const declared = extractSitemapUrl(robotsTxt);
    const indexed = extractSitemapLocs(sitemapXml);
    const siteRoot = url.endsWith('/') ? url : `${url}/`;
    if (declared !== undefined && declared !== `${siteRoot}sitemap.xml`) {
      mismatches.push(`sitemap: robots.txt Sitemap=${declared} does not match the canonical site URL`);
    }
    for (const loc of indexed) {
      if (!loc.startsWith(siteRoot)) {
        mismatches.push(`sitemap: URL ${loc} is outside the canonical site ${siteRoot}`);
      }
    }
  }
  const finalConsistency: ZenodoProfileConsistency =
    mismatches.length === 0
      ? { status: 'consistent' }
      : { status: 'inconsistent', mismatches };

  return { ok: true, profile, consistency: finalConsistency };
}
