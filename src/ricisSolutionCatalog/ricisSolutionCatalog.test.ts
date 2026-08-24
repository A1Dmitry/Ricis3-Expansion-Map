/// <reference types="vitest/globals" />

import {
  EXISTING_NODE_BINDINGS,
  INITIAL_CALCULATOR_MONOLITHS,
  INITIAL_SOLUTION_RELATIONS,
  buildCalculatorLaunchLink,
  presentGreenMonolith,
  presentMapNodeVisualStatus,
  projectSolutionRelations,
  toSolutionMonolithCardView,
  validateSolutionCatalogManifest,
  type LeanEvidenceInput,
  type SolutionCatalogManifest,
  type SolutionMonolithDefinition,
} from './index';

const CALCULATOR_COMMIT = '9806b7c97b57bd738301db459b8c8e72f73d1a23';
const HASH = 'a'.repeat(64);

const EXPECTED_MODES = [
  'CDCC', 'P_VS_NP', 'COMPLEX_ANALYSIS', 'RIEMANN', 'BSD', 'HODGE', 'POINCARE',
  'MANDELBROT', 'GRAVITATIONAL', 'NAVIER_STOKES', 'YANG_MILLS', 'CHLADNI', 'KINEMATIC',
  'LLM_GRADIENT',
] as const;

function monolith(mode: typeof EXPECTED_MODES[number], id = `calculator-${mode.toLowerCase()}`): SolutionMonolithDefinition {
  return {
    id,
    title: { ru: `RICIS ${mode}`, en: `RICIS ${mode}` },
    category: { ru: 'RICIS III', en: 'RICIS III' },
    familyId: `family-${mode.toLowerCase()}`,
    sourceEvidence: {
      kind: 'RICIS_SOURCE_SOLVED',
      source: {
        repositoryUrl: 'https://github.com/A1Dmitry/RICIS-7.7-online-calculator',
        commit: CALCULATOR_COMMIT,
        sourcePath: `src/components/${mode}.tsx`,
        sourceId: `case-${mode.toLowerCase()}`,
        contentHash: HASH,
        licenceLabel: 'CC BY 4.0',
      },
      monolithType: 'typed_recursive_monolith',
      semanticIndexExpression: `E_${mode}`,
      derivationHistoryHash: HASH,
    },
    calculator: {
      mode,
      preset: { case: mode, scale: 1 },
      presetHash: HASH,
    },
    example: {
      input: { case: mode, x: 0 },
      expectedStructuralResult: `RICIS result for ${mode}`,
      orderedRuleTrace: ['L0', 'L1', 'SP2', 'SP4'],
    },
    visualization: {
      kind: 'EXTERNAL_CALCULATOR_LAUNCH',
      altText: `Visualization for ${mode}`,
      description: `Source-bound visual example for ${mode}`,
    },
  };
}

function manifest(overrides: Partial<SolutionCatalogManifest> = {}): SolutionCatalogManifest {
  return {
    schemaVersion: '1.0',
    sourceRepositoryCommit: CALCULATOR_COMMIT,
    monoliths: EXPECTED_MODES.map(mode => monolith(mode)),
    relations: [
      {
        id: 'hierarchy-cdcc-to-pnp',
        kind: 'SOLVED_HIERARCHY',
        fromMonolithId: 'calculator-cdcc',
        toMonolithId: 'calculator-p_vs_np',
        sourceRationale: 'Owner-approved initial hierarchy fixture.',
        rationaleHash: HASH,
      },
      {
        id: 'grounds-pnp-existing-node',
        kind: 'GROUNDS_DEPENDENT_TASK',
        fromMonolithId: 'calculator-p_vs_np',
        dependentNodeId: 'informatics-complexity',
        sourceRationale: 'Owner-approved P=NP map grounding fixture.',
        rationaleHash: HASH,
      },
    ],
    existingNodeBindings: [
      { monolithId: 'calculator-p_vs_np', nodeId: 'informatics-complexity' },
      { monolithId: 'calculator-cdcc', nodeId: 'registry-115' },
      { monolithId: 'calculator-navier_stokes', nodeId: 'registry-117' },
      { monolithId: 'calculator-llm_gradient', nodeId: 'registry-118' },
    ],
    ...overrides,
  };
}

