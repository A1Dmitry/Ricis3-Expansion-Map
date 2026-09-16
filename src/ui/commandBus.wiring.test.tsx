// @vitest-environment jsdom
// ============================================================================
// BUG-02 REGRESSION: the central command bus must actually work.
// Runtime tests: dispatch the `ricis:*` events exactly as the toolbar/menu
// do and assert that the target page performs the real action.
// ============================================================================

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { KinematicEnginePage } from './KinematicEnginePage';
import { RicisProofConsoleModal } from './RicisProofConsoleModal';
import { AutoProverModal } from './AutoProverModal';
import { useCommandStateStore } from '../store/useCommandStateStore';
import { useTerminalStore } from '../store/useTerminalStore';
import { useMapStore } from '../store/mapStore';
import type { ProblemNode } from '../model/types';
import type { IRicisCoreEngine } from '../services/ricisCore/IRicisCoreEngine';
import type { IRicisProofGateway, ProofRunResponse } from '../services/ricisCore/IRicisProofGateway';

vi.mock('./lazyNamedComponent', () => ({
  lazyNamedComponent: (_loader: unknown, exportName: string) => {
    return function MockLazyComponent() {
      return React.createElement('div', { 'data-testid': `mock-${exportName}` });
    };
  },
}));

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

async function dispatch(eventName: string): Promise<void> {
  await act(async () => {
    window.dispatchEvent(new CustomEvent(eventName));
  });
}

function makeNode(id: string, title: string): ProblemNode {
  return {
    id,
    title,
    description: '',
    targetFunction: 'x => 0_1 / 0_1',
    type: 'scientific_task',
    state: 'open',
    dependencyIds: [],
    dependentIds: [],
    zoneIds: ['math'],
  } as unknown as ProblemNode;
}

beforeEach(() => {
  useCommandStateStore.setState({ is3DMode: true, isSimulationRunning: false, isAutoProverRunning: false });
  window.history.replaceState({}, '', '/');
});

afterEach(async () => {
  vi.restoreAllMocks();
  if (root) {
    await act(async () => { root?.unmount(); });
  }
  container?.remove();
  root = undefined;
  container = undefined;
});

describe('command bus: kinematic page (BUG-02)', () => {
  it('syncs the shared isSimulationRunning flag on mount and via ricis:kinematic-toggle-play', async () => {
    await render(<KinematicEnginePage onBackToMap={() => {}} />);
    // The page starts running by default — the toolbar indicator must see it.
    expect(useCommandStateStore.getState().isSimulationRunning).toBe(true);

    await dispatch('ricis:kinematic-toggle-play');
    expect(useCommandStateStore.getState().isSimulationRunning).toBe(false);

    await dispatch('ricis:kinematic-toggle-play');
    expect(useCommandStateStore.getState().isSimulationRunning).toBe(true);
  });

  it('pauses and performs one discrete step on ricis:kinematic-step', async () => {
    await render(<KinematicEnginePage onBackToMap={() => {}} />);
    await dispatch('ricis:kinematic-toggle-play'); // pause first for a deterministic step
    expect(useCommandStateStore.getState().isSimulationRunning).toBe(false);

    // The step must not re-start the loop.
    await dispatch('ricis:kinematic-step');
    expect(useCommandStateStore.getState().isSimulationRunning).toBe(false);
  });

  it('resets the simulation on ricis:kinematic-reset without throwing', async () => {
    const rendered = await render(<KinematicEnginePage onBackToMap={() => {}} />);
    await dispatch('ricis:kinematic-reset');
    expect(rendered).toBeDefined();
  });
});

