import React, { useEffect, useState, useMemo } from 'react';
import { ContentButton } from './components/ContentButton';
import { useMapStore } from '../store/mapStore';
import { 
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  Terminal as TerminalIcon,
  Hash,
  Activity,
  ArrowLeft
} from 'lucide-react';
import type { AppletId } from '../types/appletRegistry';

// ============================================================================
// PROOF LOGS APPLET (MVVM / DDD / SOLID)
// Displays read-only verified Lean 4 kernel results for the active node.
// Grounded in artifacts/proofs/core-checks/kernel-findings.json.
// ============================================================================

interface KernelTheorem {
  readonly name: string;
  readonly status: string;
  readonly axioms: readonly string[];
}

interface KernelArtifact {
  readonly artifactId: string;
  readonly outcome: string;
  readonly compilerExit: number;
  readonly compilerErrorCount: number;
  readonly resultLine: string;
  readonly firstCompilerErrors: readonly string[];
  readonly theoremCount: number;
  readonly theorems: readonly KernelTheorem[];
  readonly sourceSha256?: string;
  readonly immutableSource?: string;
}

interface KernelFindings {
  readonly registryVersion: string;
  readonly artifacts: readonly KernelArtifact[];
}

interface ProofLogsAppletProps {
  readonly activeNodeId?: string | null;
  readonly onBackToMap: () => void;
}

