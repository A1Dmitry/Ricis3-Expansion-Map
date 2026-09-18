# UI NAVIGATION AUDIT & UNIFICATION SPECIFICATION
**RICIS-III Expansion Map — Unified SPA Navigation Engine**
**Protocol:** RCVAP (Autonomous Anti-Tukhta Agile Protocol)
**Auditor Status:** `AUDITOR: SELF (same-pipeline)`

---

## 1. Executive Summary & Objective

In accordance with the **UI Navigation Unification Task**, the UI application **RICIS-III Expansion Map** has been audited and unified into a single, cohesive Single Page Application (SPA) navigation architecture.

### Core Invariant
> **The internal change of displayed surface or its data MUST NOT trigger a full browser page reload.**
> The application instance remains persistent across all normal user navigation actions, updating only:
> 1. Active UI workspace/surface template;
> 2. Reactive route state in the browser address bar;
> 3. Loaded workspace data.
>
> Full page reload is strictly restricted to an isolated **emergency recovery mechanism** inside `RouteSurfaceBoundary.tsx` triggered only on fatal dynamic module/chunk loading failures with capped retries.

---

## 2. Comprehensive Navigation Audit Matrix

| Source File & Location | Navigation Pattern / API | Category | Action Taken & Implementation | RCVAP Assessment & Invariant Guard |
| :--- | :--- | :--- | :--- | :--- |
| `src/ui/RoadmapPage.tsx:22-38` | `window.location.assign(...)` | `NORMAL_UI_NAVIGATION` | **REFACTORED TO SPA**: Replaced hard assignment with `UrlShareService.updateBrowserUrl` + `onNavigateToMap` / `onBackToMap`. | **FIXED**: Previously caused a hard page reload when navigating from Roadmap to Map. Now performs reactive SPA workspace transition. |
| `src/ui/RouteSurfaceBoundary.tsx:61-70` | `window.location.reload()`, `location.href = location.href` | `RECOVERY` | **PRESERVED AS EMERGENCY FALLBACK**: Retained inside `RouteSurfaceErrorBoundary` with `AUTO_RELOAD_KEY` counter in `sessionStorage` (max 2 attempts). | **VERIFIED**: Complies with AC-08/09. Only fires on fatal dynamic import/chunk fetch failures; never on normal user actions. |
| `src/services/UrlShareService.ts:83-142` | `window.history.replaceState`, `new PopStateEvent('popstate')` | `NORMAL_UI_NAVIGATION` | **UNIFIED**: Synchronizes `?applet=`, `?view=`, `?node=`, `?mode=`, `?root=`, `?sandbox=` in address bar without reload. | **VERIFIED**: Single source of truth for deep linking. Emits single `popstate` event to notify active React components. |
| `src/services/AppletNavigationService.ts:46-102` | `window.history.back()`, `window.history.forward()`, stack | `NORMAL_UI_NAVIGATION` | **UNIFIED**: Controls in-app navigation stack between 9 registered applets with back/forward history tracking. | **VERIFIED**: Supports toolbar back/forward buttons and browser history without re-rendering or reloading. |
| `src/hooks/useMobileViewStack.ts:39-50` | `window.history.pushState`, `window.history.back()`, `state` | `NORMAL_UI_NAVIGATION` | **PRESERVED**: Manages mobile drawer stack (`map` → `menu` → `details` → `settings`) via `ricisMobileView` state. | **VERIFIED**: Independent mobile navigation stack operating purely via history state without page reload. |
| `src/services/coreRecovery.ts:97-101, 141-145` | `window.history.pushState` (`?view=core-recovery`) | `RECOVERY` | **PRESERVED**: Transitions application into diagnostics mode via SPA pushState. | **VERIFIED**: Does not perform page reload; displays `CoreRecoveryPage` inside existing React root. |
| `src/store/useI18nStore.ts:61-63` | `window.history.replaceState` (`?lang=`) | `DATA_OPERATION` | **PRESERVED**: Persists locale selection in URL parameters reactively. | **VERIFIED**: Pure URL parameter reflection without browser reload. |
| `src/ui/Map3D.tsx:955-981` | `window.location.search`, `popstate` listener | `NORMAL_UI_NAVIGATION` | **UNIFIED**: Reactively syncs `mode` (e.g., `verify`, `proof`) and selected `node` across SPA transitions. | **VERIFIED**: Re-opens proof drawer on `mode=verify` without full reload or state loss. |
| `src/App.tsx:59-83` | `window.location.search`, `popstate` listener | `NORMAL_UI_NAVIGATION` | **UNIFIED**: Central workspace router switching between registered applets based on canonical `applet` / legacy `view`. | **VERIFIED**: Preserves map state and hydration in Zustand while switching views. |
| `src/ui/NodeCardDetails.tsx:172`, `src/ui/Map3D.tsx:460` | `window.location.origin` | `DATA_OPERATION` | **PRESERVED**: Used solely to construct iframe origin URLs for calculator sandbox. | **VERIFIED**: Read-only access to origin; does not initiate navigation. |
| `src/ui/RoadmapPage.tsx:292` | `<a href="..." target="_blank">` | `EXTERNAL_NAVIGATION` | **PRESERVED**: External documentation link opening GitHub in a new browser tab. | **VERIFIED**: External navigation with `rel="noopener noreferrer"`. |

