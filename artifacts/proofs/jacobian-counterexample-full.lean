import Mathlib

namespace JacobianCounterexample

abbrev K := ℚ

/-- The explicit polynomial map reported in the 2026 Jacobian-counterexample record. -/
def P (x y z : K) : K :=
  (1 + x * y)^3 * z + y^2 * (1 + x * y) * (4 + 3 * x * y)

def Q (x y z : K) : K :=
  y + 3 * x * (1 + x * y)^2 * z + 3 * x * y^2 * (4 + 3 * x * y)

def R (x y z : K) : K :=
  2 * x - 3 * x^2 * y - x^3 * z

/-- Coordinate functions of F. -/
def F (x y z : K) : K × K × K := (P x y z, Q x y z, R x y z)

/-- Entries of the formal Jacobian matrix of the displayed polynomial map. -/
def p₁ (x y z : K) : K := 3 * y * (1 + x * y)^2 * z + y^3 * (7 + 6 * x * y)
def p₂ (x y z : K) : K :=
  3 * x * (1 + x * y)^2 * z + 2 * y * (1 + x * y) * (4 + 3 * x * y) + x * y^2 * (7 + 6 * x * y)
def p₃ (x y z : K) : K := (1 + x * y)^3

def q₁ (x y z : K) : K :=
  3 * (1 + x * y)^2 * z + 6 * x * y * (1 + x * y) * z + 12 * y^2 + 18 * x * y^3
def q₂ (x y z : K) : K :=
  1 + 6 * x^2 * (1 + x * y) * z + 24 * x * y + 27 * x^2 * y^2
def q₃ (x y z : K) : K := 3 * x * (1 + x * y)^2

def r₁ (x y z : K) : K := 2 - 6 * x * y - 3 * x^2 * z
def r₂ (x y z : K) : K := -3 * x^2
def r₃ (x y z : K) : K := -x^3

/-- The determinant of the displayed Jacobian field, expanded by the first row. -/
def jacDet (x y z : K) : K :=
  p₁ x y z * (q₂ x y z * r₃ x y z - q₃ x y z * r₂ x y z)
    - p₂ x y z * (q₁ x y z * r₃ x y z - q₃ x y z * r₁ x y z)
    + p₃ x y z * (q₁ x y z * r₂ x y z - q₂ x y z * r₁ x y z)

/-- Global polynomial identity: the determinant field is the constant -2. -/
theorem jacobian_det_is_constant (x y z : K) : jacDet x y z = -2 := by
  dsimp [jacDet, p₁, p₂, p₃, q₁, q₂, q₃, r₁, r₂, r₃]
  ring

private def a : K × K × K := (0, 0, -1 / 4)
private def b : K × K × K := (1, -3 / 2, 13 / 2)
private def c : K × K × K := (-1, 3 / 2, 13 / 2)

 theorem point_a_maps_to : F a.1 a.2.1 a.2.2 = (-1 / 4, 0, 0) := by
  norm_num [F, P, Q, R, a]

theorem point_b_maps_to : F b.1 b.2.1 b.2.2 = (-1 / 4, 0, 0) := by
  norm_num [F, P, Q, R, b]

theorem point_c_maps_to : F c.1 c.2.1 c.2.2 = (-1 / 4, 0, 0) := by
  norm_num [F, P, Q, R, c]

theorem points_are_distinct : a ≠ b ∧ a ≠ c ∧ b ≠ c := by
  norm_num [a, b, c]

/-- The polynomial field is locally unramified everywhere but not injective. -/
theorem field_is_noninjective : ∃ u v : K × K × K, u ≠ v ∧ F u.1 u.2.1 u.2.2 = F v.1 v.2.1 v.2.2 := by
  refine ⟨a, b, ?_, ?_⟩
  · exact points_are_distinct.1
  · rw [point_a_maps_to, point_b_maps_to]

end JacobianCounterexample