const absentLean: LeanEvidenceInput = { trustStatus: 'ABSENT' };
const verifiedLean: LeanEvidenceInput = {
  trustStatus: 'LEAN_VERIFIED',
  sourceHash: HASH,
  toolchain: 'leanprover/lean4:v4.19.0',
  command: 'lake env lean Ricis3Axioms.lean && lake env lean Check.lean',
  compilerOutput: 'Process finished with exit code 0.',
  axiomReport: 'Axiom dependencies: [].',
};

function assertRejected(manifestInput: SolutionCatalogManifest, expectedReason: string) {
  const result = validateSolutionCatalogManifest(manifestInput);
  expect(result.kind).toBe('REJECTED');
  expect(result.reasons).toContain(expectedReason);
}

describe('CALC-EXP-01 — G3 source-bound dual-green solution catalogue', () => {
  it('CEQA01: contains exactly the approved fourteen calculator monolith modes', () => {
    expect(INITIAL_CALCULATOR_MONOLITHS.map(item => item.calculator.mode)).toEqual(EXPECTED_MODES);
    expect(new Set(INITIAL_CALCULATOR_MONOLITHS.map(item => item.id)).size).toBe(14);
  });

  it('CEQA02: pins every initial monolith to calculator provenance, source hash, example, trace and accessible visualization', () => {
    for (const item of INITIAL_CALCULATOR_MONOLITHS) {
      expect(item.sourceEvidence.kind).toBe('RICIS_SOURCE_SOLVED');
      expect(item.sourceEvidence.source.repositoryUrl).toBe('https://github.com/A1Dmitry/RICIS-7.7-online-calculator');
      expect(item.sourceEvidence.source.commit).toBe(CALCULATOR_COMMIT);
      expect(item.sourceEvidence.source.contentHash).toMatch(/^[a-f0-9]{64}$/);
      expect(item.sourceEvidence.semanticIndexExpression).not.toHaveLength(0);
      expect(item.example.orderedRuleTrace.length).toBeGreaterThan(0);
      expect(item.visualization.altText).not.toHaveLength(0);
      expect(item.visualization.description).not.toHaveLength(0);
    }
  });

  it('CEQA03: binds only the four explicit established map nodes and never aliases the manipulator to Jacobian Conjecture', () => {
    expect(EXISTING_NODE_BINDINGS).toEqual([
      { monolithId: 'calculator-p_vs_np', nodeId: 'informatics-complexity' },
      { monolithId: 'calculator-cdcc', nodeId: 'registry-115' },
      { monolithId: 'calculator-navier_stokes', nodeId: 'registry-117' },
      { monolithId: 'calculator-llm_gradient', nodeId: 'registry-118' },
    ]);
    expect(EXISTING_NODE_BINDINGS.some(binding => binding.monolithId === 'calculator-kinematic' && binding.nodeId === 'registry-120')).toBe(false);
  });

  it('CEQA04: validates a complete reviewed manifest without importing it into map state', () => {
    expect(validateSolutionCatalogManifest(manifest())).toEqual({ kind: 'VALID', reasons: [] });
  });

  it('CEQA05: rejects unknown calculator modes, duplicate identities and a mismatched source commit', () => {
    const unknownMode = monolith('CDCC');
    const invalid = {
      ...unknownMode,
      calculator: { ...unknownMode.calculator, mode: 'RICIS_AGENT' as unknown as typeof unknownMode.calculator.mode },
    };
    assertRejected(manifest({ monoliths: [invalid] }), 'mode_not_allowlisted');
    assertRejected(manifest({ monoliths: [monolith('CDCC'), monolith('CDCC')] }), 'duplicate_monolith_id');
    assertRejected(manifest({ sourceRepositoryCommit: 'unverified-commit' }), 'source_commit_mismatch');
  });

  it('CEQA06: rejects missing source hash, semantic index, proof trace, example or visualization accessibility data', () => {
    const base = monolith('CDCC');
    const missingHash: SolutionMonolithDefinition = {
      ...base,
      sourceEvidence: {
        ...base.sourceEvidence,
        source: { ...base.sourceEvidence.source, contentHash: '' },
      },
    };
    const missingIndex: SolutionMonolithDefinition = {
      ...base,
      sourceEvidence: { ...base.sourceEvidence, semanticIndexExpression: '' },
    };
    const missingTrace: SolutionMonolithDefinition = {
      ...base,
      example: { ...base.example, orderedRuleTrace: [] },
    };
    const missingAltText: SolutionMonolithDefinition = {
      ...base,
      visualization: { ...base.visualization, altText: '' },
    };

    assertRejected(manifest({ monoliths: [missingHash] }), 'source_hash_required');
    assertRejected(manifest({ monoliths: [missingIndex] }), 'semantic_index_required');
    assertRejected(manifest({ monoliths: [missingTrace] }), 'rule_trace_required');
    assertRejected(manifest({ monoliths: [missingAltText] }), 'visualization_alt_text_required');
  });

  it('CEQA07: projects RICIS source solved green without changing independent map state', () => {
    const originalState = 'partial' as const;
    const presentation = presentGreenMonolith({ solution: monolith('CDCC'), leanEvidence: absentLean, nodeState: originalState });

    expect(presentation).toMatchObject({
      basis: 'RICIS_SOURCE_SOLVED',
      color: '#22c55e',
      sourceSolvedVisible: true,
      leanVerifiedVisible: false,
      resolvedNodeStatePreserved: true,
    });
    expect(originalState).toBe('partial');
  });

  it('CEQA08: projects reproducibly verified user Lean green even without a calculator case', () => {
    const presentation = presentGreenMonolith({ solution: undefined, leanEvidence: verifiedLean, nodeState: 'unresolved' });

    expect(presentation).toMatchObject({
      basis: 'LEAN_KERNEL_VERIFIED',
      color: '#22c55e',
      sourceSolvedVisible: false,
      leanVerifiedVisible: true,
      resolvedNodeStatePreserved: true,
    });
  });

  it('CEQA09: displays dual green only when both independent evidence records are complete', () => {
    const dual = presentGreenMonolith({ solution: monolith('P_VS_NP'), leanEvidence: verifiedLean, nodeState: 'partial' });
    const incomplete = presentGreenMonolith({
      solution: monolith('P_VS_NP'),
      leanEvidence: { trustStatus: 'LEAN_VERIFIED', sourceHash: HASH },
      nodeState: 'partial',
    });

    expect(dual.basis).toBe('RICIS_SOURCE_AND_LEAN_KERNEL_VERIFIED');
    expect(dual.evidenceLabels).toEqual(expect.arrayContaining(['RICIS III solved', 'Lean kernel verified']));
    expect(incomplete.basis).toBe('RICIS_SOURCE_SOLVED');
    expect(incomplete.leanVerifiedVisible).toBe(false);
  });

  it('CEQA10: never treats TrustedAxiom, Core recovery, static scan or source presence as Lean kernel verified', () => {
    for (const trustStatus of ['TRUSTED_AXIOM', 'REQUIRES_CORE_LEAN', 'REJECTED', 'ABSENT'] as const) {
      const presentation = presentGreenMonolith({
        solution: undefined,
        leanEvidence: { trustStatus, sourceHash: HASH, toolchain: 'lean', command: 'lean file.lean', compilerOutput: 'ok', axiomReport: 'sorryAx present' },
        nodeState: 'partial',
      });
      expect(presentation.basis).toBe('NONE');
    }
  });

  it('CEQA11: projects only explicit reviewed hierarchy and grounding relations', () => {
    const inputManifest = manifest();
    const projected = projectSolutionRelations({
      manifest: inputManifest,
      existingNodeIds: ['informatics-complexity', 'registry-115', 'registry-117', 'registry-118'],
    });

    expect(projected).toEqual(inputManifest.relations);
    expect(projected.map(relation => relation.kind)).toEqual(['SOLVED_HIERARCHY', 'GROUNDS_DEPENDENT_TASK']);
    expect(INITIAL_SOLUTION_RELATIONS.every(relation => relation.sourceRationale.length > 0)).toBe(true);
  });

  it('CEQA12: rejects malformed relation endpoints, missing rationale and an implicit physical map-edge attempt', () => {
    assertRejected(manifest({ relations: [{ ...manifest().relations[0]!, toMonolithId: 'missing-monolith' }] }), 'relation_endpoint_unknown');
    assertRejected(manifest({ relations: [{ ...manifest().relations[0]!, sourceRationale: '' }] }), 'relation_rationale_required');
    assertRejected(manifest({ relations: [{ ...manifest().relations[1]!, dependentNodeId: 'registry-120', sourceRationale: 'keyword match' }] }), 'relation_requires_explicit_owner_rationale');
  });

  it('CEQA13: builds only a stable HTTPS calculator URL from an allowlisted mode and static preset', () => {
    const launch = buildCalculatorLaunchLink({ baseUrl: 'https://calculator.example.org/', definition: monolith('NAVIER_STOKES') });

    expect(launch.kind).toBe('READY');
    expect(launch.href).toMatch(/^https:\/\/calculator\.example\.org\/\?mode=NAVIER_STOKES&state=/);
    expect(launch.href).not.toContain('externalLean');
    expect(launch.href).not.toContain('proof');
  });

  it('CEQA14: returns honest unconfigured/rejected launch states rather than guessing, proxying or accepting user-controlled modes', () => {
    expect(buildCalculatorLaunchLink({ baseUrl: undefined, definition: monolith('CDCC') })).toEqual({ kind: 'UNCONFIGURED', reason: 'calculator_base_url_missing' });
    expect(buildCalculatorLaunchLink({ baseUrl: 'http://calculator.example.org', definition: monolith('CDCC') })).toEqual({ kind: 'REJECTED', reason: 'invalid_base_url' });

    const altered = monolith('CDCC');
    const malicious = { ...altered, calculator: { ...altered.calculator, mode: 'RICIS_AGENT' as unknown as typeof altered.calculator.mode } };
    expect(buildCalculatorLaunchLink({ baseUrl: 'https://calculator.example.org', definition: malicious })).toEqual({ kind: 'REJECTED', reason: 'mode_not_allowlisted' });
  });

  it('CEQA15: maps a catalog green status through one pure visual policy without changing authoritative node state', () => {
    const state = 'partial' as const;
    const visual = presentMapNodeVisualStatus({
      nodeId: 'registry-117',
      nodeState: state,
      hasSorry: false,
      isDerivative: false,
      isOnPath: false,
      isLocked: false,
    });

    expect(visual).toMatchObject({ sphereColor: '#22c55e', greenBasis: 'RICIS_SOURCE_SOLVED', greenByCatalog: true });
    expect(state).toBe('partial');
  });

  it('CEQA16: preserves path and derivative visual priority over catalog green while retaining its evidence basis', () => {
    const path = presentMapNodeVisualStatus({
      nodeId: 'registry-117', nodeState: 'partial', hasSorry: false, isDerivative: false, isOnPath: true, isLocked: false,
    });
    const derivative = presentMapNodeVisualStatus({
      nodeId: 'registry-117', nodeState: 'partial', hasSorry: false, isDerivative: true, isOnPath: false, isLocked: false,
    });

    expect(path).toMatchObject({ sphereColor: '#22d3ee', greenBasis: 'RICIS_SOURCE_SOLVED', greenByCatalog: true });
    expect(derivative).toMatchObject({ sphereColor: '#a855f7', greenBasis: 'RICIS_SOURCE_SOLVED', greenByCatalog: true });
  });

  it('CEQA17: makes proof disclosure convenient while keeping summary, trace, immutable source and Lean evidence explicitly distinct', () => {
    const source = monolith('P_VS_NP');
    const green = presentGreenMonolith({ solution: source, leanEvidence: verifiedLean, nodeState: 'partial' });
    const launch = buildCalculatorLaunchLink({ baseUrl: 'https://calculator.example.org', definition: source });
    const view = toSolutionMonolithCardView({
      solution: source,
      relations: manifest().relations,
      green,
      leanEvidence: verifiedLean,
      launch,
    });

    expect(view.proofDisclosure.summary).not.toHaveLength(0);
    expect(view.proofDisclosure.steps).toEqual(source.example.orderedRuleTrace);
    expect(view.proofDisclosure.sourceAvailable).toBe(true);
    expect(view.proofDisclosure.leanEvidenceAvailable).toBe(true);
    expect(view.visualization?.altText).not.toHaveLength(0);
    expect(view.launch.kind).toBe('READY');
  });

  it('CEQA18: preserves convenient proof disclosure for a source-only case without fabricating Lean evidence', () => {
    const source = monolith('CDCC');
    const green = presentGreenMonolith({ solution: source, leanEvidence: absentLean, nodeState: 'partial' });
    const view = toSolutionMonolithCardView({
      solution: source,
      relations: [],
      green,
      leanEvidence: absentLean,
      launch: { kind: 'UNCONFIGURED', reason: 'calculator_base_url_missing' },
    });

    expect(view.proofDisclosure.sourceAvailable).toBe(true);
    expect(view.proofDisclosure.leanEvidenceAvailable).toBe(false);
    expect(view.launch).toEqual({ kind: 'UNCONFIGURED', reason: 'calculator_base_url_missing' });
  });
});
