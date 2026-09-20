/**
 * Safe JSON client for RICIS agent endpoints.
 * On GitHub Pages there is no Express server: /api/* returns HTML (SPA).
 * This helper detects that and returns a clear error instead of
 * "Unexpected token '<', \"<html>...\"".
 */

import { DEFAULT_AI_MODEL_ID } from './modelPool.types';

/**
 * Machine-readable AI degradation reasons mirrored from server/aiDegradation.ts.
 * - local_draft: HTTP 200 with a canonical local template instead of AI output
 * - no_api_key / ai_unavailable: request genuinely failed (typically HTTP 503)
 */
export type AiDegradationFlag = 'local_draft' | 'no_api_key' | 'ai_unavailable';

export type ApiResult<T> =
  | {
      ok: true;
      data: T;
      error?: undefined;
      isStaticHost?: undefined;
      /** Present when the server answered 200 with a local draft instead of AI. */
      degraded?: AiDegradationFlag;
    }
  | {
      ok: false;
      error: string;
      status?: number;
      isStaticHost?: boolean;
      data?: undefined;
      degraded?: AiDegradationFlag;
    };

/** Russian user-facing labels for the degradation flag (incident 2026-09-17 C2). */
export function describeAiDegradation(flag: AiDegradationFlag | undefined): string | null {
  switch (flag) {
    case 'local_draft':
      return 'Локальный канонический черновик RICIS (внешний AI недоступен или отклонён).';
    case 'no_api_key':
      return 'GEMINI_API_KEY не настроен — внешний AI-канал недоступен.';
    case 'ai_unavailable':
      return 'Внешний AI-канал временно недоступен.';
    default:
      return null;
  }
}

function readDegradationFlag(data: unknown): AiDegradationFlag | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const value = (data as { degraded?: unknown }).degraded;
  if (value === 'local_draft' || value === 'no_api_key' || value === 'ai_unavailable') {
    return value;
  }
  return undefined;
}

const STATIC_HOST_HINT =
  'Агент API недоступен на статическом хостинге (GitHub Pages). ' +
  'Запустите локально: npm run dev (нужен GEMINI_API_KEY в окружении).';

function looksLikeHtml(text: string): boolean {
  const t = text.trim().slice(0, 200).toLowerCase();
  return (
    t.startsWith('<!doctype') ||
    t.startsWith('<html') ||
    t.includes('<head') ||
    t.includes('<body')
  );
}

/**
 * POST JSON and parse JSON response. Never throws on HTML bodies.
 * Includes automatic client-side retry for 429 (rate limits).
 */
export async function postJson<T = unknown>(
  url: string,
  body: unknown,
  options?: { timeoutMs?: number; retries?: number }
): Promise<ApiResult<T>> {
  const timeoutMs = options?.timeoutMs ?? 60_000;
  const maxRetries = options?.retries ?? 2;

  const preferredModel =
    typeof body === 'object' && body !== null && 'preferredModel' in body
      ? (body as any).preferredModel
      : (typeof window !== 'undefined' ? localStorage.getItem('ricis_selected_ai_model') : null) ||
        DEFAULT_AI_MODEL_ID;

  const finalBody =
    typeof body === 'object' && body !== null
      ? { preferredModel, ...body }
      : body;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(finalBody),
        signal: controller.signal,
      });

      const raw = await res.text();
      const ct = (res.headers.get('content-type') || '').toLowerCase();

      if (looksLikeHtml(raw) || (ct.includes('text/html') && !ct.includes('json'))) {
        return {
          ok: false,
          error: STATIC_HOST_HINT,
          status: res.status,
          isStaticHost: true,
        };
      }

      let data: any;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        return {
          ok: false,
          error:
            'Сервер вернул не-JSON ответ. ' +
            (raw.slice(0, 80) ? `Начало: ${raw.slice(0, 80).replace(/\s+/g, ' ')}…` : STATIC_HOST_HINT),
          status: res.status,
        };
      }

      const degraded = readDegradationFlag(data);

      if (!res.ok) {
        let errMsg =
          (typeof data?.error === 'string' && data.error) ||
          (typeof data?.message === 'string' && data.message) ||
          res.statusText ||
          `HTTP ${res.status}`;

        if (String(errMsg).includes('429') || String(errMsg).includes('RESOURCE_EXHAUSTED')) {
          if (attempt < maxRetries) {
            // Пауза перед повтором запроса
            await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
            continue;
          }
          errMsg =
            'Превышен частотный лимит запросов к API (ошибка 429). Подождите несколько секунд и повторите попытку.';
        } else if (String(errMsg).includes('404')) {
          errMsg = 'Модель недоступна или отключена (ошибка 404).';
        }
        const reason = describeAiDegradation(degraded);
        if (reason && !String(errMsg).includes(reason)) {
          errMsg = `${errMsg} (${reason})`;
        }
        return { ok: false, error: errMsg, status: res.status, degraded };
      }

      return { ok: true, data: data as T, degraded };
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        return { ok: false, error: 'Таймаут запроса к агенту API.' };
      }
      const msg = e?.message || String(e);
      if (msg.includes("Unexpected token '<'") || msg.includes('is not valid JSON')) {
        return { ok: false, error: STATIC_HOST_HINT, isStaticHost: true };
      }
      if (attempt === maxRetries) {
        return { ok: false, error: msg };
      }
      await new Promise((r) => setTimeout(r, 1000));
    } finally {
      clearTimeout(timer);
    }
  }

  return { ok: false, error: 'Не удалось выполнить запрос после нескольких попыток.' };
}

export { STATIC_HOST_HINT };
