import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RicisSeedPage } from './RicisSeedPage';

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

async function click(element: Element): Promise<void> {
  await act(async () => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function buttonByText(rendered: HTMLElement, needle: string): HTMLButtonElement {
  const found = Array.from(rendered.querySelectorAll('button')).find(button => (button.textContent ?? '').includes(needle));
  if (!found) throw new Error(`button not found: ${needle}`);
  return found as HTMLButtonElement;
}

afterEach(async () => {
  if (root) {
    await act(async () => root?.unmount());
  }
  container?.remove();
  root = undefined;
  container = undefined;
});

describe('RicisSeedPage Component', () => {
  it('показывает зерно R0 и каноническую запись протокола', async () => {
    const rendered = await render(<RicisSeedPage onBackToMap={vi.fn()} />);

    expect(rendered.textContent).toContain('RICIS SEED');
    expect(rendered.textContent).toContain('Ric.ExpandTo((x) => x.Resolve(UnsolvedSingularProblem))');
    expect(rendered.textContent).toContain('R0');
    expect(rendered.textContent).toContain('A11');
    expect(rendered.textContent).toContain('Журнал пуст');
  });

  it('выращивает A12 и переводит систему в R1 с записью в журнале', async () => {
    const rendered = await render(<RicisSeedPage onBackToMap={vi.fn()} />);

    await click(buttonByText(rendered, 'Ric.ExpandTo'));

    expect(rendered.textContent).toContain('EXPANDED → R1');
    expect(rendered.textContent).toContain('(0_F/0_G)/(0_H/0_K) = (F*K)/(G*H)');
    expect(rendered.textContent).toContain('MONOTONIC_COMMIT');
    expect(rendered.textContent).not.toContain('Журнал пуст');
    expect(rendered.textContent).toContain('NESTED-SINGULAR-DIV');
  });

  it('отказывает в расширении без доказательства и не двигает поколение', async () => {
    const rendered = await render(<RicisSeedPage onBackToMap={vi.fn()} />);

    await click(buttonByText(rendered, '(0_F)^(inf_G)'));
    await click(buttonByText(rendered, 'Ric.ExpandTo'));

    expect(rendered.textContent).toContain('REJECTED');
    expect(rendered.textContent).toContain('RESOLUTION_REQUIRED');
    expect(rendered.textContent).toContain('Состояние системы не изменилось');
    expect(rendered.textContent).toContain('R0');
  });

  it('блокирует самосертификацию и переопределение защищённого ядра', async () => {
    const rendered = await render(<RicisSeedPage onBackToMap={vi.fn()} />);

    await click(buttonByText(rendered, 'inf_F*0_G'));
    await click(buttonByText(rendered, 'Ric.ExpandTo'));
    expect(rendered.textContent).toContain('SELF_CERTIFICATION');

    await click(buttonByText(rendered, '0_F/0_F'));
    await click(buttonByText(rendered, 'Ric.ExpandTo'));
    expect(rendered.textContent).toContain('PROTECTED_CORE_MUTATION');
  });

  it('возвращается к зерну кнопкой сброса', async () => {
    const rendered = await render(<RicisSeedPage onBackToMap={vi.fn()} />);

    await click(buttonByText(rendered, 'Ric.ExpandTo'));
    expect(rendered.textContent).toContain('EXPANDED → R1');

    await click(buttonByText(rendered, 'Сброс к зерну'));
    expect(rendered.textContent).toContain('Журнал пуст');
    expect(rendered.textContent).toContain('R0');
  });

  it('кнопка возврата на карту вызывает переданный обработчик', async () => {
    const onBack = vi.fn();
    const rendered = await render(<RicisSeedPage onBackToMap={onBack} />);

    await click(buttonByText(rendered, 'Карта'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
