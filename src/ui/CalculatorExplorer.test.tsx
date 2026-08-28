import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useI18nStore } from '../store/useI18nStore';
import type { SupportedLocale, TranslationKey } from '../model/i18n.types';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type ExplorerEntry = Readonly<{
  readonly monolith: Readonly<{ readonly id: string; readonly title: Readonly<{ readonly ru: string; readonly en: string }>; readonly calculator: Readonly<{ readonly mode: string }> }>;
  readonly nodeId: string;
  readonly semanticIndexExpression: string;
  readonly launch: Readonly<{ readonly kind: 'READY' | 'UNCONFIGURED' | 'REJECTED'; readonly href?: string; readonly reason?: string }>;
  readonly researchOnlyDisclosure: string;
}>;

interface CalculatorExplorerModule {
  CalculatorExplorer: React.ComponentType<{
    readonly isOpen: boolean;
    readonly entries: readonly ExplorerEntry[];
    readonly locale: SupportedLocale;
    readonly t: (key: TranslationKey, params?: Record<string, string | number>) => string;
    readonly onClose: () => void;
    readonly onSelectNode: (nodeId: string) => void;
  }>;
}

const CONTRACT_PATH = './CalculatorExplorer';
const future = () => import(/* @vite-ignore */ CONTRACT_PATH) as Promise<CalculatorExplorerModule>;

const entries: readonly ExplorerEntry[] = Object.freeze([
  { monolith: { id: 'calculator-complex_analysis', title: { ru: 'Существенная комплексная сингулярность', en: 'Essential Complex Singularity' }, calculator: { mode: 'COMPLEX_ANALYSIS' } }, nodeId: 'calculator-node-complex-analysis', semanticIndexExpression: 'exp(1/z)', launch: { kind: 'UNCONFIGURED', reason: 'calculator_base_url_missing' }, researchOnlyDisclosure: 'Источник-обусловленная визуализация исследования.' },
  { monolith: { id: 'calculator-kinematic', title: { ru: 'Кинематический мономолит манипулятора', en: 'Robot Manipulator Kinematic Monolith' }, calculator: { mode: 'KINEMATIC' } }, nodeId: 'calculator-node-kinematic', semanticIndexExpression: 'J(q)', launch: { kind: 'UNCONFIGURED', reason: 'calculator_base_url_missing' }, researchOnlyDisclosure: 'Источник-обусловленная визуализация исследования. Не запускает расчёт в Expansion Map, не подключается к манипулятору, не производит команду управления, оценку безопасности или сертификационный вывод.' },
]);

let root: Root | undefined;
let container: HTMLDivElement | undefined;

async function renderExplorer(module: CalculatorExplorerModule, options?: Partial<{ isOpen: boolean; onClose: () => void; onSelectNode: (nodeId: string) => void; entries: readonly ExplorerEntry[] }>) {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  const onClose = options?.onClose ?? vi.fn();
  const onSelectNode = options?.onSelectNode ?? vi.fn();
  await act(async () => {
    root?.render(React.createElement(module.CalculatorExplorer, {
      isOpen: options?.isOpen ?? true,
      entries: options?.entries ?? entries,
      locale: useI18nStore.getState().locale,
      t: useI18nStore.getState().t,
      onClose,
      onSelectNode,
    }));
  });
  return { container, onClose, onSelectNode };
}

beforeEach(() => {
  useI18nStore.getState().setLocale('ru');
});

