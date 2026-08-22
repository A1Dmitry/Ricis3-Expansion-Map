import type {
  A6AgentRecord,
  A6BridgeWitness,
  A6CoreRecord,
  A6EvidenceConflict,
  A6EvidenceEnvelope,
  A6EvidenceMergeInput,
  A6EvidenceScope,
  A6LeanRecord,
  A6MergeStatus,
  A6WitnessAssessment,
  DeferredExpressionIdentity,
  IA6EvidenceMerger,
  RicisCoordinateZero,
  RicisGeometricA6Representation,
} from './contracts';

type UnknownRecord = Record<string, unknown>;

type A6Record = A6AgentRecord | A6CoreRecord | A6LeanRecord;

type AvailableA6Record = Extract<A6Record, { readonly evidenceScope: A6EvidenceScope }>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isExpressionIdentity(value: unknown): value is DeferredExpressionIdentity {
  return isRecord(value)
    && isNonEmptyString(value.typeTag)
    && isNonEmptyString(value.structuralHash)
    && isNonEmptyString(value.canonicalExpression)
    && isNonEmptyString(value.displayLatex)
    && (value.sourceKind === 'expression_tree' || value.sourceKind === 'ricis_node' || value.sourceKind === 'external_artifact')
    && Array.isArray(value.certifiedSingularityKeys)
    && value.certifiedSingularityKeys.every(isNonEmptyString);
}

function sameExpressionIdentity(left: DeferredExpressionIdentity, right: DeferredExpressionIdentity): boolean {
  return left.typeTag === right.typeTag
    && left.structuralHash === right.structuralHash
    && left.canonicalExpression === right.canonicalExpression;
}

function isCoordinateZero(value: unknown, typeTag: string): value is RicisCoordinateZero {
  return isRecord(value)
    && value.kind === 'ricis_coordinate_zero'
    && value.typeTag === typeTag;
}

function hasValidGeometricRepresentation(
  value: unknown,
  left: DeferredExpressionIdentity,
  right: DeferredExpressionIdentity,
): value is RicisGeometricA6Representation {
  if (!isRecord(value) || value.kind !== 'ricis_geometric_a6' || !isRecord(value.leftVector) || !isRecord(value.rightVector)) {
    return false;
  }

  return isExpressionIdentity(value.leftVector.x)
    && isExpressionIdentity(value.rightVector.y)
    && sameExpressionIdentity(value.leftVector.x, left)
    && sameExpressionIdentity(value.rightVector.y, right)
    && isCoordinateZero(value.leftVector.y, left.typeTag)
    && isCoordinateZero(value.rightVector.x, right.typeTag)
    && isNonEmptyString(value.determinantCanonical);
}

/**
 * Validates only the immutable typed RICIS A6 witness. It never parses an
 * arbitrary determinant string and never creates F/G defaults.
 */
export function assessA6BridgeWitness(
  candidate: unknown,
  inputReferenceHash: string,
): A6WitnessAssessment {
  if (!isRecord(candidate) || candidate.operation !== 'indexed_zero_times_indexed_infinity') {
    return { kind: 'a6_non_applicable', reason: 'operation_not_a6', inputReferenceHash };
  }

  if (!isRecord(candidate.left) || candidate.left.kind !== 'indexed_zero' || !isExpressionIdentity(candidate.left.payload)) {
    return { kind: 'a6_non_applicable', reason: 'missing_indexed_zero', inputReferenceHash };
  }

  if (!isRecord(candidate.right) || candidate.right.kind !== 'indexed_infinity' || !isExpressionIdentity(candidate.right.payload)) {
    return { kind: 'a6_non_applicable', reason: 'missing_indexed_infinity', inputReferenceHash };
  }

  if (candidate.l0PayloadPreserved !== true) {
    return { kind: 'a6_non_applicable', reason: 'l0_payload_not_preserved', inputReferenceHash };
  }

  if (candidate.l1TypeConsistent !== true) {
    return { kind: 'a6_non_applicable', reason: 'l1_type_inconsistent', inputReferenceHash };
  }

  if (candidate.sp2ReductionCompleted !== true) {
    return { kind: 'a6_non_applicable', reason: 'sp2_reduction_incomplete', inputReferenceHash };
  }

  if (candidate.sp4SemanticIndexingCompleted !== true) {
    return { kind: 'a6_non_applicable', reason: 'sp4_semantic_indexing_incomplete', inputReferenceHash };
  }

  if (!hasValidGeometricRepresentation(candidate.geometricRepresentation, candidate.left.payload, candidate.right.payload)) {
    return { kind: 'a6_non_applicable', reason: 'geometric_representation_missing', inputReferenceHash };
  }

  if (
    candidate.schemaVersion !== 'a6-witness/v1'
    || !isNonEmptyString(candidate.witnessId)
    || !isNonEmptyString(candidate.witnessHash)
  ) {
    return { kind: 'a6_non_applicable', reason: 'l0_payload_not_preserved', inputReferenceHash };
  }

  // All A6BridgeWitness fields and nested identities were validated above.
  // UnknownRecord intentionally has no structural overlap with the readonly DTO.
  return { kind: 'a6_applicable', witness: candidate as unknown as A6BridgeWitness };
}

