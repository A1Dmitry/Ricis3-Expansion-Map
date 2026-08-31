import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { dbLoadMap, openDbWithTimeout } from './db';
import { hydrateInitialState } from './persistence';

describe('RICIS-III DB Hydration Guard & Timeout Safeguards (O(1) Singularity Resolution)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('scen_1: resolves openDbWithTimeout via fallback when indexedDB hangs (timeout singularity 0_db/0_req)', async () => {
    // Mock hanging indexedDB open request (neither onsuccess nor onerror called)
    const dummyReq: any = {};
    vi.stubGlobal('indexedDB', {
      open: vi.fn().mockReturnValue(dummyReq),
    });

    const promise = openDbWithTimeout(100);
    vi.advanceTimersByTime(150);

    const db = await promise;
    expect(db).toBeNull();
  });

  it('scen_2: hydrateInitialState falls back to canonical seed map in O(1) time when indexedDB times out', async () => {
    const dummyReq: any = {};
    vi.stubGlobal('indexedDB', {
      open: vi.fn().mockReturnValue(dummyReq),
    });

    const loadPromise = hydrateInitialState();
    vi.advanceTimersByTime(3000);

    const result = await loadPromise;
    expect(result).toBeDefined();
    expect(result.nodes.length).toBeGreaterThan(0);
    // L1_IDENTITY checks: Nodes maintain identities in seed map
    expect(result.nodes.some(n => n.id.length > 0)).toBe(true);
  });

  it('scen_3: hydrateInitialState returns canonical seed map in O(1) time when indexedDB is undefined', async () => {
    vi.stubGlobal('indexedDB', undefined);

    const result = await hydrateInitialState();
    expect(result).toBeDefined();
    expect(result.nodes.length).toBeGreaterThan(0);
  });
});
