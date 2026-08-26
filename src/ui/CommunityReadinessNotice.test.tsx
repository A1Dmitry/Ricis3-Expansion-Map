import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Projection = Readonly<{
  kind: 'programme_unconfigured' | 'availability_unreachable' | 'availability_invalid';
  title: string;
  statusLabel: string;
  detail: string;
  invitationStatement: string;
  rewardStatement: string;
  botStatement: string;
  authorityStatement: string;
}>;

interface FutureComponent {
  CommunityReadinessNotice: React.ComponentType<{
    readonly projection: Projection;
    readonly isCopyingInvitation: boolean;
    readonly copyResult: 'idle' | 'copied' | 'failed';
    readonly onCopyInvitation: () => void;
    readonly onClose: () => void;
  }>;
}

const futureComponentPath = './CommunityReadinessNotice';
const future = () => import(/* @vite-ignore */ futureComponentPath) as Promise<FutureComponent>;
const source = () => readFileSync(resolve(process.cwd(), 'src/ui/CommunityReadinessNotice.tsx'), 'utf8');

const projection: Projection = Object.freeze({
  kind: 'programme_unconfigured',
  title: 'Готовность сообщества',
  statusLabel: 'Программа наград пока не подключена',
  detail: 'Для запуска потребуются защищённая identity и долговечный server ledger.',
  invitationStatement: 'Ссылка приложения может быть скопирована только по вашему явному действию.',
  rewardStatement: 'Награды, токены, баланс, реферальный код и учётная запись в этой панели не создаются и не подтверждаются.',
  botStatement: 'Внешний Telegram-бот не подключён; опубликованная Telegram-панель является только локальной симуляцией.',
  authorityStatement: 'Открытие, чтение или закрытие панели не изменяет RICIS III v7.7, P=NP, Lean/TeX, Core, proof, source, provenance, trust, state, node или solution status.',
});

let root: Root | undefined;
let container: HTMLDivElement | undefined;

async function renderNotice(
  module: FutureComponent,
  options?: Partial<{ isCopyingInvitation: boolean; copyResult: 'idle' | 'copied' | 'failed'; onCopyInvitation: () => void; onClose: () => void }>,
) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  const onCopyInvitation = options?.onCopyInvitation ?? vi.fn();
  const onClose = options?.onClose ?? vi.fn();
  await act(async () => {
    root?.render(React.createElement(module.CommunityReadinessNotice, {
      projection,
      isCopyingInvitation: options?.isCopyingInvitation ?? false,
      copyResult: options?.copyResult ?? 'idle',
      onCopyInvitation,
      onClose,
    }));
  });
  return { container, onCopyInvitation, onClose };
}