describe('command bus: proof console (BUG-02)', () => {
  const proofRunFixture: ProofRunResponse = {
    apiVersion: 'v1',
    proofRunId: '11111111-2222-4333-8444-555555555555',
    correlationId: 'corr-test',
    createdAtUtc: '2026-09-16T00:00:00.000Z',
    expiresAtUtc: '2026-09-16T01:00:00.000Z',
    coreVersion: 'test-core',
    canonicalClaim: 'x => x',
    normalizedClaim: 'x => x',
    structuralVerification: 'StructurallyVerified',
    trustStatus: 'RequiresCoreLean',
    evidenceBoundaryResourceKey: 'proof.core.lean.required',
    trace: [],
    documents: [{ format: 'Academic', contentHash: 'hash' }],
  };

  it('ricis:terminal-lean-verify sends the current claim through the Lean 4 gateway', async () => {
    const createRun = vi.fn().mockResolvedValue(proofRunFixture);
    const gateway = { createRun, getRun: vi.fn(), getDocument: vi.fn(), getCapabilities: vi.fn() } as unknown as IRicisProofGateway;
    const engine = {
      status: 'ready_api',
      initialize: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn(),
    } as unknown as IRicisCoreEngine;

    await render(<RicisProofConsoleModal isOpen onClose={() => {}} initialClaim="0_5 * inf_3" coreEngine={engine} proofGateway={gateway} />);

    await dispatch('ricis:terminal-lean-verify');
    expect(createRun).toHaveBeenCalledTimes(1);
    expect(createRun.mock.calls[0]![0]).toMatchObject({ claim: '0_5 * inf_3', expected: '0_5 * inf_3' });
  });

  it('ricis:terminal-clear empties the shared REPL buffer and console output', async () => {
    const engine = {
      status: 'ready_api',
      initialize: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn(),
    } as unknown as IRicisCoreEngine;
    const gateway = { createRun: vi.fn(), getRun: vi.fn(), getDocument: vi.fn(), getCapabilities: vi.fn() } as unknown as IRicisProofGateway;

    act(() => {
      useTerminalStore.getState().setInput('0_3 / 0_3');
      useTerminalStore.setState({
        history: [{
          id: '1',
          timestamp: Date.now(),
          expression: '0_3 / 0_3',
          result: null,
          formalProof: null,
          error: null,
        }],
      });
    });

    await render(<RicisProofConsoleModal isOpen onClose={() => {}} coreEngine={engine} proofGateway={gateway} />);
    expect(useTerminalStore.getState().history.length).toBe(1);

    await dispatch('ricis:terminal-clear');
    expect(useTerminalStore.getState().history).toEqual([]);
    expect(useTerminalStore.getState().currentInput).toBe('');
  });
});

describe('command bus: auto prover (BUG-02)', () => {
  beforeEach(() => {
    act(() => {
      useMapStore.setState({
        nodes: [makeNode('qa-node-1', 'QA Task One'), makeNode('qa-node-2', 'QA Task Two')],
        edges: [],
      });
    });
  });

  it('ricis:qa-run-floodfill runs the batch and renders results', async () => {
    const rendered = await render(<AutoProverModal isOpen onClose={() => {}} />);

    await dispatch('ricis:qa-run-floodfill');
    // The batch is asynchronous: wait for the result tabs to appear.
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline && !rendered.textContent?.includes('qa-node-')) {
      await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    }
    expect(rendered.textContent).toContain('qa-node-');
    // Then wait for the batch to finish (results render before the
    // store-application phase), so the run indicator must be cleared.
    const flagDeadline = Date.now() + 10_000;
    while (Date.now() < flagDeadline && useCommandStateStore.getState().isAutoProverRunning) {
      await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    }
    expect(useCommandStateStore.getState().isAutoProverRunning).toBe(false);
  }, 30000);

  it('ricis:qa-export-report downloads the structured JSON report', async () => {
    const createObjectUrl = vi.fn().mockReturnValue('blob:mock-report');
    const revokeObjectUrl = vi.fn();
    const anchorClick = vi.fn();
    vi.spyOn(URL, 'createObjectURL').mockImplementation(createObjectUrl);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revokeObjectUrl);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(anchorClick);

    await render(<AutoProverModal isOpen onClose={() => {}} />);
    await dispatch('ricis:qa-export-report');

    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    expect(anchorClick).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);
  });
});

describe('command bus: App level (BUG-02/BUG-03)', () => {
  it('global.diagnostics runs the real system audit', async () => {
    await render(<App />);
    // Let hydration finish (in-memory canonical fallback in jsdom).
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline && !useMapStore.getState().hydrated) {
      await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    }
    expect(useMapStore.getState().hydrated).toBe(true);

    await dispatch('ricis:run-diagnostics');
    const reportDeadline = Date.now() + 8000;
    while (Date.now() < reportDeadline && useMapStore.getState().lastAuditReport === null) {
      await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    }
    expect(useMapStore.getState().lastAuditReport).not.toBeNull();
    expect(useMapStore.getState().lastAuditReport!.totalInspected).toBeGreaterThan(0);
  }, 30000);

  it('the settings applet renders real adaptive roles (BUG-03)', async () => {
    window.history.replaceState({}, '', '/?applet=settings');
    localStorage.removeItem('ricis_adaptive_ui');
    const rendered = await render(<App />);
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline && !useMapStore.getState().hydrated) {
      await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    }
    // The full SettingsModal is composed with the real role catalog
    // (the old stub passed roles=[] and silently lost created roles).
    expect(rendered.textContent).toContain('Общий профиль');
    expect(rendered.textContent).toContain('Аналитик (Исследование)');
    expect(rendered.textContent).toContain('Архитектор (Симуляция)');
  }, 30000);
});
