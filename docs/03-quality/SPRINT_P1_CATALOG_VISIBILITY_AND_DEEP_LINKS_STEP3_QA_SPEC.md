# SPRINT P1 — Catalog Visibility and Deterministic Deep Links
## Step 3: Red-First QA Specification

**Status:** Proposed executable QA — no production implementation exists in this Step 3 output.
**Scope identifier:** `P1-CATALOG-VISIBILITY-NAVIGATION-01`
**Prerequisites:** Step 1 business specification and Step 2 architecture approved by the user.
**Implementation authority:** None. Passing this QA requires an explicit subsequent Step 4 approval.

---

## 1. Quality objective

The suite establishes that canonical catalog visibility, ID-first search and shared-link focus are **additive, deterministic, and non-authoritative**. The tests must fail against the current code because the approved `catalogVisibility` domain module and its Map3D composition seam do not exist yet. A red result is therefore the required baseline, not a product regression.

The suite must never encode a claim that catalog appearance resolves a RICIS singularity, validates a Lean source, confirms Core availability, creates a proof, or creates a relation. It tests navigation/data boundaries only.

---

## 2. Test locations and ownership

| File | Layer | Responsibility |
|---|---|---|
| `src/catalogVisibility/catalogVisibility.domain.test.ts` | Pure domain/application QA | Reconciliation plan, insert-only application, ID matching, deep-link outcomes, visibility projection, and no-authority boundary. |
| `src/catalogVisibility/catalogVisibility.integration.test.ts` | Composition/topology QA | Requires Map3D to delegate to the new pure module and prevents forbidden imports/duplicate loops. |
| Existing `src/model/mapPatchIngestion.test.ts` | Separate regression suite | Keeps the P1 explicit user-driven edge patch as a separate owner. It is not changed by this scope. |

The future module must be dynamically imported by the red-first tests through a stable literal module path. The test code remains type-safe through an explicit local test-port interface, while its first failure is intentional if that module is absent.

---

## 3. Fixtures and invariants

All fixtures must use an explicit canonical node `real-catalog-98` and a persistent map with root `core-agi-target`. The runtime-conflict fixture uses:

```text
id:    real-catalog-98
type:  scientific_task
state: unresolved
```

It includes a source-locked external Lean proof in a distinct existing node to ensure that reconciliation cannot modify proof/evidence storage by reference or side effect.

The fixtures test both node shape and object graph boundaries:

- `edges` begin with an explicit user-owned edge and must remain equal after any visibility operation;
- `proofs` are deep-compared before and after each plan/application;
- existing nodes are deep-compared where the node ID already exists;
- map-level `axioms` and `agentLogs` retain their references/values; and
- all new node additions are asserted to have no newly created proof key.

---

## 4. Executable domain scenarios

| QA ID | Scenario | Required assertion |
|---|---|---|
| CVN-QA-01 | Persisted map lacks `real-catalog-98`. | Planner returns `reconciliation_planned` with exactly one `nodeAddition`, no edge payload, and only required zone additions. |
| CVN-QA-02 | Apply a valid plan once. | Node appears once; `edges`, `proofs`, existing nodes, axioms and agent logs remain unchanged. |
| CVN-QA-03 | Apply the same catalog state twice. | Second plan is `no_reconciliation_required`, and application is `no_change`; no extra persistence-worthy mutation. |
| CVN-QA-04 | Runtime map already owns `real-catalog-98` as `scientific_task` / `unresolved`. | Planner omits it; existing type, state, title, target and full node object remain unchanged. |
| CVN-QA-05 | Existing graph includes a source-locked external Lean proof. | Application does not add, delete, replace, mutate or promote any proof/evidence. |
| CVN-QA-06 | Canonical record has duplicate ID, blank ID or unresolved zone. | Planner returns typed rejection, does not throw, and input map remains unchanged. |
| CVN-QA-07 | A canonical node carries relationship declarations. | Plan/application creates no `DependencyEdge`, modifies no existing edge and does not reverse/synthesize a relation. |
| CVN-QA-08 | Search query is `real-catalog-98`. | Matcher finds the node by case-insensitive stable ID. |
| CVN-QA-09 | Query uses existing title, description or target field. | Existing human-readable matching remains true; ID matching is additive. |
| CVN-QA-10 | Valid exact deep link resolves after hydration/reconciliation. | Outcome selects exact canonical ID, without title/root fallback. |
| CVN-QA-11 | Valid deep link is hidden by active filter. | Visibility projection contains selected ID but source filter set remains unchanged. |
| CVN-QA-12 | Requested deep-link ID remains absent after reconciliation. | Closed `unknown_deep_link_target` result; no selection, placeholder, URL deletion, proof/Core/Lean payload or node addition. |
| CVN-QA-13 | Deep-link selected node has unavailable 3D geometry. | Selection is still valid; camera policy is allowed to give its existing typed geometry result. |
| CVN-QA-14 | Catalog visibility outcomes are inspected structurally. | No result type exposes `edges`, `proof`, `externalLean`, `coreStatus`, `leanEvidence`, a reducer output or numerical singularity result. |

---

## 5. Composition and topology scenarios

| QA ID | Scenario | Required assertion |
|---|---|---|
| CVN-INT-01 | `Map3D` composition after production implementation. | Imports the approved catalog visibility domain module instead of locally cloning catalog nodes. |
| CVN-INT-02 | `Map3D` search UI and accessible fallback. | Both receive the same node visibility projection; valid selected node is not filtered out. |
| CVN-INT-03 | Initial URL restore lifecycle. | Focus resolution waits for hydrated/reconciled nodes and camera readiness; it does not erase a valid selection when first frame has no coordinates. |
| CVN-INT-04 | Unknown deep link surface. | UI uses only the typed availability diagnostic, not Core/Lean/proof language. |
| CVN-INT-05 | New domain source dependency boundary. | Does not import React, Zustand, browser/DOM APIs, Three.js, persistence, Core, Lean, proofs, MapPatchIngestionService or passport lifecycle modules. |
| CVN-INT-06 | Explicit graph link regression boundary. | The visibility module contains no `DependencyEdge` production construction and does not import the P1 importer. |

---

## 6. Red baseline command

Before Step 4 exists, the expected command is:

```bash
npx vitest run src/catalogVisibility/catalogVisibility.domain.test.ts src/catalogVisibility/catalogVisibility.integration.test.ts
```

Expected red condition:

```text
Failed to load url ./catalogVisibility.domain
```

or an equivalent missing-module failure. This failure is expected because no production file is created during Step 3. Existing repository test files must not be edited to force a green result.

---

## 7. Green requirements after approved Step 4

A green result later requires all `CVN-QA-*` and `CVN-INT-*` tests to pass, plus:

1. `npm run release:check`;
2. `npm run lint`;
3. the complete `npm test` regression suite; and
4. `npm run build`.

The implementation diff must retain the separate importer/test ownership, must contain no false Core/Lean proof claim, and must carry the then-required patch-version/release alignment.

---

## 8. Approval boundary

Approval of this Step 3 QA authorizes **only Step 4 minimal implementation** of the approved architecture sufficient to make this suite green.

It does not authorize extra navigation features, proof creation, Core/Lean configuration, generated edges, state/type mutation, merge, deployment, or any unrelated refactor. Commit, push and PR actions remain separate publication decisions.

**Requested confirmation:** reply **`OK`** to proceed to Step 4 implementation.
