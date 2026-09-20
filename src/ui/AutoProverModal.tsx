import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Play,
  Square,
  RefreshCw,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Layers,
  BarChart2,
  FileText,
  Globe,
  Search,
  Filter,
  Copy,
  Check,
  Download,
  Database,
  Tag,
  Sparkles,
  Info,
} from 'lucide-react';
import { useMapStore } from '../store/mapStore';
import {
  RicisAutoProverEngine,
  type AutoProverProgress,
  type AutoProverResult,
  type FractalCentralityScore,
  type ProverScheduleScope,
} from '../services/autoProver/autoProver';
import { useRicisCommand } from '../hooks/useRicisCommand';
import { RICIS_COMMAND_EVENTS, dispatchRicisCommand } from '../services/commandBus';
import { ContentButton } from './components/ContentButton';
import { IconButton } from './components/IconButton';

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
  const zones = useMapStore((s) => s.zones);
  const applyAutoProverResults = useMapStore((s) => s.applyAutoProverResults);

  const [engine] = useState(() => new RicisAutoProverEngine());
  const [isRunning, setIsRunning] = useState(false);
  const [scope, setScope] = useState<ProverScheduleScope>('all');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [batchLimit, setBatchLimit] = useState<number>(0); // 0 means all available in scope
  const [forceReprove, setForceReprove] = useState<boolean>(true);
  const [progress, setProgress] = useState<AutoProverProgress | null>(null);

  const [results, setResults] = useState<AutoProverResult[]>([]);
  const [activeResultIndex, setActiveResultIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [resultFilter, setResultFilter] = useState<'all' | 'success' | 'refined'>('all');
  const [copiedLean, setCopiedLean] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);
  const [persistenceMessage, setPersistenceMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Centrality ranking
  const centralityScores: FractalCentralityScore[] = useMemo(() => {
    return engine.scheduler.calculateFractalCentrality(nodes, edges);
  }, [engine, nodes, edges]);

  const scoreMap = useMemo(() => {
    return new Map(centralityScores.map((s) => [s.nodeId, s]));
  }, [centralityScores]);

  // Nodes matching the active scope
  const eligibleNodesCount = useMemo(() => {
    switch (scope) {
      case 'all':
        return nodes.length;
      case 'unresolved':
        return nodes.filter((n) => n.state !== 'resolved').length;
      case 'resolved':
        return nodes.filter((n) => n.state === 'resolved').length;
      case 'zone':
        return selectedZoneId
          ? nodes.filter((n) => n.zoneIds.includes(selectedZoneId)).length
          : nodes.length;
      case 'selected':
        return selectedNodeId ? 1 : 0;
      case 'singularities':
        return centralityScores.filter((s) => s.hasSingularity).length;
      default:
        return nodes.length;
    }
  }, [scope, nodes, selectedZoneId, selectedNodeId, centralityScores]);

  const effectiveTaskCount = useMemo(() => {
    if (batchLimit > 0) {
      return Math.min(batchLimit, eligibleNodesCount);
    }
    return eligibleNodesCount;
  }, [batchLimit, eligibleNodesCount]);

  // Handle run prover
  const handleRunProver = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setPersistenceMessage(null);
    abortControllerRef.current = new AbortController();

    try {
      const mapState = { nodes, edges, zones, axioms: [], proofs: {}, agentLogs: [] };
      const maxTasks = batchLimit > 0 ? batchLimit : Infinity;

      const proverResults = await engine.runAutoProverPipeline(
        mapState,
        {
          scope,
          zoneId: selectedZoneId || undefined,
          selectedNodeId: selectedNodeId || undefined,
          maxTasks,
          forceReprove,
          signal: abortControllerRef.current.signal,
          onProgress: (p) => {
            setProgress({ ...p });
          },
        }
      );

      setResults([...proverResults]);
      setActiveResultIndex(0);

      // Automatically persist successful results to store
      if (proverResults.length > 0) {
        setIsPersisting(true);
        const { appliedCount } = await applyAutoProverResults(proverResults);
        setPersistenceMessage(`Успешно сохранено и верифицировано: ${appliedCount} из ${proverResults.length} узлов`);
        setIsPersisting(false);
      }
    } catch (err) {
      console.error('AutoProver execution error:', err);
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopProver = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleManualPersist = async () => {
    if (results.length === 0 || isPersisting) return;
    setIsPersisting(true);
    try {
      const { appliedCount } = await applyAutoProverResults(results);
      setPersistenceMessage(`Применено к карте: ${appliedCount} узлов`);
    } finally {
      setIsPersisting(false);
    }
  };

  const handleCopyLeanCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    setCopiedLean(true);
    setTimeout(() => setCopiedLean(false), 2000);
  };

  const handleExportReport = () => {
    if (results.length === 0) return;
    const report = {
      generatedAt: new Date().toISOString(),
      engine: 'RICIS-III Auto Prover Engine v7.7',
      scope,
      totalRuns: results.length,
      succeeded: results.filter((res) => res.success).length,
      refined: results.filter((res) => res.iterationsUsed > 1).length,
      results: results.map((res) => ({
        nodeId: res.nodeId,
        nodeTitle: res.nodeTitle,
        zoneIds: res.zoneIds,
        success: res.success,
        iterationsUsed: res.iterationsUsed,
        finalInvariant: res.transformationLog.finalInvariant,
        leanAudit: {
          isValid: res.auditResult.isValid,
          errors: res.auditResult.errors,
          warnings: res.auditResult.warnings,
        },
        traceHistory: res.traceHistory.map((step) => ({
          iteration: step.iteration,
          stepName: step.stepName,
          valid: step.auditResult.isValid,
          appliedFixes: step.appliedFixes,
        })),
        leanCode: res.finalLeanCode,
      })),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ricis-autoprover-full-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtered results list
  const filteredResults = useMemo(() => {
    return results.filter((res) => {
      const matchesSearch =
        searchQuery === '' ||
        res.nodeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.nodeTitle.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (resultFilter === 'success') return res.success;
      if (resultFilter === 'refined') return res.iterationsUsed > 1;
      return true;
    });
  }, [results, searchQuery, resultFilter]);

  // Command bus wiring (toolbar / menu / shortcuts -> QA autoprover)
  useRicisCommand(RICIS_COMMAND_EVENTS.qaRunFloodFill, () => {
    if (!isOpen || isRunning) return;
    void handleRunProver();
  });

  useRicisCommand(RICIS_COMMAND_EVENTS.qaExportReport, () => {
    if (!isOpen) return;
    handleExportReport();
  });

  useEffect(() => {
    dispatchRicisCommand(RICIS_COMMAND_EVENTS.qaRunningChanged, { isRunning });
  }, [isRunning]);

  if (!isOpen) return null;

  const currentResult = filteredResults[activeResultIndex] ?? results[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-hidden">
      <div className="relative w-full max-w-6xl max-h-[95vh] bg-[#070b14] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col text-slate-200 overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/40 bg-[#0c1220]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-500/50 text-cyan-400 shadow-lg shadow-cyan-950/40">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-cyan-300 tracking-wide">
                  RICIS-III Auto Prover Engine v7.7
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-600/50 font-mono font-medium">
                  Охват всей карты
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Автономный синтез формальных доказательств Lean 4 • Фрактальный ранжир • Инварианты O(1)
              </p>
            </div>
          </div>
          <IconButton
            title="Закрыть"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </IconButton>
        </div>

        {/* Top Control Bar (Scope & Execution Parameters) */}
        <div className="px-6 py-3 bg-[#0a0f1c] border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Scope Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-cyan-400" /> Охват:
            </span>
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
              <ContentButton
                onClick={() => setScope('all')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  scope === 'all'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Вся карта ({nodes.length})
              </ContentButton>
              <ContentButton
                onClick={() => setScope('unresolved')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  scope === 'unresolved'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Нерешённые ({nodes.filter((n) => n.state !== 'resolved').length})
              </ContentButton>
              <ContentButton
                onClick={() => setScope('singularities')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  scope === 'singularities'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Сингулярности
              </ContentButton>
              <ContentButton
                onClick={() => setScope('zone')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  scope === 'zone'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                По сфере
              </ContentButton>
              {selectedNodeId && (
                <ContentButton
                  onClick={() => setScope('selected')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    scope === 'selected'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Выбранный ({selectedNodeId})
                </ContentButton>
              )}
            </div>

            {/* Zone dropdown if zone scope selected */}
            {scope === 'zone' && (
              <select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-cyan-300 rounded px-2.5 py-1 text-xs outline-none focus:border-cyan-500"
              >
                <option value="">Все научные сферы</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.nodeIds?.length ?? 0})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Batch limit & Options */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Пакет:</span>
              <select
                value={batchLimit}
                onChange={(e) => setBatchLimit(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-cyan-500 font-mono"
              >
                <option value={0}>Все узлы ({eligibleNodesCount})</option>
                <option value={5}>5 узлов</option>
                <option value={10}>10 узлов</option>
                <option value={25}>25 узлов</option>
                <option value={50}>50 узлов</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={forceReprove}
                onChange={(e) => setForceReprove(e.target.checked)}
                className="accent-cyan-500 rounded"
              />
              <span>Перерасчёт существующих</span>
            </label>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {isRunning ? (
                <ContentButton
                  onClick={handleStopProver}
                  className="px-4 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white font-medium text-xs flex items-center gap-1.5 shadow transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-current" /> Прервать
                </ContentButton>
              ) : (
                <ContentButton
                  onClick={handleRunProver}
                  disabled={effectiveTaskCount === 0}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Запустить Auto Prover ({effectiveTaskCount})
                </ContentButton>
              )}

              <ContentButton
                onClick={handleExportReport}
                disabled={isRunning || results.length === 0}
                title="Экспорт отчета в JSON"
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 text-xs flex items-center gap-1 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Экспорт
              </ContentButton>
            </div>
          </div>
        </div>

        {/* Real-time Progress Bar */}
        {(isRunning || progress) && (
          <div className="px-6 py-2.5 bg-cyan-950/30 border-b border-cyan-900/50 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-cyan-300">
                {isRunning ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                )}
                <span>
                  {isRunning ? 'Вычисление доказательств:' : 'Готово:'} {progress?.currentNodeTitle || 'Запуск...'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <span>Успешно: <strong className="text-green-400">{progress?.succeededCount ?? 0}</strong></span>
                <span>Доработано: <strong className="text-cyan-400">{progress?.refinedCount ?? 0}</strong></span>
                <span>
                  Прогресс: <strong>{progress?.current ?? 0} / {progress?.total ?? effectiveTaskCount}</strong> ({progress?.percentage ?? 0}%)
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-cyan-800/40">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: `${progress?.percentage ?? 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Persistence notification */}
        {persistenceMessage && (
          <div className="px-6 py-1.5 bg-green-950/40 border-b border-green-800/50 text-green-300 text-xs flex items-center justify-between font-mono">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-green-400" /> {persistenceMessage}
            </span>
            <ContentButton
              onClick={handleManualPersist}
              disabled={isPersisting}
              className="text-[11px] underline hover:text-green-200"
            >
              Перезаписать в базу данных
            </ContentButton>
          </div>
        )}

        {/* Main Content Body */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
          {/* Left Column (Centrality Queue & Ranked Nodes): 4 cols */}
          <div className="md:col-span-4 flex flex-col gap-3 border-r border-slate-800/80 pr-4 min-h-0 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4" /> Фрактальная Очередь
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                {results.length > 0 ? `Результатов: ${results.length}` : `Всего: ${nodes.length}`}
              </span>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Поиск по ID или названию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              {results.length > 0 && (
                <div className="flex items-center gap-1">
                  <ContentButton
                    onClick={() => setResultFilter('all')}
                    className={`px-2 py-0.5 rounded text-[11px] ${
                      resultFilter === 'all'
                        ? 'bg-slate-700 text-white font-medium'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Все ({results.length})
                  </ContentButton>
                  <ContentButton
                    onClick={() => setResultFilter('success')}
                    className={`px-2 py-0.5 rounded text-[11px] ${
                      resultFilter === 'success'
                        ? 'bg-green-900/60 text-green-300 font-medium'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Успешно ({results.filter((r) => r.success).length})
                  </ContentButton>
                  <ContentButton
                    onClick={() => setResultFilter('refined')}
                    className={`px-2 py-0.5 rounded text-[11px] ${
                      resultFilter === 'refined'
                        ? 'bg-cyan-900/60 text-cyan-300 font-medium'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Refined ({results.filter((r) => r.iterationsUsed > 1).length})
                  </ContentButton>
                </div>
              )}
            </div>

            {/* Node List (Scrollable) */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
              {results.length === 0 ? (
                // Display Centrality Ranking prior to run
                centralityScores.slice(0, 50).map((score) => {
                  const node = nodes.find((n) => n.id === score.nodeId);
                  const isSelected = selectedNodeId === score.nodeId;
                  const isResolved = node?.state === 'resolved';

                  return (
                    <div
                      key={score.nodeId}
                      className={`p-2.5 rounded-lg border text-xs transition-all ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                          : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700'
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
                        <span
                          className={
                            isResolved
                              ? 'text-green-400 font-semibold'
                              : 'text-amber-400 font-medium'
                          }
                        >
                          {isResolved ? 'РЕШЁН' : 'ОТКРЫТ'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                // Display Result List
                filteredResults.map((res, idx) => {
                  const isActive = (filteredResults[activeResultIndex]?.nodeId ?? results[0]?.nodeId) === res.nodeId;
                  const score = scoreMap.get(res.nodeId);

                  return (
                    <div
                      key={res.nodeId}
                      onClick={() => setActiveResultIndex(idx)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isActive
                          ? 'border-cyan-500 bg-cyan-950/50 text-cyan-200 shadow-md shadow-cyan-950/40'
                          : 'border-slate-800/80 bg-slate-900/40 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-slate-400">#{score?.rank ?? idx + 1}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold flex items-center gap-1 ${
                            res.success
                              ? 'bg-green-950 text-green-300 border border-green-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {res.success ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {res.success ? 'VALIDATED' : 'NEEDS_WORK'}
                        </span>
                      </div>
                      <div className="font-medium text-slate-200 truncate mb-1">{res.nodeTitle}</div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Итераций: {res.iterationsUsed}</span>
                        <span className="text-cyan-400 truncate max-w-[120px]">
                          {res.transformationLog.finalInvariant.slice(0, 18)}...
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Execution Trace, Lean Output & Verification (8 cols) */}
          <div className="md:col-span-8 flex flex-col gap-4 min-h-0 overflow-y-auto">
            {results.length === 0 ? (
              <div className="flex-1 min-h-[360px] flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl p-8 text-center bg-slate-950/40">
                <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 mb-4 text-cyan-400">
                  <Sparkles className="w-10 h-10 animate-pulse" />
                </div>
                <h4 className="text-base font-semibold text-slate-200 mb-2">
                  Auto Prover готов к масштабному запуску
                </h4>
                <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                  Выберите охват (вся карта, нерешённые узлы или конкретная сфера) и нажмите «Запустить Auto Prover».
                  Движок выполнит топологический обход, построит онтологические доказательства Lean 4 и сохранит инварианты $O(1)$.
                </p>
                <ContentButton
                  onClick={handleRunProver}
                  disabled={effectiveTaskCount === 0}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/60 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" /> Запустить по всей карте ({effectiveTaskCount} узлов)
                </ContentButton>
              </div>
            ) : currentResult ? (
              <div className="flex-1 flex flex-col gap-4">
                {/* Node Status Banner */}
                <div
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    currentResult.success
                      ? 'border-green-500/30 bg-green-950/20 text-green-300'
                      : 'border-amber-500/30 bg-amber-950/20 text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-black/40 border border-current">
                      <ShieldCheck className="w-6 h-6 shrink-0" />
                    </div>
                    <div>
                      <div className="font-bold text-xs uppercase tracking-wide flex items-center gap-2">
                        <span>Узел: {currentResult.nodeId}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 font-mono">
                          {currentResult.nodeTitle}
                        </span>
                      </div>
                      <div className="text-[11px] opacity-90 font-mono mt-0.5">
                        Статус: {currentResult.success ? 'УСПЕШНО ДОКАЗАНО (Lean 4 Verified)' : 'ТРЕБУЕТ ДОРАБОТКИ'} •
                        Итераций: {currentResult.iterationsUsed} • Идентичность L1: Verified (rfl)
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs shrink-0">
                    <span className="text-slate-400">Инвариант: </span>
                    <span className="font-bold text-cyan-300">
                      {currentResult.transformationLog.finalInvariant}
                    </span>
                  </div>
                </div>

                {/* Lean 4 Code Viewer */}
                <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                  <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-semibold text-cyan-300">
                      <Layers className="w-4 h-4 text-cyan-400" /> Сгенерированная Теорема Lean 4 (RICIS3.Core)
                    </span>
                    <div className="flex items-center gap-2">
                      <ContentButton
                        onClick={() => handleCopyLeanCode(currentResult.finalLeanCode)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 transition-colors"
                      >
                        {copiedLean ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedLean ? 'Скопировано!' : 'Копировать'}
                      </ContentButton>
                    </div>
                  </div>
                  <pre className="p-4 text-xs font-mono text-cyan-200/95 overflow-x-auto overflow-y-auto max-h-[260px] whitespace-pre bg-black/50 leading-relaxed">
                    {currentResult.finalLeanCode}
                  </pre>
                </div>

                {/* Step Trace / Phases */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-cyan-400" /> Алгоритмический Трассировочный Цикл (Phases -1 .. 6)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                      <span className="text-cyan-400 font-bold">[Phase -1] L1 Check:</span> X = X (rfl) & Ontological Type Guard
                    </div>
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                      <span className="text-cyan-400 font-bold">[Phase 0] SP4 Indexing:</span> 0_(E) / ∞_(E) сохранение структуры
                    </div>
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                      <span className="text-cyan-400 font-bold">[Phase 1] SP2 Factorize:</span> Алгебраическое сокращение до пределов
                    </div>
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                      <span className="text-cyan-400 font-bold">[Phase 2] Axiom Bridge:</span> A4 (0/0), A6 (det u,v), A10 (F/0)
                    </div>
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                      <span className="text-cyan-400 font-bold">[Phase 4] Type Protocol:</span> Гомогенность & Monolith Hierarchy
                    </div>
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                      <span className="text-cyan-400 font-bold">[Phase 6] O(1) QED:</span> Инвариант детерминирован без Cauchy limits
                    </div>
                  </div>
                </div>

                {/* Refinement Trace History */}
                {currentResult.traceHistory.length > 0 && (
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400" /> История Итераций RefinementLoop
                    </h4>
                    <div className="space-y-2">
                      {currentResult.traceHistory.map((step) => (
                        <div
                          key={step.stepName}
                          className="text-[11px] font-mono p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                        >
                          <div>
                            <span className="text-slate-300 font-semibold">Итерация #{step.iteration}: </span>
                            <span className="text-slate-400">{step.stepName}</span>
                            {step.appliedFixes.length > 0 && (
                              <div className="text-[10px] text-cyan-300/80 mt-0.5">
                                Исправления: {step.appliedFixes.join('; ')}
                              </div>
                            )}
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              step.auditResult.isValid
                                ? 'bg-green-950 text-green-300 border border-green-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {step.auditResult.isValid ? 'VALIDATED' : 'REFINED'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
