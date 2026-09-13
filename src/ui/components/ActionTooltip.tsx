// ============================================================================
// RICIS-III ACTION TOOLTIP (MVVM / DRY / SOLID)
// Floating contextual tooltip with title, shortcut pill, and description
// ============================================================================

import React, { useState, useRef, type ReactNode } from 'react';

interface ActionTooltipProps {
  readonly title: string;
  readonly description?: string;
  readonly shortcut?: string;
  readonly disabledReason?: string;
  readonly children: ReactNode;
  readonly position?: 'top' | 'bottom';
}

export const ActionTooltip: React.FC<ActionTooltipProps> = ({
  title,
  description,
  shortcut,
  disabledReason,
  children,
  position = 'bottom',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, 250);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-[100] px-2.5 py-1.5 min-w-[140px] max-w-[260px] bg-neutral-900/95 border border-neutral-700/80 rounded-md shadow-2xl backdrop-blur-md text-xs pointer-events-none transform -translate-x-1/2 left-1/2 transition-opacity duration-150 ${
            position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-1 mb-1">
            <span className="font-semibold text-slate-100">{title}</span>
            {shortcut && (
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-neutral-800 border border-neutral-700 rounded text-cyan-300">
                {shortcut}
              </kbd>
            )}
          </div>

          {description && (
            <p className="text-[11px] leading-tight text-slate-300 text-left mb-1">
              {description}
            </p>
          )}

          {disabledReason && (
            <div className="text-[10px] text-amber-400/90 font-mono italic">
              {disabledReason}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
