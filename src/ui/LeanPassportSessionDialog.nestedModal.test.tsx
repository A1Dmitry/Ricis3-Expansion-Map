import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LeanPassportSessionDialog } from './LeanPassportSessionDialog';
import type { EphemeralPassportSessionView } from '../leanPassportSession/leanPassportSession.domain';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const view: EphemeralPassportSessionView = Object.freeze({
  state: 'SOURCE_BOUND_READ_ONLY',
  reference: Object.freeze({
    nodeId: 'node-cr-01',
    sourceFingerprint: `sha256:${'a'.repeat(64)}`,
    submittedAt: '2026-08-26T00:00:00.000Z',
    trustStatus: 'REQUIRES_CORE_LEAN',
    sourceLocked: true,
  }),
  basis: 'SOURCE_LOCKED_PROVENANCE',
  disclosures: Object.freeze(['read-only']),
  capabilities: Object.freeze({
    canMutate: false,
    canVerify: false,
    canUpload: false,
    canPersist: false,
    canRevealRawSource: false,
  }),
});

const mounted: Array<{ readonly root: Root; readonly container: HTMLDivElement }> = [];

afterEach(async () => {
  for (const entry of mounted.splice(0)) {
    await act(async () => entry.root.unmount());
    entry.container.remove();
  }
});

async function renderNestedDialog() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  mounted.push({ root, container });
  const onParentEditClose = vi.fn();
  const onPassportClose = vi.fn();
  await act(async () => {
    root.render(
      <div data-testid="edit-modal-overlay" onClick={onParentEditClose}>
        <LeanPassportSessionDialog view={view} onClose={onPassportClose} />
      </div>,
    );
  });
  return { container, onParentEditClose, onPassportClose };
}

describe('RICIS-CODE-REAUDIT-CORRECTION-01 valid-red: CR-01 nested Passport containment', () => {
  it('CR01-QA-01 keeps parent edit session open when Passport content is clicked', async () => {
    const rendered = await renderNestedDialog();
    const content = rendered.container.querySelector('section');
    expect(content).not.toBeNull();
    await act(async () => content?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(rendered.onParentEditClose).not.toHaveBeenCalled();
  });

  it('CR01-QA-02 delegates Passport close without closing its parent edit session', async () => {
    const rendered = await renderNestedDialog();
    const closeButton = rendered.container.querySelector<HTMLButtonElement>('button[aria-label="Закрыть паспорт источника"]');
    expect(closeButton).not.toBeNull();
    await act(async () => closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(rendered.onPassportClose).toHaveBeenCalledTimes(1);
    expect(rendered.onParentEditClose).not.toHaveBeenCalled();
  });
});
