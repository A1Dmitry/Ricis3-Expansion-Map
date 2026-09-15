import React from 'react';
import { useSwipeToClose } from '../../hooks/useSwipeToClose';
import type { SwipeDirection, SwipeToCloseThresholds } from '../../hooks/mobileGestures';

// ============================================================================
// SWIPE-DISMISSABLE SURFACE (MVVM / DRY)
// Zero-layout wrapper (display: contents) that adds the shared mobile
// swipe-to-close gesture to any applet panel, drawer, dialog or overlay
// without touching the wrapped component's own markup or stacking context.
// ============================================================================

interface SwipeDismissableProps {
  /** Direction the finger must travel to dismiss the wrapped surface. */
  readonly direction: SwipeDirection;
  /** Invoked once per recognized dismiss gesture. */
  readonly onDismiss: () => void;
  /** Master switch; callers typically bind this to the mobile layout query. */
  readonly enabled?: boolean;
  /** Optional override of the shared flick thresholds. */
  readonly thresholds?: Partial<SwipeToCloseThresholds>;
  readonly children: React.ReactNode;
}

export const SwipeDismissable: React.FC<SwipeDismissableProps> = ({
  direction,
  onDismiss,
  enabled = true,
  thresholds,
  children,
}) => {
  const swipeHandlers = useSwipeToClose({ direction, onDismiss, enabled, thresholds });

  return (
    <div className="contents" {...swipeHandlers}>
      {children}
    </div>
  );
};