export const ProofLogsApplet: React.FC<ProofLogsAppletProps> = ({ 
  activeNodeId, 
  onBackToMap 
}) => {
  const map = useMapStore();
  const [findings, setFindings] = useState<KernelFindings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load the kernel findings registry
  useEffect(() => {
    async function loadFindings() {
      try {
        setLoading(true);
        const response = await fetch('/artifacts/proofs/core-checks/kernel-findings.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setFindings(data);
      } catch (e) {
        console.error('Failed to load kernel findings:', e);
        setError('Не удалось загрузить реестр ядровых прогонов.');
      } finally {
        setLoading(false);
      }
    }
    void loadFindings();
  }, []);

  const activeNode = useMemo(() => {
    if (!activeNodeId) return null;
    return map.nodes.find(n => n.id === activeNodeId) || null;
  }, [activeNodeId, map.nodes]);

  const proof = useMemo(() => {
    if (!activeNodeId) return null;
    return map.proofs[activeNodeId] || null;
  }, [activeNodeId, map.proofs]);

  // Extract artifactId from node's kernelEvidence if it exists
  const relevantArtifactId = useMemo(() => {
    if (!proof) return null;
    const evidence = proof.externalLean?.kernelEvidence;
    if (!evidence) return null;
    
    // Attempt to extract artifactId from compilerOutput string if not explicitly present
    // Format: "... artifactId ricis-v79-monolith)"
    const match = evidence.compilerOutput.match(/artifactId ([a-zA-Z0-9\-_]+)/);
    return match ? match[1] : null;
  }, [proof]);

  const filteredArtifacts = useMemo(() => {
    if (!findings) return [];
    if (!relevantArtifactId) return findings.artifacts;
    return findings.artifacts.filter(a => a.artifactId === relevantArtifactId);
  }, [findings, relevantArtifactId]);

  const renderOutcomeBadge = (outcome: string) => {
    const isVerified = outcome === 'LEAN_VERIFIED';
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
        isVerified ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950/40 text-rose-400 border border-rose-800/50'
      }`}>
        {isVerified ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
        {outcome}
      </span>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#050505] text-slate-200 overflow-hidden font-sans">
      {/* Header Panel */}
      <div className="shrink-0 px-6 py-4 border-b border-neutral-800 bg-neutral-900/40 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ContentButton 
            onClick={onBackToMap}
            className="p-2 rounded-lg hover:bg-neutral-800 text-slate-400 hover:text-cyan-400 transition-all active:scale-95"
            title="Вернуться к карте"
          >
            <ArrowLeft size={18} />
          </ContentButton>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="text-cyan-400" size={20} />
              Ядровой Лог Верификации
            </h1>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
              Kernel findings registry // artifact-orchestration-v7.9
            </p>
          </div>
        </div>

        {activeNode && (
          <div className="px-3 py-1.5 rounded-lg bg-neutral-800/50 border border-neutral-700/50 flex flex-col items-end">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Контекстный узел</span>
            <span className="text-xs font-semibold text-cyan-300 tabular-nums">{activeNode.id}</span>
          </div>
        )}
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
              <Activity className="animate-pulse text-cyan-500" size={32} />
              <span className="text-xs font-mono tracking-widest uppercase text-slate-500">Загрузка данных ядра…</span>
            </div>
          ) : error ? (
            <div className="p-8 rounded-xl border border-rose-900/30 bg-rose-950/10 text-center">
              <ShieldAlert className="mx-auto text-rose-500 mb-4" size={32} />
              <p className="text-rose-200 font-medium">{error}</p>
              <ContentButton onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-neutral-800 rounded-lg text-xs">
                Повторить попытку
              </ContentButton>
            </div>
          ) : filteredArtifacts.length === 0 ? (
            <div className="text-center py-20 opacity-40">
              <FileText className="mx-auto mb-4" size={48} />
              <p className="text-sm">Артефакты верификации не найдены для данного контекста.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredArtifacts.map((artifact) => (
                <div key={artifact.artifactId} className="group rounded-xl border border-neutral-800 bg-neutral-900/20 hover:bg-neutral-900/40 transition-all overflow-hidden">
                  {/* Artifact Summary Header */}
                  <div className="px-5 py-4 border-b border-neutral-800 flex items-start justify-between bg-neutral-900/30">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-sm font-bold text-white tabular-nums tracking-tight">
                          {artifact.artifactId}
                        </h2>
                        {renderOutcomeBadge(artifact.outcome)}
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                        <span className="flex items-center gap-1">
                          <FileText size={10} /> {artifact.immutableSource}
                        </span>
                        {artifact.sourceSha256 && (
                          <span className="flex items-center gap-1 tabular-nums">
                            <Hash size={10} /> {artifact.sourceSha256.slice(0, 16)}…
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-mono font-bold tabular-nums ${artifact.compilerExit === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        EXIT_{artifact.compilerExit}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">
                        {artifact.theoremCount} теорем
                      </div>
                    </div>
                  </div>

                  {/* Results & Details */}
                  <div className="p-5 space-y-5">
                    {/* Status Line */}
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-black/40 border border-neutral-800/50">
                      <TerminalIcon size={14} className="text-slate-500" />
                      <span className="text-[11px] font-mono text-slate-300 leading-relaxed">
                        {artifact.resultLine}
                      </span>
                    </div>

                    {/* Theorem List */}
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-cyan-400" />
                        Verified Theorems
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {artifact.theorems.map((th, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 rounded-md bg-neutral-800/20 border border-neutral-800/40 hover:border-neutral-700/60 transition-colors">
                            <div className="flex flex-col gap-0.5 overflow-hidden">
                              <span className="text-[11px] font-mono text-slate-300 truncate" title={th.name}>
                                {th.name.split('.').pop()}
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {th.axioms.length > 0 ? (
                                  th.axioms.map(ax => (
                                    <span key={ax} className="text-[8px] px-1 rounded bg-neutral-800 text-slate-500 font-mono">
                                      {ax}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[8px] text-slate-600 font-mono italic">axiom-free</span>
                                )}
                              </div>
                            </div>
                            <span className={`text-[9px] font-mono font-bold tabular-nums shrink-0 ml-2 ${
                              th.status.includes('VERIFIED') ? 'text-emerald-500' : 'text-rose-500'
                            }`}>
                              {th.status === 'LEAN_VERIFIED_AXIOM_FREE' ? 'OK' : 'STD'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Errors if any */}
                    {artifact.compilerErrorCount > 0 && artifact.firstCompilerErrors.length > 0 && (
                      <div className="space-y-2">
                         <h3 className="text-[10px] font-mono uppercase tracking-widest text-rose-500 flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-rose-500" />
                          Compiler Diagnostics
                        </h3>
                        <div className="p-3 rounded-lg bg-rose-950/10 border border-rose-900/20">
                          {artifact.firstCompilerErrors.map((err, idx) => (
                            <pre key={idx} className="text-[10px] font-mono text-rose-300 whitespace-pre-wrap break-all leading-relaxed">
                              {err}
                            </pre>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Footer / Stats */}
      <div className="shrink-0 px-6 py-3 border-t border-neutral-800 bg-neutral-950/50 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <div className="flex items-center gap-4">
          <span>REGISTRY_V{findings?.registryVersion || '?'}</span>
          <span>ARTIFACT_COUNT_{findings?.artifacts.length || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>REALTIME_KERNEL_SYNC_READY</span>
        </div>
      </div>
    </div>
  );
};
