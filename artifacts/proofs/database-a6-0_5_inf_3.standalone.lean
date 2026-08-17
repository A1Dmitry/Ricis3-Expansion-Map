import Mathlib

namespace RICIS3.ExtendedKernel

/-! A typed RICIS contract kernel.

    `RExpr` is the validated symbolic bridge for an Expression<Func<…>> graph.
    `Rewrite` is intentionally a proof relation: RICIS axioms are normative
    contracts, not theorems derivable from classical field arithmetic.
-/

abbrev Key := Nat

inductive Ty where
  | scalar
  | vector
  | matrix
  deriving DecidableEq, Repr

inductive RExpr (τ : Ty) where
  | atom (id : Nat) : RExpr τ
  | constZero : RExpr τ
  | one : RExpr τ
  | add (a b : RExpr τ) : RExpr τ
  | mul (a b : RExpr τ) : RExpr τ
  | sub (a b : RExpr τ) : RExpr τ
  | div (a b : RExpr τ) : RExpr τ
  | zero (payload : RExpr τ) (keys : List Key) : RExpr τ
  | inf (payload : RExpr τ) (keys : List Key) : RExpr τ
  deriving DecidableEq, Repr

namespace RExpr

variable {τ : Ty}

inductive Phase where
  | l0 | l1 | sp2 | o1 | a1a4 | sp3 | sp4 | a5a6a7 | fallback
  deriving DecidableEq, Repr

/- Structural RICIS rewrite contracts. Indexed payloads are recursive RExprs,
   never strings or evaluated numeric values. -/
inductive Rewrite : RExpr τ → RExpr τ → Phase → Prop where
  | l0_zero_payload (f : RExpr τ) (ks : List Key) :
      Rewrite (.zero f ks) (.zero f ks) .l0
  | l0_inf_payload (f : RExpr τ) (ks : List Key) :
      Rewrite (.inf f ks) (.inf f ks) .l0
  | l1 (f : RExpr τ) :
      Rewrite (.div f f) .one .l1
  | sp2_right (f g : RExpr τ) :
      Rewrite (.div (.mul f g) f) g .sp2
  | sp2_left (f g : RExpr τ) :
      Rewrite (.div (.mul f g) g) f .sp2
  | o1_mul_zero (f : RExpr τ) :
      Rewrite (.mul f .constZero) (.zero f []) .o1
  | o1_div_zero (f : RExpr τ) :
      Rewrite (.div f .constZero) (.inf f []) .o1
  | coupled_reciprocal (f : RExpr τ) :
      Rewrite (.mul (.mul f .constZero) (.div .one f)) (.mul f f) .o1
  | a1 (f : RExpr τ) (ks : List Key) :
      Rewrite (.div f .constZero) (.inf f ks) .a1a4
  | a4 (f g : RExpr τ) (ks : List Key) :
      Rewrite (.div (.zero f ks) (.zero g ks)) (.div f g) .a1a4
  | a4_identity (f : RExpr τ) (ks : List Key) :
      Rewrite (.div (.zero f ks) (.zero f ks)) .one .a1a4
  | sp4_source_index (f : RExpr τ) (ks : List Key) :
      Rewrite (.inf f ks) (.inf f ks) .sp4
  | a5 (f g : RExpr τ) (ks : List Key) :
      Rewrite (.div (.inf f ks) (.inf g ks)) (.div f g) .a5a6a7
  | a5_identity (f : RExpr τ) (ks : List Key) :
      Rewrite (.div (.inf f ks) (.inf f ks)) .one .a5a6a7
  | a6 (f g : RExpr τ) (ksF ksG : List Key) :
      Rewrite (.mul (.zero f ksF) (.inf g ksG)) (.mul f g) .a5a6a7
  | a6_comm (f g : RExpr τ) (ksF ksG : List Key) :
      Rewrite (.mul (.inf f ksF) (.zero g ksG)) (.mul f g) .a5a6a7
  | z_add_zero (f : RExpr τ) (ks : List Key) :
      Rewrite (.add (.zero f ks) f) f .a5a6a7
  | z_sub_zero (f : RExpr τ) (ks : List Key) :
      Rewrite (.sub f (.zero f ks)) f .a5a6a7
  | a7_add (f g : RExpr τ) (ks : List Key) :
      Rewrite (.add (.inf f ks) (.inf g ks)) (.inf (.add f g) ks) .a5a6a7
  | a7_sub_same (f : RExpr τ) (ks : List Key) :
      Rewrite (.sub (.inf f ks) (.inf f ks)) .one .a5a6a7

/- Sequential composition of proof steps. -/
inductive Derivation : RExpr τ → RExpr τ → Prop where
  | refl (e : RExpr τ) : Derivation e e
  | single {e₁ e₂ : RExpr τ} {p : Phase} : Rewrite e₁ e₂ p → Derivation e₁ e₂
  | trans {e₁ e₂ e₃ : RExpr τ} : Derivation e₁ e₂ → Derivation e₂ e₃ → Derivation e₁ e₃

/- SP3 validation is an invariant, not a rewrite: the payload type and keys are
   checked while the indexed node itself remains unchanged. -/
def FiniteKeys (ks : List Key) : Prop := ∀ k ∈ ks, k < 1000000000

def ValidIndexed : RExpr τ → Prop
  | .zero f ks | .inf f ks => FiniteKeys ks ∧ f = f
  | _ => True

theorem sp3_zero_valid (f : RExpr τ) (ks : List Key) (hks : FiniteKeys ks) :
    ValidIndexed (.zero f ks) := by
  exact ⟨hks, rfl⟩

