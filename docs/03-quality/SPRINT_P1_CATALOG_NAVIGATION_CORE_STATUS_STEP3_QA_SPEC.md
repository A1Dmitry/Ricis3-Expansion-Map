# P1 Catalog Navigation and Core Status — Шаг 3: QA specification

**Статус:** `RED — tests written and executed; explicit user approval is required before Step 4 implementation.`
**Input architecture:** [`SPRINT_P1_CATALOG_NAVIGATION_CORE_STATUS_STEP2_ARCHITECTURE.md`](../01-architecture/SPRINT_P1_CATALOG_NAVIGATION_CORE_STATUS_STEP2_ARCHITECTURE.md)
**Test file:** `src/model/mapPatchIngestion.test.ts`
**Executed command:** `npm test -- --run src/model/mapPatchIngestion.test.ts`
**Environment:** locked dependencies installed with `npm ci`; no package manifest/lockfile change.

> **QA boundary.** These tests verify only structural import identity and evidence non-promotion. They do not execute Ricis.Core, evaluate `0/0`, use classical arithmetic, produce a Lean proof, or assign a mathematical status. `real-catalog-98` must remain `unresolved` with no proof/evidence attachment.

## 1. Test scenarios

| ID | Scenario | Required invariant |
|---|---|---|
| EDGE-QA-01 | Apply reference patch to a map with root `core-agi-target`, no Pareto node and an unrelated source-locked Lean record. | Creates one `real-catalog-98`, one edge `core-agi-target → real-catalog-98`, reciprocal structural node references, zero proof attachments, preserved unrelated proof object, target remains `unresolved`. |
| EDGE-QA-02 | Apply the same reference patch twice. | Second pass creates zero nodes/edges; directed edge and each reciprocal ID occur exactly once. |
| EDGE-QA-03 | Submit an edge with blank source. | Atomic rejection: exact original nodes, edges and source-locked proof references are returned; all created counters zero. |
| EDGE-QA-04 | Submit self-edge and unknown-target variants. | Each returns typed failure; no partial graph mutation. |
| EDGE-QA-05 | Apply production link-only patch to an existing `real-catalog-98` with type `scientific_task`. | Creates one edge only; exact existing type and `unresolved` state are preserved; no proof attaches. |
| Existing `TC-PATCH-*` suite | Existing node upsert, type mismatch and full-state behaviors. | No regression in established import paths. |

## 2. Actual pre-implementation run

| Result | Actual observation | Interpretation |
|---|---|---|
| Existing tests | `4 PASS` | Legacy supported paths still behave as previously tested. |
| New P1 tests | `4 FAIL` | Expected red state before implementation. |
| EDGE-QA-01 | `createdEdgeCount` returned `0`, not `1`. | Incoming `edges` are ignored. |
| EDGE-QA-02 | The created target node/edge is absent. | Current service has no edge-aware state/result contract. |
| EDGE-QA-03 | Invalid edge returns success. | No endpoint validation / no atomic rejection exists. |
| EDGE-QA-04 | Self and unknown endpoint variants return success. | No graph identity validation exists. |

The initial run before `npm ci` could not start because `tsx` from the locked dependency set was absent. After `npm ci`, the test framework executed successfully and exposed the intended red behavior. This is an environment preparation observation, not a product defect.

## 3. Negative non-promotion assertions

The generic creation fixture deliberately includes an unrelated `sourceLocked: true`, `REQUIRES_CORE_LEAN` proof. The required implementation behavior is reference preservation only. The production artifact is link-only and is applied to an already existing `real-catalog-98`; it must not create or modify its proof, type or state, set `LEAN_VERIFIED`, `TRUSTED_AXIOM` or `QED_VERIFIED`, contact Core, or infer any singularity result.

## 4. Step 4 acceptance gate

The implementation may begin only when these same tests become green **without weakening expectations**. In addition, implementation must preserve all existing tests and satisfy TypeScript strict checking. The implementation will be rejected if it resolves a node, swaps user state, ignores malformed edges, resets IndexedDB, or represents an import edge as proof evidence.

## 5. Approval boundary

This Step 3 suite is complete and has established a reproducible red baseline. User confirmation authorizes only Step 4: the minimal `MapPatchIngestionService` + modal/store wiring needed to make these tests green. It does not authorize Core endpoint configuration, RICIS engine changes, proof modifications, deployment, push, PR or merge.

**Requested confirmation:** reply **`OK`** to proceed to Step 4 implementation.
