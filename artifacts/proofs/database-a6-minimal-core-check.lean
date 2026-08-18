/-!
  Minimal Lean Core validation for the RICIS A6 typed bridge.

  This file intentionally uses no Mathlib. It validates only the normative
  structural rewrite, not arithmetic evaluation of payload atoms.
-/
namespace RICIS3.MinimalA6Check

abbrev Key := Nat

inductive Ty where
  | scalar
  deriving DecidableEq, Repr

inductive RExpr (τ : Ty) where
  | atom (id : Nat) : RExpr τ
  | mul (a b : RExpr τ) : RExpr τ
  | zero (payload : RExpr τ) (keys : List Key) : RExpr τ
  | inf (payload : RExpr τ) (keys : List Key) : RExpr τ
  deriving DecidableEq, Repr

inductive Phase where
  | a5a6a7
  deriving DecidableEq, Repr

inductive Rewrite {τ : Ty} : RExpr τ → RExpr τ → Phase → Prop where
  | a6 (f g : RExpr τ) (ksF ksG : List Key) :
      Rewrite (.mul (.zero f ksF) (.inf g ksG)) (.mul f g) .a5a6a7

inductive Derivation {τ : Ty} : RExpr τ → RExpr τ → Prop where
  | single {src dst : RExpr τ} {phase : Phase} : Rewrite src dst phase → Derivation src dst

namespace Regression

open RExpr

def five : RExpr .scalar := .atom 5
def three : RExpr .scalar := .atom 3
def fiveKeys : List Key := [5]
def threeKeys : List Key := [3]

/-- Exact typed A6 bridge for the database claim `0_5 * inf_3`. -/
theorem database_a6_bridge :
    Derivation
      (.mul (.zero five fiveKeys) (.inf three threeKeys))
      (.mul five three) := by
  exact Derivation.single (Rewrite.a6 five three fiveKeys threeKeys)

#print axioms database_a6_bridge

end Regression
end RICIS3.MinimalA6Check
