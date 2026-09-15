/**
 * Генератор производных «mathlib-check» для артефактов `artifacts/proofs`,
 * которые действительно зависят от Mathlib (`ℂ`, `ring`, `norm_num`,
 * `Complex.ext_iff` и т. п.) и потому не могут быть проверены
 * Mathlib-свободным прогоном ядра `lean +4.33.1`.
 *
 * ЗАЧЕМ ЭТО НУЖНО (граница доверия предыдущей задачи)
 * ---------------------------------------------------
 * `LEAN-CORE-CHECK-COVERAGE` (0.4.189) закрыла ядровым прогоном только те
 * артефакты, чьё ТЕЛО не использует Mathlib: у них удаляется неиспользуемая
 * строка `import Mathlib`, и файл проверяется чистым ядром. 14 артефактов с
 * реальной зависимостью от Mathlib оставались `REQUIRES_CORE_LEAN` с
 * формулировкой «сборка Mathlib не влезает на стандартный runner».
 *
 * Это верно только для СБОРКИ Mathlib из исходников. Готовые olean-ы
 * (`lake exe cache get` на зафиксированной ревизии Mathlib) влезают на
 * ubuntu-latest, поэтому такое утверждение перестаёт быть основанием:
 * Mathlib-артефакт проверяется прогоном `lake env lean <файл>` на закреплённом
 * тулчейне из `lean-toolchain` самой Mathlib (см. `.github/workflows/lean-artifact-kernel-check.yml`,
 * job `mathlib-kernel-check`). Первым (пилотным) артефактом этого пути является
 * `ricis-general-resolution.lean`.
 *
 * ГРАНИЦА ПРАВ (AGENTS.md §7 — неизменяемый внешний исходник)
 * -----------------------------------------------------------
 * Исходные байты артефактов НЕ изменяются. Производная этого генератора —
 * САМАЯ СЛАБАЯ из возможных трансформаций:
 *
 *   производная = исходник (байт-в-байт, включая строки import Mathlib)
 *                 + ДОБАВЛЕННЫЙ В КОНЕЦ эпилог `#print axioms`
 *
 * Ни одна строка не удаляется, не переставляется и не заменяется: подстановок
 * у плана нет вообще, поэтому проверяется ровно та формулировка, которую
 * предоставил владелец. Эпилог — только инспекционные команды; полный текст
 * производной обязан совпадать при повторной генерации (`tools/leanMathlibChecks.test.ts`).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EPILOGUE_MARKER,
  blankCommentsAndStrings,
  collectTheoremNames,
  sha256,
} from './generateLeanCoreChecks';

export interface LeanMathlibCheckPlanEntry {
  /** Идентификатор артефакта (совпадает с базой имени исходника). */
  readonly artifactId: string;
  /** Неизменяемый исходник (AGENTS.md §7). */
  readonly source: string;
  /** Генерируемая производная (исходник + эпилог). */
  readonly output: string;
  /** Метаданные артефакта (сверка `verification.contentHash`). */
  readonly metadataJson?: string;
  /** Почему артефакту действительно нужен Mathlib (а не только строка импорта). */
  readonly rationale: string;
}

const PROOFS_DIR = 'artifacts/proofs';
const MATHLIB_CHECK_DIR = `${PROOFS_DIR}/mathlib-checks`;

/**
 * Пилотный план: ровно те артефакты, для которых ядровой прогон с Mathlib
 * запускается осознанно. Расширение списка — отдельное решение владельца
 * (остальные Mathlib-артефакты остаются `REQUIRES_CORE_LEAN`, пока для них не
 * запущен прогон: статус не повышается по факту существования механизма).
 */
