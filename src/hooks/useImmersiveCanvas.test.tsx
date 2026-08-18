import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useImmersiveCanvas } from './useImmersiveCanvas';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement | null = null;
let latest: ReturnType<typeof useImmersiveCanvas> | null = null;

function Fixture() {
  latest = useImmersiveCanvas();
  return null;
}

function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root?.render(<Fixture />));
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
  latest = null;
  Reflect.deleteProperty(document, 'fullscreenEnabled');
  vi.restoreAllMocks();
});

describe('immersive canvas fallback', () => {
  it('uses an in-app immersive state and returns from it when the Fullscreen API is unavailable', async () => {
    mount();
    const surface = document.createElement('div');
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: false });

    await act(async () => {
      await latest?.toggle(surface);
    });
    expect(latest?.isImmersive).toBe(true);

    await act(async () => {
      await latest?.exit();
    });
    expect(latest?.isImmersive).toBe(false);
  });
});
