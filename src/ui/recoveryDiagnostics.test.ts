import { describe, expect, it } from 'vitest';
import type { StoredCoreRecovery } from '../services/coreRecovery';
import {
  projectRecoveryDiagnostics,
  toHealthProbeViewState,
} from './recoveryDiagnostics';

const recoveryFixture: StoredCoreRecovery = {
  code: 'CORE_INPUT_REJECTED',
  userMessage: 'proof.core.gateway.CORE_INPUT_REJECTED',
  diagnostic: {
    origin: 'proof_console',
    runtime: 'csharp_api',
    retryable: false,
    httpStatus: 422,
    parserPosition: 17,
    safeDetail: 'Expression: x => secretToken / 0\nStack: hidden',
    occurredAt: 1_700_000_000_000,
  },
};

describe('recovery diagnostics projection', () => {
  it('projects only typed recovery metadata in a stable ordered inventory', () => {
    const projection = projectRecoveryDiagnostics(recoveryFixture);

    expect(projection.fields).toEqual([
      { id: 'code', label: 'Код', value: 'CORE_INPUT_REJECTED' },
      { id: 'origin', label: 'Точка вызова', value: 'proof_console' },
      { id: 'runtime', label: 'Runtime', value: 'csharp_api' },
      { id: 'retryable', label: 'Повторная проверка', value: 'Сначала исправьте ввод или конфигурацию' },
      { id: 'httpStatus', label: 'HTTP status', value: '422' },
      { id: 'parserPosition', label: 'Позиция парсера', value: '17' },
      { id: 'occurredAt', label: 'Время события', value: '2023-11-14T22:13:20.000Z' },
    ]);
  });

  it('never leaks safeDetail, expression-like content, user message or hidden values into the visual projection or clipboard', () => {
    const projection = projectRecoveryDiagnostics(recoveryFixture);
    const serialized = JSON.stringify(projection);

    expect(serialized).not.toContain('safeDetail');
    expect(serialized).not.toContain('secretToken');
    expect(serialized).not.toContain('Expression:');
    expect(serialized).not.toContain('Stack:');
    expect(serialized).not.toContain(recoveryFixture.userMessage);
    expect(projection.clipboardText).toBe([
      'RICIS Core recovery code: CORE_INPUT_REJECTED',
      'Origin: proof_console',
      'Runtime: csharp_api',
      'Retryable: false',
      'HTTP status: 422',
      'Parser position: 17',
      'Occurred at: 2023-11-14T22:13:20.000Z',
    ].join('\n'));
  });

  it('omits optional numeric fields cleanly while preserving the exact failure type and retryability', () => {
    const projection = projectRecoveryDiagnostics({
      ...recoveryFixture,
      code: 'CORE_UNAVAILABLE',
      diagnostic: {
        ...recoveryFixture.diagnostic,
        retryable: true,
        httpStatus: undefined,
        parserPosition: undefined,
      },
    });

    expect(projection.fields.map(field => field.id)).toEqual([
      'code',
      'origin',
      'runtime',
      'retryable',
      'occurredAt',
    ]);
    expect(projection.fields.find(field => field.id === 'retryable')).toEqual({
      id: 'retryable',
      label: 'Повторная проверка',
      value: 'Можно повторить health-check',
    });
    expect(projection.clipboardText).not.toMatch(/HTTP status|Parser position|safeDetail|secretToken/);
  });

  it('projects health state from availability only and never carries arbitrary safeDetail into presentation state', () => {
    expect(toHealthProbeViewState({ available: true, safeDetail: 'do not render this' })).toEqual({
      kind: 'available',
      message: 'Ricis.Core подтвердил ready status. Старый proof-запрос не повторялся.',
    });
    expect(toHealthProbeViewState({ available: false, safeDetail: 'x => secretToken' })).toEqual({
      kind: 'unavailable',
      message: 'Health endpoint пока не подтвердил доступность Core. Старый proof-запрос не повторялся.',
    });
  });
});
