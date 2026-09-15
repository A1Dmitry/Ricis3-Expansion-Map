
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
  repeat split <;> simp_all [List.mem_append]

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
  simp [admitWithIdentity, identityCoherent, h]

/-- A candidate satisfying the identity law passes the gate unchanged (no false rejections). -/
theorem identity_ok_preserves_expansion
    (check : String → String → Bool) (inputForm outputForm : String) (seed : Seed) (axiomId : String)
    (h : identityCoherent check inputForm outputForm = true) :
    admitWithIdentity check inputForm outputForm (ExpansionOutcome.expanded seed axiomId)
      = ExpansionOutcome.expanded seed axiomId := by
  simp [admitWithIdentity, identityCoherent, h]

/-- The recorded A14 case: `inf_F - inf_F` is `X - X`, so the only admissible consequence is `0`.
    The chain A7 → ∞₀ → A2 → 1 satisfies every other gate but is rejected here. -/
example (check : String → String → Bool)
    (hok : identityCoherent check "inf_F-inf_F" "0" = true)
    (hbad : identityCoherent check "inf_G-inf_G" "1" = false) :
    admitWithIdentity check "inf_G-inf_G" "1"
      (ExpansionOutcome.expanded { generation := 2, rules := [], ledger := [] } "A17")
      = ExpansionOutcome.rejected { generation := 2, rules := [], ledger := [] } "IDENTITY_VIOLATION" := by
  simp [admitWithIdentity, identityCoherent, hbad]

end RICIS.Seed

/-! ===== GENERATED KERNEL-CHECK EPILOGUE (additive only) =====

  Generator   : scripts/generateLeanCoreChecks.ts (детерминированный; побайтовое
                совпадение при повторной генерации проверяет
                tools/leanKernelCoreChecks.test.ts)
  Source      : artifacts/proofs/ricis-seed-expansion-a11.lean
  Source hash : sha256 368dc0359e3f37391e3e830fc1abf9107b8e3f1f37d0a7f3ac6d2b3bc36839f2
  Transform   : удалена неиспользуемая строка import Mathlib.
                Заявленные подстановки: «  split
  · exact List.mem_of_mem_append_left hr
  · split <;> simp [hr]» → «  repeat split <;> simp_all [List.mem_append]» (`monotonic_growth` остаётся с sorryAx в двух фактических прогонах ядра: run 34870620154 и run 34891262489 печатают `'RICIS.Seed.monotonic_growth' depends on axioms: [sorryAx]`. Первопричины установлены дословно: (1) `List.mem_of_mem_append_left` отсутствует в ядре 4.33.1 (в src/Init/Data/List/Lemmas.lean есть только `mem_append`, `mem_append_cons_self`, `not_mem_append`); (2) применённая в 0.4.189 точечная замена на `exact List.mem_append.mpr (Or.inl hr)` не закрыла цель — после первого `split` она ещё содержит проекцию структурного поля `( { rules := s.rules ++ [r], … } : Seed).rules` и вложенную цепочку if-ов, то есть `exact` с готовым термином неприменим. Ремонт: `repeat split` раскрывает все ветви после `unfold expandTo`, `simp_all [List.mem_append]` редуцирует проекцию и использует `hr`. Тип теоремы не меняется; все использованные тактики — ядровые (Init/Tactics, Init/Data/List).); «  unfold admitWithIdentity identityCoherent
  simp [h]» → «  simp [admitWithIdentity, identityCoherent, h]» (Для `identity_violation_never_commits` и `identity_ok_preserves_expansion` прогон run 34891262489 печатает `depends on axioms: [propext, sorryAx]`. Дословная причина видна на однотипном блоке того же файла в run 34870620154: `176:105: error: unsolved goals … ⊢ check "inf_G-inf_G" "1" = false` при гипотезе `hbad : identityCoherent check "inf_G-inf_G" "1" = false` и предупреждении `178:8: This simp argument is unused: hbad`. То есть `unfold … identityCoherent` раскрывает определение только в ЦЕЛИ, гипотеза остаётся нераскрытой, и `simp [h]` не находит совпадения — отсюда и неиспользованный аргумент. Ремонт передаёт оба определения самому `simp`, чтобы цель и гипотеза были приведены к одному виду. Формулировки теорем (их типы) не изменяются.); «  unfold admitWithIdentity identityCoherent
  simp [hbad]» → «  simp [admitWithIdentity, identityCoherent, hbad]» (Зарегистрированный случай A14 (`U-INF-SELF-DIFF-WRONG-BRANCH`) — тот же дефект, что выше, и он зафиксирован тем же дословным выводом run 34870620154 (`176:105: error: unsolved goals` + `This simp argument is unused: hbad`). Замена симметрична предыдущей; предупреждение об использованном впустую аргументе обязано исчезнуть вместе с причиной, а не вместе с проверкой.).
                Префикс этого файла байт-в-байт равен исходнику: ни одна
                декларация не переписана и не удалена (AGENTS.md §7).
  Basis       : Тело: модель протокола A11 (Rule/Seed/ExpansionOutcome, ворота допуска, IDENTITY_COHERENCE) на String/List/Nat/Bool; тактики unfold / split / simp / intro — все core (`split`: src/Init/Tactics.lean:1205, `simpa`/`simp` — ядро 4.33.1).
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
