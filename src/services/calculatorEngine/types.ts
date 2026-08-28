import type { ProblemNode } from '../../model/types';

export type CalculatorAxiomKey =
  | 'A1_INDEXING'
  | 'A2_ZERO_INDEXED_INFINITY'
  | 'A3_ZERO_IDENTITY'
  | 'A4_ZERO_RATIO'
  | 'A5_INFINITY_RATIO'
  | 'A6_GEOMETRIC_BRIDGE'
  | 'A7_INFINITY_SUBTRACTION'
  | 'A8_ZERO_SUBTRACTION'
  | 'A9_SCALAR_MULTIPLICATION'
  | 'A10_SCALAR_DIVISION'
  | 'SP1_LOCALITY'
  | 'SP2_REDUCTION'
  | 'SP4_SEMANTIC_INDEX';

export interface CalculatorCasePresetDTO {
  readonly caseId: string;
  readonly title: string;
  readonly inputFormula: string;
  readonly coordinateX?: number;
  readonly expectedInvariant: string;
  readonly primaryAxiom: CalculatorAxiomKey;
  readonly complexity: 'O(1)';
  readonly description: string;
  readonly leanTheoremName: string;
}

export interface SandboxExecutionPayloadDTO {
  readonly rawExpression: string;
  readonly variableSubstitutions: Readonly<Record<string, number | string>>;
  readonly targetPhase: -1 | 0 | 0.5 | 1 | 2 | 3 | 4 | 5 | 6;
  readonly mode: 'step_by_step' | 'instant_reduction';
}

export interface RicisCalculationPhaseTraceDTO {
  readonly phase: -1 | 0 | 0.5 | 1 | 2 | 3 | 4 | 5 | 6;
  readonly phaseName: string;
  readonly expressionBefore: string;
  readonly expressionAfter: string;
  readonly axiomApplied?: string;
  readonly explanation: string;
  readonly isSingularNode: boolean;
}

export interface RicisCalculationResultDTO {
  readonly success: boolean;
  readonly inputExpression: string;
  readonly finalInvariant: string;
  readonly numericValue: number | null;
  readonly traces: readonly RicisCalculationPhaseTraceDTO[];
  readonly leanProofCode?: string;
  readonly executionTimeMs: number;
  readonly errorMessage?: string;
}

export interface ICalculatorExplorerService {
  getCanonicalMonolithCases(): readonly CalculatorCasePresetDTO[];
  findCaseByNodeId(nodeId: string): CalculatorCasePresetDTO | null;
  createTerminalLaunchPayload(preset: CalculatorCasePresetDTO): SandboxExecutionPayloadDTO;
}

export interface IDeterministicRicisEngineService {
  evaluate(payload: SandboxExecutionPayloadDTO): Promise<RicisCalculationResultDTO>;
  resolveSingularity(op: '0/0' | '0*inf' | 'inf/inf' | 'inf-inf', f: string, g: string): RicisCalculationResultDTO;
}

/**
 * Контракт для поддержки бесплатных СУБД серверов на хостинге через шаблон-репозиторий
 */
export type FreeHostingDatabaseKind = 'cloud_sql_postgres_free_tier' | 'firebase_firestore_spark' | 'embedded_sqlite_volume';

export interface DatabaseServerTemplateDTO {
  readonly kind: FreeHostingDatabaseKind;
  readonly displayName: string;
  readonly freeTierLimits: string;
  readonly configurationTemplate: string;
  readonly migrationScriptExample: string;
  readonly isSupportedOnCurrentPlatform: boolean;
}

export interface IFreeHostingDatabaseService {
  getSupportedDatabaseTemplates(): readonly DatabaseServerTemplateDTO[];
  generateConnectionSnippet(kind: FreeHostingDatabaseKind): string;
}
