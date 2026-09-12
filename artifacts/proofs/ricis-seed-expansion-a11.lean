import Mathlib

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
  monotonicity (R_k ⊆ R_(k+1)), rejection preserves the generation, and an
  unproved candidate never commits.
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
  split
  · exact List.mem_of_mem_append_left hr
  · split <;> simp [hr]

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

end RICIS.Seed
