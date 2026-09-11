import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

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

describe('App Root Component', () => {
  it('renders App without crashing', async () => {
    const rendered = await render(<App />);
    expect(rendered).toBeDefined();
    expect(rendered.textContent).not.toContain('SURFACE RENDERING ERROR');
  });

  it('renders Kinematic view without crashing', async () => {
    window.history.replaceState({}, '', '/?view=kinematic');
    const rendered = await render(<App />);
    expect(rendered).toBeDefined();
    expect(rendered.textContent).not.toContain('SURFACE RENDERING ERROR');
  });
});
