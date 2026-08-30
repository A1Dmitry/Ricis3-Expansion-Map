import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  Bug,
  AlertTriangle,
  CheckCircle2,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Search,
  Sliders,
  Activity,
  Cpu,
  Compass,
  X,
  FileText,
  Eye,
} from 'lucide-react';
import type { ProblemNode, Proof } from '../../../model/types';
import type {
  BugSeverity,
  BugCategory,
  IBugReport,
  ICrawlerSessionState,
} from '../../../model/crawlerTesting.contracts';
import { FloodFillCrawlerService } from '../../../services/testing/floodFillCrawlerService';

export interface AutomatedTestingModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: ProblemNode[];
  selectedNodeId?: string | null;
  proofs?: Record<string, Proof>;
  onSelectNode?: (nodeId: string) => void;
  onNavigateToKinematics?: () => void;
}

export const AutomatedTestingModal: React.FC<AutomatedTestingModalProps> = ({
  isOpen,
  onClose,
  nodes,
  selectedNodeId,
  proofs = {},
  onSelectNode,
  onNavigateToKinematics,
}) => {
  const crawlerRef = useRef<FloodFillCrawlerService>(new FloodFillCrawlerService());
  const [sessionState, setSessionState] = useState<ICrawlerSessionState>(() =>
    crawlerRef.current.getState()
  );

  const [isRunning, setIsRunning] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBugIds, setExpandedBugIds] = useState<Set<string>>(new Set());
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Configuration state
  const [maxDepth, setMaxDepth] = useState(30);
  const [verifyLatex, setVerifyLatex] = useState(true);
  const [runManipulatorStress, setRunManipulatorStress] = useState(true);
  const [manipulatorIterations, setManipulatorIterations] = useState(10);
  const [stepDelay, setStepDelay] = useState(30);

  const proofMap = useMemo(() => {
    const map = new Map<string, Proof>();
    for (const [id, p] of Object.entries(proofs)) {
      map.set(id, p);
    }
    return map;
  }, [proofs]);

  const toggleBugExpand = (id: string) => {
    setExpandedBugIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStart = useCallback(() => {
    const startNode = selectedNodeId || nodes[0]?.id || '';
    crawlerRef.current.startSession(
      startNode,
      nodes,
      {
        maxGraphDepth: maxDepth,
        verifyLatexRendering: verifyLatex,
        runManipulatorStressTest: runManipulatorStress,
        manipulatorStressIterations: manipulatorIterations,
        crawlDelayMs: stepDelay,
      },
      proofMap
    );
    setSessionState(crawlerRef.current.getState());
    setIsRunning(true);
  }, [selectedNodeId, nodes, maxDepth, verifyLatex, runManipulatorStress, manipulatorIterations, stepDelay, proofMap]);

  const handlePause = () => {
    crawlerRef.current.pauseSession();
    setSessionState(crawlerRef.current.getState());
    setIsRunning(false);
  };

  const handleResume = () => {
    crawlerRef.current.resumeSession();
    setSessionState(crawlerRef.current.getState());
    setIsRunning(true);
  };

  const handleStop = () => {
    crawlerRef.current.stopSession();
    setSessionState(crawlerRef.current.getState());
    setIsRunning(false);
  };

  const handleClear = () => {
    crawlerRef.current.clearBugs();
    setSessionState(crawlerRef.current.getState());
  };

  // Automated step loop
  useEffect(() => {
    if (!isRunning || !isOpen) return;

    let timeoutId: NodeJS.Timeout | null = null;

    const executeStep = async () => {
      const nextState = await crawlerRef.current.stepOnce();
      setSessionState(nextState);

      if (nextState.phase === 'COMPLETED' || nextState.phase === 'PAUSED' || nextState.phase === 'IDLE') {
        setIsRunning(false);
      } else {
        timeoutId = setTimeout(executeStep, Math.max(10, stepDelay));
      }
    };

    timeoutId = setTimeout(executeStep, stepDelay);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isRunning, isOpen, stepDelay]);

  // Copy to clipboard helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(label);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  const handleDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtered bug list
  const filteredBugs = useMemo(() => {
    return sessionState.bugReports.filter((bug) => {
      if (selectedSeverity !== 'ALL' && bug.severity !== selectedSeverity) return false;
      if (selectedCategory !== 'ALL' && bug.category !== selectedCategory) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = bug.title.toLowerCase().includes(q);
        const matchesDesc = bug.description.toLowerCase().includes(q);
        const matchesTarget = bug.targetComponentOrNodeId.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesTarget) return false;
      }
      return true;
    });
  }, [sessionState.bugReports, selectedSeverity, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const { metrics, phase, currentNodeId, currentKinematicTestName } = sessionState;
  const progressPercent =
    metrics.totalNodesDiscovered > 0
      ? Math.min(100, Math.round((metrics.visitedNodesCount / Math.min(nodes.length, maxDepth)) * 100))
      : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b0f17] border border-cyan-500/30 rounded-xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#0e1422] border-b border-cyan-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-400/40 text-cyan-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-cyan-300">
                  Flood-Fill Тестирование & Инспекция Приложения
                </h2>
                <span className="px-2 py-0.5 text-xs font-mono rounded bg-cyan-950 border border-cyan-500/30 text-cyan-400">
                  v7.7 QA-Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Автоматический обход графа затоплением, аудит UI/UX, стресс-тестирование манипулятора на сингулярностях
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Config */}
        <div className="p-4 bg-[#080d15] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {!isRunning ? (
              <button
                onClick={phase === 'PAUSED' ? handleResume : handleStart}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition-all shadow-lg shadow-cyan-950/40"
              >
                <Play className="w-4 h-4 fill-white" />
                {phase === 'PAUSED' ? 'Продолжить' : 'Запустить обход'}
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm transition-all"
              >
                <Pause className="w-4 h-4 fill-white" />
                Пауза
              </button>
            )}

            {isRunning && (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-900/60 hover:bg-red-800 border border-red-500/40 text-red-200 text-sm transition-colors"
              >
                <Square className="w-4 h-4 fill-current" />
                Стоп
              </button>
            )}

            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
              title="Очистить баги"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Сброс
            </button>

            {onNavigateToKinematics && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToKinematics();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 text-sm transition-colors"
              >
                <Cpu className="w-4 h-4 text-indigo-400" />
                3D Кинематика
              </button>
            )}
          </div>

          {/* Configuration inline toggles */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200">
              <input
                type="checkbox"
                checked={verifyLatex}
                onChange={(e) => setVerifyLatex(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
              />
              Проверять формулы
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200">
              <input
                type="checkbox"
                checked={runManipulatorStress}
                onChange={(e) => setRunManipulatorStress(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
              />
              Стресс манипулятора
            </label>
            <div className="flex items-center gap-1.5">
              <span>Глубина:</span>
              <select
                value={maxDepth}
                onChange={(e) => setMaxDepth(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none"
              >
                <option value={10}>10 узлов</option>
                <option value={20}>20 узлов</option>
                <option value={35}>Все узлы (35+)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Metrics & Progress Radar */}
        <div className="p-4 bg-[#0a0f1a] border-b border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Status */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Статус фазы</span>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isRunning
                    ? 'bg-emerald-400 animate-ping'
                    : phase === 'COMPLETED'
                    ? 'bg-cyan-400'
                    : phase === 'PAUSED'
                    ? 'bg-amber-400'
                    : 'bg-slate-600'
                }`}
              />
              <span className="text-xs font-mono font-bold text-slate-200">
                {phase === 'FLOOD_FILL_GRAPH_CRAWL'
                  ? 'Краулинг графа'
                  : phase === 'MANIPULATOR_STRESS_RIG'
                  ? 'Стресс-тест 3D'
                  : phase === 'COMPLETED'
                  ? 'Завершено'
                  : phase === 'PAUSED'
                  ? 'Пауза'
                  : 'Готов'}
              </span>
            </div>
          </div>

          {/* Visited nodes */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Охвачено узлов</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-lg font-bold font-mono text-cyan-400">{metrics.visitedNodesCount}</span>
              <span className="text-xs text-slate-500 font-mono">/ {Math.min(nodes.length, maxDepth)}</span>
            </div>
          </div>

          {/* Kinematic tests */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">3D Векторов</span>
            <div className="mt-1">
              <span className="text-lg font-bold font-mono text-indigo-400">{metrics.kinematicVectorsTestedCount}</span>
            </div>
          </div>

          {/* Critical bugs */}
          <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/20 flex flex-col justify-between">
            <span className="text-[11px] text-red-300 uppercase tracking-wider font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-red-400" /> Критические
            </span>
            <div className="mt-1">
              <span className="text-lg font-bold font-mono text-red-400">{metrics.criticalBugsCount}</span>
            </div>
          </div>

          {/* Warnings */}
          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/20 flex flex-col justify-between">
            <span className="text-[11px] text-amber-300 uppercase tracking-wider font-semibold">Предупреждения</span>
            <div className="mt-1">
              <span className="text-lg font-bold font-mono text-amber-400">{metrics.warningBugsCount}</span>
            </div>
          </div>

          {/* Ergonomics & A11y */}
          <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/20 flex flex-col justify-between">
            <span className="text-[11px] text-cyan-300 uppercase tracking-wider font-semibold">UI / a11y</span>
            <div className="mt-1">
              <span className="text-lg font-bold font-mono text-cyan-400">{metrics.ergonomicsBugsCount}</span>
            </div>
          </div>
        </div>

        {/* Live Target Banner */}
        {(currentNodeId || currentKinematicTestName) && (
          <div className="px-4 py-2 bg-cyan-950/40 border-b border-cyan-500/20 flex items-center justify-between text-xs font-mono text-cyan-300">
            <div className="flex items-center gap-2 truncate">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>
                {currentNodeId ? `Инспекция узла: [${currentNodeId}]` : `Стресс-нагрузка: ${currentKinematicTestName}`}
              </span>
            </div>
            <div className="w-32 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-cyan-400 h-full transition-all duration-200" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        )}

        {/* Filters & Export Bar */}
        <div className="p-3 bg-[#080d15] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск по багам..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-40 sm:w-56"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="ALL">Все уровни ({sessionState.bugReports.length})</option>
              <option value="CRITICAL">🚨 Только критические ({metrics.criticalBugsCount})</option>
              <option value="WARNING">⚠️ Предупреждения ({metrics.warningBugsCount})</option>
              <option value="ERGONOMICS">🎨 UI / a11y ({metrics.ergonomicsBugsCount})</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none hidden sm:block"
            >
              <option value="ALL">Все категории</option>
              <option value="GRAPH_STRUCTURE">Связи графа</option>
              <option value="FORMULA_RENDER">Формулы LaTeX</option>
              <option value="PROOF_INTEGRITY">Доказательства Lean</option>
              <option value="KINEMATICS_ANOMALY">3D Кинематика</option>
              <option value="UI_ACCESSIBILITY">Доступность UI</option>
            </select>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const md = crawlerRef.current.exportReportsAsMarkdown();
                handleCopy(md, 'Markdown скопирован в буфер!');
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
              title="Скопировать отчёт в Markdown"
            >
              {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedNotification || 'Копия MD'}
            </button>

            <button
              onClick={() => {
                const json = crawlerRef.current.exportReportsAsJson();
                handleDownload(json, `ricis-bug-report-${Date.now()}.json`, 'application/json');
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
              title="Скачать JSON"
            >
              <Download className="w-3.5 h-3.5" />
              JSON
            </button>

            <button
              onClick={() => {
                const md = crawlerRef.current.exportReportsAsMarkdown();
                handleDownload(md, `ricis-bug-report-${Date.now()}.md`, 'text/markdown');
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
              title="Скачать Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              MD
            </button>
          </div>
        </div>

        {/* Bug Reports List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredBugs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 font-mono text-sm flex flex-col items-center justify-center gap-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mb-1" />
              <span>
                {sessionState.bugReports.length === 0
                  ? phase === 'COMPLETED'
                    ? '🎉 Все узлы и кинематика прошли аудит успешно! Дефектов не обнаружено.'
                    : 'Нажмите «Запустить обход», чтобы начать сквозное тестирование приложения'
                  : 'Нет багов, соответствующих выбранному фильтру'}
              </span>
            </div>
          ) : (
            filteredBugs.map((bug) => {
              const isExpanded = expandedBugIds.has(bug.id);
              const isCritical = bug.severity === 'CRITICAL';
              const isWarning = bug.severity === 'WARNING';

              return (
                <div
                  key={bug.id}
                  className={`rounded-xl border transition-all ${
                    isCritical
                      ? 'bg-red-950/20 border-red-500/30'
                      : isWarning
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div
                    onClick={() => toggleBugExpand(bug.id)}
                    className="p-3 sm:p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-white/[0.02]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-slate-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              isCritical
                                ? 'bg-red-950 text-red-300 border border-red-500/40'
                                : isWarning
                                ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                            }`}
                          >
                            {bug.severity}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                            {bug.category}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            Цель: <strong className="text-slate-200">{bug.targetComponentOrNodeId}</strong>
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-100 mt-1">{bug.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{bug.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {onSelectNode && bug.targetComponentOrNodeId && nodes.some((n) => n.id === bug.targetComponentOrNodeId) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectNode(bug.targetComponentOrNodeId);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-1"
                          title="Показать узел на 3D карте"
                        >
                          <Eye className="w-3 h-3" />
                          Узел
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-800/60 bg-black/20 text-xs space-y-3 font-mono">
                      <div>
                        <span className="text-slate-500 uppercase tracking-wider font-semibold">Описание:</span>
                        <p className="text-slate-300 font-sans mt-0.5">{bug.description}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-500/20">
                          <span className="text-emerald-400 font-semibold">Ожидаемое поведение:</span>
                          <p className="text-slate-300 font-sans mt-0.5">{bug.expectedBehavior}</p>
                        </div>
                        <div className="p-2.5 rounded bg-red-950/20 border border-red-500/20">
                          <span className="text-red-400 font-semibold">Фактическое поведение:</span>
                          <p className="text-slate-300 font-sans mt-0.5">{bug.actualBehavior}</p>
                        </div>
                      </div>

                      {bug.reproductionSteps && bug.reproductionSteps.length > 0 && (
                        <div>
                          <span className="text-slate-500 uppercase tracking-wider font-semibold">Шаги воспроизведения:</span>
                          <ol className="list-decimal list-inside text-slate-300 font-sans mt-1 space-y-0.5">
                            {bug.reproductionSteps.map((step, sIdx) => (
                              <li key={sIdx}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {bug.telemetryData && Object.keys(bug.telemetryData).length > 0 && (
                        <div>
                          <span className="text-slate-500 uppercase tracking-wider font-semibold">Телеметрия:</span>
                          <pre className="mt-1 p-2 rounded bg-black/60 text-[11px] text-cyan-300 overflow-x-auto">
                            {JSON.stringify(bug.telemetryData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#0e1422] border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>Режим RICIS-III Flood-Fill Crawler & Stress Telemetry</span>
          <span>Всего багов: {sessionState.bugReports.length}</span>
        </div>
      </div>
    </div>
  );
};
