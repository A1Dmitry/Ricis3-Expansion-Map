// @vitest-environment node
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  EPILOGUE_MARKER,
  LEAN_CORE_CHECK_PLAN,
  collectTheoremNames,
  sha256,
} from '../scripts/generateLeanCoreChecks';
import {
  LEAN_MATHLIB_CHECK_PLAN,
  MATHLIB_CHECK_DIRECTORY,
  collectDeclaredAxioms,
  mathlibCheckBody,
  renderMathlibCheck,
} from '../scripts/generateLeanMathlibChecks';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const proofsDirectory = join(repositoryRoot, 'artifacts/proofs');
const workflowPath = '.github/workflows/lean-artifact-kernel-check.yml';
const kernelScriptPath = 'scripts/mathlibKernelCheck.sh';

function readText(relativePath: string): string {
  return readFileSync(join(repositoryRoot, relativePath), 'utf8');
}

interface ProofMetadata {
  readonly verification?: { readonly contentHash?: string; readonly trustStatus?: string };
  readonly kernelCheck?: { readonly statusAfterKernelRun?: string };
}

function readMetadata(fileName: string): ProofMetadata {
  return JSON.parse(readFileSync(join(proofsDirectory, fileName), 'utf8')) as ProofMetadata;
}

interface RegistryArtifact {
  readonly artifactId: string;
  readonly outcome: string;
  readonly compilerExit: number;
  readonly rootCause: string | null;
}

const registry = JSON.parse(readText('artifacts/proofs/core-checks/kernel-findings.json')) as {
  readonly artifacts: readonly RegistryArtifact[];
  readonly pendingKernelRun: readonly {
    readonly artifactId: string;
    readonly immutableSource: string;
    readonly sourceSha256: string;
    readonly status: string;
    readonly expectedOutcome: string;
  }[];
  readonly findings: readonly { readonly id: string; readonly severity: string; readonly evidence: string }[];
};

/** Разбирает блочный список из env-секции workflow (`KEY: >-` + строки с отступом). */
function readWorkflowList(workflow: string, key: string): readonly string[] {
  const lines = workflow.split('\n');
  const index = lines.findIndex((line) => line.trim().startsWith(`${key}:`));
  if (index < 0) return [];
  const inline = lines[index]?.split(':').slice(1).join(':').trim() ?? '';
  if (inline.length > 0 && inline !== '>-' && inline !== '|') return [inline];
  const items: string[] = [];
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor] ?? '';
    if (line.trim().length === 0) continue;
    if (!/^\s{6,}/u.test(line)) break;
    items.push(line.trim());
  }
  return items;
}

/**
 * Защита от ТУФТЫ на Mathlib-пути верификации (AGENTS.md §7, E-03, E-04).
 *
 * Mathlib-артефакт нельзя проверить Mathlib-свободным ядром, поэтому его проверяет
 * отдельный job с закреплённой Mathlib. Эти тесты гарантируют, что:
 *  1) производная mathlib-check детерминированно перегенерируется и НЕ переписывает
 *     исходник: тело байт-в-байт, добавляется только эпилог `#print axioms`;
 *  2) подстановок в этом плане нет вообще — проверяется формулировка владельца;
 *  3) цели `#print axioms` — реальные теоремы и реально объявленные контракты;
 *  4) статус артефакта не повышается без фактического прогона ядра, а сам прогон
 *     читает «ожидаемые отказы» только из реестра и не глотает `sorryAx`;
 *  5) ни один Mathlib-артефакт не считается проверенным только потому, что механизм
 *     существует: нужен явный allowlist или Mathlib-свободная производная.
 */
