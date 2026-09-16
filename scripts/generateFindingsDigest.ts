/**
 * Генератор сводки по находкам и ядерным прогонам (TAKT-3, карточка TPS-0003).
 *
 * ЗАЧЕМ
 * -----
 * Одни и те же факты прогона пересказывались в трёх местах — `ACTIVE_TASKS.md`,
 * `artifacts/proofs/README.md` и `artifacts/proofs/core-checks/kernel-findings.json` — и это
 * уже рождало ремонты расхождений (F-02, F-04) и потерю M-0002. Пересказ нельзя сделать
 * «аккуратнее»; его можно убрать: отчёт собирается из реестра, а не пишется по памяти.
 *
 * ПРИНЦИП
 * -------
 * Отчёт — ИНДЕКС + машинные поля. Проза реестра сюда не копируется (кроме заголовков находок,
 * которые и являются индексными подписями): скопированный текст = новый пересказ = новый дрейф.
 * Поэтому:
 *  - статус закрытости определяется той же функцией, что и гейтом потока
 *    (`isFindingRecordedClosed` из tools/tpsStandardWork.ts) — отчёт не может расходиться с
 *    проверкой, потому что проверяющее правило одно на обоих;
 *  - никакого синтеза статусов: ни одно слово о доверии не появляется здесь, если его нет
 *    в реестре (это утверждает и отдельный тест);
 *  - детерминизм: в теле нет ни дат, ни порядка обхода, зависящего от файловой системы, —
 *    иначе страж свежести (сравнение с повторной генерацией) невыполним.
 *
 * Запуск: `npm run tps:digest` (запись), `npm run tps:digest:check` (проверка дрейфа).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isFindingRecordedClosed, type FindingsRegistry, type TpsBoard } from '../tools/tpsStandardWork';

export const DIGEST_PATH = 'docs/00-governance/tps/FINDINGS_DIGEST.md';
const REGISTRY_PATH = 'artifacts/proofs/core-checks/kernel-findings.json';
const MANIFEST_PATH = 'artifacts/proofs/core-checks/manifest.json';
const BOARD_PATH = 'docs/00-governance/tps/board.json';

function readJson<T>(repositoryRoot: string, relative: string): T {
  return JSON.parse(readFileSync(join(repositoryRoot, relative), 'utf8')) as T;
}

/**
 * Табличные ячейки: трубы и переводы строк ломают markdown-таблицу.
 * Принимает unknown, потому что машиночитаемые поля реестра разноформатны (`registryVersion` —
 * число, `affected` — массив); нормализация здесь, а не в данных.
 */
function cell(value: unknown): string {
  const text = Array.isArray(value) ? value.join(', ') : String(value ?? '');
  return text.replace(/\|/gu, '\\|').replace(/\s*\n\s*/gu, ' ').trim();
}

function findingIds(text: string): string[] {
  return [...new Set([...text.matchAll(/\bF-\d{2}\b/gu)].map((match) => match[0]))];
}

