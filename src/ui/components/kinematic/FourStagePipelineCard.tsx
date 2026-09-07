// ============================================================================
// 4-STAGE ARCHITECTURAL PIPELINE CARD COMPONENT (SOLID / CLEAN UI)
// 1. Polar Transition (Representation singularities)
// 2. RICIS Reduction (Residual singularities)
// 3. Self-Collision Check (Physical geometric constraints)
// 4. Downstream Relative Motion (Relative frame invariance)
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import React from 'react';
import { Compass, Cpu, ShieldCheck, ShieldAlert, Link as LinkIcon, CheckCircle } from 'lucide-react';
import type { IFourStageKinematicReport } from '../../../services/kinematic/fourStagePipeline.contracts';

interface Props {
  readonly report: IFourStageKinematicReport;
}

export const FourStagePipelineCard: React.FC<Props> = ({ report }) => {
  const { stage1PolarTransition, stage2RicisReduction, stage3SelfCollision, stage4DownstreamMotion } = report;

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 shadow-lg space-y-2.5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-100">RICIS-III 4-Stage Architecture</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
          O(1) Reduction Chain
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
        {/* Stage 1: Polar Transition */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-purple-300 font-semibold flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              1. Полярный переход
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-800/50">
              {stage1PolarTransition.parameterizationMode}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-sans leading-tight">
            Сингулярности представления (x=0, y=0) устранены на уровне координат (r = {stage1PolarTransition.clusterRadius.toFixed(2)} м).
          </p>
        </div>

        {/* Stage 2: RICIS Reduction */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              2. RICIS-редукция
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">
              σ_min: {stage2RicisReduction.sigmaMin.toFixed(3)}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-sans leading-tight">
            Остаточные сингулярности разрешены через нуль-пространство и типизированный ноль {stage2RicisReduction.typedZero}.
          </p>
        </div>

        {/* Stage 3: Self-Collision Check */}
        <div
          className={`p-2.5 rounded-lg border ${
            stage3SelfCollision.isColliding
              ? 'bg-red-950/40 border-red-700/60 text-red-200'
              : 'bg-slate-950/70 border-slate-800/80 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-semibold flex items-center gap-1.5">
              {stage3SelfCollision.isColliding ? (
                <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              )}
              3. Self-Collision Check
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                stage3SelfCollision.isColliding
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {stage3SelfCollision.isColliding ? 'COLLISION' : 'SAFE'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-sans leading-tight">
            Единственный физический constraint. Зазор: {(stage3SelfCollision.minDistance * 100).toFixed(1)} см (порог {(stage3SelfCollision.safeClearanceMargin * 100).toFixed(1)} см).
          </p>
        </div>

        {/* Stage 4: Downstream Relative Chain */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
              4. Downstream Effects
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
              Rank {stage4DownstreamMotion.relativeTransformRank}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-sans leading-tight">
            Движение звеньев строго относительное; последующие шарниры не разрушают глобальный инвариант.
          </p>
        </div>
      </div>
    </div>
  );
};
