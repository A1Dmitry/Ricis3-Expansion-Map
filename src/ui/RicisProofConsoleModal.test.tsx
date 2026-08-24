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

let root: Root | undefined;
let container: HTMLDivElement | undefined;

interface EngineFixture {
  readonly engine: IRicisCoreEngine;
  readonly legacyGenerateProof: ReturnType<typeof vi.fn>;
  readonly legacyVerifyProof: ReturnType<typeof vi.fn>;
}

interface RenderProofConsoleOptions {
  readonly locale?: 'ru' | 'en-US';
  readonly onClose?: () => void;
  readonly engine: IRicisCoreEngine;
  readonly proofGateway: IRicisProofGateway;
  readonly initialClaim?: string;
}

function createGateway(createRun: ReturnType<typeof vi.fn>): IRicisProofGateway {
  return {
    createRun,
    getRun: vi.fn(),
    getDocument: vi.fn(),
    getCapabilities: vi.fn(),
  } as unknown as IRicisProofGateway;
}

function createEngineFixture(): EngineFixture {
  const legacyGenerateProof = vi.fn();
  const legacyVerifyProof = vi.fn();

  return {
    engine: {
      status: 'ready_api',
      initialize: vi.fn().mockResolvedValue(undefined),
      generateFormalProof: legacyGenerateProof,
      verifyProofChain: legacyVerifyProof,
    } as unknown as IRicisCoreEngine,
    legacyGenerateProof,
    legacyVerifyProof,
  };
}

async function renderProofConsole({
  locale = 'ru',
  onClose = () => {},
  engine,
  proofGateway,
  initialClaim = 'x => x',
}: RenderProofConsoleOptions): Promise<HTMLDivElement> {
  useI18nStore.getState().setLocale(locale);
  const renderedContainer = document.createElement('div');
  document.body.append(renderedContainer);
  const renderedRoot = createRoot(renderedContainer);

  root = renderedRoot;
  container = renderedContainer;

  await act(async () => {
    renderedRoot.render(React.createElement(RicisProofConsoleModal, {
      isOpen: true,
      onClose,
      initialClaim,
      coreEngine: engine,
      proofGateway,
    }));
  });

  return renderedContainer;
}

describe('RicisProofConsoleModal authoritative proof transport', () => {
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

  it('contains no production legacy proof method call and localizes the close control', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/ui/RicisProofConsoleModal.tsx'), 'utf8');

    expect(source).toContain('proofGateway.createRun');
    expect(source).not.toMatch(/\b(generateFormalProof|verifyProofChain|proveSystem)\b/);
    expect(source).toContain("aria-label={t('proofConsole.close')}");
    expect(source).toContain("title={t('proofConsole.close')}");
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
    expect(store.t('proofConsole.close')).toBe('Закрыть консоль доказательств');

    store.setLocale('en-US');
    expect(store.t('proofConsole.title')).toBe('RICIS-III Proof & Singularity Console');
    expect(store.t('proofConsole.evaluate')).toBe('Evaluate in O(1)');
    expect(store.t('proofConsole.traceTitle')).toBe('Eight-phase pipeline trace (phases -1...6)');
    expect(store.t('proofConsole.close')).toBe('Close proof console');
  });

  it('renders an accessible localized close control without changing close behavior', async () => {
    const onClose = vi.fn();
    const { engine } = createEngineFixture();
    const proofGateway = createGateway(vi.fn());
    const renderedContainer = await renderProofConsole({ onClose, engine, proofGateway });

    const russianClose = renderedContainer.querySelector<HTMLButtonElement>(
      '[aria-label="Закрыть консоль доказательств"]',
    );
    expect(russianClose?.title).toBe('Закрыть консоль доказательств');

    await act(async () => {
      russianClose?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    await act(async () => {
      useI18nStore.getState().setLocale('en-US');
    });
    const englishClose = renderedContainer.querySelector<HTMLButtonElement>('[aria-label="Close proof console"]');
    expect(englishClose?.title).toBe('Close proof console');
  });

  it('sends one bounded createRun request and never invokes legacy proof methods', async () => {
    const { engine, legacyGenerateProof, legacyVerifyProof } = createEngineFixture();
    const createRun = vi.fn().mockResolvedValue(runFixture);
    const proofGateway = createGateway(createRun);
    const fixtureBeforeRender = JSON.parse(JSON.stringify(runFixture)) as ProofRunResponse;
    const renderedContainer = await renderProofConsole({ engine, proofGateway });

    const proveTab = Array.from(renderedContainer.querySelectorAll('button'))
      .find(button => button.textContent?.includes('Генератор формальных доказательств'));
    expect(proveTab).toBeDefined();

    await act(async () => {
      proveTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const submit = renderedContainer.querySelector<HTMLButtonElement>('[data-testid="proof-console-create-run"]');
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
    expect(renderedContainer.textContent).toContain('proof-console-test-correlation');
    expect(renderedContainer.textContent).toContain('RequiresCoreLean');
    expect(runFixture).toEqual(fixtureBeforeRender);
  });

  it('renders a safe recovery resource key without legacy proof fallback on Core failure', async () => {
    const { engine, legacyGenerateProof, legacyVerifyProof } = createEngineFixture();
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
    const renderedContainer = await renderProofConsole({ engine, proofGateway });

    const proveTab = Array.from(renderedContainer.querySelectorAll('button'))
      .find(button => button.textContent?.includes('Генератор формальных доказательств'));
    expect(proveTab).toBeDefined();
    await act(async () => {
      proveTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const submit = renderedContainer.querySelector<HTMLButtonElement>('[data-testid="proof-console-create-run"]');

    await act(async () => {
      submit?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(createRun).toHaveBeenCalledTimes(1);
    expect(legacyGenerateProof).not.toHaveBeenCalled();
    expect(legacyVerifyProof).not.toHaveBeenCalled();
    expect(renderedContainer.textContent).toContain('proof.core.gateway.CORE_UNAVAILABLE');
  });
});
