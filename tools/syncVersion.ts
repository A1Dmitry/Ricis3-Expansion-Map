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

if (!/^\d+\.\d+\.\d+$/u.test(manifest.version)) {
  throw new Error(`package.json must declare a semantic version, received: ${manifest.version}`);
}

const runtimeVersion = `/** App version RICIS3-Expansion (synced with package.json). */
export const APP_VERSION = '${manifest.version}';
export const APP_NAME = 'RICIS-III Singularity Map';
export const APP_BUILD_LABEL = \`v\${APP_VERSION}\`;
`;

const current = readFileSync(runtimeVersionPath, 'utf8');
if (current !== runtimeVersion) {
  writeFileSync(runtimeVersionPath, runtimeVersion, 'utf8');
  console.log(`Synchronized src/version.ts with package version ${manifest.version}.`);
} else {
  console.log(`src/version.ts already matches package version ${manifest.version}.`);
}
