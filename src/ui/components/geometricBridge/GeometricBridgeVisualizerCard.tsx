// ============================================================================
// RICIS-III GEOMETRIC BRIDGE VISUALIZER CARD COMPONENT
// Space: R^2_RICIS | 0_F x inf_G = det(u, v) = F * G
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import React, { useState, useMemo } from 'react';
import { Compass, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { GeometricBridgeEngine } from '../../../services/geometricBridge/geometricBridgeEngine';

interface Props {
  readonly initialF?: number;
  readonly initialG?: number;
  readonly labelF?: string;
  readonly labelG?: string;
}

export const GeometricBridgeVisualizerCard: React.FC<Props> = ({
  initialF = 4,
  initialG = 3,
  labelF = 'F',
  labelG = 'G',
}) => {
  const [factorF, setFactorF] = useState(initialF);
  const [factorG, setFactorG] = useState(initialG);

  const engine = useMemo(() => new GeometricBridgeEngine(), []);
  const resolution = useMemo(() => {
    return engine.resolveGeometricBridge(factorF, factorG, labelF, labelG);
  }, [engine, factorF, factorG, labelF, labelG]);

  // Scaled coordinates for SVG representation
  const maxScale = 140;
  const maxVal = Math.max(factorF, factorG, 1);
  const scale = maxScale / maxVal;
  const svgWidth = 240;
  const svgHeight = 160;
  const originX = 30;
  const originY = 135;

  const vectorUX = originX + factorF * scale;
  const vectorUY = originY;
  const vectorVX = originX;
  const vectorVY = originY - factorG * scale;

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 shadow-xl flex flex-col gap-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Geometric Bridge (R² RICIS) : 0_F × ∞_G
          </h4>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
          <ShieldCheck className="w-3 h-3" />
          <span>A6 GENERAL PRODUCT</span>
        </div>
      </div>

      {/* Sliders for Interactive Investigation */}
      <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-xs">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Zero Length (F):</span>
            <span className="font-mono text-emerald-300 font-bold">{factorF}</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={factorF}
            onChange={(e) => setFactorF(parseFloat(e.target.value))}
            className="accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Infinity Width (G):</span>
            <span className="font-mono text-cyan-300 font-bold">{factorG}</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={factorG}
            onChange={(e) => setFactorG(parseFloat(e.target.value))}
            className="accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>
      </div>

      {/* 2D Vector Canvas (SVG) */}
      <div className="bg-slate-950/80 rounded-lg p-2 border border-slate-800 flex flex-col items-center">
        <svg width={svgWidth} height={svgHeight} className="overflow-visible">
          {/* Grid lines */}
          <line x1={originX} y1={originY} x2={originX + 180} y2={originY} stroke="#334155" strokeWidth="1" />
          <line x1={originX} y1={originY} x2={originX} y2={originY - 120} stroke="#334155" strokeWidth="1" />

          {/* Area rectangle representing det(u, v) = F * G */}
          {factorF > 0 && factorG > 0 && (
            <rect
              x={originX}
              y={vectorVY}
              width={vectorUX - originX}
              height={originY - vectorVY}
              fill="rgba(56, 189, 248, 0.15)"
              stroke="#38bdf8"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          )}

          {/* Vector u = (F, 0) */}
          <line
            x1={originX}
            y1={originY}
            x2={vectorUX}
            y2={vectorUY}
            stroke="#10b981"
            strokeWidth="3"
          />
          <circle cx={vectorUX} cy={vectorUY} r="3.5" fill="#10b981" />

          {/* Vector v = (0, G) */}
          <line
            x1={originX}
            y1={originY}
            x2={vectorVX}
            y2={vectorVY}
            stroke="#06b6d4"
            strokeWidth="3"
          />
          <circle cx={vectorVX} cy={vectorVY} r="3.5" fill="#06b6d4" />

          {/* Labels */}
          <text x={originX + 5} y={vectorVY + 12} fill="#06b6d4" fontSize="10" fontFamily="monospace">
            v=(0, {factorG})
          </text>
          <text x={vectorUX - 15} y={originY - 6} fill="#10b981" fontSize="10" fontFamily="monospace">
            u=({factorF}, 0)
          </text>
          <text x={originX - 18} y={originY + 12} fill="#64748b" fontSize="9" fontFamily="monospace">
            (0,0)
          </text>
        </svg>

        <div className="mt-1 text-center font-mono text-xs text-slate-300">
          <span className="text-slate-500">det(u, v) = </span>
          <span className="text-emerald-300">{factorF}</span>
          <span className="text-slate-500"> × </span>
          <span className="text-cyan-300">{factorG}</span>
          <span className="text-slate-500"> = </span>
          <span className="text-purple-300 font-bold">{resolution.exactInvariantArea}</span>
          <span className="text-slate-500 text-[10px] ml-1.5">[Exact Invariant in O(1)]</span>
        </div>
      </div>

      {/* Comparison against Classical Analysis */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-red-950/20 border border-red-900/30 p-2 rounded-lg flex flex-col gap-0.5">
          <span className="text-red-400 font-semibold text-[10px] uppercase">Классический анализ</span>
          <span className="text-slate-300 font-mono text-[11px]">0 × ∞ → NaN / Undefined</span>
          <span className="text-slate-500 text-[10px]">Требует предел Коши или правило Лопиталя</span>
        </div>
        <div className="bg-emerald-950/20 border border-emerald-900/30 p-2 rounded-lg flex flex-col gap-0.5">
          <span className="text-emerald-400 font-semibold text-[10px] uppercase">RICIS-III Geometric Bridge</span>
          <span className="text-slate-200 font-mono text-[11px]">det(u, v) = {resolution.exactInvariantArea}</span>
          <span className="text-emerald-400/90 text-[10px] flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> O(1) Точный инвариант площади
          </span>
        </div>
      </div>
    </div>
  );
};
