# SHA-128 Catalog Duplicate Collision — Resolution Evidence

**Date:** 2026-08-27  
**Live symptom:** `identity_collision: paths=/гладкое-решение-уравнений-навье-стокса; legacyIds=d39fd7e5bdcec3f45f38dc43bba31169,real-catalog-0`

## Root cause

The persisted graph contained a custom or previously migrated node with SHA-128 ID `d39fd7e5bdcec3f45f38dc43bba31169` and canonical path `/гладкое-решение-уравнений-навье-стокса`. The later catalog reconciliation layer still treated `real-catalog-0` as a legacy canonical ID and appended it after identity migration. The next hydration therefore saw two records for the same canonical path and correctly rejected the graph.

## Fix

The canonical catalog is now composed with the initial roots and migrated through the same SHA-128 identity service before reconciliation. Persisted known catalog IDs and all related references are remapped to those canonical IDs before the planner runs. Duplicate selection is deterministic: the existing canonical hash record is retained and the legacy catalog record is not reintroduced. The reconciliation planner now compares canonical SHA-128 catalog IDs, not legacy catalog IDs.

No proof state, graph semantic field, or authority status is promoted by this repair. References are rewritten only as an identity-preserving migration operation and are subsequently revalidated through the normal migration path.

## QA

| Gate | Result |
|---|---|
| Exact duplicate regression (`d39fd7...` + `real-catalog-0`) | PASS |
| Partial migration regression | PASS |
| Full Vitest | 146 test files / 1,278 tests PASS |
| Strict TypeScript | PASS |
| Production build | PASS |
| `git diff --check` | PASS |
