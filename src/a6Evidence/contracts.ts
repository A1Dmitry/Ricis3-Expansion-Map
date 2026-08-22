export type A6EvidenceSourceKind = 'expression_tree' | 'ricis_node' | 'external_artifact';

/**
 * F and G are deferred typed expressions. Display notation is never their
 * identity: type and structural hash remain part of the RICIS L1 boundary.
 */
export interface DeferredExpressionIdentity {
  readonly typeTag: string;
  readonly structuralHash: string;
  readonly canonicalExpression: string;
  readonly displayLatex: string;
  readonly sourceKind: A6EvidenceSourceKind;
  readonly certifiedSingularityKeys: readonly string[];
}

export interface IndexedZeroWitness {
  readonly kind: 'indexed_zero';
  readonly payload: DeferredExpressionIdentity;
}

export interface IndexedInfinityWitness {
  readonly kind: 'indexed_infinity';
  readonly payload: DeferredExpressionIdentity;
}

/** Coordinate zero belongs to the RICIS geometric representation, not 0_F. */
export interface RicisCoordinateZero {
  readonly kind: 'ricis_coordinate_zero';
  readonly typeTag: string;
}

/**
 * Geometric expression of A6, valid only as part of the exact typed witness.
 * It is a RICIS representation, not a generic determinant parser or Lean proof.
 */
export interface RicisGeometricA6Representation {
  readonly kind: 'ricis_geometric_a6';
  readonly leftVector: {
    readonly x: DeferredExpressionIdentity;
    readonly y: RicisCoordinateZero;
  };
  readonly rightVector: {
    readonly x: RicisCoordinateZero;
    readonly y: DeferredExpressionIdentity;
  };
  readonly determinantCanonical: string;
}

export interface A6BridgeWitness {
  readonly schemaVersion: 'a6-witness/v1';
  readonly witnessId: string;
  readonly witnessHash: string;
  readonly operation: 'indexed_zero_times_indexed_infinity';
  readonly left: IndexedZeroWitness;
  readonly right: IndexedInfinityWitness;
  readonly l0PayloadPreserved: true;
  readonly l1TypeConsistent: true;
  readonly sp2ReductionCompleted: true;
  readonly sp4SemanticIndexingCompleted: true;
  readonly geometricRepresentation: RicisGeometricA6Representation;
}

export interface A6StructuralProduct {
  readonly kind: 'a6_structural_product';
  readonly witnessHash: string;
  readonly product: DeferredExpressionIdentity;
}

export type A6NonApplicabilityReason =
  | 'operation_not_a6'
  | 'missing_indexed_zero'
  | 'missing_indexed_infinity'
  | 'sp2_reduction_incomplete'
  | 'sp4_semantic_indexing_incomplete'
  | 'l0_payload_not_preserved'
  | 'l1_type_inconsistent'
  | 'geometric_representation_missing';

export interface A6NonApplicableAssessment {
  readonly kind: 'a6_non_applicable';
  readonly reason: A6NonApplicabilityReason;
  readonly inputReferenceHash: string;
}

export type A6WitnessAssessment =
  | { readonly kind: 'a6_applicable'; readonly witness: A6BridgeWitness }
  | A6NonApplicableAssessment;

export type A6AgentAvailability =
  | {
      readonly kind: 'ready';
      readonly providerFingerprint: string;
      readonly qualificationId: string;
    }
  | {
      readonly kind: 'agent_unavailable';
      readonly reason:
        | 'static_host_unavailable'
        | 'unconfigured'
        | 'disabled'
        | 'quota_exhausted'
        | 'rate_limited'
        | 'provider_unavailable';
    };

export type A6CoreAvailability =
  | { readonly kind: 'ready'; readonly runtime: 'csharp_api' | 'csharp_wasm' }
  | {
      readonly kind: 'core_unavailable';
      readonly code:
        | 'CORE_UNAVAILABLE'
        | 'CORE_INPUT_REJECTED'
        | 'CORE_INFRASTRUCTURE_ERROR'
        | 'CORE_INVALID_RESPONSE';
      readonly retryable: boolean;
    };

export type LeanA6Availability =
  | { readonly kind: 'ready'; readonly toolchainFingerprint: string }
  | {
      readonly kind: 'lean_unavailable';
      readonly reason:
        | 'not_requested'
        | 'static_host_unavailable'
        | 'bridge_unsupported'
        | 'toolchain_unavailable'
        | 'execution_failed';
    };

export type A6EvidenceScope =
  | 'agent_structural_assessment'
  | 'core_execution_evidence'
  | 'lean_kernel_evidence';

