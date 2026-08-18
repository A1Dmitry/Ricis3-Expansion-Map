/** Shared identity and presentation label for a configurable UI element. */
export interface UIElement {
  id: string;
  label: string;
}

/** Visibility state of a UI element in the settings surface. */
export interface UIElementToggle extends UIElement {
  isVisible: boolean;
}
