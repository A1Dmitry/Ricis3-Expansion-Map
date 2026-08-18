import React, { useState } from 'react';
import { Copy, Check, Terminal, FileCode2 } from 'lucide-react';

interface Lean4ReportViewerProps {
  lean4Code?: string;
  claim: string;
  className?: string;
}

export function Lean4ReportViewer({ lean4Code, claim, className = '' }: Lean4ReportViewerProps) {
  const [copied, setCopied] = useState(false);

  const displayedSource = lean4Code || `-- Lean source is not attached for this claim.\n-- Claim: ${claim}\n-- This viewer does not synthesize a theorem or execute the Lean kernel.\n-- Submit immutable external Lean source and reproducible kernel evidence to advance its trust status.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayedSource).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`font-mono text-xs text-slate-100 bg-[#06080c] border border-blue-950/70 rounded-lg p-4 space-y-3 relative select-text ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-blue-900/40 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-blue-950/80 border border-blue-800/60 text-blue-400">
            <FileCode2 size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-blue-300 font-mono tracking-wide">
              Lean 4 source and evidence
            </h3>
            <span className="text-[10px] text-slate-400">
              Kernel status is not inferred by this viewer
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Копировать Lean 4 код"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Скопировано</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Копировать Lean 4</span>
            </>
          )}
        </button>
      </div>

      {/* Code Viewer */}
      <div className="relative">
        <pre className="p-3.5 bg-black rounded border border-blue-900/40 text-blue-100 font-mono text-xs leading-relaxed overflow-x-auto select-all">
          <code>{displayedSource}</code>
        </pre>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 bg-neutral-950 px-3 py-1.5 rounded border border-neutral-800">
        <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
          <Terminal size={13} />
          <span>{lean4Code ? 'Исходник Lean предоставлен; kernel evidence проверяется отдельно' : 'Исходник Lean не предоставлен'}</span>
        </div>
        <span className="text-amber-300 font-mono">No kernel run in this view</span>
      </div>

    </div>
  );
}
