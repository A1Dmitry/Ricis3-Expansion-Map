import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VoynichDecryptionPanel } from './VoynichDecryptionPanel';

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

describe('VoynichDecryptionPanel Component', () => {
  it('renders header, title, and default hierarchy tab', async () => {
    const onClose = vi.fn();
    const rendered = await render(<VoynichDecryptionPanel onClose={onClose} />);

    expect(rendered.textContent).toContain('Дешифровка Рукописи Войнича');
    expect(rendered.textContent).toContain('EVA Genome Monolith');
    expect(rendered.textContent).toContain('5-Уровневая Иерархия');
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const rendered = await render(<VoynichDecryptionPanel onClose={onClose} />);

    const buttons = Array.from(rendered.querySelectorAll('button'));
    const closeBtn = buttons.find(b => b.textContent?.includes('Закрыть'));
    expect(closeBtn).toBeDefined();

    await act(async () => {
      closeBtn?.click();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('switches between all tabs in Voynich panel', async () => {
    const rendered = await render(<VoynichDecryptionPanel />);
    const buttons = Array.from(rendered.querySelectorAll('button'));

    // 1. Folios tab
    const foliosBtn = buttons.find(b => b.textContent?.includes('33 Фолианта'));
    expect(foliosBtn).toBeDefined();
    await act(async () => {
      foliosBtn?.click();
    });
    expect(rendered.textContent).toContain('Дешифрованные страницы');

    // 2. Stacks tab
    const stacksBtn = buttons.find(b => b.textContent?.includes('8 Forth Стеков'));
    expect(stacksBtn).toBeDefined();
    await act(async () => {
      stacksBtn?.click();
    });
    expect(rendered.textContent).toContain('Интерактивный маршрутизатор EVA-токенов');

    // 3. Macros tab
    const macrosBtn = buttons.find(b => b.textContent?.includes('Макросы M1–M5'));
    expect(macrosBtn).toBeDefined();
    await act(async () => {
      macrosBtn?.click();
    });
    expect(rendered.textContent).toContain('Паттерн:');

    // 4. Economic tab
    const economicBtn = buttons.find(b => b.textContent?.includes('Экономика'));
    expect(economicBtn).toBeDefined();
    await act(async () => {
      economicBtn?.click();
    });
    expect(rendered.textContent).toContain('Экономический профиль дешифровки');

    // 5. Simulator tab
    const simBtn = buttons.find(b => b.textContent?.includes('Симулятор LENR'));
    expect(simBtn).toBeDefined();
    await act(async () => {
      simBtn?.click();
    });
    expect(rendered.textContent).toContain('Симулятор Кавитационной Ячейки LENR');
  });

  it('interacts with test token input to route tokens in stacks tab', async () => {
    const rendered = await render(<VoynichDecryptionPanel />);
    const buttons = Array.from(rendered.querySelectorAll('button'));
    const stacksBtn = buttons.find(b => b.textContent?.includes('8 Forth Стеков'));
    await act(async () => {
      stacksBtn?.click();
    });

    const input = rendered.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input).toBeDefined();

    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    await act(async () => {
      descriptor?.set?.call(input, 'chol');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(rendered.textContent).toContain('направлен в стек:');
  });
});
