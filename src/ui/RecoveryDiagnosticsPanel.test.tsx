import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecoveryDiagnosticsPanel } from './RecoveryDiagnosticsPanel';
import type { RecoveryDiagnosticProjection } from './recoveryDiagnostics.types';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const projection: RecoveryDiagnosticProjection = {
  fields: [
    { id: 'code', label: 'Код', value: 'CORE_UNAVAILABLE' },
    { id: 'origin', label: 'Точка вызова', value: 'proof_console' },
    { id: 'runtime', label: 'Runtime', value: 'csharp_api' },
    { id: 'retryable', label: 'Повторная проверка', value: 'Можно повторить health-check' },
    { id: 'httpStatus', label: 'HTTP status', value: '503' },
    { id: 'occurredAt', label: 'Время события', value: '2023-11-14T22:13:20.000Z' },
  ],
  clipboardText: 'RICIS Core recovery code: CORE_UNAVAILABLE',
};

let root: Root | undefined;
let container: HTMLDivElement | undefined;

async function renderPanel(overrides: Partial<React.ComponentProps<typeof RecoveryDiagnosticsPanel>> = {}): Promise<HTMLDivElement> {
  const renderedContainer = document.createElement('div');
  document.body.append(renderedContainer);
  const renderedRoot = createRoot(renderedContainer);
  root = renderedRoot;
  container = renderedContainer;

  await act(async () => {
    renderedRoot.render(React.createElement(RecoveryDiagnosticsPanel, {
      projection,
      healthState: {
        kind: 'unavailable',
        message: 'Health endpoint пока не подтвердил доступность Core. Старый proof-запрос не повторялся.',
      },
      copied: false,
      onProbe: vi.fn(),
      onCopy: vi.fn(),
      probeDisabled: false,
      ...overrides,
    }));
  });

  return renderedContainer;
}

afterEach(async () => {
  if (root) {
    await act(async () => root?.unmount());
  }
  container?.remove();
  root = undefined;
  container = undefined;
});

describe('RecoveryDiagnosticsPanel', () => {
  it('renders the closed allowlist, an explicit operational health state and no raw-detail placeholders', async () => {
    const renderedContainer = await renderPanel();

    expect(renderedContainer.querySelector('[data-testid="recovery-diagnostics-panel"]')).not.toBeNull();
    for (const field of projection.fields) {
      const item = renderedContainer.querySelector(`[data-testid="recovery-diagnostic-${field.id}"]`);
      expect(item?.textContent).toContain(field.label);
      expect(item?.textContent).toContain(field.value);
    }
    expect(renderedContainer.querySelector('[data-testid="recovery-health-state"]')?.textContent)
      .toBe('Health endpoint пока не подтвердил доступность Core. Старый proof-запрос не повторялся.');
    expect(renderedContainer.textContent).not.toMatch(/safeDetail|secretToken|Expression:|Stack:|correlationId|proofRunId/i);
  });

  it('delegates health-only probe and bounded diagnostic copy to page-owned callbacks', async () => {
    const onProbe = vi.fn();
    const onCopy = vi.fn();
    const renderedContainer = await renderPanel({ onProbe, onCopy });

    const probe = renderedContainer.querySelector<HTMLButtonElement>('[data-testid="recovery-health-probe"]');
    const copy = renderedContainer.querySelector<HTMLButtonElement>('[data-testid="recovery-diagnostic-copy"]');
    expect(probe?.disabled).toBe(false);

    await act(async () => {
      probe?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      copy?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onProbe).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('keeps probe disabled while checking and labels copied bounded diagnostics without implying proof success', async () => {
    const renderedContainer = await renderPanel({
      healthState: { kind: 'checking', message: 'Проверка health endpoint Ricis.Core…' },
      copied: true,
      probeDisabled: true,
    });

    const probe = renderedContainer.querySelector<HTMLButtonElement>('[data-testid="recovery-health-probe"]');
    const copy = renderedContainer.querySelector<HTMLButtonElement>('[data-testid="recovery-diagnostic-copy"]');
    expect(probe?.disabled).toBe(true);
    expect(probe?.textContent).toContain('Проверка health endpoint Ricis.Core…');
    expect(copy?.textContent).toContain('Диагностика скопирована');
    expect(renderedContainer.textContent).not.toMatch(/proof verified|LeanVerified|invariant|trace/i);
  });
});
