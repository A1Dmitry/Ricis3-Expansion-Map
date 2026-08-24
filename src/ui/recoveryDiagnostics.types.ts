export type RecoveryDiagnosticFieldId =
  | 'code'
  | 'origin'
  | 'runtime'
  | 'retryable'
  | 'httpStatus'
  | 'parserPosition'
  | 'occurredAt';

export interface RecoveryDiagnosticField {
  readonly id: RecoveryDiagnosticFieldId;
  readonly label: string;
  readonly value: string;
}

export interface RecoveryDiagnosticProjection {
  readonly fields: readonly RecoveryDiagnosticField[];
  readonly clipboardText: string;
}

export type HealthProbeViewState =
  | Readonly<{ readonly kind: 'idle'; readonly message: null }>
  | Readonly<{ readonly kind: 'checking'; readonly message: string }>
  | Readonly<{ readonly kind: 'available'; readonly message: string }>
  | Readonly<{ readonly kind: 'unavailable'; readonly message: string }>;
