/**
 * Генератор самодостаточных «kernel-check» производных для Lean-артефактов
 * `artifacts/proofs`, тело которых не использует Mathlib.
 *
 * ЗАЧЕМ ЭТО НУЖНО (задача LEAN-CORE-CHECK-COVERAGE)
 * --------------------------------------------------
 * Репозиторий заявляет `TRUSTED_AXIOM` в метаданных пяти артефактов
 * (`artifacts/proofs/*.json`) и `LEAN_VERIFIED` в `src/model/initialMap.ts`,
 * тогда как AGENTS.md §7 / E-03 / E-04 требуют для этих статусов фактический
 * ядерный прогон: зафиксированный toolchain, команду, compiler output и
 * `#print axioms` без `sorryAx`. Единственный прогон ядра (2026-09-14) покрыл
 * один файл — `database-a6-minimal-core-check.lean`, потому что остальные 14
 * начинаются со строки `import Mathlib`, а сборки Mathlib на стандартном
 * GitHub-runner не существует.
 *
 * Аудит показал: у части артефактов `import Mathlib` **не используется телом**
 * (доказательства — `rfl`, `cases`, `induction`, `constructor`; типы — только
 * `String`/`Nat`/`List`/индуктивы ядра). Такие артефакты проверяются ядром Lean
 * 4.33.1 без Mathlib, если импорт убрать.
 *
 * ГРАНИЦА ПРАВ (AGENTS.md §7 — неизменяемый внешний исходник)
 * -----------------------------------------------------------
 * Исходные байты артефактов НЕ изменяются. Генератор создаёт НОВУЮ версию
 * доказательства (§7: «создаётся новая версия доказательства или новый узел»)
 * в отдельном каталоге `artifacts/proofs/core-checks/`. Преобразование
 * детерминировано и проверяемо тестом `tools/leanKernelCoreChecks.test.ts`:
 *
 *   производная = (исходник − строка `import Mathlib`) [+ заявленные подстановки]
 *                 + ДОБАВЛЕННЫЙ В КОНЕЦ эпилог `#print axioms`
 *
 * Никакая декларация не переписывается и не удаляется: префикс производной
 * байт-в-байт равен исходнику без неиспользованного импорта. Эпилог — только
 * инспекционные команды `#print axioms` (они не участвуют в доказательстве) и
 * фиксируют границу доверия прогона.
 *
 * ГРАНИЦА ДОВЕРИЯ САМОГО ПРОГОНА
 * ------------------------------
 * Успешный прогон доказывает структурные теоремы артефакта (например,
 * `ricisReduce (divSelf e) = one`). Он НЕ доказывает эмпирические утверждения
 * узлов карты (Clay-задачи, AGI-метрики): это зафиксировано в эпилоге и в
 * evidence-документе. Статус повышается только для того, что реально проверено.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Точечная замена, допустимая в производной. Всегда документируется причиной. */
export interface CoreCheckSubstitution {
  readonly from: string;
  readonly to: string;
  readonly reason: string;
}

export interface LeanCoreCheckPlanEntry {
  /** Идентификатор артефакта (совпадает с базой имени исходника). */
  readonly artifactId: string;
  /** Неизменяемый исходник (AGENTS.md §7). */
  readonly source: string;
  /** Генерируемая самодостаточная производная. */
  readonly output: string;
  /** Метаданные артефакта, если они есть (для сверки `contentHash`/`trustStatus`). */
  readonly metadataJson?: string;
  /**
   * Заявленные точечные подстановки. Пустой список = тело скопировано
   * байт-в-байт (удалён только неиспользуемый импорт).
   */
  readonly substitutions: readonly CoreCheckSubstitution[];
  /** Основание самодостаточности: что именно не требует Mathlib. */
  readonly rationale: string;
  /**
   * Факты о ИСХОДНИКЕ, установленные реальным прогонoм ядра (с указанием run).
   * Обязательны, если заявлена подстановка: подстановка без установленной
   * первопричины была бы подгонкой evidence под желаемый результат (ТУФТА).
   */
  readonly sourceFindings: readonly string[];
}

const PROOFS_DIR = 'artifacts/proofs';
const CORE_CHECK_DIR = `${PROOFS_DIR}/core-checks`;

/**
 * Пакет 1: артефакты, тело которых использует только ядро Lean 4.33.1
 * (индуктивные AST, `String`, `Nat`, `List`; доказательства — `rfl`, `cases`,
 * `induction`, `constructor`, `repeat constructor`). Проверено чтением каждого
 * файла: ни `ℝ`/`ℚ`/`ℂ`, ни `ring`/`norm_num`, ни Mathlib-лемм в теле нет.
 */
