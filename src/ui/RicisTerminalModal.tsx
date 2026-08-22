import React, { useState } from 'react';
import { useTerminalStore } from '../store/useTerminalStore';
import type { ProofReportMode } from '../model/terminal.types';
import { 
  Terminal as TerminalIcon, 
  X, 
  Trash2, 
  Play, 
  ChevronUp, 
  Sparkles, 
  FileText, 
  Award, 
  FileCode2, 
  PlusCircle, 
  Share2, 
  Check 
} from 'lucide-react';
import { PlainTerminalLogViewer } from './PlainTerminalLogViewer';
import { TheoremReportViewer } from './TheoremReportViewer';
import { Lean4ReportViewer } from './Lean4ReportViewer';
import { UrlShareService } from '../services/UrlShareService';
import { AddNodeModal, AddNodePrefillData } from './AddNodeModal';
import { useI18nStore } from '../store/useI18nStore';

export interface SandboxPreset {
  id: string;
  badge: string;
  expression: string;
  hint: string;
}

const SANDBOX_PRESETS: SandboxPreset[] = [
  {
    id: 'a6_geo_bridge',
    badge: 'A6 Bridge',
    expression: '0_3 * inf_4',
    hint: '0_F * inf_G = det(u,v) = 12',
  },
  {
    id: 'a4_zero_ratio',
    badge: 'A4 Zero Ratio',
    expression: '0_6 / 0_2',
    hint: '0_F / 0_G = F/G = 3',
  },
  {
    id: 'sp2_factorization',
    badge: 'SP2 Factorization',
    expression: '(x^2 - 4)/(x - 2) | x=2',
    hint: '0/0 -> 4',
  },
  {
    id: 'a7_inf_sub',
    badge: 'A7 Inf Sub',
    expression: 'inf_8 - inf_3',
    hint: 'inf_F - inf_G = inf_5',
  },
  {
    id: 'sp1_locality',
    badge: 'SP1 Locality',
    expression: '(x - 5)*(x + 5)/(x - 5) | x=5',
    hint: '(0/0)*10 = 10',
  },
  {
    id: 'a10_scalar_div',
    badge: 'A10 Div Zero',
    expression: '42 / 0',
    hint: 'F / 0 = inf_42',
  },
  {
    id: 'l1_identity',
    badge: 'L1 Identity',
    expression: '0_F / 0_F',
    hint: '0_F / 0_F = 1',
  },
];

const REPORT_TABS: { id: ProofReportMode; label: string; icon: any }[] = [
  { id: 'trace', label: 'Пошаговый лог (Phases -1..6)', icon: FileText },
  { id: 'theorem', label: 'Теорема (LaTeX / Q.E.D.)', icon: Award },
  { id: 'lean4', label: 'Lean 4 Спецификация', icon: FileCode2 },
];

