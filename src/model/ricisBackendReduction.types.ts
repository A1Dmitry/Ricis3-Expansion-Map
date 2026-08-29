/**
 * RICIS-III v7.7 BACKEND REDUCTION CONTRACT & TYPES
 * Author: Dmitry V. Aleynikov (ORCID: 0009-0004-3226-7700)
 *
 * This file defines the TypeScript interface representation of the Lean 4 
 * structural consequence kernel, modeling CPU/CUDA compiler invariants,
 * zero error propagation, and L1 structural identity preservation.
 */

export type RExprType =
  | 'zero'
  | 'one'
  | 'variable'
  | 'add'
  | 'sub'
  | 'mul'
  | 'divSelf'
  | 'indexedZero'
  | 'indexedInf';

/**
 * Structural AST representing a RICIS Expression.
 * Values are constructed and processed recursively.
 */
export interface RExpr {
  readonly type: RExprType;
  readonly operands?: readonly RExpr[];
  readonly indexExpr?: RExpr; // Used by indexedZero and indexedInf (SP4 Semantic Index)
}

/**
 * RicisNumber: A core value wrapper preserving its ontic generating origin and type boundaries.
 */
export interface RicisNumber<T> {
  readonly value: T;
  readonly expression: RExpr;
  readonly history: readonly TransformationLog<T>[];
}

/**
 * TransformationLog: Keeps step-by-step history of structural mappings for proof audit.
 */
export interface TransformationLog<T> {
  readonly stepName: string;
  readonly timestamp: string;
  readonly startExpr: RExpr;
  readonly endExpr: RExpr;
  readonly startValue: T;
  readonly endValue: T;
  readonly accumulatedError: number;
}

/**
 * Represents compiled, pre-calculated expression state.
 */
export interface CompiledExpr {
  readonly source: RExpr;
  readonly optimized: RExpr;
  readonly compiledAt: string;
}

/**
 * CPUCode: DTO representation of CPU execution block.
 */
export interface CPUCode {
  readonly tag: 'CPUCode';
  readonly code: CompiledExpr;
}

/**
 * CUDAKernel: DTO representation of CUDA/GPU kernel block.
 */
export interface CUDAKernel {
  readonly tag: 'CUDAKernel';
  readonly kernel: CompiledExpr;
}

/**
 * DTO for execution feedback on backends.
 */
export interface BackendExecutionResult<T> {
  readonly result: RicisNumber<T>;
  readonly executedOn: 'CPU' | 'CUDA';
  readonly executionTimeNs: number;
  readonly errorContribution: number;
}

/**
 * IRicisBackendReductionService: Non-singleton DI Interface for compiling
 * and executing RICIS expressions across hardware boundaries.
 */
export interface IRicisBackendReductionService<T> {
  /**
   * Reduces an expression to its invariant according to L1 and SP2.
   * Self-division is simplified to 'one' in O(1) step.
   */
  reduce(expr: RExpr): RExpr;

  /**
   * Computes the exact number of reduction steps (1 for self-division, 0 otherwise).
   */
  getReductionSteps(expr: RExpr): number;

  /**
   * Calculates structural error contribution, which is strictly 0 for eliminated operations.
   */
  getEliminatedError(expr: RExpr): number;

  /**
   * Translates expression into optimized representation ready for compile units.
   */
  compile(expr: RExpr): CompiledExpr;

  /**
   * Wraps optimized expressions into CPU and CUDA-compatible structures.
   */
  prepareCPU(expr: RExpr): CPUCode;
  prepareCUDA(expr: RExpr): CUDAKernel;

  /**
   * Evaluates compiled code on virtual environments.
   */
  executeCPU(code: CPUCode, initialInput: T): BackendExecutionResult<T>;
  executeCUDA(kernel: CUDAKernel, initialInput: T): BackendExecutionResult<T>;

  /**
   * Performs deep structural equality checking.
   * Priority of SP4 and semantic index representation over simple numerical checks.
   */
  areStructurallyEqual(a: RExpr, b: RExpr): boolean;
}
