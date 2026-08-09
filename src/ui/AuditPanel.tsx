import React, { useState, useEffect } from 'react';
import { useMapStore } from '../store/mapStore';
import { dbGetMigrationState } from '../model/db';
import { MigrationAuditReport } from '../model/migrationAudit';
import { ActionButton } from './ActionButton';

type ActiveOp = 'migration' | 'audit' | 'fill' | 'derivatives' | 'train' | null;

/** Sidebar controls: DB Migration Audit + agent training + audit missing targets + agent fill + derivative search. */
export const AuditPanel: React.FC = () => {
  const map = useMapStore();
  const [activeOp, setActiveOp] = useState<ActiveOp>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [migrationInfo, setMigrationInfo] = useState<{ version: number; report?: MigrationAuditReport } | null>(null);

  useEffect(() => {
    void dbGetMigrationState().then(st => {
      if (st) setMigrationInfo(st as any);
    });
  }, [map.nodes.length]);

  const handleAgentTrain = async () => {
    setActiveOp('train');
    setMsg('Сканирование IndexedDB, извлечение доказанных шаблонов O(1) и аксиом…');
    try {
      const memory = await map.runAgentDbTraining();
      setMsg(
        `Агент успешно обучен из БД! ${memory.trainingSummary} Паттернов $O(1)$: ${memory.canonicalPatterns.length}.`
      );
    } catch (e: any) {
      setMsg('Ошибка авто-обучения агента: ' + (e?.message || String(e)));
    } finally {
      setActiveOp(null);
    }
  };

  const handleMigrationAudit = async () => {
    setActiveOp('migration');
    setMsg('Запуск разовой миграции v3: переоценка монетизации и связей...');
    try {
      const report = await map.runAuditMigration(true);
      setMigrationInfo({ version: report.dbVersion, report });
      setMsg(
        `Миграция v${report.dbVersion} завершена! Узлов аудировано: ${report.totalNodesAudited}. ` +
        `Монетизация переоценена: ${report.economicReevaluated} узлов. ` +
        `Исправлено названий: ${report.titlesFixed}, восстановлено связей: ${report.connectionsFixed} ` +
        `(сирот: ${report.orphanNodesReconnected}), ребер перестроено: ${report.edgesRebuilt}.`
      );
    } catch (e: any) {
      setMsg('Миграция БД ошибка: ' + (e?.message || String(e)));
    } finally {
      setActiveOp(null);
    }
  };

  const handleAudit = async () => {
    setActiveOp('audit');
    setMsg('Аудит: обход дерева, поиск узлов без целевой функции…');
    try {
      const r = await map.runAuditMissingTargets();
      setMsg(
        'Аудит: без целевой ' +
          r.missingCount +
          ', переведены в жёлтый (partial): ' +
          r.demoted +
          '.'
      );
    } catch (e: any) {
      setMsg('Аудит ошибка: ' + (e?.message || String(e)));
    } finally {
      setActiveOp(null);
    }
  };

  const handleFill = async () => {
    setActiveOp('fill');
    setMsg('Агент заполняет целевые функции (поиск формулировок)…');
    try {
      const r = await map.runFillMissingTargets();
      const errTail = r.errors?.length
        ? ' Ошибки: ' + r.errors.slice(0, 3).join('; ')
        : '';
      setMsg(
        'Заполнено целевых: ' + r.filled + ', сбоев: ' + r.failed + '.' + errTail
      );
    } catch (e: any) {
      setMsg('Заполнение ошибка: ' + (e?.message || String(e)));
    } finally {
      setActiveOp(null);
    }
  };

  const handleDerivatives = async () => {
    setActiveOp('derivatives');
    setMsg(
      'Поиск производных / переименованных реализаций RICIS (SP2, A6, 0_F/0_G, no lim)…'
    );
    try {
      const r = await map.runDerivativeSearch();
      if (r.error) {
        setMsg('Поиск производных: ' + r.error);
      } else {
        setMsg(
          'Производные (фиолетовые): добавлено ' +
            r.added +
            ' из ' +
            r.hits +
            ' кандидатов. В карточке — дата первого упоминания и связи с math-singularity.'
        );
      }
    } catch (e: any) {
      setMsg('Поиск производных ошибка: ' + (e?.message || String(e)));
    } finally {
      setActiveOp(null);
    }
  };

  const isBusy = activeOp !== null;

  return (
    <div className="mt-2 space-y-1.5 border-t border-cyan-900/40 pt-2">
      <div className="flex items-center justify-between text-[10px] text-cyan-400 font-mono mb-1">
        <span>Статус БД: <strong className="text-emerald-400">v{migrationInfo?.version || 3}</strong></span>
        {migrationInfo?.version && migrationInfo.version >= 3 ? (
          <span className="text-[9px] text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">v3 Монетизация переоценена</span>
        ) : null}
      </div>

      {map.agentTrainingMemory && (
        <div className="p-2 bg-violet-950/40 border border-violet-800/50 rounded text-[9px] font-mono text-violet-200 space-y-1 my-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-violet-300">🎓 База Знаний Агента</span>
            <span className="text-[8px] bg-violet-900/80 text-violet-200 px-1 py-0.5 rounded border border-violet-700/60">
              Точность: {map.agentTrainingMemory.trainingAccuracy}%
            </span>
          </div>
          <p className="text-violet-300/90 leading-tight">
            Обучен на <strong>{map.agentTrainingMemory.resolvedNodesCount}</strong> разрешенных узлах, <strong>{map.agentTrainingMemory.proofsCount}</strong> доказательствах из IndexedDB.
          </p>
        </div>
      )}

      <ActionButton
        onClick={() => void handleAgentTrain()}
        isLoading={activeOp === 'train'}
        isDisabled={isBusy && activeOp !== 'train'}
        disabledReason={isBusy ? 'Идет другая операция' : undefined}
        variant="cyan"
        className="w-full shadow-[0_0_12px_rgba(6,182,212,0.2)]"
      >
        🧠 Авто-обучение агента из базы данных
      </ActionButton>

      <ActionButton
        onClick={() => void handleMigrationAudit()}
        isLoading={activeOp === 'migration'}
        isDisabled={isBusy && activeOp !== 'migration'}
        disabledReason={isBusy ? 'Идет другая операция' : undefined}
        variant="emerald"
        className="w-full"
      >
        🔄 Миграция v3: Переоценка монетизации
      </ActionButton>

      <ActionButton
        onClick={() => void handleAudit()}
        isLoading={activeOp === 'audit'}
        isDisabled={isBusy && activeOp !== 'audit'}
        disabledReason={isBusy ? 'Идет другая операция' : undefined}
        variant="amber"
        className="w-full"
      >
        Аудит: без целевой → жёлтые
      </ActionButton>

      <ActionButton
        onClick={() => void handleFill()}
        isLoading={activeOp === 'fill'}
        isDisabled={isBusy && activeOp !== 'fill'}
        disabledReason={isBusy ? 'Идет другая операция' : undefined}
        variant="amber"
        className="w-full"
      >
        Агент: заполнить целевые функции
      </ActionButton>

      <ActionButton
        onClick={() => void handleDerivatives()}
        isLoading={activeOp === 'derivatives'}
        isDisabled={isBusy && activeOp !== 'derivatives'}
        disabledReason={isBusy ? 'Идет другая операция' : undefined}
        variant="violet"
        className="w-full"
      >
        Поиск производных RICIS → фиолетовые
      </ActionButton>

      {msg && <p className="text-[10px] text-cyan-200 bg-cyan-950/60 p-2 rounded border border-cyan-800/50 mt-1 leading-snug">{msg}</p>}
    </div>
  );
};

