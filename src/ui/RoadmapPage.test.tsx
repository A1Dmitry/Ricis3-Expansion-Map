import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RoadmapPage } from './RoadmapPage';
import { useMapStore } from '../store/mapStore';

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

describe('RoadmapPage Component', () => {
  it('renders without throwing invalid hook call errors', async () => {
    const onBack = vi.fn();
    const rendered = await render(
      <RoadmapPage
        contextNodeId={null}
        initialRootNodeId={null}
        onBackToMap={onBack}
      />
    );

    expect(rendered.textContent).toContain('Выберите удобный способ работы');
    expect(rendered.textContent).toContain('Исследовать карту');
    expect(rendered.textContent).toContain('Проверить утверждение');
  });

  it('renders correctly with an initial root node', async () => {
    const onBack = vi.fn();
    const rendered = await render(
      <RoadmapPage
        contextNodeId="core-agi-target"
        initialRootNodeId="core-agi-target"
        onBackToMap={onBack}
      />
    );

    expect(rendered.textContent).toContain('Режим «Связанные с корнем»');
  });
});
