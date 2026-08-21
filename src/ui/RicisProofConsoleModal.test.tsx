// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RicisProofConsoleModal } from './RicisProofConsoleModal';
import type { IRicisCoreEngine } from '../services/ricisCore/IRicisCoreEngine';
import type { IRicisProofGateway, ProofRunResponse } from '../services/ricisCore/IRicisProofGateway';
import { useI18nStore } from '../store/useI18nStore';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const runFixture: ProofRunResponse = {
  apiVersion: 'v1',
  proofRunId: '5cbe924b-5bbd-4baf-bf8d-5c2cdd79d2ab',
  correlationId: 'proof-console-test-correlation',
  createdAtUtc: '2026-08-21T00:00:00.000Z',
  expiresAtUtc: '2026-08-21T01:00:00.000Z',
  coreVersion: 'test-core',
  canonicalClaim: 'x => x',
  normalizedClaim: 'x => x',
  structuralVerification: 'StructurallyVerified',
  trustStatus: 'RequiresCoreLean',
  evidenceBoundaryResourceKey: 'proof.core.lean.required',
  trace: [],
  documents: [
    { format: 'Academic', contentHash: 'academic-hash' },
    { format: 'Latex', contentHash: 'latex-hash' },
    { format: 'Log', contentHash: 'log-hash' },
  ],
};

function createGateway(createRun: ReturnType<typeof vi.fn>): IRicisProofGateway {
  return {
    createRun,
    getRun: vi.fn(),
    getDocument: vi.fn(),
    getCapabilities: vi.fn(),
  } as unknown as IRicisProofGateway;
}

describe('RicisProofConsoleModal authoritative proof transport', () => {
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;

  beforeEach(() => {
    useI18nStore.getState().setLocale('ru');
  });

  afterEach(async () => {
    if (root) {
      await act(async () => root?.unmount());
    }
    container?.remove();
    root = undefined;
    container = undefined;
  });

  it('contains no production legacy proof method call', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/ui/RicisProofConsoleModal.tsx'), 'utf8');

    expect(source).toContain('proofGateway.createRun');
    expect(source).not.toMatch(/\b(generateFormalProof|verifyProofChain|proveSystem)\b/);
    for (const formerLiteral of [
      'RICIS-III Proof & Singularity Console',
      'Вычисление сингулярностей O(1)',
      'Генератор формальных доказательств',
      'Предустановки:',
      'Вычисление...',
      'Точный инвариант RICIS-III',
      'Трассировка 8 фаз конвейера',
    ]) {
      expect(source).not.toContain(formerLiteral);
    }
  });

  it('provides bilingual dictionary resources for the console surface', () => {
    const store = useI18nStore.getState();
    store.setLocale('ru');
    expect(store.t('proofConsole.title')).toBe('Консоль доказательств и сингулярностей RICIS-III');
    expect(store.t('proofConsole.evaluate')).toBe('Рассчитать за O(1)');
    expect(store.t('proofConsole.traceTitle')).toBe('Трассировка 8 фаз конвейера (фазы -1...6)');

    store.setLocale('en');
    expect(store.t('proofConsole.title')).toBe('RICIS-III Proof & Singularity Console');
    expect(store.t('proofConsole.evaluate')).toBe('Evaluate in O(1)');
    expect(store.t('proofConsole.traceTitle')).toBe('Eight-phase pipeline trace (phases -1...6)');
  });

  it('sends one bounded createRun request and never invokes legacy proof methods', async () => {
    const legacyGenerateProof = vi.fn();
    const legacyVerifyProof = vi.fn();
    const engine = {
      status: 'ready_api',
      initialize: vi.fn().mockResolvedValue(undefined),
      generateFormalProof: legacyGenerateProof,
      verifyProofChain: legacyVerifyProof,
    } as unknown as IRicisCoreEngine;
    const createRun = vi.fn().mockResolvedValue(runFixture);
    const proofGateway = createGateway(createRun);

    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(React.createElement(RicisProofConsoleModal, {
        isOpen: true,
        onClose: () => {},
        initialClaim: 'x => x',
        coreEngine: engine,
        proofGateway,
      } as any));
    });

    const proveTab = Array.from(container.querySelectorAll('button'))
      .find(button => button.textContent?.includes('Генератор формальных доказательств'));
    expect(proveTab).toBeDefined();

    await act(async () => {
      proveTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const submit = container.querySelector<HTMLButtonElement>('[data-testid="proof-console-create-run"]');
    expect(submit).not.toBeNull();

    await act(async () => {
      submit?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(createRun).toHaveBeenCalledTimes(1);
    expect(createRun).toHaveBeenCalledWith({
      claim: 'x => x',
      expected: 'x => x',
      requestedFormats: ['Academic', 'Latex', 'Log'],
    });
    expect(legacyGenerateProof).not.toHaveBeenCalled();
    expect(legacyVerifyProof).not.toHaveBeenCalled();
    expect(container.textContent).toContain('proof-console-test-correlation');
    expect(container.textContent).toContain('RequiresCoreLean');
  });

  it('renders a safe recovery resource key without legacy proof fallback on Core failure', async () => {
    const legacyGenerateProof = vi.fn();
    const legacyVerifyProof = vi.fn();
    const engine = {
      status: 'ready_api',
      initialize: vi.fn().mockResolvedValue(undefined),
      generateFormalProof: legacyGenerateProof,
      verifyProofChain: legacyVerifyProof,
    } as unknown as IRicisCoreEngine;
    const createRun = vi.fn().mockResolvedValue({
      success: false,
      code: 'CORE_UNAVAILABLE',
      userMessage: 'proof.core.gateway.CORE_UNAVAILABLE',
      diagnostic: {
        origin: 'unknown',
        runtime: 'csharp_api',
        retryable: true,
      },
    });
    const proofGateway = createGateway(createRun);

    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(React.createElement(RicisProofConsoleModal, {
        isOpen: true,
        onClose: () => {},
        initialClaim: 'x => x',
        coreEngine: engine,
        proofGateway,
      } as any));
    });

    const proveTab = Array.from(container.querySelectorAll('button'))
      .find(button => button.textContent?.includes('Генератор формальных доказательств'));
    await act(async () => {
      proveTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const submit = container.querySelector<HTMLButtonElement>('[data-testid="proof-console-create-run"]');

    await act(async () => {
      submit?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(createRun).toHaveBeenCalledTimes(1);
    expect(legacyGenerateProof).not.toHaveBeenCalled();
    expect(legacyVerifyProof).not.toHaveBeenCalled();
    expect(container.textContent).toContain('proof.core.gateway.CORE_UNAVAILABLE');
  });
});
