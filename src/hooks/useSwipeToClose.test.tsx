import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSwipeToClose, type SwipeToCloseOptions } from './useSwipeToClose';
import { SWIPE_TO_CLOSE_THRESHOLDS } from './mobileGestures';

// React 19 requires an explicit marker for DOM tests driven through act().
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement | null = null;
let surface: HTMLDivElement | null = null;

function Fixture({ options, children }: { options: SwipeToCloseOptions; children?: React.ReactNode }) {
  const handlers = useSwipeToClose(options);
  return (
    <div data-testid="swipe-surface" {...handlers}>
      {children}
    </div>
  );
}

function mount(options: SwipeToCloseOptions, children?: React.ReactNode) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root?.render(<Fixture options={options} children={children} />));
  surface = container.querySelector<HTMLDivElement>('[data-testid="swipe-surface"]');
  expect(surface).not.toBeNull();
}

type PointerKind = 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel';

function firePointer(
  target: Element,
  type: PointerKind,
  init: { x?: number; y?: number; pointerId?: number; pointerType?: string } = {},
) {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId: init.pointerId ?? 7,
    pointerType: init.pointerType ?? 'touch',
    clientX: init.x ?? 0,
    clientY: init.y ?? 0,
  });
  act(() => {
    target.dispatchEvent(event);
  });
}

function swipe(
  target: Element,
  from: { x: number; y: number },
  to: { x: number; y: number },
  pointerType = 'touch',
) {
  firePointer(target, 'pointerdown', { x: from.x, y: from.y, pointerType });
  firePointer(target, 'pointermove', { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2, pointerType });
  firePointer(target, 'pointerup', { x: to.x, y: to.y, pointerType });
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
  surface = null;
  vi.restoreAllMocks();
});

const farDistance = SWIPE_TO_CLOSE_THRESHOLDS.minDistancePx * 2;

describe('useSwipeToClose touch wiring', () => {
  it('closes the surface on a dominant touch swipe along the dismiss direction', () => {
    const onDismiss = vi.fn();
    mount({ direction: 'down', onDismiss });

    swipe(surface!, { x: 180, y: 100 }, { x: 190, y: 100 + farDistance });

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(surface?.getAttribute('data-swipe-dismiss')).toBe('down');
  });

  it('ignores mouse pointers so desktop interaction is never hijacked', () => {
    const onDismiss = vi.fn();
    mount({ direction: 'down', onDismiss });

    swipe(surface!, { x: 180, y: 100 }, { x: 180, y: 100 + farDistance }, 'mouse');

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('ignores a swipe in the wrong direction or below the minimal distance', () => {
    const onDismiss = vi.fn();
    mount({ direction: 'right', onDismiss });

    swipe(surface!, { x: 100, y: 100 }, { x: 100 - farDistance, y: 100 });
    swipe(surface!, { x: 100, y: 100 }, { x: 100 + SWIPE_TO_CLOSE_THRESHOLDS.minDistancePx - 1, y: 100 });

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('does nothing while the gesture is disabled', () => {
    const onDismiss = vi.fn();
    mount({ direction: 'down', onDismiss, enabled: false });

    swipe(surface!, { x: 100, y: 100 }, { x: 100, y: 100 + farDistance });

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('lets a nested dismissible surface own the gesture', () => {
    const onDismiss = vi.fn();
    mount(
      { direction: 'down', onDismiss },
      <div data-testid="nested-dialog" data-swipe-dismiss="down">nested</div>,
    );
    const nested = surface!.querySelector('[data-testid="nested-dialog"]')!;

    swipe(nested, { x: 100, y: 100 }, { x: 100, y: 100 + farDistance });

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('leaves an in-progress content scroll alone until the scroller reaches its top', () => {
    const onDismiss = vi.fn();
    mount({ direction: 'down', onDismiss }, <div data-testid="scroll-content">content</div>);
    const scroller = surface!.querySelector<HTMLDivElement>('[data-testid="scroll-content"]')!;
    Object.defineProperties(scroller, {
      scrollHeight: { configurable: true, value: 400 },
      clientHeight: { configurable: true, value: 200 },
      scrollTop: { configurable: true, writable: true, value: 48 },
    });

    swipe(scroller, { x: 100, y: 200 }, { x: 100, y: 200 + farDistance });
    expect(onDismiss).not.toHaveBeenCalled();

    scroller.scrollTop = 0;
    swipe(scroller, { x: 100, y: 200 }, { x: 100, y: 200 + farDistance });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('resets tracking on pointercancel and ignores a second pointer mid-gesture', () => {
    const onDismiss = vi.fn();
    mount({ direction: 'right', onDismiss });

    firePointer(surface!, 'pointerdown', { x: 50, y: 50, pointerId: 1 });
    firePointer(surface!, 'pointermove', { x: 50 + farDistance, y: 50, pointerId: 2 });
    firePointer(surface!, 'pointerup', { x: 50 + farDistance, y: 50, pointerId: 2 });
    expect(onDismiss).not.toHaveBeenCalled();

    firePointer(surface!, 'pointerdown', { x: 50, y: 50, pointerId: 1 });
    firePointer(surface!, 'pointercancel', { x: 50, y: 50, pointerId: 1 });
    firePointer(surface!, 'pointerup', { x: 50 + farDistance, y: 50, pointerId: 1 });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('invokes the freshest onDismiss closure without re-binding handlers', () => {
    const first = vi.fn();
    const second = vi.fn();
    mount({ direction: 'down', onDismiss: first });

    act(() => root?.render(<Fixture options={{ direction: 'down', onDismiss: second }} />));
    surface = container!.querySelector<HTMLDivElement>('[data-testid="swipe-surface"]');
    swipe(surface!, { x: 100, y: 100 }, { x: 100, y: 100 + farDistance });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