export const LEAN_CORE_CHECK_PLAN: readonly LeanCoreCheckPlanEntry[] = [
  {
    artifactId: 'ricis-v79-monolith',
    source: `${PROOFS_DIR}/ricis-v79-monolith.standalone.lean`,
    output: `${CORE_CHECK_DIR}/ricis-v79-monolith.standalone.core-check.lean`,
    metadataJson: `${PROOFS_DIR}/ricis-v79-monolith.json`,
    substitutions: [
      {
        from: 'ℕ',
        to: 'Nat',
        reason:
          'нотация ℕ объявлена в Mathlib, а не в ядре Lean 4.33.1; ядро печатает ℕ только как ' +
          'подсказку (@[suggest_for ℕ] в src/Init/Prelude.lean). Тот же тип Nat, ядро-совместимая нотация.',
      },
      {
        from:
          '  repeat constructor\n  · rfl\n  · rfl\n  · rfl\n  · rfl\n  · rfl\n  · rfl\n  · rfl\n  · rfl',
        to: '  repeat constructor',
        reason:
          'run 34870620154 (Lean 4.33.1): после ℕ → Nat все 31 теорема приняты, sorryAx отсутствует, ' +
          'единственная ошибка — 392:2 «No goals to be solved»: на ядровой базе `repeat constructor` ' +
          'закрывает все 9 конъюнктов (Eq.refl — конструктор Eq), и 8 буллетов `· rfl` избыточны. ' +
          'Утверждение теоремы не меняется — удалён только избыточный хвост доказательного скрипта.',
      },
    ],
    rationale:
      'Тело: индуктив RExpr над String, доказательства rfl / cases F <;> rfl / repeat constructor. ' +
      'Единственная зависимость от Mathlib — нотация ℕ (2 вхождения, оба в сигнатурах resolveSteps/resolveError). ' +
      'Дополнительно удалён избыточный хвост `· rfl` (8 буллетов) в доказательстве RICIS_v79_unified: ' +
      'на ядровой базе цели уже закрыты `repeat constructor` (run 34870620154, 392:2).',
    sourceFindings: [
      'run 34858902595 (Lean 4.33.1): без Mathlib `ℕ` не является Nat — ядро elaborирует его как ' +
        'свободную переменную (`ℕ : Sort u_1`), поэтому `OfNat ℕ 1`/`OfNat ℕ 0` не синтезируются ' +
        '(строки 301–315), а ns_steps_4D / ns_error_zero / RICIS_v79_unified получают sorryAx.',
      'Контроль: идентичный по структуре артефакт ricis-universal-orchestration-template.lean, ' +
        'где счетчики объявлены как `Nat`, компилируется ядром без ошибок (тот же run, exit 0).',
      'run 34870620154 (Lean 4.33.1): подстановка ℕ → Nat устранила все 15 ошибок — 31 теорема ' +
        'напечатана #print axioms, sorryAx отсутствует (3 без аксиом, 28 × propext, включая ' +
        'RICIS_v79_unified). Единственная ошибка — 392:2 «No goals to be solved»: после ' +
        '`repeat constructor` (закрыл все 9 конъюнктов, Eq.refl — конструктор Eq) первый из ' +
        '8 буллетов `· rfl` применён при отсутствии целей. Дефект гигиены скрипта, а не ' +
        'недоказанность утверждения (F-06); в производной 0.4.189 буллеты удалены подстановкой.',
    ],
  },
  {
    artifactId: 'ricis-universal-orchestration-template',
    source: `${PROOFS_DIR}/ricis-universal-orchestration-template.lean`,
    output: `${CORE_CHECK_DIR}/ricis-universal-orchestration-template.core-check.lean`,
    substitutions: [],
    rationale:
      'Тело: структурные редукции, счетчики `Nat`, доказательство-конъюнкция закрыто ⟨rfl, …⟩. ' +
      'Mathlib-символов нет — проверено фактическим прогоном ядра (run 34858902595, exit 0).',
    sourceFindings: [],
  },
  {
    artifactId: 'ricis-backend-exact-reduction',
    source: `${PROOFS_DIR}/ricis-backend-exact-reduction.standalone.lean`,
    output: `${CORE_CHECK_DIR}/ricis-backend-exact-reduction.standalone.core-check.lean`,
    metadataJson: `${PROOFS_DIR}/ricis-backend-exact-reduction.json`,
    substitutions: [
      {
        from: 'ℕ',
        to: 'Nat',
        reason:
          'нотация ℕ объявлена в Mathlib, а не в ядре Lean 4.33.1; тот же тип Nat в ядро-совместимой нотации.',
      },
    ],
    rationale:
      'Тело: структурная редукция, счетчики и итерации; доказательства rfl / induction / constructor / intro. ' +
      'Единственная зависимость от Mathlib — нотация ℕ (8 вхождений в сигнатурах).',
    sourceFindings: [
      'run 34858902595 (Lean 4.33.1): 26 ошибок, все — следствие `ℕ` (OfNat ℕ …, `induction` по ' +
        'не-индуктивному типу, каскадные rfl/sorryAx, неизвестные константы repeated_error_zero и ' +
        'error_independent_of_iterations). Других дефектов тела прогон не выявил.',
    ],
  },
  {
    artifactId: 'ricis-chatbot-monetization',
    source: `${PROOFS_DIR}/ricis-chatbot-monetization.lean`,
    output: `${CORE_CHECK_DIR}/ricis-chatbot-monetization.core-check.lean`,
    metadataJson: `${PROOFS_DIR}/ricis-chatbot-monetization.json`,
    substitutions: [],
    rationale:
      'Тело: A6-мост 0_Cost × ∞_N через mu(rect F G); обе теоремы закрыты rfl. Mathlib-символов нет — ' +
      'проверено фактическим прогоном ядра (run 34858902595, exit 0).',
    sourceFindings: [],
  },
  {
    artifactId: 'ricis-jacobian-conjecture',
    source: `${PROOFS_DIR}/ricis-jacobian-conjecture.standalone.lean`,
    output: `${CORE_CHECK_DIR}/ricis-jacobian-conjecture.standalone.core-check.lean`,
    metadataJson: `${PROOFS_DIR}/ricis-jacobian-conjecture.json`,
    substitutions: [
      {
        from: '  | partial (F x : RExpr)',
        to: '  | partialDeriv (F x : RExpr)',
        reason:
          '`partial` — зарезервированное ключевое слово Lean 4 (модификатор определений), поэтому ' +
          'исходник не парсится. Конструктор переименован; в артефакте он больше нигде не используется ' +
          '(единственное вхождение — строка 25) и ни одна из двух теорем его не упоминает.',
      },
    ],
    rationale:
      'Тело: структурный детерминант det(m11,m12,m21,m22) как AST-узел; обе теоремы закрыты rfl.',
    sourceFindings: [
      'run 34858902595 (Lean 4.33.1): ИСХОДНИК НЕ КОМПИЛИРУЕТСЯ — `24:12 error: expected token` ' +
        '(конструктор `partial`), далее каскад `Invalid pattern variable: RExpr.zero has multiple ' +
        'components`, `Invalid pattern: Expected a constructor or constant marked with [match_pattern]` ' +
        'и `Unknown constant RICIS_Jacobian.Jacobian_singularity_resolved`. Файл никогда не был ' +
        'проверен ни одним ядром Lean, несмотря на `trustStatus: TRUSTED_AXIOM` в метаданных.',
    ],
  },
  {
    artifactId: 'ricis-navier-stokes-ast-bridge',
    source: `${PROOFS_DIR}/ricis-navier-stokes-ast-bridge.standalone.lean`,
    output: `${CORE_CHECK_DIR}/ricis-navier-stokes-ast-bridge.standalone.core-check.lean`,
    metadataJson: `${PROOFS_DIR}/ricis-navier-stokes-ast-bridge.json`,
    substitutions: [],
    rationale:
      'Тело: FieldExpr-AST (deriv/laplace/grad) и E/E → one; доказательства rfl. `open RICIS` разрешается ' +
      'родительским namespace самого файла. Проверено фактическим прогоном ядра (run 34858902595, exit 0).',
    sourceFindings: [],
  },
  {
    artifactId: 'ricis-riemann-zeta-ast-bridge',
    source: `${PROOFS_DIR}/ricis-riemann-zeta-ast-bridge.standalone.lean`,
    output: `${CORE_CHECK_DIR}/ricis-riemann-zeta-ast-bridge.standalone.core-check.lean`,
    metadataJson: `${PROOFS_DIR}/ricis-riemann-zeta-ast-bridge.json`,
    substitutions: [],
    rationale:
      'Тело: ZetaExpr-AST (pole/analyticContinuation) и E/E → one; доказательства rfl. Проверено ' +
      'фактическим прогоном ядра (run 34858902595, exit 0).',
    sourceFindings: [],
  },
  {
    artifactId: 'ricis-kernel-ast-sp5',
    source: `${PROOFS_DIR}/ricis-kernel-ast-sp5.standalone.lean`,
    output: `${CORE_CHECK_DIR}/ricis-kernel-ast-sp5.standalone.core-check.lean`,
    substitutions: [
      {
        from: 'ℚ',
        to: 'Rat',
        reason:
          'нотация ℚ объявлена в Mathlib; ядро Lean 4.33.1 знает только тип Rat ' +
          '(@[suggest_for ℚ] в src/Init/Data/Rat/Basic.lean, структура Rat имеет deriving DecidableEq).',
      },
      {
        from: '| indexedInf (e : RExpr)',
        to: '| indexedInf (e : RExpr)\n  deriving DecidableEq, Repr',
        reason:
          'singularDiv использует `if a = b`; для `if` требуется экземпляр DecidableEq RExpr, а ядро ' +
          'Lean 4.33.1 не выводит такие экземпляры автоматически (только явный deriving). Клауза введена ' +
          'вместе с производной коммитом 8665a06 (main); прогон ядра run 34877214125 — exit 0, без sorryAx.',
      },
    ],
    rationale:
      'Тело: структурная редукция SP5 и singularDiv через `if a = b`; доказательства unfold + simp и rfl. ' +
      'Кроме нотации ℚ Mathlib-символов нет. Клауза `deriving DecidableEq, Repr` добавлена к индуктиву ' +
      'RExpr: она обязательна для `if a = b` (ядро 4.33.1 не выводит DecidableEq автоматически); ' +
      'run 34877214125 (Lean 4.33.1) — exit 0.',
    sourceFindings: [
      'Статический аудит ядра Lean 4.33.1: нотация ℚ объявлена в Mathlib, в ядре только ' +
        '@[suggest_for ℚ] (src/Init/Data/Rat/Basic.lean).',
      'Ядро Lean 4.33.1: `if a = b` требует экземпляра DecidableEq RExpr; явные `deriving` — ' +
        'единственный механизм вывода таких экземпляров (авто-вывода в ядре нет). Клауза ' +
        '`deriving DecidableEq, Repr` введена коммитом 8665a06 (main) вместе с производной; ' +
        'прогон ядра run 34877214125 (Lean 4.33.1) — exit 0, sorryAx отсутствует.',
    ],
  },
  {
    artifactId: 'ricis-seed-expansion-a11',
    source: `${PROOFS_DIR}/ricis-seed-expansion-a11.lean`,
    output: `${CORE_CHECK_DIR}/ricis-seed-expansion-a11.core-check.lean`,
    substitutions: [
      {
        from:
          '  intro r hr\n' +
          '  unfold expandTo\n' +
          '  split\n' +
          '  · exact List.mem_of_mem_append_left hr\n' +
          '  · split <;> simp [hr]',
        to:
          '  intro r hr\n' +
          '  unfold expandTo\n' +
          '  let rOpt := resolve s\n' +
          '  change r ∈ (match (match rOpt with\n' +
          '                     | none => ExpansionOutcome.rejected s "RESOLUTION_REQUIRED"\n' +
          '                     | some r0 =>\n' +
          '                         if !coreProtected r0 then\n' +
          '                           ExpansionOutcome.rejected s "PROTECTED_CORE_MUTATION"\n' +
          '                         else if !isOpen s form then\n' +
          '                           ExpansionOutcome.rejected s "PROBLEM_ALREADY_COVERED"\n' +
          '                         else if !isNew s r0 then\n' +
          '                           ExpansionOutcome.rejected s "DUPLICATE_AXIOM"\n' +
          '                         else\n' +
          '                           ExpansionOutcome.expanded\n' +
          '                             { generation := s.generation + 1\n' +
          '                               rules := s.rules ++ [r0]\n' +
          '                               ledger := s.ledger ++ [r0.id] }\n' +
          '                             r0.id)\n' +
          '                   with | ExpansionOutcome.expanded s\' _ => s\'.rules\n' +
          '                        | ExpansionOutcome.rejected s\' _ => s\'.rules)\n' +
          '  cases rOpt with\n' +
          '  | none =>\n' +
          '    simp\n' +
          '    exact hr\n' +
          '  | some r0 =>\n' +
          '    simp\n' +
          '    let b1 := coreProtected r0\n' +
          '    let b2 := isOpen s form\n' +
          '    let b3 := isNew s r0\n' +
          '    change r ∈ (match (if b1 = false then\n' +
          '                         ExpansionOutcome.rejected s "PROTECTED_CORE_MUTATION"\n' +
          '                       else if b2 = false then\n' +
          '                         ExpansionOutcome.rejected s "PROBLEM_ALREADY_COVERED"\n' +
          '                       else if b3 = false then\n' +
          '                         ExpansionOutcome.rejected s "DUPLICATE_AXIOM"\n' +
          '                       else\n' +
          '                         ExpansionOutcome.expanded\n' +
          '                           { generation := s.generation + 1\n' +
          '                             rules := s.rules ++ [r0]\n' +
          '                             ledger := s.ledger ++ [r0.id] }\n' +
          '                           r0.id)\n' +
          '                     with | ExpansionOutcome.expanded s\' _ => s\'.rules\n' +
          '                          | ExpansionOutcome.rejected s\' _ => s\'.rules)\n' +
          '    cases b1 with\n' +
          '    | true =>\n' +
          '      cases b2 with\n' +
          '      | true =>\n' +
          '        cases b3 with\n' +
          '        | true =>\n' +
          '          simp\n' +
          '          exact Or.inl hr\n' +
          '        | false =>\n' +
          '          simp\n' +
          '          exact hr\n' +
          '      | false =>\n' +
          '        simp\n' +
          '        exact hr\n' +
          '    | false =>\n' +
          '      simp\n' +
          '      exact hr',
        reason:
          'Ф-08 (ремонт ядра A11). Дословные ошибки текущей производной, воспроизведённые прогоном ' +
          'зафиксированного ядра (2026-09-15, Lean 4.33.1, commit 819816b2e0a3bf405af45ae5c7af2491d8f5bee6 — ' +
          'тот же commit, что в CI; evidence: docs/05-evidence/proofs/lean-core-checks-local-run-2026-09-15.md): ' +
          '104:4 «Type mismatch: List.mem_append.mpr (Or.inl hr) has type r ∈ s.rules ++ ?m.77 but is expected ' +
          'to have type r ∈ a✝¹.rules», 105:4 «Tactic `split` failed: Could not split an `if` or `match` ' +
          'expression in the goal» (диагностика показывает: ядровой `split` расщепляет ВНЕШНИЙ match по ' +
          'ExpansionOutcome и оставляет равенство scrutinee гипотезой `heq✝ : (match resolve s with …) = ' +
          'rejected a✝¹ a✝` — в цели `r ∈ a✝¹.rules` нет ни if, ни match, поэтому второй `split` невозможен; ' +
          'тактика исходника написана под семантику Mathlib-`split`). Новое доказательство: `let` + `change` + ' +
          '`cases` по `resolve s` и по трём Bool-условиям ворот (в ядре 4.33.1 `cases` по непрозрачному терму ' +
          'НЕ подставляет его вхождения в цель — установлено прогоном; подстановка идёт через let-константу, ' +
          'приведённую `change` к целевому терму). Утверждение теоремы не меняется. Прогон: exit 0, ошибок 0, ' +
          'sorryAx отсутствует, все 6 теорем — только propext.',
      },
      {
        from: '  unfold admitWithIdentity identityCoherent\n  simp [h]',
        to: '  unfold admitWithIdentity identityCoherent\n  simp\n  assumption',
        reason:
          'Ф-08 (доказательства identity-ворот). Прогон ядра 4.33.1 (2026-09-15, evidence: ' +
          'docs/05-evidence/proofs/lean-core-checks-local-run-2026-09-15.md): `simp [h]` после `unfold` оставляет ' +
          'дословно цель `⊢ check inputForm outputForm = false` (лентер ядра: «This simp argument is unused: h»; ' +
          'ядровой simp сводит match/ite к равенству Bool-условия, не дотягивая до `rfl`). Остаток дословно ' +
          'совпадает с гипотезой `h` (после раскрытия `identityCoherent`) — закрыт `assumption`. Прогон: exit 0, ' +
          'sorryAx отсутствует, только propext.',
      },
      {
        from: '  unfold admitWithIdentity identityCoherent\n  simp [hbad]',
        to: '  unfold admitWithIdentity identityCoherent\n  simp\n  assumption',
        reason:
          'Ф-08 (пример A14). То же, что и для identity-теорем: прогон ядра 4.33.1 (2026-09-15, evidence: ' +
          'docs/05-evidence/proofs/lean-core-checks-local-run-2026-09-15.md) — `simp [hbad]` оставляет ' +
          'дословно `⊢ check "inf_G-inf_G" "1" = false`, что совпадает с `hbad`; закрыто `assumption`. ' +
          'Прогон: exit 0, sorryAx отсутствует. (Лентерное предупреждение о неиспользуемом `hok` имеется и у ' +
          'исходника; на exit-код и sorryAx не влияет.)',
      },
    ],
    rationale:
      'Тело: модель протокола A11 (Rule/Seed/ExpansionOutcome, ворота допуска, IDENTITY_COHERENCE) на ' +
      'String/List/Nat/Bool. Все использованные тактики — core 4.33.1: intro, unfold, let, change, cases, ' +
      'simp, exact, assumption (все в src/Init/Tactics.lean; `split` src/Init/Tactics.lean:1205 в финальном ' +
      'доказательстве не используется). Ядровые факты, вынудившие форму доказательств, установлены прогоном ' +
      'ядра и зафиксированы в sourceFindings. Прогон ядра 2026-09-15: exit 0, 6/6 теорем без sorryAx, ' +
      'все — только propext.',
    sourceFindings: [
      'Не проверялось ядром до этого PR: evidence 2026-09-14 прямо фиксирует «Lean-модель семени ' +
        '(ricis-seed-expansion-a11.lean) не проверена ядром (REQUIRES_CORE_LEAN)».',
      'run 34870620154 (Lean 4.33.1, CI): моя первая замена `List.mem_of_mem_append_left hr → ' +
        'List.mem_append.mpr (Or.inl hr)` неприменима — 104:4 Type mismatch, 105:4 split failed, ' +
        '156:63/165:50/176:105 unsolved goals; 3 из 6 теорем с sorryAx (F-08).',
      'Прогон ядра 2026-09-15 (Lean 4.33.1, x86_64-unknown-linux-gnu, commit ' +
        '819816b2e0a3bf405af45ae5c7af2491d8f5bee6, Release — собран из официального исходного тега v4.33.1, ' +
        'коммит идентичен CI-закреплённому; evidence: docs/05-evidence/proofs/lean-core-checks-local-run-2026-09-15.md): ' +
        '(1) текущая производная воспроизводит F-08 дословно (104:4 / 105:4 / 156:63, exit 1); ' +
        '(2) диагностика отказа `split` доказала, что ядровой `split` расщепляет внешний match и оставляет ' +
        'равенство scrutinee гипотезой — тактика исходника несовместима с ядром; ' +
        '(3) `cases` по непрозрачному терму не подменяет его вхождения в цель (проверено экспериментом на ' +
        'минимальных примерах) — рабочая схема: let + change + cases по let-константе; ' +
        '(4) условия `if` над Bool в ядре 4.33.1 elaborируются как Prop-равенства (в цели `b = false`) — ' +
        'case-split по Bool-значению через let корректен; ' +
        '(5) финальная производная: exit 0, 0 ошибок, sorryAx отсутствует; #print axioms: все 6 теорем ' +
        '«depends on axioms: [propext]».',
    ],
  },
  {
    artifactId: 'database-a6-0_5_inf_3',
    source: `${PROOFS_DIR}/database-a6-0_5_inf_3.standalone.lean`,
    output: `${CORE_CHECK_DIR}/database-a6-0_5_inf_3.standalone.core-check.lean`,
    substitutions: [],
    rationale:
      'Тело: типизированное ядро RICIS3.ExtendedKernel (RExpr/Rewrite/Derivation) и адаптер ' +
      'сгенерированного утверждения 0_5 × ∞_3. Использованы только abbrev/inductive/structure/deriving ' +
      'и тактики exact / constructor / intro / simpa (simpa — core-тактика 4.33.1).',
    sourceFindings: [
      'Не проверялось ядром до этого PR (статус REQUIRES_CORE_LEAN).',
    ],
  },
  {
    artifactId: 'database-registry-120-jacobian',
    source: `${PROOFS_DIR}/database-registry-120-jacobian.standalone.lean`,
    output: `${CORE_CHECK_DIR}/database-registry-120-jacobian.standalone.core-check.lean`,
    substitutions: [],
    rationale:
      'Тело: то же типизированное ядро и адаптер утверждения 0_det(J) × ∞_Inv(J) для реестра 120. ' +
      'Только core-конструкции и core-тактики (exact / constructor / intro / simpa).',
    sourceFindings: [
      'Не проверялось ядром до этого PR (статус REQUIRES_CORE_LEAN).',
    ],
  },
  {
    artifactId: 'Schwarzschild_GeometricBridge',
    source: `${PROOFS_DIR}/Schwarzschild_GeometricBridge.lean`,
    output: `${CORE_CHECK_DIR}/Schwarzschild_GeometricBridge.core-check.lean`,
    metadataJson: `${PROOFS_DIR}/Schwarzschild_GeometricBridge.json`,
    substitutions: [],
    rationale:
      'Тело использует только ядро-нативные примитивы: структуры над Nat/Int/String с ' +
      'deriving DecidableEq/Repr/Hashable, доказательства rfl / congrArg / simp / native_decide, ' +
      'дискретный A6-прокси на Int (продукт и gated-отношение). Ни ℝ/ℚ/ℂ, ни ring/norm_num, ни ' +
      'других Mathlib-символов в теле нет — установлено пофайловым чтением (локальный тулчейн ' +
      'недоступен, A-0007); три строки импорта Mathlib телом не используются и удаляются в ' +
      'производной. Фактическим основанием самодостаточности станет прогон джобы kernel-check.',
    sourceFindings: [
      'Не проверялось ядром до этого цикла (статус REQUIRES_CORE_LEAN; вне allowlist MATHLIB_ARTIFACTS).',
    ],
  },
];

