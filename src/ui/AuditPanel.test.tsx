// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditPanel } from './AuditPanel';
import { useI18nStore } from '../store/useI18nStore';
import { useMapStore } from '../store/mapStore';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let container: HTMLDivElement | undefined;

const mockRunSystemAudit = vi.fn().mockResolvedValue({ totalInspected: 10, violations: [] });
const mockRunGraphRepair = vi.fn().mockResolvedValue({ repairedCount: 1, discoveredCount: 0, newZonesAdded: [] });
const mockExecuteGarbageCollection = vi.fn().mockResolvedValue({ removedNodeIds: ['n1'], removedEdgeIds: [] });
const mockRunAuditMissingTargets = vi.fn().mockResolvedValue(undefined);
const mockRunFillMissingTargets = vi.fn().mockResolvedValue(undefined);
const mockRunDerivativeSearch = vi.fn().mockResolvedValue(undefined);

async function renderAuditPanel(locale: 'ru' | 'en-US' = 'ru') {
  useI18nStore.getState().setLocale(locale);
  useMapStore.setState({
    isAuditing: false,
    lastAuditReport: null,
    runSystemAudit: mockRunSystemAudit,
    runGraphRepair: mockRunGraphRepair,
    executeGarbageCollection: mockExecuteGarbageCollection,
    runAuditMissingTargets: mockRunAuditMissingTargets,
    runFillMissingTargets: mockRunFillMissingTargets,
    runDerivativeSearch: mockRunDerivativeSearch,
  } as any);

  const renderedContainer = document.createElement('div');
  document.body.append(renderedContainer);
  const renderedRoot = createRoot(renderedContainer);
  root = renderedRoot;
  container = renderedContainer;

  await act(async () => {
    renderedRoot.render(React.createElement(AuditPanel));
  });

  return { renderedContainer };
}

describe('AuditPanel UI & Accessibility Suite (Icon-only with Tooltips)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }
    container?.remove();
    root = undefined;
    container = undefined;
  });

  it('renders all 6 audit action buttons as icon-only without text labels', async () => {
    const { renderedContainer } = await renderAuditPanel('ru');
    const buttonIds = [
      'btn-run-audit',
      'btn-repair-graph',
      'btn-run-gc',
      'btn-audit-missing',
      'btn-fill-missing',
      'btn-search-derivatives',
    ];

    for (const btnId of buttonIds) {
      const btn = renderedContainer.querySelector<HTMLButtonElement>(`#${btnId}`);
      expect(btn, `Button #${btnId} should exist`).not.toBeNull();
      
      // Кнопка не должна иметь текстовых спанов
      const span = btn?.querySelector('span');
      expect(span).toBeNull();
      
      // Кнопка должна содержать SVG иконку
      const svg = btn?.querySelector('svg');
      expect(svg, `Button #${btnId} should have an SVG icon`).not.toBeNull();
    }
  });

  it('provides descriptive tooltips via title and aria-label on all action buttons', async () => {
    const { renderedContainer } = await renderAuditPanel('ru');
    const buttonIds = [
      'btn-run-audit',
      'btn-repair-graph',
      'btn-run-gc',
      'btn-audit-missing',
      'btn-fill-missing',
      'btn-search-derivatives',
    ];

    for (const btnId of buttonIds) {
      const btn = renderedContainer.querySelector<HTMLButtonElement>(`#${btnId}`);
      expect(btn?.getAttribute('title')).toBeTruthy();
      expect(btn?.getAttribute('aria-label')).toBeTruthy();
    }
  });

  it('triggers store actions on icon button clicks', async () => {
    const { renderedContainer } = await renderAuditPanel('ru');

    const auditBtn = renderedContainer.querySelector<HTMLButtonElement>('#btn-run-audit')!;
    await act(async () => {
      auditBtn.click();
    });
    expect(mockRunSystemAudit).toHaveBeenCalledTimes(1);

    const gcBtn = renderedContainer.querySelector<HTMLButtonElement>('#btn-run-gc')!;
    await act(async () => {
      gcBtn.click();
    });
    expect(mockExecuteGarbageCollection).toHaveBeenCalledTimes(1);
  });
});
