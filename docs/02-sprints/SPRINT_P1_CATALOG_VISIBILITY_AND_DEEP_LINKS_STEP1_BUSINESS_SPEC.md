# SPRINT P1 — Catalog Visibility and Deterministic Deep Links
## Step 1: Business Specification

**Status:** Proposed — awaiting explicit user approval
**Scope identifier:** `P1-CATALOG-VISIBILITY-NAVIGATION-01`
**Prepared from:** current `origin/main` (`9c57487b6947049c5861a5c258172968044fc812`), the published P1 importer PR #2, and the author-defined RICIS-III semantic boundary.
**Normative semantic basis:** RICIS-III. The map is a structural/provenance graph; it is not an authority for a RICIS calculation, Core execution, Lean verification, or proof-state promotion.

---

## 1. Business problem

A canonical catalog entry may exist in the static catalog while being absent from a user's persisted map. This produces an identity and navigation failure: a valid stable URL such as `?node=real-catalog-98` can be generated or shared, while the loaded map contains no node with that ID. The current map then has no selected node to show, even though the catalog recognizes the identifier.

The observed entry `real-catalog-98` is an important concrete case. It is present in the canonical catalog as an unresolved item, yet a user map may hold no corresponding node. The previous P1 importer repair makes it possible to add a **user-supplied, add-only directed graph relation** once both endpoints exist. That repair does **not** automatically materialize missing catalog entries, search canonical IDs, or guarantee that a shared URL surfaces the selected node.

The required business result is a map that can reliably surface a catalog identity through three reader-facing paths:

1. a persisted map hydration;
2. a query by stable canonical node ID; and
3. a valid `?node=<canonical-id>` deep link.

The task is about catalog visibility and navigation only. It does not calculate an unresolved catalog problem, infer a proof, call RICIS Core, alter a Lean evidence record, or promote a workflow state.

> **Success is a visible, selectable catalog node with its preserved identity — not a claimed mathematical resolution.**

---

## 2. Verified current-state evidence

| Existing seam | Observed current behavior | Business consequence |
|---|---|---|
| `src/model/catalog.ts` | Defines `real-catalog-98` as a canonical unresolved catalog record. | The stable identity exists outside a given persisted map. |
| `src/model/persistence.ts` — `hydrateInitialState` | Additively merges nodes/zones/edges from `initialMap` into an existing persisted map. | This protects newly seeded `initialMap` records, but it is not a general catalog reconciliation owner. |
| `src/model/migrationAudit.ts` — `auditAndFixMapGraph` | Overlays catalog details only on nodes already present and synthesizes missing roots only. | It does not append every catalog record absent from persisted state. |
| `src/ui/Map3D.tsx` — `nodeMatchesQuery` | Matches title, description, and target function; canonical `node.id` is omitted. | Searching `real-catalog-98` may return no result even when the node exists. |
| `src/ui/Map3D.tsx` — selected node | URL-derived `selectedNodeId` is possible, but the rendered node is looked up only in loaded `map.nodes`. | An absent or hidden target can leave the reader without a usable selected-node representation. |
| `src/nodeEntry/nodeEntryApplication.ts` | Generates canonical graph handoff URLs using `?node=<id>&from=node-entry`. | The URL producer and persisted-map consumer currently do not guarantee the same navigation result. |
| PR #2 `fix/p1-node-navigation-and-core-status` | Provides an edge-aware, type-preserving, user-driven patch import route. | This scope must reuse it after its separate merge; it must not duplicate importer/edge semantics. |

---

## 3. Scope boundary

### 3.1 In scope

This P1 increment must define a single, auditable business path that:

1. **additively reconciles** canonical catalog entries absent from a persisted map;
2. preserves an existing persisted node as the authoritative user-state representation when the same canonical ID already exists;
3. supports matching by stable canonical `node.id` alongside the existing human-readable search fields;
4. resolves a valid `?node=<id>` link to a visible focus/selection after hydration;
5. explains an unknown or unavailable deep-link target without silently changing it to another node;
6. makes the selected deep-link target available in both the 3D and accessible-list presentations; and
7. persists only the necessary additive catalog additions through the existing persistence boundary.

### 3.2 Explicitly out of scope

The following are not authorized by this Step 1 scope:

