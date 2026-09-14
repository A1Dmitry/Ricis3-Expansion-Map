// @vitest-environment node
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  CORE_CHECK_DIRECTORY,
  EPILOGUE_MARKER,
  LEAN_CORE_CHECK_PLAN,
  collectTheoremNames,
  coreCheckBody,
  renderCoreCheck,
} from '../scripts/generateLeanCoreChecks';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const proofsDirectory = join(repositoryRoot, 'artifacts/proofs');

function readText(relativePath: string): string {
  return readFileSync(join(repositoryRoot, relativePath), 'utf8');
}

function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

interface ProofMetadata {
  readonly verification?: {
    readonly contentHash?: string;
    readonly trustStatus?: string;
  };
}

function readMetadata(fileName: string): ProofMetadata {
  return JSON.parse(readFileSync(join(proofsDirectory, fileName), 'utf8')) as ProofMetadata;
}

/**
 * Защита от ТУФТЫ в Lean-контуре (AGENTS.md §7, E-03, E-04).
 *
 * Статусы `TRUSTED_AXIOM` / `LEAN_VERIFIED` требуют фактического ядерного прогона.
 * Эти тесты гарантируют, что самодостаточные производные, которые проверяет
 * зафиксированное ядро Lean 4.33.1:
 *  1) детерминированно перегенерируются из неизменённых исходников;
 *  2) не переписывают ни одной декларации исходника (префикс байт-в-байт);
 *  3) действительно покрывают каждый артефакт, заявленный как `TRUSTED_AXIOM`;
 *  4) согласованы с allowlist workflow (нет «документации по мотивам кода»).
 */
