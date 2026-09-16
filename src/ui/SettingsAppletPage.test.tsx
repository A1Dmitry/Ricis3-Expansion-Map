import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsAppletPage } from './SettingsAppletPage';
import { useI18nStore } from '../store/useI18nStore';

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

function buttonByText(rendered: HTMLElement, needle: string): HTMLButtonElement {
  const found = Array.from(rendered.querySelectorAll('button')).find(button => (button.textContent ?? '').includes(needle));
  if (!found) throw new Error(`button not found: ${needle}`);
  return found as HTMLButtonElement;
}

function setInputValue(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

afterEach(async () => {
  if (root) {
    await act(async () => root?.unmount());
  }
  container?.remove();
  root = undefined;
  container = undefined;
});

describe('SettingsAppletPage (BUG-03: real props instead of stub)', () => {
  beforeEach(() => {
    localStorage.clear();
    // Deterministic Russian labels for text assertions.
    useI18nStore.getState().setLocale('ru');
  });

  it('renders the settings surface with real adaptive roles (not an empty list)', async () => {
    const rendered = await render(<SettingsAppletPage onBackToMap={vi.fn()} />);

    // Default adaptive roles must be visible (the stub passed roles={[]}).
    expect(rendered.textContent).toContain('Общий профиль');
  });

  it('a role created from the applet really appears in the list and persists', async () => {
    const rendered = await render(<SettingsAppletPage onBackToMap={vi.fn()} />);

    await act(async () => {
      buttonByText(rendered, 'Создать новый').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const nameInput = rendered.querySelector('form input[type="text"]') as HTMLInputElement | null;
    expect(nameInput).not.toBeNull();

    await act(async () => {
      setInputValue(nameInput!, 'Профиль аудита');
    });
    await act(async () => {
      // Submit button inside the creation form.
      nameInput!.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    // The freshly created role must be listed (BUG-03: it silently vanished before).
    expect(rendered.textContent).toContain('Профиль аудита');

    // And it must be persisted for Map3D / next mounts.
    const stored = localStorage.getItem('ricis_adaptive_ui');
    expect(stored).toContain('Профиль аудита');
  });

  it('exposes the panel visibility section with all five map panels', async () => {
    const rendered = await render(<SettingsAppletPage onBackToMap={vi.fn()} />);
    const panelLabels = Array.from(rendered.querySelectorAll('button')).map(button => button.textContent ?? '');
    // The five shared settings elements must be toggleable (stub hid this section).
    for (const labelPart of ['Быстрые действия', 'Сферы науки', 'Доступно к решению', 'ИИ-Агент', 'Сохранение']) {
      expect(panelLabels.some(text => text.includes(labelPart))).toBe(true);
    }
  });
});