| Excluded item | Boundary reason |
|---|---|
| Changes to `MapPatchIngestionService`, patch edge rules, or `import-patches/ricis-real-catalog-98-root-link.json` | The importer repair is owned by open PR #2 and must not be duplicated. |
| Automatic creation of `core-agi-target → real-catalog-98` or any other graph relation | A missing node and a graph dependency are distinct facts. Relations must remain canonical-seed data or explicit user input. |
| Any change to existing persisted node `type`, `state`, title, target function, proof, external Lean source, or evidence | L1C2/type identity and source/proof boundaries prohibit overwriting user-owned state during visibility repair. |
| Proof generation, proof attachment, `resolved` promotion, Lean verification, Core health calls, Core configuration, or claims of Core availability | Navigation has no proof or runtime authority. |
| Evaluation of `0/0`, `∞/∞`, `∞−∞`, limits, `NaN`, numerical fallback, or any RICIS reduction | No singular expression is evaluated by catalog reconciliation or navigation. |
| New persistent migration/version schema, browser URL grammar, or Pages deployment | Step 2 may identify a minimal migration marker need; no schema/version/deployment decision is made here. |
| Static Core-status panel refinement | It remains a separately reviewable UI/status scope and cannot be folded into navigation without its own approval. |

---

## 4. User stories

### US-01 — Catalog identity survives persistence drift

> As a researcher opening an existing saved map, I need an absent canonical catalog item to be added without rewriting any node I already own, so that a current catalog identity remains reachable while my type, state, proof and evidence history are preserved.

### US-02 — Search recognizes a stable catalog ID

> As a researcher receiving a technical identifier such as `real-catalog-98`, I need the search interface to find the exact node as well as titles and descriptions, so that search does not depend on language, translation, or title wording.

### US-03 — Deep link opens the intended node

> As a reader following `?node=real-catalog-98`, I need the map to reconcile its current catalog view, select the exact matching node, and expose its details in the active presentation, so that the shared link is deterministically meaningful.

### US-04 — Unknown links remain honest

> As a reader following an ID not recognized by the loaded/canonical map, I need an explicit “target unavailable/unknown” explanation, so that the application does not silently select a different node or fabricate a result.

### US-05 — Filters do not erase a requested focus

> As a reader with saved zone or derivative filters, I need a valid deep-linked node to remain inspectable even when the active filter would otherwise hide it, without silently resetting my saved filter choices.

---

## 5. RICIS-III semantic and identity requirements

This is not a reducer. Nonetheless, it operates on objects bearing RICIS-related metadata and therefore must protect the following boundaries.

| Requirement | Business rule |
|---|---|
| **L0 — continuity** | Hydration and navigation must not make a known persisted object disappear due to catalog reconciliation. |
| **L1 — identity** | Same canonical ID maps to one selected identity. No deep link may be redirected to a different ID as an implicit fallback. |
| **L1C2 — type as identity** | If persisted `real-catalog-98` is `scientific_task`, it remains `scientific_task`; reconciliation must not overwrite it with the static catalog's `core_singularity` type. |
| **SP1 — locality** | Only the missing catalog item is added. Reconciliation must not rewrite unrelated nodes, edges, proofs, user filters, or selected identity. |
| **SP2 — structural priority** | Node ID equality is checked before title/description matching; text search never changes the identity of a stable ID. |
| **SP3/SP4 — typed provenance** | Canonical record provenance may be copied only when a node is absent. Existing source-bearing node objects and locked external Lean bytes are preserved. |
| **A1/A4/A6_GENERAL** | Not invoked. This task neither constructs nor transforms typed zeros/infinities or singular expressions. |
| **Proof/evidence boundary** | Catalog presence and navigation do not constitute proof. No `LEAN_VERIFIED`, `TRUSTED_AXIOM`, `QED_VERIFIED`, `externalLean`, or proof object is created, inferred, or upgraded. |

The sequence for any incidental RICIS-bearing data must remain: **semantic identity/provenance check → structural reconciliation/navigation projection → no mathematical transform in this scope**. This preserves the project’s broader ordering rule without pretending that navigation performs a singularity calculation.

---

## 6. Functional acceptance criteria

### 6.1 Catalog reconciliation

