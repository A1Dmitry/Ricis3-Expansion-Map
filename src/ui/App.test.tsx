import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./lazyNamedComponent', () => ({
  lazyNamedComponent: (_loader: unknown, exportName: string) => {
    return function MockLazyComponent(props: Record<string, unknown>) {
      return React.createElement('div', { 'data-testid': `mock-${exportName}` }, `${exportName}`);
    };
  },
}));

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
    window.history.replaceState({}, '', '/?applet=kinematic');
    const rendered = await render(<App />);
    expect(rendered).toBeDefined();
    expect(rendered.textContent).not.toContain('SURFACE RENDERING ERROR');
  });

  it('renders Seed applet without crashing', async () => {
    window.history.replaceState({}, '', '/?applet=seed');
    const rendered = await render(<App />);
    expect(rendered).toBeDefined();
    expect(rendered.textContent).not.toContain('SURFACE RENDERING ERROR');
  });

  it('renders Roadmap applet without crashing', async () => {
    window.history.replaceState({}, '', '/?applet=roadmap');
    const rendered = await render(<App />);
    expect(rendered).toBeDefined();
    expect(rendered.textContent).not.toContain('SURFACE RENDERING ERROR');
  });

  it('renders Comparison applet without crashing', async () => {
    window.history.replaceState({}, '', '/?applet=comparison');
    const rendered = await render(<App />);
    expect(rendered).toBeDefined();
    expect(rendered.textContent).not.toContain('SURFACE RENDERING ERROR');
  });

  it('renders Voynich, Terminal, QA-Tests, and Settings applets without crashing', async () => {
    for (const applet of ['voynich', 'terminal', 'qa-tests', 'settings']) {
      window.history.replaceState({}, '', `/?applet=${applet}`);
      const rendered = await render(<App />);
      expect(rendered).toBeDefined();
      expect(rendered.textContent).not.toContain('SURFACE RENDERING ERROR');
    }
  });
});
