// ============================================================================
// SETTINGS PANEL ELEMENTS — SHARED WIRING (DRY)
// Single source of truth for the adaptive-UI element list used by BOTH the
// Map3D settings modal and the standalone settings applet (?applet=settings).
// Both surfaces read/write the same localStorage keys, so roles and panel
// visibility stay consistent across applet switches.
// ============================================================================

import type { AdaptiveUIConfig } from '../../hooks/useAdaptiveUI';
import type { UIElement } from './uiElement.types';

/** Identifiers of the map sidebar panels configurable from settings. */
export type SettingsPanelId = 'actions' | 'zones' | 'available' | 'agent' | 'persistence';

export const SETTINGS_PANEL_ELEMENTS: UIElement[] = [
  { id: 'actions', label: '', labelKey: 'panel.actions' },
  { id: 'zones', label: '', labelKey: 'panel.zones' },
  { id: 'available', label: '', labelKey: 'panel.available' },
  { id: 'agent', label: '', labelKey: 'panel.agent' },
  { id: 'persistence', label: '', labelKey: 'panel.persistence' },
];

/**
 * The adaptive-UI configuration shared by Map3D and the settings applet.
 * The storage key stays the default ('ricis_adaptive_ui').
 */
export const SETTINGS_ADAPTIVE_UI_CONFIG: AdaptiveUIConfig = {
  elements: SETTINGS_PANEL_ELEMENTS,
  maxVisible: 3,
  decayInterval: 10,
  decayFactor: 0.9,
  hysteresisDelta: 0.03,
};

/** localStorage key for panels manually disabled by the user. */
export const DISABLED_PANEL_IDS_STORAGE_KEY = 'ricis_disabled_panel_ids';