export interface AgentA6Evidence {
  readonly kind: 'agent_a6_evidence';
  readonly evidenceScope: 'agent_structural_assessment';
  readonly witnessHash: string;
  readonly reducedProduct: A6StructuralProduct;
  readonly traceHash: string;
  readonly providerFingerprint: string;
  readonly qualificationId: string;
}

export interface CoreA6Evidence {
  readonly kind: 'core_a6_evidence';
  readonly evidenceScope: 'core_execution_evidence';
  readonly witnessHash: string;
  readonly reducedProduct: A6StructuralProduct;
  readonly runtime: 'csharp_api' | 'csharp_wasm';
  readonly traceHash: string;
}

export interface LeanA6Evidence {
  readonly kind: 'lean_a6_evidence';
  readonly evidenceScope: 'lean_kernel_evidence';
  readonly witnessHash: string;
  readonly reducedProduct: A6StructuralProduct;
  readonly immutableSourceHash: string;
  readonly compilerEvidenceHash: string;
  readonly axiomReportHash: string;
}

export interface AgentA6Unavailable {
  readonly kind: 'agent_assessment_unavailable';
  readonly witnessHash: string;
  readonly availability: Exclude<A6AgentAvailability, { readonly kind: 'ready' }>;
}

export interface CoreA6Unavailable {
  readonly kind: 'core_confirmation_unavailable';
  readonly witnessHash: string;
  readonly availability: Exclude<A6CoreAvailability, { readonly kind: 'ready' }>;
}

export interface LeanA6Unavailable {
  readonly kind: 'lean_verification_unavailable';
  readonly witnessHash: string;
  readonly availability: Exclude<LeanA6Availability, { readonly kind: 'ready' }>;
}

export type A6AgentRecord = AgentA6Evidence | AgentA6Unavailable;
export type A6CoreRecord = CoreA6Evidence | CoreA6Unavailable;
export type A6LeanRecord = LeanA6Evidence | LeanA6Unavailable;

export type A6EvidenceConflict =
  | {
      readonly kind: 'witness_mismatch';
      readonly evidenceScope: A6EvidenceScope;
      readonly receivedWitnessHash: string;
    }
  | {
      readonly kind: 'reduced_product_mismatch';
      readonly leftScope: A6EvidenceScope;
      readonly rightScope: A6EvidenceScope;
      readonly leftProductHash: string;
      readonly rightProductHash: string;
    }
  | {
      readonly kind: 'type_mismatch';
      readonly evidenceScope: A6EvidenceScope;
      readonly expectedTypeTag: string;
      readonly receivedTypeTag: string;
    };

export type A6MergeStatus =
  | { readonly kind: 'agent_only' }
  | { readonly kind: 'core_only' }
  | { readonly kind: 'lean_only' }
  | { readonly kind: 'agent_and_core_concordant' }
  | { readonly kind: 'agent_and_lean_concordant' }
  | { readonly kind: 'core_and_lean_concordant' }
  | { readonly kind: 'all_concordant' }
  | { readonly kind: 'all_unavailable' }
  | { readonly kind: 'evidence_conflict'; readonly conflicts: readonly A6EvidenceConflict[] };

export interface A6EvidenceEnvelope {
  readonly schemaVersion: 'a6-evidence/v1';
  readonly witness: A6BridgeWitness;
  readonly agent: A6AgentRecord;
  readonly core: A6CoreRecord;
  readonly lean: A6LeanRecord;
  readonly mergeStatus: A6MergeStatus;
}

export interface A6EvidenceMergeInput {
  readonly witness: A6BridgeWitness;
  readonly agent: A6AgentRecord;
  readonly core: A6CoreRecord;
  readonly lean: A6LeanRecord;
}

/** Independent ports: neither implementation is a fallback for the other. */
export interface IAgentA6EvidencePort {
  availability(): Promise<A6AgentAvailability>;
  assess(input: A6BridgeWitness): Promise<AgentA6Evidence | AgentA6Unavailable>;
}

export interface ICoreA6EvidencePort {
  availability(): Promise<A6CoreAvailability>;
  execute(input: A6BridgeWitness): Promise<CoreA6Evidence | CoreA6Unavailable>;
}

export interface ILeanA6EvidencePort {
  availability(): Promise<LeanA6Availability>;
  verify(input: A6BridgeWitness): Promise<LeanA6Evidence | LeanA6Unavailable>;
}

export interface IA6EvidenceMerger {
  merge(input: A6EvidenceMergeInput): A6EvidenceEnvelope;
}
