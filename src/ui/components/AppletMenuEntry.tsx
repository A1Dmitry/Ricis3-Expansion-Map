import type { AppletId } from '../../types/appletRegistry';
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { ContentButton, ContentLink } from './ContentButton';
import { buildAppletDeepLink } from '../../services/appletDeepLinks';
import { APPLET_DEFINITIONS } from '../../types/appletRegistry';

/**
 * Applet menu entry that ALWAYS offers a reliable in-tab button plus a
 * secondary «new tab» link.
 *
 * Rationale (2026-09-20): in preview / iframe sandbox environments the browser
 * popup blocker silently consumes `target="_blank"` anchor clicks, which made
 * every satellite applet (kinematic, seed, comparison, roadmap, voynich,
 * qa-tests) appear «dead» from the menu. The primary action now is a plain
 * <button> that calls `onSelectApplet(...)` synchronously (cannot be blocked);
 * a small secondary link still offers the new-tab behaviour for users who
 * want to keep the map alive per UI_NAVIGATION_AUDIT.
 */
export const AppletMenuEntry: React.FC<{
  applet: AppletId;
  onSelectApplet: (a: AppletId) => void;
  onAfterClick: () => void;
  className?: string;
  children: React.ReactNode;
  /** If true, render only the in-tab button (no secondary new-tab link). */
  inTabOnly?: boolean;
  newTabLabel?: string;
}> = ({ applet, onSelectApplet, onAfterClick, className, children, inTabOnly = false, newTabLabel = 'Открыть в новой вкладке' }) => (
  <>
    <ContentButton
      role="menuitem"
      type="button"
      onClick={() => { onSelectApplet(applet); onAfterClick(); }}
      title={`${APPLET_DEFINITIONS[applet]?.title ?? applet} — открыть в этой вкладке`}
      className={`menu-command ${className ?? ''}`}
    >
      {children}
    </ContentButton>
    {!inTabOnly && (
      <ContentLink
        role="menuitem"
        href={buildAppletDeepLink(applet)}
        target="_blank"
        rel="noopener noreferrer"
        title={`${APPLET_DEFINITIONS[applet]?.title ?? applet} — открыть в новой вкладке (карта не закроется)`}
        onClick={onAfterClick}
        className="menu-command w-full px-3 py-1 text-left flex items-center gap-2 text-slate-500 hover:bg-neutral-800/60 hover:text-slate-300 transition-colors text-[11px]"
      >
        <span className="w-[13px]" />
        <span className="flex-1">{newTabLabel}</span>
        <ExternalLink size={10} aria-hidden className="shrink-0 opacity-60" />
      </ContentLink>
    )}
  </>
);
