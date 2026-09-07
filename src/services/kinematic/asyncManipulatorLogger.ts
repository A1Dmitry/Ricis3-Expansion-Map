// ============================================================================
// ASYNC CRITICAL NODE EVENT LOGGER FOR MANIPULATOR (Non-blocking Queue)
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import type { IAsyncNodeCriticalLogEntry } from './twoStageSingularity.contracts';

type LogListener = (logs: readonly IAsyncNodeCriticalLogEntry[]) => void;

/**
 * Async Non-blocking Event Logger.
 * Dispatches critical transition events onto a microtask/requestAnimationFrame queue
 * so 60FPS UI rendering and 3D canvas physics loops are never blocked.
 */
export class AsyncManipulatorCriticalLogger {
  private logBuffer: IAsyncNodeCriticalLogEntry[] = [];
  private readonly listeners = new Set<LogListener>();
  private flushScheduled = false;

  public logEvent(entry: Omit<IAsyncNodeCriticalLogEntry, 'id' | 'timestamp'>): void {
    const fullEntry: IAsyncNodeCriticalLogEntry = {
      ...entry,
      id: `crit-log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };

    this.logBuffer = [fullEntry, ...this.logBuffer.slice(0, 49)]; // keep last 50 entries

    if (!this.flushScheduled) {
      this.flushScheduled = true;
      // Async dispatch outside render frame
      queueMicrotask(() => {
        this.flushScheduled = false;
        this.notifyListeners();
      });
    }
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener(this.logBuffer);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSnapshot(): readonly IAsyncNodeCriticalLogEntry[] {
    return this.logBuffer;
  }

  public clear(): void {
    this.logBuffer = [];
    this.notifyListeners();
  }

  private notifyListeners(): void {
    const snapshot = Object.freeze([...this.logBuffer]);
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

export const asyncCriticalLogger = new AsyncManipulatorCriticalLogger();
