# SHA-128 Node Identity Migration — Step 3: QA Specification

**Status:** `DRAFT — red-first baseline prepared; migration implementation intentionally absent.`

**Scope identifier:** `P1-SHA128-NODE-IDENTITY-MIGRATION-01`.

## 1. Red-first intent

The focused suite targets the approved Step 1 and Step 2 contracts. It must initially fail because the identity migration modules are absent. The baseline must not alter the production graph, database, UI or import behavior.

## 2. Required test groups

| Group | Observable requirement |
|---|---|
| Path normalization | Equivalent Unicode/whitespace/separator forms produce one absolute POSIX-like canonical path; dot segments and empty segments are rejected or normalized deterministically. |
| Digest vector | SHA-256 UTF-8 truncated to 16 bytes yields a 32-character lowercase hex ID; repeated calls are deterministic. |
| Base64 display | A valid 32-hex ID round-trips to exactly 16 bytes and displays as standard padded Base64; malformed IDs are rejected. |
| Multi-root/multi-parent | The lexicographically smallest complete root-to-node path is selected without deleting other parent relationships. |
| Cycles | SCC collapse produces deterministic cycle paths and preserves original cycle edges. |
| Collision safety | Duplicate canonical paths or duplicate SHA-128 digests abort the plan before any map projection/persistence. |
| Complete references | Nodes, dependencies, dependents, edges, zones, axioms, proofs and agent logs all map through one legacy-to-new table. |
| Content preservation | Non-reference fields, proof bodies, Lean provenance, state, type and target functions remain unchanged. |
| Graph preservation | Node/edge/zone/axiom/proof counts and relationship multisets remain equal after endpoint translation. |
| Compatibility | Legacy IDs resolve through aliases; new exports use hex IDs and canonical paths; Base64 is display-only. |
| Idempotence | Migrating an already migrated map produces no second ID/alias layer and preserves all values. |
| UI contract | Card/detail presentation contains Base64 key and filesystem-like path, while internal lookup continues to use hex. |

## 3. Red baseline command

```text
npx vitest run src/model/nodeIdentityMigration.test.ts
```

Expected initial result: collection failure because `../nodeIdentityMigration` does not yet exist. No test-specific implementation is allowed in this phase.

## 4. Green and release gates

The focused suite must pass before integration. The complete gate is strict TypeScript, all Vitest, production build, `git diff --check`, migration dry-run against the 178-node/172-edge seed, duplicate/dangling-reference audit, old snapshot import, new export, legacy deep-link resolution and browser bundle scan.

The migration must be atomic and idempotent. A failure at any path/collision/reference stage leaves the source map and persisted snapshot unchanged.

## 5. RICIS safety

The tests must prove that identity rewriting does not alter `state`, `type`, target function, proof trust status, Lean evidence, formulas, axiom text or any RICIS semantic content. An ID/path transformation is not a proof operation and cannot promote an external or classical result.

## References

[1]: `docs/02-sprints/SPRINT_SHA128_NODE_IDENTITY_MIGRATION_STEP1_BUSINESS_SPEC.md` — migration business rules.

[2]: `docs/01-architecture/SPRINT_SHA128_NODE_IDENTITY_MIGRATION_STEP2_ARCHITECTURE.md` — migration architecture and contracts.

[3]: `src/model/types.ts` — current graph reference fields.
