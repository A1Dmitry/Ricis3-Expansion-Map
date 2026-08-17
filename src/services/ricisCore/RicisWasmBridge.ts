import { 
  IRicisCoreEngine, 
  RicisCoreStatus, 
  RicisEvaluationRequest, 
  RicisEvaluationResult, 
  RicisFormalProof, 
  RicisProofMethod, 
  RicisProofVerificationResult,
  RicisExpressionInput,
  RicisAcademicProofResult,
  BracketValidationResult
} from './IRicisCoreEngine';
import { RicisFallbackEngine } from './RicisFallbackEngine';

/**
 * WebAssembly Bridge for referencing the external Ricis.Core engine.
 * Loads WebAssembly artifacts if available in /public/wasm/ricis_core.wasm
 * and delegates to RicisFallbackEngine when WASM is not present.
 */
export class RicisWasmBridge implements IRicisCoreEngine {
  private _status: RicisCoreStatus = 'uninitialized';
  private _fallbackEngine: RicisFallbackEngine;
  private _wasmExports: any = null;
  private _initializationPromise: Promise<void> | null = null;

  constructor() {
    this._fallbackEngine = new RicisFallbackEngine();
  }

  public get status(): RicisCoreStatus {
    return this._status;
  }

  public initialize(wasmUrl: string = '/wasm/ricis_core.wasm'): Promise<void> {
    if (this._status === 'ready_wasm' || this._status === 'fallback_ts') {
      return Promise.resolve();
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
          this._wasmExports = module.instance.exports;
          this._status = 'ready_wasm';
          return;
        }
      }
    } catch {
      // Graceful fallback to Native TypeScript engine
    }

    await this._fallbackEngine.initialize();
    this._status = 'fallback_ts';
  }

  private async ensureInitialized(): Promise<void> {
    await this.initialize();
  }

  public async evaluate(request: RicisEvaluationRequest): Promise<RicisEvaluationResult> {
    await this.ensureInitialized();
    if (this._status === 'ready_wasm' && this._wasmExports?.evaluate) {
      try {
        // Future C# Wasm Interop execution entry
        const res = this._wasmExports.evaluate(request.expression);
        return {
          success: true,
          invariant: String(res),
          isSingular: true,
          executionEngine: 'csharp_wasm',
          trace: [],
        };
      } catch (err: any) {
        console.warn('[RicisWasmBridge] WASM evaluation failed, falling back to TS engine:', err);
      }
    }

    return this._fallbackEngine.evaluate(request);
  }

  public async verifyIdentity(targetA: string, targetB: string): Promise<boolean> {
    await this.ensureInitialized();
    return this._fallbackEngine.verifyIdentity(targetA, targetB);
  }

  public async generateFormalProof(
    claim: string,
    method?: RicisProofMethod,
    context?: { problemId?: string; variables?: Record<string, string> }
  ): Promise<RicisFormalProof> {
    await this.ensureInitialized();
    return this._fallbackEngine.generateFormalProof(claim, method, context);
  }

  public async verifyProofChain(proof: RicisFormalProof): Promise<RicisProofVerificationResult> {
    await this.ensureInitialized();
    return this._fallbackEngine.verifyProofChain(proof);
  }

  public lambdaToString(fn: Function): string {
    return this._fallbackEngine.lambdaToString(fn);
  }

  public stringToLambda(expr: string): (vars?: Record<string, number | string>) => string | number {
    return this._fallbackEngine.stringToLambda(expr);
  }

  public async proveSystem(
    premises: readonly RicisExpressionInput[],
    expectedGoal: string,
    problemId?: string
  ): Promise<RicisAcademicProofResult> {
    await this.ensureInitialized();
    return this._fallbackEngine.proveSystem(premises, expectedGoal, problemId);
  }

  public validateBrackets(text: string): BracketValidationResult {
    return this._fallbackEngine.validateBrackets(text);
  }
}