| ID | Acceptance criterion |
|---|---|
| CVN-AC-01 | A persisted map missing `real-catalog-98` receives exactly one add-only clone of the canonical catalog node after reconciliation. |
| CVN-AC-02 | The newly materialized node retains the catalog's canonical ID, its declared initial `unresolved` state and source-defined fields; it receives no proof/evidence object. |
| CVN-AC-03 | A second reconciliation of the same state is idempotent: it creates no duplicate node, edge, proof, zone or additional persistence churn. |
| CVN-AC-04 | If a persisted map already has `real-catalog-98` with `type: scientific_task` and `state: unresolved`, both values remain byte-for-byte/value-for-value unchanged after reconciliation. |
| CVN-AC-05 | Existing proof records, locked external Lean source, arbitrary user description/title/target function and unknown user-added nodes are not overwritten or removed. |
| CVN-AC-06 | Reconciliation does not infer, add, delete, reverse or duplicate graph edges. Existing connectivity is preserved as-is. |
| CVN-AC-07 | A catalog entry whose zone is absent may cause only the required canonical zone membership to become available; no unrelated zone/node rewrite occurs. |

### 6.2 Search and deterministic focus

| ID | Acceptance criterion |
|---|---|
| CVN-AC-08 | Query `real-catalog-98` matches the node by canonical ID, case-insensitively, without requiring the title “Pareto” or a localized text phrase. |
| CVN-AC-09 | Existing title, description and target-function search behavior remains available. ID matching is additive, not a replacement. |
| CVN-AC-10 | When a valid `?node=real-catalog-98` is loaded, hydration/reconciliation completes before focus resolution; the final selected ID is exactly `real-catalog-98`. |
| CVN-AC-11 | A valid selected node is shown in a readable details presentation. A current saved filter may remain stored, but it cannot make the requested selected node uninspectable. |
| CVN-AC-12 | Accessible-list mode exposes and selects the same deep-linked node as 3D mode. |
| CVN-AC-13 | An unrecognized deep-link ID produces a clear non-proof/non-Core diagnostic. It neither creates a placeholder node nor redirects selection to a root or title match. |
| CVN-AC-14 | Closing a node panel or selecting another node uses the existing URL policy and must not corrupt unrelated URL parameters such as sandbox/mode/view/root. |

### 6.3 Evidence/state boundaries

| ID | Acceptance criterion |
|---|---|
| CVN-AC-15 | The reconciliation/navigation output contains no new proof, no state promotion and no Core/Lean availability claim. |
| CVN-AC-16 | The imported graph link from the separately-approved link-only patch remains an optional explicit relation; this scope remains correct when that edge is absent. |
| CVN-AC-17 | No function in this increment emits `NaN`, treats `0/0` as a scalar default, invokes a classical limit fallback, or evaluates a RICIS expression. |

---

## 7. Current duplication and single-owner requirement

Two current mechanisms partially overlap but serve different purposes:

1. `hydrateInitialState` additively merges **`initialMap`** records; and
2. `auditAndFixMapGraph` repairs metadata for **already present** catalog/seed nodes.

Neither is the single owner of “missing canonical catalog entry → add-only persisted-map materialization.” Implementing a third ad hoc loop in `Map3D` would duplicate persistence and identity decisions across UI and model layers.

**Business requirement:** Step 2 must designate one domain/application owner for canonical catalog reconciliation. The UI may request a prepared map/focus projection, but must not itself clone catalog nodes, mutate proofs, or decide how persisted type/state conflicts are resolved. Existing `initialMap` hydration and migration code must be reused or delegated to rather than copied.

`UrlShareService` remains a thin URL parser/updater. It must not become a catalog resolver. `AccessibleMapFallback` remains a rendering surface; it must receive an already prepared visible/selected-node projection and must not acquire hydration semantics.

---

## 8. Migration, persistence and data ownership requirements

| Concern | Required business outcome |
|---|---|
| Existing IndexedDB map | Preserve it. Add only absent canonical catalog entries. |
| Legacy localStorage map | Apply the same reconciliation after legacy conversion, through the established persistence flow. |
| Fresh map | Do not duplicate catalog nodes already represented by the canonical initial state. |
| Type conflict | Persisted user type wins for an existing matching ID. |
| State/proof conflict | Persisted state and proof/evidence registry win; no demotion/promotion or deletion occurs. |
| Canonical catalog update | Later reconciliation may add a newly absent canonical node but must not overwrite an older user node sharing the same ID. |
| Save timing | Persist only if reconciliation made an additive state change. A no-op reconciliation must not write a new snapshot. |
| Failure | If the catalog source is internally malformed or a required canonical zone cannot be resolved, return a typed diagnostic and preserve the prior map. No partial mutation. |

A migration schema increment is not assumed. Step 2 must assess whether an in-memory deterministic add-only reconciliation during hydration is sufficient, or whether a narrow versioned marker is necessary to prevent repeat writes. The decision must preserve current browser maps and be testable.

