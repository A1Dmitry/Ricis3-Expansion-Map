import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LanguageToggle } from './LanguageToggle';
import { useI18nStore } from '../store/useI18nStore';

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
  useI18nStore.setState({ locale: 'ru' });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  useI18nStore.setState({ locale: 'ru' });
  if (root) {
    await act(async () => root?.unmount());
  }
  container?.remove();
  container = null;
  root = null;
});

describe('LanguageToggle Component', () => {
  it('renders RU and EN buttons', async () => {
    const rendered = await render(<LanguageToggle />);
    expect(rendered.textContent).toContain('RU');
    expect(rendered.textContent).toContain('EN');
  });

  it('switches locale between RU and EN when clicked', async () => {
    const rendered = await render(<LanguageToggle />);
    const buttons = Array.from(rendered.querySelectorAll('button'));
    const enBtn = buttons.find(b => b.textContent?.trim() === 'EN');
    const ruBtn = buttons.find(b => b.textContent?.trim() === 'RU');

    expect(enBtn).toBeDefined();
    expect(ruBtn).toBeDefined();

    await act(async () => {
      enBtn?.click();
    });
    expect(useI18nStore.getState().locale).toBe('en');

    await act(async () => {
      ruBtn?.click();
    });
    expect(useI18nStore.getState().locale).toBe('ru');
  });
});
