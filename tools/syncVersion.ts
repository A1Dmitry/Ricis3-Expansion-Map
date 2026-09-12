import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

interface PackageManifest {
  readonly version: string;
}

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const packagePath = join(repositoryRoot, 'package.json');
const runtimeVersionPath = join(repositoryRoot, 'src', 'version.ts');
const manifest = JSON.parse(readFileSync(packagePath, 'utf8')) as PackageManifest;
const version = manifest.version;

if (!/^\d+\.\d+\.\d+$/u.test(version)) {
  throw new Error(`package.json must declare a semantic version, received: ${version}`);
}

const runtimeVersion = `/** App version RICIS3-Expansion (synced with package.json). */
export const APP_VERSION = '${version}';
export const APP_NAME = 'RICIS-III Singularity Map';
export const APP_BUILD_LABEL = \`v\${APP_VERSION}\`;
`;

writeFileSync(runtimeVersionPath, runtimeVersion, 'utf8');
console.log(`Synchronized src/version.ts with package version ${version}.`);

const documentsToUpdate = [
  {
    path: 'index.html',
    regex: /("softwareVersion":\s*")(\d+\.\d+\.\d+)(")/u,
    replace: `$1${version}$3`,
  },
  {
    path: 'README.md',
    regex: /(\*\*Версия:\s*v?)(\d+\.\d+\.\d+)(\*\*)/u,
    replace: `$1${version}$3`,
  },
  {
    path: 'docs/05-evidence/architecture/telegram-tokenpool-remediation-2026-08-18.md',
    regex: /(\*\*Версия:\*\*\s*)(\d+\.\d+\.\d+)/u,
    replace: `$1${version}`,
  },
  {
    path: 'docs/05-evidence/proofs/lean-boundary-audit-2026-08-18.md',
    regex: /(\*\*Версия:\*\*\s*)(\d+\.\d+\.\d+)/u,
    replace: `$1${version}`,
  },
  {
    path: 'docs/05-evidence/architecture/structural-hash-report.md',
    regex: /(\*\*Релиз приложения:\*\*\s*)(\d+\.\d+\.\d+)/u,
    replace: `$1${version}`,
  },
  {
    path: 'CITATION.cff',
    regex: /^(version:\s*)(\d+\.\d+\.\d+)(\s*)$/mu,
    replace: `$1${version}$3`,
  },
];

for (const doc of documentsToUpdate) {
  const docPath = join(repositoryRoot, doc.path);
  try {
    const content = readFileSync(docPath, 'utf8');
    const updated = content.replace(doc.regex, doc.replace);
    if (content !== updated) {
      writeFileSync(docPath, updated, 'utf8');
      console.log(`Updated version in ${doc.path} to ${version}`);
    }
  } catch (err) {
    console.warn(`Could not update ${doc.path}:`, err);
  }
}
