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

Lean additionally proves `no_left_inverse`: no function `G` can satisfy `Function.LeftInverse G F₃`, because the certified equal-image pair contradicts left-injectivity. The combined proposition `full_jacobian_counterexample` packages the global constant determinant and non-injective witness in one theorem.

The following point equalities also compile with exact `norm_num`:

```text
F(0, 0, -1/4) = (-1/4, 0, 0)
F(1, -3/2, 13/2) = (-1/4, 0, 0)
F(-1, 3/2, 13/2) = (-1/4, 0, 0)
```

The points are pairwise distinct, and Lean proves the resulting non-injectivity witness.

## Interpretation

This is a field-first verification: `F` is defined before the points; the Jacobian determinant is checked as a global polynomial identity; the points are then used only as consequences witnessing non-injectivity. It is therefore not a proof of the unrestricted Jacobian conjecture. Instead, if the displayed map and determinant calculation are accepted, it is a formal disproof of the unrestricted statement in dimension three. The Lean file proves the strongest direct consequence available from this explicit field: a constant global Jacobian together with non-injectivity and absence of any left inverse.

## Trusted-contract mode

For downstream development, the file declares:

```lean
axiom trusted_full_jacobian_contract : FullJacobianCounterexample
```

This is an explicit trust boundary, not a hidden proof. The theorem `trusted_contract_no_left_inverse` is derived from that axiom and Lean reports the dependency:

```text
trusted_full_jacobian_contract
```

The independently constructed theorem `full_jacobian_counterexample` remains separate. Its `#print axioms` output reports standard Lean foundations (`propext`, `Classical.choice`, and `Quot.sound`); it does not use `sorryAx`. The trusted downstream theorem additionally reports the named contract axiom, as intended.

All steps and status are recorded in this Markdown artifact and in Git history. The RICIS A6 proof from `registry-120` remains a separate structural bridge. It does not replace the field-level polynomial verification above.
