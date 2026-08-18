/**
 * RICIS-III v7.7 Engine Contract.
 *
 * `evaluate` is Core-first: a singularity calculation either returns a result
 * produced by C# Core or a typed recovery status. It never substitutes a
 * TypeScript invariant after Core is unavailable or rejects the input.
 */

export interface RicisEvaluationRequest {
  readonly expression: string;
  readonly variableSubstitutions?: Record<string, string | number>;
  readonly contextProblemId?: string;
  readonly enableTracePhases?: boolean;
}

export interface RicisPhaseTraceStep {
  readonly phase: string;
  readonly title: string;
  readonly inputState: string;
  readonly outputState: string;
  readonly appliedAxiom?: string;
  readonly complexity: 'O(1)' | 'O(log N)' | 'O(N)';
}

/** A successful singularity calculation can only originate from C# Core. */
export interface RicisEvaluationResult {
  readonly success: true;
  readonly invariant: string;
  readonly isSingular: boolean;
  readonly semanticIndex?: string;
  readonly executionEngine: 'csharp_wasm' | 'csharp_api' | 'typescript_native';
  readonly trace: readonly RicisPhaseTraceStep[];
  readonly error?: string;
}

export type CoreRecoveryCode =
  | 'CORE_UNAVAILABLE'
  | 'CORE_INPUT_REJECTED'
  | 'CORE_INFRASTRUCTURE_ERROR'
  | 'CORE_INVALID_RESPONSE';

export type CoreRecoveryOrigin = 'terminal' | 'node_trace' | 'proof_console' | 'unknown';

export interface CoreRecoveryDiagnostic {
  readonly origin: CoreRecoveryOrigin;
  readonly runtime: 'csharp_api' | 'csharp_wasm' | 'not_ready';
  readonly retryable: boolean;
  readonly httpStatus?: number;
  readonly parserPosition?: number;
  readonly safeDetail?: string;
  readonly occurredAt: number;
}

/**
 * A Core failure deliberately has no invariant, trace, proof or execution
 * engine. It is an operational state, not a mathematical result.
 */
export interface CoreExecutionFailure {
  readonly success: false;
  readonly code: CoreRecoveryCode;
  readonly userMessage: string;
  readonly diagnostic: CoreRecoveryDiagnostic;
}

export type CoreExecutionResult = RicisEvaluationResult | CoreExecutionFailure;

export function isCoreExecutionFailure(result: CoreExecutionResult): result is CoreExecutionFailure {
  return result.success === false;
}

export type RicisCoreStatus = 'uninitialized' | 'loading' | 'ready_wasm' | 'ready_api' | 'fallback_ts' | 'error';

export type RicisProofMethod =
  | 'geometric_bridge'
  | 'identity_conservation'
  | 'discrete_monolith'
  | 'singularity_separation'
  | 'infinity_arithmetic';

export interface RicisProofStep {
  readonly stepNumber: number;
  readonly phase: string;
  readonly statement: string;
  readonly mathematicalForm: string;
  readonly justificationAxiom: string;
  readonly notation: 'ricis_math' | 'latex' | 'lean4';
}

export interface RicisFormalProof {
  readonly id: string;
  readonly targetClaim: string;
  readonly problemId?: string;
  readonly method: RicisProofMethod;
  readonly theoremTitle: string;
  readonly hypothesis: string;
  readonly conclusionInvariant: string;
  readonly steps: readonly RicisProofStep[];
  readonly lean4CodeSnippet?: string;
  readonly complexity: 'O(1)';
  readonly isVerified: boolean;
  readonly timestamp: number;
}

export interface RicisProofVerificationResult {
  readonly valid: boolean;
  readonly brokenStepIndex?: number;
  readonly reason?: string;
  readonly verifiedAxioms: readonly string[];
}

export type RicisExpressionInput = string | ((...args: any[]) => any);

export interface RicisAcademicStep {
  readonly stepNumber: number;
  readonly phase: string;
  readonly title: string;
  readonly academicDescription: string;
  readonly previousState: string;
  readonly reducedState: string;
  readonly appliedAxiom: string;
  readonly mathLatex: string;
  readonly complexity: 'O(1)';
}

export interface RicisAcademicProofResult {
  readonly proofId: string;
  readonly problemId?: string;
  readonly theoremTitle: string;
  readonly premises: readonly string[];
  readonly expectedGoal: string;
  readonly reducedInvariant: string;
  readonly goalMatched: boolean;
  readonly academicStatus: 'QED_VERIFIED' | 'DISCREPANCY_DETECTED';
  readonly steps: readonly RicisAcademicStep[];
  readonly complexity: 'O(1)';
  readonly timestamp: number;
}

export interface BracketValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly normalizedCode: string;
}

export interface IRicisCoreEngine {
  readonly status: RicisCoreStatus;
  initialize(wasmUrl?: string): Promise<void>;
  evaluate(request: RicisEvaluationRequest): Promise<CoreExecutionResult>;
  verifyIdentity(targetA: string, targetB: string): Promise<boolean>;
  generateFormalProof(
    claim: string,
    method?: RicisProofMethod,
    context?: { problemId?: string; variables?: Record<string, string> }
  ): Promise<RicisFormalProof>;
  verifyProofChain(proof: RicisFormalProof): Promise<RicisProofVerificationResult>;
  lambdaToString(fn: Function): string;
  stringToLambda(expr: string): (vars?: Record<string, number | string>) => string | number;
  proveSystem(
    premises: readonly RicisExpressionInput[],
    expectedGoal: string,
    problemId?: string
  ): Promise<RicisAcademicProofResult>;
  validateBrackets(text: string): BracketValidationResult;
}
