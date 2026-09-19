import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProofGraphComparisonPage } from './ProofGraphComparisonPage';

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

describe('ProofGraphComparisonPage Component', () => {
  it('renders header, title, and initial isomorphism tab', async () => {
    const onBack = vi.fn();
    const rendered = await render(<ProofGraphComparisonPage onBackToMap={onBack} />);

    expect(rendered.textContent).toContain('Структурное сравнение графов доказательств');
    expect(rendered.textContent).toContain('RICIS-III DAG vs Anthropic FLT Graph');
    expect(rendered.textContent).toContain('Назад к карте');
    expect(rendered.textContent).toContain('Доказанный макрограф');
  });

  it('triggers onBackToMap when back button is clicked', async () => {
    const onBack = vi.fn();
    const rendered = await render(<ProofGraphComparisonPage onBackToMap={onBack} />);

    const buttons = Array.from(rendered.querySelectorAll('button'));
    const backBtn = buttons.find(b => b.textContent?.includes('Назад к карте'));
    expect(backBtn).toBeDefined();

    await act(async () => {
      backBtn?.click();
    });

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('switches between all navigation tabs without crashing', async () => {
    const onBack = vi.fn();
    const rendered = await render(<ProofGraphComparisonPage onBackToMap={onBack} />);

    const header = rendered.querySelector('header');
    const headerButtons = Array.from(header?.querySelectorAll('button') || []);

    // 1. Matrix tab
    const matrixBtn = headerButtons.find(b => b.textContent?.includes('Топология и Метрики'));
    expect(matrixBtn).toBeDefined();
    await act(async () => {
      matrixBtn?.click();
    });
    expect(rendered.textContent).toContain('Архитектура:');
    expect(rendered.textContent).toContain('RICIS_MONOLITH_DAG');

    // 2. Analogies tab
    const analogiesBtn = headerButtons.find(b => b.textContent?.includes('Структурные аналогии'));
    expect(analogiesBtn).toBeDefined();
    await act(async () => {
      analogiesBtn?.click();
    });
    expect(rendered.textContent).toContain('Топологические совпадения архитектур');

    // 3. Divergences tab
    const divergencesBtn = headerButtons.find(b => b.textContent?.includes('Расхождения парадигм'));
    expect(divergencesBtn).toBeDefined();
    await act(async () => {
      divergencesBtn?.click();
    });
    expect(rendered.textContent).toContain('Различия нотаций и уровней абстракции');

    // 4. Priority tab
    const priorityBtn = headerButtons.find(b => b.textContent?.includes('Приоритет & Публикации'));
    expect(priorityBtn).toBeDefined();
    await act(async () => {
      priorityBtn?.click();
    });
    expect(rendered.textContent).toContain('Официальная фиксация авторского приоритета');
  });
});
