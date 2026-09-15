import { describe, expect, it } from 'vitest';
import {
  classifySwipeToClose,
  DOUBLE_TAP_MAX_DELAY_MS,
  DOUBLE_TAP_MAX_DISTANCE_PX,
  isDoubleTap,
  isSwipeDismissBlockedByScroll,
  SWIPE_TO_CLOSE_THRESHOLDS,
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

describe('swipe-to-close classification contract', () => {
  const start = { time: 1000, x: 200, y: 300 };
  const minDistance = SWIPE_TO_CLOSE_THRESHOLDS.minDistancePx;

  it('accepts a fast dominant swipe along each dismiss direction', () => {
    expect(classifySwipeToClose(start, { time: 1150, x: start.x + minDistance, y: start.y }, 'right').isSwipeToClose).toBe(true);
    expect(classifySwipeToClose(start, { time: 1150, x: start.x - minDistance, y: start.y }, 'left').isSwipeToClose).toBe(true);
    expect(classifySwipeToClose(start, { time: 1150, x: start.x, y: start.y + minDistance }, 'down').isSwipeToClose).toBe(true);
    expect(classifySwipeToClose(start, { time: 1150, x: start.x, y: start.y - minDistance }, 'up').isSwipeToClose).toBe(true);
  });

  it('rejects a swipe in the opposite direction of the dismiss axis', () => {
    expect(classifySwipeToClose(start, { time: 1150, x: start.x - minDistance, y: start.y }, 'right').isSwipeToClose).toBe(false);
    expect(classifySwipeToClose(start, { time: 1150, x: start.x, y: start.y - minDistance }, 'down').isSwipeToClose).toBe(false);
  });

  it('rejects a swipe shorter than the minimal dismiss distance', () => {
    const result = classifySwipeToClose(start, { time: 1100, x: start.x + minDistance - 1, y: start.y }, 'right');
    expect(result.isSwipeToClose).toBe(false);
    expect(result.axisDistancePx).toBe(minDistance - 1);
  });

  it('rejects a slow drag even when it covers the distance', () => {
    const result = classifySwipeToClose(
      start,
      { time: start.time + SWIPE_TO_CLOSE_THRESHOLDS.maxDurationMs + 1, x: start.x + minDistance * 3, y: start.y },
      'right',
    );
    expect(result.isSwipeToClose).toBe(false);
    expect(result.durationMs).toBe(SWIPE_TO_CLOSE_THRESHOLDS.maxDurationMs + 1);
  });

  it('rejects a diagonal gesture whose cross-axis drift exceeds the allowed ratio', () => {
    const result = classifySwipeToClose(start, { time: 1150, x: start.x + minDistance, y: start.y + minDistance }, 'right');
    expect(result.isSwipeToClose).toBe(false);
    expect(result.crossAxisDistancePx).toBe(minDistance);
  });

  it('tolerates cross-axis drift inside the configured ratio', () => {
    const drift = Math.floor(minDistance * SWIPE_TO_CLOSE_THRESHOLDS.maxCrossAxisRatio);
    expect(classifySwipeToClose(start, { time: 1150, x: start.x + minDistance, y: start.y + drift }, 'right').isSwipeToClose).toBe(true);
  });

  it('honours custom thresholds without mutating the shared contract', () => {
    const custom = { minDistancePx: 16, maxDurationMs: 2000, maxCrossAxisRatio: 1.5 };
    expect(classifySwipeToClose(start, { time: 1900, x: start.x + 20, y: start.y + 20 }, 'right', custom).isSwipeToClose).toBe(true);
    expect(SWIPE_TO_CLOSE_THRESHOLDS.minDistancePx).toBe(64);
  });

  it('rejects a rolled-back clock instead of producing an ambiguous duration', () => {
    expect(classifySwipeToClose(start, { time: 999, x: start.x + minDistance, y: start.y }, 'right').isSwipeToClose).toBe(false);
  });
});

describe('swipe-dismiss scroll obstruction contract', () => {
  const scrollable = { scrollTop: 40, scrollHeight: 400, clientHeight: 200 };
  const atTop = { scrollTop: 0, scrollHeight: 400, clientHeight: 200 };
  const atBottom = { scrollTop: 200, scrollHeight: 400, clientHeight: 200 };
  const nonScrollable = { scrollTop: 0, scrollHeight: 200, clientHeight: 200 };

  it('blocks a downward dismiss while the content is scrolled away from the top', () => {
    expect(isSwipeDismissBlockedByScroll('down', scrollable)).toBe(true);
    expect(isSwipeDismissBlockedByScroll('down', atTop)).toBe(false);
  });

  it('blocks an upward dismiss while more content remains below', () => {
    expect(isSwipeDismissBlockedByScroll('up', scrollable)).toBe(true);
    expect(isSwipeDismissBlockedByScroll('up', atBottom)).toBe(false);
  });

  it('never blocks horizontal dismiss directions with vertical scrolling', () => {
    expect(isSwipeDismissBlockedByScroll('left', scrollable)).toBe(false);
    expect(isSwipeDismissBlockedByScroll('right', scrollable)).toBe(false);
  });

  it('does not treat a non-overflowing container as a scroll obstruction', () => {
    expect(isSwipeDismissBlockedByScroll('down', nonScrollable)).toBe(false);
    expect(isSwipeDismissBlockedByScroll('up', nonScrollable)).toBe(false);
  });
});
