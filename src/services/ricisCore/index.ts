import { type IRicisCoreEngine, type RicisCoreStatus } from './IRicisCoreEngine';
import { RicisWasmBridge } from './RicisWasmBridge';

export * from './IRicisCoreEngine';
export * from './RicisFallbackEngine';
export * from './RicisWasmBridge';

let globalRicisEngine: IRicisCoreEngine | null = null;

/**
 * Get the lazily-created global RICIS-III Core Engine instance.
 * Runtime initialization starts only when a real engine operation is invoked.
 */
export function getRicisCoreEngine(): IRicisCoreEngine {
  if (!globalRicisEngine) {
    globalRicisEngine = new RicisWasmBridge();
  }
  return globalRicisEngine;
}

/**
 * Read the current strict Core runtime state without starting a health check.
 * This preserves lazy initialization on application startup.
 */
export function getRicisCoreRuntimeStatus(): RicisCoreStatus {
  const engine = getRicisCoreEngine();
  return engine instanceof RicisWasmBridge ? engine.status : 'error';
}

/**
 * Start the existing bridge discovery only after an explicit user request.
 * It reuses the global strict Core engine and never evaluates a fallback result.
 */
export async function checkRicisCoreRuntimeStatus(): Promise<RicisCoreStatus> {
  const engine = getRicisCoreEngine();
  return engine instanceof RicisWasmBridge ? engine.checkRuntimeStatus() : 'error';
}
