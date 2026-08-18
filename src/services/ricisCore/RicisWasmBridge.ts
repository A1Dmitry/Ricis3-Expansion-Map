import {
  BracketValidationResult,
  CoreExecutionFailure,
  CoreExecutionResult,
  CoreRecoveryCode,
  IRicisCoreEngine,
  RicisAcademicProofResult,
  RicisCoreStatus,
  RicisEvaluationRequest,
  RicisExpressionInput,
  RicisFormalProof,
  RicisProofMethod,
  RicisProofVerificationResult,
} from './IRicisCoreEngine';
import { RicisFallbackEngine } from './RicisFallbackEngine';

interface CoreApiPayload {
  readonly ricis?: unknown;
  readonly parsed?: unknown;
  readonly error?: unknown;
  readonly position?: unknown;
}

interface CoreHealthPayload {
  readonly status?: unknown;
}

/**
 * Strict Core bridge. `evaluate` never computes a TypeScript fallback result:
 * it returns a C# result or a controlled Core recovery status.
 *
 * Legacy helpers remain delegated to the isolated fallback engine until their
 * own C# API contracts are introduced. They are not singularity calculations.
 */
export class RicisWasmBridge implements IRicisCoreEngine {
  private _status: RicisCoreStatus = 'uninitialized';
  private readonly _legacyEngine: RicisFallbackEngine;
  private _wasmExports: WebAssembly.Exports | null = null;
  private _initializationPromise: Promise<void> | null = null;

  constructor() {
    this._legacyEngine = new RicisFallbackEngine();
  }

  public get status(): RicisCoreStatus {
    return this._status;
  }

  /**
   * Explicit runtime check for UI status. Map startup reads `status` only and
   * never triggers this method, so Core discovery stays lazy until a user asks
   * to check it or starts a real Core operation.
   */
  public async checkRuntimeStatus(): Promise<RicisCoreStatus> {
    await this.initialize();
    return this._status;
  }

  public initialize(wasmUrl: string = '/wasm/ricis_core.wasm'): Promise<void> {
    if (this._status === 'ready_wasm' || this._status === 'ready_api') {
      return Promise.resolve();
    }
    if (this._status === 'error') {
      // A recovery health-check may become ready after the initial failure.
      // Retry the lazy Core discovery on the next real calculation.
      this._status = 'uninitialized';
      this._initializationPromise = null;
    }
    if (this._initializationPromise) {
      return this._initializationPromise;
    }

    this._status = 'loading';
    this._initializationPromise = this.loadRuntime(wasmUrl);
    return this._initializationPromise;
  }

