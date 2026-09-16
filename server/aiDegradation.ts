/**
 * BUG-06: Единый контракт деградации для ВСЕХ AI-зависимых эндпоинтов.
 *
 * Контракт (принят в FULL_AUDIT_REPORT §3 BUG-06, вариант "degraded-поле",
 * т.к. локальный канонический черновик — документированный фолбэк, а не
 * ошибка сервера, поэтому статус остаётся HTTP 200):
 *   - AI отработал успешно  → ответ БЕЗ поля `degraded`;
 *   - AI недоступен         → HTTP 200 + `degraded: "ai_unavailable"` +
 *                             человекочитаемое `error` (причина).
 *
 * UI обязан показывать причину из `error`, когда видит `degraded`.
 */

export const AI_DEGRADED_REASON = 'ai_unavailable';

export interface AiDegradedBody {
  degraded: typeof AI_DEGRADED_REASON;
  error: string;
}

/** Формирует единый деградационный фрагмент тела ответа. */
export function aiDegradedBody(error: unknown): AiDegradedBody {
  const message =
    error instanceof Error ? error.message : (typeof error === 'string' ? error : String(error));
  return { degraded: AI_DEGRADED_REASON, error: message };
}
