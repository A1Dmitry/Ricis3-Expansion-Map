// ============================================================================
// MODULAR MULTI-LINK JOINT CONTROLLER PANEL (DRY / SOLID / DDD)
// Dynamically generates joint angle sliders for N-link manipulators (3, 5, or N links)
// with visual indicators, angle normalization, and parameterization modes.
// Solves the UI overlap problem when joints > 3.
// ============================================================================

import React from 'react';
import { Sliders, RefreshCw } from 'lucide-react';
import type { ParameterizationMode } from '../../../services/kinematic/twoStageSingularity.contracts';

interface MultiLinkJointControllerProps {
  readonly dof: number;
  readonly jointAngles: readonly number[];
  readonly onChangeJoints: (newJoints: number[]) => void;
  readonly mode: ParameterizationMode;
  readonly onChangeMode: (mode: ParameterizationMode) => void;
  readonly sigmaMin?: number;
  readonly isSingular?: boolean;
}

const JOINT_NAMES: readonly string[] = [
  'θ₁ (Base / Shoulder)',
  'θ₂ (Elbow 1)',
  'θ₃ (Wrist / Elbow 2)',
  'θ₄ (Intermediate Link)',
  'θ₅ (End Tool / Wrist 2)',
  'θ₆ (Flange Roll)',
  'θ₇ (Redundant Pitch)',
];

export const MultiLinkJointController: React.FC<MultiLinkJointControllerProps> = ({
  dof,
  jointAngles,
  onChangeJoints,
  mode,
  onChangeMode,
  sigmaMin,
  isSingular = false,
}) => {
  const handleSliderChange = (index: number, val: number) => {
    const updated = [...jointAngles];
    updated[index] = val;
    onChangeJoints(updated);
  };

  const handleResetJoints = () => {
    // Default safe pose
    const reset = new Array(dof).fill(0).map((_, i) => (i === 1 ? 0.78 : i === 2 ? 0.65 : 0.2));
    onChangeJoints(reset);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 shadow-lg flex flex-col gap-2.5">
      {/* Header with Mode & Sigma */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-slate-100">
            Управление сочленениями ({dof}-DOF)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {sigmaMin !== undefined && (
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
              isSingular
                ? 'bg-red-950/80 border-red-500 text-red-300'
                : 'bg-slate-950 border-slate-800 text-purple-300'
            }`}>
              σ_min: {sigmaMin.toFixed(4)}
            </span>
          )}

          <button
            type="button"
            onClick={handleResetJoints}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Сбросить углы в исходное положение"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Parameterization Mode Selector */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChangeMode('CARTESIAN')}
          className={`py-1 px-2 rounded-lg text-xs font-bold transition-all border ${
            mode === 'CARTESIAN'
              ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950/50'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Cartesian (Прямой)
        </button>
        <button
          type="button"
          onClick={() => onChangeMode('POLAR')}
          className={`py-1 px-2 rounded-lg text-xs font-bold transition-all border ${
            mode === 'POLAR'
              ? 'bg-purple-950 border-purple-500 text-purple-300 shadow-md shadow-purple-950/50'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Polar (Полярный $O(1)$)
        </button>
      </div>

      {/* Scrollable Joint Angle Sliders List to prevent overlap for any N > 3 */}
      <div className="max-h-60 overflow-y-auto pr-1 space-y-2.5 text-xs font-mono">
        {Array.from({ length: dof }).map((_, idx) => {
          const val = jointAngles[idx] ?? 0;
          const deg = (val * 180 / Math.PI).toFixed(1);
          const label = JOINT_NAMES[idx] ?? `θ_{${idx + 1}} (Joint ${idx + 1})`;

          return (
            <div key={idx} className="bg-slate-950/40 p-1.5 rounded border border-slate-800/60">
              <div className="flex justify-between text-slate-400 text-[11px] mb-0.5">
                <span className="truncate pr-1">{label}:</span>
                <span className="text-purple-300 font-semibold shrink-0">{deg}°</span>
              </div>
              <input
                type="range"
                min="-3.14"
                max="3.14"
                step="0.02"
                value={val}
                onChange={(e) => handleSliderChange(idx, parseFloat(e.target.value))}
                className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
