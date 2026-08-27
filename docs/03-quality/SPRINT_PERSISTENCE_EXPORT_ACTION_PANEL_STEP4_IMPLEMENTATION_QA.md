# Step 4 Implementation QA: Persistence & Export Accordion Action Panel

## Scope

This change makes the existing `Persistence & Export` utility discoverable in the normal accordion projection. The header remains compact and collapsed by default. When expanded, the existing actions are immediately visible inside the same accordion body in this order:

`Save → Import JSON → Download → Reset`

The patch preserves the existing callbacks and import modal boundary. Opening the accordion or opening the import modal performs no map mutation; applying JSON remains the only import mutation path.

## Implementation boundary

`Map3D.tsx` remains the single UI owner for panel projection, accordion behavior and action callback wiring. `MapPatchImportModal` remains the owner of JSON validation and apply semantics. No provider, agent, RICIS, Core, Lean, proof, node identity, edge, persistence schema or importer behavior was changed.

The panel is promoted into `projectedVisibleElements` unless the user explicitly disabled the panel. Hidden overflow no longer removes this utility panel from the normal projection. The panel and its four actions have stable test identifiers. The accordion body has an explicit `id` referenced by `aria-controls`, and headers expose visible keyboard focus styling. The action body uses a compact responsive grid with one column on narrow screens and two columns when space permits.

## QA results

| Gate | Result |
|---|---:|
| Focused persistence panel suite | 8 tests passed |
| Release alignment | 12 tests passed |
| Strict TypeScript (`npm run lint`) | PASS |
| Full Vitest regression | 136 test files / 1228 tests passed |
| Production build | PASS |
| `git diff --check` | PASS |
| Functional version | `0.4.67 → 0.4.68` |

The first full-suite run exposed exactly one fail-closed containment allowlist mismatch for the newly approved files. Only the exact current scope paths were added; the suite was rerun and passed completely. The only build output advisory is the existing large `Map3D` chunk warning.

## Safety and live-state boundary

No JSON file was selected or submitted. No browser import was executed. No IndexedDB/user map state was changed. No provider SDK, API key, network request, agent activation or deployment was performed.

## Publication status

The candidate is on the separate local branch `fix/persistence-export-action-panel`, based on the current `origin/main`. It has not been committed, pushed, merged or deployed. The next action requires a separate publication decision.