function evidenceScope(record: A6Record): A6EvidenceScope {
  if (record.kind === 'agent_a6_evidence' || record.kind === 'agent_assessment_unavailable') {
    return 'agent_structural_assessment';
  }
  if (record.kind === 'core_a6_evidence' || record.kind === 'core_confirmation_unavailable') {
    return 'core_execution_evidence';
  }
  return 'lean_kernel_evidence';
}

function recordWitnessHash(record: A6Record): string {
  return record.witnessHash;
}

function availableRecord(record: A6Record): record is AvailableA6Record {
  return record.kind === 'agent_a6_evidence'
    || record.kind === 'core_a6_evidence'
    || record.kind === 'lean_a6_evidence';
}

function appendWitnessMismatch(
  conflicts: A6EvidenceConflict[],
  witnessHash: string,
  record: A6Record,
): void {
  if (recordWitnessHash(record) !== witnessHash) {
    conflicts.push({
      kind: 'witness_mismatch',
      evidenceScope: evidenceScope(record),
      receivedWitnessHash: recordWitnessHash(record),
    });
  }
}

function appendProductConflicts(
  conflicts: A6EvidenceConflict[],
  availableRecords: readonly AvailableA6Record[],
): void {
  for (let leftIndex = 0; leftIndex < availableRecords.length; leftIndex += 1) {
    const left = availableRecords[leftIndex]!;
    for (let rightIndex = leftIndex + 1; rightIndex < availableRecords.length; rightIndex += 1) {
      const right = availableRecords[rightIndex]!;
      const leftProduct = left.reducedProduct.product;
      const rightProduct = right.reducedProduct.product;

      if (left.reducedProduct.witnessHash !== left.witnessHash) {
        conflicts.push({
          kind: 'witness_mismatch',
          evidenceScope: left.evidenceScope,
          receivedWitnessHash: left.reducedProduct.witnessHash,
        });
      }
      if (right.reducedProduct.witnessHash !== right.witnessHash) {
        conflicts.push({
          kind: 'witness_mismatch',
          evidenceScope: right.evidenceScope,
          receivedWitnessHash: right.reducedProduct.witnessHash,
        });
      }
      if (leftProduct.structuralHash !== rightProduct.structuralHash) {
        conflicts.push({
          kind: 'reduced_product_mismatch',
          leftScope: left.evidenceScope,
          rightScope: right.evidenceScope,
          leftProductHash: leftProduct.structuralHash,
          rightProductHash: rightProduct.structuralHash,
        });
      }
      if (leftProduct.typeTag !== rightProduct.typeTag) {
        conflicts.push({
          kind: 'type_mismatch',
          evidenceScope: right.evidenceScope,
          expectedTypeTag: leftProduct.typeTag,
          receivedTypeTag: rightProduct.typeTag,
        });
      }
    }
  }
}

function mergeStatus(availableRecords: readonly AvailableA6Record[]): A6MergeStatus {
  const scopes = new Set(availableRecords.map((record) => record.evidenceScope));
  if (scopes.size === 0) return { kind: 'all_unavailable' };
  if (scopes.size === 1) {
    if (scopes.has('agent_structural_assessment')) return { kind: 'agent_only' };
    if (scopes.has('core_execution_evidence')) return { kind: 'core_only' };
    return { kind: 'lean_only' };
  }
  if (scopes.size === 2) {
    if (scopes.has('agent_structural_assessment') && scopes.has('core_execution_evidence')) {
      return { kind: 'agent_and_core_concordant' };
    }
    if (scopes.has('agent_structural_assessment') && scopes.has('lean_kernel_evidence')) {
      return { kind: 'agent_and_lean_concordant' };
    }
    return { kind: 'core_and_lean_concordant' };
  }
  return { kind: 'all_concordant' };
}

/**
 * Pure deterministic merger. It retains every evidence record, including typed
 * unavailability, and never selects a winner or changes graph/proof trust.
 */
export class A6EvidenceMerger implements IA6EvidenceMerger {
  public merge(input: A6EvidenceMergeInput): A6EvidenceEnvelope {
    const records: readonly A6Record[] = [input.agent, input.core, input.lean];
    const conflicts: A6EvidenceConflict[] = [];

    for (const record of records) {
      appendWitnessMismatch(conflicts, input.witness.witnessHash, record);
    }

    const availableRecords = records.filter(availableRecord);
    appendProductConflicts(conflicts, availableRecords);

    return {
      schemaVersion: 'a6-evidence/v1',
      witness: input.witness,
      agent: input.agent,
      core: input.core,
      lean: input.lean,
      mergeStatus: conflicts.length > 0
        ? { kind: 'evidence_conflict', conflicts }
        : mergeStatus(availableRecords),
    };
  }
}
