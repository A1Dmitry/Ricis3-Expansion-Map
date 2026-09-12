# SHA-128 Node Identity Migration — Step 1: Business Specification

**Status:** `DRAFT — user-approved algorithm and canonical-path policy; architecture and red QA follow.`

**Scope identifier:** `P1-SHA128-NODE-IDENTITY-MIGRATION-01`.

## 1. Objective

Replace legacy node identifiers with compact deterministic 128-bit identifiers derived from the node's normalized full path in the graph. The internal identifier is a 32-character lowercase hexadecimal string representing the first 128 bits of SHA-256. The UI displays the same 16-byte digest in standard Base64 form, while the canonical path is stored and displayed as a filesystem-like path.

> **Terminology note:** There is no standard SHA-128 algorithm. In this project, `SHA128` means `SHA-256(path)[:16]`, rendered internally as 32 lowercase hexadecimal characters. The digest is an identifier only; it does not carry proof, trust, state, type or mathematical authority.

## 2. Approved identity model

| Representation | Definition | Usage |
|---|---|---|
| Canonical path | POSIX-like absolute path with `/` separators, normalized Unicode and deterministic graph ancestry | Human-readable stable identity source and persisted metadata |
| Internal node ID | `lowercaseHex(SHA-256(UTF-8(canonicalPath))[0..15])` | `ProblemNode.id`, node references and application lookup |
| UI key | `Base64(SHA-256(UTF-8(canonicalPath))[0..15])` | Read-only display in node cards/details and diagnostics |
| Legacy alias | Previous node ID mapped to the new internal ID | One-time migration, old deep links, old snapshots and old patches |

The canonical path is the source of truth for new identity generation. Base64 is presentation only and must never be used as a lookup key or silently substituted for the internal hex ID.

## 3. Canonical path rules

A path is built from graph ancestry and node title segments. Each segment is normalized using Unicode NFKC, trimmed, collapsed whitespace, case-folded to lowercase, converted to filesystem-safe hyphenated text, and percent-escaped only when necessary. Empty segments become `untitled`. The path always begins with `/` and uses `/` as the only separator; `.` and `..` are forbidden as semantic segments.

For a node with several dependency parents, the canonical path is the lexicographically smallest complete root-to-node candidate after path normalization. All other parent relationships remain in the graph and are remapped independently; choosing one canonical identity path does not delete or collapse edges.

For cyclic relationships, strongly connected components are collapsed only for path calculation. The component segment is deterministic: `/cycle-<sorted-normalized-member-segments>` followed by the selected member segment. The original cycle edges remain unchanged except for their endpoint ID remapping. A node's path is therefore deterministic even when the graph is not a tree.

The canonical path must be persisted as `canonicalPath` on the node. It is metadata, not a replacement for the node title or description. A path change is an identity change and requires an explicit future migration; ordinary title edits must not silently mutate an existing ID during normal UI editing.

## 4. Fields that must be remapped

The migration builds one complete old-to-new map before changing any object. It then rewrites every node reference using that map.

| Object | Field | Migration rule |
|---|---|---|
| `ProblemNode` | `id` | Replace with SHA-128 hex of its canonical path |
| `ProblemNode` | `dependencyIds[]` | Map every legacy ID to the new hex ID, preserve order and set semantics |
| `ProblemNode` | `dependentIds[]` | Map every legacy ID to the new hex ID, preserve order and set semantics |
| `DependencyEdge` | `fromId`, `toId` | Map both endpoints; retain edge attributes |
| `Axiom` | `sourceNodeId`, `usedByNodeIds[]` | Map all node references |
| `Proof` | record key and `nodeId` | Re-key by new node ID and rewrite `nodeId`; preserve proof object identity/content |
| `AgentLogEntry` | optional `nodeId` | Map when present; preserve log text and timestamp |
| `ScienceZone` | `nodeIds[]` | Map every member ID and remove only duplicate references created by migration |
| Persisted/imported snapshots | all above | Read legacy or mixed IDs, rewrite atomically, retain alias metadata |

