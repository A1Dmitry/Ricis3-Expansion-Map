// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const EXCLUDED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'out',
  'coverage',
  '.turbo',
  '.next',
  '.nuxt',
]);

function collectJsonFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (EXCLUDED_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) collectJsonFiles(full, acc);
    else if (entry.endsWith('.json')) acc.push(full);
  }
  return acc;
}

/**
 * Repo-wide JSON guard (sync scan 2026-09-15): every *.json in the working tree
 * must be strict-parseable and NUL-free. Regression: docs/russian-resource-manifest.json
 * carried ~73KB of binary tail garbage that broke JSON.parse.
 */
describe('repo-wide JSON validity', () => {
  const files = collectJsonFiles(repositoryRoot);

  it('finds JSON files to validate', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('parses every *.json strictly and finds no NUL bytes', () => {
    const failures: string[] = [];
    for (const full of files) {
      const rel = relative(repositoryRoot, full);
      const bytes = readFileSync(full);
      if (bytes.includes(0)) {
        failures.push(`${rel}: contains NUL byte(s)`);
        continue;
      }
      try {
        JSON.parse(bytes.toString('utf8'));
      } catch (error) {
        failures.push(`${rel}: ${(error as Error).message}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
