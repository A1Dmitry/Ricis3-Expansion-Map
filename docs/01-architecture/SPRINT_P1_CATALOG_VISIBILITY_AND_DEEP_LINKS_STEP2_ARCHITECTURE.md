# SPRINT P1 — Catalog Visibility and Deterministic Deep Links
## Step 2: Architecture and Contract Design

**Status:** Proposed — requires explicit user approval before Step 3 QA
**Scope identifier:** `P1-CATALOG-VISIBILITY-NAVIGATION-01`
**Precondition:** Step 1 business specification approved by the user.
**Implementation status:** No production implementation or executable test is introduced by this document.

---

## 1. Design objective

The architecture must make a canonical catalog identity reachable in a persisted graph without allowing catalog data or navigation code to rewrite user-owned state. A valid stable ID must be searchable and a valid URL target must be selected only after the map is hydrated and additively reconciled.

The design therefore separates four responsibilities that are currently partly interleaved:

1. **catalog source validation** — immutable catalog input is checked by canonical ID;
2. **add-only reconciliation planning** — missing canonical nodes/zones are identified, but no graph/proof/edge mutation is authorized;
3. **deep-link and filter focus projection** — a stable ID is resolved after hydration or reported truthfully as unknown; and
4. **React/Three.js presentation** — Map3D renders a prepared selection/visibility projection and delegates camera geometry to its existing `ReadableNodeFocusPolicy` seam.

> Reconciliation creates neither proof nor a mathematical result. Focus is a presentation decision, not a Core, Lean, or RICIS reducer operation.

---

## 2. Ownership map

| Layer / component | Owns | Must not own |
|---|---|---|
| `catalogVisibility` domain module (new) | Exact canonical-ID validation, add-only reconciliation **plan**, pure search match, pure deep-link result and visibility projection. | IndexedDB, React state, URL/DOM/Three.js, edge synthesis, proofs, Core/Lean. |
| `persistence` hydration adapter | Uses one reconciliation plan after normal hydration/migration boundary; persists only a non-empty add-only plan. | Catalog matching rules, UI filtering, deep-link semantics. |
| `mapStore` | Invokes existing hydration facade and holds hydrated `MapState`. | A second catalog cloning loop or URL interpretation. |
| `UrlShareService` | Existing URL grammar only: reads/writes `node`, `sandbox`, `mode`, `view`, `root`, and optional `from`. | Catalog lookup, fallback node selection, proof/state changes. |
| `Map3D` | Adapts user filter choices, MapState, URL target and camera positions to the pure domain outputs; renders explicit disclosure. | Writing canonical records, synthesizing edges, proof/Core/Lean status decisions. |
| `ReadableNodeFocusPolicy` | Existing camera geometry plan for a resolved selected node. | Identity resolution, URL parsing, visibility filters, data mutation. |
| `AccessibleMapFallback` | Renders the projected nodes and selected identity supplied by Map3D. | Hydration/reconciliation/selection fallback logic. |
| `MapPatchIngestionService` / PR #2 | Explicit user-directed add-only graph links. | Catalog reconciliation and deep-link search. |

The designated **single owner of canonical presence** is `ICanonicalCatalogReconciliationPlanner`. There is no catalog reconciliation logic in `Map3D`, `UrlShareService`, `AccessibleMapFallback`, or the importer.

---

## 3. Proposed module boundary

A new side-effect-free module is proposed:

```text
src/catalogVisibility/
  catalogVisibility.contracts.ts       // branded IDs, inputs, closed outcomes
  catalogVisibility.domain.ts          // pure planner/resolver/projector/search matcher
  catalogVisibility.domain.test.ts     // Step 3 only, after approval
```

It may import only `ProblemNode` and `ScienceZone` types from the map model. It must not import React, Zustand, `window`, `localStorage`, IndexedDB, Three.js, Core clients, Lean services, proof logic, map patch ingestion, or static passport modules.

The module receives canonical catalog nodes and canonical zone definitions as explicit constructor/input dependencies. This avoids a hidden singleton catalog source and makes duplicate/malformed catalog conditions testable.

---

## 4. Identity brands and catalog contracts

The following TypeScript shapes are design contracts. They are not code to be compiled at Step 2.

