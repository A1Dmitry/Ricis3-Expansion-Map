/**
 * src/model/proofGraphComparison.contracts.ts
 * Контракты структурного сопоставления графов доказательств:
 * RICIS-III Singularity DAG vs Anthropic FLT Decomposition Graph.
 */

export type GraphArchitectureType = 
  | 'RICIS_MONOLITH_DAG' 
  | 'ANTHROPIC_MODULAR_DECOMPOSITION';

export type VerificationBackend = 
  | 'LEAN_4_NATIVE_KERNEL'
  | 'NANODA_INDEPENDENT_KERNEL'
  | 'RICIS_LOCAL_EVAL_O1'
  | 'COMBINED_LEAN_AND_RICIS';

export type PriorityStatus =
  | 'PRIOR_ORIGINAL_PUBLICATION'       // Задепонировано и опубликовано ранее (RICIS-III)
  | 'PROVEN_BEHAVIORAL_ISOMORPHISM'    // Доказанный структурный и поведенческий изоморфизм графов
  | 'DERIVATIVE_SCALE_EXPANSION';

/** Шаг декомпозиционно-инвариантного макрографа */
export interface IBehavioralMacroGraphStep {
  readonly stepId: 'STATE' | 'CLASSIFY' | 'PRESERVE_CONTEXT' | 'BRANCH' | 'TRANSFORM' | 'CARRY_STATE' | 'VERIFY';
  readonly name: string;
  readonly ricisInterpretation: string;
  readonly anthropicLeanInterpretation: string;
  readonly axiomAnchor: string; // L0, L1, SP1, SP2, etc.
}

/** Метрики сложности и топологии графа доказательства */
export interface IProofGraphTopologyMetrics {
  readonly totalNodes: number;
  readonly totalEdges: number;
  readonly maxGraphDepth: number;
  readonly branchingFactor: number;
  readonly cyclicSingularitiesResolved: number;
  readonly algebraicComplexity: 'O(1)' | 'O(log N)' | 'O(N^k)' | 'EXPONENTIAL';
  readonly trustBoundariesCount: number;
}

/** Сопоставительный профиль графа */
export interface IProofGraphProfile {
  readonly id: string;
  readonly name: string;
  readonly architecture: GraphArchitectureType;
  readonly primaryTarget: string;
  readonly publicationDate: string;
  readonly depositedDoi?: string;
  readonly repositoryUrl?: string;
  readonly verificationEngine: VerificationBackend;
  readonly metrics: IProofGraphTopologyMetrics;
  readonly decompositionStrategy: string;
  readonly singularityHandling: string;
  readonly interactiveInspectionModel: '3D_WEBGL_AST_DYNAMIC' | 'STATIC_HTML_EXPORTER';
  readonly axiomaticBase: readonly string[];
  readonly authorPublicationsTrail?: readonly string[];
}

export interface IStructuralAnalogyEntry {
  readonly feature: string;
  readonly ricisImplementation: string;
  readonly anthropicImplementation: string;
  readonly equivalenceScore: number; // 0..1
  readonly isArchitectureBorrowed: boolean;
  readonly codePatternRef?: string;
}

export interface IFundamentalDivergenceEntry {
  readonly domain: string;
  readonly ricisParadigm: string;
  readonly anthropicParadigm: string;
  readonly significance: 'METHODOLOGICAL_CONVERGENCE' | 'CRITICAL_AXIOMATIC' | 'SCALE_ONLY';
}

/** Сравнительный дифференциал двух графов */
export interface IGraphStructuralDiff {
  readonly timestamp: string;
  readonly primaryOriginProfile: IProofGraphProfile; // RICIS-III
  readonly comparedSystemProfile: IProofGraphProfile; // Anthropic FLT
  readonly macroGraphSteps: readonly IBehavioralMacroGraphStep[];
  readonly structuralAnalogies: readonly IStructuralAnalogyEntry[];
  readonly fundamentalDivergences: readonly IFundamentalDivergenceEntry[];
  readonly priorityVerdict: {
    readonly status: PriorityStatus;
    readonly ricisPublicationAnchor: string;
    readonly anthropicPublicationAnchor: string;
    readonly statement: string;
    readonly behavioralOverlapScore: number; // 0..1 (>= 0.90)
  };
}

/** Интерфейс сервиса сравнительного анализа графов (DI) */
export interface IProofGraphComparisonService {
  getRicisGraphProfile(): IProofGraphProfile;
  getAnthropicFltGraphProfile(): IProofGraphProfile;
  computeStructuralDiff(): IGraphStructuralDiff;
}
