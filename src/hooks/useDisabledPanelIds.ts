// ============================================================================
// DISABLED PANEL IDS HOOK (DRY)
// Shared persistence-backed state for panels the user manually hid.
// Used by Map3D (live sidebar) and the settings applet (?applet=settings).
// ============================================================================

import { useCallback, useState } from 'react';
import { DISABLED_PANEL_IDS_STORAGE_KEY } from '../domain/ui/settingsElements';

function loadDisabledPanelIds(): Set<string> {
  try {
    const saved = localStorage.getItem(DISABLED_PANEL_IDS_STORAGE_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
}

export interface DisabledPanelIdsState {
  readonly userDisabledPanelIds: ReadonlySet<string>;
  readonly togglePanelVisibility: (panelId: string) => void;
}

export function useDisabledPanelIds(): DisabledPanelIdsState {
  const [userDisabledPanelIds, setUserDisabledPanelIds] = useState<Set<string>>(loadDisabledPanelIds);

  const togglePanelVisibility = useCallback((panelId: string) => {
    setUserDisabledPanelIds((prev) => {
      const next = new Set(prev);
      if (next.has(panelId)) {
        next.delete(panelId);
      } else {
        next.add(panelId);
      }
      try {
        localStorage.setItem(DISABLED_PANEL_IDS_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error('Failed to save disabled panels', e);
      }
      return next;
    });
  }, []);

  return { userDisabledPanelIds, togglePanelVisibility };
}