describe('Lean kernel mathlib-check derivatives', () => {
  it('перегенерация даёт побайтово тот же текст, что зафиксирован в репозитории', () => {
    expect(LEAN_MATHLIB_CHECK_PLAN.length).toBeGreaterThanOrEqual(1);

    for (const entry of LEAN_MATHLIB_CHECK_PLAN) {
      const committed = readText(entry.output);
      const regenerated = renderMathlibCheck(entry, readText(entry.source));
      expect(regenerated, entry.output).toBe(committed);
    }
  });

  it('исходник не переписан: тело производной байт-в-байт равно исходнику, эпилог только инспекционный', () => {
    for (const entry of LEAN_MATHLIB_CHECK_PLAN) {
      const source = readText(entry.source);
      const committed = readText(entry.output);

      // Mathlib-артефакт обязан реально импортировать Mathlib: иначе он должен идти
      // Mathlib-свободным путём (core-check), а не «прикрываться» этим job-ом.
      expect(source, entry.source).toMatch(/^import\s+Mathlib/mu);
      expect(mathlibCheckBody(source), entry.source).toBe(source);
      expect('substitutions' in entry, `${entry.artifactId}: подстановки запрещены`).toBe(false);

      const epilogueStart = committed.indexOf(EPILOGUE_MARKER);
      expect(epilogueStart, `${entry.output}: нет маркера эпилога`).toBeGreaterThan(0);

      const prefix = committed.slice(0, epilogueStart);
      const body = source.replace(/\s*$/u, '');
      // Тело производной — это ИСХОДНИК, начинающийся с первого байта файла,
      // за которым добавлены только пустые строки перед эпилогом.
      expect(prefix.startsWith(body), `${entry.output}: тело отличается от исходника`).toBe(true);
      expect(prefix.slice(body.length), `${entry.output}: перед эпилогом есть посторонний текст`).toMatch(
        /^\s*$/u,
      );
      // Ни одна строка импорта не удалена и не заменена.
      const imports = (text: string): number => (text.match(/^import\s+\S+/gmu) ?? []).length;
      expect(imports(prefix), `${entry.output}: строки import изменены`).toBe(imports(source));

      const epilogueLines = committed.slice(epilogueStart).split('\n');
      const closingIndex = epilogueLines.findIndex((line) => line.trim().endsWith('-/'));
      expect(closingIndex, `${entry.output}: комментарий эпилога не закрыт`).toBeGreaterThan(0);
      for (const [index, line] of epilogueLines.entries()) {
        if (line.trim().length === 0 || index <= closingIndex) continue;
        expect(line.startsWith('#print axioms '), `${entry.output}: не инспекционная строка: ${line}`).toBe(true);
      }
      const commentBlock = epilogueLines.slice(0, closingIndex + 1).join('\n');
      expect(commentBlock, `${entry.output}: в эпилоге появились декларации`).not.toMatch(
        /^(?!\s)(?:theorem|def|example|axiom|lemma|instance)\b/mu,
      );
      expect(committed, `${entry.output}: sorry в производной недопустим`).not.toMatch(/\bsorry\b|\badmit\b/u);
    }
  });

  it('каждая цель #print axioms — реальная теорема или реально объявленный контракт', () => {
    for (const entry of LEAN_MATHLIB_CHECK_PLAN) {
      const source = readText(entry.source);
      const committed = readText(entry.output);
      const epilogue = committed.slice(committed.indexOf(EPILOGUE_MARKER));
      const printed = epilogue
        .split('\n')
        .filter((line) => line.startsWith('#print axioms '))
        .map((line) => line.replace('#print axioms ', '').trim());

      const theorems = collectTheoremNames(source);
      const axioms = collectDeclaredAxioms(source);
      expect(printed, entry.output).toEqual([...theorems, ...axioms]);
      expect(printed.length, entry.output).toBeGreaterThan(0);
      expect(
        printed.every((name) => !name.includes(' ') && name.length > 0),
        `${entry.output}: некорректное имя в эпилоге`,
      ).toBe(true);
    }
  });

  it('объявленные контракты (axiom) видны как доверенные входы, а не как доказательства', () => {
    for (const entry of LEAN_MATHLIB_CHECK_PLAN) {
      const source = readText(entry.source);
      const declaredAxioms = collectDeclaredAxioms(source);
      const metadata = readMetadata(`${entry.artifactId}.json`);
      // Граница доверия обязана быть зафиксирована вне исходника (§7).
      const metadataText = JSON.stringify(metadata);
      expect(metadataText, `${entry.artifactId}: declaredAxioms не зафиксированы`).toContain('declaredAxioms');
      for (const axiom of declaredAxioms) {
        expect(metadataText, `${entry.artifactId}: контракт ${axiom} не объявлен в метаданных`).toContain(axiom);
      }
    }
  });

  it('manifest фиксирует хеши исходников и совпадает с фактическими байтами', () => {
    const manifest = JSON.parse(readText(join(MATHLIB_CHECK_DIRECTORY, 'manifest.json'))) as {
      readonly artifacts: readonly {
        readonly source: string;
        readonly sourceSha256: string;
        readonly output: string;
        readonly outputSha256: string;
      }[];
    };

    expect(manifest.artifacts.length).toBe(LEAN_MATHLIB_CHECK_PLAN.length);
    for (const item of manifest.artifacts) {
      expect(sha256(readText(item.source)), `${item.source}: исходник изменён`).toBe(item.sourceSha256);
      expect(sha256(readText(item.output)), `${item.output}: производная изменена в обход генератора`).toBe(
        item.outputSha256,
      );
    }

    const committed = readdirSync(join(repositoryRoot, MATHLIB_CHECK_DIRECTORY))
      .filter((name) => name.endsWith('.lean'))
      .map((name) => `${MATHLIB_CHECK_DIRECTORY}/${name}`)
      .sort();
    expect(committed).toEqual(LEAN_MATHLIB_CHECK_PLAN.map((entry) => entry.output).sort());
  });

  it('метаданные артефакта держат sha256 неизменяемого исходника', () => {
    for (const entry of LEAN_MATHLIB_CHECK_PLAN) {
      const metadata = readMetadata(`${entry.artifactId}.json`);
      expect(metadata.verification?.contentHash, `${entry.artifactId}: contentHash отсутствует`).toBe(
        sha256(readText(entry.source)),
      );
      expect(metadata.verification?.contentHash, `${entry.artifactId}: metadataJson не указан`).toBeDefined();
    }
  });

  it('ни один Mathlib-артефакт не считается проверенным без фактического пути прогона', () => {
    const workflow = readText(workflowPath);
    const allowlist = new Set(readWorkflowList(workflow, 'MATHLIB_ARTIFACTS'));
    expect(allowlist.size, 'MATHLIB_ARTIFACTS: allowlist пуст').toBeGreaterThan(0);
    const coreCovered = new Set(LEAN_CORE_CHECK_PLAN.map((entry) => entry.source));

    for (const fileName of readdirSync(proofsDirectory).filter((name) => name.endsWith('.json'))) {
      const metadata = readMetadata(fileName);
      const status = metadata.verification?.trustStatus;
      if (status !== 'LEAN_VERIFIED' && status !== 'TRUSTED_AXIOM') continue;
      const base = fileName.replace(/\.json$/u, '');
      const sources = [`artifacts/proofs/${base}.lean`, `artifacts/proofs/${base}.standalone.lean`].filter(
        (candidate) => existsSync(join(repositoryRoot, candidate)),
      );
      const needsMathlib = sources.some((candidate) => /^import\s+Mathlib/mu.test(readText(candidate)));
      if (!needsMathlib) continue;
      const covered =
        sources.some((candidate) => coreCovered.has(candidate)) ||
        sources.some((candidate) => allowlist.has(candidate));
      expect(covered, `${fileName}: ${status} без ядрового пути (core-check или Mathlib allowlist)`).toBe(true);
    }
  });

  it('реестр не повышает статус без прогона и фиксирует ожидающий прогон честно', () => {
    const registryById = new Map(registry.artifacts.map((item) => [item.artifactId, item]));

    for (const pending of registry.pendingKernelRun) {
      expect(pending.status, pending.artifactId).toBe('PENDING_KERNEL_RUN');
      expect(existsSync(join(repositoryRoot, pending.immutableSource)), pending.immutableSource).toBe(true);
      expect(sha256(readText(pending.immutableSource)), `${pending.immutableSource}: исходник изменён`).toBe(
        pending.sourceSha256,
      );
      // Пока прогон не выполнен, «ожидаемый исход» обязан быть честным UNKNOWN, а не прогнозом статуса.
      expect(pending.expectedOutcome.toUpperCase(), pending.artifactId).toContain('UNKNOWN');
      expect(
        registryById.has(pending.artifactId),
        `${pending.artifactId}: прогон ожидается, но статус уже заявлен в реестре фактов`,
      ).toBe(false);
    }

    for (const entry of LEAN_MATHLIB_CHECK_PLAN) {
      const metadata = readMetadata(`${entry.artifactId}.json`);
      const status = metadata.verification?.trustStatus;
      const fact = registryById.get(entry.artifactId);
      if (status === 'LEAN_VERIFIED' || status === 'TRUSTED_AXIOM') {
        expect(fact?.outcome, `${entry.artifactId}: ${status} без фактического прогона`).toBe('LEAN_VERIFIED');
        expect(fact?.compilerExit, entry.artifactId).toBe(0);
      }
      if (status === 'REJECTED') {
        expect(fact?.outcome, `${entry.artifactId}: REJECTED без записи об отказе ядра`).toBe(
          'SOURCE_REJECTED_BY_KERNEL',
        );
        expect((fact?.rootCause ?? '').length, `${entry.artifactId}: отказ без первопричины`).toBeGreaterThan(40);
      }
      if (status === 'REQUIRES_CORE_LEAN') {
        expect(fact, `${entry.artifactId}: REQUIRES_CORE_LEAN не должен иметь записи о прогоне`).toBeUndefined();
        expect(
          registry.pendingKernelRun.some((pending) => pending.artifactId === entry.artifactId),
          `${entry.artifactId}: REQUIRES_CORE_LEAN без зафиксированного ожидающего прогона`,
        ).toBe(true);
      }
    }
  });

  it('workflow Mathlib-джобы читает ожидаемые отказы только из реестра и публикует evidence при падении', () => {
    const workflow = readText(workflowPath);
    const kernelScript = readText(kernelScriptPath);

    expect(workflow).toContain('mathlib-kernel-check');
    expect(workflow).toContain('lake exe cache get');
    expect(workflow).toContain('MATHLIB_REV');
    expect(workflow).toContain('MATHLIB_TOOLCHAIN');
    expect(workflow).toContain('scripts/mathlibKernelCheck.sh');
    // Единственный источник «ожидаемых отказов» — реестр.
    expect(workflow).toContain('(.ciPolicy.mathlibExpectedFailures // [])[].checkedFile');
    expect(workflow).toContain('expected-failures-mathlib.txt');
    // Evidence обязано быть читаемым даже при красном прогоне.
    expect(workflow).toMatch(/Upload Mathlib kernel evidence[\s\S]{0,200}?if: always\(\)/u);
    expect(workflow).toMatch(/Post Mathlib kernel evidence to the pull request[\s\S]{0,300}?if: always\(\) && github\.event_name == 'pull_request'/u);
    expect(workflow).toContain('gh pr comment');

    // Сам прогон: исходник как предоставлен И производная; политика anti-tukhta in-script.
    expect(kernelScript).toContain('lake env lean "$REPO_ROOT/$source"');
    expect(kernelScript).toContain('lake env lean "$REPO_ROOT/$derivative"');
    expect(kernelScript).toContain('EXPECTED_FAIL');
    expect(kernelScript).toContain('SORRY_DETECTED');
    expect(kernelScript).toMatch(/SORRY_DETECTED[\s\S]{0,300}?overall_fail=1/u);
    expect(kernelScript).toMatch(/grep -Fxq "\$source" "\$EXPECTED_FAIL_FILE"/u);
    // Целостность: производная обязана быть выведена из этих байтов исходника.
    expect(kernelScript).toContain('cmp -s');
    expect(kernelScript).toContain('integrity');
    // Прогон обязан выводить #print axioms-совместимые строки ядра.
    expect(kernelScript).toContain('does not depend on any axioms');
    expect(kernelScript).toContain('depends on axioms');
  });
});
