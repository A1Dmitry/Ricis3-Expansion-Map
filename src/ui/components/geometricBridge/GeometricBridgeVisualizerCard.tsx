// ============================================================================
// RICIS-III GEOMETRIC BRIDGE VISUALIZER CARD COMPONENT
// Space: R^2_RICIS | 0_F x inf_G = det(u, v) = F * G | 0_F / 0_G = F / G
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import React, { useState, useMemo } from 'react';
import { Compass, Sparkles, ShieldCheck, Layers } from 'lucide-react';
import { GeometricBridgeEngine } from '../../../services/geometricBridge/geometricBridgeEngine';
import type { GeometricBridgeOperationType } from '../../../services/geometricBridge/geometricBridge.contracts';

interface Props {
  readonly initialF?: number;
  readonly initialG?: number;
  readonly initialOp?: GeometricBridgeOperationType;
  readonly labelF?: string;
  readonly labelG?: string;
}

const OPERATIONS: Array<{ id: GeometricBridgeOperationType; label: string; badge: string }> = [
  { id: 'A6_PRODUCT_0_INF', label: '0_F × ∞_G', badge: 'A6 PRODUCT' },
  { id: 'A4_RATIO_0_0', label: '0_F / 0_G', badge: 'A4 0/0 RATIO' },
  { id: 'A5_RATIO_INF_INF', label: '∞_F / ∞_G', badge: 'A5 ∞/∞ RATIO' },
  { id: 'A7_SUBTRACTION_INF_INF', label: '∞_F − ∞_G', badge: 'A7 ∞−∞' },
  { id: 'A8_SUBTRACTION_0_0', label: '0_F − 0_G', badge: 'A8 0−0' },
];

export const GeometricBridgeVisualizerCard: React.FC<Props> = ({
  initialF = 4,
  initialG = 3,
  initialOp = 'A6_PRODUCT_0_INF',
  labelF = 'F',
  labelG = 'G',
}) => {
  const [activeOp, setActiveOp] = useState<GeometricBridgeOperationType>(initialOp);
  const [factorF, setFactorF] = useState(initialF);
  const [factorG, setFactorG] = useState(initialG);

  const engine = useMemo(() => new GeometricBridgeEngine(), []);
  const resolution = useMemo(() => {
    return engine.resolveOperation(activeOp, factorF, factorG, labelF, labelG);
  }, [engine, activeOp, factorF, factorG, labelF, labelG]);

  // Scaled coordinates for SVG representation
  const maxScale = 140;
  const maxVal = Math.max(factorF, factorG, 1);
  const scale = maxScale / maxVal;
  const svgWidth = 240;
  const svgHeight = 160;
  const originX = 35;
  const originY = 130;

  const vectorUX = originX + (activeOp === 'A5_RATIO_INF_INF' || activeOp === 'A7_SUBTRACTION_INF_INF' ? 0 : factorF * scale);
  const vectorUY = originY - (activeOp === 'A5_RATIO_INF_INF' || activeOp === 'A7_SUBTRACTION_INF_INF' ? factorF * scale : 0);

  const vectorVX = originX + (activeOp === 'A4_RATIO_0_0' || activeOp === 'A8_SUBTRACTION_0_0' ? factorG * scale : 0);
  const vectorVY = originY - (activeOp === 'A4_RATIO_0_0' || activeOp === 'A8_SUBTRACTION_0_0' ? 0 : factorG * scale);

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 shadow-xl flex flex-col gap-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Geometric Bridge (R² RICIS) : {resolution.operation}
          </h4>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
          <ShieldCheck className="w-3 h-3" />
          <span>{resolution.axiomApplied}</span>
        </div>
      </div>

      {/* Operation selector pills */}
      <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800 overflow-x-auto">
        {OPERATIONS.map((op) => (
          <button
            key={op.id}
            type="button"
            onClick={() => setActiveOp(op.id)}
            className={`px-2 py-1 text-[11px] font-mono rounded transition-colors whitespace-nowrap ${
              activeOp === op.id
                ? 'bg-cyan-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {op.label}
          </button>
        ))}
      </div>

      {/* Sliders for Interactive Investigation */}
      <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-xs">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Factor (F):</span>
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
            <span className="text-slate-400">Factor (G):</span>
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
          <line x1={originX} y1={originY} x2={originX} y2={originY - 110} stroke="#334155" strokeWidth="1" />

          {/* Area rectangle for A6 product */}
          {activeOp === 'A6_PRODUCT_0_INF' && factorF > 0 && factorG > 0 && (
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

          {/* Vector u */}
          <line
            x1={originX}
            y1={originY}
            x2={vectorUX}
            y2={vectorUY}
            stroke="#10b981"
            strokeWidth="3"
          />
          <circle cx={vectorUX} cy={vectorUY} r="3.5" fill="#10b981" />

          {/* Vector v */}
          <line
            x1={originX}
            y1={originY}
            x2={vectorVX}
            y2={vectorVY}
            stroke="#06b6d4"
            strokeWidth="3"
          />
          <circle cx={vectorVX} cy={vectorVY} r="3.5" fill="#06b6d4" />

          {/* Axis Labels */}
          <text x={originX + 170} y={originY + 12} fill="#64748b" fontSize="8" fontFamily="monospace">
            X (0_dim)
          </text>
          <text x={originX - 10} y={originY - 105} fill="#64748b" fontSize="8" fontFamily="monospace">
            Y (∞_dim)
          </text>
        </svg>

        <div className="mt-1 text-center font-mono text-xs text-slate-300">
          <span className="text-slate-400">{resolution.geometricMeaning} : </span>
          <span className="text-purple-300 font-bold">{resolution.invariantValue}</span>
          <span className="text-slate-500 text-[10px] ml-1.5">[Exact Invariant in O(1)]</span>
        </div>
      </div>

      {/* Comparison against Classical Analysis */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-red-950/20 border border-red-900/30 p-2 rounded-lg flex flex-col gap-0.5">
          <span className="text-red-400 font-semibold text-[10px] uppercase">Классический анализ</span>
          <span className="text-slate-300 font-mono text-[11px]">{resolution.classicalComparison.classicalOutcome}</span>
          <span className="text-slate-500 text-[10px]">{resolution.classicalComparison.explanation}</span>
        </div>
        <div className="bg-emerald-950/20 border border-emerald-900/30 p-2 rounded-lg flex flex-col gap-0.5">
          <span className="text-emerald-400 font-semibold text-[10px] uppercase">RICIS-III R² Invariant</span>
          <span className="text-slate-200 font-mono text-[11px]">{resolution.formulaLatex}</span>
          <span className="text-emerald-400/90 text-[10px] flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> O(1) Точный детерминированный инвариант
          </span>
        </div>
      </div>
    </div>
  );
};
