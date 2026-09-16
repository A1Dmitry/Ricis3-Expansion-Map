// ============================================================================
// RICIS COMMAND EVENT BUS (MVVM / DRY / SOLID)
// Single source of truth for every cross-applet command/event name.
// Emitters: commandRegistry (toolbar/menus/shortcuts), App.tsx (deeplinks).
// Listeners: mounted applet pages (Map3D, Kinematic, Terminal, QA, Seed).
// State-feedback events (…-changed) flow back from pages to App so command
// indicators (Play/Pause, crawler) reflect real page state.
// ============================================================================

export const RICIS_COMMAND_EVENTS = {
  /** Map3D: reset camera to the default isometric overview. */
  resetCamera: 'ricis:reset-camera',
  /** Map3D: focus the node search input. */
  openSearch: 'ricis:open-search',
  /** Map3D: toggle 3D sphere <-> accessible list presentation. */
  toggle3DPresentation: 'ricis:toggle-3d-presentation',
  /** Feedback: Map3D -> App, detail { is3D: boolean }. */
  presentationModeChanged: 'ricis:presentation-mode-changed',
  /** Kinematic: toggle the physics loop. */
  kinematicTogglePlay: 'ricis:kinematic-toggle-play',
  /** Kinematic: reset joints & telemetry. */
  kinematicReset: 'ricis:kinematic-reset',
  /** Kinematic: one discrete integration step. */
  kinematicStep: 'ricis:kinematic-step',
  /** Feedback: KinematicEnginePage -> App, detail { isRunning: boolean }. */
  kinematicRunningChanged: 'ricis:kinematic-running-changed',
  /** Terminal: clear the output buffer. */
  terminalClear: 'ricis:terminal-clear',
  /** Terminal: run the Lean 4 proof gateway on the current claim. */
  terminalLeanVerify: 'ricis:terminal-lean-verify',
  /** QA: start the flood-fill autoprover crawl. */
  qaRunFloodFill: 'ricis:qa-run-floodfill',
  /** QA: export the structured regression report. */
  qaExportReport: 'ricis:qa-export-report',
  /** Feedback: AutoProverModal -> App, detail { isRunning: boolean }. */
  qaRunningChanged: 'ricis:qa-running-changed',
  /** Seed: run the full seed invariant verification cycle. */
  seedVerify: 'ricis:seed-verify',
  /** Seed: download the cryptographic expansion ledger receipt (JSON). */
  seedDownloadLedger: 'ricis:seed-download-ledger',
  /** Global: run in-app self diagnostics. */
  runDiagnostics: 'ricis:run-diagnostics',
} as const;

export type RicisCommandEventName =
  (typeof RICIS_COMMAND_EVENTS)[keyof typeof RICIS_COMMAND_EVENTS];

export interface PresentationModeChangedDetail {
  readonly is3D: boolean;
}

export interface RunningChangedDetail {
  readonly isRunning: boolean;
}

export type RicisCommandEventDetailMap = {
  [RICIS_COMMAND_EVENTS.presentationModeChanged]: PresentationModeChangedDetail;
  [RICIS_COMMAND_EVENTS.kinematicRunningChanged]: RunningChangedDetail;
  [RICIS_COMMAND_EVENTS.qaRunningChanged]: RunningChangedDetail;
};

export type RicisCommandDetail<E extends RicisCommandEventName> =
  E extends keyof RicisCommandEventDetailMap ? RicisCommandEventDetailMap[E] : undefined;

function isBrowserRuntime(): boolean {
  return typeof window !== 'undefined' && typeof window.dispatchEvent === 'function';
}

/**
 * Dispatches a command on the bus. Safe in non-browser environments (SSR/tests):
 * becomes a no-op instead of throwing a ReferenceError on `window`.
 */
export function dispatchRicisCommand<E extends RicisCommandEventName>(
  event: E,
  detail?: RicisCommandDetail<E>,
): void {
  if (!isBrowserRuntime()) return;
  window.dispatchEvent(new CustomEvent(event, { detail }));
}

/**
 * Subscribes to a command on the bus. Returns an unsubscribe function.
 */
export function subscribeRicisCommand<E extends RicisCommandEventName>(
  event: E,
  handler: (detail: RicisCommandDetail<E>) => void,
): () => void {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
    return () => undefined;
  }
  const listener = (event_: Event): void => {
    const custom = event_ as CustomEvent<RicisCommandDetail<E>>;
    handler(custom.detail);
  };
  window.addEventListener(event, listener);
  return () => window.removeEventListener(event, listener);
}
