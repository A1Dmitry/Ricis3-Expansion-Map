import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { CompactCommandMenuBar } from './CompactCommandMenuBar';
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

describe('CompactCommandMenuBar', () => {
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

  it('renders menu bar with brand title, build badge, and main top menu categories', async () => {
    const onSelectApplet = vi.fn();
    const rendered = await render(
      <CompactCommandMenuBar
        activeApplet="map"
        onSelectApplet={onSelectApplet}
        commandContext={mockContext}
        appBuildLabel="v7.7.4-seed-persistent"
      />
    );

    expect(rendered.textContent).toContain('RICIS-III');
    expect(rendered.textContent).toContain('v7.7.4-seed-persistent');
    expect(rendered.textContent).toContain('Файл');
    expect(rendered.textContent).toContain('Вид');
    expect(rendered.textContent).toContain('Кинематика');
    expect(rendered.textContent).toContain('Основания');
    expect(rendered.textContent).toContain('Сервис');
    expect(rendered.textContent).toContain('3D Граф');
  });

  it('opens kinematics dropdown and navigates to kinematic applet', async () => {
    const onSelectApplet = vi.fn();
    const rendered = await render(
      <CompactCommandMenuBar
        activeApplet="map"
        onSelectApplet={onSelectApplet}
        commandContext={mockContext}
      />
    );

    const kinematicsMenuBtn = Array.from(rendered.querySelectorAll('button')).find(
      btn => btn.textContent?.trim() === 'Кинематика'
    );
    expect(kinematicsMenuBtn).toBeDefined();

    await act(async () => {
      kinematicsMenuBtn?.click();
    });

    const modelOption = Array.from(rendered.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('3-Link Planar')
    );
    expect(modelOption).toBeDefined();

    await act(async () => {
      modelOption?.click();
    });

    expect(onSelectApplet).toHaveBeenCalledWith('kinematic');
  });
});
