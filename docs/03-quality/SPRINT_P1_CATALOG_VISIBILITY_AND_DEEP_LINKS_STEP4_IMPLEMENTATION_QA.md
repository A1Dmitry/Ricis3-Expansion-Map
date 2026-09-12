# SPRINT P1 — Catalog Visibility and Deterministic Deep Links
## Step 4: Implementation and QA Record

**Status:** Published implementation; historical local QA record retained.
**Scope identifier:** `P1-CATALOG-VISIBILITY-NAVIGATION-01`
**Release version:** `0.4.67`
**Publication status:** Published through PR #3 into `main`; the merge deployment [GitHub Pages run 33073663425](https://github.com/A1Dmitry/Ricis3-Expansion-Map/actions/runs/33073663425) completed successfully.

---

## 1. Implemented scope

| Area | Implemented behavior | Explicitly excluded behavior |
|---|---|---|
| `src/catalogVisibility/catalogVisibility.contracts.ts` | Side-effect-free typed contracts for reconciliation, search, deep-link focus and visibility projection. | React, Zustand, browser storage, Three.js, Core, Lean, proof, importer and passport dependencies. |
| `src/catalogVisibility/catalogVisibility.domain.ts` | Exact-ID canonical validation, detached add-only node/zone plan/application, additive stable-ID matching and typed focus outcomes. | Edge creation/reversal, proof attachment/promotion, singularity evaluation, `NaN`, root/title fallback, Core/Lean status. |
| `src/model/persistence.ts` | Applies a successful add-only plan after existing hydration/migration; persists only actual additions. | A second migration/audit invocation, rewriting an existing node, proof, edge, axiom or log. |
| `src/ui/Map3D.tsx` | Reuses matcher, waits for `map.hydrated`, projects filter + valid deep-link visibility once, renders stable ID in mobile results and gives an explicit unknown-ID diagnostic. | Catalog cloning, direct persistence write, implicit graph link, proof/Core/Lean claim. |
| Release metadata | Patch-version alignment to `0.4.67` in package metadata, runtime label, README, citation and website metadata. | Dependency change, package-manager change or CI/deployment alteration. |

---

## 2. Preservation and RICIS boundary

The existing persisted object always wins for an exact matching ID. Thus a runtime `real-catalog-98` with `type: scientific_task` and `state: unresolved` is not replaced by the static catalog source. The reconciliation plan is data-only and insert-only. It preserves all existing `edges`, proofs/external Lean provenance, axioms, agent logs, user nodes, titles, target functions, state and type.

No relationship `core-agi-target → real-catalog-98` is inferred. Catalog materialization does not build a `DependencyEdge`; the already separate user-driven P1 importer remains the only owner of that explicit graph patch.

The feature does not invoke a RICIS transform or assign a mathematical result. It does not alter L1 identity/source boundaries. Existing RICIS, Core and Lean UI widgets retain their separate responsibilities.

---

## 3. Targeted QA results

| Command / check | Result |
|---|---|
| `npx vitest run src/catalogVisibility/catalogVisibility.domain.test.ts src/catalogVisibility/catalogVisibility.integration.test.ts` | **PASS — 2 files, 20 tests.** |
| `npm run lint` | **PASS — strict `tsc --noEmit`.** |
| Actual `KNOWN_SINGULARITY_PROBLEMS` planner harness | **PASS — 101 canonical records, 100 node additions to the seed map, 0 zone additions, no `core-agi-target → real-catalog-98` edge and no target proof.** |
| `npm run release:check` | **PASS — 1 file, 12 tests; canonical version `0.4.67`.** |
| Full `npm test` | **PASS — 132 files, 1195 tests.** |
| `npm run build` | **PASS — production build complete.** |
| `git diff --check` | **PASS — no whitespace errors.** |

The production build emitted the repository’s existing Vite chunk-size advisory for the Map3D bundle. It is a warning only; build completion and generated artifacts succeeded. No automatic code-splitting change is included in this narrowly approved P1 scope.

---

## 4. Visual verification boundary

A local production preview started successfully at `http://localhost:4173/` and a deep-link URL was opened. The sandbox browser runtime then became unavailable before a screenshot/DOM inspection could complete. Therefore no visual-success claim is made from that attempted browser check.

The behavior is nevertheless covered by the targeted domain/integration test suite and full production build. The subsequently published `main` deployment completed successfully in GitHub Pages run 33073663425; this historical local record still makes no screenshot/DOM visual-success claim.

---

## 5. Files changed in this candidate

```text
CITATION.cff
README.md
docs/01-architecture/SPRINT_P1_CATALOG_VISIBILITY_AND_DEEP_LINKS_STEP2_ARCHITECTURE.md
docs/02-sprints/SPRINT_P1_CATALOG_VISIBILITY_AND_DEEP_LINKS_STEP1_BUSINESS_SPEC.md
docs/03-quality/SPRINT_P1_CATALOG_VISIBILITY_AND_DEEP_LINKS_STEP3_QA_SPEC.md
docs/03-quality/SPRINT_P1_CATALOG_VISIBILITY_AND_DEEP_LINKS_STEP3_RED_BASELINE.md
docs/03-quality/SPRINT_P1_CATALOG_VISIBILITY_AND_DEEP_LINKS_STEP4_IMPLEMENTATION_QA.md
docs/05-evidence/architecture/structural-hash-report.md
docs/05-evidence/architecture/telegram-tokenpool-remediation-2026-08-18.md
docs/05-evidence/proofs/lean-boundary-audit-2026-08-18.md
index.html
package-lock.json
package.json
src/catalogVisibility/catalogVisibility.contracts.ts
src/catalogVisibility/catalogVisibility.domain.test.ts
src/catalogVisibility/catalogVisibility.domain.ts
src/catalogVisibility/catalogVisibility.integration.test.ts
src/model/audit.proofSynthesisContainment.test.ts
src/model/persistence.ts
src/ui/Map3D.tsx
src/version.ts
```

---

## 6. Publication reconciliation and next authorization boundary

The historical candidate was subsequently committed, published through PR #3, merged into `main` and deployed successfully in GitHub Pages run 33073663425. This correction records that observed publication state; it does not reopen or repeat the implementation.

A separate explicit user decision remains required for any new post-publication change, including a functional amendment, a new pull request, a new merge or a new deployment. The historical PR #2 edge-import scope remains separate and was not modified by this candidate.

---

## 7. Author-published preprint provenance reference

The user identifies the following published author preprint as an immutable external reference for the wider RICIS-III publication context:

> Aleinikov, D. (2026). *Geometric Bridge in RICIS-III: A Local Determinant Invariant for Typed 0_F × ∞_G Nodes* (Version 1.0.0). Zenodo. https://doi.org/10.5281/zenodo.22124493

This reference is recorded verbatim as author-supplied publication provenance. It does not create a map node, edge, proof record, Core runtime result, Lean kernel evidence, or any authority for the catalog-visibility implementation.
