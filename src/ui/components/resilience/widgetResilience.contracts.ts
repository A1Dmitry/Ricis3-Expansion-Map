// ============================================================================
// RICIS-III RESILIENCE & WIDGET CAPABILITY BOUNDARY CONTRACTS (DDD / SOLID)
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import type { ReactNode } from 'react';

export type WidgetResilienceMode = 'INLINE_STUB' | 'CARD_STUB' | 'FULL_CONTAINER_STUB';

export interface IWidgetFailureContext {
  readonly componentName: string;
  readonly error?: Error | unknown;
  readonly resetError: () => void;
  readonly fallbackAction?: () => void;
}

export interface IWidgetCapabilityBoundaryProps {
  readonly componentName: string;
  readonly title?: string;
  readonly mode?: WidgetResilienceMode;
  readonly requiredCapability?: string;
  readonly isCapabilitySupported?: boolean;
  readonly fallbackNode?: ReactNode | ((ctx: IWidgetFailureContext) => ReactNode);
  readonly children: ReactNode;
  readonly onReset?: () => void;
}

export interface IWidgetBoundaryState {
  readonly hasError: boolean;
  readonly error?: Error;
}
