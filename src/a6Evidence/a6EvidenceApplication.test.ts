import { describe, expect, it } from 'vitest';
import {
  A6EvidenceMerger,
  assessA6BridgeWitness,
} from './a6EvidenceApplication';
import type {
  A6BridgeWitness,
  A6StructuralProduct,
  AgentA6Evidence,
  AgentA6Unavailable,
  CoreA6Evidence,
  CoreA6Unavailable,
  DeferredExpressionIdentity,
  LeanA6Evidence,
  LeanA6Unavailable,
} from './contracts';

function expression(name: string, hash: string, typeTag = 'ricis-expression/real/v1'): DeferredExpressionIdentity {
  return {
    typeTag,
    structuralHash: hash,
    canonicalExpression: name,
    displayLatex: name,
    sourceKind: 'expression_tree',
    certifiedSingularityKeys: ['x=5'],
  };
}

const expressionF = expression('F=(x-5)', 'sha256:F');
const expressionG = expression('G=1/(x-5)', 'sha256:G');

function witness(overrides: Record<string, unknown> = {}): A6BridgeWitness {
  return {
    schemaVersion: 'a6-witness/v1',
    witnessId: 'a6-witness-f-g',
    witnessHash: 'sha256:witness-f-g',
    operation: 'indexed_zero_times_indexed_infinity',
    left: { kind: 'indexed_zero', payload: expressionF },
    right: { kind: 'indexed_infinity', payload: expressionG },
    l0PayloadPreserved: true,
    l1TypeConsistent: true,
    sp2ReductionCompleted: true,
    sp4SemanticIndexingCompleted: true,
    geometricRepresentation: {
      kind: 'ricis_geometric_a6',
      leftVector: { x: expressionF, y: { kind: 'ricis_coordinate_zero', typeTag: expressionF.typeTag } },
      rightVector: { x: { kind: 'ricis_coordinate_zero', typeTag: expressionG.typeTag }, y: expressionG },
      determinantCanonical: 'det((F,0_RICIS),(0_RICIS,G)) = F*G - 0_RICIS*0_RICIS = F*G',
    },
    ...overrides,
  } as A6BridgeWitness;
}

function product(currentWitness: A6BridgeWitness, hash = 'sha256:F-times-G', typeTag = expressionF.typeTag): A6StructuralProduct {
  return {
    kind: 'a6_structural_product',
    witnessHash: currentWitness.witnessHash,
    product: expression('F*G', hash, typeTag),
  };
}

function agentEvidence(currentWitness: A6BridgeWitness, currentProduct = product(currentWitness)): AgentA6Evidence {
  return {
    kind: 'agent_a6_evidence',
    evidenceScope: 'agent_structural_assessment',
    witnessHash: currentWitness.witnessHash,
    reducedProduct: currentProduct,
    traceHash: 'sha256:agent-trace',
    providerFingerprint: 'provider:agent-a',
    qualificationId: 'a6-profile-v1',
  };
}

function coreEvidence(currentWitness: A6BridgeWitness, currentProduct = product(currentWitness)): CoreA6Evidence {
  return {
    kind: 'core_a6_evidence',
    evidenceScope: 'core_execution_evidence',
    witnessHash: currentWitness.witnessHash,
    reducedProduct: currentProduct,
    runtime: 'csharp_api',
    traceHash: 'sha256:core-trace',
  };
}

function leanEvidence(currentWitness: A6BridgeWitness, currentProduct = product(currentWitness)): LeanA6Evidence {
  return {
    kind: 'lean_a6_evidence',
    evidenceScope: 'lean_kernel_evidence',
    witnessHash: currentWitness.witnessHash,
    reducedProduct: currentProduct,
    immutableSourceHash: 'sha256:lean-source',
    compilerEvidenceHash: 'sha256:lean-compiler',
    axiomReportHash: 'sha256:lean-axioms',
  };
}