---

## 3. Detailed Architectural Improvements

### 3.1 Elimination of `window.location.assign` in `RoadmapPage.tsx`
* **Problem**: In previous versions, `RoadmapPage` called `window.location.assign(...)` in `navigateToMap()`. Clicking "Открыть карту", "Проверить утверждение", "Открыть полную карту", or selecting a connected task caused a full HTTP reload of the application, discarding in-memory states and re-executing database hydration.
* **Solution**: `RoadmapPage` was refactored to use `UrlShareService.updateBrowserUrl` and trigger `onNavigateToMap` / `onBackToMap` callback to `App.tsx`. This updates the active applet to `'map'`, synchronizes `node` and `mode` in the URL, dispatches a local `popstate` event, and switches the central workspace component instantly.

### 3.2 Preservation of Emergency Fallback in `RouteSurfaceBoundary.tsx`
* `RouteSurfaceBoundary.tsx` wraps top-level and route-level components in a React Error Boundary.
* When dynamic chunk loading fails (e.g. network interruption during lazy module fetch), an automatic recovery attempt is made after a debounce, capped at 2 attempts via `sessionStorage.getItem('__ricis_surface_auto_reload_count__')`.
* A manual button "Перезагрузить поверхность // Reload Surface" is provided for catastrophic rendering errors.
* This is classified strictly as `RECOVERY` and is never reachable during standard application usage.

### 3.3 Deep-Linking and History Stack Integrity
* **Canonical URL Scheme**: `?applet=<applet_id>` with fallback support for legacy `?view=<applet_id>`.
* **Contextual Parameters**: `?node=<id>`, `?mode=verify|proof|challenge|explore`, `?root=<id>`, `?sandbox=<expr>`.
* `AppletNavigationService` maintains an in-app `historyStack` and `forwardStack` to drive the back/forward buttons in the `CompactCommandMenuBar` while also synchronizing with standard browser Back/Forward gestures.

---

## 4. Acceptance Criteria Verification (AC-01 through AC-12)

- [x] **AC-01 (Navigation Audit)**: Full audit conducted across all source files; all navigation and reload patterns cataloged.
- [x] **AC-02 (Roadmap Fix)**: `RoadmapPage.tsx` no longer uses `window.location.assign` or `window.location.reload`.
- [x] **AC-03 (SPA Surface Switching)**: All 9 applets (`map`, `kinematic`, `seed`, `comparison`, `roadmap`, `voynich`, `terminal`, `qa-tests`, `settings`) switch within the persistent React tree.
- [x] **AC-04 (Back/Forward Navigation)**: In-app toolbar and browser back/forward seamlessly traverse applet history.
- [x] **AC-05 (URL Deep-Link Reactivity)**: URL parameters update smoothly via `replaceState`/`pushState` without reloading.
- [x] **AC-06 (Map3D Responsiveness)**: `Map3D` reacts to `mode` and `node` parameters via `popstate` without full page teardown.
- [x] **AC-07 (Mobile Shell Preservation)**: `useMobileViewStack` operates as expected using `window.history.state.ricisMobileView`.
- [x] **AC-08 (Recovery Boundary Isolation)**: `RouteSurfaceBoundary.tsx` retains reload exclusively as an emergency fallback with retry limits.
- [x] **AC-09 (Audit Documentation)**: This document (`UI_NAVIGATION_AUDIT.md`) published with standard matrix and RCVAP classification.
- [x] **AC-10 (RICIS Core Integrity)**: No mathematical core, Lean formalization, or singularity reduction logic was modified.
- [x] **AC-11 (Test Suite Compliance)**: Unit and topology tests pass cleanly.
- [x] **AC-12 (Version Bump)**: Version incremented by 0.0.1 in `package.json` and `src/version.ts`.
