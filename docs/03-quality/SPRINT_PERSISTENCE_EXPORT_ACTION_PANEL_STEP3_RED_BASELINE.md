# Step 3 RED Baseline: Persistence & Export Accordion Action Panel

## Execution

Command: `npx vitest run src/ui/Map3D.persistencePanel.test.ts`

The baseline was executed before any production implementation for the approved panel scope.

## Result

The suite contains 8 tests: **6 failed and 2 passed**. The six failures are intentional target RED conditions for the missing stable panel/action identifiers and explicit discoverable projection policy. The two passing tests confirm that the current source already has one persistence branch, the existing callbacks, the existing accordion owner, and no provider/network dependency in `Map3D.tsx`.

| Test | Status | Intended reason |
|---|---|---|
| PEA-QA-01 stable discoverable panel contract | RED | Stable panel test id and explicit discoverable projection marker are not implemented. |
| PEA-QA-02 expanded action body/order | RED | Stable action identifiers and explicit action-body contract are not implemented. |
| PEA-QA-03 explicit JSON modal action | RED | Existing handler exists, but stable import action identity is not implemented. |
| PEA-QA-04 accessible expanded body | RED | Persistence-specific body/test contract is not explicit. |
| PEA-QA-05 header/action mutation separation | GREEN | Existing accordion owner and action callbacks satisfy the current topology check. |
| PEA-QA-06 adaptive hidden/overflow protection | RED | Current `maxVisible: 3`/hidden overflow policy can hide persistence on a fresh profile. |
| PEA-QA-07 single owner/no provider dependency | GREEN | One persistence branch; no provider or network imports in the UI owner. |
| PEA-QA-08 compact responsive action presentation | RED | Stable action container/focus/responsive markers are not implemented. |

No browser operation, file upload, JSON entry, import submit, IndexedDB write, map mutation, provider call, API call, or deployment occurred during the baseline.

## Exit condition

The baseline is valid for Step 4 only after explicit user approval. Step 4 must make the six target RED tests GREEN while preserving the two existing topology checks and all unrelated project gates.
