import { useCallback, useEffect, useState } from 'react';

export type MobileView = 'map' | 'menu' | 'details' | 'settings';

interface MobileHistoryState {
  readonly ricisMobileView?: MobileView;
}

function currentHistoryView(): MobileView {
  if (typeof window === 'undefined') return 'map';
  const state = window.history.state as MobileHistoryState | null;
  return state?.ricisMobileView ?? 'map';
}

/**
 * A small browser-history-backed navigator for the independent mobile shell.
 * It keeps mobile menu/details/settings separate from the 3D map without
 * affecting desktop navigation or the shared node URL deep-link.
 */
export function useMobileViewStack(enabled: boolean) {
  const [view, setView] = useState<MobileView>(() => (enabled ? currentHistoryView() : 'map'));

  useEffect(() => {
    if (!enabled) {
      setView('map');
      return undefined;
    }

    const onPopState = () => setView(currentHistoryView());
    window.addEventListener('popstate', onPopState);
    setView(currentHistoryView());
    return () => window.removeEventListener('popstate', onPopState);
  }, [enabled]);

  const open = useCallback((nextView: MobileView) => {
    if (!enabled || typeof window === 'undefined') return;
    if (nextView === view) return;

    window.history.pushState(
      { ...(window.history.state || {}), ricisMobileView: nextView } satisfies MobileHistoryState,
      '',
      window.location.href,
    );
    setView(nextView);
  }, [enabled, view]);

  const back = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return false;
    if (view === 'map') return false;
    window.history.back();
    return true;
  }, [enabled, view]);

  return { view, open, back } as const;
}
