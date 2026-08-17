import { IRicisCoreEngine } from './IRicisCoreEngine';
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
