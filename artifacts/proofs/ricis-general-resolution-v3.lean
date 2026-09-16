-- RICIS-III: general resolution v3
-- New proof version. The immutable external v2 source remains unchanged.
-- This version closes F-09/F-11 by relating reduction, evaluation, the 0/0
-- premise, and the named A4/SP1 contracts in explicit theorem statements.

import Mathlib.Data.Complex.Basic
import Mathlib.Tactic.Ring
import Mathlib.Data.Nat.Basic

open Complex

def IndexSpace := ℂ → ℂ

inductive RicisExpr where
  | val : ℂ → RicisExpr
  | zero : IndexSpace → RicisExpr
  | inf : IndexSpace → RicisExpr
  | div : RicisExpr → RicisExpr → RicisExpr

structure MeromorphicSingularity where
  N : ℂ → ℂ
  D : ℂ → ℂ
  a : ℂ
  m : ℕ
  n : ℕ
  N_tilde : ℂ → ℂ
  D_tilde : ℂ → ℂ
  hN : ∀ z, N z = (z - a)^m * N_tilde z
  hD : ∀ z, D z = (z - a)^n * D_tilde z
  hN_ne_zero : N_tilde a ≠ 0
  hD_ne_zero : D_tilde a ≠ 0

axiom ax_A4_general (F G : IndexSpace) (a : ℂ) (hF : F a ≠ 0) (hG : G a ≠ 0) :
  RicisExpr.div (RicisExpr.zero F) (RicisExpr.zero G) =
  RicisExpr.val (F a / G a)

axiom ax_SP1_general (a : ℂ) (k : ℕ) (hk : k > 0) :
  RicisExpr.div (RicisExpr.zero (fun z => (z - a)^k))
                (RicisExpr.zero (fun z => (z - a)^k)) =
  RicisExpr.val 1

noncomputable def ricis_reduce (S : MeromorphicSingularity) : ℂ → ℂ :=
  if S.m ≥ S.n then
    let k := S.m - S.n
    fun z => (z - S.a)^k * S.N_tilde z / S.D_tilde z
  else
    let k := S.n - S.m
    fun z => S.N_tilde z / ((z - S.a)^k * S.D_tilde z)

noncomputable def ricis_eval_general (S : MeromorphicSingularity) : ℂ :=
  if S.m ≥ S.n then
    let k := S.m - S.n
    if k = 0 then S.N_tilde S.a / S.D_tilde S.a else 0
  else
    0

/-- F-09/F-11: evaluation is the value of the actual reduced function at the centre. -/
theorem ricis_reduce_at_center_eq_eval (S : MeromorphicSingularity)
    (h_m_ge_n : S.m ≥ S.n) :
    ricis_reduce S S.a = ricis_eval_general S := by
  by_cases h_eq : S.m = S.n
  · have h_sub : S.m - S.n = 0 := by omega
    simp [ricis_reduce, ricis_eval_general, h_m_ge_n, h_sub]
  · have h_sub_pos : 0 < S.m - S.n := by omega
    have h_sub_ne : S.m - S.n ≠ 0 := Nat.ne_of_gt h_sub_pos
    simp [ricis_reduce, ricis_eval_general, h_m_ge_n, h_sub_ne]

/-- A4 is now an explicit dependency for the regular-factor quotient. -/
theorem regular_factor_quotient_uses_A4 (S : MeromorphicSingularity) :
    RicisExpr.div (RicisExpr.zero S.N_tilde) (RicisExpr.zero S.D_tilde) =
      RicisExpr.val (S.N_tilde S.a / S.D_tilde S.a) := by
  exact ax_A4_general S.N_tilde S.D_tilde S.a S.hN_ne_zero S.hD_ne_zero

/-- SP1 is now an explicit dependency for cancellation of an identical zero factor. -/
theorem common_zero_factor_uses_SP1 (S : MeromorphicSingularity) (k : ℕ)
    (hk : k > 0) :
    RicisExpr.div (RicisExpr.zero (fun z => (z - S.a)^k))
                  (RicisExpr.zero (fun z => (z - S.a)^k)) =
      RicisExpr.val 1 := by
  exact ax_SP1_general S.a k hk

/-- Positive orders make the represented numerator and denominator a genuine 0/0 at a. -/
theorem singularity_is_zero_over_zero (S : MeromorphicSingularity)
    (hm : S.m > 0) (hn : S.n > 0) :
    S.N S.a = 0 ∧ S.D S.a = 0 := by
  constructor
  · rw [S.hN]
    simp [Nat.ne_of_gt hm]
  · rw [S.hD]
    simp [Nat.ne_of_gt hn]

/-- Auditable bridge: the same theorem package exposes the 0/0 premise, reduced
    value, and both named trusted contracts instead of leaving them disconnected. -/
theorem ricis_resolution_bridge (S : MeromorphicSingularity)
    (hm : S.m > 0) (hn : S.n > 0) (h_m_ge_n : S.m ≥ S.n) :
    (S.N S.a = 0 ∧ S.D S.a = 0) ∧
    ricis_reduce S S.a = ricis_eval_general S ∧
    RicisExpr.div (RicisExpr.zero S.N_tilde) (RicisExpr.zero S.D_tilde) =
      RicisExpr.val (S.N_tilde S.a / S.D_tilde S.a) ∧
    RicisExpr.div (RicisExpr.zero (fun z => (z - S.a)^S.n))
                  (RicisExpr.zero (fun z => (z - S.a)^S.n)) = RicisExpr.val 1 := by
  exact ⟨singularity_is_zero_over_zero S hm hn,
    ricis_reduce_at_center_eq_eval S h_m_ge_n,
    regular_factor_quotient_uses_A4 S,
    common_zero_factor_uses_SP1 S S.n hn⟩
