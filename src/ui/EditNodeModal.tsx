import React, { useState } from 'react';
import type { ProblemNode } from '../model/types';
import { useMapStore } from '../store/mapStore';
import { LatexRenderer } from './LatexRenderer';
import { verifyLeanProof } from '../model/leanVerifier';
import { auditProofContent } from '../model/ricisCoreRules';
import { createEphemeralPassportSession, type EphemeralPassportSessionView } from '../leanPassportSession/leanPassportSession.domain';
import { LeanPassportSessionDialog } from './LeanPassportSessionDialog';

type Props = {
  node: ProblemNode;
  onClose: () => void;
  onSolveAfterSave?: () => void;
};

export const EditNodeModal: React.FC<Props> = ({ node, onClose, onSolveAfterSave }) => {
  const updateNode = useMapStore(s => s.updateNode);
  const updateProof = useMapStore(s => s.updateProof);
  const submitExternalLeanProof = useMapStore(s => s.submitExternalLeanProof);
  const sourceLocked = useMapStore(s => Boolean(s.proofs[node.id]?.externalLean?.sourceLocked));
  const externalLeanReference = useMapStore(s => s.proofs[node.id]?.externalLean);
  const getLatexProof = useMapStore(s => s.getLatexProof);
  const solveNode = useMapStore(s => s.solveNode);

  const currentProof = getLatexProof(node.id) || '';

  const [title, setTitle] = useState(node.title || '');
  const [targetFunction, setTargetFunction] = useState(node.targetFunction || '');
  const [description, setDescription] = useState(node.description || '');
  const [singularityHint, setSingularityHint] = useState(node.singularityHint || '');
  const [proofLatex, setProofLatex] = useState(currentProof);
  const [showProofPreview, setShowProofPreview] = useState(false);
  const [state, setState] = useState(node.state || 'unresolved');
  const [type, setType] = useState(node.type || 'scientific_task');
  const [marketGain, setMarketGain] = useState(node.economic?.marketGain || 0);
  const [costToSolve, setCostToSolve] = useState(node.economic?.costToSolve || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [passportSession, setPassportSession] = useState<EphemeralPassportSessionView | null>(null);
  const canOpenPassportSession = externalLeanReference?.sourceLocked === true;

  const handleOpenPassportSession = () => {
    if (!canOpenPassportSession || !externalLeanReference) return;
    setPassportSession(createEphemeralPassportSession({
      nodeId: node.id,
      sourceFingerprint: externalLeanReference.sourceHash,
      submittedAt: externalLeanReference.submittedAt,
      trustStatus: externalLeanReference.trustStatus,
      sourceLocked: true,
    }));
  };

  // Real-time auditing for compiler-style feedback
  const isLean = proofLatex && /\btheorem\b|\blemma\b|\bdef\b|\binductive\b|\bstructure\b|\baxiom\b|\bimport\b/i.test(proofLatex);
  const realTimeAudit = isLean
    ? verifyLeanProof(proofLatex, title, targetFunction)
    : (() => {
        const aud = auditProofContent(proofLatex);
        return {
          isValid: aud.isValid,
          status: 'NOT_LEAN' as const,
          errors: aud.isValid ? [] : aud.issues,
          warnings: [] as string[],
        };
      })();

  const handleSave = async (andSolve = false) => {
    setIsSaving(true);
    try {
      const updates: Partial<ProblemNode> = {
        title: title.trim(),
        targetFunction: targetFunction.trim(),
        description: description.trim(),
        singularityHint: singularityHint.trim(),
        state,
        type,
        economic: {
          ...node.economic,
          marketGain: Number(marketGain) || 0,
          costToSolve: Number(costToSolve) || 0,
        },
        leanErrors: realTimeAudit.errors,
        leanWarnings: realTimeAudit.warnings,
      };

      await updateNode(node.id, updates);

      if (proofLatex !== currentProof) {
        if (sourceLocked) {
          throw new Error('Внешний Lean source заблокирован: для новой версии создайте отдельный proof-узел.');
        }
        if (isLean) {
          await submitExternalLeanProof(node.id, proofLatex);
        } else {
          await updateProof(node.id, proofLatex.trim());
        }
      }

      if (andSolve) {
        onClose();
        if (onSolveAfterSave) {
          onSolveAfterSave();
        } else {
          void solveNode(node.id);
        }
      } else {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#0a0d14] border border-cyan-500/40 rounded-lg p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-cyan-900/50 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              ✏️ Редактирование узла: <span className="text-cyan-400 font-mono">{node.id}</span>
            </h2>
            <p className="text-[10px] text-gray-400">
              Измените целевую функцию или описание-инструкцию для Агента RICIS-III
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-sm font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Banner highlighting description as AI prompt hint */}
        <div className="p-3 bg-cyan-950/40 border border-cyan-700/60 rounded-md text-[10px] text-cyan-200/90 leading-relaxed space-y-1">
          <p className="font-bold text-cyan-300 flex items-center gap-1">
            💡 Инструкция для Агента при перерасчете:
          </p>
          <p>
            Поле <strong>«Описание»</strong> передаётся Агенту напрямую как подсказка/инструкция при расчете доказательства!
          </p>
          <p className="text-gray-300 italic font-mono text-[9px] bg-black/40 p-1.5 rounded border border-cyan-900/40">
            Пример: «использовать вместо корня битовую маску log2(sqr(N)) чтобы задать битность маски»
          </p>
        </div>

        <div className="space-y-3 text-[11px]">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              Название задачи / узла
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              Целевая функция (Target Function)
            </label>
            <input
              type="text"
              value={targetFunction}
              onChange={e => setTargetFunction(e.target.value)}
              placeholder="например: p * q = N или \sum x_i = C"
              className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-cyan-200 font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-cyan-400 uppercase mb-1">
              Описание / Инструкция Агенту при перерасчете
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Напишите описание проблемы и конкретные указания агенту (например: использовать вместо корня битовую маску log2(sqr(N)))..."
              className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-gray-200 focus:border-cyan-500 focus:outline-none font-sans text-[11px] leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-purple-400 uppercase mb-1">
              Подсказка о сингулярности (Singularity Hint)
            </label>
            <input
              type="text"
              value={singularityHint}
              onChange={e => setSingularityHint(e.target.value)}
              placeholder="например: SP2 cancellation at x=0"
              className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-purple-200 font-mono focus:border-purple-500 focus:outline-none text-[10px]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold text-amber-400 uppercase">
                Формальное доказательство Lean 4 / LaTeX (Proof)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowProofPreview(!showProofPreview)}
                  className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950 border border-cyan-800 text-cyan-300 hover:text-white transition-colors cursor-pointer"
                >
                  {showProofPreview ? '✏️ Редактировать код' : '👁️ Предпросмотр LaTeX'}
                </button>
              </div>
            </div>

            {showProofPreview ? (
              <div className="w-full bg-[#030508] border border-cyan-900/60 rounded p-3 text-cyan-200 text-xs leading-relaxed max-h-60 overflow-y-auto">
                <LatexRenderer content={proofLatex || '*(Нет текста доказательства)*'} />
              </div>
            ) : (
              <textarea
                rows={6}
                value={proofLatex}
                disabled={sourceLocked}
                onChange={e => setProofLatex(e.target.value)}
                placeholder="Вставьте Lean 4 или LaTeX. Lean-код получает статус verified только после воспроизводимого запуска kernel."
                className="w-full bg-[#030508] border border-neutral-700 rounded p-2 text-cyan-300 font-mono text-[10px] leading-relaxed focus:border-cyan-500 focus:outline-none whitespace-pre"
              />
            )}

            {sourceLocked && (
              <div className="mt-2 space-y-2 p-2.5 bg-cyan-950/30 border border-cyan-800/50 rounded text-[10px] text-cyan-100 leading-relaxed">
                <p>Внешний Lean source сохранён дословно и заблокирован от замены агентом. После kernel verification он может быть принят как `TRUSTED_AXIOM` вместе с compiler evidence и `#print axioms`.</p>
                {canOpenPassportSession && (
                  <button
                    type="button"
                    onClick={handleOpenPassportSession}
                    className="rounded border border-cyan-700 px-2 py-1 text-[10px] font-bold text-cyan-200 hover:border-cyan-300 hover:text-white"
                  >
                    Открыть паспорт источника
                  </button>
                )}
              </div>
            )}

            {isLean && realTimeAudit.status === 'STATIC_CHECK_PASSED' && (
              <div className="mt-2 p-2.5 bg-amber-950/30 border border-amber-800/50 rounded text-[10px] text-amber-200 leading-relaxed">
                Статический Lean-анализ пройден. Это не результат Lean kernel: proof остаётся в статусе `REQUIRES_CORE_LEAN` до отдельной воспроизводимой компиляции.
              </div>
            )}

            {/* Real-time Lean 4/LaTeX compiler-style audit feedback */}
            {((realTimeAudit.errors && realTimeAudit.errors.length > 0) || (realTimeAudit.warnings && realTimeAudit.warnings.length > 0)) && (
              <div className="mt-2 p-2.5 bg-[#1c0f13] border border-red-900/40 rounded text-[10px] space-y-1.5 leading-relaxed">
                <div className="text-red-400 font-bold uppercase tracking-wider text-[8px] flex items-center gap-1">
                  🔍 ИНТЕРАКТИВНЫЙ АНАЛИЗАТОР LEAN 4 / RICIS
                </div>
                
                {realTimeAudit.errors && realTimeAudit.errors.length > 0 && (
                  <div>
                    <span className="text-red-400 font-bold block uppercase text-[8px]">Ошибки (Errors):</span>
                    <ul className="list-disc list-inside text-red-200/90 pl-1 space-y-0.5">
                      {realTimeAudit.errors.map((err, idx) => (
                        <li key={idx} className="break-words">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {realTimeAudit.warnings && realTimeAudit.warnings.length > 0 && (
                  <div className={`pt-1 ${realTimeAudit.errors && realTimeAudit.errors.length > 0 ? 'border-t border-red-950/60 mt-1' : ''}`}>
                    <span className="text-amber-500 font-bold block uppercase text-[8px]">Предупреждения (Warnings):</span>
                    <ul className="list-disc list-inside text-amber-200/90 pl-1 space-y-0.5">
                      {realTimeAudit.warnings.map((warn, idx) => (
                        <li key={idx} className="break-words">{warn}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                Статус решения (Шар на 3D-карте)
              </label>
              <select
                value={state}
                onChange={e => setState(e.target.value as any)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="unresolved">🔴 Нерешено (Unresolved - Красный)</option>
                <option value="partial">🟡 Частично / Требуется RICIS (Partial - Желтый)</option>
                <option value="resolved">🟢 Полностью решено (Resolved - Зеленый)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                Тип задачи
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="scientific_task">Научная задача</option>
                <option value="core_singularity">Ядро / Сингулярность</option>
                <option value="derived_problem">Производная задача</option>
                <option value="derivative_claim">Производная / Аудит приоритета</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                Оценка рынка ($)
              </label>
              <input
                type="number"
                value={marketGain}
                onChange={e => setMarketGain(Number(e.target.value))}
                className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-emerald-300 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                Затраты на решение ($)
              </label>
              <input
                type="number"
                value={costToSolve}
                onChange={e => setCostToSolve(Number(e.target.value))}
                className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-amber-300 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-cyan-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded bg-neutral-800 text-gray-300 hover:bg-neutral-700 text-[11px] font-medium transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(false)}
            className="px-3 py-2 rounded bg-cyan-950 border border-cyan-700/80 text-cyan-200 hover:bg-cyan-900 text-[11px] font-bold transition-colors"
          >
            Сохранить
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(true)}
            className="px-3 py-2 rounded bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-bold text-[11px] hover:brightness-110 transition-all shadow-lg"
          >
            ⚡ Сохранить и Перерассчитать (RICIS-III)
          </button>
        </div>
      </div>
      {passportSession !== null && (
        <LeanPassportSessionDialog
          view={passportSession}
          onClose={() => setPassportSession(null)}
        />
      )}
    </div>
  );
};
