import React, { useState, useEffect } from 'react';
import { 
  getRicisCoreEngine, 
  IRicisCoreEngine, 
  RicisEvaluationResult, 
  RicisFormalProof, 
  RicisProofMethod, 
  RicisProofVerificationResult,
  RicisAcademicProofResult
} from '../services/ricisCore';
import { APP_BUILD_LABEL } from '../version';
import { X, Play, ShieldCheck, Cpu, BookOpen, Layers, CheckCircle2, AlertCircle, Sparkles, FileText } from 'lucide-react';

interface RicisProofConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClaim?: string;
  initialProblemId?: string;
}

export const RicisProofConsoleModal: React.FC<RicisProofConsoleModalProps> = ({
  isOpen,
  onClose,
  initialClaim = '0_5 * inf_3',
  initialProblemId,
}) => {
  const [engine] = useState<IRicisCoreEngine>(() => getRicisCoreEngine());
  const [activeTab, setActiveTab] = useState<'evaluate' | 'prove' | 'academic'>('evaluate');
  
  // Evaluation state
  const [expression, setExpression] = useState(initialClaim);
  const [evalResult, setEvalResult] = useState<RicisEvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Formal Proof state
  const [proofClaim, setProofClaim] = useState(initialClaim);
  const [proofMethod, setProofMethod] = useState<RicisProofMethod>('geometric_bridge');
  const [formalProof, setFormalProof] = useState<RicisFormalProof | null>(null);
  const [isProving, setIsProving] = useState(false);
  const [verificationResult, setVerificationResult] = useState<RicisProofVerificationResult | null>(null);

  // Academic Protocol (proveSystem) state
  const [academicPremisesText, setAcademicPremisesText] = useState(initialClaim);
  const [academicGoal, setAcademicGoal] = useState('15');
  const [academicResult, setAcademicResult] = useState<RicisAcademicProofResult | null>(null);
  const [isProvingAcademic, setIsProvingAcademic] = useState(false);

  useEffect(() => {
    if (isOpen) {
      engine.initialize();
      if (initialClaim) {
        setExpression(initialClaim);
        setProofClaim(initialClaim);
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
        enableTracePhases: true,
      });
      setEvalResult(res);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleGenerateProof = async () => {
    if (!proofClaim.trim()) return;
    setIsProving(true);
    try {
      const proof = await engine.generateFormalProof(proofClaim.trim(), proofMethod, {
        problemId: initialProblemId,
      });
      setFormalProof(proof);
      const verification = await engine.verifyProofChain(proof);
      setVerificationResult(verification);
    } finally {
      setIsProving(false);
    }
  };

  const handleRunAcademicProof = async () => {
    if (!academicPremisesText.trim()) return;
    setIsProvingAcademic(true);
    try {
      // Split lines or commas into premises
      const premises = academicPremisesText
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);
      
      const res = await engine.proveSystem(
        premises.length > 0 ? premises : [academicPremisesText],
        academicGoal.trim() || '1',
        initialProblemId
      );
      setAcademicResult(res);
    } finally {
      setIsProvingAcademic(false);
    }
  };

  const setPreset = (expr: string, method?: RicisProofMethod) => {
    setExpression(expr);
    setProofClaim(expr);
    if (method) setProofMethod(method);
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
                <h2 className="text-sm font-bold tracking-wider text-slate-100 uppercase">RICIS-III Proof & Singularity Console</h2>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-950/60 border border-cyan-800/40 text-cyan-300">
                  {APP_BUILD_LABEL}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-950/60 border border-cyan-800/40 text-cyan-300">
                  {engine.status === 'ready_wasm' ? 'WASM C# Core' : 'TS Deterministic Engine'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Локальная RICIS-цепочка; Lean-статус требует отдельного воспроизводимого kernel evidence.</p>
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
            Вычисление сингулярностей O(1)
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
            Генератор формальных доказательств
          </button>
          <button
            onClick={() => setActiveTab('academic')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors ${
              activeTab === 'academic'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Академический протокол (proveSystem)
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">Предустановки:</span>
            <button
              onClick={() => setPreset('0_5 * inf_3', 'geometric_bridge')}
              className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#0e1626] hover:bg-cyan-950/60 border border-cyan-900/40 text-cyan-300 transition-colors"
            >
              0_5 * inf_3 (A6)
            </button>
            <button
              onClick={() => setPreset('0_7 / 0_7', 'identity_conservation')}
              className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#0e1626] hover:bg-cyan-950/60 border border-cyan-900/40 text-cyan-300 transition-colors"
            >
              0_7 / 0_7 (L1 Identity)
            </button>
            <button
              onClick={() => setPreset('0_10 / 0_2', 'identity_conservation')}
              className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#0e1626] hover:bg-cyan-950/60 border border-cyan-900/40 text-cyan-300 transition-colors"
            >
              0_10 / 0_2 (A4 Ratio)
            </button>
            <button
              onClick={() => setPreset('8 / 0', 'infinity_arithmetic')}
              className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#0e1626] hover:bg-cyan-950/60 border border-cyan-900/40 text-cyan-300 transition-colors"
            >
              8 / 0 (A10)
            </button>
            <button
              onClick={() => setPreset('inf_10 - inf_3', 'infinity_arithmetic')}
              className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#0e1626] hover:bg-cyan-950/60 border border-cyan-900/40 text-cyan-300 transition-colors"
            >
              inf_10 - inf_3 (A7)
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
                  placeholder="Введите сингулярное выражение (e.g. 0_5 * inf_3, 0_10 / 0_2)..."
                  className="flex-1 bg-[#050810] border border-cyan-900/50 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-400 shadow-inner"
                />
                <button
                  onClick={handleRunEvaluation}
                  disabled={isEvaluating}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-semibold text-xs transition-colors shadow-lg shadow-cyan-950/50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {isEvaluating ? 'Вычисление...' : 'Рассчитать в O(1)'}
                </button>
              </div>

              {/* Evaluation Result */}
              {evalResult && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Summary Card */}
                  <div className="p-4 rounded-lg bg-[#070c16] border border-cyan-900/50 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">Точный инвариант RICIS-III</div>
                      <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">{evalResult.invariant}</div>
                      {evalResult.semanticIndex && (
                        <div className="text-xs text-slate-400 font-mono mt-1">Семантический индекс: {evalResult.semanticIndex}</div>
                      )}
                    </div>
                    <div className="text-right space-y-1 font-mono text-xs">
                      <div className="text-emerald-400 font-semibold flex items-center justify-end gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Сложность O(1)
                      </div>
                      <div className="text-slate-400">Рантайм: {evalResult.executionEngine}</div>
                    </div>
                  </div>

                  {/* Trace Phases */}
                  <div className="border border-cyan-900/40 rounded-lg overflow-hidden bg-[#050912]">
                    <div className="px-4 py-2.5 bg-[#080e1a] border-b border-cyan-900/30 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                        Трассировка 8 фаз конвейера (Phases -1...6)
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
                                  Аксиома {step.appliedAxiom}
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-[11px]">Вход: <span className="text-slate-200">{step.inputState}</span></div>
                            <div className="text-emerald-400/90 text-[11px]">Выход: <span className="text-emerald-300">{step.outputState}</span></div>
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
              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    Утверждение / Выражение для доказательства
                  </label>
                  <input
                    type="text"
                    value={proofClaim}
                    onChange={(e) => setProofClaim(e.target.value)}
                    placeholder="e.g. 0_5 * inf_3, (x-5)(x+5)/(x-5) at x=5"
                    className="w-full bg-[#050810] border border-cyan-900/50 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-400 shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    Метод доказательства
                  </label>
                  <select
                    value={proofMethod}
                    onChange={(e) => setProofMethod(e.target.value as RicisProofMethod)}
                    className="w-full bg-[#050810] border border-cyan-900/50 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                  >
                    <option value="geometric_bridge">Геометрический мост (A6, det(u,v))</option>
                    <option value="identity_conservation">Сохранение идентичности L1 (0_F/0_F=1)</option>
                    <option value="singularity_separation">Сепарация сингулярности (SP1/SP2)</option>
                    <option value="discrete_monolith">Дискретный монолит (Delta_plane)</option>
                    <option value="infinity_arithmetic">Арифметика бесконечностей (A7/A10)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateProof}
                disabled={isProving}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs transition-colors shadow-lg shadow-cyan-950/50"
              >
                <BookOpen className="w-4 h-4 fill-current" />
                {isProving ? 'Синтез доказательства...' : 'Сгенерировать и верифицировать формальное доказательство'}
              </button>

              {/* Formal Proof Card */}
              {formalProof && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 rounded-lg bg-[#070c16] border border-cyan-900/50 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-cyan-300">{formalProof.theoremTitle}</h3>
                        <p className="text-xs text-slate-400 font-mono mt-1">{formalProof.hypothesis}</p>
                      </div>
                      {verificationResult && (
                        <div className={`px-2.5 py-1 rounded text-xs font-mono font-semibold flex items-center gap-1.5 ${
                          verificationResult.valid ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50' : 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
                        }`}>
                          {verificationResult.valid ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                          {verificationResult.valid ? 'RICIS-цепочка согласована' : 'Сбой проверки цепочки'}
                        </div>
                      )}
                    </div>

                    {/* Step by step */}
                    <div className="space-y-2 pt-2 border-t border-cyan-950">
                      {formalProof.steps.map((step) => (
                        <div key={step.stepNumber} className="p-3 rounded bg-[#090f1d] border border-cyan-950/60 space-y-1">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-300 font-semibold">Шаг {step.stepNumber}: {step.statement}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                              Обоснование: {step.justificationAxiom}
                            </span>
                          </div>
                          <div className="p-2 rounded bg-black/40 font-mono text-cyan-300 text-xs overflow-x-auto">
                            {step.mathematicalForm}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Conclusion */}
                    <div className="p-3 rounded bg-cyan-950/30 border border-cyan-800/40 flex items-center justify-between">
                      <div className="text-xs font-mono text-slate-300">
                        Итоговый инвариант теоремы: <span className="text-cyan-300 font-bold text-sm ml-1">{formalProof.conclusionInvariant}</span>
                      </div>
                      <div className="text-xs font-mono text-cyan-300">Локальный структурный результат</div>
                    </div>

                    {/* Lean 4 Snippet */}
                    {formalProof.lean4CodeSnippet && (
                      <div className="p-3 rounded bg-[#04060b] border border-neutral-800/80 font-mono text-xs space-y-1">
                        <div className="text-[10px] text-amber-300 uppercase tracking-wider">Lean 4 source draft — отдельный kernel run обязателен</div>
                        <pre className="text-cyan-200 overflow-x-auto">{formalProof.lean4CodeSnippet}</pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'academic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    Посылки системы (по одной строке или через запятую / лямбда)
                  </label>
                  <textarea
                    rows={3}
                    value={academicPremisesText}
                    onChange={(e) => setAcademicPremisesText(e.target.value)}
                    placeholder="e.g. 0_5 * inf_3&#10;0_7 / 0_7"
                    className="w-full bg-[#050810] border border-cyan-900/50 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-400 shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    Ожидаемый инвариант (Expected Goal)
                  </label>
                  <input
                    type="text"
                    value={academicGoal}
                    onChange={(e) => setAcademicGoal(e.target.value)}
                    placeholder="e.g. 15, 1, 5"
                    className="w-full bg-[#050810] border border-cyan-900/50 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-400 shadow-inner"
                  />
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    Система выполнит фазовый вывод и сравнит полученный инвариант с ожидаемым.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRunAcademicProof}
                disabled={isProvingAcademic}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs transition-colors shadow-lg shadow-cyan-950/50"
              >
                <FileText className="w-4 h-4" />
                {isProvingAcademic ? 'Выполнение академического доказательства...' : 'Запустить академический расчет системы (proveSystem)'}
              </button>

              {academicResult && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 rounded-lg bg-[#070c16] border border-cyan-900/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-cyan-300">Академический статус:</span>
                        <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                          academicResult.academicStatus === 'QED_VERIFIED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                            : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                        }`}>
                          {academicResult.academicStatus === 'QED_VERIFIED' ? '✓ Цель совпала в proveSystem; Lean kernel не подразумевается' : '⚠ Цель и локальный результат не совпали'}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-cyan-400">
                        Сложность: {academicResult.complexity}
                      </div>
                    </div>

                    {/* Verification overview */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono p-3 rounded bg-black/40 border border-cyan-950">
                      <div>
                        <span className="text-slate-400">Вычисленный инвариант:</span>{' '}
                        <span className="text-cyan-300 font-bold">{academicResult.reducedInvariant}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Ожидаемая цель:</span>{' '}
                        <span className="text-slate-200 font-bold">{academicResult.expectedGoal}</span>
                      </div>
                    </div>

                    {/* Step log */}
                    <div className="space-y-2 pt-2 border-t border-cyan-950">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                        Пошаговый академический лог (Аксиомы & Преобразования):
                      </div>
                      {academicResult.steps.map((step, idx) => (
                        <div key={idx} className="p-3 rounded bg-[#090f1d] border border-cyan-950/60 space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-cyan-400 font-semibold">{step.phase}</span>
                            <span className="text-slate-300 text-[11px]">{step.title}</span>
                          </div>
                          <div className="text-xs text-slate-300 leading-relaxed font-sans">
                            {step.academicDescription}
                          </div>
                          <div className="p-2 rounded bg-black/50 font-mono text-cyan-200 text-xs overflow-x-auto">
                            {step.mathLatex}
                          </div>
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
