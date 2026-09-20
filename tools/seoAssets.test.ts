// @vitest-environment node
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

interface PackageManifest {
  readonly version: string;
}

interface SiteManifest {
  readonly name: string;
  readonly short_name: string;
  readonly start_url: string;
  readonly scope: string;
  readonly icons: readonly { readonly src: string; readonly sizes: string; readonly type: string }[];
}

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const pagesUrl = 'https://a1dmitry.github.io/Ricis3-Expansion-Map/';

function readText(relativePath: string): string {
  return readFileSync(join(repositoryRoot, relativePath), 'utf8');
}

function extractJsonLd(indexHtml: string): unknown {
  const match = indexHtml.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/u);
  if (!match?.[1]) throw new Error('index.html must contain one parseable JSON-LD script.');
  return JSON.parse(match[1]) as unknown;
}

describe('Public SEO assets', () => {
  it('publishes one canonical, indexable GitHub Pages URL with descriptive metadata', () => {
    const indexHtml = readText('index.html');

    expect(indexHtml).toContain(`<link rel="canonical" href="${pagesUrl}" />`);
    expect(indexHtml).toContain('name="description"');
    expect(indexHtml).toContain('name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"');
    expect(indexHtml).toContain('<title>RICIS Expansion Map — 3D-карта сингулярностей RICIS-III</title>');
    expect(indexHtml).toContain('<link rel="manifest" href="./site.webmanifest" />');
    expect(indexHtml).toContain('<noscript>');
  });

  it('provides complete Open Graph and Twitter/X metadata with public social-preview assets', () => {
    const indexHtml = readText('index.html');
    const socialPreview = join(repositoryRoot, 'public/ricis-expansion-map-social-preview.png');
    const icon = join(repositoryRoot, 'public/ricis-expansion-map-icon.png');

    for (const name of ['og:type', 'og:site_name', 'og:url', 'og:title', 'og:description', 'og:image', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
      expect(indexHtml).toContain(name);
    }
    expect(indexHtml).toContain(`${pagesUrl}ricis-expansion-map-social-preview.png`);
    expect(existsSync(socialPreview)).toBe(true);
    expect(existsSync(icon)).toBe(true);
    expect(statSync(socialPreview).size).toBeGreaterThan(50_000);
    expect(statSync(icon).size).toBeGreaterThan(20_000);
  });

  it('keeps JSON-LD accurate, parseable, canonical and synchronized with the package version', () => {
    const indexHtml = readText('index.html');
    const packageManifest = JSON.parse(readText('package.json')) as PackageManifest;
    const jsonLd = extractJsonLd(indexHtml) as {
      readonly '@context': string;
      readonly '@graph': readonly Record<string, unknown>[];
    };
    const application = jsonLd['@graph'].find((entry) => entry['@type'] === 'SoftwareApplication');
    const website = jsonLd['@graph'].find((entry) => entry['@type'] === 'WebSite');

    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(application).toMatchObject({
      name: 'RICIS Expansion Map',
      url: pagesUrl,
      operatingSystem: 'Web',
      isAccessibleForFree: true,
      softwareVersion: packageManifest.version,
    });
    expect(website).toMatchObject({ name: 'RICIS Expansion Map', url: pagesUrl });
  });

  it('ships robots, sitemap and web manifest for the exact Pages subpath', () => {
    const robots = readText('public/robots.txt');
    const sitemap = readText('public/sitemap.xml');
    const manifest = JSON.parse(readText('public/site.webmanifest')) as SiteManifest;

    expect(robots).toContain('User-agent: *');
    expect(robots).toContain(`Sitemap: ${pagesUrl}sitemap.xml`);
    expect(sitemap).toContain(`<loc>${pagesUrl}</loc>`);
    expect(manifest).toMatchObject({
      name: 'RICIS Expansion Map — Singularity Research Workspace',
      short_name: 'RICIS Map',
      start_url: './',
      scope: './',
    });
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: 'ricis-expansion-map-icon.png', type: 'image/png' }),
    ]));
  });

  it('merges the public product narrative with transparent trust and SEO boundaries in README', () => {
    const readme = readText('README.md');

    for (const requiredSection of [
      '## Что делает RICIS Expansion Map',
      '## Возможности',
      '### Core-first вычисление и понятное восстановление',
      '### Локальный структурный анализ — только диагностика',
      '### Proof workspace и честная граница Lean',
      '## SEO и discoverability',
    ]) {
      expect(readme).toContain(requiredSection);
    }
    expect(readme).toContain('не обещает автоматическое первое место в выдаче');
    expect(readme).toContain('**Состояние узла карты не равно Lean kernel verification.**');
  });
});
