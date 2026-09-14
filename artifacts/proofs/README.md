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

| Artifact | Status |
| :--- | :--- |
| `database-a6-minimal-core-check.lean` | `LEAN_VERIFIED` — Lean 4.33.1 run 34851801990: exit 0, no `sorryAx`, `#print axioms`: "does not depend on any axioms" |
| 14 files with `import Mathlib` | `REQUIRES_CORE_LEAN` — no pinned prebuilt Mathlib fits a standard runner; status not promoted |
| `*.generated.lean` (2 files) | fragments of the matching `.standalone.lean` files; not standalone artifacts |

Per AGENTS.md §7, artifact sources are immutable; status metadata is recorded here and in
the evidence document, never by rewriting the sources.
