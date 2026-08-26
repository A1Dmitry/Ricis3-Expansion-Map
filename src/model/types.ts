export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export type NodeState = 'unresolved' | 'partial' | 'resolved';

export interface EconomicInfo {
  costUnresolved: number;
  costToSolve: number;
  marketGain: number;
  riskLoss: number;
}

/** Класс награды / мотивации за решение. */
export type RewardClass = 'clay' | 'nobel' | 'commercial' | 'reputation';

export interface ProblemNode {
  id: string;
  title: string;
  description: string;
  state: NodeState;
  type: 'core_singularity' | 'derived_problem' | 'scientific_task' | 'derivative_claim';
  targetFunction: string;
  zoneIds: string[];
  dependencyIds: string[];
  dependentIds: string[];
  fractalDepth: number;
  economic: EconomicInfo;
  /** clay / nobel — высший приз; commercial — рынок; reputation — известность. */
  rewardClass?: RewardClass;
  /** Клей, Нобель, премия и т.п. */
  prizeNote?: string;
  /** Суть сингулярности в постановке задачи. */
  singularityHint?: string;
  /** Внешний источник / Wiki / DOI (кликабельная ссылка в карточке). */
  sourceUrl?: string;
  /** Уже решаема протоколом RICIS-III (ядро / готовые ветки). */
  ricisSolvable?: boolean;
  /** Дата первого публичного упоминания (ISO). Для derivative_claim. */
  firstMentionDate?: string;
  /** Внешняя публикация/код с семантикой RICIS без явной атрибуции. */
  isDerivativeClaim?: boolean;
  /** Оценка сходства с RICIS 0..1. */
  derivativeScore?: number;
  /** Совпавшие сигнатуры (SP2, A6, …). */
  matchedSignatures?: string[];
  /** Ошибки формальной верификации Lean 4 */
  leanErrors?: string[];
  /** Предупреждения формальной верификации Lean 4 */
  leanWarnings?: string[];
}

export type EdgeColor = 'red' | 'yellow' | 'green' | 'blue' | 'purple';

export interface DependencyEdge {
  id: string;
  fromId: string;
  toId: string;
  strength: number;
  stateColor: EdgeColor;
  economicInfluence: number;
}

export interface ScienceZone {
  id: string;
  name: string;
  description: string;
  nodeIds: string[];
  economicProfile: EconomicInfo;
}

export interface Axiom {
  id: string;
  sourceNodeId: string;
  formalStatement: string;
  usedByNodeIds: string[];
}

export interface ProofStep {
  phase: number | string;
  name: string;
  action: string;
  expression: string;
}

export type ExternalLeanTrustStatus =
  | 'REQUIRES_CORE_LEAN'
  | 'LEAN_VERIFIED'
  | 'TRUSTED_AXIOM'
  | 'REJECTED';

export interface LeanKernelVerificationEvidence {
  toolchain: string;
  command: string;
  compilerOutput: string;
  axiomReport: string;
  verifiedAt: string;
}

export interface ExternalLeanProvenance {
  sourceHash: string;
  submittedAt: string;
  sourceLocked: true;
  trustStatus: ExternalLeanTrustStatus;
  kernelEvidence?: LeanKernelVerificationEvidence;
}

export interface Proof {
  nodeId: string;
  targetFunction: string;
  steps: ProofStep[];
  finalResult: string;
  latex: string;
  /** Present only when the original text was supplied externally as Lean source. */
  externalLean?: ExternalLeanProvenance;
}

export type AgentLogLevel = 'info' | 'success' | 'warn' | 'error' | 'ricis';

export interface AgentLogEntry {
  id: string;
  timestamp: string;
  message: string;
  level: AgentLogLevel;
  details?: string;
  nodeId?: string;
}

export interface MapState {
  nodes: ProblemNode[];
  edges: DependencyEdge[];
  zones: ScienceZone[];
  axioms: Axiom[];
  proofs: Record<string, Proof>;
  agentLogs: AgentLogEntry[];
}
