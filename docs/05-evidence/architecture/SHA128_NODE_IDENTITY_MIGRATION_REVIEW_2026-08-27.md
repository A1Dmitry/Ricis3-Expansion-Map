# SHA-128 Node Identity Migration — Technical Review

**Review date:** 2026-08-27  
**PR:** [#7](https://github.com/A1Dmitry/Ricis3-Expansion-Map/pull/7)  
**Head:** `2ae4923efac9306ca65d266d55c0542434fe6adc`

## Review status

PR #7 is open, non-draft, mergeable and clean. Its remote Pull Request Verification check is successful. The local branch has no uncommitted changes after commit `2ae4923`.

## Verified implementation boundaries

The migration uses one legacy-to-new mapping table and rewrites node IDs, dependency references, dependent references, edge endpoints, zone membership, axiom references, proof record keys, proof node IDs and optional agent-log node IDs. The migration returns a new map projection and does not mutate the source map before path, digest and graph-invariant checks complete. The explicit verifier now blocks the migration result when counts, endpoints, reciprocal relationships, zones, axioms, proofs, logs or semantic fields diverge.

The persistence boundary invokes migration on hydration and JSON import. Legacy aliases are retained in `nodeIdAliases`, and the deep-link resolver checks that alias map before looking up the internal hexadecimal ID. The UI renders Base64 only as presentation and retains internal hex IDs for application navigation.

## QA evidence

The remote CI result is successful. The local full gate passed strict TypeScript, 142 Vitest files, 1,255 tests, production build and `git diff --check`. The complete seed dry-run preserved 178 nodes and 172 edges, produced 178 aliases, found zero dangling edge endpoints and was idempotent on a second pass.

## Deferred hardening

The current release preserves cycles with a deterministic fallback path and keeps all cycle edges. The hardening increment adds an explicit graph-integrity verifier and regression coverage for reciprocal relationship loss before any path-policy expansion. It does not change the accepted identity algorithm or delete/collapse cyclic edges.

## Decision

PR #7 is technically ready for merge. The hardening increment is implemented on a separate branch as `P1-SHA128-GRAPH-INVARIANT-HARDENING`: explicit reciprocal-reference verification, complete axiom/proof/log assertions, and deterministic multi-parent/cycle path fixtures.
