// ============================================================================
// 2D SINGULAR VALUE LANDSCAPE HEATMAP COMPONENT (Canvas-rendered, fast)
// ============================================================================

import React, { useRef, useEffect } from 'react';
import type { ISingularityHeatmapGrid, ParameterizationMode } from '../../../services/kinematic/twoStageSingularity.contracts';

interface Props {
  readonly grid: ISingularityHeatmapGrid;
  readonly mode: ParameterizationMode;
  readonly currentTheta2: number;
  readonly currentTheta3: number;
  readonly onSelectAngles?: (t2: number, t3: number) => void;
}

export const SingularityLandscapeHeatmap: React.FC<Props> = ({
  grid,
  mode,
  currentTheta2,
  currentTheta3,
  onSelectAngles,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const data = mode === 'CARTESIAN' ? grid.cartesianSigmaMinGrid : grid.polarSigmaMinGrid;
    const res = grid.resolution;

    const cellW = width / res;
    const cellH = height / res;

    // Render cells
    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        const val = data[i]?.[j] ?? 0;
        // Normalized color: 0 -> dark red (singularity), 0.5+ -> cyan/emerald (safe)
        const norm = Math.min(1.0, val / 0.6);
        let r = 0;
        let g = 0;
        let b = 0;

        if (norm < 0.15) {
          // Critical singularity: Red
          r = Math.floor(220 + (1 - norm / 0.15) * 35);
          g = Math.floor(norm * 100);
          b = Math.floor(norm * 100);
        } else if (norm < 0.5) {
          // Transition / Damped: Amber
          r = Math.floor(230);
          g = Math.floor(140 + norm * 150);
          b = 30;
        } else {
          // Healthy: Cyan/Emerald
          r = Math.floor(20 + (1 - norm) * 40);
          g = Math.floor(160 + norm * 80);
          b = Math.floor(180 + norm * 70);
        }

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(i * cellW, (res - 1 - j) * cellH, cellW + 0.5, cellH + 0.5);
      }
    }

    // Draw current configuration marker
    const [t2Min, t2Max] = grid.theta2Range;
    const [t3Min, t3Max] = grid.theta3Range;

    const normX = (currentTheta2 - t2Min) / (t2Max - t2Min);
    const normY = (currentTheta3 - t3Min) / (t3Max - t3Min);

    const markerX = Math.max(0, Math.min(width, normX * width));
    const markerY = Math.max(0, Math.min(height, (1 - normY) * height));

    // Outer pulsating circle
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(markerX, markerY, 6, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(markerX, markerY, 3.5, 0, 2 * Math.PI);
    ctx.fill();

    // Crosshairs
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(markerX, 0);
    ctx.lineTo(markerX, height);
    ctx.moveTo(0, markerY);
    ctx.lineTo(width, markerY);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [grid, mode, currentTheta2, currentTheta3]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSelectAngles || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = x / rect.width;
    const normY = 1 - y / rect.height;

    const [t2Min, t2Max] = grid.theta2Range;
    const [t3Min, t3Max] = grid.theta3Range;

    const t2 = t2Min + normX * (t2Max - t2Min);
    const t3 = t3Min + normY * (t3Max - t3Min);
    onSelectAngles(t2, t3);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-2.5 flex flex-col items-center">
      <div className="w-full flex items-center justify-between text-xs text-slate-300 mb-1.5 font-mono">
        <span className="font-semibold text-slate-200">
          σ_min Landscape ({mode === 'CARTESIAN' ? 'Cartesian' : 'Polar'})
        </span>
        <span className="text-[10px] text-amber-400">θ₂ × θ₃ Slice</span>
      </div>
      <div className="relative cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={180}
          height={140}
          onClick={handleCanvasClick}
          className="rounded border border-slate-700 shadow-inner bg-slate-950"
        />
        <div className="absolute bottom-1 left-1.5 text-[9px] font-mono text-white/70 bg-black/60 px-1 rounded">
          -π
        </div>
        <div className="absolute top-1 right-1.5 text-[9px] font-mono text-white/70 bg-black/60 px-1 rounded">
          +π
        </div>
      </div>
      <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1.5">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Singular
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Safe (σ &gt; 0.4)
        </span>
      </div>
    </div>
  );
};
