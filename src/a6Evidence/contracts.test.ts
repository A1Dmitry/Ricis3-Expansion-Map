import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import type {
  A6AgentRecord,
  A6BridgeWitness,
  A6CoreRecord,
  A6EvidenceConflict,
  A6EvidenceEnvelope,
  A6EvidenceScope,
  A6LeanRecord,
  A6NonApplicableAssessment,
  A6StructuralProduct,
  AgentA6Evidence,
  AgentA6Unavailable,
  CoreA6Evidence,
  CoreA6Unavailable,
  DeferredExpressionIdentity,
  IAgentA6EvidencePort,
  ICoreA6EvidencePort,
  ILeanA6EvidencePort,
  LeanA6Evidence,
  LeanA6Unavailable,
  RicisCoordinateZero,
} from './contracts';

const expressionF = {
  typeTag: 'ricis-expression/real/v1',
  structuralHash: 'sha256:F-expression',
  canonicalExpression: '(x - 5)',
  displayLatex: 'x - 5',
  sourceKind: 'expression_tree',
  certifiedSingularityKeys: ['x=5'],
} as const satisfies DeferredExpressionIdentity;

const expressionG = {
  typeTag: 'ricis-expression/real/v1',
  structuralHash: 'sha256:G-expression',
  canonicalExpression: '1 / (x - 5)',
  displayLatex: '\\frac{1}{x - 5}',
  sourceKind: 'expression_tree',
  certifiedSingularityKeys: ['x=5'],
} as const satisfies DeferredExpressionIdentity;

const coordinateZero = {
  kind: 'ricis_coordinate_zero',
  typeTag: 'ricis-expression/real/v1',
} as const satisfies RicisCoordinateZero;

const witness = {
  schemaVersion: 'a6-witness/v1',
  witnessId: 'a6-witness-typed-f-g',
  witnessHash: 'sha256:a6-witness-f-g',
  operation: 'indexed_zero_times_indexed_infinity',
  left: { kind: 'indexed_zero', payload: expressionF },
  right: { kind: 'indexed_infinity', payload: expressionG },
  l0PayloadPreserved: true,
  l1TypeConsistent: true,
  sp2ReductionCompleted: true,
  sp4SemanticIndexingCompleted: true,
  geometricRepresentation: {
    kind: 'ricis_geometric_a6',
    leftVector: { x: expressionF, y: coordinateZero },
    rightVector: { x: coordinateZero, y: expressionG },
    determinantCanonical: 'det((F,0_RICIS),(0_RICIS,G)) = F*G - 0_RICIS*0_RICIS = F*G',
  },
} as const satisfies A6BridgeWitness;

const structuralProduct = {
  kind: 'a6_structural_product',
  witnessHash: witness.witnessHash,
  product: {
    typeTag: 'ricis-expression/real/v1',
    structuralHash: 'sha256:F-times-G',
    canonicalExpression: '(x - 5) * (1 / (x - 5))',
    displayLatex: '(x - 5)\\cdot\\frac{1}{x - 5}',
    sourceKind: 'expression_tree',
    certifiedSingularityKeys: ['x=5'],
  },
} as const satisfies A6StructuralProduct;

const agentEvidence = {
  kind: 'agent_a6_evidence',
  evidenceScope: 'agent_structural_assessment',
  witnessHash: witness.witnessHash,
  reducedProduct: structuralProduct,
  traceHash: 'sha256:agent-a6-trace',
  providerFingerprint: 'provider:fingerprint-a',
  qualificationId: 'a6-profile-qualified-v1',
} as const satisfies AgentA6Evidence;

const coreEvidence = {
  kind: 'core_a6_evidence',
  evidenceScope: 'core_execution_evidence',
  witnessHash: witness.witnessHash,
  reducedProduct: structuralProduct,
  runtime: 'csharp_api',
  traceHash: 'sha256:core-a6-trace',
} as const satisfies CoreA6Evidence;

const leanEvidence = {
  kind: 'lean_a6_evidence',
  evidenceScope: 'lean_kernel_evidence',
  witnessHash: witness.witnessHash,
  reducedProduct: structuralProduct,
  immutableSourceHash: 'sha256:immutable-lean-source',
  compilerEvidenceHash: 'sha256:lean-compiler-output',
  axiomReportHash: 'sha256:lean-print-axioms',
} as const satisfies LeanA6Evidence;

const agentUnavailable = {
  kind: 'agent_assessment_unavailable',
  witnessHash: witness.witnessHash,
  availability: { kind: 'agent_unavailable', reason: 'static_host_unavailable' },
} as const satisfies AgentA6Unavailable;

const coreUnavailable = {
  kind: 'core_confirmation_unavailable',
  witnessHash: witness.witnessHash,
  availability: { kind: 'core_unavailable', code: 'CORE_UNAVAILABLE', retryable: true },
} as const satisfies CoreA6Unavailable;

