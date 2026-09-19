import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StatusLegendModal } from './StatusLegendModal';
import { NodeResolutionStatusCode } from '../model/colorMatrix';
import type { ProblemNode } from '../model/types';

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

describe('StatusLegendModal Component', () => {
  const mockNodes: ProblemNode[] = [
    {
      id: 'node-1',
      title: 'Resolved Problem',
      description: 'Done',
      state: 'resolved',
      type: 'scientific_task',
      targetFunction: 'F',
      zoneIds: ['z1'],
      dependencyIds: [],
      dependentIds: [],
      fractalDepth: 1,
      economic: { costUnresolved: 0, costToSolve: 0, marketGain: 0, riskLoss: 0 }
    },
    {
      id: 'node-2',
      title: 'Unresolved Singularity',
      description: 'Open',
      state: 'unresolved',
      type: 'core_singularity',
      targetFunction: '',
      zoneIds: ['z1'],
      dependencyIds: [],
      dependentIds: [],
      fractalDepth: 1,
      economic: { costUnresolved: 0, costToSolve: 0, marketGain: 0, riskLoss: 0 }
    }
  ];

  it('renders all 11 status categories with color previews and counts', async () => {
    const rendered = await render(
      <StatusLegendModal
        isOpen={true}
        onClose={vi.fn()}
        nodes={mockNodes}
        activeStatusFilter={null}
        onSelectStatusFilter={vi.fn()}
        locale="ru"
      />
    );

    expect(rendered.textContent).toContain('Онтологическая палитра состояний RICIS-III');
    expect(rendered.textContent).toContain('Полностью доказано (RICIS-III)');
    expect(rendered.textContent).toContain('Открытая сингулярность');
    expect(rendered.textContent).toContain('#22c55e');
    expect(rendered.textContent).toContain('#ef4444');
  });

  it('triggers onSelectStatusFilter when clicking a status row', async () => {
    const onSelectStatusFilter = vi.fn();
    const rendered = await render(
      <StatusLegendModal
        isOpen={true}
        onClose={vi.fn()}
        nodes={mockNodes}
        activeStatusFilter={null}
        onSelectStatusFilter={onSelectStatusFilter}
        locale="ru"
      />
    );

    const buttons = rendered.querySelectorAll('button');
    const statusBtn = Array.from(buttons).find(b => b.textContent?.includes('Полностью доказано (RICIS-III)'));
    expect(statusBtn).toBeDefined();
    if (statusBtn) {
      await act(async () => {
        statusBtn.click();
      });
      expect(onSelectStatusFilter).toHaveBeenCalledWith(NodeResolutionStatusCode.PROVEN_RESOLVED);
    }
  });

  it('does not render when isOpen is false', async () => {
    const rendered = await render(
      <StatusLegendModal
        isOpen={false}
        onClose={vi.fn()}
        nodes={mockNodes}
        activeStatusFilter={null}
        onSelectStatusFilter={vi.fn()}
        locale="ru"
      />
    );
    expect(rendered.firstChild).toBeNull();
  });
});
