// ============================================================================
// RICIS REDUCTION OVERLAY PANEL COMPONENT
// ============================================================================

import React from 'react';
import { ShieldAlert, Cpu, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import type { IRicisReductionOverlayState, ParameterizationMode } from '../../../services/kinematic/twoStageSingularity.contracts';

interface Props {
  readonly overlay: IRicisReductionOverlayState;
  readonly mode: ParameterizationMode;
  readonly sigmaMin: number;
}

export const RicisReductionOverlayPanel: React.FC<Props> = ({
  overlay,
  mode: _mode,
  sigmaMin: _sigmaMin,
}) => {
  return (
    <div
      className={`border rounded-xl p-4 transition-all duration-300 ${
        overlay.isActive
          ? 'bg-red-950/30 border-red-500/50 shadow-lg shadow-red-950/40'
          : 'bg-slate-900/60 border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-700/60 mb-3">
        <div className="flex items-center gap-2">
          {overlay.isActive ? (
            <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          )}
          <span className="font-semibold text-sm text-slate-100">
            {overlay.isActive ? 'Stage 2: RICIS Reduction Active' : 'RICIS State: Nominal'}
          </span>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${
            overlay.isActive
              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}
        >
          {overlay.isActive ? 'SINGULARITY DETECTED' : 'WELL-CONDITIONED'}
        </span>
      </div>

      <div className="space-y-3 font-mono text-xs">
        {/* Typed Zero & Origin */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
          <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>RICIS Typed Monad Zero (L1 &amp; SP4):</span>
          </div>
          <div className="text-cyan-300 font-bold text-sm bg-cyan-950/40 px-2 py-1 rounded border border-cyan-800/40 mb-1">
            {overlay.typedZeroNotation}
          </div>
          <div className="text-[10px] text-slate-400">
            Origin: <span className="text-slate-300">{overlay.originatingExpression}</span>
          </div>
        </div>

        {/* Kernel Basis & Adaptive Lambda */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">Kernel Basis (ker J):</div>
            <div className="text-amber-300 text-[11px] font-semibold mt-0.5 truncate">
              [{overlay.kernelBasis[0]?.map((v: number) => v.toFixed(2)).join(', ') || '0.00, 0.00, 0.00'}]
            </div>
          </div>
          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">Adaptive λ(S):</div>
            <div className="text-emerald-300 text-[11px] font-semibold mt-0.5">
              {overlay.adaptiveLambda.toFixed(4)}
            </div>
          </div>
        </div>

        {/* Direction Subspaces */}
        <div className="space-y-1.5">
          <div className="text-[11px] text-slate-300 font-semibold flex items-center justify-between">
            <span>Subspace Direction Decomposition:</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {overlay.preservedDirections.map((dir, idx: number) => (
              <div
                key={`p-${idx}`}
                className="flex items-center justify-between bg-emerald-950/30 border border-emerald-800/30 px-2 py-1 rounded text-[11px]"
              >
                <span className="text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Preserved: {dir.label}
                </span>
                <span className="text-emerald-400 text-[10px]">
                  [{dir.vector[0].toFixed(2)}, {dir.vector[1].toFixed(2)}]
                </span>
              </div>
            ))}

            {overlay.lostDirections.map((dir, idx: number) => (
              <div
                key={`l-${idx}`}
                className="flex items-center justify-between bg-red-950/30 border border-red-800/30 px-2 py-1 rounded text-[11px]"
              >
                <span className="text-red-300 flex items-center gap-1 opacity-90">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Lost Direction: {dir.label}
                </span>
                <span className="text-red-400 text-[10px]">
                  [{dir.vector[0].toFixed(2)}, {dir.vector[1].toFixed(2)}]
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Self-Motion Escape Direction */}
        <div className="bg-emerald-950/40 border border-emerald-700/50 p-2.5 rounded-lg">
          <div className="flex items-center justify-between text-emerald-300 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              Null-Space Self-Motion Escape Vector:
            </span>
            <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-200">
              Δx_tcp = 0
            </span>
          </div>
          <div className="text-emerald-200 text-[11px]">
            Δq_null = [{overlay.escapeDirectionJointSpace.map((v: number) => v.toFixed(3)).join(', ')}] rad
          </div>
          <p className="text-[10px] text-emerald-400/80 mt-1">
            Moves arm inward through internal redundancy without disturbing tool center point.
          </p>
        </div>

        {/* Explanation footnote */}
        <div className="text-[11px] text-slate-300 bg-slate-950/40 p-2 rounded border border-slate-800 leading-relaxed font-sans">
          {overlay.explanationText}
        </div>
      </div>
    </div>
  );
};
