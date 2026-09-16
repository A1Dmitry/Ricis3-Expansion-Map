// ============================================================================
// SHARED ADAPTIVE UI ELEMENT CATALOG (single source of truth)
// Used by both Map3D and the Settings applet (BUG-03): the settings surface
// must configure exactly the panels the map surface renders.
// ============================================================================

import type { UIElement } from './uiElement.types';

export const UI_ELEMENTS: readonly UIElement[] = [
  { id: 'actions', label: '', labelKey: 'panel.actions' },
  { id: 'zones', label: '', labelKey: 'panel.zones' },
  { id: 'available', label: '', labelKey: 'panel.available' },
  { id: 'agent', label: '', labelKey: 'panel.agent' },
  { id: 'persistence', label: '', labelKey: 'panel.persistence' },
];
