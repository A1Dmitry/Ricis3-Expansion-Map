// @vitest-environment jsdom
// ============================================================================
// BUG-13 REGRESSION: `?mode=` must follow SPA navigation, not just the
// first mount. The hook subscribes to `popstate` (dispatched by
// UrlShareService.updateBrowserUrl after every internal URL rewrite).
// ============================================================================

import React, { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useUrlModeSync, urlModeOpensProof } from './useUrlModeSync';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Probe({ initialOpen }: { initialOpen: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  useUrlModeSync(setOpen);
  return <span data-testid="mode-open">{String(open)}</span>;
}

function navigate(search: string): void {
  act(() => {
    window.history.pushState({}, '', search);
    // Exact event UrlShareService.updateBrowserUrl dispatches after replaceState
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
}

describe('BUG-13: useUrlModeSync', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    window.history.replaceState({}, '', '/');
  });

  it('opens the panel on SPA navigation to ?mode=verify', () => {
    act(() => root.render(<Probe initialOpen={false} />));
    navigate('/?mode=verify');
    expect(container.querySelector('[data-testid="mode-open"]')?.textContent).toBe('true');
  });

  it('opens for legacy ?mode=proof as well', () => {
    act(() => root.render(<Probe initialOpen={false} />));
    navigate('/?mode=proof');
    expect(container.querySelector('[data-testid="mode-open"]')?.textContent).toBe('true');
  });

  it('closes the panel on navigation to ?mode=challenge', () => {
    act(() => root.render(<Probe initialOpen={true} />));
    navigate('/?mode=challenge');
    expect(container.querySelector('[data-testid="mode-open"]')?.textContent).toBe('false');
  });

  it('closes the panel when the mode parameter is removed', () => {
    act(() => root.render(<Probe initialOpen={true} />));
    navigate('/?applet=map');
    expect(container.querySelector('[data-testid="mode-open"]')?.textContent).toBe('false');
  });

  it('unsubscribes on unmount', () => {
    act(() => root.render(<Probe initialOpen={false} />));
    act(() => root.unmount());
    // No error and no state updates after unmount
    expect(() => navigate('/?mode=verify')).not.toThrow();
  });
});

describe('BUG-13: urlModeOpensProof (pure)', () => {
  it('verify/proof open, everything else closes', () => {
    expect(urlModeOpensProof('verify')).toBe(true);
    expect(urlModeOpensProof('proof')).toBe(true);
    expect(urlModeOpensProof('challenge')).toBe(false);
    expect(urlModeOpensProof('explore')).toBe(false);
    expect(urlModeOpensProof(null)).toBe(false);
    expect(urlModeOpensProof('')).toBe(false);
  });
});
