// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentLogModal } from './AgentLogModal';
import type { AgentLogEntry } from '../model/types';
import { useI18nStore } from '../store/useI18nStore';
import { useMapStore } from '../store/mapStore';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const payloadEntry: AgentLogEntry = {
  id: 'agent-log-payload-1',
  timestamp: '12:34:56',
  level: 'ricis',
  message: 'A6 bridge 0_F × ∞_G preserves the typed product.',
  details: 'External payload — preserve byte-for-byte: αβγ',
  nodeId: 'node-r-17',
};

const originalLogs = useMapStore.getState().agentLogs;
let root: Root | undefined;
let container: HTMLDivElement | undefined;
let writeText: ReturnType<typeof vi.fn>;

async function renderAgentLog(locale: 'ru' | 'en-US' | 'fr-CA' | 'de-DE' | 'hi-IN' | 'ms-MY' = 'en-US', onClose = vi.fn(), onSelectNode = vi.fn()) {
  useI18nStore.getState().setLocale(locale);
  useMapStore.setState({ agentLogs: [payloadEntry] });

  const renderedContainer = document.createElement('div');
  document.body.append(renderedContainer);
  const renderedRoot = createRoot(renderedContainer);
  root = renderedRoot;
  container = renderedContainer;

  await act(async () => {
    renderedRoot.render(React.createElement(AgentLogModal, { onClose, onSelectNode }));
  });

  return { renderedContainer, onClose, onSelectNode };
}

function getButton(containerElement: HTMLDivElement, label: string): HTMLButtonElement {
  const button = containerElement.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
  expect(button, `Expected accessible action ${label}`).not.toBeNull();
  return button!;
}

describe('AgentLogModal localization boundary', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    useI18nStore.getState().setLocale('ru');
    useMapStore.setState({ agentLogs: [payloadEntry] });
  });

  afterEach(async () => {
    if (root) {
      await act(async () => root?.unmount());
    }
    container?.remove();
    root = undefined;
    container = undefined;
    useMapStore.setState({ agentLogs: originalLogs });
  });

  it('uses the single typed i18n seam and contains no legacy presentation literals or proof dependencies', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/ui/AgentLogModal.tsx'), 'utf8');

    expect(source).toContain("useI18nStore");
    for (const key of [
      'agentLog.title',
      'agentLog.close',
      'agentLog.filter.all',
      'agentLog.search.placeholder',
      'agentLog.copy',
      'agentLog.clear',
      'agentLog.total',
      'agentLog.clipboard.details',
    ]) {
      expect(source).toContain(key);
    }

    for (const formerLiteral of [
      'Журнал промежуточных шагов ИИ-Агента',
      'Фильтр сообщений...',
      'Автопрокрутка',
      'Копировать показанные логи в буфер',
      'Нет записей лога, соответствующих выбранному фильтру.',
      'Всего записей:',
      'Details:',
    ]) {
      expect(source).not.toContain(formerLiteral);
    }

    expect(source).not.toMatch(/from ['"].*(ricisCore|proof|lean|gateway|api).*['"]/i);
    expect(source).not.toMatch(/fetch\(|axios|XMLHttpRequest/);
  });

  it('renders localized English chrome while preserving all agent-log payload fields verbatim', async () => {
    const { renderedContainer } = await renderAgentLog('en-US');

    expect(renderedContainer.textContent).toContain('AI Agent activity log');
    expect(renderedContainer.textContent).toContain('All (1)');
    expect(renderedContainer.textContent).toContain(payloadEntry.timestamp);
    expect(renderedContainer.textContent).toContain(payloadEntry.level);
    expect(renderedContainer.textContent).toContain(payloadEntry.message);
    expect(renderedContainer.textContent).toContain(payloadEntry.details);
    expect(renderedContainer.textContent).not.toContain('Журнал промежуточных шагов ИИ-Агента');
  });

  it('makes close, copy, clear, level filter and node navigation accessible without changing callbacks', async () => {
    const { renderedContainer, onClose, onSelectNode } = await renderAgentLog('en-US');

    const close = getButton(renderedContainer, 'Close agent log');
    expect(close.title).toBe('Close agent log');
    await act(async () => close.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(onClose).toHaveBeenCalledTimes(1);

    const all = getButton(renderedContainer, 'All (1)');
    expect(all.getAttribute('aria-pressed')).toBe('true');

    const clear = getButton(renderedContainer, 'Clear log');
    await act(async () => clear.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(useMapStore.getState().agentLogs).toHaveLength(1);
    expect(useMapStore.getState().agentLogs[0]?.message).toBe('Журнал логов очищен.');

    await act(async () => {
      useMapStore.setState({ agentLogs: [payloadEntry] });
    });
    const nodeLink = getButton(renderedContainer, 'Go to node');
    await act(async () => nodeLink.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(onSelectNode).toHaveBeenCalledWith(payloadEntry.nodeId);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('copies localized static wrapper while preserving message and details payload byte-for-byte', async () => {
    const { renderedContainer } = await renderAgentLog('en-US');

    const copy = getButton(renderedContainer, 'Copy visible logs');
    await act(async () => copy.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(writeText).toHaveBeenCalledWith(
      `[${payloadEntry.timestamp}] [${payloadEntry.level.toUpperCase()}] ${payloadEntry.message}\n  Details: ${payloadEntry.details}`,
    );
    expect(payloadEntry.message).toBe('A6 bridge 0_F × ∞_G preserves the typed product.');
    expect(payloadEntry.details).toBe('External payload — preserve byte-for-byte: αβγ');
  });

  it('uses explicit non-Russian copy for every coverage locale without Cyrillic leakage', async () => {
    const { renderedContainer } = await renderAgentLog('en-US');

    for (const locale of ['en-US', 'fr-CA', 'de-DE', 'hi-IN', 'ms-MY'] as const) {
      await act(async () => useI18nStore.getState().setLocale(locale));
      const close = renderedContainer.querySelector<HTMLButtonElement>('button[aria-label]');
      expect(close?.getAttribute('aria-label'), `missing ${locale} close label`).toBeTruthy();
      expect(close?.getAttribute('aria-label')).not.toMatch(/[\u0400-\u04FF]/);
      expect(renderedContainer.textContent, `Cyrillic presentation leak for ${locale}`).not.toMatch(/Журнал промежуточных шагов ИИ-Агента|Фильтр сообщений|Автопрокрутка/);
    }
  });
});
