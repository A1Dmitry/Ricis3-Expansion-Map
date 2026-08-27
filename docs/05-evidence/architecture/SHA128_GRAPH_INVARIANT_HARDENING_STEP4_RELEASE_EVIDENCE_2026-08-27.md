# SHA-128 Graph Invariant Hardening — Step 4 Release Evidence

**Date:** 2026-08-27  
**Base:** PR #7 commit `2ae4923`  
**Branch:** `p1/sha128-graph-invariant-hardening`  
**Status:** `QA PASS — ready for review`

## Increment

This increment adds an explicit post-rewrite graph verifier to the SHA-128 migration boundary. The migration now refuses to return a result when counts, migrated endpoints, reciprocal dependency/dependent relationships, zone memberships, axiom references, proof references, agent-log references or non-reference semantic fields diverge.

The identity algorithm, canonical path rules, Base64 presentation contract and cycle preservation behavior are unchanged. No graph edge is deleted or collapsed.

## Focused evidence

The migration suite contains six passing tests. It verifies normalization, the SHA-256 truncated-128 digest format, complete field rewriting, invariant success on a valid fixture, invariant failure on deliberate reciprocal-reference loss, cycle preservation, idempotence and collision rejection. The presentation and deep-link suites also remain green.

| Gate | Result |
|---|---|
| Strict TypeScript | PASS |
| Focused migration/presentation/deep-link tests | 23/23 PASS |
| Full Vitest regression | 142 test files / 1,256 tests PASS |
| Production build | PASS |
| `git diff --check` | PASS |
| Source graph dry-run | 178 nodes / 172 edges preserved |
| Dangling edge endpoints | 0 |
| Second migration idempotence | PASS |

## Safety boundary

The verifier is executed after the immutable projection is built and before the migration result is returned to persistence. A failed verifier raises a typed `graph_invariant_violation` and prevents hydration/import from receiving a broken graph. The source map is not mutated by the verifier.

The verifier does not evaluate or promote proof authority. It compares semantic fields and reference placement only; RICIS state, type, formulas, proof body, Lean provenance and trust status remain outside the migration's authority.

## Review disposition

This is a separate hardening PR layered on top of PR #7. It is safe to merge independently after remote CI success.
