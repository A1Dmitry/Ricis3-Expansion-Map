# Step 2 Architecture: Persistence & Export Accordion Action Panel

## Status

Architecture-only design for the approved Step 1 scope. No production implementation, browser mutation, import submission, or deployment is part of this step.

## Single owner

`Map3D.tsx` remains the single presentation owner for panel projection, accordion expansion, and existing persistence action callbacks. No second persistence controller, modal wrapper, or duplicated handler set is introduced. `MapPatchImportModal` remains the existing owner of JSON validation and patch application.

The panel projection has one explicit policy: `persistence` is discoverable in the ordinary navigation projection and is not hidden solely because adaptive ranking has reached `maxVisible`. The existing user-disabled preference remains authoritative; when the user deliberately disables the panel, the panel is omitted until re-enabled. The policy must not mutate the map or rewrite user preferences implicitly.

## Accordion contract

The existing `openPanelIds` and `toggleAccordion` state remain the single owner of expanded/collapsed behavior. The `persistence` header is a normal accordion header with `aria-expanded`, `aria-controls`, keyboard activation, visible focus, and stable `data-testid="persistence-export-panel"`. The panel body is rendered only when the accordion is expanded and then contains all actions immediately; it is never dependent on `showOverflow` or a second Settings interaction.

The panel body keeps the existing action order and callbacks:

1. `💾 Сохранить в IndexedDB` calls `map.saveNow()`.
2. `⚡ Импорт решений (JSON)` calls `setShowPatchImportModal(true)` and does not apply anything.
3. `📥 Скачать .json` calls `map.downloadJson()`.
4. `⚠️ Сброс карты` retains the existing confirmation before `map.resetMap()`.

The import action receives stable `data-testid="persistence-import-json"` and an explicit accessible name. Opening the modal is a UI state transition only. The existing Apply action remains the only path that invokes `defaultMapPatchIngestionService.applyPatch()` and `map.saveNow()` for an import.

## Presentation rules

The header is compact and visually secondary to search, selected-node content, and audit. The expanded body uses one vertical action group on narrow widths and a compact two-column layout only when there is enough width. Import is the primary utility action; save/download use the existing cyan/neutral hierarchy; reset remains destructive red with confirmation. No duplicate quick-action buttons or new navigation level is added.

## Boundaries

The architecture has no provider, Agent Gateway, Gemini, OpenRouter, server, network, proof, Core, Lean, graph mutation, or new persistence-schema dependency. Panel visibility and accordion expansion cannot create nodes, edges, proofs, evidence, formulas, state transitions, or type changes. The user-disabled panel preference is preserved exactly as a UI preference.

## QA obligations

Step 3 tests must verify that the panel is discoverable without overflow or Settings, that the expanded body exposes all four actions in order, that the import action opens the existing modal path, that header opening is non-mutating, that reset remains confirmation-gated, and that user-disabled preferences remain respected. A topology check must reject a second owner or duplicated persistence handlers.
