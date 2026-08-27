# SHA-128 Importer Identity — Step 4 Release Evidence

**Date:** 2026-08-27  
**Scope:** Future-node identity enforcement in `MapPatchIngestionService`  
**Base:** `origin/main` at merge commit `2ae6c64`

## Implemented contract

Patch-created and proof-created nodes now pass through the same canonical identity service as legacy graph migration. Their internal IDs are SHA-256 digests truncated to 128 bits and represented as 32 lowercase hexadecimal characters. The canonical path is derived from the normalized filesystem-like parent path and node title. The importer keeps Base64 as a presentation-only representation and never uses it as a domain lookup key.

All node references are remapped atomically before the merge result is returned. This includes node IDs, dependency/dependent arrays, edge endpoints and deterministic edge IDs, proof registry keys, proof `nodeId` fields and `affectedNodeIds`. Legacy patch IDs are accepted through the persisted alias map, so reapplying a patch updates the migrated node instead of creating a duplicate.

Unrelated legacy proof entries that are not attached to a current node set remain byte-preserved. A migration collision or dangling graph reference rejects the entire import before the caller receives a persistence-ready result.

## QA evidence

| Gate | Result |
|---|---|
| Focused red baseline before implementation | 3 tests failed as expected |
| Focused importer suite after implementation | 12/12 PASS |
| Strict TypeScript | PASS |
| Full Vitest regression | 143 test files / 1,258 tests PASS |
| Production build | PASS |
| `git diff --check` | PASS |
| Provider/network/browser secret boundary | Unchanged; no provider transport added |
| Proof promotion boundary | Unchanged; structural import does not promote proof authority |

## Graph preservation

The importer remains add-only for relationships. Existing nodes are updated only by declared patch fields, new edges are directed and deduplicated, reciprocal dependency/dependent references remain synchronized, and invalid edges reject atomically. Existing node type, workflow state and proof provenance remain unchanged unless explicitly present in the patch contract.

The result includes `nodeIdAliases` for persistence and legacy deep-link resolution. UI import now passes the persisted alias table into the service and stores the returned table together with the remapped graph.
