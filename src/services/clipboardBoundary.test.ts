import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const sourceRoot = join(process.cwd(), 'src');

function sourceFilesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFilesUnder(path);
    return statSync(path).isFile() && /\.(tsx?|jsx?)$/.test(entry.name) ? [path] : [];
  });
}

describe('clipboard boundary', () => {
  it('keeps raw Clipboard API access inside the guarded clipboard service', () => {
    const offenders = sourceFilesUnder(sourceRoot)
      .filter((path) => !path.endsWith('/services/clipboard.ts'))
      .filter((path) => !path.endsWith('.test.ts') && !path.endsWith('.test.tsx'))
      .filter((path) => /navigator\.clipboard/.test(readFileSync(path, 'utf8')));

    expect(offenders).toEqual([]);
  });
});