function agentUnavailable(currentWitness: A6BridgeWitness): AgentA6Unavailable {
  return {
    kind: 'agent_assessment_unavailable',
    witnessHash: currentWitness.witnessHash,
    availability: { kind: 'agent_unavailable', reason: 'static_host_unavailable' },
  };
}

function coreUnavailable(currentWitness: A6BridgeWitness): CoreA6Unavailable {
  return {
    kind: 'core_confirmation_unavailable',
    witnessHash: currentWitness.witnessHash,
    availability: { kind: 'core_unavailable', code: 'CORE_UNAVAILABLE', retryable: true },
  };
}

function leanUnavailable(currentWitness: A6BridgeWitness): LeanA6Unavailable {
  return {
    kind: 'lean_verification_unavailable',
    witnessHash: currentWitness.witnessHash,
    availability: { kind: 'lean_unavailable', reason: 'not_requested' },
  };
}

describe('A6 multi-evidence application', () => {
  it('accepts the exact typed RICIS A6 witness and preserves F/G expression identity', () => {
    const currentWitness = witness();
    const assessment = assessA6BridgeWitness(currentWitness, 'sha256:input');

    expect(assessment).toEqual({ kind: 'a6_applicable', witness: currentWitness });
    expect(currentWitness.left.payload.structuralHash).toBe(expressionF.structuralHash);
    expect(currentWitness.right.payload.structuralHash).toBe(expressionG.structuralHash);
  });

  it('rejects arbitrary determinant-only or wrong-operation values without throwing or synthesizing F/G', () => {
    const determinantOnly = {
      ...witness(),
      operation: 'ordinary_determinant',
      determinant: 'det(u,v)=F*G',
    };

    expect(() => assessA6BridgeWitness(determinantOnly, 'sha256:determinant-only')).not.toThrow();
    expect(assessA6BridgeWitness(determinantOnly, 'sha256:determinant-only')).toEqual({
      kind: 'a6_non_applicable',
      reason: 'operation_not_a6',
      inputReferenceHash: 'sha256:determinant-only',
    });
  });

  it('enforces L0/L1/SP2/SP4 before accepting A6', () => {
    expect(assessA6BridgeWitness(witness({ l0PayloadPreserved: false }), 'l0')).toMatchObject({
      kind: 'a6_non_applicable', reason: 'l0_payload_not_preserved',
    });
    expect(assessA6BridgeWitness(witness({ l1TypeConsistent: false }), 'l1')).toMatchObject({
      kind: 'a6_non_applicable', reason: 'l1_type_inconsistent',
    });
    expect(assessA6BridgeWitness(witness({ sp2ReductionCompleted: false }), 'sp2')).toMatchObject({
      kind: 'a6_non_applicable', reason: 'sp2_reduction_incomplete',
    });
    expect(assessA6BridgeWitness(witness({ sp4SemanticIndexingCompleted: false }), 'sp4')).toMatchObject({
      kind: 'a6_non_applicable', reason: 'sp4_semantic_indexing_incomplete',
    });
  });

  it('rejects a geometric representation that erases F/G payload identity or conflates coordinate zero', () => {
    const malformed = witness({
      geometricRepresentation: {
        kind: 'ricis_geometric_a6',
        leftVector: { x: expression('other-F', 'sha256:other-F'), y: { kind: 'indexed_zero', payload: expressionF } },
        rightVector: { x: { kind: 'ricis_coordinate_zero', typeTag: expressionG.typeTag }, y: expressionG },
        determinantCanonical: 'det(u,v)',
      },
    });

    expect(assessA6BridgeWitness(malformed, 'sha256:malformed-geometry')).toEqual({
      kind: 'a6_non_applicable',
      reason: 'geometric_representation_missing',
      inputReferenceHash: 'sha256:malformed-geometry',
    });
  });

  it('merges agent-only deployment while retaining typed Core and Lean unavailability', () => {
    const currentWitness = witness();
    const result = new A6EvidenceMerger().merge({
      witness: currentWitness,
      agent: agentEvidence(currentWitness),
      core: coreUnavailable(currentWitness),
      lean: leanUnavailable(currentWitness),
    });

    expect(result.mergeStatus).toEqual({ kind: 'agent_only' });
    expect(result.core.kind).toBe('core_confirmation_unavailable');
    expect(result.lean.kind).toBe('lean_verification_unavailable');
  });

  it('merges Core-only deployment without fabricating Agent evidence', () => {
    const currentWitness = witness();
    const result = new A6EvidenceMerger().merge({
      witness: currentWitness,
      agent: agentUnavailable(currentWitness),
      core: coreEvidence(currentWitness),
      lean: leanUnavailable(currentWitness),
    });

    expect(result.mergeStatus).toEqual({ kind: 'core_only' });
    expect(result.agent).toEqual(agentUnavailable(currentWitness));
  });

  it('merges all unavailable topology while preserving the original witness', () => {
    const currentWitness = witness();
    const result = new A6EvidenceMerger().merge({
      witness: currentWitness,
      agent: agentUnavailable(currentWitness),
      core: coreUnavailable(currentWitness),
      lean: leanUnavailable(currentWitness),
    });

    expect(result.mergeStatus).toEqual({ kind: 'all_unavailable' });
    expect(result.witness).toBe(currentWitness);
  });

  it('marks all three independent records concordant only when their product and type identities agree', () => {
    const currentWitness = witness();
    const sharedProduct = product(currentWitness);
    const result = new A6EvidenceMerger().merge({
      witness: currentWitness,
      agent: agentEvidence(currentWitness, sharedProduct),
      core: coreEvidence(currentWitness, sharedProduct),
      lean: leanEvidence(currentWitness, sharedProduct),
    });

    expect(result.mergeStatus).toEqual({ kind: 'all_concordant' });
  });

  it('preserves a witness mismatch as conflict rather than discarding available evidence', () => {
    const currentWitness = witness();
    const mismatchedCore = { ...coreEvidence(currentWitness), witnessHash: 'sha256:other-witness' } as CoreA6Evidence;
    const result = new A6EvidenceMerger().merge({
      witness: currentWitness,
      agent: agentEvidence(currentWitness),
      core: mismatchedCore,
      lean: leanUnavailable(currentWitness),
    });

    expect(result.mergeStatus.kind).toBe('evidence_conflict');
    if (result.mergeStatus.kind === 'evidence_conflict') {
      expect(result.mergeStatus.conflicts).toContainEqual({
        kind: 'witness_mismatch',
        evidenceScope: 'core_execution_evidence',
        receivedWitnessHash: 'sha256:other-witness',
      });
    }
    expect(result.agent.kind).toBe('agent_a6_evidence');
    expect(result.core).toBe(mismatchedCore);
  });

  it('marks product/type mismatch without selecting an evidence winner or setting proof status', () => {
    const currentWitness = witness();
    const result = new A6EvidenceMerger().merge({
      witness: currentWitness,
      agent: agentEvidence(currentWitness, product(currentWitness, 'sha256:agent-product')),
      core: coreEvidence(currentWitness, product(currentWitness, 'sha256:core-product', 'ricis-expression/complex/v1')),
      lean: leanUnavailable(currentWitness),
    });

    expect(result.mergeStatus.kind).toBe('evidence_conflict');
    if (result.mergeStatus.kind === 'evidence_conflict') {
      expect(result.mergeStatus.conflicts.map((conflict) => conflict.kind)).toEqual([
        'reduced_product_mismatch',
        'type_mismatch',
      ]);
    }
    expect(JSON.stringify(result)).not.toContain('resolved');
    expect(JSON.stringify(result)).not.toContain('LeanVerified');
    expect(JSON.stringify(result)).not.toContain('winner');
  });
});
