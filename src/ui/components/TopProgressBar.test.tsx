import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TopProgressBar } from './TopProgressBar';
import { getProgressBar } from '../../services/progressBar/progressBarService';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

async function render(element: React.ReactElement): Promise<HTMLDivElement> {
  const renderedContainer = container!;
  await act(async () => {
    root?.render(element);
  });
  return renderedContainer;
}

beforeEach(() => {
  const bar = getProgressBar();
  bar.finishTask();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  if (root) {
    await act(async () => root?.unmount());
  }
  container?.remove();
  container = null;
  root = null;
});

describe('TopProgressBar UI Component', () => {
  it('renders nothing when status is idle', async () => {
    const rendered = await render(<TopProgressBar />);
    expect(rendered.innerHTML).toBe('');
  });

  it('renders active task with title, percentage, and message when running', async () => {
    const bar = getProgressBar();
    await act(async () => {
      bar.startTask('auto-prover', 'Auto Prover Engine v7.7', 100);
      bar.updateProgress(45, 100, 'Синтез Lean 4 доказательств');
    });

    const rendered = await render(<TopProgressBar />);
    expect(rendered.textContent).toContain('Auto Prover Engine v7.7');
    expect(rendered.textContent).toContain('Синтез Lean 4 доказательств');
    expect(rendered.textContent).toContain('45%');
    expect(rendered.textContent).toContain('[45/100]');
  });

  it('shows cancellation button when cancellable and triggers onCancel', async () => {
    const bar = getProgressBar();
    const onCancelMock = vi.fn();

    await act(async () => {
      bar.startTask('cancel-task', 'Долгая задача', 10, onCancelMock);
    });

    const rendered = await render(<TopProgressBar />);
    const cancelBtn = rendered.querySelector('button[title="Прервать выполнение"]');
    expect(cancelBtn).toBeDefined();

    await act(async () => {
      (cancelBtn as HTMLButtonElement)?.click();
    });

    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });
});
