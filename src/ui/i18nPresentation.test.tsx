import React, { act } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useI18nStore } from '../store/useI18nStore';
import { CalculatorExplorer } from './CalculatorExplorer';
import { MonolithGuidedCaseTrail } from './MonolithGuidedCaseTrail';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const explorerEntries = [{
  monolith: {
    id: 'calculator-complex-analysis',
    title: { ru: 'Существенная комплексная сингулярность', en: 'Essential Complex Singularity' },
    calculator: { mode: 'COMPLEX_ANALYSIS' },
  },
  nodeId: 'calculator-node-complex-analysis',
  semanticIndexExpression: 'exp(1/z)',
  launch: { kind: 'UNCONFIGURED', reason: 'calculator_base_url_missing' },
  researchOnlyDisclosure: 'Source-bound catalogue disclosure.',
}] as const;

const trail = {
  kind: 'PROJECTED',
  entries: [{
    entry: {
      nodeId: 'calculator-node-mandelbrot',
      semanticIndexExpression: 'z_{n+1}=z_n^2+c',
      researchOnlyDisclosure: 'Source-bound navigation disclosure.',
      monolith: {
        id: 'calculator-mandelbrot',
        title: { ru: 'Фрактальный мономолит Мандельброта', en: 'Mandelbrot Fractal Monolith' },
        category: { ru: 'Фрактальная динамика', en: 'Fractal Dynamics' },
        familyId: 'analytic-geometric',
        example: { expectedStructuralResult: 'Source-bound result.', orderedRuleTrace: ['Source identity retained.'] },
        visualization: { description: 'Read-only visualisation.', altText: 'Mandelbrot visualisation' },
      },
    },
    familyId: 'analytic-geometric',
    isInitialAnchor: true,
    outgoing: [],
  }],
} as const;

let root: Root | undefined;
let container: HTMLDivElement | undefined;

async function renderEnglishPresentation() {
  useI18nStore.getState().setLocale('en');
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);

  const explorerSelect = vi.fn();
  const trailSelect = vi.fn();
  await act(async () => {
    root?.render(React.createElement(React.Fragment, undefined,
      React.createElement(CalculatorExplorer, {
        isOpen: true,
        entries: explorerEntries as any,
        locale: useI18nStore.getState().locale,
        t: useI18nStore.getState().t,
        onClose: vi.fn(),
        onSelectNode: explorerSelect,
      }),
      React.createElement(MonolithGuidedCaseTrail, {
        isOpen: true,
        trail: trail as any,
        locale: useI18nStore.getState().locale,
        t: useI18nStore.getState().t,
        onClose: vi.fn(),
        onSelectNode: trailSelect,
      }),
    ));
  });

  return { container, explorerSelect, trailSelect };
}

beforeEach(() => {
  useI18nStore.getState().setLocale('ru');
});

afterEach(async () => {
  if (root) await act(async () => root?.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
  useI18nStore.getState().setLocale('ru');
});

describe('issue #17 — EN i18n presentation boundary', () => {
  it('renders EN chrome and existing EN monolith title/category resources while retaining only caller-supplied selection callbacks', async () => {
    const rendered = await renderEnglishPresentation();

    expect(rendered.container.querySelector('[aria-label="Solved Calculator Cases"]')).not.toBeNull();
    const explorerButton = rendered.container.querySelector<HTMLButtonElement>('[aria-label="Open Essential Complex Singularity"]');
    const trailButton = rendered.container.querySelector<HTMLButtonElement>('[aria-label="Open Mandelbrot Fractal Monolith"]');
    expect(explorerButton).not.toBeNull();
    expect(rendered.container.textContent).toContain('Essential Complex Singularity');
    expect(rendered.container.textContent).toContain('Monolith Learning Trail');
    expect(rendered.container.querySelector('[aria-label="Monolith learning trail"]')).not.toBeNull();
    expect(trailButton).not.toBeNull();
    expect(rendered.container.textContent).toContain('Mandelbrot Fractal Monolith');
    expect(rendered.container.textContent).toContain('Fractal Dynamics');
    expect(rendered.container.textContent).toContain('Learning starting point');

    await act(async () => explorerButton?.click());
    await act(async () => trailButton?.click());
    expect(rendered.explorerSelect).toHaveBeenCalledExactlyOnceWith('calculator-node-complex-analysis');
    expect(rendered.trailSelect).toHaveBeenCalledExactlyOnceWith('calculator-node-mandelbrot');

    expect(rendered.container.textContent).not.toContain('Решенные случаи калькулятора');
    expect(rendered.container.textContent).not.toContain('Маршрут изучения мономолитов');
    expect(rendered.container.textContent).not.toContain('Фрактальный мономолит Мандельброта');
  });

  it('routes the live-reproduced Map3D controls and selected calculator-node display through the typed locale seam', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/ui/Map3D.tsx'), 'utf8');

    expect(source).toContain('projectNodeForLocale');
    expect(source).toContain('selectedNodePresentation');
    for (const key of [
      'map.roadmap.aria',
      'map.voynich.label',
      'map.presentation.toggle',
      'calculatorExplorer.action',
      'guidedTrail.action',
      'map.selectedProblem',
    ]) expect(source).toContain(`t('${key}')`);
  });
});