export const LEAN_MATHLIB_CHECK_PLAN: readonly LeanMathlibCheckPlanEntry[] = [
  {
    artifactId: 'ricis-general-resolution',
    source: `${PROOFS_DIR}/ricis-general-resolution.lean`,
    output: `${MATHLIB_CHECK_DIR}/ricis-general-resolution.mathlib-check.lean`,
    metadataJson: `${PROOFS_DIR}/ricis-general-resolution.json`,
    rationale:
      'Тело использует ℂ (Mathlib.Data.Complex.Basic), тактики ring/norm_num (Mathlib.Tactic.Ring) ' +
      'и лемму Complex.ext_iff — без Mathlib файл не только не компилируется, но и не содержит ' +
      'корректной формулировки. Проверка возможна только прогоном lake env lean на закреплённом ' +
      'тулчейне Mathlib (oleans из lake exe cache get).',
  },
];

const AXIOM_PATTERN = /^\s*axiom\s+([A-Za-z_][A-Za-z0-9_'.]*)/u;

/** Имена аксиом, объявленных в исходнике (доверенные контракты, а не доказательства). */
export function collectDeclaredAxioms(source: string): readonly string[] {
  const scannable = blankCommentsAndStrings(source);
  const names: string[] = [];
  for (const rawLine of scannable.split('\n')) {
    const match = AXIOM_PATTERN.exec(rawLine);
    if (match?.[1]) names.push(match[1]);
  }
  return [...new Set(names)];
}

/** Тело производной: исходник без изменений. Отдельная функция — чтобы это было проверяемо тестом. */
export function mathlibCheckBody(source: string): string {
  return source;
}

function epilogue(entry: LeanMathlibCheckPlanEntry, source: string, targets: readonly string[]): string {
  return [
    '',
    '',
    EPILOGUE_MARKER + ' (mathlib, additive only) =====',
    '',
    `  Generator   : scripts/generateLeanMathlibChecks.ts (детерминированный;` +
      ` побайтовое совпадение при повторной генерации проверяет` +
      ` tools/leanMathlibChecks.test.ts)`,
    `  Source      : ${entry.source}`,
    `  Source hash : sha256 ${sha256(source)}`,
    `  Transform   : НЕТ. Тело скопировано байт-в-байт, включая строки import Mathlib.`,
    `                Любая подстановка, удаление или перестановка строк запрещены §7:`,
    `                проверяется ровно та формулировка, которую предоставил владелец.`,
    `  Basis       : ${entry.rationale}`,
    `  Purpose     : дать закреплённому прогону ядра (job mathlib-kernel-check)` +
      ` возможность вывести #print axioms для каждой теоремы и каждого объявленного` +
      ` контракта (axiom).`,
    `  Boundary    : прогон проверяет только структурные теоремы этого артефакта.` +
      ` Он НЕ подтверждает эмпирические утверждения узла карты и не превращает` +
      ` объявленный axiom в доказанную лемму.`,
    `                Ниже — инспекционные команды, они не участвуют в доказательстве.`,
    '',
    '  ============================================================================-/',
    ...targets.map((name) => `#print axioms ${name}`),
    '',
  ].join('\n');
}

/** Полный текст производной (детерминированный: без меток времени и версий среды). */
export function renderMathlibCheck(entry: LeanMathlibCheckPlanEntry, source: string): string {
  const body = mathlibCheckBody(source);
  const theorems = collectTheoremNames(body);
  if (theorems.length === 0) {
    throw new Error(`${entry.artifactId}: не найдено ни одной theorem — эпилог был бы пустым`);
  }
  const axioms = collectDeclaredAxioms(body);
  return body.replace(/\s*$/u, '') + epilogue(entry, source, [...theorems, ...axioms]);
}

export interface GeneratedMathlibCheck {
  readonly artifactId: string;
  readonly source: string;
  readonly sourceSha256: string;
  readonly output: string;
  readonly outputSha256: string;
  readonly rationale: string;
  readonly metadataJson?: string;
  readonly theorems: readonly string[];
  readonly declaredAxioms: readonly string[];
  readonly printAxiomsTargets: readonly string[];
  readonly text: string;
}

/** Генерирует производные из фактического содержимого исходников (`write` = записать на диск). */
export function generateMathlibChecks(
  repositoryRoot: string,
  write: boolean,
): readonly GeneratedMathlibCheck[] {
  const generated = LEAN_MATHLIB_CHECK_PLAN.map((entry) => {
    const source = readFileSync(join(repositoryRoot, entry.source), 'utf8');
    const text = renderMathlibCheck(entry, source);
    if (write) {
      const outputPath = join(repositoryRoot, entry.output);
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, text, 'utf8');
    }
    const theorems = collectTheoremNames(mathlibCheckBody(source));
    const declaredAxioms = collectDeclaredAxioms(mathlibCheckBody(source));
    return {
      artifactId: entry.artifactId,
      source: entry.source,
      sourceSha256: sha256(source),
      output: entry.output,
      outputSha256: sha256(text),
      rationale: entry.rationale,
      metadataJson: entry.metadataJson,
      theorems,
      declaredAxioms,
      printAxiomsTargets: [...theorems, ...declaredAxioms],
      text,
    } satisfies GeneratedMathlibCheck;
  });

  if (write) {
    const manifest = {
      generator: 'scripts/generateLeanMathlibChecks.ts',
      policy: [
        'Исходные артефакты artifacts/proofs/*.lean неизменяемы (AGENTS.md §7).',
        'Производная = исходник байт-в-байт (импорты Mathlib сохранены) + добавленный эпилог #print axioms.',
        'Подстановки, удаления и перестановки строк в mathlib-производных запрещены: проверяется формулировка владельца.',
        'Повторная генерация обязана дать побайтово тот же результат (tools/leanMathlibChecks.test.ts).',
        'Прогон ядра фиксирует только структурные теоремы артефакта, не эмпирические утверждения узла карты.',
        'Существование механизма не повышает статус артефактов, для которых прогон не запускался.',
      ],
      toolchain:
        'leanprover/lean4:v4.33.0 (lean-toolchain зафиксированной ревизии Mathlib), Mathlib @ 6f1ef4e5dd604a435bddba4747b13970cd65d2a1',
      command: 'lake env lean <artifact>',
      artifacts: generated.map((item) => ({
        artifactId: item.artifactId,
        source: item.source,
        sourceSha256: item.sourceSha256,
        output: item.output,
        outputSha256: item.outputSha256,
        rationale: item.rationale,
        metadataJson: item.metadataJson ?? null,
        theorems: item.theorems,
        declaredAxioms: item.declaredAxioms,
        printAxiomsTargets: item.printAxiomsTargets,
      })),
    };
    mkdirSync(join(repositoryRoot, MATHLIB_CHECK_DIR), { recursive: true });
    writeFileSync(
      join(repositoryRoot, MATHLIB_CHECK_DIR, 'manifest.json'),
      JSON.stringify(manifest, null, 2) + '\n',
      'utf8',
    );
  }

  return generated;
}

export const MATHLIB_CHECK_DIRECTORY = MATHLIB_CHECK_DIR;

const invokedDirectly =
  Boolean(process.argv[1]) && process.argv[1].includes('generateLeanMathlibChecks');

if (invokedDirectly) {
  const repositoryRoot = dirname(fileURLToPath(import.meta.url)).replace(/[/\\]scripts$/u, '');
  const checkOnly = process.argv.includes('--check');
  const generated = generateMathlibChecks(repositoryRoot, !checkOnly);
  if (checkOnly) {
    let drift = 0;
    for (const item of generated) {
      let committed = '';
      try {
        committed = readFileSync(join(repositoryRoot, item.output), 'utf8');
      } catch {
        committed = '<missing>';
      }
      const same = committed === item.text;
      if (!same) drift += 1;
      console.log(`${same ? 'OK  ' : 'DRIFT'} ${item.output}`);
    }
    console.log(JSON.stringify({ mode: 'check', files: generated.length, drift, exitCode: drift === 0 ? 0 : 1 }));
    if (drift > 0) process.exitCode = 1;
  } else {
    console.log(
      JSON.stringify(
        generated.map((item) => ({
          artifactId: item.artifactId,
          output: item.output,
          outputSha256: item.outputSha256,
          theorems: item.theorems.length,
          declaredAxioms: item.declaredAxioms,
        })),
        null,
        2,
      ),
    );
  }
}
