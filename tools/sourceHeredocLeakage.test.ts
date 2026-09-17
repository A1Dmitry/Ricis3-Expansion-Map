// @vitest-environment node
/**
 * Poka-yoke guard against a leaked generation script (root-cause repair, 2026-09-17).
 *
 * Regression: `src/agentGateway/externalExecutorProtocol.ts` was committed with the
 * tail of the shell script that was supposed to write it — the heredoc terminator
 * `EOF`, a second `cat > … <<'EOF'` command and a copy of the test body. As a result
 * `npm run lint` failed with TS2395 `Individual declarations in merged declaration`,
 * TS2304 `Cannot find name 'EOF'`, TS2440 `Import declaration conflicts with local
 * declaration` and TS1499 `Unknown regular expression flag` on lines 114–160, so the
 * CI job "Verify release alignment and TypeScript" could not pass.
 *
 * Repair: the fragment was deleted; module body (lines 1–113) and
 * `externalExecutorProtocol.test.ts` are unchanged. This guard stops the class:
 * a TypeScript/JavaScript source file must not contain a shell heredoc terminator,
 * a heredoc opener or a shell output redirect that leaked out of a generation script.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const SELF_PATH = 'tools/sourceHeredocLeakage.test.ts';

/** Directories whose contents are type-checked or executed by the pipeline. */
const CODE_ROOTS = ['src', 'app', 'server', 'tools', 'scripts'] as const;
const SCANNABLE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs', '.cjs'] as const;
const EXCLUDED_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', 'out', 'coverage']);

export interface LeakPattern {
  readonly id: string;
  readonly description: string;
  readonly pattern: RegExp;
}

/** A leaked script fragment is a shell construct that is never valid source code. */
export const LEAK_PATTERNS: readonly LeakPattern[] = [
  {
    id: 'HEREDOC_TERMINATOR',
    description: 'a line consisting of the heredoc terminator alone',
    pattern: /^\s*EOF\s*$/u,
  },
  {
    id: 'SHELL_REDIRECT',
    description: 'a shell redirect writing a file (cat/tee/printf … > path)',
    pattern: /^\s*(?:cat|tee|printf|echo)\s*>+\s*\/?\S/u,
  },
  {
    id: 'HEREDOC_OPENER',
    description: 'a quoted heredoc opener at the end of the line',
    pattern: /<<-?\s*['"][A-Za-z_][A-Za-z0-9_]*['"]\s*$/u,
  },
];

/** Returns `<line>: <pattern id>` for every leaked script fragment found in `text`. */
export function findLeakedScriptFragments(text: string): string[] {
  const findings: string[] = [];
  text.split('\n').forEach((line, index) => {
    for (const { id, pattern } of LEAK_PATTERNS) {
      if (pattern.test(line)) findings.push(`${index + 1}: ${id}`);
    }
  });
  return findings;
}

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectSourceFiles(full, acc);
    else if (SCANNABLE_EXTENSIONS.some((extension) => entry.endsWith(extension))) acc.push(full);
  }
  return acc;
}

function collectScannableFiles(): string[] {
  const files = CODE_ROOTS.flatMap((root) => collectSourceFiles(join(repositoryRoot, root)));
  for (const entry of readdirSync(repositoryRoot)) {
    if (EXCLUDED_DIRS.has(entry)) continue;
    const full = join(repositoryRoot, entry);
    if (statSync(full).isFile() && SCANNABLE_EXTENSIONS.some((extension) => entry.endsWith(extension))) {
      files.push(full);
    }
  }
  return files.filter((file) => relative(repositoryRoot, file) !== SELF_PATH);
}

describe('source files contain no leaked generation-script fragments', () => {
  const files = collectScannableFiles();

  it('scans a non-empty set of source files', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('detects the exact fragment that broke `npm run lint` on 2026-09-17', () => {
    const leaked = ['  });', '}', "EOF", "cat > src/agentGateway/next.ts <<'EOF'", 'export const x = 1;', 'EOF'].join('\n');
    expect(findLeakedScriptFragments(leaked)).toEqual([
      '3: HEREDOC_TERMINATOR',
      '4: SHELL_REDIRECT',
      '4: HEREDOC_OPENER',
      '6: HEREDOC_TERMINATOR',
    ]);
  });

  it('reports no bare heredoc terminator, opener or shell redirect in any source file', () => {
    const failures = files.flatMap((file) =>
      findLeakedScriptFragments(readFileSync(file, 'utf8')).map(
        (finding) => `${relative(repositoryRoot, file)}:${finding}`,
      ),
    );
    expect(failures).toEqual([]);
  });
});
