import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoadmapPage } from './RoadmapPage';
import { useMapStore } from '../store/mapStore';
import { deepCopyInitialMap } from '../model/initialMap';

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

beforeEach(() => {
  useMapStore.setState(deepCopyInitialMap());
});

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

  it('BUG-04: mode=challenge открывает контур открытых задач узла (параметр больше не призрак)', async () => {
    const onBack = vi.fn();
    const rendered = await render(
      <RoadmapPage
        contextNodeId="core-agi-target"
        initialRootNodeId={null}
        initialMode="challenge"
        onBackToMap={onBack}
      />
    );

    // Challenge banner is visible and the root contour is opened immediately.
    expect(rendered.textContent).toContain('Режим Challenge');
    expect(rendered.textContent).toContain('Режим «Связанные с корнем»');
  });

  it('performs internal SPA navigation when explore/verify buttons are clicked without browser reload', async () => {
    const onBack = vi.fn();
    const onNavigate = vi.fn();
    const rendered = await render(
      <RoadmapPage
        contextNodeId="core-agi-target"
        initialRootNodeId={null}
        onBackToMap={onBack}
        onNavigateToMap={onNavigate}
      />
    );

    const buttons = Array.from(rendered.querySelectorAll('button'));
    const exploreBtn = buttons.find(b => b.textContent?.includes('Открыть карту'));
    expect(exploreBtn).toBeDefined();

    await act(async () => {
      exploreBtn?.click();
    });

    expect(onNavigate).toHaveBeenCalledWith('core-agi-target', 'explore');
  });

  it('calls onBackToMap when no explicit onNavigateToMap callback is provided', async () => {
    const onBack = vi.fn();
    const rendered = await render(
      <RoadmapPage
        contextNodeId="core-agi-target"
        initialRootNodeId={null}
        onBackToMap={onBack}
      />
    );

    const buttons = Array.from(rendered.querySelectorAll('button'));
    const verifyBtn = buttons.find(b => b.textContent?.includes('Открыть проверку'));
    expect(verifyBtn).toBeDefined();

    await act(async () => {
      verifyBtn?.click();
    });

    expect(onBack).toHaveBeenCalled();
  });
});