afterEach(async () => {
  await act(async () => root?.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
  useI18nStore.getState().setLocale('ru');
});

describe('CALC-EXP-02 — accessible calculator explorer UI', () => {
  it('CE02-QA-17: renders a named read-only solved calculator catalogue when open', async () => {
    const rendered = await renderExplorer(await future());
    expect(rendered.container.querySelector('[aria-label="Решенные случаи калькулятора"]')).not.toBeNull();
  });

  it('CE02-QA-18: exposes every supplied source-bound entry as a labelled selection action', async () => {
    const rendered = await renderExplorer(await future());
    for (const entry of entries) {
      expect(rendered.container.querySelector(`button[aria-label="Открыть ${entry.monolith.title.ru}"]`)).not.toBeNull();
    }
  });

  it('CE02-QA-19: makes the manipulator case visibly discoverable by its exact title', async () => {
    const rendered = await renderExplorer(await future());
    expect(rendered.container.textContent).toContain('Кинематический мономолит манипулятора');
  });

  it('CE02-QA-20: discloses the exact kinematic semantic index J(q)', async () => {
    const rendered = await renderExplorer(await future());
    expect(rendered.container.textContent).toContain('J(q)');
  });

  it('CE02-QA-21: renders the fixed non-calculation, non-control and non-safety manipulator disclosure', async () => {
    const rendered = await renderExplorer(await future());
    expect(rendered.container.textContent).toMatch(/не запускает расч[её]т/i);
    expect(rendered.container.textContent).toMatch(/не производит команду управления/i);
    expect(rendered.container.textContent).toMatch(/оценку безопасности/i);
  });

  it('CE02-QA-22: calls onSelectNode exactly once with the closed kinematic node ID after an explicit click', async () => {
    const module = await future();
    const select = vi.fn();
    const rendered = await renderExplorer(module, { onSelectNode: select });
    const button = rendered.container.querySelector<HTMLButtonElement>('button[aria-label="Открыть Кинематический мономолит манипулятора"]');
    expect(button).not.toBeNull();
    await act(async () => button?.click());
    expect(select).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith('calculator-node-kinematic');
  });

  it('CE02-QA-23: supports keyboard Enter selection through the same callback and no secondary action', async () => {
    const module = await future();
    const select = vi.fn();
    const rendered = await renderExplorer(module, { onSelectNode: select });
    const button = rendered.container.querySelector<HTMLButtonElement>('button[aria-label="Открыть Кинематический мономолит манипулятора"]');
    expect(button).not.toBeNull();
    await act(async () => button?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(select).toHaveBeenCalledWith('calculator-node-kinematic');
  });

  it('CE02-QA-24: provides a labelled close action and calls only the supplied callback', async () => {
    const module = await future();
    const close = vi.fn();
    const rendered = await renderExplorer(module, { onClose: close });
    const button = rendered.container.querySelector<HTMLButtonElement>('button[aria-label="Закрыть каталог калькулятора"]');
    expect(button).not.toBeNull();
    await act(async () => button?.click());
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('CE02-QA-25: renders no explorer links, iframe or external launch control before node-card selection', async () => {
    const rendered = await renderExplorer(await future());
    expect(rendered.container.querySelector('a, iframe')).toBeNull();
    expect(rendered.container.textContent).not.toMatch(/Открыть visual calculator/i);
  });

  it('CE02-QA-26: shows the existing unconfigured-launch outcome without fabricating a URL', async () => {
    const rendered = await renderExplorer(await future());
    expect(rendered.container.textContent).toMatch(/не настроен|unconfigured/i);
    expect(rendered.container.querySelector('a[href]')).toBeNull();
  });

  it('CE02-QA-27: stays absent from the DOM while closed and performs no selection', async () => {
    const module = await future();
    const select = vi.fn();
    const rendered = await renderExplorer(module, { isOpen: false, onSelectNode: select });
    expect(rendered.container.querySelector('[aria-label="Решенные случаи калькулятора"]')).toBeNull();
    expect(select).not.toHaveBeenCalled();
  });

  it('CE02-QA-28: exposes only supplied immutable-looking presentation text and does not render a solver action', async () => {
    const rendered = await renderExplorer(await future());
    expect(rendered.container.textContent).not.toMatch(/Execute RICIS Solution|Перерассчитать доказательство|Решить задачу/i);
  });
});
