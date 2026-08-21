import React, { useState, useEffect } from 'react';
import {
  getRicisCoreEngine,
  IRicisCoreEngine,
  RicisEvaluationResult,
} from '../services/ricisCore';
import { isCoreExecutionFailure } from '../services/ricisCore/IRicisCoreEngine';
import {
  type IRicisProofGateway,
  type ProofRunResponse,
  isProofGatewayFailure,
} from '../services/ricisCore/IRicisProofGateway';
import { useI18nStore } from '../store/useI18nStore';
import { writeCoreRecovery } from '../services/coreRecovery';
import { APP_BUILD_LABEL } from '../version';
import { X, Play, Cpu, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

interface RicisProofConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClaim?: string;
  initialProblemId?: string;
  /** Optional composition seams for direct UI regression tests. */
  coreEngine?: IRicisCoreEngine;
  proofGateway?: IRicisProofGateway;
}

export const RicisProofConsoleModal: React.FC<RicisProofConsoleModalProps> = ({
  isOpen,
  onClose,
  initialClaim = '0_5 * inf_3',
  initialProblemId,
  coreEngine,
  proofGateway: injectedProofGateway,
}) => {
  const [engine] = useState<IRicisCoreEngine>(() => coreEngine ?? getRicisCoreEngine());
  const [proofGateway] = useState<IRicisProofGateway>(() =>
    injectedProofGateway ?? (coreEngine ?? getRicisCoreEngine()) as unknown as IRicisProofGateway,
  );
  const { t } = useI18nStore();
  const [activeTab, setActiveTab] = useState<'evaluate' | 'prove'>('evaluate');
  
  // Evaluation state
  const [expression, setExpression] = useState(initialClaim);
  const [evalResult, setEvalResult] = useState<RicisEvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Formal Proof state
  const [proofClaim, setProofClaim] = useState(initialClaim);
  const [proofExpected, setProofExpected] = useState(initialClaim);
  const [proofRun, setProofRun] = useState<ProofRunResponse | null>(null);
  const [proofRecoveryResourceKey, setProofRecoveryResourceKey] = useState<string | null>(null);
  const [isProving, setIsProving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      engine.initialize();
      if (initialClaim) {
        setExpression(initialClaim);
        setProofClaim(initialClaim);
        setProofExpected(initialClaim);
      }
    }
  }, [isOpen, initialClaim, engine]);

  if (!isOpen) return null;

  const handleRunEvaluation = async () => {
    if (!expression.trim()) return;
    setIsEvaluating(true);
    try {
      const res = await engine.evaluate({
        expression: expression.trim(),
        contextProblemId: 'proof_console',
        enableTracePhases: true,
      });
      if (isCoreExecutionFailure(res)) {
        setEvalResult(null);
        writeCoreRecovery({
          ...res,
          diagnostic: { ...res.diagnostic, origin: 'proof_console' },
        });
        return;
      }
      setEvalResult(res);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleGenerateProof = async () => {
    if (!proofClaim.trim() || !proofExpected.trim()) return;
    setIsProving(true);
    try {
      const result = await proofGateway.createRun({
        claim: proofClaim.trim(),
        expected: proofExpected.trim(),
        requestedFormats: ['Academic', 'Latex', 'Log'],
      });
      if (isProofGatewayFailure(result)) {
        setProofRun(null);
        setProofRecoveryResourceKey(result.userMessage);
        writeCoreRecovery({
          ...result,
          diagnostic: { ...result.diagnostic, origin: 'proof_console' },
        });
        return;
      }
      setProofRecoveryResourceKey(null);
      setProofRun(result);
    } finally {
      setIsProving(false);
    }
  };

  const setPreset = (expr: string) => {
    setExpression(expr);
    setProofClaim(expr);
    setProofExpected(expr);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#090d16] border border-cyan-900/60 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-900/40 bg-[#060a12]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wider text-slate-100 uppercase">{t('proofConsole.title')}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-950/60 border border-cyan-800/40 text-cyan-300">
                  {APP_BUILD_LABEL}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-950/60 border border-cyan-800/40 text-cyan-300">
                  {engine.status === 'ready_wasm' ? t('proofConsole.runtime.wasmCore') : t('proofConsole.runtime.diagnostic')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">{t('proofConsole.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 border-b border-cyan-900/30 bg-[#070c14] text-xs font-medium">
          <button
            onClick={() => setActiveTab('evaluate')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors ${
              activeTab === 'evaluate'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            {t('proofConsole.tab.evaluate')}
          </button>
          <button
            onClick={() => setActiveTab('prove')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors ${
              activeTab === 'prove'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {t('proofConsole.tab.prove')}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">{t('proofConsole.presets')}:</span>
            <button
              onClick={() => setPreset('0_5 * inf_3')}
              className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#0e1626] hover:bg-cyan-950/60 border border-cyan-900/40 text-cyan-300 transition-colors"
            >
              {t('proofConsole.preset.a6')}
            </button>
            <button
              onClick={() => setPreset('0_7 / 0_7')}
              className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#0e1626] hover:bg-cyan-950/60 border border-cyan-900/40 text-cyan-300 transition-colors"
            >
              {t('proofConsole.preset.l1')}
            </button>
            <button
              onClick={() => setPreset('0_10 / 0_2')}
              className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#0e1626] hover:bg-cyan-950/60 border border-cyan-900/40 text-cyan-300 transition-colors"
            >
              {t('proofConsole.preset.a4')}
            </button>
            <button
              onClick={() => setPreset('8 / 0')}
              className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#0e1626] hover:bg-cyan-950/60 border border-cyan-900/40 text-cyan-300 transition-colors"
            >
              {t('proofConsole.preset.a10')}
            </button>
            <button
              onClick={() => setPreset('inf_10 - inf_3')}
              className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#0e1626] hover:bg-cyan-950/60 border border-cyan-900/40 text-cyan-300 transition-colors"
            >
              {t('proofConsole.preset.a7')}
            </button>
          </div>

          {activeTab === 'evaluate' && (
            <div className="space-y-4">
              {/* Input Box */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunEvaluation()}
                  placeholder={t('proofConsole.evaluatePlaceholder')}
                  className="flex-1 bg-[#050810] border border-cyan-900/50 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-400 shadow-inner"
                />
                <button
                  onClick={handleRunEvaluation}
                  disabled={isEvaluating}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-semibold text-xs transition-colors shadow-lg shadow-cyan-950/50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {isEvaluating ? t('proofConsole.evaluating') : t('proofConsole.evaluate')}
                </button>
              </div>

              {/* Evaluation Result */}
              {evalResult && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Summary Card */}
                  <div className="p-4 rounded-lg bg-[#070c16] border border-cyan-900/50 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">{t('proofConsole.exactInvariant')}</div>
                      <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">{evalResult.invariant}</div>
                      {evalResult.semanticIndex && (
                        <div className="text-xs text-slate-400 font-mono mt-1">{t('proofConsole.semanticIndex')}: {evalResult.semanticIndex}</div>
                      )}
                    </div>
                    <div className="text-right space-y-1 font-mono text-xs">
                      <div className="text-emerald-400 font-semibold flex items-center justify-end gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> {t('proofConsole.complexity')} O(1)
                      </div>
                      <div className="text-slate-400">{t('proofConsole.runtime')}: {evalResult.executionEngine}</div>
                    </div>
                  </div>

                  {/* Trace Phases */}
                  <div className="border border-cyan-900/40 rounded-lg overflow-hidden bg-[#050912]">
                    <div className="px-4 py-2.5 bg-[#080e1a] border-b border-cyan-900/30 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                        {t('proofConsole.traceTitle')}
                      </span>
                    </div>
                    <div className="p-3 space-y-2 font-mono text-xs">
                      {evalResult.trace.map((step, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-[#090f1d] border border-cyan-950/60 flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-cyan-400 font-bold">{step.phase}</span>
                              <span className="text-slate-300 font-medium">— {step.title}</span>
                              {step.appliedAxiom && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                                  {t('proofConsole.axiom')} {step.appliedAxiom}
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-[11px]">{t('proofConsole.input')}: <span className="text-slate-200">{step.inputState}</span></div>
                            <div className="text-emerald-400/90 text-[11px]">{t('proofConsole.output')}: <span className="text-emerald-300">{step.outputState}</span></div>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-slate-400 border border-neutral-800">
                            {step.complexity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'prove' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    {t('proofConsole.claimLabel')}
                  </label>
                  <input
                    type="text"
                    value={proofClaim}
                    onChange={(e) => setProofClaim(e.target.value)}
                    placeholder={t('proofConsole.claimPlaceholder')}
                    className="w-full bg-[#050810] border border-cyan-900/50 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-400 shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    {t('proofConsole.expectedLabel')}
                  </label>
                  <input
                    type="text"
                    value={proofExpected}
                    onChange={(e) => setProofExpected(e.target.value)}
                    placeholder={t('proofConsole.expectedPlaceholder')}
                    className="w-full bg-[#050810] border border-cyan-900/50 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-400 shadow-inner"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateProof}
                disabled={isProving}
                data-testid="proof-console-create-run"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs transition-colors shadow-lg shadow-cyan-950/50"
              >
                <BookOpen className="w-4 h-4 fill-current" />
                {isProving ? t('proofConsole.creatingRun') : t('proofConsole.createRun')}
              </button>

              {proofRecoveryResourceKey && (
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/50 space-y-1 font-mono text-xs">
                  <div className="text-rose-300 font-semibold">{t('proofConsole.recoveryTitle')}</div>
                  <div className="text-rose-200">{proofRecoveryResourceKey}</div>
                </div>
              )}

              {proofRun && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="p-4 rounded-lg bg-[#070c16] border border-cyan-900/50 space-y-3 font-mono text-xs">
                    <h3 className="text-sm font-bold text-cyan-300">{t('proofConsole.snapshotTitle')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div><span className="text-slate-400">{t('proofConsole.correlationId')}:</span> <span className="text-cyan-200">{proofRun.correlationId}</span></div>
                      <div><span className="text-slate-400">{t('proofConsole.proofRunId')}:</span> <span className="text-cyan-200">{proofRun.proofRunId}</span></div>
                      <div><span className="text-slate-400">{t('proofConsole.coreVersion')}:</span> <span className="text-slate-200">{proofRun.coreVersion}</span></div>
                      <div><span className="text-slate-400">{t('proofConsole.structuralStatus')}:</span> <span className="text-slate-200">{proofRun.structuralVerification}</span></div>
                      <div><span className="text-slate-400">{t('proofConsole.trustStatus')}:</span> <span className="text-amber-300">{proofRun.trustStatus}</span></div>
                      <div><span className="text-slate-400">{t('proofConsole.evidenceBoundary')}:</span> <span className="text-amber-300">{proofRun.evidenceBoundaryResourceKey}</span></div>
                    </div>
                    <div className="p-3 rounded bg-black/40 border border-cyan-950/60 space-y-2">
                      <div className="text-slate-400">{t('proofConsole.documents')}:</div>
                      {proofRun.documents.map(document => (
                        <div key={`${document.format}-${document.contentHash}`} className="text-cyan-200">{document.format}: {document.contentHash}</div>
                      ))}
                    </div>
                    <div className="space-y-2 pt-2 border-t border-cyan-950">
                      <div className="text-slate-400">{t('proofConsole.traceCount')}: {proofRun.trace.length}</div>
                      {proofRun.trace.map(entry => (
                        <div key={`${entry.sequence}-${entry.eventCode}`} className="p-2 rounded bg-[#090f1d] border border-cyan-950/60 text-slate-200">
                          {entry.sequence}: {entry.stageType} / {entry.eventCode}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
