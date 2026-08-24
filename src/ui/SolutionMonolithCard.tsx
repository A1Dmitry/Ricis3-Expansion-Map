import { ExternalLink, FileCheck2, GitCommitHorizontal, ShieldCheck, Waypoints } from 'lucide-react';
import type { SolutionMonolithCardView } from '../ricisSolutionCatalog';

interface Props {
  readonly view: SolutionMonolithCardView;
}

function sourceHref(view: SolutionMonolithCardView): string | undefined {
  const source = view.source;
  if (!source) return undefined;
  return `${source.repositoryUrl}/blob/${source.commit}/${source.sourcePath}`;
}

export function SolutionMonolithCard({ view }: Props) {
  const solution = view.solution;
  if (!solution) return null;

  const href = sourceHref(view);
  return (
    <section className="border-b border-emerald-900/50 bg-gradient-to-br from-emerald-950/25 via-neutral-950/40 to-cyan-950/20 p-3" aria-label="RICIS III solution monolith">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-300">RICIS III solution monolith</p>
          <h3 className="mt-1 text-[12px] font-semibold text-emerald-50">{solution.title.ru}</h3>
          <p className="mt-0.5 text-[9px] text-emerald-200/70">{solution.category.ru}</p>
        </div>
        <div className="flex flex-col items-end gap-1" aria-label="Evidence basis">
          {view.green.evidenceLabels.map(label => (
            <span key={label} className="rounded border border-emerald-500/60 bg-emerald-950/80 px-1.5 py-0.5 text-[8px] font-bold text-emerald-200">
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-md border border-emerald-900/60 bg-black/25 p-2.5">
        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
          <FileCheck2 size={12} />
          Как проверять evidence
        </div>
        <p className="mt-1 text-[10px] leading-relaxed text-slate-200">{view.proofDisclosure.summary}</p>
        <ol className="mt-2 space-y-1 border-l border-emerald-800/60 pl-3 text-[9.5px] leading-relaxed text-slate-300">
          {view.proofDisclosure.steps.map((step, index) => <li key={`${index}:${step}`}>{step}</li>)}
        </ol>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-md border border-neutral-800 bg-neutral-950/55 p-2">
          <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Семантический индекс</p>
          <code className="mt-1 block break-all text-[9.5px] text-cyan-200">{solution.sourceEvidence.semanticIndexExpression}</code>
        </div>
        <div className="rounded-md border border-neutral-800 bg-neutral-950/55 p-2">
          <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Пример</p>
          <p className="mt-1 text-[9.5px] leading-relaxed text-slate-300">{solution.example.expectedStructuralResult}</p>
        </div>
      </div>

      <div className="mt-2 rounded-md border border-neutral-800 bg-neutral-950/55 p-2 text-[9px] text-slate-300">
        <p className="font-bold uppercase tracking-wider text-slate-500">Визуализация</p>
        <p className="mt-1 leading-relaxed">{solution.visualization.description}</p>
        <p className="mt-1 text-slate-400">{solution.visualization.altText}</p>
      </div>

      <details className="mt-2 rounded-md border border-neutral-800 bg-neutral-950/55 p-2 text-[9px] text-slate-300">
        <summary className="cursor-pointer select-none font-bold text-slate-200">Источник и воспроизводимость</summary>
        {view.source && (
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 break-all">
            <dt className="text-slate-500">Commit</dt><dd className="font-mono text-cyan-200">{view.source.commit}</dd>
            <dt className="text-slate-500">SHA-256</dt><dd className="font-mono text-cyan-200">{view.source.contentHash}</dd>
            <dt className="text-slate-500">Path</dt><dd className="font-mono text-cyan-200">{view.source.sourcePath}</dd>
            <dt className="text-slate-500">License</dt><dd>{view.source.licenceLabel}</dd>
          </dl>
        )}
        {view.proofDisclosure.leanEvidenceAvailable && (
          <p className="mt-2 flex items-center gap-1 text-emerald-300"><ShieldCheck size={11} /> Lean kernel evidence is separately available in the formal-verification section.</p>
        )}
      </details>

      {view.relations.length > 0 && (
        <div className="mt-2 rounded-md border border-neutral-800 bg-neutral-950/55 p-2 text-[9px] text-slate-300">
          <p className="flex items-center gap-1 font-bold uppercase tracking-wider text-slate-500"><Waypoints size={11} /> Просмотренные связи</p>
          <ul className="mt-1 space-y-1">
            {view.relations.map(relation => <li key={relation.id} className="leading-relaxed">{relation.kind}: {relation.sourceRationale}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded border border-cyan-700/70 bg-cyan-950/45 px-2 py-1 text-[9px] font-bold text-cyan-200 hover:border-cyan-400 hover:text-white">
            <GitCommitHorizontal size={11} /> Открыть immutable source <ExternalLink size={10} />
          </a>
        )}
        {view.launch.kind === 'READY' && view.launch.href && (
          <a href={view.launch.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded border border-emerald-700/70 bg-emerald-950/45 px-2 py-1 text-[9px] font-bold text-emerald-200 hover:border-emerald-400 hover:text-white">
            Открыть visual calculator <ExternalLink size={10} />
          </a>
        )}
        {view.launch.kind !== 'READY' && (
          <span className="rounded border border-amber-800/70 bg-amber-950/35 px-2 py-1 text-[9px] text-amber-200">Calculator launch не настроен: {view.launch.reason}</span>
        )}
      </div>
    </section>
  );
}
