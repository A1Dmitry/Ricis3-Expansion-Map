// ============================================================================
// APPLET DEEP-LINK POLICY (NEW-TAB NAVIGATION) — DRY / SOLID
// UI Navigation Audit v2: workspace surfaces that destroy the 3D map workspace
// (Map3D unmount -> WebGL/physics re-init + camera reset on return) are opened
// in a NEW browser tab instead, so the map instance stays alive in place.
// Every such entry point MUST be rendered as a real link (anchor, target=_blank)
// so it is visually marked as a link and supports middle-click / copy-link.
// ============================================================================

import type { AppletId } from '../types/appletRegistry';
import { UrlShareService, type ShareParams } from './UrlShareService';

/**
 * Workspace-replacing applets that open in a new browser tab.
 *
 * Inclusion criteria (all must hold — see UI_NAVIGATION_AUDIT.md §7):
 *  1. Entering the applet from the map unmounts Map3D (perceived "reload":
 *     WebGL scene + physics re-init, camera resets to the default pose).
 *  2. The applet surface is fully deep-linkable via URL parameters
 *     (`?applet=`, `?node=`, `?root=`, `?mode=`), so a fresh tab restores
 *     the same context without the Zustand runtime state of the opener tab.
 *  3. The applet is useful ALONGSIDE the map (reference/QA/research view),
 *     i.e. keeping both alive in parallel is a usability win.
 *
 * Deliberately EXCLUDED (stay in-place SPA navigation):
 *  - `map`      — the home surface itself; "back to map" is a return action.
 *  - `terminal` — receives its expression payload through the live
 *                 `useTerminalStore` (e.g. "Калькулятор формулы" from a node
 *                 card); a new tab would silently drop the payload.
 *  - `settings` — mutates the live session (locale, physics presets,
 *                 localStorage); edits must apply to the current workspace,
 *                 not to an isolated duplicate tab.
 */
const NEW_TAB_APPLET_LIST = [
  'roadmap',
  'kinematic',
  'seed',
  'comparison',
  'voynich',
  'qa-tests',
] as const satisfies readonly AppletId[];

export const NEW_TAB_APPLETS: ReadonlySet<AppletId> = new Set<AppletId>(NEW_TAB_APPLET_LIST);

/** Should navigation to `applet` open a new browser tab instead of replacing the workspace? */
export function opensInNewTab(applet: AppletId): boolean {
  return NEW_TAB_APPLETS.has(applet);
}

/** Optional deep-link context mirrored into the new-tab URL. */
export interface AppletDeepLinkContext {
  readonly nodeId?: string | null;
  readonly rootNodeId?: string | null;
  readonly mode?: string | null;
}

/**
 * Absolute `target=_blank`-ready URL for a workspace applet.
 * Wraps UrlShareService so the canonical `?applet=` deep-link scheme stays
 * the single source of truth for both in-app and cross-tab navigation.
 */
export function buildAppletDeepLink(
  applet: AppletId,
  context: AppletDeepLinkContext = {},
): string {
  const params: ShareParams = { applet };
  if (context.nodeId) {
    params.nodeId = context.nodeId;
  }
  if (context.rootNodeId) {
    params.rootNodeId = context.rootNodeId;
  }
  if (context.mode) {
    params.mode = context.mode;
  }
  return UrlShareService.generateShareUrl(params);
}
