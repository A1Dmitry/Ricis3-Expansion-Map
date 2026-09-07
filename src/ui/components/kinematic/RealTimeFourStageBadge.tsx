// ============================================================================
// REAL-TIME 4-STAGE TELEMETRY BADGE COMPONENT (SOLID / CLEAN UI)
// Compact display for the Real-Time Dual Debugger Sidebar
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import React from 'react';
import { Compass, Cpu, ShieldCheck, ShieldAlert, Layers } from 'lucide-react';
import type { IRealTimeStageTelemetry } from '../../../services/kinematic/telemetryFourStage.contracts';

interface Props {
  readonly telemetry: IRealTimeStageTelemetry;
}

export const RealTimeFourStageBadge: React.FC<Props> = ({ telemetry }) => {
  const { stage1Status, stage2Status, stage3Collision, stage4DownstreamRank, executionComplexity } = telemetry;
  const isColliding = stage3Collision.isColliding;
  const clearanceCm = (stage3Collision.minDistance * 100).toFixed(1);

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 shadow-md space-y-2 text-xs font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          4-Stage Chain Status
        </span>
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
          {executionComplexity}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Stage 1: Polar Transition */}
        <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60">
          <div className="flex items-center gap-1 text-[10px] text-purple-300 font-semibold mb-0.5">
            <Compass className="w-3 h-3 text-purple-400" />
            1. Polar Transition
          </div>
          <div className="text-[10px] text-slate-300">
            {stage1Status === 'POLAR_ACTIVE' ? (
              <span className="text-purple-400">Polar (r, θ, z)</span>
            ) : stage1Status === 'REPRESENTATION_SINGULARITY_AVOIDED' ? (
              <span className="text-emerald-400">Rep. Sing. Avoided</span>
            ) : (
              <span className="text-slate-400">Cartesian Stable</span>
            )}
          </div>
        </div>

        {/* Stage 2: RICIS Reduction */}
        <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60">
          <div className="flex items-center gap-1 text-[10px] text-cyan-300 font-semibold mb-0.5">
            <Cpu className="w-3 h-3 text-cyan-400" />
            2. RICIS Reduction
          </div>
          <div className="text-[10px]">
            {stage2Status === 'RICIS_A6_RESOLVED' ? (
              <span className="text-cyan-300 font-bold">A6: 0_F × ∞_G</span>
            ) : stage2Status === 'NULL_SPACE_SELF_MOTION' ? (
              <span className="text-yellow-400">Null-Space Motion</span>
            ) : (
              <span className="text-slate-400">Regular Domain</span>
            )}
          </div>
        </div>

        {/* Stage 3: Self-Collision Check */}
        <div
          className={`p-2 rounded border ${
            isColliding
              ? 'bg-red-950/40 border-red-700 text-red-200'
              : 'bg-slate-900/60 border-slate-800/60 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-semibold mb-0.5">
            <span className="flex items-center gap-1">
              {isColliding ? (
                <ShieldAlert className="w-3 h-3 text-red-400 animate-pulse" />
              ) : (
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
              )}
              3. Self-Collision
            </span>
            <span className={isColliding ? 'text-red-400 font-bold' : 'text-emerald-400'}>
              {clearanceCm} cm
            </span>
          </div>
          <div className="text-[9px] text-slate-400">
            {isColliding ? 'Warning: Fold overlap' : 'Clearance safe'}
          </div>
        </div>

        {/* Stage 4: Downstream Rank */}
        <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60">
          <div className="flex items-center gap-1 text-[10px] text-emerald-300 font-semibold mb-0.5">
            <Layers className="w-3 h-3 text-emerald-400" />
            4. Downstream Frame
          </div>
          <div className="text-[10px] text-slate-300">
            Relative Rank: <span className="text-emerald-400 font-semibold">{stage4DownstreamRank}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
