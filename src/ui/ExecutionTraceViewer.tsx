import React, { useState } from 'react';
import { IExecutionTraceViewerProps, ITransformationLogDTO } from '../model/traceVisualizer.types';
import { LatexRenderer } from './LatexRenderer';
import { Terminal, CheckCircle2, ChevronRight, Play, ChevronDown, ChevronUp } from 'lucide-react';

export function ExecutionTraceViewer({ nodeId, logData, isLoading, onRerunTrace, className = '' }: IExecutionTraceViewerProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (isLoading) {
    return (
      <div className={`p-4 bg-neutral-900/60 rounded-lg border border-neutral-800 flex items-center justify-center min-h-[150px] ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <Terminal size={24} className="text-cyan-600 animate-pulse" />
          <span className="text-xs font-mono text-cyan-400">RICIS-III Engine: ВЫЧИСЛЕНИЕ...</span>
        </div>
      </div>
    );
  }

  if (!logData) {
    return (
      <div className={`p-4 bg-neutral-900/60 rounded-lg border border-neutral-800 flex flex-col items-center justify-center min-h-[150px] gap-3 ${className}`}>
        <span className="text-xs text-neutral-500 font-mono">Трейс исполнения недоступен</span>
        {onRerunTrace && (
          <button 
            onClick={onRerunTrace}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/50 hover:bg-cyan-900/50 text-cyan-400 border border-cyan-800/50 rounded text-[10px] uppercase tracking-wider font-bold transition-colors"
          >
            <Play size={12} />
            Запустить EvalRICIS
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div 
        className="flex items-center justify-between mb-2 cursor-pointer hover:bg-neutral-900/40 p-1 -m-1 rounded transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-cyan-500 flex items-center gap-1.5">
          <Terminal size={12} />
          Trace
        </h4>
        <div className="flex items-center gap-2">
          {logData.semanticIndex && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/40 border border-purple-800/50 text-purple-300 font-mono">
              Index: {logData.semanticIndex}
            </span>
          )}
          {onRerunTrace && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onRerunTrace();
              }}
              className="p-1 hover:bg-cyan-900/30 rounded text-cyan-600 hover:text-cyan-400 transition-colors"
              title="Перезапустить"
            >
              <Play size={12} />
            </button>
          )}
          {isExpanded ? <ChevronUp size={14} className="text-neutral-500" /> : <ChevronDown size={14} className="text-neutral-500" />}
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-1.5 font-mono text-[10px]">
        {logData.steps.map((step, idx) => (
          <div key={idx} className="bg-black/60 border border-neutral-800/60 rounded p-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[8px] font-bold border border-neutral-700">
                  {step.phaseBadgeLabel}
                </span>
                <span className="text-neutral-300 font-sans text-[11px]">{step.title}</span>
              </div>
              <div className="flex items-center gap-2">
                {step.appliedAxiom && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-950/30 border border-amber-900/50 text-amber-500 text-[8px] font-bold">
                    {step.appliedAxiom}
                  </span>
                )}
                <span className="text-neutral-600">[{step.complexity}]</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-neutral-900/50 p-1.5 rounded overflow-x-auto">
                <LatexRenderer content={step.inputState ? `$$${step.inputState}$$` : '—'} className="text-neutral-400 text-[10px]" />
              </div>
              <ChevronRight size={14} className="text-cyan-800 shrink-0" />
              <div className="flex-1 bg-cyan-950/20 border border-cyan-900/30 p-1.5 rounded overflow-x-auto">
                <LatexRenderer content={step.outputState ? `$$${step.outputState}$$` : '—'} className="text-cyan-300 text-[10px]" />
              </div>
            </div>
          </div>
        ))}

        <div className="mt-2 bg-emerald-950/20 border border-emerald-900/40 rounded p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span className="text-[10px] text-emerald-400 font-sans font-bold uppercase tracking-wider">Инвариант</span>
          </div>
          <div className="bg-black/50 px-2 py-1 rounded">
            <LatexRenderer content={logData.finalInvariant ? `$$${logData.finalInvariant}$$` : '—'} className="text-emerald-300 text-[11px] font-bold" />
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
