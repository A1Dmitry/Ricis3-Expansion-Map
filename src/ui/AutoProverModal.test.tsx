import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AutoProverModal } from './AutoProverModal';
import { useMapStore } from '../store/mapStore';
import { deepCopyInitialMap } from '../model/initialMap';

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
  useMapStore.setState(deepCopyInitialMap());
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

describe('AutoProverModal Component', () => {
  it('renders null when isOpen is false', async () => {
    const onClose = vi.fn();
    const rendered = await render(<AutoProverModal isOpen={false} onClose={onClose} />);
    expect(rendered.innerHTML).toBe('');
  });

  it('renders modal header, centrality scores, and controls when isOpen is true', async () => {
    const onClose = vi.fn();
    const rendered = await render(<AutoProverModal isOpen={true} onClose={onClose} />);

    expect(rendered.textContent).toContain('RICIS-III Auto Prover Engine');
    expect(rendered.textContent).toContain('Фрактальная центральность');
    expect(rendered.textContent).toContain('Запустить Auto Prover');
  });

  it('triggers onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const rendered = await render(<AutoProverModal isOpen={true} onClose={onClose} />);

    const buttons = Array.from(rendered.querySelectorAll('button'));
    const closeBtn = buttons.find(b => b.querySelector('svg') !== null || b.textContent === '');
    expect(closeBtn).toBeDefined();

    await act(async () => {
      closeBtn?.click();
    });

    expect(onClose).toHaveBeenCalled();
  });
});
