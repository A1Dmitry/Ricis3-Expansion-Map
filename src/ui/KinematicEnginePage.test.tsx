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
});
