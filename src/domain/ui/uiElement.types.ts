/** Shared identity and presentation label for a configurable UI element. */
import type { TranslationKey } from '../../model/i18n.types';

export interface UIElement {
  id: string;
  /** Legacy fallback label retained for compatibility; UI should prefer labelKey. */
  label: string;
  /** Optional resource key for culture-aware rendering. */
  labelKey?: TranslationKey;
}

/** Visibility state of a UI element in the settings surface. */
export interface UIElementToggle extends UIElement {
  isVisible: boolean;
}
