// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

interface PackageManifest {
  readonly version: string;
  readonly packageManager?: string;
  readonly license?: string;
  readonly homepage?: string;
  readonly bugs?: { readonly url?: string };
  readonly repository?: { readonly type?: string; readonly url?: string };
  readonly keywords?: readonly string[];
}

interface PackageLock {
  readonly lockfileVersion: number;
  readonly packages?: {
    readonly '': {
      readonly version: string;
    };
  };
}

interface VersionedDocument {
  readonly path: string;
  readonly versionPattern: RegExp;
}

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const activeReleaseDocuments: readonly VersionedDocument[] = [
  {
    path: 'README.md',
    versionPattern: /\*\*Версия:\s*v?(\d+\.\d+\.\d+)\*\*/u,
  },
  {
    path: 'docs/05-evidence/architecture/telegram-tokenpool-remediation-2026-08-18.md',
    versionPattern: /\*\*Версия:\*\*\s*(\d+\.\d+\.\d+)/u,
  },
  {
    path: 'docs/05-evidence/proofs/lean-boundary-audit-2026-08-18.md',
    versionPattern: /\*\*Версия:\*\*\s*(\d+\.\d+\.\d+)/u,
  },
  {
    path: 'docs/05-evidence/architecture/structural-hash-report.md',
    versionPattern: /\*\*Релиз приложения:\*\*\s*(\d+\.\d+\.\d+)/u,
  },
  {
    path: 'CITATION.cff',
    versionPattern: /^version:\s*(\d+\.\d+\.\d+)\s*$/mu,
  },
];

const canonicalPagesBase = '/Ricis3-Expansion-Map/';
const canonicalPagesUrl = `https://a1dmitry.github.io${canonicalPagesBase}`;

const requiredActions: Readonly<Record<string, string>> = {
  'actions/checkout': 'v7.0.1',
  'actions/setup-node': 'v7.0.0',
  'actions/configure-pages': 'v6.0.0',
  'actions/upload-pages-artifact': 'v5.0.0',
  'actions/deploy-pages': 'v5.0.0',
};

function readText(relativePath: string): string {
  return readFileSync(join(repositoryRoot, relativePath), 'utf8');
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function extractVersion(content: string, pattern: RegExp, path: string): string {
  const matched = content.match(pattern);
  expect(matched, `${path} must declare an active release version`).not.toBeNull();
  return matched?.[1] ?? '';
}

describe('release alignment policy', () => {
  const packageManifest = readJson<PackageManifest>('package.json');
  const canonicalVersion = packageManifest.version;

  it('uses a semantic canonical package version', () => {
    expect(canonicalVersion).toMatch(/^\d+\.\d+\.\d+$/u);
  });

  it('keeps the runtime build label synchronized with package.json', () => {
    const runtimeVersion = extractVersion(
      readText('src/version.ts'),
      /APP_VERSION\s*=\s*'([^']+)'/u,
      'src/version.ts',
    );

    expect(runtimeVersion).toBe(canonicalVersion);
  });

  it.each(activeReleaseDocuments)(
    'keeps $path synchronized with the canonical release version',
    ({ path, versionPattern }) => {
      expect(extractVersion(readText(path), versionPattern, path)).toBe(canonicalVersion);
    },
  );

  it('records the same release in the npm lockfile', () => {
    const lockfile = readJson<PackageLock>('package-lock.json');
    expect(lockfile.lockfileVersion).toBeGreaterThanOrEqual(3);
    expect(lockfile.packages?.[''].version).toBe(canonicalVersion);
  });

  it('declares npm as the primary package manager', () => {
    expect(packageManifest.packageManager ?? '').toMatch(/^npm@\d+\.\d+\.\d+/u);
  });

  it('publishes complete research-software metadata', () => {
    expect(packageManifest.license).toBe('MIT');
    expect(packageManifest.homepage).toBe(canonicalPagesUrl);
    expect(packageManifest.bugs?.url).toBe('https://github.com/A1Dmitry/Ricis3-Expansion-Map/issues');
    expect(packageManifest.repository).toMatchObject({
      type: 'git',
      url: 'git+https://github.com/A1Dmitry/Ricis3-Expansion-Map.git',
    });
    expect(packageManifest.keywords).toEqual(expect.arrayContaining(['ricis-iii', 'formal-verification', 'lean4']));
    expect(readText('CITATION.cff')).toContain('repository-code: "https://github.com/A1Dmitry/Ricis3-Expansion-Map"');
  });

  it('uses Node 22 and currently supported GitHub Actions releases for Pages', () => {
    const workflow = readText('.github/workflows/deploy-pages.yml');
    expect(workflow).toMatch(/node-version:\s*['"]?22['"]?/u);

    for (const [action, version] of Object.entries(requiredActions)) {
      expect(workflow).toContain(`uses: ${action}@${version}`);
    }
  });

  it('uses the canonical repository slug for public Pages assets and the README demo', () => {
    const viteConfig = readText('vite.config.ts');
    const readme = readText('README.md');

    expect(viteConfig).toContain(`const GITHUB_PAGES_BASE = '${canonicalPagesBase}'`);
    expect(viteConfig).not.toContain('/RICIS3-Expansion/');
    expect(readme).toContain(`(${canonicalPagesUrl})`);
    expect(readme).not.toContain('https://a1dmitry.github.io/RICIS3-Expansion/');
  });
});
