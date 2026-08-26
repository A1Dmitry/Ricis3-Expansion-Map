export type RicisAxiomId = string;

export type OrchestrationStageId =
  | 'PARSING_AND_L1_CHECK'
  | 'AXIOMATIC_REDUCTION'
  | 'LEAN_CODEGEN'
  | 'GATEWAY_DISPATCH'
  | 'TRUST_VALIDATION';

export type OrchestrationStageStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'WARNING' | 'FAILED';

/** Лог трансформации и истории вычислений RICIS-III */
export interface TransformationLogEntry<T = string> {
  readonly stepIndex: number;
  readonly phaseName: string;
  readonly axiomUsed?: RicisAxiomId;
  readonly inputExpression: T;
  readonly outputExpression: T;
  readonly invariantPreserved: boolean;
  readonly timestamp: number;
  readonly rationaleHash: string;
}

/** Обёртка лога истории с семантическим индексом (SP4) */
export interface TransformationLog<T = string> {
  readonly id: string;
  readonly targetNodeId: string;
  readonly entries: ReadonlyArray<TransformationLogEntry<T>>;
  readonly initialExpression: T;
  readonly finalInvariant: T;
  readonly l1IdentityVerified: boolean;
}

/** Структурное число / Монада RICIS с типом и оригиналом */
export interface RicisNumber<T = string> {
  readonly value: number | null;
  readonly semanticIndex: string; // SP4: e.g. "0_f" or "0_g"
  readonly typeBoundary: T;      // L1C2: Ontological type
  readonly generatingOrigin: string; // L1: Origin expression F
  readonly isSingularity: boolean;
}

/** Описание конкретного шага оркестрации */
export interface IOrchestrationStepDTO {
  readonly stageId: OrchestrationStageId;
  readonly title: string;
  readonly description: string;
  readonly status: OrchestrationStageStatus;
  readonly startTimeMs: number;
  readonly endTimeMs?: number;
  readonly details?: string;
  readonly errorCode?: string;
  readonly errorMessage?: string;
}

/** Полный снимок состояния оркестратора для UI */
export interface IOrchestrationStateDTO {
  readonly pipelineId: string;
  readonly nodeId: string;
  readonly currentStage: OrchestrationStageId;
  readonly stages: ReadonlyArray<IOrchestrationStepDTO>;
  readonly transformationLog: TransformationLog<string>;
  readonly isComplete: boolean;
  readonly hasError: boolean;
}

/** Контракт наблюдателя этапов оркестрации */
export interface IOrchestrationPipelineObserver {
  onStageUpdate(state: IOrchestrationStateDTO): void;
  onStageError(stageId: OrchestrationStageId, error: Error): void;
}

/** Контракт Оркестратора разрешения сингулярностей RICIS-III */
export interface IRicisOrchestratorEngine {
  executePipeline(
    nodeId: string,
    targetExpression: string,
    observer?: IOrchestrationPipelineObserver
  ): Promise<IOrchestrationStateDTO>;
  getCurrentState(pipelineId: string): IOrchestrationStateDTO | undefined;
}
