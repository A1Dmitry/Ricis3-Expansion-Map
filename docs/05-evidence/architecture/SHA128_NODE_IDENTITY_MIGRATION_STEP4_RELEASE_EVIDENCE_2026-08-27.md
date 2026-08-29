# SHA-128 Node Identity Migration — Step 4 Release Evidence

**Date:** 2026-08-27  
**Branch:** `p1/sha128-node-identity-migration`  
**Status:** `QA PASS — ready for review`

## Scope

The migration changes node identity representation without changing graph semantics. Legacy node IDs are mapped to 32-character lowercase hexadecimal IDs derived from the first 128 bits of SHA-256 over normalized canonical filesystem-like paths. UI surfaces display the same 16-byte digest as standard Base64 and show the canonical path separately.

## Baseline

The source graph contains **178 nodes, 172 edges, 14 zones and 21 proofs**. The baseline audit found no duplicate node IDs, no duplicate edge IDs, no missing dependency references, no missing dependent references and no missing edge endpoints.

## Migration dry-run

The complete seed graph was migrated in memory without IndexedDB writes. The result contained 178 nodes, 172 edges and 178 legacy aliases. All migrated node IDs matched the lowercase 32-hex format, all canonical paths were absolute filesystem-like paths, and no edge endpoint was dangling. A second migration was byte-equivalent to the first result, proving idempotence for the tested graph.

| Check | Result |
|---|---|
| Source nodes | 178 |
| Source edges | 172 |
| Migrated nodes | 178 |
| Migrated edges | 172 |
| Alias entries | 178 |
| Dangling edge endpoints | 0 |
| IDs match 32 lowercase hex | PASS |
| Paths start with `/` | PASS |
| Second migration equal to first | PASS |

## Test and build gates

The initial red baseline failed because `nodeIdentityMigration.ts` did not exist. After implementation, the focused migration/presentation/deep-link suite passed **22/22 tests**. The complete regression passed **142 test files and 1,255 tests**. Strict TypeScript passed, production build passed, and `git diff --check` passed.

An independent system `sha256sum` comparison confirmed the implementation vector for `/test`: the helper returned `b306d9ff847c120dd7eb00fcebe5f118`, matching the first 32 characters of SHA-256 over the UTF-8 path.

## Preserved boundaries

The migration rewrites node IDs, dependency/dependent arrays, edge endpoints, zone members, axiom references, proof keys and proof `nodeId` fields through one complete mapping table. It preserves node state, type, target function, descriptions, economics, formulas, proof bodies, Lean provenance, axiom statements and agent-log content. It does not synthesize proof, alter trust status or promote any RICIS/Lean result.

Hydration and JSON import run the migration before persistence. Legacy deep links resolve through `nodeIdAliases`; new navigation uses internal hex IDs. Custom nodes now receive a SHA-128 ID based on their parent-derived canonical path before insertion. UI displays Base64 key and canonical path, never Base64 as the domain lookup key.

## Known review boundary

The implementation currently uses a deterministic cycle fallback during path resolution and preserves every cycle edge. A future separate change may replace this fallback with a full explicit SCC planner if path policy needs to be expanded; this release does not delete or collapse cyclic relationships.

## References

[1]: `docs/02-sprints/SPRINT_SHA128_NODE_IDENTITY_MIGRATION_STEP1_BUSINESS_SPEC.md` — business specification.

[2]: `docs/01-architecture/SPRINT_SHA128_NODE_IDENTITY_MIGRATION_STEP2_ARCHITECTURE.md` — architecture contract.

[3]: `docs/03-quality/SPRINT_SHA128_NODE_IDENTITY_MIGRATION_STEP3_QA_SPEC.md` — red-first QA specification.
