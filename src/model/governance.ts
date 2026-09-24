
export type FinalStatus = 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'BLOCKED' | 'REJECTED' | 'HYPOTHESIS';

export type ProvenanceStatus = 'SELF_REPORTED' | 'EXTERNALLY_VERIFIED';

export interface ICanonicalReport {
  originalGoal: string;
  result: string;
  verification: string;
  positiveResults: string[];
  negativeResults: string[];
  tukhtaFound: string[];
  rootCauses: string[];
  repairs: string[];
  remainingRisks: string[];
  evidence: string[];
  finalStatus: FinalStatus;
  confidence: number; // 0..1
}

/**
 * Universal wrapper for agent-generated results to prevent silent self-certification.
 * Forces explicit marking of whether the result was independently verified.
 */
export interface EvidenceProvenance<T = unknown> {
  readonly result: T;
  readonly provenance: ProvenanceStatus;
  readonly timestamp: string;
  readonly agentId?: string;
  readonly environment?: string;
  readonly report?: ICanonicalReport; // Canonical 12-point report
}
