import { ContentButton, SelectionCard } from './components/ContentButton';
import { IconButton } from './components/IconButton';

import { useMemo } from 'react';
import { X, Palette, ShieldCheck, CheckCircle2, AlertTriangle, Clock, Lock, Sparkles, Compass, Eye, Filter } from 'lucide-react';
import { NodeResolutionStatusCode, NODE_PROJECTIONS, GraphColorStateManager } from '../model/colorMatrix';
import type { ProblemNode, Proof } from '../model/types';

interface StatusLegendModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly nodes: readonly ProblemNode[];
  readonly proofs?: Record<string, Proof>;
  readonly activeStatusFilter: NodeResolutionStatusCode | null;
  readonly onSelectStatusFilter: (statusCode: NodeResolutionStatusCode | null) => void;
  readonly locale?: string;
}

const STATUS_ICONS: Record<NodeResolutionStatusCode, typeof Palette> = {
  [NodeResolutionStatusCode.PROVEN_RESOLVED]: CheckCircle2,
  [NodeResolutionStatusCode.LEAN_VERIFIED]: ShieldCheck,
  [NodeResolutionStatusCode.RESOLVED_WITH_WARNINGS]: AlertTriangle,
  [NodeResolutionStatusCode.PARTIAL_HYPOTHESIS]: Sparkles,
  [NodeResolutionStatusCode.EARLY_DRAFT]: Clock,
  [NodeResolutionStatusCode.UNRESOLVED_SINGULARITY]: Compass,
  [NodeResolutionStatusCode.LOCKED_BY_DEPENDENCIES]: Lock,
  [NodeResolutionStatusCode.ACTIVE_L1_PATH]: Eye,
  [NodeResolutionStatusCode.CORE_AXIOM]: ShieldCheck,
  [NodeResolutionStatusCode.DERIVATIVE_CLAIM]: Palette,
  [NodeResolutionStatusCode.ARCHIVED_DORMANT]: Clock,
};

