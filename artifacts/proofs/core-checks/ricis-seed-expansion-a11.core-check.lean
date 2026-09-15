
/-!
  RICIS-III — Seed Expansion Protocol (A11)

  Author: Dmitry V. Aleynikov (ORCID: 0009-0004-3226-7700)

  STATUS: DRAFT SPECIFICATION — `REQUIRES_CORE_LEAN`.
  This file has NOT been checked by a Lean kernel in this repository.
  Per AGENTS.md §7, promotion to `TRUSTED_AXIOM` requires a reproducible kernel run:
  pinned toolchain, exact command, compiler output, `#print axioms` output,
  absence of `sorryAx`, and no compiler errors. Until then this artifact is a
  machine-readable statement of the protocol, not evidence of its verification.

  Modelling note: the TypeScript implementation in `src/ricisSeed` represents
  proofs, gates and fingerprints concretely. This Lean model abstracts them to
  decidable predicates in order to state the structural invariants:
  monotonicity (R_k ⊆ R_(k+1)), rejection preserves the generation, an unproved
  candidate never commits, and a breach of the identity law (X - X = 0, X / X = 1)
  is rejected before it can be committed (SP2: identity first).
-/

namespace RICIS.Seed

/-- Layer of a rule: absolute law, safety protocol, mathematical axiom, meta-axiom. -/
inductive Layer where
  | law
  | protocol
  | axiom
  | metaAxiom
  deriving DecidableEq, Repr

/-- A rule of the system. `fingerprint` is the structural identity (L1: X = X). -/
structure Rule where
  id : String
  layer : Layer
  statement : String
  fingerprint : String
  origin : String
  /-- Applicability restriction, e.g. "A7 applies only when NF(F) ≠ NF(G)".
      The guard is part of the mathematical content: changing it changes the fingerprint. -/
  guard : String := ""
  deriving DecidableEq, Repr

/-- A generation of the system: number, rules, expansion ledger. -/
structure Seed where
  generation : Nat
  rules : List Rule
  ledger : List String
  deriving DecidableEq, Repr

/-- Outcome of an expansion attempt. -/
inductive ExpansionOutcome where
  | expanded (seed : Seed) (axiomId : String)
  | rejected (seed : Seed) (reason : String)
  deriving DecidableEq, Repr

/-- The protected core: these identifiers are never redefined by an expansion (SP9). -/
def protectedCore : List String :=
  ["L0", "L1", "L1C1", "L1C2", "L1C3", "SP1", "SP2", "SP3", "SP4", "SP5", "P1", "A11"]

/-- Covered canonical input forms, i.e. the O(1) reduction table of a generation. -/
def coveredForms (s : Seed) : List String :=
  (s.rules.map Rule.statement)

/-- A candidate is new only if neither its identifier nor its fingerprint occurs in `s`. -/
def isNew (s : Seed) (r : Rule) : Bool :=
  !(s.rules.map Rule.id).contains r.id && !(s.rules.map Rule.fingerprint).contains r.fingerprint

/-- A candidate must not redefine the protected core. -/
def coreProtected (r : Rule) : Bool :=
  !protectedCore.contains r.id

/-- The form must not already be resolved by the generation (SP8: no axiom inflation). -/
def isOpen (s : Seed) (form : String) : Bool :=
  !(coveredForms s).contains form

/-- `ExpandTo`: admission is a separate act from resolution (P2). -/
def expandTo (s : Seed) (form : String) (resolve : Seed → Option Rule) : ExpansionOutcome :=
  match resolve s with
  | none => ExpansionOutcome.rejected s "RESOLUTION_REQUIRED"
  | some r =>
      if !coreProtected r then
        ExpansionOutcome.rejected s "PROTECTED_CORE_MUTATION"
      else if !isOpen s form then
        ExpansionOutcome.rejected s "PROBLEM_ALREADY_COVERED"
      else if !isNew s r then
        ExpansionOutcome.rejected s "DUPLICATE_AXIOM"
      else
        ExpansionOutcome.expanded
          { generation := s.generation + 1
            rules := s.rules ++ [r]
            ledger := s.ledger ++ [r.id] }
          r.id