describe('Lean kernel core-check derivatives', () => {
  it('перегенерация даёт побайтово тот же текст, что зафиксирован в репозитории', () => {
    expect(LEAN_CORE_CHECK_PLAN.length).toBeGreaterThanOrEqual(7);

    for (const entry of LEAN_CORE_CHECK_PLAN) {
      const committed = readText(entry.output);
      const regenerated = renderCoreCheck(entry, readText(entry.source));
      expect(regenerated, entry.output).toBe(committed);
    }
  });

  it('исходники артефактов не изменены: производная равна исходнику без неиспользуемого импорта плюс эпилог', () => {
    for (const entry of LEAN_CORE_CHECK_PLAN) {
      const source = readText(entry.source);
      const committed = readText(entry.output);

      // §7: внешний Lean-исходник остаётся неизменным — строка импорта на месте.
      expect(source, entry.source).toMatch(/^import\s+Mathlib/mu);

      const epilogueStart = committed.indexOf(EPILOGUE_MARKER);
      expect(epilogueStart, `${entry.output}: нет маркера эпилога`).toBeGreaterThan(0);

      const prefix = committed.slice(0, epilogueStart).replace(/\s+$/u, '');
      // Генератор подрезает хвостовые пробелы перед добавлением эпилога —
      // содержательно тело обязано быть байт-в-байт равным исходнику.
      expect(prefix, `${entry.output}: тело отличается от исходника`).toBe(
        coreCheckBody(source, entry).replace(/\s+$/u, ''),
      );

      // Эпилог — только инспекционные команды, никаких новых доказательств.
      const epilogueLines = committed.slice(epilogueStart).split('\n');
      const closingIndex = epilogueLines.findIndex((line) => line.trim().endsWith('-/'));
      expect(closingIndex, `${entry.output}: комментарий эпилога не закрыт`).toBeGreaterThan(0);
      for (const [index, line] of epilogueLines.entries()) {
        if (line.trim().length === 0 || index <= closingIndex) continue;
        expect(
          line.startsWith('#print axioms '),
          `${entry.output}: строка эпилога не является инспекционной командой: ${line}`,
        ).toBe(true);
      }
      const commentBlock = epilogueLines.slice(0, closingIndex + 1).join('\n');
      expect(commentBlock, `${entry.output}: в эпилоге появились декларации`).not.toMatch(
        /^(?!\s)(?:theorem|def|example|axiom|lemma|instance)\b/mu,
      );
      expect(committed, `${entry.output}: производная не должна ничего импортировать`).not.toMatch(/^import\s/mu);
      expect(committed, `${entry.output}: sorry в производной недопустим`).not.toMatch(/\bsorry\b|\badmit\b/u);
    }
  });

  it('каждая цель #print axioms — реальная теорема производной, а не выдуманное имя', () => {
    for (const entry of LEAN_CORE_CHECK_PLAN) {
      const committed = readText(entry.output);
      const declared = collectTheoremNames(coreCheckBody(readText(entry.source), entry));
      const printed = committed
        .split('\n')
        .filter((line) => line.startsWith('#print axioms '))
        .map((line) => line.replace('#print axioms ', '').trim());

      expect(printed.length, entry.output).toBeGreaterThan(0);
      expect(printed, entry.output).toEqual([...declared]);
    }
  });

  it('manifest фиксирует хеши исходников и совпадает с фактическими байтами', () => {
    const manifest = JSON.parse(readText(join(CORE_CHECK_DIRECTORY, 'manifest.json'))) as {
      readonly artifacts: readonly {
        readonly source: string;
        readonly sourceSha256: string;
        readonly output: string;
        readonly outputSha256: string;
      }[];
    };

    expect(manifest.artifacts.length).toBe(LEAN_CORE_CHECK_PLAN.length);
    for (const item of manifest.artifacts) {
      expect(sha256(readText(item.source)), `${item.source}: исходник изменён`).toBe(item.sourceSha256);
      expect(sha256(readText(item.output)), `${item.output}: производная изменена в обход генератора`).toBe(
        item.outputSha256,
      );
    }

    // Каталог не должен содержать «ручных» файлов вне генератора.
    const committed = readdirSync(join(repositoryRoot, CORE_CHECK_DIRECTORY))
      .filter((name) => name.endsWith('.lean'))
      .map((name) => `${CORE_CHECK_DIRECTORY}/${name}`)
      .sort();
    expect(committed).toEqual(LEAN_CORE_CHECK_PLAN.map((entry) => entry.output).sort());
  });

  it('метаданные артефактов честно хранят sha256 своего Lean-исходника', () => {
    const metadataFiles = readdirSync(proofsDirectory).filter((name) => name.endsWith('.json'));
    let checked = 0;

    for (const fileName of metadataFiles) {
      const metadata = readMetadata(fileName);
      const contentHash = metadata.verification?.contentHash;
      if (!contentHash) continue;

      const base = fileName.replace(/\.json$/u, '');
      const candidates = [`${base}.lean`, `${base}.standalone.lean`, `${base}.generated.lean`].filter((name) =>
        existsSync(join(proofsDirectory, name)),
      );
      expect(candidates.length, `${fileName}: нет Lean-исходника для contentHash`).toBeGreaterThan(0);

      const matching = candidates.filter(
        (name) => sha256(readFileSync(join(proofsDirectory, name), 'utf8')) === contentHash,
      );
      expect(matching, `${fileName}: contentHash не соответствует ни одному исходнику`).toHaveLength(1);
      checked += 1;
    }

    expect(checked).toBeGreaterThanOrEqual(6);
  });

  it('каждый артефакт со статусом TRUSTED_AXIOM имеет путь ядерной проверки или явное основание', () => {
    // Артефакты, которым для проверки нужна сборка Mathlib (ℝ/ℚ + ring/norm_num):
    // статус не повышается, основание зафиксировано в evidence-документе.
    const mathlibRequired: readonly string[] = [
      'RicisAgiTarget.lean',
      'jacobian-counterexample-full.lean',
      'database-a6-0_5_inf_3.standalone.lean',
      'database-registry-120-jacobian.standalone.lean',
      'ricis-kernel-ast-sp5.standalone.lean',
      'ricis-seed-expansion-a11.lean',
    ];
    const coveredSources = new Set(LEAN_CORE_CHECK_PLAN.map((entry) => entry.source.split('/').pop()));

    for (const fileName of readdirSync(proofsDirectory).filter((name) => name.endsWith('.json'))) {
      const metadata = readMetadata(fileName);
      if (metadata.verification?.trustStatus !== 'TRUSTED_AXIOM') continue;

      const base = fileName.replace(/\.json$/u, '');
      const sources = [`${base}.lean`, `${base}.standalone.lean`];
      const hasKernelPath = sources.some((name) => coveredSources.has(name));
      const documentedMathlib = sources.some((name) => mathlibRequired.includes(name));

      expect(
        hasKernelPath || documentedMathlib,
        `${fileName}: TRUSTED_AXIOM без пути ядерной проверки и без зафиксированного Mathlib-основания`,
      ).toBe(true);
    }
  });
});

describe('Lean Artifact Kernel Check workflow', () => {
  const workflow = readText('.github/workflows/lean-artifact-kernel-check.yml');

  it('проверяет сгенерированные core-check производные и явный allowlist', () => {
    expect(workflow).toContain('artifacts/proofs/database-a6-minimal-core-check.lean');
    expect(workflow).toContain('CORE_CHECK_DIR: artifacts/proofs/core-checks');
    expect(workflow).toContain('lean +4.33.1');
    expect(workflow).toMatch(/elan toolchain install 4\.33\.1/u);
  });

  it('фиксирует вывод #print axioms корректным фильтром и бракует sorryAx', () => {
    // Реальный вывод ядра: "'Name' does not depend on any axioms" / "depends on axioms: [...]".
    expect(workflow).toContain('does not depend on any axioms');
    expect(workflow).toContain('depends on axioms');
    expect(workflow).toContain('sorryAx');
  });

  it('хеширует и исходники, и производные', () => {
    expect(workflow).toContain('sha256sum artifacts/proofs/*.lean');
    expect(workflow).toContain('artifacts/proofs/core-checks/*.lean');
  });
});
