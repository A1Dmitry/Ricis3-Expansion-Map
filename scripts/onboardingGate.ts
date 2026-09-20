/**
 * Onboarding gate («ворота допуска исполнителя», G0).
 *
 * Normative source: docs/00-governance/EXECUTION_TRACEABILITY_GATES.md §0.
 * Pure primitives: tools/onboardingGate.ts.
 *
 * Commands:
 *   tsx scripts/onboardingGate.ts --check [--key <ключ>]
 *       G0: the executor registered in docs/00-governance/EXECUTOR_KEY.md (or --key)
 *       must have a valid attestation for the CURRENT revision of every mandatory
 *       document. Exit 1 = not admitted (andon).
 *
 *   tsx scripts/onboardingGate.ts --attest [--key <ключ>]
 *       Writes docs/00-governance/onboarding/<ключ>.json with document hashes
 *       filled in and EMPTY acceptance/answers. The executor fills them by hand
 *       after reading. Never overwrites a valid attestation silently.
 *
 *   tsx scripts/onboardingGate.ts --questions
 *       Prints the comprehension questions and their sources.
 *
 * Exit codes: 0 — допущен/выполнено; 1 — не допущен (andon); 2 — ошибка использования.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { EXECUTOR_KEY_FILE, extractRegisteredKey } from '../tools/executorTraceability';
import {
  ONBOARDING_QUESTIONS,
  attestationPathFor,
  requiredQuotesFor,
  buildAttestationSkeleton,
  checkOnboarding,
  type FileReader,
} from '../tools/onboardingGate';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const readFromTree: FileReader = (path) => {
  const absolute = join(repositoryRoot, path);
  return existsSync(absolute) ? readFileSync(absolute) : null;
};

function usage(): number {
  console.error('usage: onboardingGate --check [--key <ключ>] | --attest [--key <ключ>] | --questions');
  return 2;
}

function resolveKey(explicit: string | null): string | null {
  if (explicit !== null) return explicit;
  const registered = readFromTree(EXECUTOR_KEY_FILE);
  return registered === null ? null : extractRegisteredKey(registered.toString());
}

const argv = process.argv.slice(2);
type Mode = 'check' | 'attest' | 'questions';
let mode: Mode | null = null;
let key: string | null = null;
for (let index = 0; index < argv.length; index += 1) {
  const arg = argv[index];
  if (arg === '--check' || arg === '--attest' || arg === '--questions') {
    mode = arg.slice(2) as Mode;
  } else if (arg === '--key') {
    const next = argv[index + 1];
    if (next === undefined || !/^[0-9a-f]{64}$/u.test(next)) process.exit(usage());
    key = next;
    index += 1;
  } else {
    process.exit(usage());
  }
}
if (mode === null) process.exit(usage());

if (mode === 'questions') {
  for (const question of ONBOARDING_QUESTIONS) {
    console.log(`${question.id} [${question.kind}] ${question.question}\n    источник: ${question.source}`);
  }
  const quoteKey = resolveKey(key);
  if (quoteKey !== null) {
    console.log('\nПерсональные цитаты (поле quotes — дословно указанная строка документа):');
    for (const required of requiredQuotesFor(quoteKey, readFromTree)) {
      console.log(`  ${required.path} — строка ${required.lineNumber}`);
    }
  }
  process.exit(0);
}

const executorKey = resolveKey(key);
if (executorKey === null) {
  console.error(`ONBOARDING GATE: ключ исполнителя не зарегистрирован (${EXECUTOR_KEY_FILE}) и не передан через --key`);
  process.exit(1);
}

if (mode === 'attest') {
  const existing = checkOnboarding(executorKey, readFromTree);
  if (existing.ok) {
    console.log(`ONBOARDING GATE: аттестация для ${executorKey} уже действительна — перезапись не нужна`);
    process.exit(0);
  }
  const skeleton = buildAttestationSkeleton(executorKey, readFromTree, new Date());
  const target = join(repositoryRoot, attestationPathFor(executorKey));
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(skeleton, null, 2)}\n`, 'utf8');
  console.log(`ONBOARDING GATE: создан каркас ${attestationPathFor(executorKey)}.`);
  console.log('Заполните `acceptance` точной формулой ACCEPTANCE_STATEMENT и ответы `comprehension` после прочтения документов,');
  console.log('затем выполните `npm run onboarding:gate`. Вопросы: `npm run onboarding:gate -- --questions`.');
  process.exit(0);
}

const result = checkOnboarding(executorKey, readFromTree);
if (result.ok) {
  console.log(`ONBOARDING GATE: допущен (ключ ${executorKey.slice(0, 12)}…, документов аттестовано: ${result.documents})`);
  process.exit(0);
}
console.error(`ONBOARDING GATE: НЕ ДОПУЩЕН (ключ ${executorKey.slice(0, 12)}…)`);
for (const violation of result.violations) {
  console.error(`  [${violation.code}] ${violation.message}`);
}
process.exit(1);