const leanUnavailable = {
  kind: 'lean_verification_unavailable',
  witnessHash: witness.witnessHash,
  availability: { kind: 'lean_unavailable', reason: 'not_requested' },
} as const satisfies LeanA6Unavailable;

function envelope(
  agent: A6AgentRecord,
  core: A6CoreRecord,
  lean: A6LeanRecord,
  mergeStatus: A6EvidenceEnvelope['mergeStatus'],
): A6EvidenceEnvelope {
  return {
    schemaVersion: 'a6-evidence/v1',
    witness,
    agent,
    core,
    lean,
    mergeStatus,
  };
}

describe('A6 multi-evidence QA contract', () => {
  it('preserves F and G as typed deferred expression payloads under L0/L1 and not scalar coefficients', () => {
    expect(witness.left.payload).toEqual(expressionF);
    expect(witness.right.payload).toEqual(expressionG);
    expect(witness.left.payload.structuralHash).not.toBe(witness.right.payload.structuralHash);
    expect(witness.l0PayloadPreserved).toBe(true);
    expect(witness.l1TypeConsistent).toBe(true);
    expect(witness.sp2ReductionCompleted).toBe(true);
    expect(witness.sp4SemanticIndexingCompleted).toBe(true);
  });

  it('models determinant geometry as RICIS A6 representation while keeping coordinate zero distinct from indexed 0_F', () => {
    expect(witness.geometricRepresentation.kind).toBe('ricis_geometric_a6');
    expect(witness.geometricRepresentation.leftVector.x).toBe(witness.left.payload);
    expect(witness.geometricRepresentation.rightVector.y).toBe(witness.right.payload);
    expect(witness.geometricRepresentation.leftVector.y).toEqual(coordinateZero);
    expect(witness.geometricRepresentation.leftVector.y.kind).not.toBe(witness.left.kind);
    expect(witness.geometricRepresentation.determinantCanonical).toContain('0_RICIS');
  });

  it('keeps a general/non-A6 input a typed non-application outcome rather than fabricated F/G witness data', () => {
    const nonApplicable = {
      kind: 'a6_non_applicable',
      reason: 'missing_indexed_infinity',
      inputReferenceHash: 'sha256:determinant-only-text',
    } as const satisfies A6NonApplicableAssessment;

    expect(nonApplicable.reason).toBe('missing_indexed_infinity');
    expect(JSON.stringify(nonApplicable)).not.toContain(witness.witnessHash);
    expect(JSON.stringify(nonApplicable)).not.toContain('F-times-G');
  });

  it('retains agent structural assessment when Core is unavailable and passes the same witness to both independent ports', async () => {
    const agentAssess = vi.fn().mockResolvedValue(agentEvidence);
    const coreExecute = vi.fn().mockResolvedValue(coreUnavailable);
    const agentPort: IAgentA6EvidencePort = {
      availability: vi.fn().mockResolvedValue({
        kind: 'ready', providerFingerprint: agentEvidence.providerFingerprint, qualificationId: agentEvidence.qualificationId,
      }),
      assess: agentAssess,
    };
    const corePort: ICoreA6EvidencePort = {
      availability: vi.fn().mockResolvedValue(coreUnavailable.availability),
      execute: coreExecute,
    };

    const [agent, core] = await Promise.all([agentPort.assess(witness), corePort.execute(witness)]);
    const result = envelope(agent, core, leanUnavailable, { kind: 'agent_only' });

    expect(agentAssess).toHaveBeenCalledWith(witness);
    expect(coreExecute).toHaveBeenCalledWith(witness);
    expect(result.agent.kind).toBe('agent_a6_evidence');
    expect(result.core).toEqual(coreUnavailable);
    expect(result.mergeStatus.kind).toBe('agent_only');
  });

  it('retains Core evidence when agent is unavailable and never synthesizes agent provenance', async () => {
    const agentPort: IAgentA6EvidencePort = {
      availability: vi.fn().mockResolvedValue(agentUnavailable.availability),
      assess: vi.fn().mockResolvedValue(agentUnavailable),
    };
    const corePort: ICoreA6EvidencePort = {
      availability: vi.fn().mockResolvedValue({ kind: 'ready', runtime: coreEvidence.runtime }),
      execute: vi.fn().mockResolvedValue(coreEvidence),
    };

    const [agent, core] = await Promise.all([agentPort.assess(witness), corePort.execute(witness)]);
    const result = envelope(agent, core, leanUnavailable, { kind: 'core_only' });

    expect(result.agent).toEqual(agentUnavailable);
    expect(result.core.kind).toBe('core_a6_evidence');
    expect(JSON.stringify(result.agent)).not.toContain('providerFingerprint');
    expect(result.mergeStatus.kind).toBe('core_only');
  });

  it('represents both capabilities unavailable as an honest composite state that still retains the immutable witness', () => {
    const result = envelope(agentUnavailable, coreUnavailable, leanUnavailable, { kind: 'all_unavailable' });

    expect(result.witness.witnessHash).toBe(witness.witnessHash);
    expect(result.agent.kind).toBe('agent_assessment_unavailable');
    expect(result.core.kind).toBe('core_confirmation_unavailable');
    expect(result.lean.kind).toBe('lean_verification_unavailable');
    expect(result.mergeStatus.kind).toBe('all_unavailable');
  });

  it('models concordant agent, Core and Lean records as independent evidence scopes, not one substituted result', () => {
    const result = envelope(agentEvidence, coreEvidence, leanEvidence, { kind: 'all_concordant' });

    expect(result.agent.kind).toBe('agent_a6_evidence');
    expect(result.core.kind).toBe('core_a6_evidence');
    expect(result.lean.kind).toBe('lean_a6_evidence');
    if (
      result.agent.kind !== 'agent_a6_evidence'
      || result.core.kind !== 'core_a6_evidence'
      || result.lean.kind !== 'lean_a6_evidence'
    ) {
      throw new Error('Concordant QA fixture must retain all three evidence branches.');
    }

    expect([result.agent.evidenceScope, result.core.evidenceScope, result.lean.evidenceScope]).toEqual([
      'agent_structural_assessment',
      'core_execution_evidence',
      'lean_kernel_evidence',
    ]);
    expect(new Set([result.agent.witnessHash, result.core.witnessHash, result.lean.witnessHash])).toEqual(
      new Set([witness.witnessHash]),
    );
  });

  it('has typed witness, product and type conflicts without choosing a winner or changing node proof trust', () => {
    const conflicts = [
      { kind: 'witness_mismatch', evidenceScope: 'core_execution_evidence', receivedWitnessHash: 'sha256:other-witness' },
      {
        kind: 'reduced_product_mismatch',
        leftScope: 'agent_structural_assessment',
        rightScope: 'core_execution_evidence',
        leftProductHash: structuralProduct.product.structuralHash,
        rightProductHash: 'sha256:other-product',
      },
      {
        kind: 'type_mismatch',
        evidenceScope: 'lean_kernel_evidence',
        expectedTypeTag: expressionF.typeTag,
        receivedTypeTag: 'ricis-expression/complex/v1',
      },
    ] as const satisfies readonly A6EvidenceConflict[];

    const result = envelope(agentEvidence, coreEvidence, leanUnavailable, { kind: 'evidence_conflict', conflicts });
    expect(result.mergeStatus.kind).toBe('evidence_conflict');
    if (result.mergeStatus.kind === 'evidence_conflict') {
      expect(result.mergeStatus.conflicts).toHaveLength(3);
    }
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('resolved');
    expect(serialized).not.toContain('LeanVerified');
    expect(serialized).not.toContain('winner');
  });

  it('requires distinct Lean compiler/source/axiom evidence and does not accept legacy isVerified as a Lean field', () => {
    expect(leanEvidence.immutableSourceHash).toContain('immutable');
    expect(leanEvidence.compilerEvidenceHash).toContain('compiler');
    expect(leanEvidence.axiomReportHash).toContain('axioms');
    expectTypeOf<LeanA6Evidence>().not.toHaveProperty('isVerified');
    expectTypeOf<AgentA6Evidence>().not.toHaveProperty('isVerified');
    expectTypeOf<CoreA6Evidence>().not.toHaveProperty('isVerified');
  });

  it('defines exactly independent Agent/Core/Lean port responsibilities without execution, endpoint or browser-secret fields', () => {
    expectTypeOf<IAgentA6EvidencePort>().toHaveProperty('availability');
    expectTypeOf<IAgentA6EvidencePort>().toHaveProperty('assess');
    expectTypeOf<ICoreA6EvidencePort>().toHaveProperty('availability');
    expectTypeOf<ICoreA6EvidencePort>().toHaveProperty('execute');
    expectTypeOf<ILeanA6EvidencePort>().toHaveProperty('availability');
    expectTypeOf<ILeanA6EvidencePort>().toHaveProperty('verify');
    expectTypeOf<IAgentA6EvidencePort>().not.toHaveProperty('evaluate');
    expectTypeOf<ICoreA6EvidencePort>().not.toHaveProperty('assess');
    expectTypeOf<ILeanA6EvidencePort>().not.toHaveProperty('isVerified');
  });

  it('keeps A6 contract module free of runtime Agent/Core/Lean, UI, browser, network and secret dependencies', async () => {
    const source = await readFile(resolve(import.meta.dirname, 'contracts.ts'), 'utf8');
    for (const forbidden of [
      "from 'react'",
      'agentGatewayApplication',
      'IRicisCoreEngine',
      'fetch(',
      'WebSocket',
      'process.env',
      'window.',
      'localStorage',
      'sessionStorage',
      'privateKey',
      'oauthToken',
      'LeanVerified',
      'resolved',
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });

  it('uses closed evidence scope vocabulary for conflict records', () => {
    const scopes = [
      'agent_structural_assessment',
      'core_execution_evidence',
      'lean_kernel_evidence',
    ] as const satisfies readonly A6EvidenceScope[];
    expect(scopes).toHaveLength(3);
  });
});
