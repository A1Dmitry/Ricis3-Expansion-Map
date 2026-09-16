// ============================================================================
// SHARED USER-DISABLED PANELS (BUG-03)
// Both Map3D and the Settings applet must show and persist exactly the same
// user-disabled panel list (localStorage-backed, single storage key).
// ============================================================================

import { useCallback, useState } from 'react';

const STORAGE_KEY = 'ricis_disabled_panel_ids';

export function useUserDisabledPanels(): [Set<string>, (panelId: string) => void] {
  const [userDisabledPanelIds, setUserDisabledPanelIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  const togglePanelVisibility = useCallback((panelId: string) => {
    setUserDisabledPanelIds((prev) => {
      const next = new Set(prev);
      if (next.has(panelId)) {
        next.delete(panelId);
      } else {
        next.add(panelId);
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error('Failed to save disabled panels', e);
      }
      return next;
    });
  }, []);

  return [userDisabledPanelIds, togglePanelVisibility];
}
