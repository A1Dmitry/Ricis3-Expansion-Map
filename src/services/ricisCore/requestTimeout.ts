/**
 * Client-side deadlines for Ricis.Core HTTP calls.
 *
 * Incident 2026-09-17: both health probes (`coreRecovery.probeRicisCoreHealth` and
 * `RicisWasmBridge.loadRuntime`) called `fetch` without an `AbortSignal`. While the
 * server was frozen (or during its 30 s Core start-up wait) the browser waited
 * indefinitely and the recovery spinner never finished. A bounded probe turns a hung
 * transport into an honest `CORE_UNAVAILABLE` within a known time.
 */

/** Health probes must answer fast; anything slower is reported as unavailable. */
export const CORE_HEALTH_TIMEOUT_MS = 5_000;

/** Computation requests may legitimately take longer than a health probe. */
export const CORE_REQUEST_TIMEOUT_MS = 30_000;

/**
 * Returns an `AbortSignal` that fires after `ms`, or `undefined` when the runtime
 * lacks `AbortSignal.timeout` (very old browsers) — the request then behaves as
 * before rather than throwing before it starts.
 */
export function coreRequestSignal(ms: number): AbortSignal | undefined {
  const ctor = typeof AbortSignal === 'undefined' ? undefined : AbortSignal;
  if (!ctor || typeof ctor.timeout !== 'function') return undefined;
  return ctor.timeout(ms);
}
