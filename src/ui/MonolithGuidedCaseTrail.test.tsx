import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type OutgoingRelation = Readonly<{
  readonly relationId: string;
  readonly sourceRationale: string;
  readonly to: Readonly<{
    readonly entry: Readonly<{
      readonly nodeId: string;
      readonly monolith: Readonly<{ readonly id: string; readonly title: Readonly<{ readonly ru: string; readonly en: string }> }>;
    }>;
  }>;
}>;

type Entry = Readonly<{
  readonly entry: Readonly<{
    readonly nodeId: string;
    readonly semanticIndexExpression: string;
    readonly researchOnlyDisclosure: string;
    readonly monolith: Readonly<{
      readonly id: string;
      readonly title: Readonly<{ readonly ru: string; readonly en: string }>;
      readonly category: Readonly<{ readonly ru: string; readonly en: string }>;
      readonly familyId: string;
      readonly example: Readonly<{ readonly expectedStructuralResult: string; readonly orderedRuleTrace: readonly string[] }>;
      readonly visualization: Readonly<{ readonly description: string; readonly altText: string }>;
    }>;
  }>;
  readonly familyId: string;
  readonly isInitialAnchor: boolean;
  readonly outgoing: readonly OutgoingRelation[];
}>;

type Trail = Readonly<{ readonly kind: 'PROJECTED'; readonly entries: readonly Entry[] }>;

interface GuidedCaseTrailModule {
  MonolithGuidedCaseTrail: React.ComponentType<{
    readonly isOpen: boolean;
    readonly trail: Trail;
    readonly onClose: () => void;
    readonly onSelectNode: (nodeId: string) => void;
  }>;
}

const CONTRACT_PATH = './MonolithGuidedCaseTrail';
const future = () => import(/* @vite-ignore */ CONTRACT_PATH) as Promise<GuidedCaseTrailModule>;

const mandelbrot: Entry = {
  entry: {
    nodeId: 'calculator-node-mandelbrot',
    semanticIndexExpression: 'z_{n+1}=z_n^2+c',
    researchOnlyDisclosure: 'Источник-обусловленное раскрытие calculator case. Не запускает расчёт в Expansion Map и не изменяет source, proof, state, trust или authority.',
    monolith: {
      id: 'calculator-mandelbrot',
      title: { ru: 'Фрактальный мономолит Мандельброта', en: 'Mandelbrot Fractal Monolith' },
      category: { ru: 'Фрактальная динамика', en: 'Fractal Dynamics' },
      familyId: 'analytic-geometric',
      example: { expectedStructuralResult: 'Фрактальная сингулярность раскрыта source-bound case.', orderedRuleTrace: ['Source-bound case identity retained.', 'Typed monolith and semantic index are disclosed.'] },
      visualization: { description: 'The external calculator visualisation is opened only by an explicit user action and is not Lean/Core evidence.', altText: 'Mandelbrot Fractal Monolith: source-bound calculator visualisation' },
    },
  },
  familyId: 'analytic-geometric',
  isInitialAnchor: true,
  outgoing: [],
};

const kinematic: Entry = {
  entry: {
    nodeId: 'calculator-node-kinematic',
    semanticIndexExpression: 'J(q)',
    researchOnlyDisclosure: 'Источник-обусловленная визуализация исследования. Не запускает расчёт в Expansion Map, не подключается к манипулятору, не производит команду управления, оценку безопасности или сертификационный вывод.',
    monolith: {
      id: 'calculator-kinematic',
      title: { ru: 'Кинематический мономолит манипулятора', en: 'Robot Manipulator Kinematic Monolith' },
      category: { ru: 'Прикладная геометрия и управление', en: 'Applied Geometry and Control' },
      familyId: 'physical-fields',
      example: { expectedStructuralResult: 'Jacobian манипулятора раскрыт отдельно от Jacobian Conjecture.', orderedRuleTrace: ['Source-bound case identity retained.'] },
      visualization: { description: 'The external calculator visualisation is opened only by an explicit user action and is not Lean/Core evidence.', altText: 'Robot Manipulator Kinematic Monolith: source-bound calculator visualisation' },
    },
  },
  familyId: 'physical-fields',
  isInitialAnchor: false,
  outgoing: [],
};

const trail: Trail = Object.freeze({ kind: 'PROJECTED', entries: Object.freeze([mandelbrot, kinematic]) });

let root: Root | undefined;
let container: HTMLDivElement | undefined;

async function renderTrail(module: GuidedCaseTrailModule, options?: Partial<{ isOpen: boolean; onClose: () => void; onSelectNode: (nodeId: string) => void }>) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  const onClose = options?.onClose ?? vi.fn();
  const onSelectNode = options?.onSelectNode ?? vi.fn();
  await act(async () => {
    root?.render(React.createElement(module.MonolithGuidedCaseTrail, {
      isOpen: options?.isOpen ?? true,
      trail,
      onClose,
      onSelectNode,
    }));
  });
  return { container, onClose, onSelectNode };
}

