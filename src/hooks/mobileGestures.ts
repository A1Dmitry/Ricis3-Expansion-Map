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
