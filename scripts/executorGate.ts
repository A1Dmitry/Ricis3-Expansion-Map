/**
 * Executor traceability gate ("ворота трассировки исполнителя").
 *
 * Normative source: docs/00-governance/EXECUTION_TRACEABILITY_GATES.md.
 * Pure primitives: tools/executorTraceability.ts.
 *
 * Commands:
 *   tsx scripts/executorGate.ts --check-headers [--base <git-ref>]
 *       G1: every commit in <base>..HEAD must carry the header
 *       «исполнитель : <ключ>» whose key equals the key registered in
 *       docs/00-governance/EXECUTOR_KEY.md as of that very commit.
 *
 *   tsx scripts/executorGate.ts --forensics <good-ref> [--policy restudy|reject] [-- <test command...>]
 *       G2: bisect the GitHub history with the test command (default `npm test`),
 *       find the first commit that broke functionality, extract its executor
 *       key from the header and emit the verdict: mandatory full documentation
 *       study (restudy) or immediate reject (reject / unattributable).
 *
 * Exit codes: 0 — чисто; 1 — нарушение ворот (andon); 2 — ошибка использования.
 *
 * Stop-the-line semantics as in tpsGate: a non-zero exit IS the andon lamp.
 * CI runs G1 in .github/workflows/pr-verify.yml.
 */

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EXECUTOR_KEY_FILE,
  MANDATORY_STUDY_DOCUMENTS,
  buildForensicsVerdict,
  extractRegisteredKey,
  parseExecutorHeader,
  type ForensicsPolicy,
} from '../tools/executorTraceability';
import { ONBOARDING_DIR, attestationPathFor, checkOnboarding, type FileReader } from '../tools/onboardingGate';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function git(args: readonly string[]): string {
  const result = spawnSync('git', args, { cwd: repositoryRoot, encoding: 'utf8' });
  if (result.error !== undefined && result.error !== null) {
    throw new Error(`git ${args.join(' ')} не выполнен: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `git ${args.join(' ')} завершился с кодом ${String(result.status)}: ${(result.stderr ?? '').trim()}`,
    );
  }
  return result.stdout;
}

/** git call whose failure is expected and ignored (e.g. stale bisect cleanup). */
function gitAllowFailure(args: readonly string[]): string {
  try {
    return git(args);
  } catch {
    return '';
  }
}

function runHeaderCheck(baseRef: string): number {
  const shas = git(['rev-list', '--reverse', `${baseRef}..HEAD`])
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');

  if (shas.length === 0) {
    console.log('EXECUTOR GATE: чисто (в диапазоне нет коммитов)');
    return 0;
  }

  const violations: string[] = [];
  for (const sha of shas) {
    const short = sha.slice(0, 12);
    const subject = git(['log', '-1', '--format=%s', sha]).trim();

    const header = parseExecutorHeader(subject);
    if (!header.ok) {
      violations.push(`[${header.code}] ${short} — ${header.message}`);
      continue;
    }

    let registeredMarkdown: string;
    try {
      registeredMarkdown = git(['show', `${sha}:${EXECUTOR_KEY_FILE}`]);
    } catch {
      violations.push(
        `[EXECUTOR_KEY_NOT_REGISTERED] ${short} — в коммите нет регистрации ключа (${EXECUTOR_KEY_FILE})`,
      );
      continue;
    }
    const registered = extractRegisteredKey(registeredMarkdown);
    if (registered === null) {
      violations.push(
        `[EXECUTOR_KEY_NOT_REGISTERED] ${short} — ${EXECUTOR_KEY_FILE} не содержит строку executor_key`,
      );
      continue;
    }
    if (registered !== header.key) {
      violations.push(
        `[EXECUTOR_KEY_MISMATCH] ${short} — ключ в заголовке не совпадает с зарегистрированным на этот коммит`,
      );
      continue;
    }

    // G0 at commit granularity: the executor must have been admitted (valid attestation
    // for the document revisions present in THIS commit) — an unread or since-changed
    // normative document blocks the commit, not only the working tree.
    const readAtCommit: FileReader = (path) => {
      try {
        return git(['show', `${sha}:${path}`]);
      } catch {
        return null;
      }
    };
    const onboarding = checkOnboarding(header.key, readAtCommit);
    if (!onboarding.ok) {
      for (const violation of onboarding.violations) {
        violations.push(`[${violation.code}] ${short} — ${violation.message}`);
      }
      continue;
    }

    // Provenance of the attestation (red-team R3, 2026-09-20): an attestation file is
    // evidence only if every commit that ever wrote it carried the SAME executor key in
    // its header and that commit itself touched nothing but onboarding/EXECUTOR_KEY files
    // or the mandatory documents themselves (a norm change must be re-attested in the same
    // commit by its author). A file copied from another executor or smuggled in together
    // with work is not that executor's reading.
    const attestationPath = attestationPathFor(header.key);
    const writers = git(['log', '--format=%H %s', sha, '--', attestationPath])
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '')
      .map((line) => ({ sha: line.slice(0, 40), subject: line.slice(41) }));
    if (writers.length === 0) {
      violations.push(
        `[ONBOARDING_ATTESTATION_UNCOMMITTED] ${short} — аттестация ${attestationPath} не записана ни одним коммитом`,
      );
      continue;
    }
    for (const writer of writers) {
      const parsed = parseExecutorHeader(writer.subject);
      if (!parsed.ok || parsed.key !== header.key) {
        violations.push(
          `[ONBOARDING_ATTESTATION_FOREIGN] ${short} — аттестация ${attestationPath} записана коммитом ${writer.sha.slice(0, 12)} с другим/отсутствующим ключом: чужая аттестация не является прочтением этого исполнителя`,
        );
        break;
      }
      const touched = git(['show', '--format=', '--name-only', writer.sha])
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '');
      const smuggled = touched.filter(
        (path) => !path.startsWith(`${ONBOARDING_DIR}/`) && path !== EXECUTOR_KEY_FILE && !MANDATORY_STUDY_DOCUMENTS.includes(path),
      );
      if (smuggled.length > 0) {
        violations.push(
          `[ONBOARDING_ATTESTATION_NOT_ISOLATED] ${short} — коммит аттестации ${writer.sha.slice(0, 12)} одновременно меняет рабочие файлы (${smuggled.slice(0, 3).join(', ')}${smuggled.length > 3 ? ', …' : ''}): прочтение фиксируется ОТДЕЛЬНЫМ коммитом до начала работы`,
        );
        break;
      }
    }
  }

  if (violations.length === 0) {
    console.log(`EXECUTOR GATE: чисто (проверено коммитов: ${shas.length}, база ${baseRef})`);
    return 0;
  }

  console.error(`EXECUTOR GATE: нарушений ${violations.length} (база ${baseRef})`);
  for (const violation of violations) {
    console.error(`  - ${violation}`);
  }
  console.error('andon: PR не может быть принят, пока заголовки не приведены к правилу §2 (amend/rebase).');
  return 1;
}

function runForensics(goodRef: string, policy: ForensicsPolicy, testCommand: readonly string[]): number {
  if (git(['status', '--porcelain']).trim() !== '') {
    console.error('EXECUTOR GATE: рабочее дерево не чистое — форензика bisect невозможна (andon)');
    return 1;
  }

  gitAllowFailure(['bisect', 'reset']);
  try {
    git(['bisect', 'start', 'HEAD', goodRef]);
    const run = spawnSync('git', ['bisect', 'run', ...testCommand], {
      cwd: repositoryRoot,
      stdio: 'inherit',
    });
    if ((run.status ?? 1) !== 0) {
      console.error('EXECUTOR GATE: bisect не смог определить плохой коммит (andon)');
      return 1;
    }

    const bisectLog = git(['bisect', 'log']);
    const match = /# first bad commit: \[([0-9a-f]{40})\] (.*)/.exec(bisectLog);
    if (match === null) {
      console.error('EXECUTOR GATE: первый плохой коммит не найден в журнале bisect (andon)');
      return 1;
    }

    const verdict = buildForensicsVerdict({
      badCommitSha: match[1],
      badCommitSubject: match[2].trim(),
      policy,
    });
    console.log(`EXECUTOR GATE FORENSICS: вердикт ${verdict.verdict}`);
    for (const line of verdict.report) {
      console.log(`  ${line}`);
    }
    if (verdict.verdict === 'MANDATORY_DOCUMENTATION_STUDY') {
      console.log(`  trailer исправляющего коммита: documentation-restudy: ${verdict.executorKey}`);
    }
    return 0;
  } finally {
    gitAllowFailure(['bisect', 'reset']);
  }
}

interface GateOptions {
  readonly mode: 'check-headers' | 'forensics';
  readonly baseRef: string;
  readonly goodRef: string | null;
  readonly policy: ForensicsPolicy;
}

function usage(): number {
  console.error('использование:');
  console.error('  tsx scripts/executorGate.ts --check-headers [--base <git-ref>]');
  console.error(
    '  tsx scripts/executorGate.ts --forensics <good-ref> [--policy restudy|reject] [-- <тестовая команда...>]',
  );
  return 2;
}

function parseOptions(argv: readonly string[]): GateOptions | null {
  let mode: GateOptions['mode'] | null = null;
  let baseRef = 'origin/main';
  let goodRef: string | null = null;
  let policy: ForensicsPolicy = 'restudy';

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--check-headers') {
      mode = 'check-headers';
    } else if (arg === '--forensics') {
      mode = 'forensics';
      const next = argv[index + 1];
      if (next === undefined || next.startsWith('--')) {
        return null;
      }
      goodRef = next;
      index += 1;
    } else if (arg === '--base') {
      const next = argv[index + 1];
      if (next === undefined || next.startsWith('--')) {
        return null;
      }
      baseRef = next;
      index += 1;
    } else if (arg === '--policy') {
      const next = argv[index + 1];
      if (next !== 'restudy' && next !== 'reject') {
        return null;
      }
      policy = next;
      index += 1;
    } else {
      return null;
    }
  }

  if (mode === null) {
    return null;
  }
  return { mode, baseRef, goodRef, policy };
}

const argv = process.argv.slice(2);
const separator = argv.indexOf('--');
const gateArgv = separator === -1 ? argv : argv.slice(0, separator);
const testCommand = separator === -1 ? ['npm', 'test'] : argv.slice(separator + 1);

const options = parseOptions(gateArgv);
if (options === null || (options.mode === 'forensics' && options.goodRef === null)) {
  process.exit(usage());
}

if (options.mode === 'check-headers') {
  process.exit(runHeaderCheck(options.baseRef));
}

process.exit(runForensics(options.goodRef as string, options.policy, testCommand));