Unknown references are a hard migration error in strict mode. No reference may be replaced with an invented node, empty string, Base64 value or `undefined`.

## 5. Migration pattern

The migration follows the established expand/dual-read/rewrite/verify/cleanup pattern used by the project database migration layer:

1. **Expand:** add `canonicalPath` and migration metadata without deleting legacy data or changing the public snapshot version prematurely.
2. **Plan:** validate unique legacy IDs, derive all canonical paths, compute all 128-bit digests and reject collisions before mutation.
3. **Rewrite:** create a new immutable graph projection and remap all node-reference fields from the complete mapping table.
4. **Verify:** assert node/edge counts, endpoint validity, reciprocal dependency/dependent consistency, zone membership, axiom references, proof keys and log references.
5. **Commit:** persist the rewritten map and alias table atomically under a new migration version.
6. **Dual-read compatibility:** resolve old deep links and old patch IDs through the alias table during the compatibility window; new exports use only SHA-128 IDs and canonical paths.
7. **Cleanup:** legacy aliases may be retired only in a separately approved migration after all supported snapshots and links have crossed the compatibility window.

The migration is idempotent. Re-running it against an already migrated map must produce byte-equivalent IDs, paths and references and must not create a second alias layer.

## 6. Graph preservation invariants

Migration must preserve node count, edge count, zone count, proof count and every non-reference node/edge/proof field byte-for-byte unless a field is explicitly added for canonical path or migration metadata. Every pre-existing relationship must remain a relationship between the corresponding migrated nodes. Reciprocal `dependencyIds`/`dependentIds` membership must remain consistent after remapping.

The migration must preserve RICIS semantics and authority boundaries. It must not change `state`, `type`, `targetFunction`, proof trust status, Lean evidence, formulas, axioms or any result derived from them. It only changes identity representations and reference fields.

## 7. UI behavior

Node cards and details show the Base64 representation of the internal SHA-128 key as the visible compact key. The canonical path is shown in a separate filesystem-like line, for example `/informatics/целевая-функция-agi-ricis-core`. Copy/search/deep-link logic continues to use the internal hex ID or an explicit legacy alias resolver; the Base64 display is not accepted as an authoritative identifier unless a dedicated presentation decoder proves an exact 16-byte digest.

The UI must not display the full legacy ID as the primary key after migration. During the compatibility window, a legacy ID may appear only in a diagnostic or migration report.

## 8. Acceptance criteria

The change is accepted only when all of the following hold:

1. Every migrated node has a unique 32-character lowercase hex ID and a deterministic absolute canonical path.
2. The digest is exactly SHA-256 truncated to 128 bits over UTF-8 canonical path bytes.
3. All listed node-reference fields are rewritten through one complete mapping table.
4. No node, edge, proof, axiom, zone or agent-log relationship is lost.
5. Collisions, dangling references, malformed paths and ambiguous legacy IDs fail before persistence.
6. The migration is idempotent and supports old snapshots/deep links through a bounded alias table.
7. UI displays Base64 key plus filesystem-like path and does not use Base64 as internal identity.
8. Existing RICIS proof/state/type semantics remain unchanged.
9. Red tests precede implementation, followed by full strict TypeScript, Vitest, build, dry-run and import/export compatibility gates.

## 9. Next pipeline gate

Step 2 must define the path canonicalizer, digest port, SCC/path planner, immutable graph rewrite, alias storage, atomic persistence boundary and UI presentation helpers. Step 3 must provide red tests for digest vectors, normalization, collisions, cycles, every reference field, idempotence, snapshot compatibility and Base64 presentation.

## References

[1]: `src/model/types.ts` — current node, edge, zone, axiom, proof and log reference fields.

[2]: `src/model/migrationAudit.ts` — established one-time IndexedDB migration and audit pattern.

[3]: `src/model/persistence.ts` — snapshot, hydrate, import and export boundaries.

[4]: `src/ui/Map3D.tsx` — current node ID presentation and deep-link surface.
