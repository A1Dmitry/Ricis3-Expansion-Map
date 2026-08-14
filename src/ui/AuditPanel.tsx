import React, { useState } from 'react';
import { useMapStore } from '../store/mapStore';
import { 
  Activity, 
  Trash2, 
  Search, 
  Sparkles, 
  RefreshCw, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const AuditPanel: React.FC = () => {
  const store = useMapStore() as any;
  const { 
    isAuditing, 
    runSystemAudit,
    executeGarbageCollection,
    runAuditMissingTargets,
    runFillMissingTargets,
    addAgentLog
  } = store;

  const [localLoading, setLocalLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleAction = async (name: string, actionFn: () => Promise<any>) => {
    setLocalLoading(true);
    setStatusMessage(null);
    setIsError(false);
    try {
      const result = await actionFn();
      let msg = `Успешно: ${name}`;
      if (name === 'Сборка мусора' && result) {
        msg = `GC завершен. Удалено узлов: ${result.removedNodeIds.length}, связей: ${result.removedEdgeIds.length}.`;
      }
      setStatusMessage(msg);
      addAgentLog(`Операция "${name}" выполнена успешно.`, 'ricis');
    } catch (err: any) {
      console.error(err);
      setIsError(true);
      setStatusMessage(`Ошибка: ${err.message || err}`);
      addAgentLog(`Сбой операции "${name}": ${err.message || err}`, 'warn');
    } finally {
      setLocalLoading(false);
    }
  };

  const isLoading = isAuditing || localLoading;

  return (
    <div className="space-y-2 text-xs font-mono p-1" id="ricis-audit-panel-root">
      {/* Кнопочный интерфейс управления */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" id="audit-buttons-grid">
        <button
          onClick={() => handleAction('Системный аудит', runSystemAudit)}
          disabled={isLoading}
          className="px-3 py-2 text-[11px] font-medium bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-300 border border-slate-800 rounded flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
          id="btn-run-audit"
          title="Запустить полный анализ структуры графа"
        >
          <Activity className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          <span>Аудит системы</span>
        </button>

        <button
          onClick={() => handleAction('Сборка мусора', executeGarbageCollection)}
          disabled={isLoading}
          className="px-3 py-2 text-[11px] font-medium bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-300 border border-slate-800 rounded flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
          id="btn-run-gc"
          title="Удалить изолированные узлы и битые связи"
        >
          <Trash2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Очистить граф (GC)</span>
        </button>

        <button
          onClick={() => handleAction('Поиск пустых целей', runAuditMissingTargets)}
          disabled={isLoading}
          className="px-3 py-2 text-[11px] font-medium bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-300 border border-slate-800 rounded flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
          id="btn-audit-missing"
          title="Найти узлы с незаполненными целевыми выражениями"
        >
          <Search className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>Пустые цели</span>
        </button>

        <button
          onClick={() => handleAction('Заполнение целей ИИ', runFillMissingTargets)}
          disabled={isLoading}
          className="px-3 py-2 text-[11px] font-medium bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-300 border border-slate-800 rounded flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
          id="btn-fill-missing"
          title="Заполнить пустые цели с помощью ИИ"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Заполнить ИИ</span>
        </button>
      </div>

      {/* Индикатор работы */}
      {isLoading && (
        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 px-1 py-0.5" id="audit-loading-indicator">
          <RefreshCw className="w-3 h-3 animate-spin text-violet-400" />
          <span>Выполнение канонической операции...</span>
        </div>
      )}

      {/* Ультра-минималистичный статус операции */}
      {statusMessage && !isLoading && (
        <div 
          className={`px-2 py-1 rounded text-[10px] flex items-center gap-1.5 border ${
            isError 
              ? 'bg-red-950/20 border-red-900/30 text-red-400' 
              : 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400'
          }`} 
          id="audit-status-banner"
        >
          {isError ? (
            <AlertCircle className="w-3 h-3 shrink-0" />
          ) : (
            <CheckCircle className="w-3 h-3 shrink-0" />
          )}
          <span className="truncate">{statusMessage}</span>
        </div>
      )}
    </div>
  );
};
