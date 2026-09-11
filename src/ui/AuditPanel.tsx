import React, { useState } from 'react';
import { useMapStore } from '../store/mapStore';
import { useI18nStore } from '../store/useI18nStore';
import {
  ShieldAlert,
  Wrench,
  Trash2,
  FileSearch,
  Sparkles,
  Search,
  Loader2,
  CheckCircle,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';

/**
 * Варианты цветовой палитры кнопок аудита
 */
export type AuditActionButtonVariant = 'primary' | 'secondary' | 'warning' | 'emerald' | 'cyan' | 'purple';

/**
 * Описание кнопки действия панели аудита
 */
export interface AuditActionButtonDescriptor {
  readonly id: string;
  readonly icon: LucideIcon;
  readonly tooltipTitle: string;
  readonly tooltipDescription: string;
  readonly variant: AuditActionButtonVariant;
  readonly onClick: () => void | Promise<void>;
  readonly disabled?: boolean;
}

const variantStyles: Record<AuditActionButtonVariant, string> = {
  primary: 'bg-indigo-600/80 hover:bg-indigo-500 border-indigo-400/40 text-indigo-100 hover:text-white',
  secondary: 'bg-slate-700/80 hover:bg-slate-600 border-slate-500/40 text-slate-200 hover:text-white',
  warning: 'bg-amber-600/80 hover:bg-amber-500 border-amber-400/40 text-amber-100 hover:text-white',
  emerald: 'bg-emerald-600/80 hover:bg-emerald-500 border-emerald-400/40 text-emerald-100 hover:text-white',
  cyan: 'bg-cyan-600/80 hover:bg-cyan-500 border-cyan-400/40 text-cyan-100 hover:text-white',
  purple: 'bg-purple-600/80 hover:bg-purple-500 border-purple-400/40 text-purple-100 hover:text-white',
};

export const AuditPanel: React.FC = () => {
  const {
    runSystemAudit,
    runGraphRepair,
    executeGarbageCollection,
    runAuditMissingTargets,
    runFillMissingTargets,
    runDerivativeSearch,
    isAuditing,
    lastAuditReport,
  } = useMapStore();

  const { locale } = useI18nStore();
  const isRu = locale === 'ru';

  const [localLoading, setLocalLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleAction = async (actionName: string, actionFn: () => Promise<unknown>) => {
    try {
      setLocalLoading(actionName);
      setStatusMessage(null);
      await actionFn();
      setStatusMessage(
        isRu
          ? `Действие "${actionName}" успешно выполнено.`
          : `Action "${actionName}" completed successfully.`
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setStatusMessage(
        isRu ? `Ошибка: ${errorMsg}` : `Error: ${errorMsg}`
      );
    } finally {
      setLocalLoading(null);
    }
  };

  const isLoading = isAuditing || localLoading !== null;

  const actionButtons: AuditActionButtonDescriptor[] = [
    {
      id: 'btn-run-audit',
      icon: ShieldAlert,
      tooltipTitle: isRu ? 'Системный аудит графа' : 'Run System Audit',
      tooltipDescription: isRu
        ? 'Проверить целостность топологии, семантические индексы SP4 и наличие нарушений.'
        : 'Verify topology integrity, SP4 semantic indices, and detect graph violations.',
      variant: 'primary',
      onClick: () => handleAction(isRu ? 'Аудит' : 'Audit', runSystemAudit),
    },
    {
      id: 'btn-repair-graph',
      icon: Wrench,
      tooltipTitle: isRu ? 'Восстановление связей и таргетов' : 'Repair Graph & Targets',
      tooltipDescription: isRu
        ? 'Автоматически восстановить отсутствующие связи и целевые формулы.'
        : 'Automatically repair broken edges and missing target formulas.',
      variant: 'warning',
      onClick: () => handleAction(isRu ? 'Восстановление' : 'Repair', runGraphRepair),
    },
    {
      id: 'btn-run-gc',
      icon: Trash2,
      tooltipTitle: isRu ? 'Сборка мусора (GC)' : 'Garbage Collection (GC)',
      tooltipDescription: isRu
        ? 'Удалить изолированные и неиспользуемые узлы из графа.'
        : 'Remove orphaned and unreachable nodes from the ontological graph.',
      variant: 'secondary',
      onClick: () => handleAction(isRu ? 'Очистка' : 'GC', executeGarbageCollection),
    },
    {
      id: 'btn-audit-missing',
      icon: FileSearch,
      tooltipTitle: isRu ? 'Поиск пустых выражений' : 'Audit Missing Targets',
      tooltipDescription: isRu
        ? 'Найти все узлы и сингулярности, не имеющие целевых математических выражений.'
        : 'Locate all nodes and singularities lacking target mathematical expressions.',
      variant: 'cyan',
      onClick: () => handleAction(isRu ? 'Поиск пустых' : 'Audit Missing', runAuditMissingTargets),
    },
    {
      id: 'btn-fill-missing',
      icon: Sparkles,
      tooltipTitle: isRu ? 'Автозаполнение таргетов' : 'Auto-fill Missing Targets',
      tooltipDescription: isRu
        ? 'Заполнить недостающие целевые функции через генератор инвариантов.'
        : 'Generate and fill missing target functions via the invariant generator.',
      variant: 'emerald',
      onClick: () => handleAction(isRu ? 'Автозаполнение' : 'Auto-fill', runFillMissingTargets),
    },
    {
      id: 'btn-search-derivatives',
      icon: Search,
      tooltipTitle: isRu ? 'Поиск производных работ' : 'Search Derivatives',
      tooltipDescription: isRu
        ? 'Найти связанные цитирования и внешние производные работы.'
        : 'Search for citations and external derivative works.',
      variant: 'purple',
      onClick: () => handleAction(isRu ? 'Поиск производных' : 'Derivatives', runDerivativeSearch),
    },
  ];

  const totalViolations = lastAuditReport
    ? lastAuditReport.orphans.length +
      lastAuditReport.brokenEdges.length +
      lastAuditReport.desyncedNodeIds.length +
      lastAuditReport.cyclicGroups.length
    : 0;

  return (
    <div
      id="audit-panel-root"
      className="p-3 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md text-slate-200 text-xs w-full max-w-md space-y-2.5"
    >
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
        <div className="flex items-center gap-1.5 font-semibold text-slate-100">
          <ShieldAlert className="w-4 h-4 text-indigo-400" />
          <span>{isRu ? 'Аудит и контроль графа' : 'Graph Audit & Control'}</span>
        </div>
        {isLoading && (
          <div className="flex items-center gap-1 text-indigo-400 animate-pulse text-[11px]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{isRu ? 'Выполняется...' : 'Processing...'}</span>
          </div>
        )}
      </div>

      {/* Компактный тулбар кнопок без текста с всплывающими подсказками (tooltips) */}
      <div id="audit-action-toolbar" className="flex items-center flex-wrap gap-1.5">
        {actionButtons.map((btn) => {
          const Icon = btn.icon;
          const isButtonBusy = localLoading !== null && btn.id.includes(localLoading.toLowerCase());
          const tooltip = `${btn.tooltipTitle}\n${btn.tooltipDescription}`;
          const ariaLabel = `${btn.tooltipTitle}: ${btn.tooltipDescription}`;

          return (
            <button
              key={btn.id}
              id={btn.id}
              type="button"
              disabled={isLoading || btn.disabled}
              onClick={btn.onClick}
              title={tooltip}
              aria-label={ariaLabel}
              className={`p-2 rounded-lg border transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center ${
                variantStyles[btn.variant]
              }`}
            >
              {isButtonBusy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
            </button>
          );
        })}
      </div>

      {/* Статусное сообщение */}
      {statusMessage && (
        <div
          id="audit-status-banner"
          className="px-2.5 py-1.5 rounded-md bg-slate-800/90 border border-slate-700 text-slate-300 text-[11px] flex items-center gap-1.5"
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <span className="truncate">{statusMessage}</span>
        </div>
      )}

      {/* Сводка последнего аудита */}
      {lastAuditReport && (
        <div
          id="audit-report-summary"
          className="p-2 bg-slate-800/60 border border-slate-700/50 rounded-lg space-y-1.5 text-[11px]"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span>{isRu ? 'Проверено элементов:' : 'Inspected elements:'}</span>
            <span className="font-mono text-slate-200">{lastAuditReport.totalInspected}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">{isRu ? 'Статус топологии:' : 'Topology status:'}</span>
            {lastAuditReport.isValid && totalViolations === 0 ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle className="w-3 h-3" />
                {isRu ? 'Инвариант соблюдён' : 'Invariant OK'}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                {isRu
                  ? `Нарушений: ${totalViolations}`
                  : `Violations: ${totalViolations}`}
              </span>
            )}
          </div>

          {totalViolations > 0 && (
            <div className="pt-1 max-h-24 overflow-y-auto space-y-1 pr-1 text-slate-300 text-[10px]">
              {lastAuditReport.orphans.length > 0 && (
                <div>• {isRu ? `Изолированных узлов: ${lastAuditReport.orphans.length}` : `Orphan nodes: ${lastAuditReport.orphans.length}`}</div>
              )}
              {lastAuditReport.brokenEdges.length > 0 && (
                <div>• {isRu ? `Поврежденных связей: ${lastAuditReport.brokenEdges.length}` : `Broken edges: ${lastAuditReport.brokenEdges.length}`}</div>
              )}
              {lastAuditReport.desyncedNodeIds.length > 0 && (
                <div>• {isRu ? `Рассинхронизированных узлов: ${lastAuditReport.desyncedNodeIds.length}` : `Desynced nodes: ${lastAuditReport.desyncedNodeIds.length}`}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
