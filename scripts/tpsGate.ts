/**
 * TPS line gate: reads docs/00-governance/tps/board.json, validates it through the
 * standard-work guard (tools/tpsStandardWork.ts) and prints the andon board.
 *
 * Commands:
 *   tsx scripts/tpsGate.ts                 # validate board + documentation consistency; exit 1 on any violation
 *   tsx scripts/tpsGate.ts --emit-board      # additionally rewrite docs/00-governance/tps/BOARD.md
 *   tsx scripts/tpsGate.ts --check-board     # fail if BOARD.md drifted from board.json (generated file, no hand edits)
 *
 * Stop-the-line semantics: a non-zero exit IS the andon lamp. CI runs it in
 * .github/workflows/pr-verify.yml, so a card cannot reach `done` on narration alone.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BOARD_MARKDOWN_PATH,
  isLineStoppingEvent,
  loadBoard,
  renderBoard,
  validateBoardAndLine,
  validateDocumentationConsistency,
  type TpsBoard,
  type TpsViolation,
} from '../tools/tpsStandardWork';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));

function groupByCode(violations: TpsViolation[]): Map<string, TpsViolation[]> {
  const grouped = new Map<string, TpsViolation[]>();
  for (const violation of violations) {
    const bucket = grouped.get(violation.code) ?? [];
    bucket.push(violation);
    grouped.set(violation.code, bucket);
  }
  return grouped;
}

function report(title: string, violations: TpsViolation[]): void {
  if (violations.length === 0) {
    console.log(`${title}: чисто`);
    return;
  }
  console.log(`${title}: нарушений ${violations.length}`);
  for (const [code, items] of [...groupByCode(violations).entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  [${code}] x${items.length}`);
    for (const item of items) {
      console.log(`    - ${item.message}${item.cardId ? ` (${item.cardId})` : ''}`);
    }
  }
}

const { board, error } = loadBoard(repositoryRoot);
if (board === null) {
  console.error(`ANDON: доска недоступна — ${error}`);
  process.exit(1);
}

const typed = board as TpsBoard;
const boardViolations = validateBoardAndLine(typed, repositoryRoot);
const docViolations = validateDocumentationConsistency(repositoryRoot);
const openAndon = typed.andon.filter((event) => event.state === 'OPEN');
// Same predicate as renderBoard and ANDON_OPEN_BLOCKER: the console summary cannot drift from the gate.
const lineStopping = openAndon.filter(isLineStoppingEvent);
const blockedByOwner = typed.cards.filter((card) => card.lane === 'waiting_owner').length;
const flowing = typed.cards.filter((card) => ['ready', 'in_progress', 'verify'].includes(card.lane)).length;

console.log(`TOYOTA TPS LINE — ${typed.system} · board v${typed.boardVersion} · снимок ${typed.generatedAt}`);
console.log('');
console.log(`поток: карточек в работе/проверке — ${flowing}; ожидает решения владельца — ${blockedByOwner}`);
console.log(`андон: ${lineStopping.length > 0 ? `СТОП-ЛИНИЯ (${lineStopping.map((event) => event.id).join(', ')})` : 'линия идёт — блокирующих событий нет'}`);
for (const event of openAndon) {
  const effect = lineStopping.includes(event) ? 'блокирует тягу' : 'не блокирует линию';
  console.log(`  ! ${event.id} [${event.severity}] ${event.title} — ${effect}`);
}
console.log('');
report('пока-ёке доски', boardViolations);
report('пока-ёке документации (заявлено/фактически)', docViolations);

const total = boardViolations.length + docViolations.length;

if (args.has('--emit-board') || args.has('--check-board')) {
  const markdownPath = join(repositoryRoot, BOARD_MARKDOWN_PATH);
  const rendered = renderBoard(typed);
  if (args.has('--check-board')) {
    if (!existsSync(markdownPath)) {
      console.error(`ANDON: витрина отсутствует — ${BOARD_MARKDOWN_PATH} (запустите npm run tps:board)`);
      process.exit(1);
    }
    const current = readFileSync(markdownPath, 'utf8');
    if (current !== rendered) {
      console.error(`ANDON: дрейф витрины — ${BOARD_MARKDOWN_PATH} не совпадает с board.json. Выполните npm run tps:board.`);
      process.exit(1);
    }
    console.log(`витрина синхронна: ${BOARD_MARKDOWN_PATH}`);
  } else {
    writeFileSync(markdownPath, rendered, 'utf8');
    console.log(`витрина перегенерирована: ${BOARD_MARKDOWN_PATH}`);
  }
}

if (total > 0) {
  console.log('');
  console.log('ИТОГ: линия остановлена — нарушения стандарта TPS.');
  process.exit(1);
}

console.log('');
console.log('ИТОГ: поток соответствует стандарту (это не верификация содержательных научных статусов).');