```ts
export type CatalogVisibilityBrand<TValue, TName extends string> = TValue & {
  readonly __catalogVisibilityBrand: TName;
};

export type CanonicalCatalogNodeId = CatalogVisibilityBrand<string, 'CatalogVisibility.CanonicalNodeId'>;
export type CatalogVisibilityDiagnosticCode =
  | 'unknown_deep_link_target'
  | 'duplicate_canonical_id'
  | 'blank_canonical_id'
  | 'missing_canonical_zone'
  | 'invalid_catalog_record';

export interface CanonicalCatalogSnapshot {
  readonly nodes: readonly ProblemNode[];
  readonly zones: readonly ScienceZone[];
}

export interface CatalogReconciliationInput {
  readonly persistedNodes: readonly ProblemNode[];
  readonly persistedZones: readonly ScienceZone[];
  readonly canonical: CanonicalCatalogSnapshot;
}

export interface CatalogReconciliationPlan {
  readonly kind: 'reconciliation_planned';
  /** Only records absent by exact canonical ID. */
  readonly nodeAdditions: readonly ProblemNode[];
  /** Only canonical zones needed by a node addition and absent by exact zone ID. */
  readonly zoneAdditions: readonly ScienceZone[];
}

export type CatalogReconciliationOutcome =
  | { readonly kind: 'no_reconciliation_required' }
  | CatalogReconciliationPlan
  | {
      readonly kind: 'catalog_reconciliation_rejected';
      readonly code: CatalogVisibilityDiagnosticCode;
      readonly affectedId?: string;
    };

export interface ICanonicalCatalogReconciliationPlanner {
  plan(input: CatalogReconciliationInput): CatalogReconciliationOutcome;
}
```

### 4.1 Reconciliation invariants

The planner performs exact ID comparison before all textual comparison. It produces a plan only; it does not receive, return, mutate, inspect, or derive `edges`, `proofs`, Lean sources, workflow state, or Core status.

For an existing persisted ID, the plan contains no replacement object. The persisted `ProblemNode` is therefore the only source used after application of the plan. This explicitly preserves user-owned `type`, `state`, title, description, target function, economic fields, proof registry, provenance and external Lean source.

For an absent ID, the node addition is a detached clone of the canonical record. Its canonical `dependencyIds` and `dependentIds` are copied as **source declarations only**. The planner must never synthesize or return `DependencyEdge` objects, reverse a relation, or attach a proof. In this scope, no graph edge arises from a catalog visibility plan.

A canonical record with a blank/duplicate ID, a non-array relationship field, or a referenced zone absent from both persisted and canonical zone sets fails closed with `catalog_reconciliation_rejected`. The calling adapter retains the prior map unchanged and records only a non-proof diagnostic.

---

## 5. Plan application and persistence adapter

The existing `hydrateInitialState()` owns state loading. A narrow `CatalogVisibilityHydrationAdapter` is proposed within the persistence layer; its sole job is to apply a successful add-only plan **after** the existing persisted-state load and migration boundary has returned a valid `MapState`.

```ts
export interface CatalogReconciliationApplicationInput {
  readonly map: MapState;
  readonly plan: CatalogReconciliationPlan;
}

export interface CatalogReconciliationApplicationOutcome {
  readonly kind: 'applied' | 'no_change';
  readonly map: MapState;
  readonly addedNodeIds: readonly CanonicalCatalogNodeId[];
  readonly addedZoneIds: readonly string[];
}

export interface ICatalogReconciliationApplication {
  apply(input: CatalogReconciliationApplicationInput): CatalogReconciliationApplicationOutcome;
}
```

The application adapter is deterministic and insert-only:

- it appends only plan `nodeAdditions` and `zoneAdditions` absent by exact ID;
- it preserves `map.edges`, `map.proofs`, `map.axioms`, `map.agentLogs` and all existing nodes as supplied;
- it does not invoke `auditAndFixMapGraph` a second time, avoiding an implicit topology reconstruction after a visibility-only plan;
- it calls `dbSaveMap` only when `kind === 'applied'`; and
- it emits no engine/Core/Lean call.

`hydrateInitialState()` remains the one browser persistence entry point. Step 4 may compose it in this order:

```text
load IndexedDB or legacy snapshot
  → established migration/sanitization boundary
  → canonical catalog reconciliation plan
  → apply non-empty add-only plan
  → save only applied plan
  → return hydrated map
```

The established migration path may retain its own legacy audit duties. This scope introduces no new metadata overwrite rule. The new planner/application must not call the legacy audit or expand its authority.

### 5.1 Explicit topology boundary

The P1 catalog visibility plan must not add `DependencyEdge`. It also must not trigger a second migration audit that would rebuild edges from copied relationship arrays. Therefore the specific user relation `core-agi-target → real-catalog-98` remains exclusively governed by the separately-reviewed P1 importer patch and its link-only JSON. Catalog materialization makes the endpoint reachable; it does not assert the relation.

---

## 6. ID-first search contract

The existing search predicate is replaced by one pure matcher in the new domain module. It keeps all existing fields and adds only canonical ID matching.

