/**
 * Domain types for residual proof-chain pipeline
 * Pure model — no React/DOM/network imports
 */
import type { ProblemNode, NodeState, MapState } from '../../model/types';

// Re-export for convenience
export type { ProblemNode, MapState, NodeState } from '../../model/types';

export type NodeId = string;
export type SingularityClassId = string;
export type ChainBlockedReason = 'CYCLE' | 'BROKEN_LINK';
export type TrustOrigin = 'production' | 'manual-ui-test' | 'unknown';

// Extended node with optional provenance for trust gate (test seam, not persisted blindly)
export interface ProvenanceProblemNode extends ProblemNode {
  __provenance?: TrustOrigin;
  __derivationJournal?: string;
  // priorityEstimate must be top-level patch only, not inside node proofStatus object (T10)
  // This field is intentionally NOT allowed inside proofStatus; serializer will reject if misplaced
  // We keep it optional here only for testing misplacement detection — real usage must separate
  // priorityEstimate?: unknown
}

// Chain walk results
export interface ChainWalkSuccess {
  readonly status: 'OK';
  readonly chain: readonly ProblemNode[];
  readonly leafId: NodeId;
  readonly chainLength: number;
  readonly evaluationPoint: string;
}

export interface ChainBlocked {
  readonly status: 'BLOCKED';
  readonly reason: ChainBlockedReason;
  readonly missingId?: string;
  readonly details?: string;
}

export type ChainWalkResult = ChainWalkSuccess | ChainBlocked;

// Residual calculation
export interface ResidualObligation {
  readonly leafId: NodeId;
  readonly classId: SingularityClassId;
  readonly obligations: readonly string[];
  readonly chainLength: number;
  readonly evaluationPoint: string;
  // Note: no market/monetization field may share this object (forbiddenPattern)
}

export interface ResidualPending {
  readonly ready: false;
  readonly debt: readonly string[];
  readonly blockedAncestors: readonly ProblemNode[];
}

export interface ResidualReady {
  readonly ready: true;
  readonly residual: ResidualObligation;
}

export type ResidualResult = ResidualReady | ResidualPending;

// Generalization
export interface GeneralizeTask {
  readonly id: string;
  readonly classId: SingularityClassId;
  readonly status: 'open' | 'resolved';
  readonly sourceInstanceId: NodeId;
  readonly createdAt: string;
}

// Inheritance
export interface InheritanceSuccess {
  readonly inherited: true;
  readonly fromGeneralId: string;
  readonly classId: SingularityClassId;
  readonly chainLength: number;
}

export interface InheritanceFailure {
  readonly inherited: false;
  readonly reason: 'NO_GENERAL' | 'CLASS_MISMATCH' | 'TRUST_GATE_REJECTED' | 'GENERAL_NOT_RESOLVED';
  readonly details?: string;
}

export type InheritanceResult = InheritanceSuccess | InheritanceFailure;

// Patch DTO — RICIS.MapStatePatch subset for residual/inheritance
// scoringMetadataContract: priorityEstimate must be top-level separate field
export interface PriorityEstimate {
  readonly label: 'ESTIMATE_FOR_RANKING';
  readonly complexityScore: number | null;
  readonly expectedEffect: string | number | null;
  readonly basis: string;
}

export interface MapStatePatchDTO {
  readonly '@type': 'RICIS.MapStatePatch';
  readonly meta: {
    readonly method: string;
    readonly generated: string;
    readonly trustPolicy: string;
  };
  readonly nodePatches?: ReadonlyArray<{
    readonly id: string;
    readonly state: NodeState;
    readonly title?: string;
  }>;
  readonly proofs?: Record<string, unknown>;
  readonly edges?: ReadonlyArray<unknown>;
  // Metadata fields reflecting actual computation (must equal real values, not defaults)
  readonly patchMetadata: {
    readonly classId: SingularityClassId;
    readonly chainLength: number;
    readonly evaluationPoint: string;
  };
  // priorityEstimate must be top-level and never share object with proofStatus/resolved/residual
  // It must NOT appear inside proofStatus, resolved, residual or any object containing classId/chainLength
  readonly priorityEstimate?: PriorityEstimate;
  // Generic extension for tests to detect misplacement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly [extra: string]: any;
}

// Use case result discriminated union
export type UseCaseResult =
  | { readonly kind: 'BLOCKED'; readonly reason: ChainBlockedReason; readonly missingId?: string }
  | { readonly kind: 'INHERITED'; readonly patch: MapStatePatchDTO; readonly inheritance: InheritanceSuccess }
  | { readonly kind: 'RESIDUAL_READY'; readonly patch: MapStatePatchDTO; readonly residual: ResidualObligation; readonly generalization?: { readonly task: GeneralizeTask; readonly created: boolean } }
  | { readonly kind: 'DEBT'; readonly debt: readonly string[]; readonly blockedAncestors: readonly ProblemNode[] }
  | { readonly kind: 'REJECTED_TRUST'; readonly reason: string };
