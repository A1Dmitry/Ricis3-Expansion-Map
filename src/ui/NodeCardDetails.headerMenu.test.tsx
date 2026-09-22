import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { NodeCardDetails } from './NodeCardDetails';
import { IconButton } from './components/IconButton';
import type { ProblemNode } from '../model/types';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it('mounts all task actions only in the header hamburger and retains its existing export actions', async () => {
  const node: ProblemNode = {
    id: 'header-menu-test', title: 'Test task', description: '', targetFunction: 'x',
    state: 'unresolved', type: 'scientific_task', zoneIds: [], dependencyIds: [], dependentIds: [],
    fractalDepth: 0, economic: { costUnresolved: 0, costToSolve: 0, marketGain: 0, riskLoss: 0 },
  };
  const host = document.createElement('div');
  const header = document.createElement('header');
  const body = document.createElement('div');
  host.append(header, body);
  document.body.append(host);
  const root = createRoot(body);
  const solve = vi.fn();
  const exportJson = vi.fn();
  try {
    await act(async () => root.render(<NodeCardDetails node={node} map={{ nodes: [node] }} isExpanded
      onSolve={solve} menuContainer={header} menuFooter={close => (
        <IconButton onClick={() => { exportJson(); close(); }}>Генерировать JSON</IconButton>
      )} />));
    const trigger = header.querySelector<HTMLButtonElement>('[data-testid="node-context-menu-trigger"]')!;
    expect(trigger).not.toBeNull();
    expect(trigger.querySelector('.lucide-menu')).not.toBeNull();
    expect(body.querySelector('[data-testid="node-context-menu-trigger"]')).toBeNull();
    expect(host.querySelector('.lucide-ellipsis-vertical')).toBeNull();
    expect(host.textContent).not.toContain('Действия задачи');
    await act(async () => trigger.click());
    for (const id of ['solve', 'formula-calculator', 'explore', 'verify', 'share', 'bookmark']) {
      expect(header.querySelector(`[data-testid="node-context-menu-item-${id}"]`)).not.toBeNull();
    }
    await act(async () => header.querySelector<HTMLButtonElement>('[data-testid="node-context-menu-item-solve"]')!.click());
    expect(solve).toHaveBeenCalledOnce();
    expect(header.querySelector('[role="menu"]')).toBeNull();
    await act(async () => trigger.click());
    await act(async () => header.querySelector<HTMLButtonElement>('[aria-label="Генерировать JSON"]')!.click());
    expect(exportJson).toHaveBeenCalledOnce();
    expect(header.querySelector('[role="menu"]')).toBeNull();
  } finally {
    await act(async () => root.unmount());
    expect(header.childElementCount).toBe(0);
    host.remove();
  }
});