```ts
export interface CatalogSearchInput {
  readonly node: ProblemNode;
  readonly normalizedQuery: string;
  readonly isZoneVisible: boolean;
  readonly showOnlyDerivatives: boolean;
  readonly isDerivativeNode: boolean;
}

export interface ICanonicalNodeSearchMatcher {
  matches(input: CatalogSearchInput): boolean;
}
```

The ordered decision is:

```text
1. hidden zone or excluded derivative filter → false
2. empty query → true
3. exact or case-insensitive substring of node.id → true
4. existing title match → true
5. existing description match → true
6. existing targetFunction match → true
7. otherwise → false
```

This is a matching rule, not a resolver. A non-exact textual match never overwrites `selectedNodeId` or changes the deep-link target. Presentation must render the stable node ID in each search result, not only the title and zone, so that a reader can verify which identity was found.

---

## 7. Deep-link resolution and visible-focus projection

Deep-link parsing remains in `UrlShareService`. The parser result is given to a pure resolver only after `map.hydrated === true`.

```ts
export interface DeepLinkFocusInput {
  readonly requestedNodeId: string | null;
  readonly hydratedNodes: readonly ProblemNode[];
  readonly activeVisibleNodeIds: ReadonlySet<string>;
}

export type DeepLinkFocusOutcome =
  | { readonly kind: 'no_deep_link_request' }
  | {
      readonly kind: 'focused_catalog_node';
      readonly nodeId: CanonicalCatalogNodeId;
      /** The UI must include this ID without replacing saved filter state. */
      readonly inclusion: 'include_selected_node';
    }
  | {
      readonly kind: 'unknown_deep_link_target';
      readonly requestedNodeId: string;
      readonly diagnosticCode: 'unknown_deep_link_target';
    };

export interface IDeepLinkFocusResolver {
  resolve(input: DeepLinkFocusInput): DeepLinkFocusOutcome;
}

export interface NodeVisibilityProjection {
  readonly visibleNodeIds: ReadonlySet<string>;
  readonly selectedNodeId: CanonicalCatalogNodeId | null;
  readonly deepLinkDiagnostic: Extract<DeepLinkFocusOutcome, { readonly kind: 'unknown_deep_link_target' }> | null;
}

export interface INodeVisibilityProjector {
  project(input: {
    readonly filteredNodeIds: ReadonlySet<string>;
    readonly focus: DeepLinkFocusOutcome;
  }): NodeVisibilityProjection;
}
```

### 7.1 Focus rules

| Situation | Resolver/projector result | Prohibited behavior |
|---|---|---|
| No `node` parameter | Existing persisted selection/filter flow continues. | Creating a selection. |
| Exact ID present after hydration/reconciliation | `focused_catalog_node`; selected ID is exact; selected node is added to presentation visibility if a filter hides it. | Fuzzy title resolution or root fallback. |
| Exact ID absent after reconciliation | `unknown_deep_link_target`; retain a visible reader-facing diagnostic. | Placeholder node creation, URL erasure, redirect to root, or proof/Core claim. |
| Valid ID but no 3D coordinates/camera ready state | Selected/readable details remain available; existing `NodeFocusOutcome` may report geometry unavailable. | Treating a valid deep link as unknown or changing selection. |
| User manually selects another node | Existing `handleNavigateToNode` navigation semantics may take over. | Re-running the initial URL resolver indefinitely. |

`Map3D` may adapt a `focused_catalog_node` to the existing `NodeFocusSource` value `url_restore` or `node_entry_handoff` based on `from=node-entry`. Camera flight remains the existing pure focus-policy responsibility after selection; it is not part of reconciliation.

---

## 8. Map3D composition flow

The target composition is intentionally linear and one-way:

```text
URL (`UrlShareService.parseInitialParams`)
                     │
Persisted MapState ──┼─→ hydrate + migration ─→ reconciliation plan/application
                     │                                  │
                     │                                  ▼
                     │                          hydrated canonical map
                     │                                  │
Saved filters ───────┴─→ existing filtered node IDs ────┼─→ DeepLinkFocusResolver
                                                        │          │
                                                        ▼          ▼
                                          NodeVisibilityProjection  explicit unknown disclosure
                                                        │
                                                        ▼
                              Map3D, search results, 3D scene, AccessibleMapFallback
                                                        │
                                                        ▼
                          existing ReadableNodeFocusPolicy / Three.js flight adapter
```

The URL-derived target may be resolved once the hydrated map is available; camera flight may wait for the existing `cameraControlsReady` condition. The selection must not be cleared simply because the one-time camera attempt ran before data existed. The visibility projector is reused by the canvas and `AccessibleMapFallback`, avoiding a second hidden-selected-node rule.

