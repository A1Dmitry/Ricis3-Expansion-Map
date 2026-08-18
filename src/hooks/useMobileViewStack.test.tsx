import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { useMobileViewStack, type MobileView } from './useMobileViewStack';

// React 19 requires an explicit marker for DOM tests driven through act().
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement | null = null;
let latest: ReturnType<typeof useMobileViewStack> | null = null;

function Fixture({ enabled }: { enabled: boolean }) {
  latest = useMobileViewStack(enabled);
  return null;
}

function mount(enabled = true) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root?.render(<Fixture enabled={enabled} />));
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
  latest = null;
  window.history.replaceState(null, '', '/');
});

describe('mobile view history stack', () => {
  it('pushes a menu view and follows browser popstate back to the map screen', () => {
    window.history.replaceState({ ricisMobileView: 'map' }, '', '/');
    mount();

    expect(latest?.view).toBe('map');
    act(() => latest?.open('menu'));
    expect(latest?.view).toBe('menu');
    expect(window.history.state.ricisMobileView).toBe('menu');

    act(() => {
      window.history.replaceState({ ricisMobileView: 'map' }, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(latest?.view).toBe('map');
  });

  it('resets to map and does not push browser history when mobile shell is disabled', () => {
    window.history.replaceState({ ricisMobileView: 'map' }, '', '/');
    mount(false);
    const stateBefore = window.history.state;

    act(() => latest?.open('details' as MobileView));

    expect(latest?.view).toBe('map');
    expect(window.history.state).toEqual(stateBefore);
    expect(latest?.back()).toBe(false);
  });
});