  private async loadRuntime(wasmUrl: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && 'WebAssembly' in window) {
        const response = await fetch(wasmUrl);
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const module = await WebAssembly.instantiate(buffer, {});
          if (typeof module.instance.exports.evaluate === 'function') {
            this._wasmExports = module.instance.exports;
            this._status = 'ready_wasm';
            return;
          }
        }
      }
    } catch {
      // The API health check below decides whether a C# runtime is available.
    }

    try {
      if (typeof window !== 'undefined') {
        const response = await fetch('/api/ricis-core/health', {
          headers: { accept: 'application/json' },
        });
        if (response.ok) {
          const payload = await response.json() as CoreHealthPayload;
          if (payload.status === 'ready' || payload.status === 'ok') {
            this._status = 'ready_api';
            return;
          }
        }
      }
    } catch {
      // `evaluate` returns CORE_UNAVAILABLE; no mathematical fallback is allowed.
    }

    this._status = 'error';
  }

  private async ensureInitialized(): Promise<void> {
    await this.initialize();
  }

  private createFailure(
    code: CoreRecoveryCode,
    userMessage: string,
    options: {
      readonly runtime?: 'csharp_api' | 'csharp_wasm' | 'not_ready';
      readonly retryable?: boolean;
      readonly httpStatus?: number;
      readonly parserPosition?: number;
      readonly safeDetail?: string;
      readonly request?: RicisEvaluationRequest;
    } = {},
  ): CoreExecutionFailure {
    return {
      success: false,
      code,
      userMessage,
      diagnostic: {
        origin: options.request?.contextProblemId === 'terminal' ? 'terminal' : 'unknown',
        runtime: options.runtime ?? 'not_ready',
        retryable: options.retryable ?? false,
        httpStatus: options.httpStatus,
        parserPosition: options.parserPosition,
        safeDetail: options.safeDetail,
        occurredAt: Date.now(),
      },
    };
  }

  private static readSafeError(payload: CoreApiPayload): string | undefined {
    if (typeof payload.error !== 'string') return undefined;
    const normalized = payload.error.replace(/[\r\n\t]+/g, ' ').trim();
    return normalized.length > 240 ? normalized.slice(0, 240) : normalized;
  }

  private static readParserPosition(payload: CoreApiPayload): number | undefined {
    return typeof payload.position === 'number' && Number.isInteger(payload.position) && payload.position >= 0
      ? payload.position
      : undefined;
  }

  public async evaluate(request: RicisEvaluationRequest): Promise<CoreExecutionResult> {
    await this.ensureInitialized();

    if (this._status === 'ready_api' && typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/ricis-core/expressions/simplify', {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ expression: request.expression }),
        });

        let payload: CoreApiPayload | null = null;
        try {
          payload = await response.json() as CoreApiPayload;
        } catch {
          return this.createFailure(
            'CORE_INVALID_RESPONSE',
            'Ricis.Core вернул ответ, не соответствующий контракту.',
            { runtime: 'csharp_api', retryable: true, httpStatus: response.status, request },
          );
        }

        if (!response.ok) {
          if (response.status === 400) {
            return this.createFailure(
              'CORE_INPUT_REJECTED',
              'Ricis.Core отклонил формат выражения. Результат не вычислялся.',
              {
                runtime: 'csharp_api',
                retryable: false,
                httpStatus: 400,
                parserPosition: RicisWasmBridge.readParserPosition(payload),
                safeDetail: RicisWasmBridge.readSafeError(payload),
                request,
              },
            );
          }

          return this.createFailure(
            'CORE_INFRASTRUCTURE_ERROR',
            'Инфраструктура Ricis.Core не завершила запрос. Результат не вычислялся.',
            {
              runtime: 'csharp_api',
              retryable: response.status === 408 || response.status === 429 || response.status >= 500,
              httpStatus: response.status,
              safeDetail: RicisWasmBridge.readSafeError(payload),
              request,
            },
          );
        }

        if (typeof payload.ricis !== 'string' || payload.ricis.trim().length === 0) {
          return this.createFailure(
            'CORE_INVALID_RESPONSE',
            'Ricis.Core вернул неполный ответ. Результат не принят.',
            { runtime: 'csharp_api', retryable: true, httpStatus: response.status, request },
          );
        }

        return {
          success: true,
          invariant: payload.ricis,
          isSingular: /(?:∞_|∞\{|0_|inf_|\/\s*0\b)/u.test(payload.ricis),
          executionEngine: 'csharp_api',
          trace: [],
        };
      } catch {
        return this.createFailure(
          'CORE_INFRASTRUCTURE_ERROR',
          'Не удалось связаться с Ricis.Core. Результат не вычислялся.',
          { runtime: 'csharp_api', retryable: true, request },
        );
      }
    }

    if (this._status === 'ready_wasm' && this._wasmExports && typeof this._wasmExports.evaluate === 'function') {
      try {
        const rawResult = (this._wasmExports.evaluate as (expression: string) => unknown)(request.expression);
        if (typeof rawResult !== 'string' || rawResult.trim().length === 0) {
          return this.createFailure(
            'CORE_INVALID_RESPONSE',
            'WebAssembly-ядро Ricis.Core вернуло неполный ответ. Результат не принят.',
            { runtime: 'csharp_wasm', retryable: true, request },
          );
        }

        return {
          success: true,
          invariant: rawResult,
          isSingular: /(?:∞_|∞\{|0_|inf_|\/\s*0\b)/u.test(rawResult),
          executionEngine: 'csharp_wasm',
          trace: [],
        };
      } catch {
        return this.createFailure(
          'CORE_INFRASTRUCTURE_ERROR',
          'WebAssembly-ядро Ricis.Core не завершило вычисление. Результат не вычислялся.',
          { runtime: 'csharp_wasm', retryable: true, request },
        );
      }
    }

    return this.createFailure(
      'CORE_UNAVAILABLE',
      'Ядро Ricis.Core недоступно. Выражение не вычислялось.',
      { runtime: 'not_ready', retryable: true, request },
    );
  }

  public async verifyIdentity(targetA: string, targetB: string): Promise<boolean> {
    return this._legacyEngine.verifyIdentity(targetA, targetB);
  }

  public async generateFormalProof(
    claim: string,
    method?: RicisProofMethod,
    context?: { problemId?: string; variables?: Record<string, string> },
  ): Promise<RicisFormalProof> {
    return this._legacyEngine.generateFormalProof(claim, method, context);
  }

  public async verifyProofChain(proof: RicisFormalProof): Promise<RicisProofVerificationResult> {
    return this._legacyEngine.verifyProofChain(proof);
  }

  public lambdaToString(fn: Function): string {
    return this._legacyEngine.lambdaToString(fn);
  }

  public stringToLambda(expr: string): (vars?: Record<string, number | string>) => string | number {
    return this._legacyEngine.stringToLambda(expr);
  }

  public async proveSystem(
    premises: readonly RicisExpressionInput[],
    expectedGoal: string,
    problemId?: string,
  ): Promise<RicisAcademicProofResult> {
    return this._legacyEngine.proveSystem(premises, expectedGoal, problemId);
  }

  public validateBrackets(text: string): BracketValidationResult {
    return this._legacyEngine.validateBrackets(text);
  }
}
