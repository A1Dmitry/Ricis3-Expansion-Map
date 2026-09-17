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
  blankCommentsAndStrings,
  collectTheoremNames,
  coreCheckBody,
  renderCoreCheck,
} from '../scripts/generateLeanCoreChecks';
import { collectRecordedRunIds } from './tpsStandardWork';

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
      // sorry/admit недопустимы как ТАКТИКА/заполнитель доказательства. Сравнение идёт по
      // тексту с вычищенными комментариями и строковыми литералами (тот же разбор, что
      // использует генератор для имён теорем): упоминание «No sorry.» в док-комментарии
      // исходника не является тактикой, тогда как настоящий `by sorry` в теле остаётся
      // видимым и бракует производную. Авторитетная проверка — `sorryAx` в прогоне ядра.
      const sorryScannable = blankCommentsAndStrings(committed);
      expect(sorryScannable, `${entry.output}: sorry в производной недопустим`).not.toMatch(/\bsorry\b|\badmit\b/u);
    }
  });

  it('мутационная проба: детектор sorry чувствует код и не слепнет на комментариях', () => {
    // Урок A-0006: опасен не красный страж, а нечувствительный. Проверка обязана
    // уметь краснеть: настоящий `sorry`/`admit` в теле доказательства переживает
    // вычитку комментариев и строк и ловится регулярным выражением.
    const codeSorry = 'theorem t : 1 = 1 := by sorry\nexample : 2 = 2 := by admit';
    const blankedCode = blankCommentsAndStrings(codeSorry);
    expect(blankedCode).toMatch(/\bsorry\b/u);
    expect(blankedCode).toMatch(/\badmit\b/u);

    // Намеренное поведение: упоминание в док-комментарии/строке (класс
    // «No sorry.» в Schwarzschild_GeometricBridge.lean) тактикой не является.
    const proseSorry = '/-\n  No sorry.\n-/\ndef s := "sorry admit"\ntheorem t : 1 = 1 := rfl';
    const blankedProse = blankCommentsAndStrings(proseSorry);
    expect(blankedProse).not.toMatch(/\bsorry\b|\badmit\b/u);
  });

  it('каждая цель #print axioms в эпилоге — реальная теорема производной, а не выдуманное имя', () => {
    for (const entry of LEAN_CORE_CHECK_PLAN) {
      const committed = readText(entry.output);
      const epilogue = committed.slice(committed.indexOf(EPILOGUE_MARKER));
      const declared = collectTheoremNames(coreCheckBody(readText(entry.source), entry));
      const printed = epilogue
        .split('\n')
        .filter((line) => line.startsWith('#print axioms '))
        .map((line) => line.replace('#print axioms ', '').trim());

      expect(printed.length, entry.output).toBeGreaterThan(0);
      expect(printed, entry.output).toEqual([...declared]);
      // Имя обязано быть полным: эпилог стоит после `end <namespace>`.
      expect(
        printed.every((name) => !name.includes(' ') && name.length > 0),
        `${entry.output}: некорректное имя теоремы в эпилоге`,
      ).toBe(true);
    }
  });

  it('подстановка в производной допускается только вместе с установленной первопричиной', () => {
    for (const entry of LEAN_CORE_CHECK_PLAN) {
      if (entry.substitutions.length === 0) continue;
      // Подгонка байтов под желаемый зелёный прогон — ТУФТА: каждая замена обязана
      // опираться на факт, установленный прогоном ядра или аудитом исходников ядра Lean.
      expect(entry.sourceFindings.length, `${entry.artifactId}: подстановка без первопричины`).toBeGreaterThan(0);
      for (const substitution of entry.substitutions) {
        expect(substitution.reason.length, `${entry.artifactId}: пустая причина замены`).toBeGreaterThan(20);
        expect(readText(entry.source), `${entry.artifactId}: заявленная замена не найдена в исходнике`).toContain(
          substitution.from,
        );
      }
      // Замена обязана быть точечной и полной в ТЕЛЕ (эпилог legitimately цитирует
      // и исходный, и заменённый текст как документацию подстановки).
      const source = readText(entry.source);
      const derivative = readText(entry.output);
      const derivativeBody = derivative.slice(0, derivative.indexOf(EPILOGUE_MARKER));
      for (const substitution of entry.substitutions) {
        const before = source.split(substitution.from).length - 1;
        const after = derivativeBody.split(substitution.to).length - 1;
        expect(after, `${entry.artifactId}: замена «${substitution.from}» не прослеживается`).toBeGreaterThanOrEqual(
          before,
        );
        if (substitution.to.includes(substitution.from)) {
          // Паттерн ВСТАВКИ: `to` расширяет `from` (например, добавление клаузы `deriving`
          // после строки индуктива). Исходный текст обязан остаться ПРЕФИКСОМ каждого
          // вхождения `to`; число вхождений `to` не меньше исходных `from` (проверено выше).
          expect(
            substitution.to.startsWith(substitution.from),
            `${entry.artifactId}: вставочная подстановка обязана расширять исходный текст`,
          ).toBe(true);
        } else {
          // Паттерн ЗАМЕНЫ: исходный текст не должен остаться в теле производной.
          expect(
            derivativeBody,
            `${entry.artifactId}: «${substitution.from}» осталось в теле производной`,
          ).not.toContain(substitution.from);
        }
      }
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
    // Реально требуют сборки Mathlib: числовые типы (ℝ/ℚ) и тактики ring/norm_num.
    const mathlibRequired: readonly string[] = ['RicisAgiTarget.lean', 'jacobian-counterexample-full.lean'];
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

interface RegistryTheorem {
  readonly name: string;
  readonly status: 'LEAN_VERIFIED_AXIOM_FREE' | 'LEAN_VERIFIED_WITH_STANDARD_AXIOMS' | 'REJECTED_SORRYAX';
  readonly axioms: readonly string[];
}

interface RegistryArtifact {
  readonly artifactId: string;
  readonly immutableSource: string;
  readonly sourceSha256: string;
  readonly checkedFile: string;
  readonly compilerExit: number;
  readonly compilerErrorCount: number;
  readonly theorems: readonly RegistryTheorem[];
  readonly outcome: string;
  readonly rootCause: string | null;
  readonly trustBoundary: string;
}

const findingsRegistry = JSON.parse(
  readText(join(CORE_CHECK_DIRECTORY, 'kernel-findings.json')),
) as {
  readonly generatedFrom: { readonly runId: number; readonly rawEvidence: string };
  readonly artifacts: readonly RegistryArtifact[];
  readonly findings: readonly { readonly id: string; readonly severity: string; readonly evidence: string }[];
  /** Ядровой прогон Mathlib-пути (отдельная цель, отдельный тулчейн) — см. tools/leanMathlibChecks.test.ts. */
  readonly mathlibRun?: {
    readonly runId: number;
    readonly job: string;
    readonly rawEvidence: string;
  };
  readonly ciPolicy?: {
    readonly rule: string;
    readonly expectedFailures: readonly {
      readonly artifactId: string;
      readonly checkedFile: string;
      readonly basis: string;
    }[];
  };
};

describe('Реестр фактов ядрового прогона (kernel-findings.json)', () => {
  it('ссылается на реально существующие файлы и фактические sha256 исходников', () => {
    expect(findingsRegistry.artifacts.length).toBeGreaterThanOrEqual(8);
    expect(existsSync(join(repositoryRoot, findingsRegistry.generatedFrom.rawEvidence))).toBe(true);

    for (const item of findingsRegistry.artifacts) {
      expect(existsSync(join(repositoryRoot, item.immutableSource)), item.immutableSource).toBe(true);
      expect(sha256(readText(item.immutableSource)), `${item.immutableSource}: исходник изменён`).toBe(
        item.sourceSha256,
      );
      if (item.checkedFile !== item.immutableSource) {
        expect(existsSync(join(repositoryRoot, item.checkedFile)), item.checkedFile).toBe(true);
      }
      expect(item.trustBoundary.length, item.artifactId).toBeGreaterThan(40);
    }
  });

  it('не повышает статус по красному прогону: LEAN_VERIFIED только при exit 0 и отсутствии sorryAx', () => {
    for (const item of findingsRegistry.artifacts) {
      const sorry = item.theorems.filter((theorem) => theorem.status === 'REJECTED_SORRYAX');
      if (item.outcome === 'LEAN_VERIFIED') {
        expect(item.compilerExit, `${item.artifactId}: LEAN_VERIFIED при ненулевом exit`).toBe(0);
        expect(item.compilerErrorCount, `${item.artifactId}: LEAN_VERIFIED при ошибках компилятора`).toBe(0);
        expect(sorry, `${item.artifactId}: LEAN_VERIFIED при sorryAx`).toHaveLength(0);
        expect(
          item.theorems.every((theorem) => theorem.axioms.every((axiom) => axiom !== 'sorryAx')),
          item.artifactId,
        ).toBe(true);
      }
      if (item.outcome === 'SOURCE_REJECTED_BY_KERNEL' || item.outcome === 'NOT_VERIFIED_CORE_ONLY') {
        expect(item.compilerErrorCount, `${item.artifactId}: отказ ядра без зафиксированных ошибок`).toBeGreaterThan(0);
        expect(item.rootCause, `${item.artifactId}: отказ ядра без первопричины`).not.toBeNull();
        expect((item.rootCause ?? '').length, item.artifactId).toBeGreaterThan(40);
      }
      // «Без аксиом» — только для теорем, которые ядро так и назвало.
      for (const theorem of item.theorems) {
        if (theorem.status === 'LEAN_VERIFIED_AXIOM_FREE') {
          expect(theorem.axioms, `${item.artifactId}.${theorem.name}`).toHaveLength(0);
        }
      }
    }
  });

  it('каждый заявленный TRUSTED_AXIOM сопровождается фактическим исходом прогона ядра', () => {
    const registryIds = new Set(findingsRegistry.artifacts.map((item) => item.artifactId));
    for (const fileName of readdirSync(proofsDirectory).filter((name) => name.endsWith('.json'))) {
      const metadata = readMetadata(fileName);
      if (metadata.verification?.trustStatus !== 'TRUSTED_AXIOM') continue;
      const artifactId = fileName.replace(/\.json$/u, '');
      expect(registryIds.has(artifactId), `${fileName}: TRUSTED_AXIOM без записи в реестре прогона`).toBe(true);
    }
  });

  it('присоединённые kernelCheck-метаданные согласованы с реестром и не подменяют заявленный статус', () => {
    const registryById = new Map(findingsRegistry.artifacts.map((item) => [item.artifactId, item]));
    let checked = 0;
    for (const fileName of readdirSync(proofsDirectory).filter((name) => name.endsWith('.json'))) {
      const raw = JSON.parse(readText(`artifacts/proofs/${fileName}`)) as {
        readonly kernelCheck?: {
          readonly statusAfterKernelRun: string;
          readonly immutableSourceSha256: string;
          readonly run: number;
          readonly evidence: string;
          readonly registry: string;
        };
        readonly verification?: { readonly contentHash?: string };
      };
      if (!raw.kernelCheck) continue;
      const artifactId = fileName.replace(/\.json$/u, '');
      const entry = registryById.get(artifactId);
      expect(entry, `${fileName}: kernelCheck без записи в реестре`).toBeDefined();
      expect(raw.kernelCheck.statusAfterKernelRun, fileName).toBe(entry?.outcome);
      expect(raw.kernelCheck.immutableSourceSha256, fileName).toBe(raw.verification?.contentHash);
      // Реестр может фиксировать более одного прогона (core-check и mathlib-check):
      // metadata обязана ссылаться на ОДИН из них, а не на выдуманный номер. Единый
      // сборщик — collectRecordedRunIds (идёт по всей цепочке mathlibRun → priorMathlibRun…).
      expect(collectRecordedRunIds(findingsRegistry), fileName).toContain(raw.kernelCheck.run);
      expect(existsSync(join(repositoryRoot, raw.kernelCheck.evidence)), `${fileName}: evidence не найден`).toBe(true);
      expect(existsSync(join(repositoryRoot, raw.kernelCheck.registry)), `${fileName}: реестр не найден`).toBe(true);
      checked += 1;
    }
    expect(checked).toBeGreaterThanOrEqual(6);
  });

  it('найденные нарушения зафиксированы с evidence и не потеряны', () => {
    const ids = findingsRegistry.findings.map((finding) => finding.id);
    expect(ids).toContain('F-01');
    expect(ids).toContain('F-02');
    for (const finding of findingsRegistry.findings) {
      expect(finding.evidence.length, finding.id).toBeGreaterThan(30);
      expect(finding.severity, finding.id).toMatch(/^(CRITICAL|HIGH|MEDIUM|LOW)$/u);
    }
    // Документация обязана отражать реестр, а не существовать отдельно от него.
    // README (артефактный уровень) фиксирует классификацию и границы; машиночитаемый
    // реестр kernel-findings.json обязателен для каждого TRUSTED_AXIOM (см. тест выше)
    // и для ciPolicy (см. тест механизма ожидаемых отказов ниже).
    const readme = readText('artifacts/proofs/README.md');
    expect(readme).toContain('STRUCTURALLY_VALIDATED');
    expect(readme).toContain('REQUIRES_CORE_LEAN');
    expect(readme).toContain('lean-artifact-kernel-check.yml');
    expect(readme).toContain('lean-kernel-run-2026-09-14.md');
    expect(readme).toContain('immutable');
    // Решение владельца по F-01: jacobian-артефакты классифицированы STRUCTURALLY_VALIDATED,
    // а не как Lean-верифицированные/доказанные классические теоремы.
    expect(readme).toContain('not an arbitrary classical theorem proof');
    const evidenceDoc = readText('docs/05-evidence/proofs/lean-core-checks-run-2026-09-14.md');
    for (const finding of findingsRegistry.findings) {
      expect(evidenceDoc, `evidence-документ не упоминает ${finding.id}`).toContain(finding.id);
    }
  });
});

describe('Механизм ciPolicy: ожидаемые отказы без маскировки (anti-tukhta)', () => {
  const policy = findingsRegistry.ciPolicy;

  it('ciPolicy существует, имеет правило и ссылается только на файлы каталога генератора', () => {
    expect(policy, 'ciPolicy отсутствует в реестре').toBeDefined();
    expect((policy?.rule ?? '').length).toBeGreaterThan(60);
    const catalog = new Set(LEAN_CORE_CHECK_PLAN.map((entry) => entry.output));
    for (const expected of policy?.expectedFailures ?? []) {
      expect(
        catalog.has(expected.checkedFile),
        `ciPolicy: ${expected.checkedFile} не является производной генератора`,
      ).toBe(true);
      // Основание каждого ожидаемого отказа обязано быть зафиксированным фактом
      // (дословные ошибки реального прогона ядра или документированный прогноз
      // со ссылкой на первый прогон, который его подтвердит/опровергнет).
      expect((expected.basis ?? '').length, expected.checkedFile).toBeGreaterThan(80);
      // Ожидаемый отказ не повышает и не опускает заявленные статусы: повышение
      // возможно только после фактического зелёного прогона и обновления реестра.
    }
  });

  it('workflow читает ожидаемые отказы только из реестра и не шунтирует sorryAx', () => {
    const workflow = readText('.github/workflows/lean-artifact-kernel-check.yml');
    // Единственный источник списка — ciPolicy.expectedFailures реестра (jq-извлечение).
    expect(workflow).toContain('ciPolicy.expectedFailures[].checkedFile');
    expect(workflow).toContain('expected-failures.txt');
    // Ожидаемый отказ маркируется, а не молча проглатывается.
    expect(workflow).toContain('EXPECTED_FAIL');
    // sorryAx в СКОМПИЛИРОВАННОМ файле — новый факт и всегда рвёт прогон,
    // даже для зарегистрированного ожидаемого отказа (stop-the-line).
    expect(workflow).toContain('SORRY_DETECTED');
    expect(workflow).toMatch(/SORRY_DETECTED[\s\S]{0,400}?overall_fail=1/u);
    // Цикл обязан сверять каждую цель со списком (grep -Fx по полному пути).
    expect(workflow).toMatch(/grep -Fxq "\$f" "\$EXPECTED_FAIL_FILE"/u);
  });
});
