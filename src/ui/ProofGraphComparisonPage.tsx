import React, { useState } from 'react';
import {
  ArrowLeft,
  Share2,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  ShieldCheck,
  Cpu,
  Layers,
  ExternalLink,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { ProofGraphComparisonService } from '../services/graphComparison/proofGraphComparisonService';
import type {
  IProofGraphProfile,
  IGraphStructuralDiff,
} from '../model/proofGraphComparison.contracts';

interface ProofGraphComparisonPageProps {
  onBackToMap: () => void;
}

export const ProofGraphComparisonPage: React.FC<ProofGraphComparisonPageProps> = ({ onBackToMap }) => {
  const [service] = useState(() => new ProofGraphComparisonService());
  const ricisProfile: IProofGraphProfile = service.getRicisGraphProfile();
  const anthropicProfile: IProofGraphProfile = service.getAnthropicFltGraphProfile();
  const diff: IGraphStructuralDiff = service.computeStructuralDiff();
  const [activeTab, setActiveTab] = useState<'matrix' | 'analogies' | 'divergences' | 'priority'>('matrix');

  return (
    <div className="min-h-screen bg-[#05070c] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <header className="border-b border-cyan-900/40 bg-[#070b14]/90 backdrop-blur-md px-4 py-3 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToMap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/80 text-cyan-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Назад к карте</span>
          </button>
          <div className="h-4 w-px bg-cyan-900/50" />
          <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-2">
            <GitBranch className="text-cyan-400" size={18} />
            <span>Структурное сравнение графов доказательств</span>
            <span className="hidden md:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-700/80 text-cyan-300">
              RICIS-III DAG vs Anthropic FLT Graph
            </span>
          </h1>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-neutral-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'matrix' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' : 'text-slate-400 hover:text-white'
            }`}
          >
            Топология и Метрики
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analogies')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'analogies' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' : 'text-slate-400 hover:text-white'
            }`}
          >
            Структурные аналогии
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('divergences')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'divergences' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' : 'text-slate-400 hover:text-white'
            }`}
          >
            Расхождения парадигм
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('priority')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'priority' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' : 'text-slate-400 hover:text-white'
            }`}
          >
            Приоритет & DOI
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Banner with Key Insight */}
        <section className="rounded-xl border border-cyan-800/40 bg-gradient-to-r from-cyan-950/40 via-neutral-950/60 to-purple-950/30 p-4 sm:p-5 shadow-xl">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-700/80 text-cyan-400 shrink-0">
              <Sparkles size={20} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
                Результат архитектурной экспертизы
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {diff.priorityVerdict.statement}
              </p>
            </div>
          </div>
        </section>

        {/* Tab 1: Topology & Metrics */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Profile Card RICIS-III */}
              <div className="rounded-xl border border-cyan-800/60 bg-[#090e1a]/80 p-5 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                      Оригинальная публикация (2025–2026)
                    </span>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Cpu size={16} className="text-cyan-400" />
                      <span>{ricisProfile.name}</span>
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-cyan-950 border border-cyan-700 text-cyan-300">
                    O(1) Engine
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-slate-400">Архитектура:</span>
                    <span className="font-mono text-slate-200">{ricisProfile.architecture}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-slate-400">Количество узлов графа:</span>
                    <span className="font-mono text-cyan-300 font-bold">{ricisProfile.metrics.totalNodes} квантовых узлов</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-slate-400">Связи / Ребра:</span>
                    <span className="font-mono text-slate-200">{ricisProfile.metrics.totalEdges}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-slate-400">Алгебраическая сложность:</span>
                    <span className="font-mono text-emerald-400 font-bold">{ricisProfile.metrics.algebraicComplexity}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-slate-400">Модель инспектора:</span>
                    <span className="font-mono text-purple-300">{ricisProfile.interactiveInspectionModel}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-slate-400">Депонированный DOI:</span>
                    <a
                      href={`https://doi.org/${ricisProfile.depositedDoi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>{ricisProfile.depositedDoi}</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                  <div className="pt-2">
                    <span className="text-slate-400 block mb-1">Разрешение сингулярностей:</span>
                    <p className="p-2 rounded bg-neutral-900/70 border border-cyan-900/30 text-[11px] text-slate-300 leading-relaxed">
                      {ricisProfile.singularityHandling}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Card Anthropic FLT */}
              <div className="rounded-xl border border-purple-800/60 bg-[#0f091a]/80 p-5 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400">
                      GitHub Release (Август 2026)
                    </span>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Layers size={16} className="text-purple-400" />
                      <span>{anthropicProfile.name}</span>
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-purple-950 border border-purple-700 text-purple-300">
                    Scale Expansion
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-slate-400">Архитектура:</span>
                    <span className="font-mono text-slate-200">{anthropicProfile.architecture}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-slate-400">Количество узлов графа:</span>
                    <span className="font-mono text-purple-300 font-bold">{anthropicProfile.metrics.totalNodes.toLocaleString()} теорем</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-slate-400">Связи / Ребра:</span>
                    <span className="font-mono text-slate-200">{anthropicProfile.metrics.totalEdges.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-slate-400">Алгебраическая сложность:</span>
                    <span className="font-mono text-amber-400 font-bold">{anthropicProfile.metrics.algebraicComplexity}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-slate-400">Модель инспектора:</span>
                    <span className="font-mono text-slate-300">{anthropicProfile.interactiveInspectionModel}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-slate-400">Репозиторий:</span>
                    <a
                      href={anthropicProfile.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <span>anthropics/fermats-last-theorem</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                  <div className="pt-2">
                    <span className="text-slate-400 block mb-1">Разрешение сингулярностей:</span>
                    <p className="p-2 rounded bg-neutral-900/70 border border-purple-900/30 text-[11px] text-slate-300 leading-relaxed">
                      {anthropicProfile.singularityHandling}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Structural Analogies */}
        {activeTab === 'analogies' && (
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400">
              Топологические совпадения архитектур декомпозиции
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {diff.structuralAnalogies.map((analogy, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-2 hover:border-cyan-800/60 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      <span>{analogy.feature}</span>
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                      Сходство: {Math.round(analogy.equivalenceScore * 100)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-2.5 rounded bg-cyan-950/20 border border-cyan-900/30">
                      <span className="text-[10px] font-mono uppercase text-cyan-400 block mb-1 font-bold">
                        Реализация в RICIS-III (Aleinikov):
                      </span>
                      <p className="text-slate-300 leading-relaxed">{analogy.ricisImplementation}</p>
                    </div>
                    <div className="p-2.5 rounded bg-purple-950/20 border border-purple-900/30">
                      <span className="text-[10px] font-mono uppercase text-purple-400 block mb-1 font-bold">
                        Реализация в Anthropic FLT:
                      </span>
                      <p className="text-slate-300 leading-relaxed">{analogy.anthropicImplementation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Fundamental Divergences */}
        {activeTab === 'divergences' && (
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-rose-400">
              Фундаментальные парадигмальные различия (Почему ядро RICIS-III не заимствовано)
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {diff.fundamentalDivergences.map((div, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-2 hover:border-rose-800/60 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-amber-400" />
                      <span>{div.domain}</span>
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 uppercase font-bold">
                      {div.significance}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-2.5 rounded bg-cyan-950/20 border border-cyan-900/30">
                      <span className="text-[10px] font-mono uppercase text-cyan-400 block mb-1 font-bold">
                        Парадигма RICIS-III:
                      </span>
                      <p className="text-slate-300 leading-relaxed">{div.ricisParadigm}</p>
                    </div>
                    <div className="p-2.5 rounded bg-neutral-950/60 border border-neutral-800">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1 font-bold">
                        Парадигма Anthropic Mathlib:
                      </span>
                      <p className="text-slate-300 leading-relaxed">{div.anthropicParadigm}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Priority & Intellectual Property */}
        {activeTab === 'priority' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-cyan-800/60 bg-[#070d18] p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-cyan-400">
                <ShieldCheck size={20} />
                <h3 className="text-base font-bold text-white">
                  Официальная фиксация авторского приоритета
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Архитектура представления нерешённых фундаментальных проблем в виде интерактивного направленного графа декомпозиции с Lean-верификацией была первоначально разработана и зарегистрирована автором RICIS-III (Д. В. Алейников).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg border border-cyan-900/50 bg-black/40 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block">
                    Основной депонированный DOI
                  </span>
                  <a
                    href="https://doi.org/10.5281/zenodo.17872755"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono font-bold text-white hover:text-cyan-300 flex items-center gap-1.5"
                  >
                    <span>10.5281/zenodo.17872755</span>
                    <ExternalLink size={13} />
                  </a>
                  <span className="text-[11px] text-slate-400 block">
                    Millennium Problems & Singularity Monolith Architecture
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-cyan-900/50 bg-black/40 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block">
                    Реестр 17 задач и графа доказательств
                  </span>
                  <a
                    href="https://doi.org/10.5281/zenodo.21517353"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono font-bold text-white hover:text-cyan-300 flex items-center gap-1.5"
                  >
                    <span>10.5281/zenodo.21517353</span>
                    <ExternalLink size={13} />
                  </a>
                  <span className="text-[11px] text-slate-400 block">
                    Master Registry of Singularity Proof Graph
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
