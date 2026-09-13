import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AppletActionToolbar } from './AppletActionToolbar';
import type { CommandContext } from '../../types/commandTypes';

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

describe('AppletActionToolbar', () => {
  const mockContext: CommandContext = {
    activeApplet: 'map',
    is3DMode: true,
    isSimulationRunning: false,
    onSelectApplet: vi.fn(),
    onToggle3DMode: vi.fn(),
    onResetCamera: vi.fn(),
    onToggleSimulation: vi.fn(),
    onResetSimulation: vi.fn(),
    onStepSimulation: vi.fn(),
    onSearchNodes: vi.fn(),
    onRunProver: vi.fn(),
    onClearTerminal: vi.fn(),
    onRunDiagnostics: vi.fn(),
  };

  it('renders toolbar with map actions when activeApplet is map', async () => {
    const rendered = await render(
      <AppletActionToolbar activeApplet="map" commandContext={mockContext} />
    );

    expect(rendered.querySelector('[data-testid="applet-action-toolbar"]')).toBeDefined();
    expect(rendered.textContent).toContain('3D / 2D');
    expect(rendered.textContent).toContain('Сброс Камеры');
  });

  it('renders toolbar with kinematic actions when activeApplet is kinematic', async () => {
    const kinContext: CommandContext = {
      ...mockContext,
      activeApplet: 'kinematic',
    };

    const rendered = await render(
      <AppletActionToolbar activeApplet="kinematic" commandContext={kinContext} />
    );

    expect(rendered.textContent).toContain('Запуск / Пауза');
    expect(rendered.textContent).toContain('Сброс Шарниров');
  });
});
