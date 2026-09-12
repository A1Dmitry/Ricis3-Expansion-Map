import React, { useState, useRef, useEffect } from 'react';
import { useMapStore } from '../store/mapStore';
import { useI18nStore } from '../store/useI18nStore';
import { AgentLogLevel } from '../model/types';

interface AgentLogModalProps {
  onClose: () => void;
  onSelectNode?: (nodeId: string) => void;
}

export function AgentLogModal({ onClose, onSelectNode }: AgentLogModalProps) {
  const { agentLogs, clearAgentLogs } = useMapStore();
  const { t } = useI18nStore();

  const [activeLevel, setActiveLevel] = useState<'all' | AgentLogLevel>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const logs = agentLogs || [];
  const filterTabs: readonly { readonly id: 'all' | AgentLogLevel; readonly label: string }[] = [
    { id: 'all', label: t('agentLog.filter.all', { count: logs.length }) },
    { id: 'ricis', label: t('agentLog.filter.ricis') },
    { id: 'success', label: t('agentLog.filter.success') },
    { id: 'info', label: t('agentLog.filter.info') },
    { id: 'warn', label: t('agentLog.filter.warn') },
    { id: 'error', label: t('agentLog.filter.error') },
  ];

  const filteredLogs = logs.filter(entry => {
    if (activeLevel !== 'all' && entry.level !== activeLevel) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = entry.message.toLowerCase().includes(q);
      const matchDetails = entry.details ? entry.details.toLowerCase().includes(q) : false;
      return matchMsg || matchDetails;
    }
    return true;
  });

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs.length, autoScroll]);

  const handleCopyLogs = () => {
    const formatted = filteredLogs
      .map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}${l.details ? `\n  ${t('agentLog.clipboard.details', { details: l.details })}` : ''}`)
      .join('\n');
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelBadgeClass = (level: AgentLogLevel) => {
    switch (level) {
      case 'ricis':
        return 'bg-purple-950/90 text-purple-300 border-purple-700/80';
      case 'success':
        return 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80';
      case 'warn':
        return 'bg-amber-950/90 text-amber-300 border-amber-700/80';
      case 'error':
        return 'bg-rose-950/90 text-rose-300 border-rose-700/80';
      case 'info':
      default:
        return 'bg-cyan-950/90 text-cyan-300 border-cyan-800/80';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-[#05080c] border border-cyan-800/70 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col overflow-hidden text-slate-200 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-neutral-900 via-cyan-950/40 to-neutral-900 border-b border-cyan-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.9)]" />
            <h2 className="text-sm sm:text-base font-bold text-cyan-200 tracking-wide flex items-center gap-2">
              <span>📋</span> {t('agentLog.title')}
              <span className="text-[10px] bg-cyan-950 border border-cyan-800 text-cyan-400 px-2 py-0.5 rounded font-normal">
                RICIS-III v7.7
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-bold"
            title={t('agentLog.close')}
            aria-label={t('agentLog.close')}
          >
            ✕
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-3.5 bg-neutral-950/90 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          {/* Level Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {filterTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveLevel(tab.id)}
                aria-label={tab.label}
                aria-pressed={activeLevel === tab.id}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer border ${
                  activeLevel === tab.id
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-700 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                    : 'bg-neutral-900/70 text-slate-400 border-neutral-800 hover:text-slate-200 hover:bg-neutral-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <input
              type="text"
              placeholder={t('agentLog.search.placeholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-slate-200 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-cyan-600 min-w-[140px] flex-1 sm:flex-initial"
            />

            <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={e => setAutoScroll(e.target.checked)}
                className="rounded border-neutral-700 bg-neutral-900 text-cyan-500 focus:ring-0"
                aria-label={t('agentLog.autoScroll')}
              />
              <span>{t('agentLog.autoScroll')}</span>
            </label>

            <button
              onClick={handleCopyLogs}
              className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-cyan-400 border border-cyan-900/60 rounded text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
              title={t('agentLog.copy.title')}
              aria-label={t('agentLog.copy.title')}
            >
              <span>{copied ? t('agentLog.copy.complete') : t('agentLog.copy')}</span>
            </button>

            <button
              onClick={clearAgentLogs}
              className="px-2 py-1 bg-neutral-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-neutral-800 hover:border-rose-900 rounded text-[11px] font-bold transition-colors cursor-pointer"
              title={t('agentLog.clear')}
              aria-label={t('agentLog.clear')}
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Log Lines Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs bg-[#03060a] scrollbar-thin">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 font-sans text-sm">
              <span className="text-2xl mb-2">🔍</span>
              <p>{t('agentLog.empty')}</p>
            </div>
          ) : (
            filteredLogs.map(entry => (
              <div
                key={entry.id}
                className="group flex flex-col gap-1 p-2 rounded bg-neutral-900/40 border border-neutral-800/60 hover:bg-neutral-900/80 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-mono select-none min-w-[55px]">
                      [{entry.timestamp}]
                    </span>

                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border select-none ${getLevelBadgeClass(
                        entry.level
                      )}`}
                    >
                      {entry.level}
                    </span>

                    <span className="text-slate-200 text-xs font-sans font-medium leading-relaxed break-all">
                      {entry.message}
                    </span>
                  </div>

                  {entry.nodeId && onSelectNode && (
                    <button
                      onClick={() => {
                        onSelectNode(entry.nodeId!);
                        onClose();
                      }}
                      className="text-[10px] text-cyan-400 hover:underline shrink-0 bg-cyan-950/60 border border-cyan-900/60 px-1.5 py-0.5 rounded cursor-pointer"
                    aria-label={t('agentLog.nodeLink')}
                    >
                      {t('agentLog.nodeLink')}
                    </button>
                  )}
                </div>

                {entry.details && (
                  <div className="ml-14 mt-1 p-2 bg-[#020305] border border-neutral-800/80 rounded text-[11px] text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap">
                    {entry.details}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>

        {/* Footer Summary Bar */}
        <div className="px-4 py-2 bg-neutral-950 border-t border-neutral-900 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>{t('agentLog.total', { count: logs.length })}</span>
          <span className="text-slate-500">{t('agentLog.footerHint')}</span>
        </div>
      </div>
    </div>
  );
}
