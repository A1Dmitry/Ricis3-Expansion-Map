import type { MonolithGuidedCaseTrail } from '../monolithGuidedCaseTrail/monolithGuidedCaseTrail.domain';
import type { SupportedLocale, TranslationKey } from '../model/i18n.types';

interface Props {
  readonly isOpen: boolean;
  readonly trail: Extract<MonolithGuidedCaseTrail, { readonly kind: 'PROJECTED' }>;
  readonly locale: SupportedLocale;
  readonly t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  readonly onClose: () => void;
  readonly onSelectNode: (nodeId: string) => void;
}

export function MonolithGuidedCaseTrail({ isOpen, trail, locale, t, onClose, onSelectNode }: Props) {
  const catalogLocale = locale === 'ru' ? 'ru' : 'en';
  if (!isOpen) return null;

  const select = (nodeId: string) => onSelectNode(nodeId);
  const selectFromKeyboard = (event: React.KeyboardEvent<HTMLButtonElement>, nodeId: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    select(nodeId);
  };

  return (
    <section aria-label={t('guidedTrail.label')} className="mt-2 rounded border border-cyan-800/70 bg-cyan-950/20 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-cyan-300">{t('guidedTrail.title')}</p>
          <p className="mt-1 text-[10px] leading-relaxed text-slate-300">{t('guidedTrail.subtitle')}</p>
        </div>
        <button type="button" aria-label={t('guidedTrail.close')} onClick={onClose} className="rounded border border-slate-700 px-2 py-1 text-[9px] font-bold text-slate-200 hover:border-cyan-400 hover:text-white">
          {t('guidedTrail.close')}
        </button>
      </div>

      <p className="mt-2 rounded border border-amber-800/70 bg-amber-950/30 p-2 text-[9px] leading-relaxed text-amber-100">{t('guidedTrail.educationalDisclosure')}</p>

      <div className="mt-2 space-y-2">
        {trail.entries.map(item => {
          const { entry } = item;
          const { monolith } = entry;
          return (
            <article key={monolith.id} className="rounded border border-neutral-800 bg-neutral-950/55 p-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold text-slate-100">{monolith.title[catalogLocale]}</p>
                  <p className="mt-0.5 text-[8px] uppercase tracking-wider text-slate-500">{monolith.category[catalogLocale]} · {item.familyId}</p>
                </div>
                {item.isInitialAnchor && <span className="rounded border border-cyan-700/70 bg-cyan-950/40 px-1.5 py-0.5 text-[8px] font-bold text-cyan-200">{t('guidedTrail.initialAnchor')}</span>}
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div className="rounded border border-neutral-800 bg-black/20 p-1.5">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">{t('guidedTrail.semanticIndex')}</p>
                  <code className="mt-1 block break-all text-[9px] text-cyan-200">{entry.semanticIndexExpression}</code>
                </div>
                <div className="rounded border border-neutral-800 bg-black/20 p-1.5">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">{t('guidedTrail.structuralResult')}</p>
                  <p className="mt-1 text-[9px] leading-relaxed text-slate-300">{monolith.example.expectedStructuralResult}</p>
                </div>
              </div>

              <ol className="mt-2 space-y-1 border-l border-cyan-900/70 pl-3 text-[8.5px] leading-relaxed text-slate-300">
                {monolith.example.orderedRuleTrace.map((step, index) => <li key={`${monolith.id}:${index}:${step}`}>{step}</li>)}
              </ol>

              <div className="mt-2 rounded border border-neutral-800 bg-black/20 p-1.5 text-[8.5px] leading-relaxed text-slate-400">
                <p>{monolith.visualization.description}</p>
                <p className="mt-1">{monolith.visualization.altText}</p>
              </div>

              <p className="mt-2 rounded border border-neutral-800 bg-black/20 p-1.5 text-[8.5px] leading-relaxed text-slate-300">{entry.researchOnlyDisclosure}</p>

              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  aria-label={t('guidedTrail.open', { title: monolith.title[catalogLocale] })}
                  onClick={() => select(entry.nodeId)}
                  onKeyDown={event => selectFromKeyboard(event, entry.nodeId)}
                  className="rounded border border-cyan-700/70 bg-cyan-950/45 px-2 py-1 text-[8.5px] font-bold text-cyan-200 hover:border-cyan-400 hover:text-white"
                >
                  {t('guidedTrail.open', { title: monolith.title[catalogLocale] })}
                </button>
                {item.outgoing.map(relation => (
                  <button
                    key={relation.relationId}
                    type="button"
                    aria-label={t('guidedTrail.follow', { title: relation.to.entry.monolith.title[catalogLocale] })}
                    onClick={() => select(relation.to.entry.nodeId)}
                    onKeyDown={event => selectFromKeyboard(event, relation.to.entry.nodeId)}
                    className="rounded border border-slate-700 bg-slate-900/70 px-2 py-1 text-[8.5px] text-slate-300 hover:border-cyan-500 hover:text-white"
                  >
                    {relation.sourceRationale}
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
