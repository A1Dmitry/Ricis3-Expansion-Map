import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isMobileLayoutViewport, MOBILE_LAYOUT_MEDIA_QUERY, useMobileLayout } from './useMobileLayout';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type ChangeListener = (event: MediaQueryListEvent) => void;

interface MatchMediaHarness {
  readonly matchMedia: ReturnType<typeof vi.fn>;
  readonly addEventListener: ReturnType<typeof vi.fn>;
  readonly removeEventListener: ReturnType<typeof vi.fn>;
  readonly listenerCount: () => number;
  readonly emit: (matches: boolean) => void;
  readonly restore: () => void;
}

function installMatchMedia(initialMatches: boolean): MatchMediaHarness {
  const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia');
  const listeners = new Set<ChangeListener>();
  let matches = initialMatches;

  const addEventListener = vi.fn((type: string, listener: EventListenerOrEventListenerObject | null) => {
    if (type === 'change' && typeof listener === 'function') listeners.add(listener as ChangeListener);
  });
  const removeEventListener = vi.fn((type: string, listener: EventListenerOrEventListenerObject | null) => {
    if (type === 'change' && typeof listener === 'function') listeners.delete(listener as ChangeListener);
  });
  const mediaQueryList = {
    get matches() { return matches; },
    media: MOBILE_LAYOUT_MEDIA_QUERY,
    onchange: null,
    addEventListener,
    removeEventListener,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => true,
  } as unknown as MediaQueryList;
  const matchMedia = vi.fn(() => mediaQueryList);

  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: matchMedia });

  return {
    matchMedia,
    addEventListener,
    removeEventListener,
    listenerCount: () => listeners.size,
    emit: (nextMatches: boolean) => {
      matches = nextMatches;
      for (const listener of listeners) listener({ matches, media: MOBILE_LAYOUT_MEDIA_QUERY } as MediaQueryListEvent);
    },
    restore: () => {
      if (originalDescriptor) Object.defineProperty(window, 'matchMedia', originalDescriptor);
      else Reflect.deleteProperty(window, 'matchMedia');
    },
  };
}

let root: Root | undefined;
let container: HTMLDivElement | undefined;
let harness: MatchMediaHarness | undefined;

function Probe() {
  return React.createElement('output', { 'data-testid': 'mobile-layout-value' }, String(useMobileLayout()));
}

async function mountProbe(): Promise<HTMLDivElement> {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => root?.render(React.createElement(Probe)));
  return container;
}

afterEach(async () => {
  await act(async () => root?.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
  harness?.restore();
  harness = undefined;
  vi.unstubAllGlobals();
});

describe('mobile layout viewport classifier', () => {
  it('uses a compact viewport and coarse-pointer media query', () => {
    expect(MOBILE_LAYOUT_MEDIA_QUERY).toContain('max-width: 767px');
    expect(MOBILE_LAYOUT_MEDIA_QUERY).toContain('pointer: coarse');
  });

  it('returns false without browser media capabilities', () => {
    vi.stubGlobal('window', {});
    expect(isMobileLayoutViewport()).toBe(false);
  });

  it('returns true when the compact touch-first query matches', () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true });
    vi.stubGlobal('window', { matchMedia });

    expect(isMobileLayoutViewport()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith(MOBILE_LAYOUT_MEDIA_QUERY);
  });

  it('keeps desktop layout when the compact query does not match', () => {
    vi.stubGlobal('window', { matchMedia: vi.fn().mockReturnValue({ matches: false }) });
    expect(isMobileLayoutViewport()).toBe(false);
  });

  it('P10A-QA-05: renders initial mobile state from the exact published query', async () => {
    harness = installMatchMedia(true);
    const mounted = await mountProbe();
    expect(mounted.querySelector('[data-testid="mobile-layout-value"]')?.textContent).toBe('true');
    expect(harness.matchMedia).toHaveBeenCalledWith(MOBILE_LAYOUT_MEDIA_QUERY);
  });

  it('P10A-QA-06: renders initial desktop state without a user-agent or width fallback', async () => {
    harness = installMatchMedia(false);
    const mounted = await mountProbe();
    expect(mounted.querySelector('[data-testid="mobile-layout-value"]')?.textContent).toBe('false');
    expect(harness.matchMedia).toHaveBeenCalledWith(MOBILE_LAYOUT_MEDIA_QUERY);
  });

  it('P10A-QA-07: registers one change listener against the media-query instance', async () => {
    harness = installMatchMedia(false);
    await mountProbe();
    expect(harness.addEventListener).toHaveBeenCalledTimes(1);
    expect(harness.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(harness.listenerCount()).toBe(1);
  });

  it('P10A-QA-08: updates the mounted contract for a desktop-to-mobile change event', async () => {
    harness = installMatchMedia(false);
    const mounted = await mountProbe();
    await act(async () => harness?.emit(true));
    expect(mounted.querySelector('[data-testid="mobile-layout-value"]')?.textContent).toBe('true');
  });

  it('P10A-QA-09: updates the mounted contract for a mobile-to-desktop change event', async () => {
    harness = installMatchMedia(true);
    const mounted = await mountProbe();
    await act(async () => harness?.emit(false));
    expect(mounted.querySelector('[data-testid="mobile-layout-value"]')?.textContent).toBe('false');
  });

  it('P10A-QA-10: removes the exact listener on unmount and ignores later synthetic events', async () => {
    harness = installMatchMedia(false);
    await mountProbe();
    expect(harness.listenerCount()).toBe(1);
    await act(async () => root?.unmount());
    root = undefined;
    expect(harness.removeEventListener).toHaveBeenCalledTimes(1);
    expect(harness.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(harness.listenerCount()).toBe(0);
    await act(async () => harness?.emit(true));
    expect(harness.listenerCount()).toBe(0);
  });
});
