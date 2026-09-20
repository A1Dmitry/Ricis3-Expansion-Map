import React from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Cpu,
  Clock,
} from 'lucide-react';
import { useProgressBar } from '../../services/progressBar/useProgressBar';
import { IconButton } from './IconButton';

export const TopProgressBar: React.FC = () => {
  const progressState = useProgressBar();
  const {
    title,
    current,
    total,
    percentage,
    message,
    status,
    isRunning,
    isIndeterminate,
    elapsedMs,
    estimatedRemainingMs,
    cancellable,
    requestCancel,
  } = progressState;

  if (status === 'idle') {
    return null;
  }

  const formatSeconds = (ms: number): string => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}m`;
    }
    return `${secs}s`;
  };

  const getStatusColorClasses = () => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200',
          bar: 'bg-gradient-to-r from-emerald-500 to-green-400',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
        };
      case 'error':
        return {
          bg: 'bg-red-950/80 border-red-500/50 text-red-200',
          bar: 'bg-gradient-to-r from-red-600 to-amber-500',
          icon: <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />,
        };
      case 'cancelled':
        return {
          bg: 'bg-amber-950/80 border-amber-500/50 text-amber-200',
          bar: 'bg-gradient-to-r from-amber-600 to-yellow-500',
          icon: <XCircle className="w-4 h-4 text-amber-400 shrink-0" />,
        };
      case 'running':
      default:
        return {
          bg: 'bg-[#08101e]/95 border-cyan-500/40 text-cyan-200',
          bar: 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500',
          icon: <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />,
        };
    }
  };

  const colors = getStatusColorClasses();

  return (
    <div
      role="progressbar"
      aria-valuenow={isIndeterminate ? undefined : percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${title}: ${message || ''}`}
      className={`w-full border-b backdrop-blur-md transition-all duration-300 shadow-lg relative z-30 font-sans ${colors.bg}`}
    >
      {/* Top Track & Progress Stripe */}
      <div className="w-full h-1.5 bg-black/50 overflow-hidden relative">
        {isIndeterminate ? (
          <div className="h-full w-1/3 bg-cyan-400 animate-[pulse_1.5s_ease-in-out_infinite] shadow-sm shadow-cyan-400" />
        ) : (
          <div
            className={`h-full transition-all duration-300 ease-out shadow-sm ${colors.bar}`}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>

      {/* Info Status Content */}
      <div className="px-3 sm:px-4 py-1.5 flex items-center justify-between gap-3 text-xs font-mono">
        {/* Left: Icon, Title, Dynamic Message */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {colors.icon}
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold text-white tracking-wide shrink-0">
              {title || 'Фоновая задача'}
            </span>
            <span className="text-slate-400 shrink-0">:</span>
            <span className="truncate text-slate-300 opacity-90">
              {message || (isRunning ? 'Выполнение операций...' : 'Готово')}
            </span>
          </div>
        </div>

        {/* Right: Counters, Percent, Elapsed & ETA, Cancel */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Progress Percent / Counters */}
          {!isIndeterminate && (
            <div className="flex items-center gap-2">
              {total > 0 && (
                <span className="text-slate-400 hidden sm:inline">
                  [{current}/{total}]
                </span>
              )}
              <span className="font-bold text-white">
                {percentage}%
              </span>
            </div>
          )}

          {/* Time tracker */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{formatSeconds(elapsedMs)}</span>
            {isRunning && estimatedRemainingMs !== undefined && estimatedRemainingMs > 0 && (
              <span className="text-cyan-400/80">
                (осталось ~{formatSeconds(estimatedRemainingMs)})
              </span>
            )}
          </div>

          {/* Cancel button if task supports it */}
          {cancellable && isRunning && (
            <IconButton
              title="Прервать выполнение"
              onClick={requestCancel}
              className="p-1 text-slate-400 hover:text-red-300 hover:bg-red-950/60 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </IconButton>
          )}
        </div>
      </div>
    </div>
  );
};
