# RICIS-III Core AGI Target Boundary Note

This directory contains artifacts for the RICIS-III core AGI target patch resolution.

Included files:
- `ricis_agi_target_sp4.tex`
- `RicisAgiTarget.lean`

**Specification Lean 4 DOI:** 10.5281/zenodo.22124493

## Kernel verification status (2026-09-14)

Reproducible Lean 4.33.1 kernel runs for the self-contained artifacts are provided by the
`Lean Artifact Kernel Check` workflow (`.github/workflows/lean-artifact-kernel-check.yml`);
evidence (toolchain, sha256, compiler output, `#print axioms`) is recorded in
[`docs/05-evidence/proofs/lean-kernel-run-2026-09-14.md`](../../docs/05-evidence/proofs/lean-kernel-run-2026-09-14.md).

| Artifact | Status | Classification / Boundary |
| :--- | :--- | :--- |
| `database-a6-minimal-core-check.lean` | `LEAN_VERIFIED` | Kernel-verified specification (exit 0, no `sorryAx`, `#print axioms`: "does not depend on any axioms") |
| `ricis-jacobian-conjecture.standalone.lean` / `database-registry-120-jacobian.*` | `STRUCTURALLY_VALIDATED` | Structural model verification (not an arbitrary classical theorem proof) |
| 14 files with `import Mathlib` | `REQUIRES_CORE_LEAN` | No pinned prebuilt Mathlib fits a standard runner; status not promoted |
| `*.generated.lean` (2 files) | Fragments | Fragments of the matching `.standalone.lean` files; not standalone artifacts |

Per AGENTS.md §7, artifact sources are immutable; status metadata is recorded here and in
the evidence document, never by rewriting the sources.
