/// <reference types="vitest/globals" />

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type SessionView = Readonly<{
  state: 'SOURCE_BOUND_READ_ONLY';
  reference: Readonly<{
    nodeId: string;
    sourceFingerprint: string;
    submittedAt: string;
    trustStatus: 'REQUIRES_CORE_LEAN';
    sourceLocked: true;
  }>;
  basis: 'SOURCE_LOCKED_PROVENANCE';
  disclosures: readonly string[];
  capabilities: Readonly<{
    canMutate: false;
    canVerify: false;
    canUpload: false;
    canPersist: false;
    canRevealRawSource: false;
  }>;
}>;

type DialogProps = { readonly view: SessionView; readonly onClose: () => void };
type DialogContract = { readonly LeanPassportSessionDialog: React.ComponentType<DialogProps> };

const CONTRACT_PATH = './LeanPassportSessionDialog';
const future = () => import(/* @vite-ignore */ CONTRACT_PATH) as Promise<DialogContract>;
const view: SessionView = Object.freeze({
  state: 'SOURCE_BOUND_READ_ONLY',
  reference: Object.freeze({
    nodeId: 'source-bound-node',
    sourceFingerprint: 'sha256:v1:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    submittedAt: '2026-08-26T00:00:00.000Z',
    trustStatus: 'REQUIRES_CORE_LEAN',
    sourceLocked: true,
  }),
  basis: 'SOURCE_LOCKED_PROVENANCE',
  disclosures: Object.freeze([
    'Сессия только для чтения.',
    'Lean Kernel не запускается.',
    'Исходный текст Lean не раскрывается.',
    'Ничего не сохраняется.',
  ]),
  capabilities: Object.freeze({ canMutate: false, canVerify: false, canUpload: false, canPersist: false, canRevealRawSource: false }),
});

let root: Root | undefined;
let container: HTMLDivElement | undefined;

async function renderDialog(module: DialogContract, onClose = vi.fn()) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => root?.render(React.createElement(module.LeanPassportSessionDialog, { view, onClose })));
  return { container, onClose };
}

afterEach(async () => {
  await act(async () => root?.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
});

describe('RICIS-LEAN-PASSPORT-ROUTE-B1 — controlled dialog red baseline', () => {
  it('LPB1-QA-18 exposes an accessible read-only dialog', async () => {
    const rendered = await renderDialog(await future());
    expect(rendered.container.querySelector('[role="dialog"][aria-label="Паспорт источника Lean"]')).not.toBeNull();
  });

  it('LPB1-QA-19 renders the exact node reference', async () => {
    const rendered = await renderDialog(await future());
    expect(rendered.container.textContent).toContain('source-bound-node');
  });

  it('LPB1-QA-20 renders the exact source fingerprint metadata', async () => {
    const rendered = await renderDialog(await future());
    expect(rendered.container.textContent).toContain(view.reference.sourceFingerprint);
  });

  it('LPB1-QA-21 renders SOURCE_LOCKED_PROVENANCE basis', async () => {
    const rendered = await renderDialog(await future());
    expect(rendered.container.textContent).toContain('SOURCE_LOCKED_PROVENANCE');
  });

  it('LPB1-QA-22 renders read-only disclosure', async () => {
    const rendered = await renderDialog(await future());
    expect(rendered.container.textContent).toContain('Сессия только для чтения.');
  });

  it('LPB1-QA-23 states that Lean Kernel is not executed', async () => {
    const rendered = await renderDialog(await future());
    expect(rendered.container.textContent).toContain('Lean Kernel не запускается.');
  });

  it('LPB1-QA-24 states that raw Lean source is not revealed', async () => {
    const rendered = await renderDialog(await future());
    expect(rendered.container.textContent).toContain('Исходный текст Lean не раскрывается.');
  });

  it('LPB1-QA-25 states that no persistence occurs', async () => {
    const rendered = await renderDialog(await future());
    expect(rendered.container.textContent).toContain('Ничего не сохраняется.');
  });

  it('LPB1-QA-26 delegates close through one explicit callback', async () => {
    const rendered = await renderDialog(await future());
    await act(async () => (rendered.container.querySelector('button[aria-label="Закрыть паспорт источника"]') as HTMLButtonElement).click());
    expect(rendered.onClose).toHaveBeenCalledTimes(1);
  });

  it('LPB1-QA-27 has no verify control', async () => {
    const rendered = await renderDialog(await future());
    expect(rendered.container.textContent).not.toMatch(/проверить|verify/i);
  });

  it('LPB1-QA-28 has no upload or external-launch control', async () => {
    const rendered = await renderDialog(await future());
    expect(rendered.container.textContent).not.toMatch(/загрузить|upload|внешний сервис/i);
  });

  it('LPB1-QA-29 has no save, copy or export control', async () => {
    const rendered = await renderDialog(await future());
    expect(rendered.container.textContent).not.toMatch(/сохранить|копировать|экспорт/i);
  });

  it('LPB1-QA-30 renders displayed trust metadata without a capability control', async () => {
    const rendered = await renderDialog(await future());
    expect(rendered.container.textContent).toContain('REQUIRES_CORE_LEAN');
    expect(rendered.container.textContent).not.toContain('canPersist');
  });
});