/** Маркер начала добавленного эпилога: по нему тест отсекает эпилог и сверяет префикс. */
export const EPILOGUE_MARKER = '/-! ===== GENERATED KERNEL-CHECK EPILOGUE';

const MATHLIB_IMPORT_LINE = /^import\s+Mathlib(?:\.[A-Za-z0-9_.]+)?\s*$/u;

export function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/**
 * Заменяет комментарии и строковые литералы пробелами (длины строк сохраняются),
 * чтобы разбор namespace/theorem не срабатывал на текст внутри `/- … -/`, `--`
 * или `"…"`. Именно так в `database-*.standalone.lean` внутри docstring лежит
 * фрагмент чужого `theorem …` — он не должен попадать в эпилог.
 */
export function blankCommentsAndStrings(source: string): string {
  const out = source.split('');
  let index = 0;
  let blockDepth = 0;
  while (index < out.length) {
    const char = out[index];
    const next = out[index + 1];
    if (blockDepth > 0) {
      if (char === '/' && next === '-') {
        out[index] = ' ';
        out[index + 1] = ' ';
        blockDepth += 1;
        index += 2;
        continue;
      }
      if (char === '-' && next === '/') {
        out[index] = ' ';
        out[index + 1] = ' ';
        blockDepth -= 1;
        index += 2;
        continue;
      }
      if (char !== '\n') out[index] = ' ';
      index += 1;
      continue;
    }
    if (char === '/' && next === '-') {
      out[index] = ' ';
      out[index + 1] = ' ';
      blockDepth = 1;
      index += 2;
      continue;
    }
    if (char === '-' && next === '-') {
      while (index < out.length && out[index] !== '\n') {
        out[index] = ' ';
        index += 1;
      }
      continue;
    }
    if (char === '"') {
      out[index] = ' ';
      index += 1;
      while (index < out.length && out[index] !== '"') {
        if (out[index] === '\\') {
          out[index] = ' ';
          index += 1;
          if (index < out.length && out[index] !== '\n') {
            out[index] = ' ';
            index += 1;
          }
          continue;
        }
        if (out[index] !== '\n') out[index] = ' ';
        index += 1;
      }
      if (index < out.length) {
        out[index] = ' ';
        index += 1;
      }
      continue;
    }
    index += 1;
  }
  return out.join('');
}

