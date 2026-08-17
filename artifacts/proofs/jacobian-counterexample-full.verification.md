# Full field-level verification of the Jacobian counterexample

## Scope

This artifact verifies the function first, rather than interpolating a line through sample points. The source record is the explicit Jacobian-counterexample construction referenced by the `registry-120` task.

The map is `F = (P,Q,R) : Q^3 -> Q^3`, where:

```text
P(x,y,z) = (1+xy)^3 z + y^2 (1+xy)(4+3xy)
Q(x,y,z) = y + 3x(1+xy)^2 z + 3xy^2(4+3xy)
R(x,y,z) = 2x - 3x^2 y - x^3 z
```

The Lean file uses exact rational arithmetic. The nine Jacobian entries are written explicitly, named formal polynomial partials are defined for `P`, `Q`, and `R`, and Lean proves that every matrix entry matches its corresponding formal partial. The determinant is then expanded as a polynomial identity over `Q`.

## Independent checks

The companion SymPy check `verify_jacobian_entries.py` verified all nine manually written entries against the actual symbolic partial derivatives and verified the determinant:

```text
all_entries_match_derivatives=True
determinant=-2
```

## Lean checks

The theorem

```lean
jacobian_entries_match_formal_partials (x y z : ℚ)
```

compiles by exact simplification of the named formal partials. The theorem

```lean
jacobian_det_is_constant (x y z : ℚ) : jacDet x y z = -2
```

then compiles with `ring`, proving the identity for arbitrary rational `x`, `y`, and `z`, not only at sampled points.

The following point equalities also compile with exact `norm_num`:

```text
F(0, 0, -1/4) = (-1/4, 0, 0)
F(1, -3/2, 13/2) = (-1/4, 0, 0)
F(-1, 3/2, 13/2) = (-1/4, 0, 0)
```

The points are pairwise distinct, and Lean proves the resulting non-injectivity witness.

## Interpretation

This is a field-first verification: `F` is defined before the points; the Jacobian determinant is checked as a global polynomial identity; the points are then used only as consequences witnessing non-injectivity. It is therefore not a proof of the unrestricted Jacobian conjecture. Instead, if the displayed map and determinant calculation are accepted, it is a formal disproof of the unrestricted statement in dimension three.

The RICIS A6 proof from `registry-120` remains a separate structural bridge. It does not replace the field-level polynomial verification above.