afterEach(async () => {
  await act(async () => root?.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
});

describe('EDU-VIS-01 — accessible Monolith Guided Case Trail UI', () => {
  it('EV01-QA-19: renders a labelled read-only learning trail only when open', async () => {
    const rendered = await renderTrail(await future());
    expect(rendered.container.querySelector('[aria-label="Маршрут изучения мономолитов"]')).not.toBeNull();
  });

  it('EV01-QA-20: renders no trail surface when closed', async () => {
    const rendered = await renderTrail(await future(), { isOpen: false });
    expect(rendered.container.querySelector('[aria-label="Маршрут изучения мономолитов"]')).toBeNull();
  });

  it('EV01-QA-21: exposes every supplied source-bound entry as an exact labelled selection action', async () => {
    const rendered = await renderTrail(await future());
    for (const item of trail.entries) expect(rendered.container.querySelector(`button[aria-label="Открыть ${item.entry.monolith.title.ru}"]`)).not.toBeNull();
  });

  it('EV01-QA-22: marks only the Mandelbrot entry as the learning starting point', async () => {
    const rendered = await renderTrail(await future());
    expect(rendered.container.textContent).toContain('Начальная точка изучения');
    expect(rendered.container.textContent).toContain('Фрактальный мономолит Мандельброта');
  });

  it('EV01-QA-23: renders exact family/category and semantic index without derived mathematics', async () => {
    const rendered = await renderTrail(await future());
    expect(rendered.container.textContent).toContain('Фрактальная динамика');
    expect(rendered.container.textContent).toContain('z_{n+1}=z_n^2+c');
  });

  it('EV01-QA-24: renders the existing source-bound structural result and ordered navigation trace', async () => {
    const rendered = await renderTrail(await future());
    expect(rendered.container.textContent).toContain('Фрактальная сингулярность раскрыта source-bound case.');
    expect(rendered.container.textContent).toContain('Source-bound case identity retained.');
  });

  it('EV01-QA-25: renders existing visualization description and alternative text only as disclosure', async () => {
    const rendered = await renderTrail(await future());
    expect(rendered.container.textContent).toContain('not Lean/Core evidence');
    expect(rendered.container.textContent).toContain('source-bound calculator visualisation');
  });

  it('EV01-QA-26: calls onSelectNode exactly once with the closed Mandelbrot node ID after an explicit click', async () => {
    const module = await future();
    const rendered = await renderTrail(module);
    await act(async () => (rendered.container.querySelector('button[aria-label="Открыть Фрактальный мономолит Мандельброта"]') as HTMLButtonElement).click());
    expect(rendered.onSelectNode).toHaveBeenCalledTimes(1);
    expect(rendered.onSelectNode).toHaveBeenCalledWith('calculator-node-mandelbrot');
  });

  it('EV01-QA-27: supports keyboard Enter selection through the same callback only', async () => {
    const module = await future();
    const rendered = await renderTrail(module);
    await act(async () => (rendered.container.querySelector('button[aria-label="Открыть Фрактальный мономолит Мандельброта"]') as HTMLButtonElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(rendered.onSelectNode).toHaveBeenCalledTimes(1);
    expect(rendered.onSelectNode).toHaveBeenCalledWith('calculator-node-mandelbrot');
  });

  it('EV01-QA-28: provides a labelled close action and calls only the supplied callback', async () => {
    const module = await future();
    const rendered = await renderTrail(module);
    await act(async () => (rendered.container.querySelector('button[aria-label="Закрыть маршрут изучения"]') as HTMLButtonElement).click());
    expect(rendered.onClose).toHaveBeenCalledTimes(1);
    expect(rendered.onSelectNode).not.toHaveBeenCalled();
  });

  it('EV01-QA-29: retains the exact kinematic research-only disclosure with no control action', async () => {
    const rendered = await renderTrail(await future());
    expect(rendered.container.textContent).toContain('не производит команду управления');
    expect(rendered.container.textContent).toContain('не подключается к манипулятору');
  });

  it('EV01-QA-30: renders fixed no-execution and no-authority educational disclosure', async () => {
    const rendered = await renderTrail(await future());
    expect(rendered.container.textContent).toContain('не является запуском calculator');
    expect(rendered.container.textContent).toContain('не создаёт Core/Lean result');
  });

  it('EV01-QA-31: renders no link, iframe, canvas, image, svg or external launch control', async () => {
    const rendered = await renderTrail(await future());
    expect(rendered.container.querySelector('a, iframe, canvas, img, svg')).toBeNull();
    expect(rendered.container.textContent).not.toMatch(/Открыть visual calculator|Запустить|Рендер|Вычислить/i);
  });

  it('EV01-QA-32: exposes only supplied presentation text and no solver or authority control', async () => {
    const rendered = await renderTrail(await future());
    expect(rendered.container.querySelectorAll('button').length).toBe(3);
    expect(rendered.container.textContent).not.toMatch(/proof verified|trusted|resolved|сертифиц/i);
  });
});
