import type {
  CoreExecutionFailure,
  CoreRecoveryCode,
  CoreRecoveryDiagnostic,
  CoreRecoveryOrigin,
} from './ricisCore/IRicisCoreEngine';
import { ricisCoreApiUrl, resolveRicisCoreApiEndpoint } from './ricisCore/coreEndpoint';

const RECOVERY_VIEW = 'core-recovery';
const RECOVERY_STORAGE_KEY = 'ricis.core-recovery.v1';

export interface StoredCoreRecovery {
  readonly code: CoreRecoveryCode;
  readonly userMessage: string;
  readonly diagnostic: CoreRecoveryDiagnostic;
}

export interface CoreHealthProbeResult {
  readonly available: boolean;
  readonly safeDetail?: string;
}

const KNOWN_CODES = new Set<CoreRecoveryCode>([
  'CORE_UNAVAILABLE',
  'CORE_INPUT_REJECTED',
  'CORE_INFRASTRUCTURE_ERROR',
  'CORE_INVALID_RESPONSE',
]);

const KNOWN_ORIGINS = new Set<CoreRecoveryOrigin>([
  'terminal',
  'node_trace',
  'proof_console',
  'unknown',
]);

function canUseBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.location !== 'undefined';
}

function normalizeCode(value: string | null | undefined): CoreRecoveryCode {
  return value && KNOWN_CODES.has(value as CoreRecoveryCode)
    ? value as CoreRecoveryCode
    : 'CORE_INFRASTRUCTURE_ERROR';
}

function normalizeOrigin(value: string | null | undefined): CoreRecoveryOrigin {
  return value && KNOWN_ORIGINS.has(value as CoreRecoveryOrigin)
    ? value as CoreRecoveryOrigin
    : 'unknown';
}

function sanitizeDetail(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const compact = value.replace(/[\r\n\t]+/g, ' ').trim();
  if (!compact) return undefined;
  return compact.slice(0, 240);
}

export function toStoredCoreRecovery(failure: CoreExecutionFailure): StoredCoreRecovery {
  return {
    code: failure.code,
    userMessage: failure.userMessage.slice(0, 240),
    diagnostic: {
      origin: normalizeOrigin(failure.diagnostic.origin),
      runtime: failure.diagnostic.runtime,
      retryable: failure.diagnostic.retryable,
      httpStatus: failure.diagnostic.httpStatus,
      parserPosition: failure.diagnostic.parserPosition,
      safeDetail: sanitizeDetail(failure.diagnostic.safeDetail),
      occurredAt: failure.diagnostic.occurredAt,
    },
  };
}

export function isCoreRecoveryRoute(locationSearch: string): boolean {
  return new URLSearchParams(locationSearch).get('view') === RECOVERY_VIEW;
}

export function readCoreRecoveryRoute(locationSearch: string): {
  readonly code: CoreRecoveryCode;
  readonly origin: CoreRecoveryOrigin;
} {
  const params = new URLSearchParams(locationSearch);
  return {
    code: normalizeCode(params.get('code')),
    origin: normalizeOrigin(params.get('origin')),
  };
}

export function writeCoreRecovery(failure: CoreExecutionFailure): void {
  if (!canUseBrowser()) return;

  const stored = toStoredCoreRecovery(failure);
  window.sessionStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(stored));

  const url = new URL(window.location.href);
  url.searchParams.set('view', RECOVERY_VIEW);
  url.searchParams.set('code', stored.code);
  url.searchParams.set('origin', stored.diagnostic.origin);
  window.history.pushState({}, '', url.toString());
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function readStoredCoreRecovery(locationSearch: string): StoredCoreRecovery {
  const route = readCoreRecoveryRoute(locationSearch);
  if (!canUseBrowser()) {
    return createDefaultRecovery(route.code, route.origin);
  }

  try {
    const raw = window.sessionStorage.getItem(RECOVERY_STORAGE_KEY);
    if (!raw) return createDefaultRecovery(route.code, route.origin);
    const parsed = JSON.parse(raw) as Partial<StoredCoreRecovery>;
    if (!parsed.diagnostic || normalizeCode(parsed.code) !== route.code) {
      return createDefaultRecovery(route.code, route.origin);
    }

    return {
      code: route.code,
      userMessage: typeof parsed.userMessage === 'string' ? parsed.userMessage.slice(0, 240) : defaultMessage(route.code),
      diagnostic: {
        origin: route.origin,
        runtime: parsed.diagnostic.runtime === 'csharp_api' || parsed.diagnostic.runtime === 'csharp_wasm'
          ? parsed.diagnostic.runtime
          : 'not_ready',
        retryable: parsed.diagnostic.retryable === true,
        httpStatus: typeof parsed.diagnostic.httpStatus === 'number' ? parsed.diagnostic.httpStatus : undefined,
        parserPosition: typeof parsed.diagnostic.parserPosition === 'number' ? parsed.diagnostic.parserPosition : undefined,
        safeDetail: sanitizeDetail(typeof parsed.diagnostic.safeDetail === 'string' ? parsed.diagnostic.safeDetail : undefined),
        occurredAt: typeof parsed.diagnostic.occurredAt === 'number' ? parsed.diagnostic.occurredAt : Date.now(),
      },
    };
  } catch {
    return createDefaultRecovery(route.code, route.origin);
  }
}

export function returnFromCoreRecovery(): void {
  if (!canUseBrowser()) return;
  const url = new URL(window.location.href);
  url.searchParams.delete('view');
  url.searchParams.delete('code');
  url.searchParams.delete('origin');
  window.history.pushState({}, '', url.toString());
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export async function probeRicisCoreHealth(): Promise<CoreHealthProbeResult> {
  if (!canUseBrowser()) return { available: false };

  const endpoint = resolveRicisCoreApiEndpoint();
  const healthUrl = ricisCoreApiUrl(endpoint, 'health');
  if (!healthUrl) {
    return { available: false, safeDetail: endpoint.safeDetail };
  }

  try {
    const response = await fetch(healthUrl, { headers: { accept: 'application/json' } });
    if (!response.ok) {
      return { available: false, safeDetail: `Health endpoint returned HTTP ${response.status}.` };
    }
    const payload = await response.json() as { status?: unknown };
    return payload.status === 'ready' || payload.status === 'ok'
      ? { available: true }
      : { available: false, safeDetail: 'Health endpoint did not report a ready Core runtime.' };
  } catch {
    return { available: false, safeDetail: 'Health endpoint could not be reached.' };
  }
}

function createDefaultRecovery(code: CoreRecoveryCode, origin: CoreRecoveryOrigin): StoredCoreRecovery {
  return {
    code,
    userMessage: defaultMessage(code),
    diagnostic: {
      origin,
      runtime: 'not_ready',
      retryable: code !== 'CORE_INPUT_REJECTED',
      occurredAt: Date.now(),
    },
  };
}

function defaultMessage(code: CoreRecoveryCode): string {
  switch (code) {
    case 'CORE_UNAVAILABLE':
      return 'Ядро Ricis.Core недоступно. Выражение не вычислялось.';
    case 'CORE_INPUT_REJECTED':
      return 'Ricis.Core отклонил формат выражения. Результат не вычислялся.';
    case 'CORE_INVALID_RESPONSE':
      return 'Ricis.Core вернул неполный ответ. Результат не принят.';
    default:
      return 'Инфраструктура Ricis.Core не завершила запрос. Результат не вычислялся.';
  }
}