/-- R(k) ⊆ R(k+1): an admitted rule is never retracted or rewritten (L1C4). -/
theorem monotonic_growth (s : Seed) (form : String) (resolve : Seed → Option Rule) :
    ∀ r ∈ s.rules,
      r ∈ (match expandTo s form resolve with
           | ExpansionOutcome.expanded s' _ => s'.rules
           | ExpansionOutcome.rejected s' _ => s'.rules) := by
  intro r hr
  unfold expandTo
  let rOpt := resolve s
  change r ∈ (match (match rOpt with
                     | none => ExpansionOutcome.rejected s "RESOLUTION_REQUIRED"
                     | some r0 =>
                         if !coreProtected r0 then
                           ExpansionOutcome.rejected s "PROTECTED_CORE_MUTATION"
                         else if !isOpen s form then
                           ExpansionOutcome.rejected s "PROBLEM_ALREADY_COVERED"
                         else if !isNew s r0 then
                           ExpansionOutcome.rejected s "DUPLICATE_AXIOM"
                         else
                           ExpansionOutcome.expanded
                             { generation := s.generation + 1
                               rules := s.rules ++ [r0]
                               ledger := s.ledger ++ [r0.id] }
                             r0.id)
                   with | ExpansionOutcome.expanded s' _ => s'.rules
                        | ExpansionOutcome.rejected s' _ => s'.rules)
  cases rOpt with
  | none =>
    simp
    exact hr
  | some r0 =>
    simp
    let b1 := coreProtected r0
    let b2 := isOpen s form
    let b3 := isNew s r0
    change r ∈ (match (if b1 = false then
                         ExpansionOutcome.rejected s "PROTECTED_CORE_MUTATION"
                       else if b2 = false then
                         ExpansionOutcome.rejected s "PROBLEM_ALREADY_COVERED"
                       else if b3 = false then
                         ExpansionOutcome.rejected s "DUPLICATE_AXIOM"
                       else
                         ExpansionOutcome.expanded
                           { generation := s.generation + 1
                             rules := s.rules ++ [r0]
                             ledger := s.ledger ++ [r0.id] }
                           r0.id)
                     with | ExpansionOutcome.expanded s' _ => s'.rules
                          | ExpansionOutcome.rejected s' _ => s'.rules)
    cases b1 with
    | true =>
      cases b2 with
      | true =>
        cases b3 with
        | true =>
          simp
          exact Or.inl hr
        | false =>
          simp
          exact hr
      | false =>
        simp
        exact hr
    | false =>
      simp
      exact hr

/-- A rejection never advances the generation: the seed is left untouched. -/
theorem rejection_preserves_generation (s : Seed) (form : String) (resolve : Seed → Option Rule) :
    resolve s = none →
      (expandTo s form resolve = ExpansionOutcome.rejected s "RESOLUTION_REQUIRED") := by
  intro h
  unfold expandTo
  simp [h]

/-- Without a resolution there is no new axiom: nothing is committed by computation alone. -/
theorem no_commit_without_proof (s : Seed) (form : String) :
    expandTo s form (fun _ => none) = ExpansionOutcome.rejected s "RESOLUTION_REQUIRED" := by
  unfold expandTo
  simp

/-- The protected core cannot be redefined, even with a produced candidate (SP9). -/
theorem core_rule_never_commits (s : Seed) (form : String) (r : Rule) :
    r.id ∈ protectedCore →
      expandTo s form (fun _ => some r) = ExpansionOutcome.rejected s "PROTECTED_CORE_MUTATION" := by
  intro h
  unfold expandTo coreProtected
  simp [h]

/-- The identity gate (IDENTITY_COHERENCE).

    L1 is applied BEFORE the singularity axioms (SP2: Clean First). Therefore for every
    identification of index symbols an expression `E - E` must reduce to `0` and `E / E` to `1`.
    The evaluator is the canonical-form normaliser; it enters here as a parameter, so the
    kernel-level claim is exactly as strong as the supplied evaluator and nothing more is asserted. -/
def identityCoherent (check : String → String → Bool) (inputForm outputForm : String) : Bool :=
  check inputForm outputForm

/-- Identity is checked after admission: a candidate whose proof chain is valid but whose
    consequence breaks `X - X = 0` (or `X / X = 1`) is rejected, not committed. -/
def admitWithIdentity (check : String → String → Bool) (inputForm outputForm : String)
    (outcome : ExpansionOutcome) : ExpansionOutcome :=
  match outcome with
  | ExpansionOutcome.expanded seed axiomId =>
      if identityCoherent check inputForm outputForm then
        ExpansionOutcome.expanded seed axiomId
      else
        ExpansionOutcome.rejected seed "IDENTITY_VIOLATION"
  | ExpansionOutcome.rejected seed reason => ExpansionOutcome.rejected seed reason

/-- A breach of the identity law is never committed, even when every rule of the candidate's
    proof chain exists in the generation (case `U-INF-SELF-DIFF-WRONG-BRANCH`). -/
