// ============================================================================
// SCRIPTED WALKTHROUGH CONTROLLER COMPONENT
// ============================================================================

import React from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import { WALKTHROUGH_STEPS } from '../../../services/kinematic/walkthroughScenarios';

interface Props {
  readonly currentStepIndex: number;
  readonly isPlaying: boolean;
  readonly onStepChange: (index: number) => void;
  readonly onTogglePlay: () => void;
  readonly onReset: () => void;
}

export const WalkthroughControllerPanel: React.FC<Props> = ({
  currentStepIndex,
  isPlaying,
  onStepChange,
  onTogglePlay,
  onReset,
}) => {
  const currentStep = WALKTHROUGH_STEPS[currentStepIndex] ?? WALKTHROUGH_STEPS[0];
  const totalSteps = WALKTHROUGH_STEPS.length;

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-sm text-slate-100">
            Automated Engineering Walkthrough (8-Step Demo)
          </h3>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
          <span>Step</span>
          <span className="text-purple-400 font-bold">{currentStepIndex + 1}</span>
          <span>/</span>
          <span>{totalSteps}</span>
        </div>
      </div>

      {/* Main Annotation Block */}
      <div className="my-3 p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
        <div className="text-xs font-semibold text-purple-300 font-mono mb-1 flex items-center justify-between">
          <span>{currentStep.title}</span>
          <span className="text-[10px] bg-purple-950 px-2 py-0.5 rounded border border-purple-800/60 text-purple-300">
            {currentStep.stage}
          </span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-sans mt-1">
          {currentStep.engineeringAnnotation}
        </p>
        <div className="mt-2 text-[11px] font-mono text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800/80">
          <span className="text-slate-500">Mathematical context: </span>
          <span className="text-cyan-300">{currentStep.mathDetail}</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors shadow-md ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold'
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pause Auto-Play' : 'Auto-Play Walkthrough'}
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset to beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            disabled={currentStepIndex === 0}
            onClick={() => onStepChange(Math.max(0, currentStepIndex - 1))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 transition-colors"
            title="Previous Step"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            disabled={currentStepIndex === totalSteps - 1}
            onClick={() => onStepChange(Math.min(totalSteps - 1, currentStepIndex + 1))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 transition-colors"
            title="Next Step"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
