# Lean verification: database A6 proof `0_5 * inf_3`

## Source record

The proof was generated from the Expansion `RicisFallbackEngine` using:

```text
claim: 0_5 * inf_3
method: geometric_bridge
conclusionInvariant: 15
```

The generator emitted the renderer snippet in `database-a6-0_5_inf_3.generated.lean` and recorded the full proof object in `database-a6-0_5_inf_3.json`.

## Kernel verification

`database-a6-0_5_inf_3.standalone.lean` contains the existing `RICIS_Extended_Axiom_Proof.lean` followed by an adapter for the generated claim. It checks:

```lean
theorem generated_claim_is_a6_bridge :
    Derivation
      (.mul (.zero five fiveKeys) (.inf three threeKeys))
      (.mul five three) := by
  exact Derivation.single (Rewrite.a6 five three fiveKeys threeKeys)
```

It also checks that the source indices `[5]` and `[3]` satisfy the kernel's finite-index invariant.

## Reproduction

From the Lean audit directory:

```bash
lake env lean Generated_A6_Proof_0_5_inf_3_standalone.lean
```

The result is successful. The Lean output reports:

```text
'RICIS3.GeneratedDatabaseProof.generated_claim_is_a6_bridge' does not depend on any axioms
'RICIS3.GeneratedDatabaseProof.generated_claim_indices_are_finite' depends on axioms: [propext]
```

The first theorem is the A6 bridge itself and is axiom-free in the reported environment. The finite-index proposition uses Lean's standard `propext`; it does not use `sorryAx`.

## Important distinction

The renderer snippet uses Expansion-level names `ricis_prod`, `zero_monad`, `inf_monad`, and `ricis_det_bridge`. Those names are not definitions in the current Extended Kernel, so the snippet is preserved as generated output but is not claimed to compile by itself. The standalone adapter maps the same generated claim to the actual typed kernel rule `Rewrite.a6` and is the file that was compiled.
