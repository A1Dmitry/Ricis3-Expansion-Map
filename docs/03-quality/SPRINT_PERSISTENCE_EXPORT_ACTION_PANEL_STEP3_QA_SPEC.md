# Step 3 QA Specification: Persistence & Export Accordion Action Panel

## Status

Red-first specification for the approved Step 1 UX and Step 2 architecture. Production implementation is intentionally not included in this step.

## Test boundary

The tests inspect the single `Map3D.tsx` UI owner and use source-level topology assertions where rendering the full Three.js map would introduce unrelated setup. The tests must not open the live browser, select a file, submit JSON, call `handleApply`, write IndexedDB, invoke provider endpoints, or change map state.

## Acceptance matrix

| ID | Requirement | Expected red condition before implementation |
|---|---|---|
| PEA-QA-01 | The persistence panel has a stable panel test identifier and is part of the ordinary discoverable panel projection. | The current source has no stable panel test identifier and does not protect `persistence` from adaptive hidden/overflow gating. |
| PEA-QA-02 | The expanded accordion body contains the four existing actions in exact order: save, import JSON, download, reset. | The current source has no stable import action test identifier and no explicit expanded-body action contract. |
| PEA-QA-03 | The import action opens the existing modal through `setShowPatchImportModal(true)`. | The handler exists, but the action has no stable UI identity for deterministic QA. |
| PEA-QA-04 | The panel header is a normal accessible accordion with `aria-expanded` and `aria-controls`, and the body is visible when expanded. | The generic accordion exists, but persistence-specific discoverability/expanded visibility contract is not explicit. |
| PEA-QA-05 | Header open/close is presentation-only and cannot call save, import apply, reset, or patch ingestion. | The source must expose a single panel owner and keep mutation callbacks inside action controls, not the header. |
| PEA-QA-06 | User-disabled preference remains respected, while default adaptive ranking cannot hide persistence before a user disable. | The existing `maxVisible: 3` and generic hidden overflow logic can hide persistence on fresh state. |
| PEA-QA-07 | No duplicate persistence action owner or provider dependency is introduced. | The source topology must continue to contain one persistence branch and no provider/network imports. |
| PEA-QA-08 | The panel remains responsive and non-invasive: compact header, body layout classes, visible focus, and no extra navigation layer. | The implementation markers for the approved responsive UX are not yet present. |

## Required red-first test files

`src/ui/Map3D.persistencePanel.test.ts` verifies source topology and stable UI contracts. It is allowed to fail because the future explicit markers and projection policy do not yet exist. The baseline record must show only intended missing implementation markers, not unrelated TypeScript diagnostics.

## Green criteria

After implementation, all PEA tests must pass together with strict TypeScript, lint, full Vitest, production build, release alignment, containment, and `git diff --check`. The import modal must be opened only by the user-facing import action; no test may apply a patch to the live or persisted map.
