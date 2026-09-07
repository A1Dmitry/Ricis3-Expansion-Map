// ============================================================================
// RICIS-III RATIONAL SINGULARITY INSPECTOR CARD COMPONENT
// MVVM, Clean Architecture, SOLID, DRY
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// Verified via Lean 4 Core Theorem: A1_div_zero
// ============================================================================

import React, { useMemo } from 'react';
import { Network, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Sigma } from 'lucide-react';
import { RationalSingularityEngine } from '../../../services/rationalSingularity/rationalSingularityEngine';
import type { IRationalSingularityInspectorProps } from './rationalSingularityInspector.contracts';

export const RationalSingularityInspectorCard: React.FC<IRationalSingularityInspectorProps> = ({
  exampleId,
  title,
  rationalInput,
  description,
}) => {
  const engine = useMemo(() => new RationalSingularityEngine(), []);

  const analysis = useMemo(() => {
    return engine.resolveRationalSingularity(rationalInput);
  }, [engine, rationalInput]);

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 shadow-xl flex flex-col gap-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sigma className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            {exampleId}: {title} — Анализ D({analysis.variable}) = 0
          </h4>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
          <ShieldCheck className="w-3 h-3" />
          <span>A1/A10 COMPLIANT</span>
        </div>
      </div>

      {description && (
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {description}
        </p>
      )}

      {/* Rational Expression Display */}
      <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 flex flex-col gap-1 text-xs">
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
          <span className="text-slate-500">N({analysis.variable}) =</span>
          <span className="text-emerald-300">{analysis.originalNumerator}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
          <span className="text-slate-500">D({analysis.variable}) =</span>
          <span className="text-cyan-300">{analysis.originalDenominator}</span>
        </div>
      </div>

      {/* Equation Solving Step */}
      <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-purple-400 font-bold">D({analysis.variable}) = 0</span>
          <span className="text-slate-500">⟹</span>
          <span className="text-slate-300">Корни:</span>
          <span className="text-amber-300 font-semibold">
            {analysis.denominatorRoots.map((r) => `${analysis.variable} = ${r}`).join(', ')}
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          Найдено особых точек: {analysis.denominatorRoots.length}
        </span>
      </div>

      {/* Singular Points Analysis Breakdown */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
          Спектр сингулярных точек и разрешение:
        </span>

        {analysis.singularPointsAnalysis.map((pt) => (
          <div
            key={pt.root}
            className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1.5 text-xs font-mono"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">
                  {pt.rootVariable} = {pt.root}
                </span>
                <span className="text-slate-500 text-[10px]">
                  (кратность: знам={pt.denominatorMultiplicity}, числ={pt.numeratorMultiplicity})
                </span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                  pt.outcomeType === 'INDEXED_INFINITY'
                    ? 'bg-purple-950/60 text-purple-300 border-purple-800/60'
                    : pt.outcomeType === 'REMOVABLE_SCALAR'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                    : 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                }`}
              >
                {pt.outcomeType}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-300 border-t border-slate-900 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Остаточный числитель:</span>
                <span className="text-emerald-300">{pt.residualNumeratorExpression}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Результат RICIS-III:</span>
                <span className="text-purple-300 font-bold text-sm">
                  {pt.formattedRicisResult}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-900/60 pt-1">
              <span>Сокращено по SP1/SP2: {pt.canceledMultiplicity} степеней</span>
              <span className="text-cyan-400/80 font-mono">
                Теорема Lean 4: {pt.leanTheoremCitation}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