export function RicisTerminalModal() {
  const { t } = useI18nStore();
  const { 
    isOpen, 
    toggleTerminal, 
    activeReportMode, 
    setReportMode, 
    currentInput, 
    setInput, 
    evaluateExpression, 
    isEvaluating, 
    history, 
    clearHistory, 
    loadFromHistory 
  } = useTerminalStore();

  const [prefillDataForMap, setPrefillDataForMap] = useState<AddNodePrefillData | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen && !showAddModal) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      evaluateExpression();
    }
  };

  const handleSelectPreset = (expr: string) => {
    setInput(expr);
    setTimeout(() => {
      evaluateExpression();
    }, 50);
  };

  const handleShareSandbox = async (expression?: string) => {
    const exprToShare = expression || currentInput || (history.length > 0 ? history[0].expression : '');
    await UrlShareService.copyShareUrlToClipboard({
      sandboxExpr: exprToShare,
      mode: activeReportMode
    });
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendToMap = (entry: typeof history[0]) => {
    const formula = entry.expression;
    const invariant = entry.result?.finalInvariant || entry.formalProof?.conclusionInvariant || t('terminal.unknownInvariant');
    const title = t('terminal.mapTitle', { value: formula });
    
    let description = `${t('terminal.mapDescription', { value: formula })}\n`;
    if (entry.formalProof) {
      description += `${t('terminal.hypothesis', { value: entry.formalProof.hypothesis })}\n`;
      description += `${t('terminal.method', { value: entry.formalProof.method })}\n`;
      description += t('terminal.invariant', { value: entry.formalProof.conclusionInvariant });
    } else if (entry.result?.steps) {
      description += t('terminal.steps', { value: entry.result.steps.map(s => `${s.title}: ${s.inputState} -> ${s.outputState}`).join(' | ') });
    }

    setPrefillDataForMap({
      title,
      targetFunction: formula,
      description,
      hint: t('terminal.hint', { value: invariant }),
      zoneId: 'math'
    });

    toggleTerminal(false);
    setShowAddModal(true);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl bg-[#090c12] border border-cyan-900/40 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col max-h-[85vh] overflow-hidden">
            
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 bg-[#0d1117]">
              <div className="flex items-center gap-2 text-cyan-400">
                <TerminalIcon size={18} />
                <h2 className="text-sm font-bold uppercase tracking-widest font-mono text-slate-100">
                  {t('sandbox.title')}
                </h2>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleShareSandbox()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-cyan-300 hover:text-white transition-colors cursor-pointer"
                  title={t('header.share')}
                >
                  {copiedLink ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">{t('header.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={13} />
                      <span>{t('header.share')}</span>
                    </>
                  )}
                </button>

                {history.length > 0 && (
                  <button 
                    type="button"
                    onClick={clearHistory}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors cursor-pointer"
                    title={t('sandbox.clearHistory')}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => toggleTerminal(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title={t('terminal.close')}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Report Mode Tabs Bar */}
            <div className="px-4 py-1.5 bg-[#0a0d14] border-b border-neutral-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {[
                  { id: 'trace' as const, label: t('sandbox.tab.trace'), icon: FileText },
                  { id: 'theorem' as const, label: t('sandbox.tab.theorem'), icon: Award },
                  { id: 'lean4' as const, label: t('sandbox.tab.lean4'), icon: FileCode2 },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeReportMode === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setReportMode(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-sans transition-all cursor-pointer ${
                        isActive
                          ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-800/80 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-900 border border-transparent'
                      }`}
                    >
                      <Icon size={13} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                {t('terminal.engineVersion')}
              </span>
            </div>

            {/* Quick Single-Line Presets Toolbar */}
            <div className="px-4 py-2 bg-[#06080d] border-b border-neutral-800/80 flex items-center gap-2 overflow-x-auto select-none custom-scrollbar">
              <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-mono shrink-0 font-bold pr-1">
                <Sparkles size={13} />
                <span>{t('sandbox.examples')}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {SANDBOX_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.expression)}
                            title={`${preset.hint} (${t('terminal.clickToCompute')})`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-neutral-900 hover:bg-cyan-950/80 border border-neutral-700 hover:border-cyan-600 text-xs font-mono text-slate-200 hover:text-white transition-all cursor-pointer whitespace-nowrap shadow-sm"
                  >
                    <span className="text-cyan-300 font-bold">[{preset.badge}]</span>
                    <span className="text-slate-100 font-medium">{preset.expression}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Output / History Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar bg-[#080b10]">
              {history.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 font-mono text-xs gap-2 py-10">
                  <TerminalIcon size={36} className="text-cyan-700/40 mb-2" />
                  <p className="text-slate-300 font-semibold text-sm">{t('sandbox.ready')}</p>
                  <p className="text-slate-500">{t('sandbox.readyHint')}</p>
                </div>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-2 text-slate-300 font-mono text-xs">
                        <span className="text-cyan-400 font-bold">{'>'}</span>
                        <span className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded font-semibold text-white">
                          {entry.expression}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Кнопка Добавить на карту */}
                        {(entry.result || entry.formalProof) && (
                          <button
                            type="button"
                            onClick={() => handleSendToMap(entry)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-700 text-xs font-sans text-emerald-200 hover:text-white transition-all cursor-pointer shadow-sm"
                            title={t('terminal.addTitle')}
                          >
                            <PlusCircle size={13} className="text-emerald-400" />
                            <span>{t('sandbox.addToMap')}</span>
                          </button>
                        )}

                        <button 
                          type="button"
                          onClick={() => loadFromHistory(entry.expression)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-cyan-300 transition-all cursor-pointer"
                          title={t('terminal.loadTitle')}
                        >
                          <ChevronUp size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {entry.error ? (
                      <div className="ml-4 p-3 bg-red-950/30 border border-red-800/50 rounded-lg text-red-300 font-mono text-xs font-medium">
                        {t('terminal.error')}: {entry.error}
                      </div>
                    ) : (
                      <div className="ml-4">
                        {activeReportMode === 'trace' && entry.result && (
                          <PlainTerminalLogViewer logData={entry.result} />
                        )}

                        {activeReportMode === 'theorem' && entry.formalProof && (
                          <TheoremReportViewer proof={entry.formalProof} />
                        )}

                        {activeReportMode === 'lean4' && (
                          <Lean4ReportViewer 
                            lean4Code={entry.formalProof?.lean4CodeSnippet} 
                            claim={entry.expression} 
                          />
                        )}

                        {activeReportMode === 'theorem' && !entry.formalProof && entry.result && (
                          <PlainTerminalLogViewer logData={entry.result} />
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#0d1117] border-t border-neutral-800">
              <div className="flex items-center gap-3">
                <span className="text-cyan-400 font-mono font-bold text-base">{'>'}</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={currentInput}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('sandbox.placeholder')}
                  className="flex-1 bg-transparent border-0 outline-none text-white font-mono text-sm placeholder:text-slate-500 font-medium"
                  autoComplete="off"
                  spellCheck="false"
                  disabled={isEvaluating}
                />
                <button
                  type="button"
                  onClick={evaluateExpression}
                  disabled={!currentInput.trim() || isEvaluating}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  title={t('terminal.runTitle')}
                >
                  {isEvaluating ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Play size={15} className="ml-0.5" />
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal добавления узла при переносе из Sandbox */}
      {showAddModal && (
        <AddNodeModal
          onClose={() => setShowAddModal(false)}
          initialData={prefillDataForMap || undefined}
        />
      )}
    </>
  );
}
