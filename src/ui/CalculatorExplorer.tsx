import type { CalculatorExplorerEntry } from '../calculatorExplorer/calculatorExplorer.domain';
import type { SupportedLocale, TranslationKey } from '../model/i18n.types';

interface Props {
  readonly isOpen: boolean;
  readonly entries: readonly CalculatorExplorerEntry[];
  readonly locale: SupportedLocale;
  readonly t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  readonly onClose: () => void;
  readonly onSelectNode: (nodeId: string) => void;
}

function select(onSelectNode: (nodeId: string) => void, nodeId: string): void {
  onSelectNode(nodeId);
}

export function CalculatorExplorer({ isOpen, entries, locale, t, onClose, onSelectNode }: Props) {
  const catalogLocale = locale === 'ru' ? 'ru' : 'en';
  if (!isOpen) return null;

  return (
    <section aria-label={t('calculatorExplorer.title')} className="mt-2 rounded border border-emerald-800/70 bg-emerald-950/20 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-300">{t('calculatorExplorer.title')}</p>
          <p className="mt-1 text-[9px] leading-relaxed text-emerald-100/75">{t('calculatorExplorer.subtitle')}</p>
        </div>
        <button type="button" aria-label={t('calculatorExplorer.close')} onClick={onClose} className="rounded px-1.5 py-0.5 text-xs text-emerald-200 transition-colors hover:bg-emerald-900/70 hover:text-white">✕</button>
      </div>

      <div className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-1" role="list">
        {entries.map(entry => (
          <button
            key={entry.monolith.id}
            type="button"
            aria-label={t('calculatorExplorer.open', { title: entry.monolith.title[catalogLocale] })}
            onClick={() => select(onSelectNode, entry.nodeId)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                select(onSelectNode, entry.nodeId);
              }
            }}
            className="w-full rounded border border-emerald-950/80 bg-black/15 px-2 py-1.5 text-left transition-colors hover:border-emerald-700/80 hover:bg-emerald-950/45 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            <span className="block text-[10px] font-semibold text-emerald-100">{entry.monolith.title[catalogLocale]}</span>
            <code className="mt-0.5 block text-[9px] text-cyan-200">{entry.semanticIndexExpression}</code>
            {entry.monolith.calculator.mode === 'KINEMATIC' && (
              <span className="mt-1 block text-[8.5px] leading-relaxed text-amber-100/85">{entry.researchOnlyDisclosure}</span>
            )}
            {entry.launch.kind === 'UNCONFIGURED' && (
              <span className="mt-1 block text-[8.5px] text-amber-300">{t('calculatorExplorer.unconfigured', { reason: entry.launch.reason ?? 'unknown' })}</span>
            )}
            {entry.launch.kind === 'REJECTED' && (
              <span className="mt-1 block text-[8.5px] text-rose-300">{t('calculatorExplorer.rejected', { reason: entry.launch.reason ?? 'unknown' })}</span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
