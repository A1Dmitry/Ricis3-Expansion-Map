// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { loadZenodoProjectProfile } from './seoProjectProfile';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const tempDirs: string[] = [];

function readText(relativePath: string): string {
  return readFileSync(join(repositoryRoot, relativePath), 'utf8');
}

function makeTempRoot(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'zenodo-seo-'));
  tempDirs.push(root);
  for (const [relativePath, content] of Object.entries(files)) {
    const target = join(root, relativePath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content, 'utf8');
  }
  return root;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const root = tempDirs.pop();
    if (root !== undefined) rmSync(root, { recursive: true, force: true });
  }
});

describe('Zenodo project profile from SEO assets', () => {
  it('parses the real repository SEO assets into a complete profile', () => {
    const result = loadZenodoProjectProfile(repositoryRoot);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { profile } = result;
    const packageManifest = JSON.parse(readText('package.json')) as { version: string };

    expect(profile.name).toBe('RICIS Expansion Map');
    expect(profile.alternateName).toBe('RICIS3-Expansion-Map');
    expect(profile.version).toBe(packageManifest.version);
    expect(profile.url).toBe('https://a1dmitry.github.io/Ricis3-Expansion-Map/');
    expect(profile.siteUrl).toBe('https://a1dmitry.github.io/Ricis3-Expansion-Map/');
    expect(profile.language).toBe('ru');
    expect(profile.isAccessibleForFree).toBe(true);
    expect(profile.license).toContain('mit');
    expect(profile.image).toContain('ricis-expansion-map-social-preview.png');
    expect(profile.repositoryUrl).toBe('https://github.com/A1Dmitry/Ricis3-Expansion-Map');
    expect(profile.description.length).toBeGreaterThan(10);
    expect(profile.citationTitle).toBe('RICIS3-Expansion-Map');
    expect(profile.citationDateReleased).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
    expect(profile.authors).toEqual([
      { name: 'Aleinikov, Dmitry', orcid: 'https://orcid.org/0009-0004-3226-7700' },
    ]);
    expect(profile.keywords).toEqual(expect.arrayContaining(['RICIS-III', 'Lean 4']));
    expect(profile.sourceFiles).toEqual(
      expect.arrayContaining(['index.html', 'package.json', 'CITATION.cff', 'public/robots.txt', 'public/sitemap.xml']),
    );
    expect(profile.userAgent).toBe(
      `RICIS3-Expansion-Map/${packageManifest.version} (+https://a1dmitry.github.io/Ricis3-Expansion-Map/) zenodo-dumps/1.0`,
    );
  });

  it('reports version and URL consistency across all SEO surfaces for the real repository', () => {
    const result = loadZenodoProjectProfile(repositoryRoot);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.consistency).toEqual({ status: 'consistent' });
  });

  it('fails with SEO_SOURCE_MISSING when a required SEO asset is absent', () => {
    const root = makeTempRoot({ 'index.html': '<html></html>' });
    const result = loadZenodoProjectProfile(root);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toEqual({
      code: 'SEO_SOURCE_MISSING',
      message: 'SEO source file is missing: package.json',
    });
  });

  it('fails with SEO_PARSE_ERROR when JSON-LD is malformed', () => {
    const root = makeTempRoot({
      'index.html':
        '<html><head><script type="application/ld+json">{broken json</script></head></html>',
      'package.json': JSON.stringify({ name: 'x', version: '1.0.0' }),
      'CITATION.cff': 'title: "X"\nversion: 1.0.0\n',
    });
    const result = loadZenodoProjectProfile(root);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('SEO_PARSE_ERROR');
  });

  it('requires a SoftwareApplication and a WebSite entry in the JSON-LD graph', () => {
    const base = {
      'package.json': JSON.stringify({ name: 'x', version: '1.0.0' }),
      'CITATION.cff': 'title: "X"\nversion: 1.0.0\n',
    };
    const withoutApplication = makeTempRoot({
      ...base,
      'index.html':
        '<html><head><script type="application/ld+json">{"@graph":[{"@type":"WebSite","name":"W","url":"https://w.example/"}]}</script></head></html>',
    });
    const withoutApplicationResult = loadZenodoProjectProfile(withoutApplication);
    expect(withoutApplicationResult.ok).toBe(false);
    if (!withoutApplicationResult.ok) {
      expect(withoutApplicationResult.error.code).toBe('SEO_PARSE_ERROR');
    }

    const withoutWebsite = makeTempRoot({
      ...base,
      'index.html':
        '<html><head><script type="application/ld+json">{"@graph":[{"@type":"SoftwareApplication","name":"A","url":"https://a.example/"}]}</script></head></html>',
    });
    const withoutWebsiteResult = loadZenodoProjectProfile(withoutWebsite);
    expect(withoutWebsiteResult.ok).toBe(false);
    if (!withoutWebsiteResult.ok) {
      expect(withoutWebsiteResult.error.code).toBe('SEO_PARSE_ERROR');
    }
  });

  it('flags version drift between package.json, JSON-LD and CITATION.cff without failing the profile', () => {
    const root = makeTempRoot({
      'index.html':
        '<html><head><link rel="canonical" href="https://a.example/"><script type="application/ld+json">{"@graph":[{"@type":"SoftwareApplication","name":"A","alternateName":"A","url":"https://a.example/","softwareVersion":"9.9.9","inLanguage":"ru","isAccessibleForFree":true},{"@type":"WebSite","name":"A","url":"https://a.example/"}]}</script></head></html>',
      'package.json': JSON.stringify({ name: 'x', version: '1.0.0', homepage: 'https://a.example/' }),
      'CITATION.cff': 'title: "A"\nversion: 0.5.0\nurl: "https://a.example/"\n',
    });
    const result = loadZenodoProjectProfile(root);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.version).toBe('1.0.0');
    expect(result.profile.userAgent).toContain('/1.0.0 ');
    expect(result.consistency.status).toBe('inconsistent');
    if (result.consistency.status === 'inconsistent') {
      expect(result.consistency.mismatches).toEqual(
        expect.arrayContaining([
          'version: package.json=1.0.0 vs index.html JSON-LD softwareVersion=9.9.9',
          'version: package.json=1.0.0 vs CITATION.cff version=0.5.0',
        ]),
      );
    }
  });

  it('flags a sitemap URL that leaves the canonical site', () => {
    const root = makeTempRoot({
      'index.html':
        '<html><head><link rel="canonical" href="https://a.example/"><script type="application/ld+json">{"@graph":[{"@type":"SoftwareApplication","name":"A","alternateName":"A","url":"https://a.example/","softwareVersion":"1.0.0"},{"@type":"WebSite","name":"A","url":"https://a.example/"}]}</script></head></html>',
      'package.json': JSON.stringify({ name: 'x', version: '1.0.0', homepage: 'https://a.example/' }),
      'CITATION.cff': 'title: "A"\nversion: 1.0.0\nurl: "https://a.example/"\n',
      'public/robots.txt': 'User-agent: *\nSitemap: https://a.example/sitemap.xml\n',
      'public/sitemap.xml':
        '<?xml version="1.0"?><urlset><url><loc>https://a.example/</loc></url><url><loc>https://other.example/</loc></url></urlset>',
    });
    const result = loadZenodoProjectProfile(root);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.consistency.status).toBe('inconsistent');
    if (result.consistency.status === 'inconsistent') {
      expect(result.consistency.mismatches.join('\n')).toContain('https://other.example/');
    }
  });

  it('parses multiple authors and keywords from CITATION.cff', () => {
    const root = makeTempRoot({
      'index.html':
        '<html><head><link rel="canonical" href="https://a.example/"><script type="application/ld+json">{"@graph":[{"@type":"SoftwareApplication","name":"A","alternateName":"A","url":"https://a.example/","softwareVersion":"1.0.0"},{"@type":"WebSite","name":"A","url":"https://a.example/"}]}</script></head></html>',
      'package.json': JSON.stringify({ name: 'x', version: '1.0.0', homepage: 'https://a.example/' }),
      'CITATION.cff': [
        'title: "A"',
        'version: 1.0.0',
        'url: "https://a.example/"',
        'authors:',
        '  - family-names: Aleinikov',
        '    given-names: Dmitry',
        '    orcid: "https://orcid.org/0009-0004-3226-7700"',
        '  - family-names: Second',
        '    given-names: Author',
        'keywords:',
        '  - alpha',
        '  - beta',
      ].join('\n'),
    });
    const result = loadZenodoProjectProfile(root);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.authors).toEqual([
      { name: 'Aleinikov, Dmitry', orcid: 'https://orcid.org/0009-0004-3226-7700' },
      { name: 'Second, Author' },
    ]);
    expect(result.profile.keywords).toContain('alpha');
    expect(result.profile.keywords).toContain('beta');
  });
});
