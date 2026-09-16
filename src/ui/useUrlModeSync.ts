// ============================================================================
// BUG-13: `?mode=` (verify/proof/challenge/explore) must follow SPA
// navigation, not just the first mount.
//
// UrlShareService.updateBrowserUrl dispatches a synthetic `popstate` after
// every internal URL rewrite, and the browser fires `popstate` on real
// back/forward — so listening here keeps any component in sync with the
// live URL without extra plumbing.
// ============================================================================

import { useEffect } from 'react';
import { UrlShareService } from '../services/UrlShareService';

/** Returns true when the given URL `mode` parameter opens the proof panel. */
export function urlModeOpensProof(mode: string | null): boolean {
  return mode === 'verify' || mode === 'proof';
}

/**
 * Subscribes `setOpen` to the live `?mode=` URL parameter.
 *
 * - `mode=verify|proof` → panel opens;
 * - any other value (challenge/explore/absent) → panel closes.
 */
export function useUrlModeSync(setOpen: (open: boolean) => void): void {
  useEffect(() => {
    const handleModeSync = () => {
      const { initialMode } = UrlShareService.parseInitialParams();
      setOpen(urlModeOpensProof(initialMode));
    };
    window.addEventListener('popstate', handleModeSync);
    return () => window.removeEventListener('popstate', handleModeSync);
  }, []);
}
