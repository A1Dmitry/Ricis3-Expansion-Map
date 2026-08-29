import {
  RExpr,
  CPUCode,
  CUDAKernel,
  CompiledExpr,
  BackendExecutionResult,
  IRicisBackendReductionService,
} from './ricisBackendReduction.types';

/**
 * RICIS-III v7.7 Hardware-Independent Exact Reduction Service
 * Author: Dmitry V. Aleynikov (ORCID: 0009-0004-3226-7700)
 *
 * Implements the IRicisBackendReductionService interface, mapping Lean 4
 * exact reduction theorems, 0-error propagation, and CPU/CUDA equivalent semantics.
 */
export class RicisBackendReductionService<T> implements IRicisBackendReductionService<T> {
  /**
   * Translates the Lean 4 'ricisReduce' function:
   * | RExpr.divSelf _ => RExpr.one
   * | e => e
   * Recursively optimizes child expressions under SP2.
   */
  public reduce(expr: RExpr): RExpr {
    if (expr.type === 'divSelf') {
      return { type: 'one' };
    }

    if (expr.operands && expr.operands.length > 0) {
      return {
        ...expr,
        operands: expr.operands.map((op) => this.reduce(op)),
      };
    }

    if (expr.indexExpr) {
      return {
        ...expr,
        indexExpr: this.reduce(expr.indexExpr),
      };
    }

    return expr;
  }

  /**
   * Counts formal steps:
   * | RExpr.divSelf _ => 1
   * | _ => 0
   */
  public getReductionSteps(expr: RExpr): number {
    return expr.type === 'divSelf' ? 1 : 0;
  }

  /**
   * Models the total accumulated numerical error:
   * eliminatedError e = 0
   */
  public getEliminatedError(_expr: RExpr): number {
    return 0;
  }

  /**
   * Pre-compiles the expression by applying the static reduction pass.
   */
  public compile(expr: RExpr): CompiledExpr {
    return {
      source: expr,
      optimized: this.reduce(expr),
      compiledAt: new Date().toISOString(),
    };
  }

  /**
   * Prepares execution code for CPU.
   */
  public prepareCPU(expr: RExpr): CPUCode {
    return {
      tag: 'CPUCode',
      code: this.compile(expr),
    };
  }

  /**
   * Prepares execution code for CUDA.
   */
  public prepareCUDA(expr: RExpr): CUDAKernel {
    return {
      tag: 'CUDAKernel',
      kernel: this.compile(expr),
    };
  }

  /**
   * Simulates the exact, error-free execution of the compiled expression on CPU.
   */
  public executeCPU(code: CPUCode, initialInput: T): BackendExecutionResult<T> {
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const reduced = code.code.optimized;
    
    // Model unit valuation: self-division always evaluates to 1, otherwise stays unchanged.
    const finalVal = reduced.type === 'one' ? (1 as unknown as T) : initialInput;
    
    const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const diffNs = Math.round((end - start) * 1e6);

    return {
      result: {
        value: finalVal,
        expression: reduced,
        history: [
          {
            stepName: 'CPU O(1) Pre-compiled Hardware Bypass',
            timestamp: new Date().toISOString(),
            startExpr: code.code.source,
            endExpr: reduced,
            startValue: initialInput,
            endValue: finalVal,
            accumulatedError: 0,
          },
        ],
      },
      executedOn: 'CPU',
      executionTimeNs: Math.max(15, diffNs),
      errorContribution: 0,
    };
  }

  /**
   * Simulates the exact, error-free execution of the compiled expression on GPU (CUDA warp).
   */
  public executeCUDA(kernel: CUDAKernel, initialInput: T): BackendExecutionResult<T> {
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const reduced = kernel.kernel.optimized;
    
    const finalVal = reduced.type === 'one' ? (1 as unknown as T) : initialInput;
    
    const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const diffNs = Math.round((end - start) * 1e6);

    return {
      result: {
        value: finalVal,
        expression: reduced,
        history: [
          {
            stepName: 'CUDA Warp SIMD Parallel Error-Free Precomputation',
            timestamp: new Date().toISOString(),
            startExpr: kernel.kernel.source,
            endExpr: reduced,
            startValue: initialInput,
            endValue: finalVal,
            accumulatedError: 0,
          },
        ],
      },
      executedOn: 'CUDA',
      executionTimeNs: Math.max(6, diffNs),
      errorContribution: 0,
    };
  }

  /**
   * Strictly matches expressions structurally, prioritizing semantic indexes under SP4.
   */
  public areStructurallyEqual(a: RExpr, b: RExpr): boolean {
    if (a.type !== b.type) {
      return false;
    }

    if (a.indexExpr || b.indexExpr) {
      if (!a.indexExpr || !b.indexExpr) {
        return false;
      }
      if (!this.areStructurallyEqual(a.indexExpr, b.indexExpr)) {
        return false;
      }
    }

    if (a.operands || b.operands) {
      if (!a.operands || !b.operands) {
        return false;
      }
      if (a.operands.length !== b.operands.length) {
        return false;
      }
      for (let i = 0; i < a.operands.length; i++) {
        const opA = a.operands[i];
        const opB = b.operands[i];
        if (opA && opB && !this.areStructurallyEqual(opA, opB)) {
          return false;
        }
      }
    }

    return true;
  }
}
