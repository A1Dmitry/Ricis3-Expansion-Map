import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, GitBranch, Layers, Lock, RefreshCw, ShieldCheck, Sprout, XCircle } from 'lucide-react';

import {
  Ric,
  coveredFormsOf,
  type ExpansionResult,
  type RicisSeedState,
} from '../ricisSeed';
import { DEMO_PROBLEM_CATALOG } from '../ricisSeed/ricisSeed.unsolvedRegistry';
import type { RicisState, UnsolvedSingularProblem } from '../ricisSeed/contracts';
import { UrlShareService } from '../services/UrlShareService';

interface RicisSeedPageProps {
  onBackToMap: () => void;
}

const LAYER_STYLE: Record<string, string> = {
  LAW: 'border-fuchsia-700/70 bg-fuchsia-950/30 text-fuchsia-200',
  PROTOCOL: 'border-cyan-700/70 bg-cyan-950/30 text-cyan-200',
  AXIOM: 'border-slate-700/70 bg-slate-900/50 text-slate-200',
  META_AXIOM: 'border-emerald-500/80 bg-emerald-950/40 text-emerald-200',
};

const LAYER_LABEL: Record<string, string> = {
  LAW: 'LAW',
  PROTOCOL: 'SP/P',
  AXIOM: 'AXIOM',
  META_AXIOM: 'META',
};

const TRUST_LABEL: Record<string, { text: string; className: string }> = {
  STRUCTURAL_PROOF: { text: 'STRUCTURAL PROOF', className: 'border-emerald-700/70 bg-emerald-950/40 text-emerald-200' },
  REJECTION_DEMO: { text: 'REJECTION DEMO', className: 'border-amber-700/70 bg-amber-950/40 text-amber-200' },
  OPEN_NO_PROOF: { text: 'OPEN / NO PROOF', className: 'border-slate-700/70 bg-slate-900/50 text-slate-300' },
};

const OUTCOME_ICON = {
  PASS: <CheckCircle2 size={13} className="text-emerald-400" />,
  FAIL: <XCircle size={13} className="text-red-400" />,
  SKIPPED: <ShieldCheck size={13} className="text-slate-500" />,
} as const;

