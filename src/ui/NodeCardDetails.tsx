import React, { useState, useEffect } from 'react';
import type { ProblemNode } from '../model/types';
import { isMissingTargetFunction, nodeHasSorry } from '../model/audit';
import { getUnlockedTargets, getUnlockRequirements } from '../model/access';
import { ChevronDown, ChevronUp, ArrowLeft, ExternalLink, ShieldCheck, Sparkles, Lock, Unlock, BookOpen, DollarSign, Terminal, CheckCircle2, Share2, Check } from 'lucide-react';
import { LatexRenderer } from './LatexRenderer';
import { ExecutionTraceViewer } from './ExecutionTraceViewer';
import type { ITransformationLogDTO } from '../model/traceVisualizer.types';
import { getRicisCoreEngine } from '../services/ricisCore';
import { UrlShareService } from '../services/UrlShareService';

/** Normalize URL: add https:// if scheme is missing (www. or domain-like). */
function normalizeUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (/^https?:\/\//i.test(t)) return t;
  if (/^(www\.|[a-z0-9-]+\.[a-z]{2,})/i.test(t)) return 'https://' + t;
  return t;
}

/** Render free text with clickable http(s) / www links. */
export function renderTextWithLinks(text: string) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (/^(https?:\/\/|www\.)/i.test(part)) {
      const cleaned = part.replace(/[)\],.;:!?]+$/g, '');
      const trailing = part.slice(cleaned.length);
      const href = normalizeUrl(cleaned);
      return (
        <span key={i}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 hover:underline break-all"
            onClick={e => e.stopPropagation()}
          >
            {cleaned}
          </a>
          {trailing}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function extractSourceUrl(text?: string): string | null {
  if (!text) return null;
  const m = text.match(/https?:\/\/[^\s<>"']+|www\.[^\s<>"']+/i);
  if (!m) return null;
  return m[0].replace(/[)\],.;:!?]+$/g, '');
}

function formatCurrency(val?: number) {
  if (val === undefined || val === null) return '';
  if (val >= 1e9) return '$' + (val / 1e9).toFixed(1) + 'B';
  if (val >= 1e6) return '$' + (val / 1e6).toFixed(1) + 'M';
  return '$' + val.toLocaleString();
}

const TYPE_LABELS: Record<string, string> = {
  core_singularity: 'Ядро / сингулярность',
  derived_problem: 'Производная задача',
  scientific_task: 'Научная задача',
  derivative_claim: 'Производная / аудит приоритета',
};

type Props = {
  node: ProblemNode;
  map?: {
    nodes: ProblemNode[];
    edges?: Array<{ source?: string; target?: string; fromId?: string; toId?: string }>;
    proofs?: Record<string, any>;
  };
  isExpanded: boolean;
  onEdit?: () => void;
  onNavigateToNode?: (targetId: string) => void;
  onNavigateBack?: () => void;
  previousNodeTitle?: string | null;
};

export function getReferencesForNode(node: ProblemNode) {
  const cleanTitle = node.title
    .replace(/\(RICIS.*?\)/gi, '')
    .replace(/\(Деление.*?\)/gi, '')
    .trim();

  const fromFields =
    node.sourceUrl ||
    extractSourceUrl(node.description) ||
    extractSourceUrl(node.singularityHint) ||
    null;

  const directUrl = fromFields ? normalizeUrl(fromFields) : null;

  const wikiUrl = `https://ru.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(cleanTitle)}`;
  const articleUrl = directUrl
    ? directUrl
    : `https://scholar.google.com/scholar?q=${encodeURIComponent(cleanTitle)}`;

  let doiUrl = 'https://doi.org/10.5281/zenodo.17872755';
  let doiLabel = '10.5281/zenodo.17872755 (RICIS-III Core)';

  const tLower = (node.title + ' ' + node.id + ' ' + (node.description || '')).toLowerCase();
  if (tLower.includes('войнич') || tLower.includes('voynich')) {
    doiUrl = 'https://doi.org/10.5281/zenodo.18116204';
    doiLabel = '10.5281/zenodo.18116204 (Voynich MS)';
  } else if (tLower.includes('gradient') || tLower.includes('градиент') || tLower.includes('llm') || tLower.includes('обучение')) {
    doiUrl = 'https://doi.org/10.5281/zenodo.21309650';
    doiLabel = '10.5281/zenodo.21309650 (LLM Gradient / Deep Learning)';
  } else if (tLower.includes('p vs np') || tLower.includes('mersenne') || tLower.includes('факторизац') || tLower.includes('rsa') || tLower.includes('коммивояж') || tLower.includes('изоморфизм') || tLower.includes('сетев')) {
    doiUrl = 'https://doi.org/10.5281/zenodo.21827360';
    doiLabel = '10.5281/zenodo.21827360 (Mersenne Networks & NP)';
  } else if (tLower.includes('lean') || tLower.includes('доказательств') || tLower.includes('верификац')) {
    doiUrl = 'https://doi.org/10.5281/zenodo.21836220';
    doiLabel = '10.5281/zenodo.21836220 (Lean 4 Specs)';
  }

  return {
    directUrl,
    directDisplay: fromFields,
    wikiUrl,
    doiUrl,
    doiLabel,
    articleUrl,
    cleanTitle,
  };
}

/**
 * Modern Accordion-based Node Card Details.
 */
export const NodeCardDetails: React.FC<Props> = ({
  node,
  map,
  isExpanded,
  onEdit,
  onNavigateToNode,
  onNavigateBack,
  previousNodeTitle,
}) => {
  const refs = getReferencesForNode(node);

  // Стейт раскрытия секций аккордеона
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    target: true,
    forward: true,
    prereqs: false,
    verification: true,
    trace: false,
    sources: false,
    economics: false,
    provenance: true,
  });

  const [traceLog, setTraceLog] = useState<ITransformationLogDTO | null>(null);
  const [isTracing, setIsTracing] = useState(false);

  useEffect(() => {
    if (openSections['trace'] && (node.state === 'resolved' || node.state === 'partial') && !isMissingTargetFunction(node)) {
      runTrace();
    }
  }, [node.id, openSections['trace']]);

  const runTrace = async () => {
    setIsTracing(true);
    try {
      const engine = getRicisCoreEngine();
      const res = await engine.evaluate({ expression: node.targetFunction || '', contextProblemId: node.id });
      if (res && res.trace && res.trace.length > 0) {
        setTraceLog({
          evaluationId: Date.now().toString(),
          targetExpression: node.targetFunction || '',
          finalInvariant: res.invariant,
          isSingular: res.isSingular,
          semanticIndex: res.semanticIndex,
          steps: res.trace.map(t => ({
            title: t.title,
            inputState: t.inputState,
            outputState: t.outputState,
            appliedAxiom: t.appliedAxiom,
            complexity: t.complexity,
            phaseIdentifier: 2,
            phaseBadgeLabel: t.phase,
            isAxiomApplied: !!t.appliedAxiom,
            requiresL1Verification: true
          }))
        });
      } else {
        setTraceLog(null);
      }
    } catch (e) {
      console.error(e);
      setTraceLog(null);
    } finally {
      setIsTracing(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Вычисляем прямые разблокировки и предпосылки
  const unlockedReport = map ? getUnlockedTargets(node, map) : { immediateUnlockTargets: [], allDependentTargets: [] };
  const unlockRequirements = map ? getUnlockRequirements(node, map as any) : [];

  const [copiedLink, setCopiedLink] = useState(false);

  const handleShareNode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await UrlShareService.copyShareUrlToClipboard({ nodeId: node.id });
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className={`space-y-2.5 ${isExpanded ? 'text-[12px]' : 'text-[11px]'}`}>
      {/* Кнопка навигации назад, если пользователь перешел по ссылке */}
      {onNavigateBack && previousNodeTitle && (
        <button
          type="button"
          onClick={onNavigateBack}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-md bg-cyan-950/40 border border-cyan-700/60 hover:bg-cyan-900/60 hover:border-cyan-400 text-cyan-300 text-[10px] font-bold transition-all cursor-pointer group shadow-sm"
        >
          <span className="flex items-center gap-1.5">
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Назад:</span>
            <span className="text-white truncate max-w-[240px] font-medium">{previousNodeTitle}</span>
          </span>
          <span className="text-[9px] uppercase tracking-wider text-cyan-400/80 font-mono">История</span>
        </button>
      )}

      {/* 1. СЕКЦИЯ АККОРДЕОНА: ЦЕЛЕВАЯ ФУНКЦИЯ И СИНГУЛЯРНОСТЬ */}
      <div className="border border-neutral-800/80 rounded-xl overflow-hidden bg-[#0d1117] flex flex-col">
        <div className="flex flex-col border-b border-neutral-800/50">
        <div
          onClick={() => toggleSection('target')}
          className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 bg-[#0d1117] hover:bg-neutral-900 text-left cursor-pointer transition-colors"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Terminal size={13} />
            Целевая функция и сингулярность
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareNode}
              className="text-[9px] font-bold text-slate-300 hover:text-white bg-neutral-900 border border-neutral-700 hover:border-cyan-600 px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer"
              title="Скопировать ссылку на эту задачу"
            >
              {copiedLink ? (
                <>
                  <Check size={11} className="text-emerald-400" />
                  <span className="text-emerald-400">Скопировано</span>
                </>
              ) : (
                <>
                  <Share2 size={11} className="text-cyan-400" />
                  <span>Поделиться</span>
                </>
              )}
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="text-[9px] font-bold text-cyan-400 hover:text-cyan-200 bg-cyan-950/70 border border-cyan-800/70 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1"
                title="Редактировать параметры задачи"
              >
                <span>✏️</span> Правка
              </button>
            )}
            {openSections['target'] ? <ChevronUp size={14} className="text-neutral-400" /> : <ChevronDown size={14} className="text-neutral-400" />}
          </div>
        </div>

        {openSections['target'] && (
          <div className="p-3 space-y-2.5">
            <div>
              <p className="text-[9px] font-bold uppercase text-gray-500 tracking-wider mb-1">
                Целевое аналитическое выражение
              </p>
              <div className="p-4 break-all whitespace-pre-wrap bg-neutral-900/50 rounded-lg">
                <LatexRenderer content={`\`${node.targetFunction || '—'}\``} className="text-sm font-mono text-cyan-200" />
              </div>
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase text-gray-500 tracking-wider mb-1">
                Описание задачи
              </p>
              <div className={`text-gray-300 leading-relaxed whitespace-pre-wrap ${!isExpanded ? 'line-clamp-4' : ''}`}>
                <LatexRenderer content={node.description || '—'} className="text-[11px]" />
              </div>
            </div>

            {node.singularityHint && (
              <div className="p-2.5 bg-purple-950/20 border border-purple-900/40 rounded-md">
                <p className="text-[9px] font-bold uppercase text-purple-400 tracking-wider mb-0.5">
                  Подсказка о сингулярности
                </p>
                <div className="text-purple-100/90 leading-relaxed text-[10.5px]">
                  <LatexRenderer content={node.singularityHint} className="text-[10.5px]" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. СЕКЦИЯ АККОРДЕОНА: РАЗБЛОКИРУЕТ СЛЕДУЮЩИЕ ЗАДАЧИ */}
      {unlockedReport.allDependentTargets.length > 0 && (
        <div className="flex flex-col border-b border-neutral-800/50">
          <button
            type="button"
            onClick={() => toggleSection('forward')}
            className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 bg-[#0d1117] hover:bg-neutral-900 text-left cursor-pointer transition-colors"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Unlock size={13} />
              Разблокирует задачи ({unlockedReport.allDependentTargets.length})
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-mono">
                +{unlockedReport.allDependentTargets.length} нод
              </span>
              {openSections['forward'] ? <ChevronUp size={14} className="text-emerald-400" /> : <ChevronDown size={14} className="text-emerald-400" />}
            </div>
          </button>

          {openSections['forward'] && (
            <div className="p-3 space-y-2">
              <p className="text-[9px] text-emerald-300/80 leading-tight">
                Решение этой сингулярности открывает или продвигает следующие проблемы графа:
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {unlockedReport.allDependentTargets.map(targetNode => {
                  const isImmediate = unlockedReport.immediateUnlockTargets.some(t => t.id === targetNode.id);
                  return (
                    <div
                      key={targetNode.id}
                      className="flex items-center justify-between p-1.5 rounded bg-black/60 border border-emerald-900/40 hover:border-emerald-500/60 transition-colors group"
                    >
                      <button
                        type="button"
                        onClick={() => onNavigateToNode?.(targetNode.id)}
                        className="text-left font-medium text-slate-200 group-hover:text-emerald-300 transition-colors text-[10.5px] truncate max-w-[250px] cursor-pointer"
                        title={targetNode.title}
                      >
                        {targetNode.title}
                      </button>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isImmediate ? (
                          <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-600/70">
                            Откроется сразу
                          </span>
                        ) : (
                          <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-neutral-900 text-slate-400 border border-neutral-700">
                            Каскад
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onNavigateToNode?.(targetNode.id)}
                          className="text-emerald-400 hover:text-white text-xs px-1 cursor-pointer"
                          title="Перейти к узлу"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. СЕКЦИЯ АККОРДЕОНА: ТРЕБУЕМЫЕ ПРЕДПОСЫЛКИ (ПРЕРЕКВИЗИТЫ) */}
      {unlockRequirements.length > 0 && node.state !== 'resolved' && (
        <div className="flex flex-col border-b border-neutral-800/50">
          <button
            type="button"
            onClick={() => toggleSection('prereqs')}
            className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 bg-[#0d1117] hover:bg-neutral-900 text-left cursor-pointer transition-colors"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Lock size={13} />
              Требуется решить сначала ({unlockRequirements.length})
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-950 border border-amber-700/60 text-amber-300 font-mono">
                {unlockRequirements.length} задач
              </span>
              {openSections['prereqs'] ? <ChevronUp size={14} className="text-amber-400" /> : <ChevronDown size={14} className="text-amber-400" />}
            </div>
          </button>

          {openSections['prereqs'] && (
            <div className="p-3 space-y-1.5 max-h-40 overflow-y-auto">
              {unlockRequirements.map(reqNode => (
                <div
                  key={reqNode.id}
                  className="flex items-center justify-between p-1.5 rounded bg-black/60 border border-amber-900/40 hover:border-amber-500/60 transition-colors group"
                >
                  <button
                    type="button"
                    onClick={() => onNavigateToNode?.(reqNode.id)}
                    className="text-left font-medium text-slate-200 group-hover:text-amber-300 transition-colors text-[10.5px] truncate max-w-[250px] cursor-pointer"
                    title={reqNode.title}
                  >
                    {reqNode.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateToNode?.(reqNode.id)}
                    className="text-amber-400 hover:text-white text-xs px-1 cursor-pointer"
                    title="Перейти к узлу"
                  >
                    →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. СЕКЦИЯ АККОРДЕОНА: ФОРМАЛЬНАЯ ВЕРИФИКАЦИЯ (LEAN 4 / RICIS) */}
        <div className="flex flex-col border-b border-neutral-800/50">
        <button
          type="button"
          onClick={() => toggleSection('verification')}
          className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 bg-[#0d1117] hover:bg-neutral-900 text-left cursor-pointer transition-colors"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <ShieldCheck size={13} />
            Формальная верификация Lean 4
          </span>
          <div className="flex items-center gap-2">
            {(() => {
              const hasSorry = nodeHasSorry(node);
              const isMissingTf = isMissingTargetFunction(node);
              if (node.state === 'resolved' && !isMissingTf && !hasSorry) {
                return (
                  <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-700/60">
                    QED Verified
                  </span>
                );
              }
              if (node.state === 'partial' || isMissingTf || hasSorry) {
                return (
                  <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-yellow-950/90 text-yellow-300 border border-yellow-700/60">
                    {hasSorry ? 'Sorry Stub' : 'Partial'}
                  </span>
                );
              }
              return (
                <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-neutral-900 text-slate-400 border border-neutral-700">
                  Unresolved
                </span>
              );
            })()}
            {openSections['verification'] ? <ChevronUp size={14} className="text-neutral-400" /> : <ChevronDown size={14} className="text-neutral-400" />}
          </div>
        </button>

        {openSections['verification'] && (
          <div className="p-3 space-y-2">
            {((node.leanErrors && node.leanErrors.length > 0) || (node.leanWarnings && node.leanWarnings.length > 0)) ? (
              <div className="space-y-2">
                {node.leanErrors && node.leanErrors.length > 0 && (
                  <div className="p-2 bg-red-950/40 border border-red-900/60 rounded">
                    <span className="text-[8px] font-bold text-red-400 uppercase tracking-wider block mb-1">Ошибки (Errors):</span>
                    <ul className="list-disc list-inside text-red-200 text-[10px] space-y-0.5">
                      {node.leanErrors.map((err, idx) => (
                        <li key={idx} className="break-words">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {node.leanWarnings && node.leanWarnings.length > 0 && (
                  <div className="p-2 bg-amber-950/30 border border-amber-900/50 rounded">
                    <span className="text-[8px] font-bold text-amber-400 uppercase tracking-wider block mb-1">Предупреждения (Warnings):</span>
                    <ul className="list-disc list-inside text-amber-200 text-[10px] space-y-0.5">
                      {node.leanWarnings.map((warn, idx) => (
                        <li key={idx} className="break-words">{warn}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2 bg-emerald-950/20 border border-emerald-900/40 rounded flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span className="text-[10px] text-emerald-400 font-sans">Ошибок верификации не найдено.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4.5. СЕКЦИЯ АККОРДЕОНА: ТРАССИРОВКА RICIS-III */}
        <div className="flex flex-col border-b border-neutral-800/50">
        <button
          type="button"
          onClick={() => toggleSection('trace')}
          className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 bg-[#0d1117] hover:bg-neutral-900 text-left cursor-pointer transition-colors"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
            <Terminal size={13} />
            Трассировка RICIS-III (L1_IDENTITY)
          </span>
          <div className="flex items-center gap-2">
            {openSections['trace'] ? <ChevronUp size={14} className="text-neutral-400" /> : <ChevronDown size={14} className="text-neutral-400" />}
          </div>
        </button>

        {openSections['trace'] && (
          <div className="p-3">
            <ExecutionTraceViewer 
              nodeId={node.id} 
              logData={traceLog} 
              isLoading={isTracing} 
              onRerunTrace={runTrace} 
            />
          </div>
        )}
      </div>

      {/* 5. СЕКЦИЯ АККОРДЕОНА: ПЕРВОИСТОЧНИКИ, СТАТЬИ И DOI */}
        <div className="flex flex-col border-b border-neutral-800/50">
        <button
          type="button"
          onClick={() => toggleSection('sources')}
          className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 bg-[#0d1117] hover:bg-neutral-900 text-left cursor-pointer transition-colors"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
            <BookOpen size={13} />
            Первоисточники и публикации
          </span>
          <div className="flex items-center gap-2">
            {openSections['sources'] ? <ChevronUp size={14} className="text-neutral-400" /> : <ChevronDown size={14} className="text-neutral-400" />}
          </div>
        </button>

        {openSections['sources'] && (
          <div className="p-3 space-y-2 text-[11px]">
            <a
              href={refs.articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2 rounded bg-black/60 border border-neutral-800 hover:border-cyan-700 transition-colors group"
            >
              <div className="truncate pr-2">
                <span className="text-cyan-400 font-bold block text-[9px] uppercase">Научная публикация</span>
                <span className="text-slate-300 group-hover:text-cyan-200 text-[10px] truncate block">
                  {refs.directUrl ? refs.directDisplay : `Google Scholar: ${refs.cleanTitle}`}
                </span>
              </div>
              <ExternalLink size={12} className="text-neutral-500 group-hover:text-cyan-400 shrink-0" />
            </a>

            <a
              href={refs.wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2 rounded bg-black/60 border border-neutral-800 hover:border-sky-700 transition-colors group"
            >
              <div className="truncate pr-2">
                <span className="text-sky-400 font-bold block text-[9px] uppercase">Википедия</span>
                <span className="text-slate-300 group-hover:text-sky-200 text-[10px] truncate block">
                  {refs.cleanTitle}
                </span>
              </div>
              <ExternalLink size={12} className="text-neutral-500 group-hover:text-sky-400 shrink-0" />
            </a>

            <a
              href={refs.doiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2 rounded bg-black/60 border border-neutral-800 hover:border-purple-700 transition-colors group"
            >
              <div className="truncate pr-2">
                <span className="text-purple-400 font-bold block text-[9px] uppercase">DOI Zenodo (RICIS)</span>
                <span className="text-purple-200 font-mono text-[10px] truncate block">
                  {refs.doiLabel}
                </span>
              </div>
              <ExternalLink size={12} className="text-neutral-500 group-hover:text-purple-400 shrink-0" />
            </a>
          </div>
        )}
      </div>

      {/* 6. СЕКЦИЯ АККОРДЕОНА: ЭКОНОМИКА И ОЦЕНКА */}
      {node.economic && (
        <div className="flex flex-col border-b border-neutral-800/50">
          <button
            type="button"
            onClick={() => toggleSection('economics')}
            className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 bg-[#0d1117] hover:bg-neutral-900 text-left cursor-pointer transition-colors"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <DollarSign size={13} />
              Экономика и прибыльность
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold text-emerald-300">
                {formatCurrency(node.economic.marketGain)}
              </span>
              {openSections['economics'] ? <ChevronUp size={14} className="text-emerald-400" /> : <ChevronDown size={14} className="text-emerald-400" />}
            </div>
          </button>

          {openSections['economics'] && (() => {
            const netProfit = Math.max(0, (node.economic?.marketGain || 0) - (node.economic?.costToSolve || 0));
            return (
              <div className="p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="p-1.5 rounded bg-black/50 border border-neutral-800">
                    <span className="text-gray-500 block text-[8px] uppercase">Оценка рынка</span>
                    <span className="text-emerald-300 font-bold">{formatCurrency(node.economic?.marketGain) || '—'}</span>
                  </div>
                  <div className="p-1.5 rounded bg-black/50 border border-neutral-800">
                    <span className="text-gray-500 block text-[8px] uppercase">Затраты на решение</span>
                    <span className="text-amber-200">{formatCurrency(node.economic?.costToSolve) || '—'}</span>
                  </div>
                </div>
                <div className="p-2 rounded bg-emerald-950/60 border border-emerald-800/60 flex justify-between items-center text-[10.5px]">
                  <span className="text-emerald-300 font-semibold">Чистая прибыльность (Net Profit):</span>
                  <span className="text-emerald-200 font-bold font-mono text-[11.5px]">{formatCurrency(netProfit)}</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 7. СЕКЦИЯ АККОРДЕОНА: ДОКАЗАТЕЛЬСТВО АВТОРСТВА ИЛИ АУДИТ ПРИОРИТЕТА */}
      {(node.id === 'ai-authorship-provenance' || node.title.toLowerCase().includes('авторств') || node.type === 'derivative_claim') && (
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => toggleSection('provenance')}
            className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 bg-[#0d1117] hover:bg-neutral-900 text-left cursor-pointer transition-colors"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <Sparkles size={13} />
              Доказательство авторства RICIS-III
            </span>
            <div className="flex items-center gap-2">
              {openSections['provenance'] ? <ChevronUp size={14} className="text-cyan-400" /> : <ChevronDown size={14} className="text-cyan-400" />}
            </div>
          </button>

          {openSections['provenance'] && (
            <div className="p-3 space-y-2 text-[10px]">
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[9px]">
                <div className="p-1.5 bg-red-950/40 border border-red-900/50 rounded">
                  <span className="text-red-400 block font-bold">ИИ без RICIS (NaN)</span>
                  <p className="text-red-200">0 × ∞ = NaN</p>
                </div>
                <div className="p-1.5 bg-emerald-950/40 border border-emerald-800/60 rounded">
                  <span className="text-emerald-400 block font-bold">RICIS-III Мост</span>
                  <p className="text-emerald-200">0_F × ∞_G = F·G</p>
                </div>
              </div>
              <p className="text-gray-300 text-[9.5px] leading-tight">
                Инвариант вычисляется за O(1) без потери функциональной непрерывности (L0).
              </p>
            </div>
          )}
        </div>
      )}

      </div>
      {/* Мета-информация узла */}
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        <div className="p-1.5 rounded border border-neutral-800/80 bg-neutral-950/40 text-[9.5px]">
          <span className="text-gray-500 uppercase block text-[8px]">Тип</span>
          <span className="text-slate-300 font-mono">{TYPE_LABELS[node.type] || node.type}</span>
        </div>
        <div className="p-1.5 rounded border border-neutral-800/80 bg-neutral-950/40 text-[9.5px]">
          <span className="text-gray-500 uppercase block text-[8px]">Глубина фрактала</span>
          <span className="text-slate-300 font-mono">{node.fractalDepth ?? 0}</span>
        </div>
      </div>
    </div>
  );
};
