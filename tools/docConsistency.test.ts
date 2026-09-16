// ============================================================================
// BUG-11 REGRESSION (anti-tuhta): documented numbers must be exact,
// version-pinned and verifiable — no drifting "1500+" claims.
// ============================================================================

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const read = (p: string): string => readFileSync(resolve(root, p), 'utf8');

interface TestCountSnapshot {
  version: string;
  testFiles: number;
  testCount: number;
}

const snapshot = JSON.parse(read('tools/testCountSnapshot.json')) as TestCountSnapshot;
const pkg = JSON.parse(read('package.json')) as { version: string };
const readme = read('README.md');

describe('BUG-11: doc consistency (anti-tuhta)', () => {
  it('snapshot is pinned to the current package version', () => {
    expect(snapshot.version).toBe(pkg.version);
  });

  it('README states the exact test count matching the snapshot', () => {
    const m = readme.match(/\((\d+) unit-тестов в (\d+) файлах/);
    expect(m, 'README must state the exact test count as "(N unit-тестов в M файлах)"').toBeTruthy();
    expect(Number(m![1])).toBe(snapshot.testCount);
    expect(Number(m![2])).toBe(snapshot.testFiles);
  });

  it('README pins the claim to the current version', () => {
    expect(readme).toContain(`snapshot v${pkg.version}`);
  });

  it('README no longer carries the stale "1500+" claim', () => {
    expect(readme).not.toMatch(/1500\+ unit-тестов/);
  });

  it('QA_RECURSIVE_AUDIT_REPORT carries the AUDITOR marker and historical status', () => {
    const qa = read('QA_RECURSIVE_AUDIT_REPORT.md');
    expect(qa).toContain('AUDITOR: SELF (same-pipeline)');
    expect(qa).toContain('СТАТУС: ИСТОРИЧЕСКИЙ СНАПШОТ');
    expect(qa).toContain('VALID_APPLET_IDS');
  });
});
