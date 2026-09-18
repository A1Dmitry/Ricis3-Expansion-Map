import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KinematicEnginePage } from './KinematicEnginePage';
import { RICIS_COMMAND_EVENTS, dispatchRicisCommand, subscribeRicisCommand } from '../services/commandBus';

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

/** Finds a button by (partial) visible text and fails loudly if absent. */
function clickButton(container: HTMLElement, text: string): void {
  const button = Array.from(container.querySelectorAll('button')).find(b =>
    (b.textContent ?? '').includes(text)
  );
  if (!button) {
    throw new Error(`Button with text "${text}" not found in rendered page`);
  }
  button.click();
}

describe('KinematicEnginePage Component', () => {
  it('renders without throwing errors', async () => {
    const onBack = vi.fn();
    const rendered = await render(<KinematicEnginePage onBackToMap={onBack} />);
    expect(rendered.textContent).toContain('RICIS-III Kinematic Dual-Arm Debugger');
  });

  it('subscribes to command bus events: toggle play/pause, reset, step (BUG-02)', async () => {
    const rendered = await render(<KinematicEnginePage onBackToMap={() => undefined} />);

    // The loop starts running by default: the button must offer "Пауза".
    expect(rendered.textContent).toContain('Пауза');

    // ricis:kinematic-toggle-play -> pauses the simulation.
    await act(async () => {
      dispatchRicisCommand(RICIS_COMMAND_EVENTS.kinematicTogglePlay);
    });
    expect(rendered.textContent).toContain('Старт');

    // ricis:kinematic-step -> single integration step while paused (must not throw).
    await act(async () => {
      dispatchRicisCommand(RICIS_COMMAND_EVENTS.kinematicStep);
    });
    expect(rendered.textContent).toContain('Старт');

    // ricis:kinematic-toggle-play -> resumes.
    await act(async () => {
      dispatchRicisCommand(RICIS_COMMAND_EVENTS.kinematicTogglePlay);
    });
    expect(rendered.textContent).toContain('Пауза');

    // ricis:kinematic-reset -> resets joints/telemetry (must not throw).
    await act(async () => {
      dispatchRicisCommand(RICIS_COMMAND_EVENTS.kinematicReset);
    });
    expect(rendered.textContent).toContain('RICIS-III Kinematic Dual-Arm Debugger');
  });

  it('reports the simulation loop state back on the command bus', async () => {
    const reported: boolean[] = [];
    const unsubscribe = subscribeRicisCommand(RICIS_COMMAND_EVENTS.kinematicRunningChanged, detail => {
      reported.push(Boolean(detail?.isRunning));
    });

    await render(<KinematicEnginePage onBackToMap={() => undefined} />);
    // Initial mount reports the default running state.
    expect(reported).toContain(true);

    await act(async () => {
      dispatchRicisCommand(RICIS_COMMAND_EVENTS.kinematicTogglePlay);
    });
    expect(reported[reported.length - 1]).toBe(false);

    unsubscribe();
  });

  it('renders the live dual-arm simulation canvas in pick-and-place viewport (KINEBUG-01 regression)', async () => {
    const rendered = await render(<KinematicEnginePage onBackToMap={() => undefined} />);

    // RobotArm3DCanvas must be mounted (2D schematic fallback in jsdom): its legend
    // and the presentation-mode switcher are the observable DOM markers.
    expect(rendered.textContent).toContain('RICIS-III Arm');
    expect(rendered.textContent).toContain('2D Схема (XY & RZ)');

    // The modular analysis canvas HUD must NOT own the main viewport in simulation modes.
    expect(rendered.textContent).not.toContain('3D Manipulator View');
  });

  it('routes the walkthrough viewport to the 3-link planar analysis canvas', async () => {
    const rendered = await render(<KinematicEnginePage onBackToMap={() => undefined} />);

    await act(async () => {
      clickButton(rendered, '2-Stage RICIS Walkthrough');
    });

    // PlanarManipulatorCanvas banner marks the modular planar workspace.
    expect(rendered.textContent).toContain('Active Parameterization:');
    expect(rendered.textContent).not.toContain('2D Схема (XY & RZ)');
  });

  it('keeps a 5-DOF joint vector in the 5-link module and hides the 3-DOF heatmap (joint truncation guard)', async () => {
    const rendered = await render(<KinematicEnginePage onBackToMap={() => undefined} />);

    // Default 3-link module: θ₂×θ₃ heatmap and 3-DOF controller are visible.
    expect(rendered.textContent).toContain('σ_min Landscape');
    expect(rendered.textContent).toContain('Управление сочленениями (3-DOF)');

    await act(async () => {
      clickButton(rendered, '5-Link Hyper-Redundant (READY)');
    });

    // Selecting the module opens its modular workspace view.
    expect(rendered.textContent).toContain('3D Manipulator View');
    // Joint vector must remain 5-DOF (heatmap click truncation bug regression guard).
    expect(rendered.textContent).toContain('Управление сочленениями (5-DOF)');
    // The θ₂×θ₃ slice is mathematically defined for 3 DOF only — hidden for 5-link.
    expect(rendered.textContent).not.toContain('σ_min Landscape');

    await act(async () => {
      clickButton(rendered, '3-Link Planar (READY)');
    });
    expect(rendered.textContent).toContain('Управление сочленениями (3-DOF)');
    expect(rendered.textContent).toContain('σ_min Landscape');
  });

  it('shows the IoC stub for the IN-DEV spatial module instead of a broken canvas', async () => {
    const rendered = await render(<KinematicEnginePage onBackToMap={() => undefined} />);

    await act(async () => {
      clickButton(rendered, 'Spatial 6-DOF (IN DEV)');
    });

    expect(rendered.textContent).toContain('IN DEVELOPMENT');
    expect(rendered.textContent).not.toContain('3D Manipulator View');
  });

  it('switches to the falling-ball interception scenario with its own HUD counters', async () => {
    const rendered = await render(<KinematicEnginePage onBackToMap={() => undefined} />);

    await act(async () => {
      clickButton(rendered, 'Теннисная пушка');
    });

    // The scenario keeps the physics viewport mounted and exposes its own telemetry:
    // ballistic phase label, mid-air catch counter and delivered-vs-planned counter.
    expect(rendered.textContent).toContain('RICIS-III Arm');
    expect(rendered.textContent).toContain('Фаза:');
    expect(rendered.textContent).toContain('Поймано на лету');
    expect(rendered.textContent).toContain('Доставлено');
  });
});
