import type { CoreHealthProbeResult, StoredCoreRecovery } from '../services/coreRecovery';
import type {
  HealthProbeViewState,
  RecoveryDiagnosticField,
  RecoveryDiagnosticProjection,
} from './recoveryDiagnostics.types';

function retryabilityLabel(retryable: boolean): string {
  return retryable ? 'Можно повторить health-check' : 'Сначала исправьте ввод или конфигурацию';
}

function toFieldInventory(recovery: StoredCoreRecovery): readonly RecoveryDiagnosticField[] {
  const fields: RecoveryDiagnosticField[] = [
    { id: 'code', label: 'Код', value: recovery.code },
    { id: 'origin', label: 'Точка вызова', value: recovery.diagnostic.origin },
    { id: 'runtime', label: 'Runtime', value: recovery.diagnostic.runtime },
    { id: 'retryable', label: 'Повторная проверка', value: retryabilityLabel(recovery.diagnostic.retryable) },
  ];

  if (recovery.diagnostic.httpStatus !== undefined) {
    fields.push({ id: 'httpStatus', label: 'HTTP status', value: String(recovery.diagnostic.httpStatus) });
  }

  if (recovery.diagnostic.parserPosition !== undefined) {
    fields.push({ id: 'parserPosition', label: 'Позиция парсера', value: String(recovery.diagnostic.parserPosition) });
  }

  fields.push({
    id: 'occurredAt',
    label: 'Время события',
    value: new Date(recovery.diagnostic.occurredAt).toISOString(),
  });

  return fields;
}

function toClipboardText(recovery: StoredCoreRecovery, fields: readonly RecoveryDiagnosticField[]): string {
  const fieldValues = new Map(fields.map(field => [field.id, field.value]));
  const lines = [
    `RICIS Core recovery code: ${fieldValues.get('code')}`,
    `Origin: ${fieldValues.get('origin')}`,
    `Runtime: ${fieldValues.get('runtime')}`,
    `Retryable: ${recovery.diagnostic.retryable}`,
  ];
  const httpStatus = fieldValues.get('httpStatus');
  const parserPosition = fieldValues.get('parserPosition');

  if (httpStatus !== undefined) lines.push(`HTTP status: ${httpStatus}`);
  if (parserPosition !== undefined) lines.push(`Parser position: ${parserPosition}`);
  lines.push(`Occurred at: ${fieldValues.get('occurredAt')}`);

  return lines.join('\n');
}

/**
 * Builds the single display-and-copy projection for typed recovery metadata.
 * Opaque recovery text is deliberately outside the closed field inventory.
 */
export function projectRecoveryDiagnostics(recovery: StoredCoreRecovery): RecoveryDiagnosticProjection {
  const fields = toFieldInventory(recovery);
  return {
    fields,
    clipboardText: toClipboardText(recovery, fields),
  };
}

/**
 * Reduces a health result to availability semantics only; a ready health response never retries old work.
 */
export function toHealthProbeViewState(result: CoreHealthProbeResult): HealthProbeViewState {
  return result.available
    ? {
      kind: 'available',
      message: 'Ricis.Core подтвердил ready status. Старый proof-запрос не повторялся.',
    }
    : {
      kind: 'unavailable',
      message: 'Health endpoint пока не подтвердил доступность Core. Старый proof-запрос не повторялся.',
    };
}

export function toCheckingHealthProbeViewState(): HealthProbeViewState {
  return {
    kind: 'checking',
    message: 'Проверка health endpoint Ricis.Core…',
  };
}

export function toIdleHealthProbeViewState(): HealthProbeViewState {
  return { kind: 'idle', message: null };
}
