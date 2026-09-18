# SPRINT P1 — Catalog Visibility and Deterministic Deep Links
## Step 3: Red Baseline Execution Record

**Status:** Expected red baseline confirmed.
**Scope identifier:** `P1-CATALOG-VISIBILITY-NAVIGATION-01`
**Branch:** `spec/p1-catalog-visibility-navigation`
**Production implementation introduced:** No.

---

## 1. QA artifacts introduced

| Artifact | Purpose |
|---|---|
| `src/catalogVisibility/catalogVisibility.domain.test.ts` | Red-first executable domain QA for add-only reconciliation, preservation, ID-first search, deep-link outcomes and visibility projection. |
| `src/catalogVisibility/catalogVisibility.integration.test.ts` | Red-first integration/topology QA for Map3D composition and forbidden dependency boundaries. |
| `docs/03-quality/SPRINT_P1_CATALOG_VISIBILITY_AND_DEEP_LINKS_STEP3_QA_SPEC.md` | Scenario and acceptance specification for the executable suite. |

No production `catalogVisibility.domain.ts` exists at this stage. No existing implementation file, importer file, proof file, Core/Lean service, package version, lockfile, CI workflow or Pages configuration has been changed.

---

## 2. Test-code type check

Command:

```bash
npm run lint
```

Result: **PASS**.

The QA tests type-check under the repository’s strict TypeScript configuration. A fixture initially used an obsolete `Axiom` shape; it was corrected to the actual typed fields `id`, `sourceNodeId`, `formalStatement`, and `usedByNodeIds`. Therefore the red baseline is not a TypeScript syntax/type error in the test code.

---

## 3. Required red execution

Command:

```bash
npx vitest run src/catalogVisibility/catalogVisibility.domain.test.ts src/catalogVisibility/catalogVisibility.integration.test.ts
```

Result: **Expected RED** — 2 test files failed, 20 tests failed.

Expected root causes reported by Vitest:

```text
Cannot find module '/src/catalogVisibility/catalogVisibility.domain'
ENOENT: no such file or directory, open '.../src/catalogVisibility/catalogVisibility.domain.ts'
```

This is the required Step 3 failure condition: the approved contracts/tests exist, while the production domain module and Map3D composition have deliberately not yet been implemented.

---

## 4. Covered red scenarios

| Coverage group | Test IDs | Status before implementation |
|---|---|---|
| Add-only canonical node/zone planning | CVN-QA-01 to CVN-QA-03 | Red due only to missing module. |
| L1C2 runtime type/state and source-locked evidence preservation | CVN-QA-04 to CVN-QA-05 | Red due only to missing module. |
| Typed malformed-catalog rejection and no inferred graph relation | CVN-QA-06 to CVN-QA-07 | Red due only to missing module. |
| ID-first additive search | CVN-QA-08 to CVN-QA-09 | Red due only to missing module. |
| Exact deep-link focus, filter-safe visibility and unknown disclosure | CVN-QA-10 to CVN-QA-13 | Red due only to missing module. |
| No proof/Core/Lean/reducer authority | CVN-QA-14 | Red due only to missing module. |
| Map3D composition and dependency boundaries | CVN-INT-01 to CVN-INT-06 | Red due only to missing module/source. |

---

## 5. Boundary confirmation

The failing suite does not call RICIS Core, Lean, an external API, a browser operation or a graph-edge importer. It creates no proof, state promotion, `DependencyEdge`, numerical value, `NaN`, fallback root selection, or semantic assertion about a singularity.

The next permitted work is the narrow Step 4 implementation specified in the approved Step 2 architecture. It may not begin until the user explicitly approves this Step 3 output.

## 6. Approval boundary

**Requested confirmation:** reply **`OK`** to authorize only the Step 4 minimal implementation that makes the listed tests green. Commit, push, pull request, merge, deployment and unrelated work remain separate decisions.
