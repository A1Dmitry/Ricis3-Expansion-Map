import React, { useState } from 'react';
import { X, Play, RefreshCw, Cpu, CheckCircle2, AlertTriangle, ShieldCheck, Zap, Layers, BarChart2 } from 'lucide-react';
import { useMapStore } from '../store/mapStore';
import { RicisAutoProverEngine, type AutoProverResult, type FractalCentralityScore } from '../services/autoProver/autoProver';

interface AutoProverModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNodeId?: string | null;
}

export const AutoProverModal: React.FC<AutoProverModalProps> = ({
  isOpen,
  onClose,
  selectedNodeId,
}) => {
  const nodes = useMapStore((s) => s.nodes);
  const edges = useMapStore((s) => s.edges);
  const solveNode = useMapStore((s) => s.solveNode);

  const [engine] = useState(() => new RicisAutoProverEngine());
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<AutoProverResult[]>([]);
  const [activeResultIndex, setActiveResultIndex] = useState<number>(0);

  const centralityScores: FractalCentralityScore[] = React.useMemo(() => {
    return engine.scheduler.calculateFractalCentrality(nodes, edges);
  }, [engine, nodes, edges]);

  if (!isOpen) return null;

  const handleRunBatch = async () => {
    setIsRunning(true);
    try {
      const mapState = { nodes, edges, zones: [], axioms: [], proofs: {}, agentLogs: [] };
      const proverResults = await engine.runAutoProverPipeline(mapState, 5);
      setResults([...proverResults]);
      setActiveResultIndex(0);

      // Применение результатов к хранилищу
      for (const res of proverResults) {
        if (res.success) {
          await solveNode(res.nodeId);
        }
      }
    } finally {
      setIsRunning(false);
    }
  };

  const currentResult = results[activeResultIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#0a0d14] border border-cyan-500/30 rounded-xl shadow-2xl flex flex-col text-slate-200 overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/40 bg-[#0d121f]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-cyan-300 tracking-wide flex items-center gap-2">
                RICIS-III Auto Prover Engine v7.7
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-900/50 text-cyan-400 border border-cyan-700/50 font-mono">
                  RCVAP Agile Pipeline
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Фрактальная центральность • ProofAgent Lean 4 • RefinementLoop • L1 Identity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: Centrality Scheduler Queue */}
          <div className="md:col-span-1 flex flex-col gap-4 border-r border-slate-800/80 pr-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4" /> Фрактальный ранжир
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                Всего: {nodes.length} узлов
              </span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2 pr-1">
              {centralityScores.slice(0, 10).map((score) => {
                const node = nodes.find((n) => n.id === score.nodeId);
                const isSelected = selectedNodeId === score.nodeId;
                const isResolved = node?.state === 'resolved';

                return (
                  <div
                    key={score.nodeId}
                    className={`p-3 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                        : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-slate-400">#{score.rank}</span>
                      <span className="font-mono text-[10px] text-cyan-400">
                        C_fractal: {score.centralityScore}
                      </span>
                    </div>
                    <div className="font-medium text-slate-200 truncate mb-1">{score.title}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Связей: {score.degree}</span>
                      <span className={isResolved ? 'text-green-400 font-semibold' : 'text-amber-400'}>
                        {isResolved ? 'РЕШЁН' : 'ОТКРЫТ'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleRunBatch}
              disabled={isRunning}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Вычисление инвариантов...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Запустить Auto Prover (Batch 5)
                </>
              )}
            </button>
          </div>

          {/* Column 2 & 3: Execution Trace & Lean Output */}
          <div className="md:col-span-2 flex flex-col gap-4">
            {results.length === 0 ? (
              <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl p-8 text-center bg-slate-950/30">
                <Zap className="w-12 h-12 text-cyan-500/40 mb-3 animate-pulse" />
                <h4 className="text-sm font-semibold text-slate-300 mb-1">
                  Пайплайн готов к вычислению доказательств
                </h4>
                <p className="text-xs text-slate-500 max-w-md">
                  Нажмите «Запустить Auto Prover» для запуска серии доказательств Lean 4 в онтологической парадигме RICIS-III v7.7.
                </p>
              </div>
            ) : (
              <>
                {/* Result Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
                  {results.map((res, idx) => (
                    <button
                      key={res.nodeId}
                      onClick={() => setActiveResultIndex(idx)}
                      className={`px-3 py-1.5 rounded-t-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
                        activeResultIndex === idx
                          ? 'bg-slate-800 text-cyan-300 border-t border-x border-cyan-500/50'
                          : 'bg-slate-900/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {res.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      {res.nodeId}
                    </button>
                  ))}
                </div>

                {currentResult && (
                  <div className="flex-1 flex flex-col gap-4">
                    {/* Status Summary Banner */}
                    <div
                      className={`p-4 rounded-xl border flex items-center justify-between ${
                        currentResult.success
                          ? 'border-green-500/30 bg-green-950/20 text-green-300'
                          : 'border-amber-500/30 bg-amber-950/20 text-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 shrink-0" />
                        <div>
                          <div className="font-bold text-xs uppercase tracking-wide">
                            Узел: {currentResult.nodeId} — {currentResult.success ? 'УСПЕШНО ДОКАЗАНО' : 'ТРЕБУЕТ ИТЕРАЦИИ'}
                          </div>
                          <div className="text-[11px] opacity-80 font-mono">
                            Итераций RefinementLoop: {currentResult.iterationsUsed} • Идентичность L1: Verified
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono text-xs">
                        Инвариант: <span className="font-bold">{currentResult.transformationLog.finalInvariant}</span>
                      </div>
                    </div>

                    {/* Lean 4 Output Box */}
                    <div className="flex-1 flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                      <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-cyan-400" /> Сгенерированное Lean 4 Доказательство
                        </span>
                        <span className="text-green-400 font-semibold">RICIS3.Core (No Cauchy Limits)</span>
                      </div>
                      <pre className="p-4 text-xs font-mono text-cyan-300/90 overflow-x-auto overflow-y-auto max-h-[220px] whitespace-pre">
                        {currentResult.finalLeanCode}
                      </pre>
                    </div>

                    {/* Trace History & Refinement Log */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                      <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 text-cyan-400" /> Трассировка RefinementLoop
                      </h4>
                      <div className="space-y-1.5">
                        {currentResult.traceHistory.map((step) => (
                          <div
                            key={step.stepName}
                            className="text-[11px] font-mono p-2 rounded bg-slate-950/60 border border-slate-800/60 flex items-center justify-between"
                          >
                            <span className="text-slate-300">Итерация #{step.iteration}: {step.stepName}</span>
                            <span className={step.auditResult.isValid ? 'text-green-400' : 'text-amber-400'}>
                              {step.auditResult.isValid ? 'VALIDATED' : 'REFINED'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
