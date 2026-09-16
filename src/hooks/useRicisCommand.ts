// ============================================================================
// REACT BINDING FOR THE RICIS COMMAND BUS (DRY)
// One hook for every applet-page subscription; auto-unsubscribes on unmount.
// ============================================================================

import { useEffect, useRef } from 'react';
import {
  type RicisCommandEventDetailMap,
  type RicisCommandEventName,
  subscribeRicisCommand,
} from '../services/commandBus';

type EventDetail<E extends RicisCommandEventName> =
  E extends keyof RicisCommandEventDetailMap ? RicisCommandEventDetailMap[E] : undefined;

/**
 * Subscribes `handler` to a command bus event for the lifetime of the component.
 * The latest handler is always invoked (no stale closure churn).
 */
export function useRicisCommand<E extends RicisCommandEventName>(
  event: E,
  handler: (detail: EventDetail<E>) => void,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    return subscribeRicisCommand(event, (detail) => {
      handlerRef.current(detail);
    });
  }, [event]);
}