afterEach(async () => {
  await act(async () => root?.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
});

describe('COMMUNITY-READINESS-01 G3 — controlled readiness notice', () => {
  it('CR01-QA-19: notice имеет semantic dialog role', async () => {
    const rendered = await renderNotice(await future());
    expect(rendered.container.querySelector('[role="dialog"][aria-modal="true"]')).not.toBeNull();
  });

  it('CR01-QA-20: notice показывает видимый заголовок и status detail', async () => {
    const rendered = await renderNotice(await future());
    expect(rendered.container.textContent).toContain(projection.title);
    expect(rendered.container.textContent).toContain(projection.statusLabel);
    expect(rendered.container.textContent).toContain(projection.detail);
  });

  it('CR01-QA-21: notice показывает invitation и no-reward disclosures', async () => {
    const rendered = await renderNotice(await future());
    expect(rendered.container.textContent).toContain(projection.invitationStatement);
    expect(rendered.container.textContent).toContain(projection.rewardStatement);
  });

  it('CR01-QA-22: notice показывает bot и authority disclosures', async () => {
    const rendered = await renderNotice(await future());
    expect(rendered.container.textContent).toContain(projection.botStatement);
    expect(rendered.container.textContent).toContain(projection.authorityStatement);
  });

  it('CR01-QA-23: close control вызывает только onClose', async () => {
    const rendered = await renderNotice(await future());
    await act(async () => (rendered.container.querySelector('button[aria-label="Закрыть информацию о готовности сообщества"]') as HTMLButtonElement).click());
    expect(rendered.onClose).toHaveBeenCalledTimes(1);
    expect(rendered.onCopyInvitation).not.toHaveBeenCalled();
  });

  it('CR01-QA-24: overlay close вызывает только onClose', async () => {
    const rendered = await renderNotice(await future());
    await act(async () => (rendered.container.firstElementChild as HTMLDivElement).dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
    expect(rendered.onClose).toHaveBeenCalledTimes(1);
    expect(rendered.onCopyInvitation).not.toHaveBeenCalled();
  });

  it('CR01-QA-25: Escape закрывает controlled notice без side effect', async () => {
    const rendered = await renderNotice(await future());
    await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(rendered.onClose).toHaveBeenCalledTimes(1);
    expect(rendered.onCopyInvitation).not.toHaveBeenCalled();
  });

  it('CR01-QA-26: copy button вызывает только injected onCopyInvitation', async () => {
    const rendered = await renderNotice(await future());
    await act(async () => (rendered.container.querySelector('button:not([aria-label])') as HTMLButtonElement).click());
    expect(rendered.onCopyInvitation).toHaveBeenCalledTimes(1);
    expect(rendered.onClose).not.toHaveBeenCalled();
  });

  it('CR01-QA-27: copy button obeys isCopyingInvitation', async () => {
    const rendered = await renderNotice(await future(), { isCopyingInvitation: true });
    const copyButton = rendered.container.querySelector('button:not([aria-label])') as HTMLButtonElement;
    expect(copyButton.disabled).toBe(true);
    expect(copyButton.textContent).toContain('Копирование');
  });

  it('CR01-QA-28: copy result ограничен idle copied failed', async () => {
    const module = await future();
    const idle = await renderNotice(module);
    expect(idle.container.querySelector('[role="status"]')).toBeNull();
    await act(async () => root?.unmount());
    container?.remove();
    root = undefined;
    container = undefined;
    const copied = await renderNotice(module, { copyResult: 'copied' });
    expect(copied.container.querySelector('[role="status"]')?.textContent).toContain('Ссылка приложения скопирована');
  });

  it('CR01-QA-29: close и copy controls keyboard accessible', async () => {
    const rendered = await renderNotice(await future());
    expect(rendered.container.querySelectorAll('button')).toHaveLength(2);
    expect(document.activeElement).toBe(rendered.container.querySelector('button[aria-label="Закрыть информацию о готовности сообщества"]'));
  });

  it('CR01-QA-30: critical disclosure не скрывается в narrow layout', async () => {
    const rendered = await renderNotice(await future());
    expect(rendered.container.textContent).toContain('Награды не активированы');
    expect(rendered.container.querySelector('[aria-label="Граница наград"]')?.className).not.toContain('hidden');
  });

  it('CR01-QA-31: status result имеет semantic accessible region', async () => {
    const rendered = await renderNotice(await future(), { copyResult: 'failed' });
    expect(rendered.container.querySelector('[role="status"]')?.textContent).toContain('Не удалось скопировать');
  });

  it('CR01-QA-32: component не имеет direct transport or service import', () => {
    expect(source()).not.toMatch(/communityRewardsClient|UrlShareService|communityRewardsApplication|telegramBot|server\//);
    expect(source()).not.toMatch(/ricisCore|Lean|fetch\b/);
  });

  it('CR01-QA-33: component не создаёт reward account referral or authority semantics', () => {
    const componentSource = source();
    expect(componentSource).not.toMatch(/localStorage|referralCode|accountId|tokenAmount|window\.open/);
    expect(componentSource).toContain('onCopyInvitation');
    expect(componentSource).toContain('onClose');
  });
});
