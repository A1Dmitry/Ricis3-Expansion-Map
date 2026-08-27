# SHA-128 Mixed Hydration Failure — Resolution Evidence

**Date:** 2026-08-27  
**Branch:** `fix/sha128-mixed-hydration`  
**Base:** `main` at `8040386`

## Confirmed failure

The published page rendered `Ошибка загрузки БД: [object Object]`. The message was produced by `App.tsx`, which converted any structured hydration exception with `String(error)`. The underlying failure was reproduced locally by combining a migrated SHA-128 graph with the legacy-ID seed graph used by the old hydration merge logic.

The reproduction produced:

```json
{
  "kind": "identity_collision",
  "paths": ["/целевая-функция-agi-ricis-core"],
  "legacyIds": ["6d610aedda58ff1ec640c2598a5c15ff", "core-agi-target"]
}
```

The failure was therefore not a missing database file. It was a **mixed identity-space collision**: persisted nodes already had 32-hex SHA-128 IDs, while hydration appended legacy `initialMap` nodes before the migration pass. Both nodes normalized to the same canonical path, and the invariant verifier correctly rejected the ambiguous graph.

## Fix

`mergeCanonicalSeedGraph` now migrates the persisted graph and the published seed independently into the same canonical SHA-128 identity space before comparing IDs. Hydration appends only missing canonical nodes, zones and edges, filters seed edges to existing endpoints, and then performs the ordinary audit/reconciliation pass. The graph is not silently deduplicated by position or title; deterministic identity and reference rewriting remain the authority.

The UI error boundary now serializes structured migration errors into a safe diagnostic string instead of `[object Object]`, so any future integrity rejection remains actionable without exposing credentials or raw provider material.

## QA evidence

| Gate | Result |
|---|---|
| Initial-map migration diagnosis | 178 nodes migrated successfully |
| Mixed legacy+SHA-128 reproduction before fix | Fails with expected `identity_collision` |
| Mixed hydration regression after fix | PASS; no duplicate IDs and migration is idempotent |
| Focused persistence/identity/importer tests | 14/14 PASS |
| Full Vitest regression | 144 test files / 1,263 tests PASS |
| Strict TypeScript | PASS |
| Production build | PASS |
| `git diff --check` | PASS |

The fix preserves node workflow states, proof records, canonical aliases, reciprocal graph references and the existing proof-promotion boundary. It does not introduce a fallback that bypasses graph integrity checks.
