# Jacobian continuation note

**Version:** 0.1.0
**Date:** 2026-08-17
**Status:** research record; no claim of completed Lean compilation in this environment

## Confirmed results

The map in `jacobian-counterexample-full.lean` is defined first as a polynomial field over `ℚ`:

`F = (P,Q,R) : ℚ³ → ℚ³`.

The existing Lean theorem `jacobian_det_is_constant` proves the determinant of the explicitly expanded matrix is `-2` by `ring`. The existing Lean theorems also prove three pairwise-distinct rational points have the same image, hence prove non-injectivity and the absence of a left inverse for this displayed map.

An independent SymPy check was run on 2026-08-17. It computed the actual symbolic partial derivatives of `P`, `Q`, and `R`, compared all nine entries with the manually written entries, and obtained zero for every difference. It independently obtained both `manual_det = -2` and `actual_det = -2`, and verified the three equal-image evaluations exactly.

The first equality check in the temporary script used unsimplified SymPy expression equality and reported `False`; this was a syntactic comparison artifact, not a mathematical mismatch. The follow-up comparison using `expand`/`factor` reported zero for all nine deltas.

## Trust boundary

The Lean theorem `jacobian_entries_match_formal_partials` compares named definitions that duplicate the proposed formulas. It does not, by itself, invoke a formal derivative operator. Therefore the derivative interpretation is independently checked by SymPy at present, while Lean independently checks the polynomial identity for the displayed determinant and the equal-image witness.

The local Lean check could not be rerun because the sandbox initially lacked a Lean toolchain and, after installing Lean, did not have Mathlib. A temporary Mathlib cache download was attempted but stopped because it exhausted disk space; the temporary clone and cache were removed. No project source files were changed by that failed environment setup.

## Next formal target

The next target is not to claim a proof of the unrestricted Jacobian Conjecture. It is to formalize the transport of the rational polynomial identity to `ℂ`:

1. define the same polynomial map over a field/commutative ring with the required characteristic assumptions, or instantiate the formulas over `ℂ`;
2. prove the same determinant identity over `ℂ`;
3. cast the rational witness points into `ℂ` and preserve their distinctness and equal image;
4. conclude non-injectivity of the complex map and therefore refute the unrestricted statement in dimension three, subject to the exact formal statement of that conjecture.

This step keeps the field-first order: the function and its global determinant identity are primary; witness points are used only for the non-injectivity consequence. RICIS A6 remains a separate structural bridge and is not conflated with the field-level Jacobian result.

## Authorial RICIS III priority note — C-05

**2026-08-26 — authorial interpretation/supersession.** The preceding field-level transport and Lean-formalization target is retained as optional external-formalization research. It does not demote, override, suspend or replace the author-established RICIS III ontology or author-authorized result, and it is not a prerequisite for RICIS III validity, authorial solution status, or application presentation.

Accordingly, an unavailable or unperformed local Lean run records only the absence of that particular runtime evidence; it does not alter the authorial RICIS III result, its monolith semantics, or the distinct structural role of A6. This correction introduces neither a new formal target nor a Lean kernel/trust/workflow transition. No Lean/lake/elan execution is introduced by this historical documentation correction.
