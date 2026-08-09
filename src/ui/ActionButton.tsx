import React from 'react';

export type ButtonStatus = 'active' | 'disabled' | 'in_progress';
export type ButtonVariant = 'cyan' | 'emerald' | 'amber' | 'violet' | 'red' | 'neutral';

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  status?: ButtonStatus;
  isLoading?: boolean;
  isDisabled?: boolean;
  disabledReason?: string;
  variant?: ButtonVariant;
  progressPercent?: number; // Optional exact percentage 0-100
  showStatusBadge?: boolean;
  badgeLabel?: string;
  className?: string;
  children: React.ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, {
  active: string;
  inProgressFill: string;
  badgeActive: string;
  badgeDisabled: string;
  badgeInProgress: string;
}> = {
  cyan: {
    active: 'border-cyan-600/70 bg-cyan-950/50 text-cyan-200 hover:bg-cyan-900/60 hover:border-cyan-500 shadow-cyan-950/50',
    inProgressFill: 'from-cyan-700/60 via-cyan-500/80 to-cyan-400/60',
    badgeActive: 'bg-cyan-900/80 text-cyan-300 border-cyan-700/60',
    badgeDisabled: 'bg-neutral-900/80 text-gray-500 border-neutral-800',
    badgeInProgress: 'bg-cyan-950 text-cyan-300 border-cyan-500/80 animate-pulse',
  },
  emerald: {
    active: 'border-emerald-600/70 bg-emerald-950/50 text-emerald-200 hover:bg-emerald-900/60 hover:border-emerald-500 shadow-emerald-950/50',
    inProgressFill: 'from-emerald-700/60 via-emerald-500/80 to-emerald-400/60',
    badgeActive: 'bg-emerald-900/80 text-emerald-300 border-emerald-700/60',
    badgeDisabled: 'bg-neutral-900/80 text-gray-500 border-neutral-800',
    badgeInProgress: 'bg-emerald-950 text-emerald-300 border-emerald-500/80 animate-pulse',
  },
  amber: {
    active: 'border-amber-600/70 bg-amber-950/50 text-amber-200 hover:bg-amber-900/60 hover:border-amber-500 shadow-amber-950/50',
    inProgressFill: 'from-amber-700/60 via-amber-500/80 to-amber-400/60',
    badgeActive: 'bg-amber-900/80 text-amber-300 border-amber-700/60',
    badgeDisabled: 'bg-neutral-900/80 text-gray-500 border-neutral-800',
    badgeInProgress: 'bg-amber-950 text-amber-300 border-amber-500/80 animate-pulse',
  },
  violet: {
    active: 'border-violet-600/70 bg-violet-950/50 text-violet-200 hover:bg-violet-900/60 hover:border-violet-500 shadow-violet-950/50',
    inProgressFill: 'from-violet-700/60 via-violet-500/80 to-violet-400/60',
    badgeActive: 'bg-violet-900/80 text-violet-300 border-violet-700/60',
    badgeDisabled: 'bg-neutral-900/80 text-gray-500 border-neutral-800',
    badgeInProgress: 'bg-violet-950 text-violet-300 border-violet-500/80 animate-pulse',
  },
  red: {
    active: 'border-red-700/70 bg-red-950/50 text-red-200 hover:bg-red-900/60 hover:border-red-500 shadow-red-950/50',
    inProgressFill: 'from-red-700/60 via-red-500/80 to-red-400/60',
    badgeActive: 'bg-red-900/80 text-red-300 border-red-700/60',
    badgeDisabled: 'bg-neutral-900/80 text-gray-500 border-neutral-800',
    badgeInProgress: 'bg-red-950 text-red-300 border-red-500/80 animate-pulse',
  },
  neutral: {
    active: 'border-neutral-700 bg-neutral-900/60 text-gray-200 hover:bg-neutral-800/80 hover:border-neutral-500',
    inProgressFill: 'from-neutral-700/60 via-neutral-500/80 to-neutral-400/60',
    badgeActive: 'bg-neutral-800 text-gray-300 border-neutral-700',
    badgeDisabled: 'bg-neutral-900 text-gray-500 border-neutral-800',
    badgeInProgress: 'bg-neutral-900 text-gray-300 border-neutral-600 animate-pulse',
  },
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  status: explicitStatus,
  isLoading = false,
  isDisabled = false,
  disabledReason,
  variant = 'cyan',
  progressPercent,
  showStatusBadge = true,
  badgeLabel,
  className = '',
  disabled,
  onClick,
  children,
  ...restProps
}) => {
  // Determine effective status
  let currentStatus: ButtonStatus = 'active';
  if (isLoading || explicitStatus === 'in_progress') {
    currentStatus = 'in_progress';
  } else if (isDisabled || disabled || explicitStatus === 'disabled') {
    currentStatus = 'disabled';
  } else if (explicitStatus) {
    currentStatus = explicitStatus;
  }

  const vStyles = VARIANT_STYLES[variant] || VARIANT_STYLES.cyan;

  // Base layout styles
  const baseClasses =
    'relative overflow-hidden group flex items-center justify-between gap-2 px-3 py-2 text-[11px] font-semibold rounded-md border transition-all duration-200 shadow-sm select-none';

  let statusClasses = '';
  if (currentStatus === 'in_progress') {
    statusClasses = 'cursor-wait border-cyan-500/80 bg-neutral-950 text-white shadow-cyan-900/30';
  } else if (currentStatus === 'disabled') {
    statusClasses = 'cursor-not-allowed opacity-60 bg-neutral-900/60 text-gray-400 border-neutral-800/80 shadow-none';
  } else {
    statusClasses = `cursor-pointer ${vStyles.active}`;
  }

  return (
    <button
      type="button"
      disabled={currentStatus === 'disabled' || currentStatus === 'in_progress'}
      onClick={currentStatus === 'active' ? onClick : undefined}
      title={disabledReason && currentStatus === 'disabled' ? disabledReason : undefined}
      className={`${baseClasses} ${statusClasses} ${className}`}
      {...restProps}
    >
      {/* Crawling Progress Bar Overlay when in_progress */}
      {currentStatus === 'in_progress' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-md">
          {/* Background fill crawling */}
          <div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${vStyles.inProgressFill} ${
              progressPercent === undefined ? 'animate-progress-crawl' : 'transition-all duration-300 ease-out'
            }`}
            style={{
              width: progressPercent !== undefined ? `${Math.min(100, Math.max(0, progressPercent))}%` : undefined,
            }}
          />
          {/* Light Shimmer Effect over progress bar */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-slide" />
        </div>
      )}

      {/* Button Content */}
      <div className="relative z-10 flex items-center gap-2 min-w-0 flex-1 text-left">
        {currentStatus === 'in_progress' && (
          <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
        )}
        <span className="truncate leading-tight">{children}</span>
      </div>

      {/* Status Badge (Disabled / In Progress / Explicit custom label) */}
      {showStatusBadge && (
        <span className="relative z-10 shrink-0">
          {currentStatus === 'active' && badgeLabel && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-normal ${vStyles.badgeActive}`}>
              {badgeLabel}
            </span>
          )}

          {currentStatus === 'disabled' && (disabledReason || badgeLabel) && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-normal ${vStyles.badgeDisabled}`}>
              {badgeLabel || `Откл: ${disabledReason}`}
            </span>
          )}

          {currentStatus === 'in_progress' && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-bold ${vStyles.badgeInProgress}`}>
              {badgeLabel || (progressPercent !== undefined ? `В работе ${Math.round(progressPercent)}%` : 'В работе...')}
            </span>
          )}
        </span>
      )}
    </button>
  );
};
