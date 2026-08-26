import type { EphemeralPassportSessionView } from '../leanPassportSession/leanPassportSession.domain';

type LeanPassportSessionDialogProps = Readonly<{
  readonly view: EphemeralPassportSessionView;
  readonly onClose: () => void;
}>;

export function LeanPassportSessionDialog({ view, onClose }: LeanPassportSessionDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Паспорт источника Lean"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4"
    >
      <section className="w-full max-w-lg space-y-4 rounded-lg border border-cyan-700/60 bg-[#090d15] p-5 text-sm text-cyan-100 shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-cyan-900/60 pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-cyan-300">Паспорт источника Lean</h2>
            <p className="mt-1 text-xs text-gray-300">Source-bound reference без раскрытия исходного текста.</p>
          </div>
          <button
            type="button"
            aria-label="Закрыть паспорт источника"
            onClick={onClose}
            className="rounded border border-cyan-800 px-2 py-1 text-xs font-bold text-cyan-200 hover:border-cyan-400 hover:text-white"
          >
            Закрыть
          </button>
        </header>

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-xs">
          <dt className="font-bold text-gray-400">Узел</dt>
          <dd className="break-all font-mono text-cyan-100">{view.reference.nodeId}</dd>
          <dt className="font-bold text-gray-400">Fingerprint</dt>
          <dd className="break-all font-mono text-cyan-100">{view.reference.sourceFingerprint}</dd>
          <dt className="font-bold text-gray-400">Получен</dt>
          <dd className="font-mono text-cyan-100">{view.reference.submittedAt}</dd>
          <dt className="font-bold text-gray-400">Статус</dt>
          <dd className="font-mono text-cyan-100">{view.reference.trustStatus}</dd>
          <dt className="font-bold text-gray-400">Основание</dt>
          <dd className="font-mono text-cyan-100">{view.basis}</dd>
        </dl>

        <div className="space-y-2 rounded border border-cyan-900/60 bg-cyan-950/25 p-3 text-xs leading-relaxed">
          {view.disclosures.map(disclosure => <p key={disclosure}>{disclosure}</p>)}
        </div>
      </section>
    </div>
  );
}
