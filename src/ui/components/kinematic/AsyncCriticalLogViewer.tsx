// ============================================================================
// ASYNC CRITICAL NODE LOG VIEWER COMPONENT (Non-blocking real-time terminal)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import { asyncCriticalLogger } from '../../../services/kinematic/asyncManipulatorLogger';
import type { IAsyncNodeCriticalLogEntry } from '../../../services/kinematic/twoStageSingularity.contracts';

export const AsyncCriticalLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<readonly IAsyncNodeCriticalLogEntry[]>([]);

  useEffect(() => {
    return asyncCriticalLogger.subscribe((updated: readonly IAsyncNodeCriticalLogEntry[]) => {
      setLogs(updated);
    });
  }, []);

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col h-48">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <Terminal className="w-4 h-4" />
          <span className="font-semibold">Async Critical Node Log Stream</span>
          <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
            Microtask / Non-blocking
          </span>
        </div>
        <button
          onClick={() => asyncCriticalLogger.clear()}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          title="Clear logs"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {logs.length === 0 ? (
          <div className="text-slate-600 text-center py-4 italic">
            Waiting for critical kinematic transitions...
          </div>
        ) : (
          logs.map((log: IAsyncNodeCriticalLogEntry) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString();
            let badgeBg = 'bg-cyan-950/40 text-cyan-400 border-cyan-800/40';
            if (log.eventType === 'SINGULARITY_DETECTED') {
              badgeBg = 'bg-red-950/50 text-red-300 border-red-800/50';
            } else if (log.eventType === 'NULLSPACE_ESCAPE_EXECUTED') {
              badgeBg = 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50';
            } else if (log.eventType === 'POLAR_TRANSITION_TRIGGER') {
              badgeBg = 'bg-purple-950/50 text-purple-300 border-purple-800/50';
            }

            return (
              <div
                key={log.id}
                className="p-1.5 rounded bg-slate-900/60 border border-slate-800/60 flex flex-col gap-0.5"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`px-1.5 py-0.5 rounded border font-semibold ${badgeBg}`}>
                    {log.eventType}
                  </span>
                  <span className="text-slate-500">{timeStr}</span>
                </div>
                <div className="text-slate-300 mt-0.5">{log.message}</div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                  <span>
                    θ: [{log.jointAnglesDeg.map((d: number) => `${d.toFixed(1)}°`).join(', ')}]
                  </span>
                  <span>σ_min: {log.sigmaMin.toFixed(4)}</span>
                  <span>Mode: {log.mode}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