export function StatusLegendModal({
  isOpen,
  onClose,
  nodes,
  proofs,
  activeStatusFilter,
  onSelectStatusFilter,
  locale,
}: StatusLegendModalProps) {
  const manager = useMemo(() => new GraphColorStateManager(), []);

  const countsByStatus = useMemo(() => {
    const counts: Partial<Record<NodeResolutionStatusCode, number>> = {};
    for (const code of Object.values(NodeResolutionStatusCode)) {
      counts[code] = 0;
    }
    for (const node of nodes) {
      const code = manager.resolveNodeStatusCode(node, proofs?.[node.id]);
      counts[code] = (counts[code] ?? 0) + 1;
    }
    return counts;
  }, [nodes, proofs, manager]);

  if (!isOpen) return null;

  const isRu = locale === 'ru';
  // Ordered strictly according to the verified RICIS spectrum:
  // Красный -> Оранжевый -> Желтый -> Желто-зеленый -> Зеленый -> Синий (подзадача) -> Голубой (подзадача подзадачи) -> Фиолетовый (чужой-последователь) -> Почти прозрачный (не открыт)
  const statusCodes = [
    NodeResolutionStatusCode.UNRESOLVED_SINGULARITY,
    NodeResolutionStatusCode.EARLY_DRAFT,
    NodeResolutionStatusCode.PARTIAL_HYPOTHESIS,
    NodeResolutionStatusCode.RESOLVED_WITH_WARNINGS,
    NodeResolutionStatusCode.PROVEN_RESOLVED,
    NodeResolutionStatusCode.LEAN_VERIFIED,
    NodeResolutionStatusCode.CORE_AXIOM,
    NodeResolutionStatusCode.ACTIVE_L1_PATH,
    NodeResolutionStatusCode.DERIVATIVE_CLAIM,
    NodeResolutionStatusCode.LOCKED_BY_DEPENDENCIES,
    NodeResolutionStatusCode.ARCHIVED_DORMANT,
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-legend-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-cyan-800/80 bg-[#070d18] p-6 shadow-2xl shadow-cyan-950/60 text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-cyan-900/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-700/60 bg-cyan-950/80 text-cyan-300">
              <Palette size={20} />
            </div>
            <div>
              <h2 id="status-legend-title" className="text-lg font-bold text-white tracking-tight">
                {isRu ? 'Онтологическая палитра состояний RICIS-III' : 'Ontological State Palette of RICIS-III'}
              </h2>
              <p className="text-xs text-slate-400">
                {isRu
                  ? 'Красный → Оранжевый → Желтый → Желто-зеленый → Зеленый | Синий (подзадача) → Голубой (подзадача подзадачи) | Фиолетовый (чужой) | Прозрачный (не открыт)'
                  : 'Red → Orange → Yellow → Yellow-Green → Green | Blue (subtask) → Cyan (sub-subtask) | Purple (follower) | Ghost (unopened)'}
              </p>
            </div>
          </div>
          <IconButton
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-900/80 p-1.5 text-slate-400 transition-colors hover:border-cyan-500 hover:text-white"
            aria-label={isRu ? 'Закрыть легенду' : 'Close legend'}
          >
            <X size={18} />
          </IconButton>
        </div>

        {/* Visual Spectrum Bar */}
        <div className="mt-4 p-2.5 rounded-xl border border-slate-800 bg-black/40">
          <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex items-center justify-between">
            <span>{isRu ? 'КАНОНИЧЕСКИЙ СПЕКТР СОСТОЯНИЙ:' : 'CANONICAL STATE SPECTRUM:'}</span>
            <span className="text-cyan-400 font-semibold">{isRu ? 'Сверено с моделью графа' : 'Verified with graph model'}</span>
          </div>
          <div className="flex items-center h-4 rounded-lg overflow-hidden border border-slate-700/60">
            <div className="flex-1 h-full bg-[#ef4444]" title="Красный (нерешено)" />
            <div className="flex-1 h-full bg-[#f97316]" title="Оранжевый (черновик/sorry)" />
            <div className="flex-1 h-full bg-[#eab308]" title="Желтый (частично/гипотеза)" />
            <div className="flex-1 h-full bg-[#84cc16]" title="Желто-зеленый (решено с замечаниями)" />
            <div className="flex-1 h-full bg-[#22c55e]" title="Зеленый (доказано RICIS)" />
            <div className="flex-1 h-full bg-[#10b981]" title="Изумрудный (Lean 4 верифицировано)" />
            <div className="flex-1 h-full bg-[#3b82f6]" title="Синий (подзадача)" />
            <div className="flex-1 h-full bg-[#06b6d4]" title="Голубой (подзадача подзадачи)" />
            <div className="flex-1 h-full bg-[#a855f7]" title="Фиолетовый (чужой-последователь)" />
            <div className="flex-1 h-full bg-slate-500/20 border-l border-white/20" title="Почти прозрачный (не открыт)" />
          </div>
        </div>

        {/* Filter controls */}
        {activeStatusFilter && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-cyan-800/60 bg-cyan-950/40 px-3 py-2 text-xs">
            <span className="flex items-center gap-2 text-cyan-200">
              <Filter size={14} />
              {isRu ? 'Активный фильтр по статусу:' : 'Active status filter:'}{' '}
              <strong className="text-white">{NODE_PROJECTIONS[activeStatusFilter].label}</strong>
            </span>
            <ContentButton
              type="button"
              onClick={() => onSelectStatusFilter(null)}
              className="rounded bg-cyan-900/80 px-2 py-1 text-[10px] font-bold text-cyan-100 hover:bg-cyan-800"
            >
              {isRu ? 'Сбросить фильтр' : 'Reset filter'}
            </ContentButton>
          </div>
        )}

        {/* Status List */}
        <div className="mt-4 grid gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {statusCodes.map(code => {
            const projection = NODE_PROJECTIONS[code];
            const count = countsByStatus[code] ?? 0;
            const Icon = STATUS_ICONS[code] || Palette;
            const isSelected = activeStatusFilter === code;

            const rgbText = `RGB(${Math.round(projection.rgb.r * 255)}, ${Math.round(projection.rgb.g * 255)}, ${Math.round(projection.rgb.b * 255)})`;

            return (
              <SelectionCard
                key={code}
                type="button"
                onClick={() => onSelectStatusFilter(isSelected ? null : code)}
                className={`w-full text-left rounded-xl border p-3 transition-all flex items-start gap-3.5 cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/70 shadow-lg shadow-cyan-950/50'
                    : 'border-slate-800/90 bg-[#0b1322]/80 hover:border-cyan-800/80 hover:bg-[#0e1a2f]'
                }`}
              >
                {/* Visual Sphere preview */}
                <div className="relative shrink-0 mt-0.5 flex flex-col items-center">
                  <div
                    className="h-6 w-6 rounded-full border border-white/30 shadow-md transition-transform"
                    style={{
                      backgroundColor: projection.hexColor,
                      boxShadow: `0 0 12px ${projection.glowColor}`,
                      opacity: projection.opacity,
                    }}
                  />
                  <span className="mt-1 font-mono text-[9px] text-slate-400">{projection.hexColor}</span>
                </div>

                {/* Status info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
                      <Icon size={14} style={{ color: projection.hexColor }} />
                      {projection.label}
                    </span>
                    <span className="rounded-full border border-slate-700 bg-black/40 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                      {count} {isRu ? 'узлов' : 'nodes'}
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                    {projection.description}
                  </p>

                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="rounded border border-slate-800 bg-black/30 px-1.5 py-0.5 font-mono text-[9px] text-slate-400">
                      {rgbText}
                    </span>
                    <span className="font-mono text-[9px] text-slate-500 uppercase">
                      Код: {code}
                    </span>
                  </div>
                </div>
              </SelectionCard>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-cyan-900/40 pt-4 text-xs text-slate-400">
          <span>{isRu ? `Всего узлов в графе: ${nodes.length}` : `Total graph nodes: ${nodes.length}`}</span>
          <ContentButton
            type="button"
            onClick={onClose}
            className="rounded-lg border border-cyan-700/80 bg-cyan-950 px-4 py-1.5 font-bold text-cyan-200 transition-colors hover:bg-cyan-900"
          >
            {isRu ? 'Понятно' : 'Done'}
          </ContentButton>
        </div>
      </div>
    </div>
  );
}
