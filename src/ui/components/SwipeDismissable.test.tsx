import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SwipeDismissable } from './SwipeDismissable';
import { SWIPE_TO_CLOSE_THRESHOLDS } from '../../hooks/mobileGestures';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function mount(props: { direction?: 'left' | 'right' | 'up' | 'down'; onDismiss: () => void; enabled?: boolean }) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root?.render(
      <SwipeDismissable
        direction={props.direction ?? 'down'}
        onDismiss={props.onDismiss}
        enabled={props.enabled}
      >
        <div data-testid="wrapped-overlay" className="fixed inset-0">overlay</div>
      </SwipeDismissable>,
    ),
  );
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

function swipeOverlay(from: { x: number; y: number }, to: { x: number; y: number }) {
  const overlay = container!.querySelector('[data-testid="wrapped-overlay"]')!;
  for (const [type, point] of [['pointerdown', from], ['pointermove', to], ['pointerup', to]] as const) {
    act(() => {
      overlay.dispatchEvent(new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 3,
        pointerType: 'touch',
        clientX: point.x,
        clientY: point.y,
      }));
    });
  }
}

describe('SwipeDismissable wrapper', () => {
  it('keeps a zero-layout wrapper and marks the surface with the dismiss direction', () => {
    mount({ onDismiss: vi.fn() });
    const wrapper = container!.querySelector('[data-swipe-dismiss]')!;

    expect(wrapper.className).toBe('contents');
    expect(wrapper.getAttribute('data-swipe-dismiss')).toBe('down');
    expect(container!.querySelector('[data-testid="wrapped-overlay"]')).not.toBeNull();
  });

  it('dismisses the wrapped overlay on a bubbled touch swipe from the fixed child', () => {
    const onDismiss = vi.fn();
    mount({ onDismiss });
    const distance = SWIPE_TO_CLOSE_THRESHOLDS.minDistancePx * 2;

    swipeOverlay({ x: 100, y: 120 }, { x: 100, y: 120 + distance });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('stays inert for mouse pointers and while disabled', () => {
    const onDismiss = vi.fn();
    mount({ onDismiss, enabled: false });
    const distance = SWIPE_TO_CLOSE_THRESHOLDS.minDistancePx * 2;

    swipeOverlay({ x: 100, y: 120 }, { x: 100, y: 120 + distance });

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
