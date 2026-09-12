# Step 1 Business Specification: Persistence & Export Action Panel

## Status

Draft for approval. This document defines the smallest corrective scope for the live map UI. It does not change production code, user map state, persisted data, provider configuration, or deployment.

## Problem

The application already contains a real `persistence` panel implementation in `Map3D.tsx`. Its actions include saving to IndexedDB, opening `MapPatchImportModal`, downloading JSON, and resetting the map. However, adaptive panel ranking places `persistence` in `hiddenElements` because the navigation uses `maxVisible: 3`. With `showOverflow` initially false, the panel and its actions are not discoverable in the normal live layout. The Settings control is only a visibility toggle and is not itself the import action.

## Goal

Make `Persistence & Export` a discoverable, real action panel in the normal map layout. The panel must expose the existing actions without bypassing React handlers, while retaining the current persistence and confirmation semantics.

## In scope

The panel is promoted into the default visible panel projection, or is otherwise given an explicit stable action entry, without duplicating the existing persistence handlers. Its header remains an accordion panel and its existing actions remain in their current order: save to IndexedDB, import solutions (JSON), download JSON, and reset map. The JSON import action opens the existing `MapPatchImportModal`; it does not apply a patch until the user validates the JSON and presses the existing Apply button.

The panel and its import action receive stable reader-facing accessibility identifiers such as `data-testid="persistence-export-panel"` and `data-testid="persistence-import-json"`, plus an accessible label. The panel remains compatible with mobile/desktop layout and with the existing `userDisabledPanelIds` preference. A disabled panel preference must not be silently overwritten.

## Out of scope

This scope does not change `MapPatchImportModal`, patch validation, importer semantics, node identity, edge semantics, proof/evidence, Core/Lean status, AI providers, Agent Gateway, OpenRouter, Gemini, API keys, server routes, persistence schema, or GitHub Pages configuration. It does not invoke an import during development or browser verification.

## Acceptance criteria

1. On a fresh browser profile, the compact `Persistence & Export` accordion header is discoverable in the ordinary map navigation without first opening Settings or a rarely-used overflow list.
2. When the user expands the `Persistence & Export` accordion, all four actions are visible immediately inside the expanded panel, including a clearly labeled `Импорт решений (JSON)` action that opens the existing modal through its existing React state handler.
3. The panel also exposes the existing save, download, and reset actions in their existing order; reset retains its confirmation dialog.
4. Clicking the panel header only toggles the accordion and does not mutate map nodes, edges, proofs, evidence, type, or state.
5. Opening the import modal does not mutate map state. Applying a valid patch remains the only action that can invoke the existing ingestion service and save path.
6. Existing adaptive visibility, user-disabled panel preferences, mobile layout, and all current non-persistence panels remain regression-safe.
7. The implementation creates no provider call, no agent tool call, no network request, no new storage schema, no proof/Core/Lean result, and no direct invocation of private modal handlers.

## Best UI/UX direction

The panel is a utility, not a primary content area. It should be discoverable without competing with the selected node, search, or audit panel. The default presentation is a compact accordion header with a database/storage icon, the title `Persistence & Export`, and a short secondary hint such as `Save, import or download`. The header may remain collapsed by default, but once the user expands this accordion, the complete action content must be visible immediately inside it; no overflow list, second Settings step, or additional navigation is allowed.

The four existing actions use one simple vertical action group on narrow layouts and a compact two-column grid only when the available width is sufficient. The primary action is `Импорт решений (JSON)` because it is the requested workflow; save and download use neutral/cyan secondary styling, while reset retains the existing destructive red treatment and confirmation dialog. Labels are explicit, concise, and action-oriented; decorative text and duplicate controls are not added.

The panel must be keyboard reachable, expose `aria-expanded` and `aria-controls`, retain visible focus states, provide adequate touch targets, and remain readable in the current dark theme. On mobile it must not force an additional settings screen or horizontal scrolling. The existing adaptive UI may rank other panels, but this utility panel must remain discoverable through one stable location. A user-disabled preference remains respected and can hide the panel after the user deliberately disables it.

## QA-first sequence

After approval, Step 2 will define the single-owner projection contract and explicit UI topology. Step 3 will add red-first source/React tests for default discoverability, stable import control, preserved action order, no-mutation-on-open, and user preference handling. Only after Step 3 approval may the minimal implementation be added.

## Release and provenance boundary

This is a functional UI change and therefore requires the project patch-version policy and the complete release gate before publication. The DOI `10.5281/zenodo.22124493` remains an immutable bibliographic/provenance reference only; it has no authority over this UI behavior and cannot create map nodes, edges, proofs, evidence, Core status, or Lean status.