---

## 9. Risks and mitigations

| Risk | Impact | Required mitigation |
|---|---|---|
| Catalog defaults overwrite user type/state | Violates L1C2 and user ownership. | Existing node is always preserved; reconciliation has insert-only semantics for matching IDs. |
| Node is visible in data but hidden by filter | Shared link appears broken. | Add a focus projection that includes a valid selected ID without resetting stored filters. |
| Fuzzy title matching selects a wrong node | Identity loss. | Canonical exact ID has priority; unknown ID remains unknown. |
| Hydration, migration and UI each clone a record | Duplicate nodes/edges and race conditions. | One reconciliation owner; idempotent deterministic test suite. |
| Visibility feature adds proof/Core claims | False scientific status. | No proof/Core API/call/evidence code in scope; test explicit absence. |
| Catalog clone manufactures dependencies | False graph claim. | No inferred edges; explicit canonical or user import only. |
| PR #2 importer is not yet merged | Duplicate/incompatible edge logic. | Treat PR #2 as an external dependency; do not modify its files within this increment. |
| Version policy omitted for functional change | Release gate failure. | Step 4 must update patch version and all release-aligned artifacts after successful QA. |

---

## 10. Impacted code areas and non-impact areas

| Area | Expected role in a later approved implementation | Scope status |
|---|---|---|
| `src/model/catalog.ts` | Read-only canonical source. | Read/possibly new safe export only; source records not rewritten. |
| `src/model/persistence.ts` | Hydration application boundary for a single prepared reconciliation outcome. | Potential integration seam. |
| `src/model/migrationAudit.ts` | Must remain compatible; Step 2 decides if it delegates to the new owner. | Review required; no silent bulk overwrite. |
| `src/store/mapStore.ts` | Calls existing hydration/persistence boundary, not a second reconciliation loop. | Potential integration seam. |
| `src/ui/Map3D.tsx` | Search ID matching, focus projection and visible unknown-target disclosure. | Potential UI integration seam. |
| `src/services/UrlShareService.ts` | Continue parsing/updating existing query parameters. | No catalog business logic. |
| `src/ui/AccessibleMapFallback.tsx` | Receive consistent selected/visible projection. | Presentation-only compatibility check. |
| `src/model/mapPatchIngestion.*`, `src/ui/MapPatchImportModal.tsx` | Existing separate P1 importer work. | **Out of scope.** |
| RICIS reducer/Core/Lean services | No invocation or alteration. | **Out of scope.** |
| Passport durable lifecycle modules | No alteration. | **Out of scope.** |

---

## 11. Complexity and staged delivery

This is **medium-high complexity (4/5)**. The code path may be compact, but correctness crosses canonical data, IndexedDB/legacy hydration, migration audit, selected-node state, URL parsing, search, 3D visibility, accessible list and the user’s proof/type ownership boundaries.

| Increment | Deliverable | Gate |
|---|---|---|
| Step 1 | This business specification. | **Await explicit user `OK`.** |
| Step 2 | Isolated TypeScript contracts/data-flow design; no production logic. | Requires `OK` to this Step 1. |
| Step 3 | Executable Vitest QA suite, initially red against the absent behavior. | Requires `OK` to Step 2. |
| Step 4 | Minimal implementation, patch version/release alignment, local QA and PR evidence. | Requires `OK` to Step 3. |

---

## 12. Approval boundary

Approval of this document authorizes **only Step 2 architecture/contracts** for `P1-CATALOG-VISIBILITY-NAVIGATION-01`.

It does **not** authorize production code, test writing, a package-version change, commit, push, modification of PR #2, merge into `main`, deployment to GitHub Pages, changes to Core/Lean/PASSPORT modules, graph-edge synthesis, proof generation, type/state mutation, or any external API configuration.

**Requested confirmation:** reply **`OK`** to proceed to Step 2.

---

## 13. Definition of end-to-end success

A later approved implementation is successful only if a persisted map that lacks `real-catalog-98` can hydrate additively, a direct `?node=real-catalog-98` link selects and displays that exact node in both 3D and accessible presentations, and an ID search returns it. If the user already has the node as `scientific_task` and `unresolved`, those fields are preserved. No edge, proof, Core status or Lean evidence is attached or inferred by this visibility feature.

The separately published link-only import patch may then add the user-requested relation `core-agi-target → real-catalog-98` after PR #2 is separately merged and deployed. That edge remains an explicit graph operation, not an implicit consequence of catalog visibility.