theorem identity_violation_never_commits
    (check : String → String → Bool) (inputForm outputForm : String) (seed : Seed) (axiomId : String)
    (h : identityCoherent check inputForm outputForm = false) :
    admitWithIdentity check inputForm outputForm (ExpansionOutcome.expanded seed axiomId)
      = ExpansionOutcome.rejected seed "IDENTITY_VIOLATION" := by
  unfold admitWithIdentity identityCoherent
  simp
  assumption

/-- A candidate satisfying the identity law passes the gate unchanged (no false rejections). -/
theorem identity_ok_preserves_expansion
    (check : String → String → Bool) (inputForm outputForm : String) (seed : Seed) (axiomId : String)
    (h : identityCoherent check inputForm outputForm = true) :
    admitWithIdentity check inputForm outputForm (ExpansionOutcome.expanded seed axiomId)
      = ExpansionOutcome.expanded seed axiomId := by
  unfold admitWithIdentity identityCoherent
  simp
  assumption

/-- The recorded A14 case: `inf_F - inf_F` is `X - X`, so the only admissible consequence is `0`.
    The chain A7 → ∞₀ → A2 → 1 satisfies every other gate but is rejected here. -/
example (check : String → String → Bool)
    (hok : identityCoherent check "inf_F-inf_F" "0" = true)
    (hbad : identityCoherent check "inf_G-inf_G" "1" = false) :
    admitWithIdentity check "inf_G-inf_G" "1"
      (ExpansionOutcome.expanded { generation := 2, rules := [], ledger := [] } "A17")
      = ExpansionOutcome.rejected { generation := 2, rules := [], ledger := [] } "IDENTITY_VIOLATION" := by
  unfold admitWithIdentity identityCoherent
  simp
  assumption

end RICIS.Seed

