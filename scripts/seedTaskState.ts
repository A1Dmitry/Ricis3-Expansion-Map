/**
 * Машина состояния задачи «RICIS SEED» (устойчивость к обрыву сеанса).
 *
 * Зачем: любая работа агента может прерваться («service is busy», таймаут, restart).
 * Восстановление должно стоить ОДНУ команду и не требовать перечитывать репозиторий:
 *
 *   npm run bootstrap                          # восстановить зависимости, если среда пустая
 *   npx tsx scripts/seedTaskState.ts status     # где мы, что следующим, чем проверить
 *   npx tsx scripts/seedTaskState.ts done S7    # отметить шаг выполненным
 *   npm run seed:reconcile                      # сверить артефакты с кодом и подсказать下一步
 *
 * Состояние хранится в репозитории (docs/01-architecture/seed-expansion-task-state.json),
 * поэтому оно переживает перезапуск среды и видно человеку в PR.
 *
 * Принципы (те же, что у самого протокола семени):
 *  - идемпотентность: повторный запуск не портит состояние;
 *  - проверяемость: у каждого шага есть команда проверки, а не «на глаз»;
 *  - запрет молчаливого прогресса: шаг считается сделанным только после явной команды `done`
 *    и только если его проверка задана.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const statePath = join(repositoryRoot, 'docs/01-architecture/seed-expansion-task-state.json');

type StepStatus = 'pending' | 'done' | 'blocked';

interface Step {
  readonly id: string;
  readonly title: string;
  readonly verify: string;
  status: StepStatus;
  note?: string;
}

interface TaskState {
  readonly task: string;
  readonly branch: string;
  readonly resume: readonly string[];
  updatedAt: string;
  steps: Step[];
}

const DEFAULT_STATE: TaskState = {
  task: 'RICIS SEED — протокол саморасширения A11, производные A12–A14, единый документ v8.0',
  branch: 'arena/01a094af-ricis3-expansion-map',
  resume: [
    'npm run bootstrap (если node_modules пуст — он не переносится между сеансами)',
    'npx tsx scripts/seedTaskState.ts status',
    'npm run seed:reconcile -- --tests',
  ],
  updatedAt: new Date().toISOString(),
  steps: [],
};

function load(): TaskState {
  if (!existsSync(statePath)) return { ...DEFAULT_STATE, steps: [] };
  const parsed = JSON.parse(readFileSync(statePath, 'utf8')) as TaskState;
  return { ...DEFAULT_STATE, ...parsed };
}

function save(state: TaskState): void {
  state.updatedAt = new Date().toISOString();
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

function printStatus(state: TaskState): void {
  const done = state.steps.filter(step => step.status === 'done').length;
  console.log(`\nЗАДАЧА: ${state.task}`);
  console.log(`ВЕТКА:  ${state.branch}`);
  console.log(`ШАГОВ:  ${done}/${state.steps.length} выполнено  (обновлено ${state.updatedAt})\n`);

  for (const step of state.steps) {
    const mark = step.status === 'done' ? '[x]' : step.status === 'blocked' ? '[!]' : '[ ]';
    console.log(`${mark} ${step.id}  ${step.title}`);
    if (step.note) console.log(`        заметка: ${step.note}`);
    console.log(`        проверка: ${step.verify}`);
  }

  const next = state.steps.find(step => step.status !== 'done');
  if (next) {
    console.log(`\nСЛЕДУЮЩИЙ ШАГ: ${next.id} — ${next.title}`);
    console.log(`ПРОВЕРКА:      ${next.verify}`);
  } else {
    console.log('\nВсе шаги отмечены выполненными. Финальная сверка: npm run seed:reconcile');
  }
  console.log(`\nКак продолжить после обрыва: ${state.resume.join(' && ')}\n`);
}

function findStep(state: TaskState, id: string): Step | undefined {
  return state.steps.find(step => step.id.toLowerCase() === id.toLowerCase());
}

const [, , command = 'status', ...rest] = process.argv;
const state = load();

switch (command) {
  case 'status':
    printStatus(state);
    break;

  case 'done': {
    const step = findStep(state, rest[0] ?? '');
    if (!step) throw new Error(`шаг не найден: ${rest[0] ?? '(не указан)'}`);
    step.status = 'done';
    if (rest[1]) step.note = rest.slice(1).join(' ');
    save(state);
    console.log(`✓ ${step.id} отмечен выполненным. Проверка: ${step.verify}`);
    break;
  }

  case 'block': {
    const step = findStep(state, rest[0] ?? '');
    if (!step) throw new Error(`шаг не найден: ${rest[0] ?? '(не указан)'}`);
    step.status = 'blocked';
    step.note = rest.slice(1).join(' ') || 'причина не указана';
    save(state);
    console.log(`! ${step.id} помечен как заблокированный: ${step.note}`);
    break;
  }

  case 'reopen': {
    const step = findStep(state, rest[0] ?? '');
    if (!step) throw new Error(`шаг не найден: ${rest[0] ?? '(не указан)'}`);
    step.status = 'pending';
    save(state);
    console.log(`○ ${step.id} возвращён в работу`);
    break;
  }

  case 'add': {
    const [id, title, verify] = rest;
    if (!id || !title || !verify) {
      throw new Error('использование: add <ID> "<заголовок>" "<команда проверки>"');
    }
    if (findStep(state, id)) throw new Error(`шаг уже существует: ${id}`);
    state.steps.push({ id, title, verify, status: 'pending' });
    save(state);
    console.log(`+ добавлен шаг ${id}`);
    break;
  }

  case 'init': {
    save({ ...DEFAULT_STATE, steps: state.steps });
    console.log(`состояние инициализировано: ${statePath}`);
    break;
  }

  default:
    console.log('команды: status | done <ID> [заметка] | block <ID> <причина> | reopen <ID> | add <ID> "заголовок" "проверка" | init');
    break;
}
