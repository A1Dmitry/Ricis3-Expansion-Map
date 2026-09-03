import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KinematicEnginePage } from './KinematicEnginePage';

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

describe('KinematicEnginePage Component', () => {
  it('renders without throwing errors', async () => {
    const onBack = vi.fn();
    const rendered = await render(<KinematicEnginePage onBackToMap={onBack} />);
    expect(rendered.textContent).toContain('RICIS-III Kinematic Dual-Arm Debugger');
  });
});
