/**
 * RICIS-III v7.7 Engine Contract
 * Abstract interface for both C# WebAssembly (Ricis.Core) and Native TypeScript Runtime.
 * Strictly adheres to SOLID, DRY and DDD principles.
 */

export interface RicisEvaluationRequest {
  readonly expression: string;
  readonly variableSubstitutions?: Record<string, string | number>;
  readonly contextProblemId?: string;
  readonly enableTracePhases?: boolean;
}

export interface RicisPhaseTraceStep {
  readonly phase: string; // e.g. "Phase -1", "Phase 0", "Phase 2"
  readonly title: string;
  readonly inputState: string;
  readonly outputState: string;
  readonly appliedAxiom?: string; // e.g. "A6", "SP2", "L1", "A4", "A10"
  readonly complexity: 'O(1)' | 'O(log N)' | 'O(N)';
}

export interface RicisEvaluationResult {
  readonly success: boolean;
  readonly invariant: string;
  readonly isSingular: boolean;
  readonly semanticIndex?: string;
  readonly executionEngine: 'csharp_wasm' | 'typescript_native';
  readonly trace: readonly RicisPhaseTraceStep[];
  readonly error?: string;
}

export type RicisCoreStatus = 'uninitialized' | 'loading' | 'ready_wasm' | 'fallback_ts' | 'error';

/**
 * Canonical formal proof methods in RICIS-III v7.7
 */
export type RicisProofMethod = 
  | 'geometric_bridge'        // Resolution via 2D vector determinant det(u,v) = F * G
  | 'identity_conservation'   // L1 preservation proof (0_F / 0_F = 1)
  | 'discrete_monolith'       // Monolith difference operator Delta_plane without limits
  | 'singularity_separation'  // SP1/SP2 factorization and tail preservation (No Total Amnesia)
  | 'infinity_arithmetic';    // A7/A10 infinity arithmetic axioms

export interface RicisProofStep {
  readonly stepNumber: number;
  readonly phase: string; // e.g. "Phase -1", "Phase 2"
  readonly statement: string;
  readonly mathematicalForm: string;
  readonly justificationAxiom: string; // e.g. "L1", "SP2", "A6", "TCP", "SP1"
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

/**
 * Expression Input: either a mathematical string or an executable lambda function
 */
export type RicisExpressionInput = string | ((...args: any[]) => any);

/**
 * Step in an academic proof log
 */
export interface RicisAcademicStep {
  readonly stepNumber: number;
  readonly phase: string; // e.g. "Phase -1", "Phase 1: SP2 Reduction", "Phase 2: Axiom A6"
  readonly title: string;
  readonly academicDescription: string;
  readonly previousState: string;
  readonly reducedState: string;
  readonly appliedAxiom: string; // e.g. "A6", "SP1", "SP2", "SP4", "L1", "A4", "A10"
  readonly mathLatex: string;
  readonly complexity: 'O(1)';
}

/**
 * Academic Proof Protocol Result
 */
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
  
  /** Initialize the Wasm/Native runtime */
  initialize(wasmUrl?: string): Promise<void>;
  
  /** Evaluate mathematical expressions involving singularities strictly through RICIS-III */
  evaluate(request: RicisEvaluationRequest): Promise<RicisEvaluationResult>;
  
  /** Verify L1 Identity (X = X) structural preservation */
  verifyIdentity(targetA: string, targetB: string): Promise<boolean>;

  /** Generate formal theorem proof by specified RICIS-III method */
  generateFormalProof(
    claim: string, 
    method?: RicisProofMethod, 
    context?: { problemId?: string; variables?: Record<string, string> }
  ): Promise<RicisFormalProof>;

  /** Verify formal proof step-by-step against RICIS-III axioms */
  verifyProofChain(proof: RicisFormalProof): Promise<RicisProofVerificationResult>;

  /** Convert a lambda function into a normalized mathematical expression string */
  lambdaToString(fn: Function): string;

  /** Compile a mathematical expression string into an executable lambda function */
  stringToLambda(expr: string): (vars?: Record<string, number | string>) => string | number;

  /**
   * Academic Proof of Expression System:
   * Takes an array of premises (strings or lambdas) and an expected Goal.
   * Recursively reduces, tests L1 goal equivalence, and formats an academic proof log.
   */
  proveSystem(
    premises: readonly RicisExpressionInput[],
    expectedGoal: string,
    problemId?: string
  ): Promise<RicisAcademicProofResult>;

  /**
   * Validate and normalize bracket structures for Lean 4 / mathematical parser compatibility
   */
  validateBrackets(text: string): BracketValidationResult;
}

