import React, { useEffect, useRef } from 'react';
import type { CommunityReadinessProjection } from '../communityReadiness/communityReadiness.domain';

export type CommunityInvitationCopyResult = 'idle' | 'copied' | 'failed';

export interface CommunityReadinessNoticeProps {
  readonly projection: CommunityReadinessProjection;
  readonly isCopyingInvitation: boolean;
  readonly copyResult: CommunityInvitationCopyResult;
  readonly onCopyInvitation: () => void;
  readonly onClose: () => void;
}

const copyResultText: Readonly<Record<CommunityInvitationCopyResult, string | null>> = {
  idle: null,
  copied: 'Ссылка приложения скопирована.',
  failed: 'Не удалось скопировать ссылку приложения.',
};

/**
 * Controlled local presentation for the already-normalized availability status.
 * It deliberately receives all interactions as callbacks and contains no
 * transport, clipboard, reward, identity, ledger, bot or authority logic.
 */
export const CommunityReadinessNotice: React.FC<CommunityReadinessNoticeProps> = ({
  projection,
  isCopyingInvitation,
  copyResult,
  onCopyInvitation,
  onClose,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const copyMessage = copyResultText[copyResult];

  useEffect(() => {
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Готовность сообщества"
        className="w-full max-w-2xl rounded-xl border border-violet-500/60 bg-[#090d14] shadow-2xl"
        onMouseDown={event => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-violet-900/60 bg-[#05080e] p-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-violet-300">Сообщество · read-only статус</p>
            <h2 className="mt-1 text-base font-bold text-white">{projection.title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Закрыть информацию о готовности сообщества"
            onClick={onClose}
            className="rounded border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-sm font-bold text-gray-300 transition-colors hover:border-violet-400 hover:text-white"
          >
            Закрыть
          </button>
        </header>

        <div className="space-y-4 p-4 text-sm leading-relaxed text-slate-200">
          <section aria-label="Текущий статус" className="rounded-lg border border-violet-900/70 bg-violet-950/30 p-3">
            <h3 className="font-semibold text-violet-100">{projection.statusLabel}</h3>
            <p className="mt-1 text-slate-200">{projection.detail}</p>
          </section>

          <section aria-label="Граница приглашения" className="rounded-lg border border-slate-700/70 bg-slate-950/50 p-3">
            <h3 className="font-semibold text-white">Ссылка приложения</h3>
            <p className="mt-1 text-slate-300">{projection.invitationStatement}</p>
            <button
              type="button"
              onClick={onCopyInvitation}
              disabled={isCopyingInvitation}
              className="mt-3 rounded border border-violet-600/70 bg-violet-950/70 px-3 py-2 text-xs font-bold text-violet-100 transition-colors hover:bg-violet-800/70 disabled:cursor-wait disabled:opacity-70"
            >
              {isCopyingInvitation ? 'Копирование…' : 'Скопировать ссылку приложения'}
            </button>
            {copyMessage !== null && <p role="status" className="mt-2 text-xs text-violet-200">{copyMessage}</p>}
          </section>

          <section aria-label="Граница наград" className="rounded-lg border border-amber-900/60 bg-amber-950/20 p-3">
            <h3 className="font-semibold text-amber-100">Награды не активированы</h3>
            <p className="mt-1 text-amber-50">{projection.rewardStatement}</p>
          </section>

          <section aria-label="Граница внешнего бота" className="rounded-lg border border-cyan-900/60 bg-cyan-950/20 p-3">
            <h3 className="font-semibold text-cyan-100">Внешний канал не подключён</h3>
            <p className="mt-1 text-cyan-50">{projection.botStatement}</p>
          </section>

          <section aria-label="Граница авторитетности" className="rounded-lg border border-rose-900/60 bg-rose-950/20 p-3">
            <h3 className="font-semibold text-rose-100">Граница авторитетности</h3>
            <p className="mt-1 text-rose-50">{projection.authorityStatement}</p>
          </section>
        </div>
      </section>
    </div>
  );
};
