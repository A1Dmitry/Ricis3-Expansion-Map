import React, { useState } from 'react';
import { RicisFormalProof } from '../services/ricisCore/IRicisCoreEngine';
import { Award, Copy, Check, BookOpen, CheckCircle2 } from 'lucide-react';

interface TheoremReportViewerProps {
  proof: RicisFormalProof;
  className?: string;
}

export function TheoremReportViewer({ proof, className = '' }: TheoremReportViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const lines: string[] = [
      `=== ${proof.theoremTitle} ===`,
      `Метод доказательства: ${proof.method}`,
      `Гипотеза: ${proof.hypothesis}`,
      `Сложность: ${proof.complexity}`,
      '',
      'ШАГИ ДОКАЗАТЕЛЬСТВА:',
      ...proof.steps.map(s => `[${s.stepNumber}] ${s.phase} (${s.justificationAxiom}): ${s.statement}\n    ${s.mathematicalForm}`),
      '',
      `ИТОГ: ${proof.conclusionInvariant} (Q.E.D.)`
    ];

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`font-mono text-xs text-slate-100 bg-[#06080c] border border-amber-950/60 rounded-lg p-4 space-y-3 relative select-text ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-900/30 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-950/80 border border-amber-800/60 text-amber-400">
            <Award size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-amber-300 font-sans tracking-wide">
              {proof.theoremTitle}
            </h3>
            <span className="text-[10px] text-slate-400">
              Метод: <strong className="text-slate-200">{proof.method}</strong> • Сложность: <strong className="text-emerald-400">{proof.complexity}</strong>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Копировать текст теоремы"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Скопировано</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Копировать теорему</span>
            </>
          )}
        </button>
      </div>

      {/* Hypothesis */}
      <div className="bg-neutral-950/80 border border-neutral-800/80 rounded p-2.5">
        <div className="text-[11px] text-amber-400/90 font-bold mb-1 flex items-center gap-1.5">
          <BookOpen size={13} />
          <span>Гипотеза (Premise):</span>
        </div>
        <p className="text-slate-200 text-xs font-sans leading-relaxed">
          {proof.hypothesis}
        </p>
      </div>

      {/* Steps List */}
      <div className="space-y-2 pt-1">
        <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
          Шаги формального доказательства:
        </div>
        {proof.steps.map((step) => (
          <div 
            key={step.stepNumber} 
            className="flex flex-col gap-1 border-l-2 border-amber-600/70 pl-3 py-1.5 bg-neutral-950/50 rounded-r border border-y-0 border-r-0"
          >
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800/60 text-amber-300 font-bold text-[10px]">
                Шаг {step.stepNumber}
              </span>
              <span className="text-slate-300 font-sans font-medium text-xs">
                {step.statement}
              </span>
              <span className="ml-auto px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/50 text-cyan-300 text-[10px] font-bold">
                {step.justificationAxiom}
              </span>
            </div>

            <div className="text-xs text-white font-mono bg-black/80 px-2.5 py-1 rounded border border-neutral-800 overflow-x-auto my-0.5">
              {step.mathematicalForm}
            </div>
          </div>
        ))}
      </div>

      {/* Conclusion */}
      <div className="mt-3 pt-2.5 border-t border-amber-900/40 flex items-center justify-between text-xs bg-amber-950/20 px-3 py-2 rounded-md border border-amber-800/40">
        <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <CheckCircle2 size={15} />
          Заключение (Q.E.D.):
        </span>
        <span className="text-white font-mono font-bold text-sm px-3 py-0.5 bg-black border border-amber-500/80 rounded shadow-[0_0_10px_rgba(245,158,11,0.2)]">
          {proof.conclusionInvariant}
        </span>
      </div>

    </div>
  );
}
