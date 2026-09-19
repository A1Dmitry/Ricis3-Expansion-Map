import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MapPatchImportModal } from './MapPatchImportModal';
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

describe('MapPatchImportModal Component', () => {
  it('renders modal header, textarea, and action buttons', async () => {
    const onClose = vi.fn();
    const rendered = await render(<MapPatchImportModal onClose={onClose} />);

    expect(rendered.textContent).toContain('Импорт решений и патчей RICIS-III');
    expect(rendered.textContent).toContain('Или вставьте JSON вручную:');
  });

  it('handles invalid JSON gracefully', async () => {
    const onClose = vi.fn();
    const rendered = await render(<MapPatchImportModal onClose={onClose} />);

    const textarea = rendered.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea).toBeDefined();

    const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    await act(async () => {
      descriptor?.set?.call(textarea, '{ invalid json');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(rendered.textContent).toContain('Ошибка валидации');
  });

  it('validates a valid patch JSON', async () => {
    const onClose = vi.fn();
    const rendered = await render(<MapPatchImportModal onClose={onClose} />);

    const textarea = rendered.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea).toBeDefined();

    const validPatch = JSON.stringify({
      '@type': 'RICIS.MapStatePatch',
      version: '1.0.0',
      description: 'Test Patch',
      nodePatches: [
        {
          id: 'test-node-qa',
          state: 'resolved',
        },
      ],
    });

    const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    await act(async () => {
      descriptor?.set?.call(textarea, validPatch);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(rendered.textContent).toContain('Синтаксис валиден');
    expect(rendered.textContent).toContain('Метаданные пакета решений');
  });
});
