import React, { useState } from 'react';
import { ITransformationLogDTO } from '../model/traceVisualizer.types';
import { CheckCircle2, Copy, Check } from 'lucide-react';

interface PlainTerminalLogViewerProps {
  logData: ITransformationLogDTO;
  className?: string;
}

/**
 * Очищает строку бейджа фазы от лишних внешних/внутренних квадратных скобок.
 * Например: "[[Phase -1] L1 Identity]" -> "Phase -1"
 */
function cleanPhaseLabel(label?: string, fallbackIndex: number = 0): string {
  if (!label) return `Phase ${fallbackIndex}`;
  // Удаляем все квадратные скобки и берем префикс фазы
  const clean = label.replace(/[\[\]]/g, '').trim();
  // Если есть "Phase -1", "Phase 0", "Phase 0.5" и т.д.
  const phaseMatch = clean.match(/^(Phase\s*[-0-9.]+)/i);
  if (phaseMatch && phaseMatch[1]) {
    return phaseMatch[1];
  }
  return clean;
}

/**
 * Оптимизированный терминальный лог высокой четкости (Anti-Glare & High Contrast).
 * Высокая читаемость для глаз: яркий белый текст шагов формул и сдержанные фоновые бейджи.
 */
export function PlainTerminalLogViewer({ logData, className = '' }: PlainTerminalLogViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textLines: string[] = [];
    if (logData.semanticIndex) {
      textLines.push(`Index: ${logData.semanticIndex}`);
    }
    logData.steps.forEach((step, idx) => {
      const phase = cleanPhaseLabel(step.phaseBadgeLabel, idx);
      const axiom = step.appliedAxiom ? ` (${step.appliedAxiom})` : '';
      textLines.push(`[${phase}] ${step.title}${axiom}`);
      textLines.push(`  ${step.inputState} -> ${step.outputState} [${step.complexity}]`);
    });
    textLines.push(`Result: ${logData.finalInvariant}`);

    navigator.clipboard.writeText(textLines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`font-mono text-xs text-slate-100 bg-[#06080c] border border-neutral-800 rounded-lg p-3.5 space-y-2.5 select-text relative group ${className}`}>
      
      {/* Header Bar: Semantic Index + Copy Button */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
        <div className="text-[12px] text-slate-400">
          Index:{' '}
          <span className="text-slate-100 font-semibold bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
            {logData.semanticIndex || logData.targetExpression}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Копировать шаги вычисления в буфер"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Скопировано</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Копировать</span>
            </>
          )}
        </button>
      </div>

      {/* Пошаговый вывод в терминальном стиле с высокой контрастностью текста формул */}
      <div className="space-y-2 pt-0.5">
        {logData.steps.map((step, idx) => {
          const phaseLabel = cleanPhaseLabel(step.phaseBadgeLabel, idx);

          return (
            <div 
              key={idx} 
              className="flex flex-col gap-1 border-l-2 border-cyan-800/60 pl-3 py-1 bg-neutral-950/40 hover:bg-neutral-900/40 transition-colors rounded-r"
            >
              {/* Строка заголовка шага */}
              <div className="flex items-center gap-2 text-[11px] flex-wrap">
                {/* Бейдж фазы - сдержанный, без слепящего свечения */}
                <span className="px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/50 text-cyan-300 font-bold">
                  [{phaseLabel}]
                </span>

                {/* Название шага - четкий светлый текст */}
                <span className="text-slate-200 font-sans font-medium">
                  {step.title}
                </span>

                {/* Аксиома */}
                {step.appliedAxiom && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/50 text-amber-300 font-mono font-bold text-[10px]">
                    {step.appliedAxiom}
                  </span>
                )}

                {/* Сложность O(1) */}
                <span className="text-slate-500 font-mono text-[10px] ml-auto">
                  [{step.complexity}]
                </span>
              </div>

              {/* Строка преобразования формулы - ЯРКИЙ, ВЫСОКОКОНТРАСТНЫЙ ТЕКСТ ДЛЯ ГЛАЗ */}
              <div className="text-[12px] flex items-center gap-2 overflow-x-auto py-0.5 text-slate-100">
                <span className="text-slate-200 font-medium whitespace-nowrap">{step.inputState}</span>
                <span className="text-cyan-400 font-bold shrink-0">→</span>
                <span className="text-white font-bold bg-neutral-900/90 px-1.5 py-0.5 rounded border border-cyan-900/50 whitespace-nowrap shadow-[0_0_8px_rgba(6,182,212,0.1)]">
                  {step.outputState}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Итоговый инвариант - четкий, контрастный, без избыточного неона */}
      <div className="mt-3 pt-2.5 border-t border-neutral-800 flex items-center justify-between text-xs bg-emerald-950/20 px-3 py-2 rounded-md border border-emerald-900/40">
        <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <CheckCircle2 size={15} />
          Итоговый инвариант:
        </span>
        <span className="text-white font-mono font-bold text-sm px-2.5 py-0.5 bg-black border border-emerald-500/80 rounded shadow-[0_0_10px_rgba(16,185,129,0.2)]">
          {logData.finalInvariant}
        </span>
      </div>
    </div>
  );
}
