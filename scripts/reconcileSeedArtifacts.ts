/**
 * Сверка артефактов семени с кодом (восстановление после обрыва за одну команду).
 *
 *   npm run seed:reconcile            # быстрая сверка: артефакты = код?
 *   npm run seed:reconcile -- --tests # + прогон тестов модуля семени
 *   npm run seed:reconcile -- --fix   # перегенерировать артефакт, если он отстал
 *
 * Проверка идемпотентна: генератор детерминирован, поэтому «свежий» артефакт
 * всегда байт-в-байт совпадает с результатом повторной генерации. Любое
 * расхождение означает, что код изменили, а документ — забыли (или наоборот),
 * и командой `--fix` это устраняется без ручного редактирования JSON.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const documentPath = join(
  repositoryRoot,
  'docs/01-architecture/ricis-unified-complete-document-8.0-seed-expansion.json',
);
const generator = join(repositoryRoot, 'scripts/generateSeedExpansionSpec.ts');

const args = new Set(process.argv.slice(2));
const wantsTests = args.has('--tests');
const wantsFix = args.has('--fix');

function run(command: string, commandArgs: string[]): string {
  return execFileSync(command, commandArgs, { cwd: repositoryRoot, encoding: 'utf8' });
}

const before = readFileSync(documentPath, 'utf8');
run('npx', ['tsx', generator]);
const after = readFileSync(documentPath, 'utf8');

const inSync = before === after;

if (!inSync && !wantsFix) {
  // Возвращаем файл в сохранённое состояние: проверка не должна менять репозиторий.
  writeFileSync(documentPath, before, 'utf8');
}

console.log('\n=== СВЕРКА АРТЕФАКТОВ СЕМЕНИ ===');
console.log(`документ:  docs/01-architecture/ricis-unified-complete-document-8.0-seed-expansion.json`);
console.log(`состояние: ${inSync ? 'СОВПАДАЕТ с кодом (идемпотентная регенерация)' : 'РАСХОЖДЕНИЕ с кодом'}`);

if (!inSync) {
  if (wantsFix) {
    console.log('действие:  артефакт перегенерирован (--fix). Зафиксируйте его коммитом.');
  } else {
    console.log('действие:  запустите `npm run seed:reconcile -- --fix`, затем закоммитьте результат.');
  }
}

if (wantsTests) {
  console.log('\n--- тесты модуля семени ---');
  try {
    const output = run('npx', ['vitest', 'run', 'src/ricisSeed', '--reporter=dot']);
    const summary = output.split('\n').filter(line => line.includes('Tests ')).join('\n').trim();
    console.log(summary || output.trim().slice(-400));
  } catch (error) {
    console.log('тесты НЕ прошли:');
    const failure = error as { stdout?: string; stderr?: string };
    console.log((failure.stdout ?? failure.stderr ?? String(error)).slice(-2000));
    process.exitCode = 1;
  }
}

if (!inSync && !wantsFix) process.exitCode = 1;

console.log('\nдальше: npx tsx scripts/seedTaskState.ts status\n');