theorem sp3_inf_valid (f : RExpr τ) (ks : List Key) (hks : FiniteKeys ks) :
    ValidIndexed (.inf f ks) := by
  exact ⟨hks, rfl⟩

theorem l0_payload_preserved (f : RExpr τ) (ks : List Key) :
    Rewrite (.zero f ks) (.zero f ks) .l0 :=
  Rewrite.l0_zero_payload f ks

theorem l1_identity (f : RExpr τ) :
    Rewrite (.div f f) .one .l1 :=
  Rewrite.l1 f

theorem sp2_common_right (f g : RExpr τ) :
    Rewrite (.div (.mul f g) f) g .sp2 :=
  Rewrite.sp2_right f g

theorem sp2_common_left (f g : RExpr τ) :
    Rewrite (.div (.mul f g) g) f .sp2 :=
  Rewrite.sp2_left f g

theorem o1_bridge_mul_zero (f : RExpr τ) :
    Rewrite (.mul f .constZero) (.zero f []) .o1 :=
  Rewrite.o1_mul_zero f

theorem o1_bridge_div_zero (f : RExpr τ) :
    Rewrite (.div f .constZero) (.inf f []) .o1 :=
  Rewrite.o1_div_zero f

theorem a1_indexed_infinity (f : RExpr τ) (ks : List Key) :
    Rewrite (.div f .constZero) (.inf f ks) .a1a4 :=
  Rewrite.a1 f ks

theorem a4_distinct_payload (f g : RExpr τ) (ks : List Key) :
    Rewrite (.div (.zero f ks) (.zero g ks)) (.div f g) .a1a4 :=
  Rewrite.a4 f g ks

theorem a4_same_identity (f : RExpr τ) (ks : List Key) :
    Rewrite (.div (.zero f ks) (.zero f ks)) .one .a1a4 :=
  Rewrite.a4_identity f ks

theorem sp4_retains_source (f : RExpr τ) (ks : List Key) :
    Rewrite (.inf f ks) (.inf f ks) .sp4 :=
  Rewrite.sp4_source_index f ks

theorem a5_distinct_payload (f g : RExpr τ) (ks : List Key) :
    Rewrite (.div (.inf f ks) (.inf g ks)) (.div f g) .a5a6a7 :=
  Rewrite.a5 f g ks

theorem a6_geometric_bridge (f g : RExpr τ) (ksF ksG : List Key) :
    Rewrite (.mul (.zero f ksF) (.inf g ksG)) (.mul f g) .a5a6a7 :=
  Rewrite.a6 f g ksF ksG

theorem a6_coupled_reciprocal (f : RExpr τ) :
    Derivation (.mul (.mul f .constZero) (.div .one f)) (.mul f f) :=
  Derivation.single (Rewrite.coupled_reciprocal f)

/- A fallback is legal only with an explicit proof that no covered RICIS rule
   applies. This prevents an LLM-generated classical theorem from shadowing RICIS. -/
def Covered : RExpr τ → Prop
  | .zero _ _ | .inf _ _ => True
  | .add a b | .mul a b | .sub a b | .div a b => Covered a ∨ Covered b
  | .atom _ | .constZero | .one => False

structure FallbackEligible (e : RExpr τ) : Prop where
  noRicisRule : ¬ Covered e

def classicalFallback (e : RExpr τ) (_ : FallbackEligible e) : RExpr τ := e

theorem fallback_requires_gate (e : RExpr τ) (h : FallbackEligible e) :
    classicalFallback e h = e := rfl

theorem priority_blocks_fallback (e : RExpr τ) (h : Covered e) :
    ¬ FallbackEligible e := by
  intro hf
  exact hf.noRicisRule h

/- Concrete regression examples. -/
example (f g : RExpr .scalar) :
    Derivation (.mul (.mul f .constZero) (.div .one f)) (.mul f f) :=
  a6_coupled_reciprocal f

example (f g : RExpr .scalar) (ks : List Key) :
    Rewrite (.div (.zero f ks) (.zero g ks)) (.div f g) .a1a4 :=
  a4_distinct_payload f g ks

end RExpr
end RICIS3.ExtendedKernel
namespace RICIS3.GeneratedDatabaseProof

open RICIS3.ExtendedKernel
open RICIS3.ExtendedKernel.RExpr

/- Generated by Ricis3-Expansion-Map:
   claim: 0_5 * inf_3
   method: geometric_bridge
   generated snippet:
     theorem geometric_bridge_5_3 : ricis_prod (zero_monad "5") (inf_monad "3") = 15 := by
       apply ricis_det_bridge
       rfl

   The generated names above belong to the Expansion renderer. This adapter
   checks the same claim against the typed RICIS Extended Kernel, where the
   result is the structural product of the payload expressions. -/

def five : RExpr .scalar := .atom 5
def three : RExpr .scalar := .atom 3

def fiveKeys : List Key := [5]
def threeKeys : List Key := [3]

theorem generated_claim_is_a6_bridge :
    Derivation
      (.mul (.zero five fiveKeys) (.inf three threeKeys))
      (.mul five three) := by
  exact Derivation.single (Rewrite.a6 five three fiveKeys threeKeys)

theorem generated_claim_indices_are_finite :
    ValidIndexed (.zero five fiveKeys) ∧ ValidIndexed (.inf three threeKeys) := by
  constructor
  · exact sp3_zero_valid five fiveKeys (by
      intro k hk
      have : k = 5 := by simpa [fiveKeys] using hk
      simpa [this])
  · exact sp3_inf_valid three threeKeys (by
      intro k hk
      have : k = 3 := by simpa [threeKeys] using hk
      simpa [this])

#print axioms generated_claim_is_a6_bridge
#print axioms generated_claim_indices_are_finite

end RICIS3.GeneratedDatabaseProof
