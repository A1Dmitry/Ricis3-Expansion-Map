import { IRicisCoreEngine } from './IRicisCoreEngine';
import { RicisWasmBridge } from './RicisWasmBridge';

export * from './IRicisCoreEngine';
export * from './RicisFallbackEngine';
export * from './RicisWasmBridge';

let globalRicisEngine: IRicisCoreEngine | null = null;

/**
 * Get or initialize the global RICIS-III Core Engine instance.
 */
export function getRicisCoreEngine(): IRicisCoreEngine {
  if (!globalRicisEngine) {
    globalRicisEngine = new RicisWasmBridge();
  }
  return globalRicisEngine;
}