export function RicisSeedPage({ onBackToMap }: RicisSeedPageProps): React.JSX.Element {
  const [seed, setSeed] = useState<RicisSeedState>(Ric.seed);
  const [problemId, setProblemId] = useState<string>(DEMO_PROBLEM_CATALOG[0]!.problem.id);
  const [result, setResult] = useState<ExpansionResult | null>(null);
  const [history, setHistory] = useState<readonly { readonly problemId: string; readonly outcome: string }[]>([]);

  const system = useMemo(() => Ric.from(seed), [seed]);
  const coveredForms = useMemo(() => coveredFormsOf(seed.axioms), [seed]);
  const selected = DEMO_PROBLEM_CATALOG.find(entry => entry.problem.id === problemId) ?? DEMO_PROBLEM_CATALOG[0]!;
  const problem: UnsolvedSingularProblem = selected.problem;
  const isCovered = coveredForms.includes(problem.inputForm);
  const expansions = seed.axioms.filter(axiom => axiom.origin === 'EXPANSION');

  const runExpansion = (): void => {
    const outcome = system.ExpandTo((x: RicisState) => x.Resolve(problem));
    setResult(outcome);
    setHistory(previous => [
      ...previous,
      { problemId: problem.id, outcome: outcome.kind === 'EXPANDED' ? `+${outcome.axiom.id}` : outcome.reason },
    ]);
    setSeed(outcome.seed);
  };

  const resetToSeed = (): void => {
    setSeed(Ric.seed);
    setResult(null);
    setHistory([]);
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-slate-200 font-sans">
      <header className="sticky top-0 z-10 border-b border-emerald-900/50 bg-[#070707]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBackToMap}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900/70 px-3 text-xs font-bold uppercase tracking-wider text-slate-200 hover:border-cyan-500 hover:text-cyan-200"
          >
            <ArrowLeft size={14} /> Карта
          </button>
          <Sprout size={18} className="text-emerald-400" />
          <h1 className="text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-300">
            RICIS SEED <span className="hidden sm:inline text-slate-500">// протокол саморасширения A11</span>
          </h1>
          <span className="rounded-full border border-emerald-600/70 bg-emerald-950/50 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-200">
            R{seed.generation}
          </span>
          <span className="font-mono text-[10px] text-slate-500">{seed.fingerprint}</span>
          <button
            type="button"
            onClick={resetToSeed}
            className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900/70 px-3 text-xs font-bold uppercase tracking-wider text-slate-300 hover:border-emerald-500 hover:text-emerald-200"
          >
            <RefreshCw size={13} /> Сброс к зерну
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* ---------- формула и зерно ---------- */}
        <section className="space-y-4">
          <article className="rounded-lg border border-emerald-900/60 bg-emerald-950/10 p-4">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">Каноническая запись</h2>
            <pre className="overflow-x-auto rounded border border-slate-800 bg-black/60 p-3 font-mono text-[12px] leading-relaxed text-emerald-200">
{`Ric.ExpandTo((x) => x.Resolve(UnsolvedSingularProblem))

x        — состояние самой системы RICIS (аксиомы, покрытие, журнал)
Resolve  — разрешить И доказать
ExpandTo — допуск доказанного правила: R(k+1) = R(k) ∪ {A_new}`}
            </pre>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
              A11 — это <span className="text-emerald-300">мета-аксиома</span>, правило над системой правил, а не одиннадцатая
              формула рядом с A1–A10. Ядро (L0/L1/L1C*, SP1–SP5, P1, A11) защищено: ни одно расширение не переопределяет его.
            </p>
          </article>

          <article className="rounded-lg border border-slate-800 bg-[#0a0a0a] p-4">
            <h2 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">
              <Layers size={14} className="text-cyan-400" /> Состав R{seed.generation}: {seed.axioms.length} правил
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {seed.axioms.map(axiom => (
                <span
                  key={axiom.id}
                  title={`${axiom.statement}\n${axiom.fingerprint}`}
                  className={`rounded border px-1.5 py-0.5 font-mono text-[11px] ${LAYER_STYLE[axiom.layer] ?? LAYER_STYLE.AXIOM}`}
                >
                  {axiom.id}
                  <span className="ml-1 text-[9px] opacity-60">{LAYER_LABEL[axiom.layer]}</span>
                </span>
              ))}
            </div>
            {expansions.length > 0 && (
              <div className="mt-3 space-y-1 border-t border-slate-800 pt-3">
                <p className="text-[10px] uppercase tracking-wider text-emerald-400">Выращено семенем ({expansions.length})</p>
                {expansions.map(axiom => (
                  <div key={axiom.id} className="rounded border border-emerald-900/60 bg-emerald-950/20 p-2">
                    <p className="font-mono text-[11px] text-emerald-200">{axiom.statement}</p>
                    <p className="font-mono text-[9px] text-slate-500">{axiom.fingerprint} ← {axiom.solvedProblemId}</p>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-lg border border-slate-800 bg-[#0a0a0a] p-4">
            <h2 className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">
              <GitBranch size={14} className="text-violet-400" /> Журнал развёртывания
            </h2>
            {seed.ledger.length === 0 ? (
              <p className="text-[11px] text-slate-500">Журнал пуст: система ещё в состоянии зерна R0.</p>
            ) : (
              <table className="w-full text-left font-mono text-[10px]">
                <thead className="text-slate-500">
                  <tr>
                    <th className="py-1">#</th>
                    <th className="py-1">проблема</th>
                    <th className="py-1">аксиома</th>
                    <th className="py-1">R(k) → R(k+1)</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {seed.ledger.map(record => (
                    <tr key={record.sequence} className="border-t border-slate-800">
                      <td className="py-1">{record.sequence}</td>
                      <td className="py-1 text-cyan-300">{record.problemId.replace('U-', '')}</td>
                      <td className="py-1 text-emerald-300">{record.axiomId}</td>
                      <td className="py-1 text-slate-500">R{record.fromGeneration} → R{record.toGeneration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {history.length > 0 && (
              <p className="mt-3 border-t border-slate-800 pt-2 font-mono text-[10px] text-slate-500">
                попыток: {history.length} · {history.map(entry => entry.outcome).join(' · ')}
              </p>
            )}
          </article>
        </section>

        {/* ---------- проблему → resolve → ворота ---------- */}
        <section className="space-y-4">
          <article className="rounded-lg border border-slate-800 bg-[#0a0a0a] p-4">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">
              Нерешённая структурная проблема U
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {DEMO_PROBLEM_CATALOG.map(entry => {
                const active = entry.problem.id === problemId;
                const covered = coveredForms.includes(entry.problem.inputForm);
                return (
                  <button
                    key={entry.problem.id}
                    type="button"
                    onClick={() => setProblemId(entry.problem.id)}
                    className={`min-h-14 rounded-md border p-2 text-left transition-all ${
                      active
                        ? 'border-emerald-500 bg-emerald-950/30'
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-600'
                    }`}
                  >
                    <span className="block text-[11px] font-bold text-slate-200">{entry.title}</span>
                    <span className="mt-0.5 block font-mono text-[10px] text-cyan-300">{entry.problem.inputForm}</span>
                    <span className="mt-1 flex items-center gap-1.5">
                      <span className={`rounded border px-1 py-px text-[9px] ${TRUST_LABEL[entry.trust]!.className}`}>
                        {TRUST_LABEL[entry.trust]!.text}
                      </span>
                      {covered && (
                        <span className="rounded border border-slate-700 bg-slate-900 px-1 py-px text-[9px] text-slate-400">
                          УЖЕ ПОКРЫТА
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-slate-400">{selected.expectationText}</p>

            <button
              type="button"
              onClick={runExpansion}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-emerald-600/70 bg-emerald-950/50 px-4 text-xs font-bold uppercase tracking-wider text-emerald-200 hover:border-emerald-400 hover:bg-emerald-900/50"
            >
              <Sprout size={15} /> Ric.ExpandTo((x) =&gt; x.Resolve(U))
            </button>
          </article>

          {result && (
            <article
              className={`rounded-lg border p-4 ${
                result.kind === 'EXPANDED' ? 'border-emerald-700/70 bg-emerald-950/20' : 'border-red-800/70 bg-red-950/20'
              }`}
            >
              <h2 className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em]">
                {result.kind === 'EXPANDED' ? (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span className="text-emerald-300">EXPANDED → R{result.seed.generation}</span>
                  </>
                ) : (
                  <>
                    <XCircle size={14} className="text-red-400" />
                    <span className="text-red-300">REJECTED · {result.reason}</span>
                  </>
                )}
              </h2>

              {result.kind === 'EXPANDED' ? (
                <div className="space-y-2">
                  <div className="rounded border border-emerald-800/70 bg-black/40 p-3">
                    <p className="font-mono text-[12px] text-emerald-200">{result.axiom.statement}</p>
                    <p className="mt-1 font-mono text-[10px] text-slate-500">
                      {result.axiom.id} · {result.axiom.fingerprint} · стратегия {result.record.proofStrategy}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-400">Шаги доказательства</p>
                    <ol className="space-y-1 font-mono text-[11px]">
                      {(result.axiom.proof?.steps ?? []).map((step, index) => (
                        <li key={`${step.rule}-${index}`} className="rounded border border-slate-800 bg-black/40 px-2 py-1">
                          <span className="text-violet-300">{step.rule}</span>
                          <span className="text-slate-500"> : </span>
                          <span className="text-slate-300">{step.from}</span>
                          <span className="text-slate-500"> → </span>
                          <span className="text-emerald-300">{step.to}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              ) : (
                <p className="font-mono text-[11px] leading-relaxed text-red-200">{result.detail}</p>
              )}

              <div className="mt-3 space-y-1 border-t border-slate-800 pt-3">
                <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-400">Ворота допуска (admissibility gates)</p>
                {result.trace.map(entry => (
                  <div key={entry.gate} className="flex items-start gap-2 font-mono text-[10px]">
                    <span className="mt-0.5">{OUTCOME_ICON[entry.outcome]}</span>
                    <span className={entry.outcome === 'FAIL' ? 'text-red-300' : entry.outcome === 'PASS' ? 'text-slate-300' : 'text-slate-500'}>
                      {entry.gate}
                    </span>
                    <span className="min-w-0 flex-1 break-words text-slate-500">{entry.detail}</span>
                  </div>
                ))}
              </div>

              {result.kind === 'REJECTED' && (
                <p className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                  <Lock size={13} className="text-slate-500" /> Состояние системы не изменилось: отпечаток R{result.seed.generation} сохранён.
                </p>
              )}
            </article>
          )}

          <article className="rounded-lg border border-amber-900/60 bg-amber-950/10 p-4">
            <h2 className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
              <ShieldCheck size={14} /> Граница доверия
            </h2>
            <ul className="space-y-1 text-[11px] leading-relaxed text-slate-400">
              <li>· A12–A14 — <span className="text-emerald-300">производные правила</span>: доказаны только из аксиом зерна, а не новые допущения.</li>
              <li>· Локальная структурная проверка (ворота, отпечатки, монотонность) <span className="text-amber-300">не является запуском ядра Lean</span>.</li>
              <li>· Статус верификации ядром Lean: <span className="text-amber-300">REQUIRES_CORE_LEAN</span> — требуется toolchain, compiler output, #print axioms, отсутствие sorryAx.</li>
              <li>· Таблица согласованности — проверка по точной форме; она ловит явные противоречия, но не является полной процедурой унификации.</li>
            </ul>
            <button
              type="button"
              onClick={() => UrlShareService.updateBrowserUrl({ seed: true })}
              className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded border border-slate-700 bg-slate-900/70 px-2.5 text-[10px] uppercase tracking-wider text-slate-300"
            >
              <GitBranch size={12} /> Ссылка на это состояние (?view=seed)
            </button>
          </article>
        </section>
      </main>
    </div>
  );
}