The unknown-target disclosure belongs adjacent to the map/search details area and must state only that the requested catalog/node ID is unavailable. It must not say that an equation, proof, Core runtime or Lean kernel is unavailable/failed unless independently established by those modules.

---

## 9. Relationship to current code

| Current seam | Step 4 change allowed after later approvals | Change explicitly not allowed |
|---|---|---|
| `src/model/persistence.ts` | Compose the approved planner/application in hydration and save only applied additions. | Rewrite existing node/proof/edge objects or add a second audit pass. |
| `src/store/mapStore.ts` | Consume the already reconciled hydration output. | Clone catalog records or interpret URLs. |
| `src/ui/Map3D.tsx` | Delegate `nodeMatchesQuery` behavior to the matcher; calculate a shared visibility projection; render IDs and truthful unknown diagnostic; delay initial focus until map readiness. | Direct catalog/persistence writes, edge synthesis, proof/Core/Lean logic. |
| `src/services/UrlShareService.ts` | Keep query parsing/updating compatible, including existing parameters. | New route grammar or catalog lookup logic. |
| `src/ui/AccessibleMapFallback.tsx` | Receive projected visible nodes and selected ID. | Own deep-link recovery. |
| `src/model/migrationAudit.ts` | Compatibility review only. | Use this visibility feature as grounds for a bulk metadata/topology rewrite. |
| PR #2 importer files | None. | Any modification or copied edge logic. |

---

## 10. Type/state/proof preservation matrix

| Map field category | Existing matching node | Newly absent canonical node | Reconciliation authority |
|---|---|---|---|
| `id` | Preserved exactly. | Copied from validated canonical source. | Exact ID validation only. |
| `type`, `state` | **Persisted value wins.** | Canonical source value is copied. | No mutation of existing node. |
| Title, description, target, economics, source URL | **Persisted value wins.** | Canonical source fields are copied. | No overwrite of existing node. |
| `dependencyIds`, `dependentIds` | Preserved exactly. | Canonical declaration may be copied; no edge is synthesized. | No repair/inference. |
| `edges` | Preserved exactly. | Unchanged. | Not present in contract. |
| `proofs`, external Lean source/evidence | Preserved exactly. | No proof key/value is added. | Not present in contract. |
| `axioms`, agent logs, filter storage, Core status | Preserved exactly. | Unchanged. | Not present in contract. |

---

## 11. Required QA design for the next step

Step 3 must supply executable tests before implementation. It must cover, at minimum:

1. an empty/persisted map missing `real-catalog-98` receives one plan addition and no edge/proof;
2. applying the same plan twice produces `no_change` on the second application;
3. an existing runtime `real-catalog-98` with `type: scientific_task` and `state: unresolved` is not replaced;
4. existing title/description/target/proof/external Lean content and user nodes are unchanged by the plan/application;
5. malformed/duplicate catalog input rejects atomically and retains the original map;
6. a valid deep link resolves only after the reconciled map contains the exact ID;
7. unknown exact ID gets `unknown_deep_link_target`, not a fallback selection;
8. a selected deep-link node is included in visible projection despite an active filter, while the filter state itself remains unchanged;
9. ID, title, description and target-function matching remain additive;
10. no domain contract imports React, browser storage, Three.js, Core, Lean, proof, or importer modules;
11. integration coverage proves both 3D and accessible paths receive one visibility projection; and
12. regression coverage confirms the separate edge-import patch retains its own type-preserving semantics without a new copy of that logic.

---

## 12. Release and integration constraints

After Step 3 and only during an approved Step 4:

- use a separate feature branch based on then-current stable `main`;
- rebase or merge current stable `main` before final QA;
- increment patch version from the then-current canonical release source and synchronize `src/version.ts`, `package-lock.json`, README/release artifacts;
- run `npm ci`, release alignment, strict TypeScript, the new targeted tests, the full Vitest suite and production build;
- publish only with separately authorized commit/push/PR actions; and
- merge/deploy only with separate explicit authorization.

No Runtime Core operation, browser credential, external service call or Pages deployment is required to test this architecture.

---

## 13. Approval boundary

Approval of this Step 2 design authorizes **only Step 3 QA specification and red/green executable tests** for `P1-CATALOG-VISIBILITY-NAVIGATION-01`.

It does not authorize production implementation, package/version changes, commits, pushes, PR changes, merge, deployment, a new graph edge, source/proof replacement, Core/Lean configuration or an external request.

**Requested confirmation:** reply **`OK`** to proceed to Step 3 QA.