/-! ===== GENERATED KERNEL-CHECK EPILOGUE (additive only) =====

  Generator   : scripts/generateLeanCoreChecks.ts (детерминированный; побайтовое
                совпадение при повторной генерации проверяет
                tools/leanKernelCoreChecks.test.ts)
  Source      : artifacts/proofs/ricis-seed-expansion-a11.lean
  Source hash : sha256 368dc0359e3f37391e3e830fc1abf9107b8e3f1f37d0a7f3ac6d2b3bc36839f2
  Transform   : удалена неиспользуемая строка import Mathlib.
                Заявленные подстановки: «  intro r hr
  unfold expandTo
  split
  · exact List.mem_of_mem_append_left hr
  · split <;> simp [hr]» → «  intro r hr
  unfold expandTo
  let rOpt := resolve s
  change r ∈ (match (match rOpt with
                     | none => ExpansionOutcome.rejected s "RESOLUTION_REQUIRED"
                     | some r0 =>
                         if !coreProtected r0 then
                           ExpansionOutcome.rejected s "PROTECTED_CORE_MUTATION"
                         else if !isOpen s form then
                           ExpansionOutcome.rejected s "PROBLEM_ALREADY_COVERED"
                         else if !isNew s r0 then
                           ExpansionOutcome.rejected s "DUPLICATE_AXIOM"
                         else
                           ExpansionOutcome.expanded
                             { generation := s.generation + 1
                               rules := s.rules ++ [r0]
                               ledger := s.ledger ++ [r0.id] }
                             r0.id)
                   with | ExpansionOutcome.expanded s' _ => s'.rules
                        | ExpansionOutcome.rejected s' _ => s'.rules)
  cases rOpt with
  | none =>
    simp
    exact hr
  | some r0 =>
    simp
    let b1 := coreProtected r0
    let b2 := isOpen s form
    let b3 := isNew s r0
    change r ∈ (match (if b1 = false then
                         ExpansionOutcome.rejected s "PROTECTED_CORE_MUTATION"
                       else if b2 = false then
                         ExpansionOutcome.rejected s "PROBLEM_ALREADY_COVERED"
                       else if b3 = false then
                         ExpansionOutcome.rejected s "DUPLICATE_AXIOM"
                       else
                         ExpansionOutcome.expanded
                           { generation := s.generation + 1
                             rules := s.rules ++ [r0]
                             ledger := s.ledger ++ [r0.id] }
                           r0.id)
                     with | ExpansionOutcome.expanded s' _ => s'.rules
                          | ExpansionOutcome.rejected s' _ => s'.rules)
    cases b1 with
    | true =>
      cases b2 with
      | true =>
        cases b3 with
        | true =>
          simp
          exact Or.inl hr
        | false =>
          simp
          exact hr
      | false =>
        simp
        exact hr
    | false =>
      simp
      exact hr» (Ф-08 (ремонт ядра A11). Дословные ошибки текущей производной, воспроизведённые прогоном зафиксированного ядра (2026-09-15, Lean 4.33.1, commit 819816b2e0a3bf405af45ae5c7af2491d8f5bee6 — тот же commit, что в CI; evidence: docs/05-evidence/proofs/lean-core-checks-local-run-2026-09-15.md): 104:4 «Type mismatch: List.mem_append.mpr (Or.inl hr) has type r ∈ s.rules ++ ?m.77 but is expected to have type r ∈ a✝¹.rules», 105:4 «Tactic `split` failed: Could not split an `if` or `match` expression in the goal» (диагностика показывает: ядровой `split` расщепляет ВНЕШНИЙ match по ExpansionOutcome и оставляет равенство scrutinee гипотезой `heq✝ : (match resolve s with …) = rejected a✝¹ a✝` — в цели `r ∈ a✝¹.rules` нет ни if, ни match, поэтому второй `split` невозможен; тактика исходника написана под семантику Mathlib-`split`). Новое доказательство: `let` + `change` + `cases` по `resolve s` и по трём Bool-условиям ворот (в ядре 4.33.1 `cases` по непрозрачному терму НЕ подставляет его вхождения в цель — установлено прогоном; подстановка идёт через let-константу, приведённую `change` к целевому терму). Утверждение теоремы не меняется. Прогон: exit 0, ошибок 0, sorryAx отсутствует, все 6 теорем — только propext.); «  unfold admitWithIdentity identityCoherent
  simp [h]» → «  unfold admitWithIdentity identityCoherent
  simp
  assumption» (Ф-08 (доказательства identity-ворот). Прогон ядра 4.33.1 (2026-09-15, evidence: docs/05-evidence/proofs/lean-core-checks-local-run-2026-09-15.md): `simp [h]` после `unfold` оставляет дословно цель `⊢ check inputForm outputForm = false` (лентер ядра: «This simp argument is unused: h»; ядровой simp сводит match/ite к равенству Bool-условия, не дотягивая до `rfl`). Остаток дословно совпадает с гипотезой `h` (после раскрытия `identityCoherent`) — закрыт `assumption`. Прогон: exit 0, sorryAx отсутствует, только propext.); «  unfold admitWithIdentity identityCoherent
  simp [hbad]» → «  unfold admitWithIdentity identityCoherent
  simp
  assumption» (Ф-08 (пример A14). То же, что и для identity-теорем: прогон ядра 4.33.1 (2026-09-15, evidence: docs/05-evidence/proofs/lean-core-checks-local-run-2026-09-15.md) — `simp [hbad]` оставляет дословно `⊢ check "inf_G-inf_G" "1" = false`, что совпадает с `hbad`; закрыто `assumption`. Прогон: exit 0, sorryAx отсутствует. (Лентерное предупреждение о неиспользуемом `hok` имеется и у исходника; на exit-код и sorryAx не влияет.)).
                Префикс этого файла байт-в-байт равен исходнику: ни одна
                декларация не переписана и не удалена (AGENTS.md §7).
  Basis       : Тело: модель протокола A11 (Rule/Seed/ExpansionOutcome, ворота допуска, IDENTITY_COHERENCE) на String/List/Nat/Bool. Все использованные тактики — core 4.33.1: intro, unfold, let, change, cases, simp, exact, assumption (все в src/Init/Tactics.lean; `split` src/Init/Tactics.lean:1205 в финальном доказательстве не используется). Ядровые факты, вынудившие форму доказательств, установлены прогоном ядра и зафиксированы в sourceFindings. Прогон ядра 2026-09-15: exit 0, 6/6 теорем без sorryAx, все — только propext.
  Purpose     : сделать артефакт самодостаточным, чтобы зафиксированное ядро
                Lean 4.33.1 проверило его и вывело #print axioms
                (.github/workflows/lean-artifact-kernel-check.yml).
  Boundary    : прогон проверяет только структурные теоремы этого артефакта.
                Он НЕ является доказательством эмпирических утверждений узла
                карты (Clay-задачи, AGI-метрики, экономические прогнозы).
                Ниже — инспекционные команды, они не участвуют в доказательстве.

  ============================================================================-/
#print axioms RICIS.Seed.monotonic_growth
#print axioms RICIS.Seed.rejection_preserves_generation
#print axioms RICIS.Seed.no_commit_without_proof
#print axioms RICIS.Seed.core_rule_never_commits
#print axioms RICIS.Seed.identity_violation_never_commits
#print axioms RICIS.Seed.identity_ok_preserves_expansion
