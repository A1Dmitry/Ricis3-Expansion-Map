import React, { lazy } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { RouteSurfaceBoundary } from './RouteSurfaceBoundary';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let container: HTMLDivElement | undefined;

async function render(element: React.ReactNode): Promise<HTMLDivElement> {
  const renderedContainer = document.createElement('div');
  document.body.append(renderedContainer);
  const renderedRoot = createRoot(renderedContainer);
  root = renderedRoot;
  container = renderedContainer;

  await act(async () => {
    renderedRoot.render(element);
  });

  return renderedContainer;
}

afterEach(async () => {
  if (root) {
    await act(async () => root?.unmount());
  }
  container?.remove();
  root = undefined;
  container = undefined;
});

describe('RouteSurfaceBoundary', () => {
  it('exposes one route-neutral, polite loading status while a selected route component chunk is pending', async () => {
    const PendingRouteSurface = lazy(() => new Promise<{ default: React.ComponentType }>(() => undefined));
    const renderedContainer = await render(
      React.createElement(RouteSurfaceBoundary, null, React.createElement(PendingRouteSurface)),
    );

    const status = renderedContainer.querySelector<HTMLElement>('[role="status"]');
    expect(status).not.toBeNull();
    expect(status?.getAttribute('aria-live')).toBe('polite');
    expect(status?.textContent).toBe('RICIS-III // loading application surface…');
    expect(status?.textContent).not.toMatch(/IndexedDB|proof|Core|Lean|verified/i);
  });
});