export function renderFindingsDigest(repositoryRoot: string): string {
  const registry = readJson<FindingsRegistry>(repositoryRoot, REGISTRY_PATH);
  const manifest = readJson<{ readonly toolchain?: string; readonly command?: string; readonly generator?: string }>(
    repositoryRoot,
    MANIFEST_PATH,
  );
  const board = readJson<TpsBoard>(repositoryRoot, BOARD_PATH);

  const lines: string[] = [];
  lines.push('# Сводка находок и ядерных прогонов — генерируемый индекс');
  lines.push('');
  lines.push('> **Не редактировать руками.** Источник: `' + REGISTRY_PATH + '`, `' + MANIFEST_PATH + '`,');
  lines.push('> `' + BOARD_PATH + '`. Перегенерация: `npm run tps:digest`; проверка дрейфа: `npm run tps:digest:check`.');
  lines.push('>');
  lines.push('> **Граница.** Это индекс, а не доказательство: отчёт ничего не повышает, не понижает и не');
  lines.push('> интерпретирует. Проза реестра сюда не копируется — копирование создало бы ещё один пересказ');
  lines.push('> и новый канал дрейфа. Если строки отчёта и реестра расходятся, бракованной считается попытка');
  lines.push('> править этот файл руками. AUDITOR: SELF (same-pipeline).');
  lines.push('');
  lines.push(`**Реестр:** ${cell(registry.title ?? '—')} · \`registryVersion\` ${cell(registry.registryVersion ?? '—')}`);
  lines.push(`**Toolchain прогонов:** ${cell(manifest.toolchain ?? '—')} · команда: \`${cell(manifest.command ?? '—')}\` · генератор производных: \`${cell(manifest.generator ?? '—')}\``);
  lines.push('');

  lines.push('## Классификация статусов (дословно из реестра)');
  lines.push('');
  const classification = registry.classification ?? {};
  for (const key of Object.keys(classification).sort()) {
    lines.push(`- \`${key}\` — ${cell(classification[key] ?? '')}`);
  }
  lines.push('');

  // Связь «находка ↔ карточка потока» считается по доске, а не по тексту находок.
  const cardsByFinding = new Map<string, string[]>();
  for (const card of board.cards) {
    for (const id of findingIds(`${card.title} ${card.originalGoal} ${(card.acceptanceCriteria ?? []).join(' ')}`)) {
      const bucket = cardsByFinding.get(id) ?? [];
      bucket.push(`${card.id} (${card.lane}${card.closure ? ', закрыто вне потока' : ''})`);
      cardsByFinding.set(id, bucket);
    }
  }

  lines.push('## Находки');
  lines.push('');
  lines.push('| ID | Тяжесть | Класс | Закрытость (по правилу гейта) | Затронутые артефакты | Карточки, ссылающиеся на находку |');
  lines.push('|---|---|---|---|---|---|');
  const findings = [...(registry.findings ?? [])].sort((a, b) => (a.id ?? '').localeCompare(b.id ?? ''));
  for (const finding of findings) {
    const id = finding.id ?? '—';
    const closure = isFindingRecordedClosed(finding)
      ? 'закрыто (поле `resolution`/`status` начинается с маркера закрытия)'
      : 'открыто или закрыто частично — см. реестр';
    lines.push(
      `| ${cell(id)} | ${cell(finding.severity ?? '—')} | ${cell(finding.kind ?? '—')} | ${closure} | ${cell(
        (finding.affected ?? []).join(', ') || '—',
      )} | ${cell((cardsByFinding.get(id) ?? []).join('; ') || '—')} |`,
    );
  }
  lines.push('');
  lines.push('> Класс закрытости вычисляется той же функцией `isFindingRecordedClosed`, что и правило');
  lines.push('> `CARD_FINDING_ALREADY_CLOSED`: доска и отчёт не могут расходиться, потому что проверка одна.');
  lines.push('> Полный текст основания и требуемое решение — только в реестре.');
  lines.push('');

  lines.push('## Артефакты: фактические исходы ядерных прогонов');
  lines.push('');
  lines.push('| Артефакт | Исход | Exit | Ошибок | Теорем | Проверяемый файл |');
  lines.push('|---|---|---|---|---|---|');
  const artifacts = [...(registry.artifacts ?? [])].sort((a, b) =>
    String(a['artifactId'] ?? '').localeCompare(String(b['artifactId'] ?? '')),
  );
  for (const artifact of artifacts) {
    const num = (value: unknown): string => (typeof value === 'number' ? String(value) : '—');
    lines.push(
      `| ${cell(String(artifact['artifactId'] ?? '—'))} | ${cell(String(artifact['outcome'] ?? '—'))} | ` +
        `${num(artifact['compilerExit'])} | ${num(artifact['compilerErrorCount'])} | ${num(artifact['theoremCount'])} | ` +
        `\`${cell(String(artifact['checkedFile'] ?? '—'))}\` |`,
    );
  }
  lines.push('');
  lines.push('> `outcome` — единственное, что даёт право на статус; `trustBoundary` и `rootCause` каждого');
  lines.push('> артефакта читаются в реестре и сюда не переносятся.');
  lines.push('');

  lines.push('## Политика CI: ожидаемые отказы и ожидающие прогоны');
  lines.push('');
  const expected = (registry.ciPolicy?.expectedFailures ?? []).map((entry) => entry.artifactId ?? '—').sort();
  lines.push(`- \`ciPolicy.expectedFailures\` (падение этих целей не рвёт прогон, потому что первопричина зафиксирована): ${expected.length > 0 ? expected.map((id) => `\`${id}\``).join(', ') : '—'}`);
  const pending = [...(registry.pendingKernelRun ?? [])].sort((a, b) => String(a.artifactId ?? '').localeCompare(String(b.artifactId ?? '')));
  for (const entry of pending) {
    lines.push(`- ожидает прогона: \`${cell(String(entry.artifactId ?? '—'))}\` · job \`${cell(String(entry.job ?? '—'))}\` · статус ${cell(String(entry.status ?? '—'))}`);
  }
  lines.push('- `sorryAx` в скопилированном файле рвёт прогон всегда — ожидаемый отказ его не легализует.');
  lines.push('');

  lines.push('## Что этот отчёт не делает');
  lines.push('');
  lines.push('- не повышает и не понижает ни один `trustStatus`, `outcome` или статус узла карты;');
  lines.push('- не содержит выводов о классических гипотезах (Риман, Навье–Стокс, якобиан) — прогон ядра');
  lines.push('  подтверждает структурные теоремы производной, и граница записана в реестре;');
  lines.push('- не заменяет `ACTIVE_TASKS.md` и `artifacts/proofs/README.md`: он даёт сверяемый индекс,');
  lines.push('  чтобы этим документам не приходилось пересказывать машиночитаемые поля.');
  lines.push('');
  return lines.join('\n');
}

const invokedDirectly = Boolean(process.argv[1]) && process.argv[1].includes('generateFindingsDigest');

if (invokedDirectly) {
  const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const rendered = renderFindingsDigest(repositoryRoot);
  const target = join(repositoryRoot, DIGEST_PATH);
  if (process.argv.includes('--check')) {
    const current = readFileSync(target, 'utf8');
    if (current !== rendered) {
      console.error(`ANDON: дрейф сводки — ${DIGEST_PATH} не совпадает с реестрами. Выполните npm run tps:digest.`);
      process.exit(1);
    }
    console.log(`сводка синхронна с реестрами: ${DIGEST_PATH}`);
  } else {
    writeFileSync(target, rendered, 'utf8');
    console.log(`сводка перегенерирована: ${DIGEST_PATH}`);
  }
}
