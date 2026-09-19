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
  it('renders list of nodes and zones', async () => {
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
  });

  it('selects a node when clicked', async () => {
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

    const buttons = Array.from(rendered.querySelectorAll('button'));
    const nodeBtn = buttons.find(b => b.textContent?.includes('Деление на ноль'));
    expect(nodeBtn).toBeDefined();

    await act(async () => {
      nodeBtn?.click();
    });

    expect(onSelect).toHaveBeenCalledWith('p1');
  });
});
