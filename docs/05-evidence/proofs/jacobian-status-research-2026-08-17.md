# Status check: Jacobian Conjecture and registry-120

The database record `registry-120` in `RICIS3.core.typescript/src/model/initialMap.ts` contains only two proof steps: `L1_IDENTITY` and RICIS A6, with the expression `0_F * infinity_G = F * G`. This is sufficient to check the local RICIS structural bridge, but it does not state the full polynomial-map Jacobian conjecture.

The standard full statement is: for a polynomial map `F : C^n -> C^n`, if the Jacobian determinant is a nonzero constant, then `F` has a polynomial inverse.

Current external sources retrieved on 2026-08-17 report that the statement is false in dimensions `n >= 3`, with an explicit three-dimensional counterexample, while the planar case `n = 2` remains open. See Tao's 2026-07-21 exposition, arXiv:2608.00222 submitted 2026-07-31, and MathWorld updated 2026-08-16.

Therefore a mathematically valid full result cannot be a proof of the unrestricted conjecture. The valid alternatives are:

1. prove the local RICIS A6 bridge from the database;
2. formalize a restricted theorem with explicit hypotheses (for example, a selected polynomial family or dimension one);
3. formalize the explicit three-dimensional counterexample and prove the negation of the unrestricted conjecture.

References:

- https://terrytao.wordpress.com/2026/07/21/a-digestion-of-the-jacobian-conjecture-counterexample/
- https://arxiv.org/abs/2608.00222
- https://mathworld.wolfram.com/JacobianConjecture.html

## Authorial RICIS III priority note — C-04

**2026-08-26 — authorial interpretation/supersession.** The preceding field-level polynomial-map wording, alternatives, dates and external URLs are retained as dated external research context. That dated external context does not demote, override, suspend or replace the author-established RICIS III ontology or author-authorized result; in particular, it does not modify the RICIS III monolith, L0/L1, SP1–SP4, typed A6 structural bridge, or authorial solution status.

A classical or external comparison can remain informative in its own stated scope, but it is non-normative relative to the owner-established RICIS III ontology and results. This note introduces no theorem rewrite, no calculator/Core action, no Lean evidence or status transition. No Lean/lake/elan execution is introduced by this historical documentation correction.
