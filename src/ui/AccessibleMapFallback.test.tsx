import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccessibleMapFallback } from './AccessibleMapFallback';
import type { ProblemNode, ScienceZone } from '../model/types';

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

const mockZones: ScienceZone[] = [
  {
    id: 'z1',
    name: 'Математика',
    description: 'Математические сингулярности',
    nodeIds: ['p1'],
    economicProfile: {
      costUnresolved: 100,
      costToSolve: 50,
      marketGain: 500,
      riskLoss: 10,
    },
  },
  {
    id: 'z2',
    name: 'Физика',
    description: 'Физические сингулярности',
    nodeIds: ['p2'],
    economicProfile: {
      costUnresolved: 200,
      costToSolve: 100,
      marketGain: 1000,
      riskLoss: 20,
    },
  },
];

const mockNodes: ProblemNode[] = [
  {
    id: 'p1',
    title: 'Деление на ноль',
    description: 'Полное описание',
    state: 'resolved',
    type: 'core_singularity',
    targetFunction: '0/0 = 1',
    zoneIds: ['z1'],
    dependencyIds: [],
    dependentIds: [],
    fractalDepth: 0,
    economic: {
      costUnresolved: 100,
      costToSolve: 50,
      marketGain: 500,
      riskLoss: 10,
    },
  },
  {
    id: 'p2',
    title: 'Квантовая сингулярность',
    description: 'Гравитация',
    state: 'partial',
    type: 'derived_problem',
    targetFunction: 'E = m c^2',
    zoneIds: ['z2'],
    dependencyIds: ['p1'],
    dependentIds: [],
    fractalDepth: 1,
    economic: {
      costUnresolved: 200,
      costToSolve: 100,
      marketGain: 1000,
      riskLoss: 20,
    },
  },
];

describe('AccessibleMapFallback Component', () => {
  it('renders 2D graph view with node titles and header', async () => {
    const onSelect = vi.fn();
    const onEnable3d = vi.fn();
    const rendered = await render(
      <AccessibleMapFallback
        nodes={mockNodes}
        zones={mockZones}
        selectedNodeId={null}
        onSelectNode={onSelect}
        onEnable3d={onEnable3d}
        reason="user_selected"
      />
    );

    expect(rendered.textContent).toContain('Доступный режим карты');
    expect(rendered.textContent).toContain('Деление на ноль');
    expect(rendered.textContent).toContain('Квантовая сингулярность');
    expect(rendered.textContent).toContain('3D-карту');
    expect(rendered.querySelector('[data-testid="map-2d-graph"]')).not.toBeNull();
  });

  it('selects a node in the 2D graph when its marker is clicked', async () => {
    const onSelect = vi.fn();
    const onEnable3d = vi.fn();
    const rendered = await render(
      <AccessibleMapFallback
        nodes={mockNodes}
        zones={mockZones}
        selectedNodeId={null}
        onSelectNode={onSelect}
        onEnable3d={onEnable3d}
        reason="user_selected"
      />
    );

    const nodeMarker = rendered.querySelector('[data-testid="m2d-node-p1"]');
    expect(nodeMarker).not.toBeNull();
    await act(async () => {
      nodeMarker?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onSelect).toHaveBeenCalledWith('p1');
  });

  it('highlights selected node connections and mutes unrelated edges', async () => {
    const onSelect = vi.fn();
    const rendered = await render(
      <AccessibleMapFallback
        nodes={mockNodes}
        zones={mockZones}
        selectedNodeId="p2"
        onSelectNode={onSelect}
        onEnable3d={vi.fn()}
        reason="user_selected"
      />
    );

    // p2 зависит от p1: ребро p2→p1 активно (cyan, предпосылка)
    const edge = rendered.querySelector<SVGLineElement>('[data-testid="m2d-edge-p2-p1"]');
    expect(edge).not.toBeNull();
    expect(edge?.getAttribute('stroke')).toBe('#22d3ee');
    expect(edge?.getAttribute('opacity')).toBe('0.95');
    // Сводка связей выбранного узла
    const summary = rendered.querySelector('[data-testid="m2d-selection-summary"]');
    expect(summary?.textContent).toContain('Квантовая сингулярность');
    expect(summary?.textContent).toContain('предпосылок:');
  });

  it('tree view selects a node from an expanded zone', async () => {
    const onSelect = vi.fn();
    const onEnable3d = vi.fn();
    const rendered = await render(
      <AccessibleMapFallback
        nodes={mockNodes}
        zones={mockZones}
        selectedNodeId={null}
        onSelectNode={onSelect}
        onEnable3d={onEnable3d}
        reason="user_selected"
      />
    );

    // Переключаемся на проводник и раскрываем зону «Математика»
    const treeTabBtn = Array.from(rendered.querySelectorAll('button')).find(
      b => b.textContent?.includes('Дерево (проводник)'),
    );
    await act(async () => {
      treeTabBtn?.click();
    });

    expect(rendered.querySelector('[data-testid="map-tree-view"]')).not.toBeNull();

    const zoneRow = rendered.querySelector('[data-testid="tree-zone-z1"]');
    await act(async () => {
      (zoneRow as HTMLButtonElement | null)?.click();
    });

    const nodeBtn = rendered.querySelector('[data-testid="tree-node-p1"]');
    expect(nodeBtn).not.toBeNull();
    await act(async () => {
      (nodeBtn as HTMLButtonElement | null)?.click();
    });
    expect(onSelect).toHaveBeenCalledWith('p1');
  });

  it('tree view auto-expands the zone of the selected node', async () => {
    const rendered = await render(
      <AccessibleMapFallback
        nodes={mockNodes}
        zones={mockZones}
        selectedNodeId="p2"
        onSelectNode={vi.fn()}
        onEnable3d={vi.fn()}
        reason="user_selected"
      />
    );

    const treeTabBtn = Array.from(rendered.querySelectorAll('button')).find(
      b => b.textContent?.includes('Дерево (проводник)'),
    );
    await act(async () => {
      treeTabBtn?.click();
    });

    // Зона «Физика» раскрыта автоматически: строка выбранного узла видна сразу
    const zoneRow = rendered.querySelector('[data-testid="tree-zone-z2"]');
    expect(zoneRow?.getAttribute('aria-expanded')).toBe('true');
    expect(rendered.querySelector('[data-testid="tree-node-p2"]')).not.toBeNull();
  });
});
