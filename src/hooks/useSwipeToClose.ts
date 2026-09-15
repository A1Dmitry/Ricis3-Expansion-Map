import { useCallback, useEffect, useRef } from 'react';
import type React from 'react';
import {
  classifySwipeToClose,
  isSwipeDismissBlockedByScroll,
  SWIPE_TO_CLOSE_THRESHOLDS,
  type SwipeDirection,
  type SwipeSample,
  type SwipeToCloseThresholds,
} from './mobileGestures';

// ============================================================================
// SWIPE-TO-CLOSE HOOK (MVVM / SOLID)
// Turns the pure swipe classification contract from mobileGestures.ts into
// spreadable React pointer handlers for applet panels, drawers and overlays.
// Only real touch pointers are tracked, so mouse-first desktop interaction is
// never affected; nested dismissible surfaces keep ownership of the gesture.
// ============================================================================

export interface SwipeToCloseOptions {
  /** Direction the finger must travel to dismiss the surface. */
  readonly direction: SwipeDirection;
  /** Invoked once per recognized dismiss gesture. */
  readonly onDismiss: () => void;
  /** Master switch; surfaces typically bind this to the mobile layout query. */
  readonly enabled?: boolean;
  /** Optional override of the shared flick thresholds. */
  readonly thresholds?: Partial<SwipeToCloseThresholds>;
}

export interface SwipeToCloseHandlers {
  readonly 'data-swipe-dismiss': SwipeDirection;
  readonly onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  readonly onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
  readonly onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
  readonly onPointerCancel: (event: React.PointerEvent<HTMLElement>) => void;
}

interface TrackedSwipe {
  readonly pointerId: number;
  readonly start: SwipeSample;
  latest: SwipeSample;
}

function sampleFromEvent(event: React.PointerEvent<HTMLElement>, time: number): SwipeSample {
  return { time, x: event.clientX, y: event.clientY };
}

/**
 * Walks from the gesture target up to the listening surface and reports
 * whether any scrollable ancestor still owns the vertical scroll offset.
 */
function isGestureBlockedByScrolling(
  target: EventTarget | null,
  surface: HTMLElement,
  direction: SwipeDirection,
): boolean {
  let node = target instanceof Element ? target : null;
  while (node !== null) {
    const metrics = {
      scrollTop: node.scrollTop,
      scrollHeight: node.scrollHeight,
      clientHeight: node.clientHeight,
    };
    if (isSwipeDismissBlockedByScroll(direction, metrics)) return true;
    if (node === surface) break;
    node = node.parentElement;
  }
  return false;
}

export function useSwipeToClose(options: SwipeToCloseOptions): SwipeToCloseHandlers {
  const { direction, enabled = true } = options;

  // Latest options are kept in a ref so the returned handlers stay referentially
  // stable and freshly rendered onDismiss closures are never stale.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const trackingRef = useRef<TrackedSwipe | null>(null);

  useEffect(() => {
    if (!enabled) trackingRef.current = null;
  }, [enabled]);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const current = optionsRef.current;
    if (current.enabled === false) return;
    if (event.pointerType !== 'touch') return;

    // A nested dismissible surface (dialog over a modal) owns its own gesture.
    const target = event.target instanceof Element ? event.target : null;
    const nestedDismissable = target?.closest('[data-swipe-dismiss]') ?? null;
    if (nestedDismissable !== null && nestedDismissable !== event.currentTarget) return;

    if (isGestureBlockedByScrolling(event.target, event.currentTarget, current.direction)) return;

    const start = sampleFromEvent(event, performance.now());
    trackingRef.current = { pointerId: event.pointerId, start, latest: start };
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const tracking = trackingRef.current;
    if (tracking === null || tracking.pointerId !== event.pointerId) return;
    tracking.latest = sampleFromEvent(event, performance.now());
  }, []);

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const tracking = trackingRef.current;
    if (tracking === null || tracking.pointerId !== event.pointerId) return;
    trackingRef.current = null;

    const current = optionsRef.current;
    if (current.enabled === false) return;

    const end = sampleFromEvent(event, performance.now());
    const thresholds: SwipeToCloseThresholds = {
      minDistancePx: current.thresholds?.minDistancePx ?? SWIPE_TO_CLOSE_THRESHOLDS.minDistancePx,
      maxDurationMs: current.thresholds?.maxDurationMs ?? SWIPE_TO_CLOSE_THRESHOLDS.maxDurationMs,
      maxCrossAxisRatio: current.thresholds?.maxCrossAxisRatio ?? SWIPE_TO_CLOSE_THRESHOLDS.maxCrossAxisRatio,
    };
    const classification = classifySwipeToClose(tracking.start, end, current.direction, thresholds);
    if (classification.isSwipeToClose) current.onDismiss();
  }, []);

  const onPointerCancel = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const tracking = trackingRef.current;
    if (tracking !== null && tracking.pointerId === event.pointerId) trackingRef.current = null;
  }, []);

  return { 'data-swipe-dismiss': direction, onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}
