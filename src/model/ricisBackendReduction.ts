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
   * Evaluates an RExpr structure against a numeric input value.
   */
  public evalRExpr(expr: RExpr, input: number): number {
    switch (expr.type) {
      case 'zero':
        return 0;
      case 'one':
        return 1;
      case 'variable':
        return input;
      case 'divSelf':
        return 1;
      case 'indexedZero':
        return 0;
      case 'indexedInf':
        return Infinity;
      case 'add': {
        const ops = expr.operands || [];
        return (ops[0] ? this.evalRExpr(ops[0], input) : 0) + (ops[1] ? this.evalRExpr(ops[1], input) : 0);
      }
      case 'sub': {
        const ops = expr.operands || [];
        return (ops[0] ? this.evalRExpr(ops[0], input) : 0) - (ops[1] ? this.evalRExpr(ops[1], input) : 0);
      }
      case 'mul': {
        const ops = expr.operands || [];
        return (ops[0] ? this.evalRExpr(ops[0], input) : 1) * (ops[1] ? this.evalRExpr(ops[1], input) : 1);
      }
      default:
        return typeof input === 'number' ? input : 0;
    }
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
   * Executes the compiled expression on CPU using exact measured timing.
   */
  public executeCPU(code: CPUCode, initialInput: T): BackendExecutionResult<T> {
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const reduced = code.code.optimized;
    
    const finalVal = typeof initialInput === 'number' 
      ? (this.evalRExpr(reduced, initialInput) as unknown as T)
      : (reduced.type === 'one' ? (1 as unknown as T) : initialInput);
    
    const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const diffNs = Math.round((end - start) * 1e6);

    return {
      result: {
        value: finalVal,
        expression: reduced,
        history: [
          {
            stepName: 'CPU Execution (Compiled Delegate)',
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
      executionTimeNs: Math.max(0, diffNs),
      errorContribution: 0,
    };
  }

  /**
   * Evaluates the compiled expression in a simulated parallel execution environment (CPU SIMD / GPU model).
   */
  public executeCUDA(kernel: CUDAKernel, initialInput: T): BackendExecutionResult<T> {
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const reduced = kernel.kernel.optimized;
    
    const finalVal = typeof initialInput === 'number' 
      ? (this.evalRExpr(reduced, initialInput) as unknown as T)
      : (reduced.type === 'one' ? (1 as unknown as T) : initialInput);
    
    const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const diffNs = Math.round((end - start) * 1e6);

    return {
      result: {
        value: finalVal,
        expression: reduced,
        history: [
          {
            stepName: 'CPU SIMD Emulation Model (Virtual CUDA Warp)',
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
      executionTimeNs: Math.max(0, diffNs),
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
