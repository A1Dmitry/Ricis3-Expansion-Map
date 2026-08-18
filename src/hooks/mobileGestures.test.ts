import { describe, expect, it } from 'vitest';
import {
  DOUBLE_TAP_MAX_DELAY_MS,
  DOUBLE_TAP_MAX_DISTANCE_PX,
  isDoubleTap,
} from './mobileGestures';

describe('mobile double-tap contract', () => {
  const firstTap = { time: 1000, x: 80, y: 120 };

  it('accepts a nearby second touch inside the 300ms interaction window', () => {
    expect(isDoubleTap(firstTap, { time: firstTap.time + DOUBLE_TAP_MAX_DELAY_MS, x: 104, y: 136 })).toBe(true);
  });

  it('rejects a delayed second touch', () => {
    expect(isDoubleTap(firstTap, { time: firstTap.time + DOUBLE_TAP_MAX_DELAY_MS + 1, x: 80, y: 120 })).toBe(false);
  });

  it('rejects a remote touch even when it is quick', () => {
    expect(isDoubleTap(firstTap, { time: firstTap.time + 120, x: firstTap.x + DOUBLE_TAP_MAX_DISTANCE_PX + 1, y: firstTap.y })).toBe(false);
  });

  it('does not treat a first touch or a clock rollback as a double tap', () => {
    expect(isDoubleTap(null, firstTap)).toBe(false);
    expect(isDoubleTap(firstTap, { time: 999, x: 80, y: 120 })).toBe(false);
  });
});
