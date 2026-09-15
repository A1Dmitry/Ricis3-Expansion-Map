export const DOUBLE_TAP_MAX_DELAY_MS = 300;
export const DOUBLE_TAP_MAX_DISTANCE_PX = 48;

export interface TapPoint {
  readonly time: number;
  readonly x: number;
  readonly y: number;
}

/** A double tap must be both close in time and spatially local. */
export function isDoubleTap(previous: TapPoint | null, next: TapPoint): boolean {
  if (!previous) return false;
  if (next.time < previous.time || next.time - previous.time > DOUBLE_TAP_MAX_DELAY_MS) return false;
  return Math.hypot(next.x - previous.x, next.y - previous.y) <= DOUBLE_TAP_MAX_DISTANCE_PX;
}

// ============================================================================
// SWIPE-TO-CLOSE GESTURE CONTRACT (pure classification, no DOM dependency)
// A dismiss swipe must be dominant along its axis, cover a minimal distance
// and stay inside a flick-like duration window so ordinary scrolling and
// hesitant drags never close applet panels by accident.
// ============================================================================

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface SwipeSample {
  readonly time: number;
  readonly x: number;
  readonly y: number;
}

export interface SwipeToCloseThresholds {
  /** Minimal displacement along the dismiss axis, in CSS pixels. */
  readonly minDistancePx: number;
  /** A dismiss swipe is a deliberate flick, not a slow drag. */
  readonly maxDurationMs: number;
  /** Cross-axis drift allowed relative to the axis displacement. */
  readonly maxCrossAxisRatio: number;
}

export const SWIPE_TO_CLOSE_THRESHOLDS: SwipeToCloseThresholds = {
  minDistancePx: 64,
  maxDurationMs: 900,
  maxCrossAxisRatio: 0.8,
};

export interface SwipeToCloseClassification {
  readonly isSwipeToClose: boolean;
  readonly axisDistancePx: number;
  readonly crossAxisDistancePx: number;
  readonly durationMs: number;
}

const SWIPE_AXIS_VECTORS: Readonly<Record<SwipeDirection, { readonly x: number; readonly y: number }>> = {
  right: { x: 1, y: 0 },
  left: { x: -1, y: 0 },
  down: { x: 0, y: 1 },
  up: { x: 0, y: -1 },
};

/**
 * Classifies a touch gesture between two samples against a dismiss direction.
 * Pure and total: reversed or stalled clocks and negative displacements are
 * rejected instead of producing NaN-like ambiguity.
 */
export function classifySwipeToClose(
  start: SwipeSample,
  end: SwipeSample,
  direction: SwipeDirection,
  thresholds: SwipeToCloseThresholds = SWIPE_TO_CLOSE_THRESHOLDS,
): SwipeToCloseClassification {
  const axis = SWIPE_AXIS_VECTORS[direction];
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const axisDistancePx = deltaX * axis.x + deltaY * axis.y;
  const crossAxisDistancePx = Math.abs(deltaX * axis.y - deltaY * axis.x);
  const durationMs = end.time - start.time;

  const isSwipeToClose =
    durationMs >= 0 &&
    durationMs <= thresholds.maxDurationMs &&
    axisDistancePx >= thresholds.minDistancePx &&
    crossAxisDistancePx <= axisDistancePx * thresholds.maxCrossAxisRatio;

  return { isSwipeToClose, axisDistancePx, crossAxisDistancePx, durationMs };
}

export interface ScrollContainerMetrics {
  readonly scrollTop: number;
  readonly scrollHeight: number;
  readonly clientHeight: number;
}

/**
 * Vertical dismiss swipes must not hijack an in-progress content scroll:
 * swiping down is only a dismiss when the scroller is already at its top,
 * swiping up only when it is already at its bottom. Horizontal dismiss
 * directions never compete with vertical scrolling.
 */
export function isSwipeDismissBlockedByScroll(
  direction: SwipeDirection,
  metrics: ScrollContainerMetrics,
): boolean {
  if (direction === 'left' || direction === 'right') return false;
  const hasVerticalOverflow = metrics.scrollHeight - metrics.clientHeight > 1;
  if (!hasVerticalOverflow) return false;
  if (direction === 'down') return metrics.scrollTop > 0;
  return metrics.scrollTop + metrics.clientHeight < metrics.scrollHeight - 1;
}
