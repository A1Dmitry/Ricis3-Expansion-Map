import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RicisTerminalModal } from './RicisTerminalModal';
import { useTerminalStore } from '../store/useTerminalStore';
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
  useTerminalStore.setState({ isOpen: true, history: [] });
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

describe('RicisTerminalModal Component', () => {
  it('does not render when isOpen is false', async () => {
    useTerminalStore.setState({ isOpen: false });
    const rendered = await render(<RicisTerminalModal />);
    expect(rendered.textContent).toBe('');
  });

  it('renders terminal interface and presets when isOpen is true', async () => {
    const rendered = await render(<RicisTerminalModal />);
    expect(rendered.textContent).toContain('A6 Bridge');
    expect(rendered.textContent).toContain('A4 Zero Ratio');
    expect(rendered.textContent).toContain('SP2 Factorization');
  });

  it('allows clicking sandbox presets to fill input', async () => {
    const rendered = await render(<RicisTerminalModal />);
    const buttons = Array.from(rendered.querySelectorAll('button'));
    const a6Btn = buttons.find(b => b.textContent?.includes('A6 Bridge'));
    expect(a6Btn).toBeDefined();

    await act(async () => {
      a6Btn?.click();
    });

    expect(useTerminalStore.getState().currentInput).toBe('0_3 * inf_4');
  });
});