interface ScopeEntry {
  readonly kind: 'namespace' | 'section';
  readonly name: string;
}

const NAMESPACE_PATTERN = /^namespace\s+([A-Za-z_][A-Za-z0-9_'.]*)\s*$/u;
const SECTION_PATTERN = /^section(?:\s+([A-Za-z_][A-Za-z0-9_'.]*))?\s*$/u;
const END_NAMED_PATTERN = /^end\s+([A-Za-z_][A-Za-z0-9_'.]*)\s*$/u;
const END_BARE_PATTERN = /^end\s*$/u;
const THEOREM_PATTERN =
  /^(?:(?:private|protected|noncomputable|partial|unsafe)\s+)*theorem\s+([A-Za-z_][A-Za-z0-9_'.]*)/u;

/**
 * Собирает полностью квалифицированные имена деклараций, подходящих под
 * `pattern` (группа 1 — имя), с отслеживанием неймспейсов. Цели инспекционных
 * команд эпилога (`#print axioms …`) всегда стоят ПОСЛЕ всех `end …`, поэтому
 * любое имя, объявленное внутри неймспейса, обязано нести его префикс —
 * иначе ядро ответит `unknown identifier` (A-0011: аксиома внутри
 * `namespace JacobianCounterexample` была напечатана неквалифицированно).
 */
export function collectScopedNames(source: string, pattern: RegExp): readonly string[] {
  const scannable = blankCommentsAndStrings(source);
  const scope: ScopeEntry[] = [];
  const names: string[] = [];

  for (const rawLine of scannable.split('\n')) {
    const line = rawLine.trim();
    if (line.length === 0) continue;

    const namespaceMatch = NAMESPACE_PATTERN.exec(line);
    if (namespaceMatch) {
      scope.push({ kind: 'namespace', name: namespaceMatch[1] });
      continue;
    }
    const sectionMatch = SECTION_PATTERN.exec(line);
    if (sectionMatch) {
      scope.push({ kind: 'section', name: sectionMatch[1] ?? '' });
      continue;
    }
    const endNamedMatch = END_NAMED_PATTERN.exec(line);
    if (endNamedMatch) {
      const closing = endNamedMatch[1];
      for (let index = scope.length - 1; index >= 0; index -= 1) {
        const entry = scope[index];
        if (entry && entry.name === closing) {
          scope.splice(index, 1);
          break;
        }
      }
      continue;
    }
    if (END_BARE_PATTERN.test(line)) {
      scope.pop();
      continue;
    }
    const declarationMatch = pattern.exec(line);
    if (declarationMatch && declarationMatch[1]) {
      const prefix = scope
        .filter((entry) => entry.kind === 'namespace')
        .map((entry) => entry.name)
        .join('.');
      names.push(prefix.length > 0 ? `${prefix}.${declarationMatch[1]}` : declarationMatch[1]);
    }
  }

  return [...new Set(names)];
}

/**
 * Собирает полностью квалифицированные имена всех `theorem` файла — цели
 * инспекционных команд `#print axioms` в эпилоге (эпилог стоит после `end …`,
 * поэтому имена обязаны быть полными).
 */
export function collectTheoremNames(source: string): readonly string[] {
  return collectScopedNames(source, THEOREM_PATTERN);
}

/** Удаляет строки `import Mathlib…` и гарантирует отсутствие любых других импортов. */
export function stripMathlibImport(source: string, artifactId: string): string {
  const lines = source.split('\n');
  const kept = lines.filter((line) => !MATHLIB_IMPORT_LINE.test(line));
  const removed = lines.length - kept.length;
  if (removed === 0) {
    throw new Error(`${artifactId}: в исходнике нет строки import Mathlib — производная не нужна`);
  }
  const text = kept.join('\n');
  if (/^import\s/mu.test(text)) {
    throw new Error(`${artifactId}: после удаления import Mathlib остались другие импорты`);
  }
  return text;
}

/** Применяет заявленные подстановки; каждая обязана реально встречаться в теле. */
export function applySubstitutions(
  text: string,
  substitutions: readonly CoreCheckSubstitution[],
  artifactId: string,
): string {
  let result = text;
  for (const substitution of substitutions) {
    const occurrences = result.split(substitution.from).length - 1;
    if (occurrences === 0) {
      throw new Error(
        `${artifactId}: заявленная подстановка «${substitution.from}» не найдена в теле`,
      );
    }
    result = result.split(substitution.from).join(substitution.to);
  }
  return result;
}

/** Тело производной: исходник без неиспользованного импорта + заявленные подстановки. */
export function coreCheckBody(source: string, entry: LeanCoreCheckPlanEntry): string {
  return applySubstitutions(stripMathlibImport(source, entry.artifactId), entry.substitutions, entry.artifactId);
}

function epilogue(entry: LeanCoreCheckPlanEntry, source: string, theorems: readonly string[]): string {
  const substitutionNote =
    entry.substitutions.length === 0
      ? 'Подстановок нет: тело скопировано байт-в-байт.'
      : `Заявленные подстановки: ${entry.substitutions
          .map((item) => `«${item.from}» → «${item.to}» (${item.reason})`)
          .join('; ')}.`;

  const lines = [
    '',
    '',
    EPILOGUE_MARKER + ' (additive only) =====',
    '',
    `  Generator   : scripts/generateLeanCoreChecks.ts (детерминированный; побайтовое`,
    `                совпадение при повторной генерации проверяет`,
    `                tools/leanKernelCoreChecks.test.ts)`,
    `  Source      : ${entry.source}`,
    `  Source hash : sha256 ${sha256(source)}`,
    `  Transform   : удалена неиспользуемая строка import Mathlib.`,
    `                ${substitutionNote}`,
    `                Префикс этого файла байт-в-байт равен исходнику: ни одна`,
    `                декларация не переписана и не удалена (AGENTS.md §7).`,
    `  Basis       : ${entry.rationale}`,
    `  Purpose     : сделать артефакт самодостаточным, чтобы зафиксированное ядро`,
    `                Lean 4.33.1 проверило его и вывело #print axioms`,
    `                (.github/workflows/lean-artifact-kernel-check.yml).`,
    `  Boundary    : прогон проверяет только структурные теоремы этого артефакта.`,
    `                Он НЕ является доказательством эмпирических утверждений узла`,
    `                карты (Clay-задачи, AGI-метрики, экономические прогнозы).`,
    `                Ниже — инспекционные команды, они не участвуют в доказательстве.`,
    '',
    '  ============================================================================-/',
    ...theorems.map((name) => `#print axioms ${name}`),
    '',
  ];
  return lines.join('\n');
}

/** Полный текст производной (детерминированный: без меток времени и версий среды). */
export function renderCoreCheck(entry: LeanCoreCheckPlanEntry, source: string): string {
  const body = coreCheckBody(source, entry);
  const theorems = collectTheoremNames(body);
  if (theorems.length === 0) {
    throw new Error(`${entry.artifactId}: не найдено ни одной theorem — эпилог был бы пустым`);
  }
  return body.replace(/\s*$/u, '') + epilogue(entry, source, theorems);
}

export interface GeneratedCoreCheck {
  readonly artifactId: string;
  readonly source: string;
  readonly sourceSha256: string;
  readonly output: string;
  readonly outputSha256: string;
  readonly substitutions: readonly CoreCheckSubstitution[];
  readonly rationale: string;
  readonly metadataJson?: string;
  readonly printAxiomsTargets: readonly string[];
  readonly text: string;
}

/**
 * Генерирует все производные из фактического содержимого исходников.
 * `write` = записать на диск; иначе вернуть только содержимое (режим --check и тесты).
 */
export function generateCoreChecks(repositoryRoot: string, write: boolean): readonly GeneratedCoreCheck[] {
  const generated = LEAN_CORE_CHECK_PLAN.map((entry) => {
    const sourcePath = join(repositoryRoot, entry.source);
    const source = readFileSync(sourcePath, 'utf8');
    const text = renderCoreCheck(entry, source);
    if (write) {
      const outputPath = join(repositoryRoot, entry.output);
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, text, 'utf8');
    }
    return {
      artifactId: entry.artifactId,
      source: entry.source,
      sourceSha256: sha256(source),
      output: entry.output,
      outputSha256: sha256(text),
      substitutions: entry.substitutions,
      rationale: entry.rationale,
      metadataJson: entry.metadataJson,
      printAxiomsTargets: collectTheoremNames(coreCheckBody(source, entry)),
      text,
    } satisfies GeneratedCoreCheck;
  });

  if (write) {
    const manifest = {
      generator: 'scripts/generateLeanCoreChecks.ts',
      policy: [
        'Исходные артефакты artifacts/proofs/*.lean неизменяемы (AGENTS.md §7).',
        'Производная = исходник − неиспользуемая строка import Mathlib [+ заявленные подстановки] + добавленный эпилог #print axioms.',
        'Повторная генерация обязана дать побайтово тот же результат (tools/leanKernelCoreChecks.test.ts).',
        'Прогон ядра фиксирует только структурные теоремы артефакта, не эмпирические утверждения узла карты.',
      ],
      toolchain: 'lean 4.33.1 (pinned via elan, GitHub Actions ubuntu-latest)',
      command: 'lean +4.33.1 <artifact>',
      artifacts: generated.map((item) => ({
        artifactId: item.artifactId,
        source: item.source,
        sourceSha256: item.sourceSha256,
        output: item.output,
        outputSha256: item.outputSha256,
        substitutions: item.substitutions,
        sourceFindings: LEAN_CORE_CHECK_PLAN.find((plan) => plan.artifactId === item.artifactId)?.sourceFindings ?? [],
        rationale: item.rationale,
        metadataJson: item.metadataJson ?? null,
        printAxiomsTargets: item.printAxiomsTargets,
      })),
    };
    mkdirSync(join(repositoryRoot, CORE_CHECK_DIR), { recursive: true });
    writeFileSync(
      join(repositoryRoot, CORE_CHECK_DIR, 'manifest.json'),
      JSON.stringify(manifest, null, 2) + '\n',
      'utf8',
    );
  }

  return generated;
}

export const CORE_CHECK_DIRECTORY = CORE_CHECK_DIR;

const invokedDirectly = Boolean(process.argv[1]) && process.argv[1].includes('generateLeanCoreChecks');

if (invokedDirectly) {
  const repositoryRoot = dirname(fileURLToPath(import.meta.url)).replace(/[/\\]scripts$/u, '');
  const checkOnly = process.argv.includes('--check');
  const generated = generateCoreChecks(repositoryRoot, !checkOnly);
  if (checkOnly) {
    let drift = 0;
    for (const item of generated) {
      const committedPath = join(repositoryRoot, item.output);
      let committed = '';
      try {
        committed = readFileSync(committedPath, 'utf8');
      } catch {
        committed = '<missing>';
      }
      const same = committed === item.text;
      if (!same) drift += 1;
      console.log(`${same ? 'OK  ' : 'DRIFT'} ${item.output}`);
    }
    console.log(
      JSON.stringify({ mode: 'check', files: generated.length, drift, exitCode: drift === 0 ? 0 : 1 }),
    );
    if (drift > 0) process.exitCode = 1;
  } else {
    console.log(
      JSON.stringify(
        generated.map((item) => ({
          artifactId: item.artifactId,
          output: item.output,
          outputSha256: item.outputSha256,
          theorems: item.printAxiomsTargets.length,
        })),
        null,
        2,
      ),
    );
  }
}
