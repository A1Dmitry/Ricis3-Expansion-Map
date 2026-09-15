/**
 * ProofChain acceptance tests T1–T10
 * Covers: walk → residual → instance → GENERALIZE → inherit
 * Implements No Self-Certification checks and DRY reuse
 */
import { describe, it, expect, beforeEach } from 'vitest';
import type { MapState, ProblemNode } from '../model/types';
import { ProofChainWalker } from './domain/proofChainWalker';
import { ResidualObligationCalculator } from './domain/residualObligationCalculator';
import { SingularityClassifier } from './domain/singularityClassifier';
import { InMemoryGeneralizationPolicy } from './domain/generalizationPolicy';
import { ProofInheritancePolicy } from './domain/proofInheritancePolicy';
import { ProofTrustGate } from './domain/proofTrustGate';
import { MapPatchEmitter } from './infrastructure/mapPatchEmitter';
import { ResolveInstanceWithChainUseCase } from './application/resolveInstanceWithChainUseCase';
import { validatePatchIsolation, serializePatch } from './domain/patchSerializer';
import type { MapStatePatchDTO } from './domain/types';

// Helpers
function makeNode(overrides: Partial<ProblemNode> & { id: string }): ProblemNode {
  return {
    title: `Node ${overrides.id}`,
    description: `Description for ${overrides.id}`,
    state: 'unresolved',
    type: 'scientific_task',
    targetFunction: `Target_${overrides.id}`,
    zoneIds: ['math'],
    dependencyIds: [],
    dependentIds: [],
    fractalDepth: 1,
    economic: { costUnresolved: 100, costToSolve: 10, marketGain: 200, riskLoss: 50 },
    ...overrides,
  } as ProblemNode;
}

function makeMapState(nodes: ProblemNode[]): MapState {
  // Build edges for completeness but walker uses dependencyIds
  const edges = nodes.flatMap(n =>
    (n.dependencyIds ?? []).map(depId => ({
      id: `edge-${depId}-${n.id}`,
      fromId: depId,
      toId: n.id,
      strength: 0.7,
      stateColor: 'green' as const,
      economicInfluence: 0.5,
    })),
  );
  return { nodes, edges, zones: [], axioms: [], proofs: {}, agentLogs: [] };
}

function createUseCase() {
  const walker = new ProofChainWalker();
  const classifier = new SingularityClassifier();
  const generalization = new InMemoryGeneralizationPolicy();
  const inheritance = new ProofInheritancePolicy(generalization);
  const residualCalc = new ResidualObligationCalculator();
  const trustGate = new ProofTrustGate();
  const emitter = new MapPatchEmitter();
  const useCase = new ResolveInstanceWithChainUseCase(
    walker,
    classifier,
    inheritance,
    residualCalc,
    emitter,
    generalization,
    trustGate,
  );
  return { walker, classifier, generalization, inheritance, residualCalc, trustGate, emitter, useCase };
}

describe('PROOF_CHAIN_RESIDUAL_V1 T1–T10', () => {
  // T1: all_ancestors_resolved -> residual contains only leaf-specific obligation
  it('T1 all_ancestors_resolved: residual contains only leaf-specific obligation', () => {
    const { useCase, classifier } = createUseCase();
    const root = makeNode({ id: 'root', state: 'resolved', type: 'core_singularity' });
    const mid = makeNode({ id: 'mid', state: 'resolved', dependencyIds: ['root'] });
    const leaf = makeNode({ id: 'leaf-T1', state: 'unresolved', dependencyIds: ['mid'] });
    const state = makeMapState([root, mid, leaf]);

    const result = useCase.execute({ leafId: 'leaf-T1', mapState: state });
    expect(result.kind).toBe('RESIDUAL_READY');
    if (result.kind === 'RESIDUAL_READY') {
      // residual only leaf-specific
      expect(result.residual.obligations).toEqual([`leaf:leaf-T1:class:${classifier.classify(leaf)}:obligation`]);
      expect(result.residual.leafId).toBe('leaf-T1');
      expect(result.residual.chainLength).toBe(3);
      // patch metadata must match actual computation (T8 partially)
      expect(result.patch.patchMetadata.chainLength).toBe(3);
      expect(result.patch.patchMetadata.classId).toBe(classifier.classify(leaf));
      expect(result.patch.patchMetadata.evaluationPoint).toBe('leaf-T1');
    }
  });

  // T2: one_ancestor_unresolved -> returns debt list; no resolve
  it('T2 one_ancestor_unresolved: returns debt list; no resolve', () => {
    const { useCase } = createUseCase();
    const root = makeNode({ id: 'root', state: 'resolved', type: 'core_singularity' });
    const mid = makeNode({ id: 'mid', state: 'unresolved', dependencyIds: ['root'] }); // unresolved!
    const leaf = makeNode({ id: 'leaf-T2', state: 'unresolved', dependencyIds: ['mid'] });
    const state = makeMapState([root, mid, leaf]);

    const result = useCase.execute({ leafId: 'leaf-T2', mapState: state });
    expect(result.kind).toBe('DEBT');
    if (result.kind === 'DEBT') {
      expect(result.debt).toContain('mid');
      expect(result.blockedAncestors.map(n => n.id)).toContain('mid');
      // no patch emitted in DEBT case
    }
  });

  // T3: first_instance_class_A -> exactly one GENERALIZE(A) created
  it('T3 first_instance_class_A: exactly one GENERALIZE(A) created', () => {
    const { useCase, generalization, classifier } = createUseCase();
    const root = makeNode({ id: 'root', state: 'resolved', type: 'core_singularity' });
    // Two nodes with same classId: title+targetFunction identical
    const leafA1 = makeNode({
      id: 'leaf-A1',
      state: 'unresolved',
      title: 'Singularity Class A',
      targetFunction: 'F_A',
      dependencyIds: ['root'],
    });
    const state = makeMapState([root, leafA1]);

    const classA = classifier.classify(leafA1);
    expect(generalization.getTask(classA)).toBeUndefined();

    const result = useCase.execute({ leafId: 'leaf-A1', mapState: state });
    expect(result.kind).toBe('RESIDUAL_READY');
    if (result.kind === 'RESIDUAL_READY') {
      expect(result.generalization?.created).toBe(true);
      expect(result.generalization?.task.classId).toBe(classA);
      expect(generalization.getAll().length).toBe(1);
      expect(generalization.getTask(classA)?.status).toBe('open');
    }
  });

  // T4: second_instance_before_general -> no second GENERALIZE for A
  it('T4 second_instance_before_general: no second GENERALIZE for A', () => {
    const { useCase, generalization, classifier } = createUseCase();
    const root = makeNode({ id: 'root', state: 'resolved', type: 'core_singularity' });
    const leafA1 = makeNode({
      id: 'leaf-A1',
      state: 'unresolved',
      title: 'Singularity Class A',
      targetFunction: 'F_A',
      dependencyIds: ['root'],
    });
    const leafA2 = makeNode({
      id: 'leaf-A2',
      state: 'unresolved',
      title: 'Singularity Class A', // same class
      targetFunction: 'F_A',
      dependencyIds: ['root'],
    });
    const state1 = makeMapState([root, leafA1, leafA2]);

    const classA = classifier.classify(leafA1);
    // first instance
    const r1 = useCase.execute({ leafId: 'leaf-A1', mapState: state1 });
    expect(r1.kind).toBe('RESIDUAL_READY');
    expect(generalization.getAll().length).toBe(1);

    // second instance before general resolved — should not create second GENERALIZE
    const r2 = useCase.execute({ leafId: 'leaf-A2', mapState: state1 });
    // May be RESIDUAL_READY again but generalization.created must be false
    expect(r2.kind).toBe('RESIDUAL_READY');
    if (r2.kind === 'RESIDUAL_READY') {
      expect(r2.generalization?.created).toBe(false);
      expect(r2.generalization?.task.classId).toBe(classA);
      expect(generalization.getAll().length).toBe(1); // still one
    }
  });

  // T5: general_resolved_third_instance -> inheritance path; no full foundation regen
  it('T5 general_resolved_third_instance: inheritance path; no full foundation regen', () => {
    const { useCase, generalization, classifier } = createUseCase();
    const root = makeNode({ id: 'root', state: 'resolved', type: 'core_singularity' });
    const leafA1 = makeNode({
      id: 'leaf-A1',
      state: 'unresolved',
      title: 'Singularity Class A',
      targetFunction: 'F_A',
      dependencyIds: ['root'],
    });
    const leafA3 = makeNode({
      id: 'leaf-A3',
      state: 'unresolved',
      title: 'Singularity Class A',
      targetFunction: 'F_A',
      dependencyIds: ['root'],
    });
    const state = makeMapState([root, leafA1, leafA3]);

    const classA = classifier.classify(leafA1);
    // first instance creates GENERALIZE
    useCase.execute({ leafId: 'leaf-A1', mapState: state });
    expect(generalization.getTask(classA)?.status).toBe('open');
    // resolve general
    generalization.resolveGeneral(classA);
    expect(generalization.isGeneralResolved(classA)).toBe(true);

    // third instance should inherit
    const r3 = useCase.execute({ leafId: 'leaf-A3', mapState: state });
    expect(r3.kind).toBe('INHERITED');
    if (r3.kind === 'INHERITED') {
      expect(r3.inheritance.inherited).toBe(true);
      expect(r3.inheritance.classId).toBe(classA);
      expect(r3.patch.meta.method).toBe('inheritance_via_general');
      expect(r3.patch.patchMetadata.classId).toBe(classA);
      expect(r3.patch.patchMetadata.chainLength).toBe(2); // leaf-A3 -> root
      // Thin patch only: should not contain full foundation regen (check proof target)
      expect(r3.patch.proofs?.['leaf-A3']).toBeDefined();
      const proof = r3.patch.proofs?.['leaf-A3'] as Record<string, unknown>;
      expect(String(proof['targetFunction'])).toContain('Inherit');
    }
  });

  // T6: class_mismatch -> inheritance refused
  it('T6 class_mismatch: inheritance refused', () => {
    const { useCase, generalization, classifier, inheritance } = createUseCase();
    const root = makeNode({ id: 'root', state: 'resolved', type: 'core_singularity' });
    const leafA1 = makeNode({
      id: 'leaf-A1',
      state: 'unresolved',
      title: 'Class A',
      targetFunction: 'F_A',
      dependencyIds: ['root'],
    });
    const leafB = makeNode({
      id: 'leaf-B',
      state: 'unresolved',
      title: 'Class B DIFFERENT',
      targetFunction: 'F_B_DIFFERENT',
      dependencyIds: ['root'],
    });
    const state = makeMapState([root, leafA1, leafB]);

    const classA = classifier.classify(leafA1);
    const classB = classifier.classify(leafB);
    expect(classA).not.toBe(classB);

    // create and resolve general for A
    useCase.execute({ leafId: 'leaf-A1', mapState: state });
    generalization.resolveGeneral(classA);
    expect(generalization.isGeneralResolved(classA)).toBe(true);

    // Try to inherit B (mismatch) — should fail, go to residual path
    const direct = inheritance.tryInherit(leafB, classB);
    expect(direct.inherited).toBe(false);
    if (!direct.inherited) expect(direct.reason).toBe('NO_GENERAL'); // because no general for B

    const rB = useCase.execute({ leafId: 'leaf-B', mapState: state });
    // Should not be INHERITED for B; should be RESIDUAL_READY (since ancestors resolved and no general for B)
    expect(rB.kind).toBe('RESIDUAL_READY');
    if (rB.kind === 'RESIDUAL_READY') {
      expect(rB.residual.classId).toBe(classB);
      expect(rB.patch.patchMetadata.classId).toBe(classB);
    }
  });

  // T7: cycle_in_chain -> BLOCKED(reason=CYCLE)
  it('T7 cycle_in_chain: BLOCKED(reason=CYCLE)', () => {
    const { walker, useCase } = createUseCase();
    const cycleA = makeNode({ id: 'cycle-A', state: 'unresolved', dependencyIds: ['cycle-B'] });
    const cycleB = makeNode({ id: 'cycle-B', state: 'unresolved', dependencyIds: ['cycle-A'] });
    const state = makeMapState([cycleA, cycleB]);

    const walk = walker.walkToRoot('cycle-A', state);
    expect(walk.status).toBe('BLOCKED');
    if (walk.status === 'BLOCKED') expect(walk.reason).toBe('CYCLE');

    const useRes = useCase.execute({ leafId: 'cycle-A', mapState: state });
    expect(useRes.kind).toBe('BLOCKED');
    if (useRes.kind === 'BLOCKED') expect(useRes.reason).toBe('CYCLE');
  });

  // T8: patch_metadata_matches_actual_computation
  it('T8 patch_metadata_matches_actual_computation: emitted patch.classId === classifier.classify(leaf) and chainLength === walker length', () => {
    const { useCase, walker, classifier } = createUseCase();
    const root = makeNode({ id: 'root', state: 'resolved', type: 'core_singularity' });
    const mid = makeNode({ id: 'mid', state: 'resolved', dependencyIds: ['root'] });
    const leaf = makeNode({ id: 'leaf-T8', state: 'unresolved', title: 'T8 Title', targetFunction: 'T8_F', dependencyIds: ['mid'] });
    const state = makeMapState([root, mid, leaf]);

    const walk = walker.walkToRoot('leaf-T8', state);
    expect(walk.status).toBe('OK');
    const expectedChainLength = walk.status === 'OK' ? walk.chainLength : -1;
    const expectedClassId = classifier.classify(leaf);

    const result = useCase.execute({ leafId: 'leaf-T8', mapState: state });
    expect(result.kind).toBe('RESIDUAL_READY');
    if (result.kind === 'RESIDUAL_READY') {
      expect(result.patch.patchMetadata.classId).toBe(expectedClassId);
      expect(result.patch.patchMetadata.chainLength).toBe(expectedChainLength);
      expect(result.patch.patchMetadata.evaluationPoint).toBe('leaf-T8');
      // Ensure not default: classId not empty and chainLength not 0 unless actual is 0
      expect(result.patch.patchMetadata.classId).not.toBe('');
      expect(result.patch.patchMetadata.chainLength).toBe(3);
    }

    // Also check inheritance path metadata accuracy
    // Create general and test inheritance patch metadata
    const { useCase: uc2, generalization, classifier: cls2, walker: w2 } = createUseCase();
    const root2 = makeNode({ id: 'root', state: 'resolved', type: 'core_singularity' });
    const leafI1 = makeNode({ id: 'leaf-I1', state: 'unresolved', title: 'InheritClass', targetFunction: 'F_I', dependencyIds: ['root'] });
    const leafI2 = makeNode({ id: 'leaf-I2', state: 'unresolved', title: 'InheritClass', targetFunction: 'F_I', dependencyIds: ['root'] });
    const state2 = makeMapState([root2, leafI1, leafI2]);
    const classI = cls2.classify(leafI1);
    uc2.execute({ leafId: 'leaf-I1', mapState: state2 });
    generalization.resolveGeneral(classI);
    const walk2 = w2.walkToRoot('leaf-I2', state2);
    const result2 = uc2.execute({ leafId: 'leaf-I2', mapState: state2 });
    expect(result2.kind).toBe('INHERITED');
    if (result2.kind === 'INHERITED') {
      expect(result2.patch.patchMetadata.classId).toBe(classI);
      expect(result2.patch.patchMetadata.chainLength).toBe(walk2.status === 'OK' ? walk2.chainLength : -1);
    }
  });

  // T9: broken_dependency_link -> BLOCKED(BROKEN_LINK) distinct from CYCLE
  it('T9 broken_dependency_link: BLOCKED(BROKEN_LINK) distinct from CYCLE', () => {
    const { walker, useCase } = createUseCase();
    const leaf = makeNode({ id: 'leaf-T9', state: 'unresolved', dependencyIds: ['missing-parent-xyz'] });
    const state = makeMapState([leaf]);

    const walk = walker.walkToRoot('leaf-T9', state);
    expect(walk.status).toBe('BLOCKED');
    if (walk.status === 'BLOCKED') {
      expect(walk.reason).toBe('BROKEN_LINK');
      expect(walk.missingId).toBe('missing-parent-xyz');
    }

    const useRes = useCase.execute({ leafId: 'leaf-T9', mapState: state });
    expect(useRes.kind).toBe('BLOCKED');
    if (useRes.kind === 'BLOCKED') {
      expect(useRes.reason).toBe('BROKEN_LINK');
      expect(useRes.missingId).toBe('missing-parent-xyz');
      expect(useRes.reason).not.toBe('CYCLE');
    }

    // Also test undefined dependencyId
    const leafUndef = makeNode({ id: 'leaf-undef', state: 'unresolved', dependencyIds: [undefined as unknown as string] });
    const stateUndef = makeMapState([leafUndef]);
    const walkUndef = walker.walkToRoot('leaf-undef', stateUndef);
    expect(walkUndef.status).toBe('BLOCKED');
    if (walkUndef.status === 'BLOCKED') expect(walkUndef.reason).toBe('BROKEN_LINK');
  });

  // T10: priority_estimate_isolated_from_proof_status
  it('T10 priority_estimate_isolated_from_proof_status: isolated ok, co-located rejected', () => {
    const { emitter } = createUseCase();
    const root = makeNode({ id: 'root', state: 'resolved', type: 'core_singularity' });
    const leaf = makeNode({ id: 'leaf-T10', state: 'unresolved', dependencyIds: ['root'] });
    const state = makeMapState([root, leaf]);
    // Use emitter to create base patch
    const basePatch = emitter.emitResidual({
      leafId: 'leaf-T10',
      classId: 'SP4_leaf-T10',
      chainLength: 2,
      evaluationPoint: 'leaf-T10',
      residual: { leafId: 'leaf-T10', classId: 'SP4_leaf-T10', obligations: ['leaf:ob'], chainLength: 2, evaluationPoint: 'leaf-T10' },
    });

    // Valid: priorityEstimate at top level, separate from patchMetadata (which has classId/chainLength)
    const validPatch: MapStatePatchDTO = {
      ...basePatch,
      priorityEstimate: {
        label: 'ESTIMATE_FOR_RANKING',
        complexityScore: 5,
        expectedEffect: 'high',
        basis: 'heuristic: leaf depth 2',
      },
    };
    expect(validatePatchIsolation(validPatch).ok).toBe(true);
    expect(() => serializePatch(validPatch)).not.toThrow();

    // Invalid: priorityEstimate sharing object with classId/chainLength (forbiddenPatterns + scoringMetadataContract)
    const invalidSameObject: Record<string, unknown> = {
      ...basePatch,
      patchMetadata: {
        classId: 'SP4_x',
        chainLength: 2,
        evaluationPoint: 'leaf-T10',
        priorityEstimate: {
          label: 'ESTIMATE_FOR_RANKING',
          complexityScore: 1,
          expectedEffect: 'low',
          basis: 'bad',
        },
      },
    };
    expect(validatePatchIsolation(invalidSameObject).ok).toBe(false);

    // Invalid: priorityEstimate inside proofStatus object
    const invalidProofStatus: Record<string, unknown> = {
      '@type': 'RICIS.MapStatePatch',
      meta: { method: 'test', generated: new Date().toISOString(), trustPolicy: 'WORKFLOW_ONLY' },
      nodePatches: [{ id: 'leaf-T10', state: 'resolved' }],
      proofStatus: {
        resolved: true,
        priorityEstimate: {
          label: 'ESTIMATE_FOR_RANKING',
          complexityScore: 2,
          expectedEffect: 'test',
          basis: 'bad-inside-proof',
        },
      },
      patchMetadata: { classId: 'SP4_x', chainLength: 2, evaluationPoint: 'leaf-T10' },
    };
    expect(validatePatchIsolation(invalidProofStatus).ok).toBe(false);

    // Invalid: market field inside proofStatus object (resolved_or_residual sharing monetization)
    const invalidMarket: Record<string, unknown> = {
      '@type': 'RICIS.MapStatePatch',
      meta: { method: 'test', generated: new Date().toISOString(), trustPolicy: 'WORKFLOW_ONLY' },
      proofStatus: {
        resolved: true,
        marketGain: 1000000,
      },
      patchMetadata: { classId: 'SP4', chainLength: 1, evaluationPoint: 'x' },
    };
    expect(validatePatchIsolation(invalidMarket).ok).toBe(false);

    // Emitter should reject misplaced via ensureIsolatedOrReject via emitWithPriorityEstimate if we try to manually craft bad
    expect(() =>
      emitter.emitWithPriorityEstimate(basePatch, {
        label: 'ESTIMATE_FOR_RANKING',
        complexityScore: 3,
        expectedEffect: 'medium',
        basis: 'valid basis',
      }),
    ).not.toThrow();

    // But serializer should reject if we force misplaced
    const misplacedPatch: Record<string, unknown> = {
      '@type': 'RICIS.MapStatePatch',
      meta: { method: 'test', generated: new Date().toISOString(), trustPolicy: 'WORKFLOW_ONLY' },
      resolved: {
        nodeId: 'leaf-T10',
        priorityEstimate: { label: 'ESTIMATE_FOR_RANKING', complexityScore: 1, expectedEffect: 'x', basis: 'y' },
      },
      patchMetadata: { classId: 'SP4', chainLength: 2, evaluationPoint: 'leaf' },
    };
    expect(validatePatchIsolation(misplacedPatch).ok).toBe(false);
  });

  // Additional: trust gate caution for core-agi-target patch (manual UI-test origin)
  it('TrustGate: core-agi-target manual resolved cannot be inherited as real', () => {
    const { useCase, walker, classifier } = createUseCase();
    const coreNode = makeNode({
      id: 'core-agi-target',
      state: 'resolved',
      type: 'core_singularity',
      description: 'PENDING_DOI manual test',
      // __provenance defaults to manual for this id (see ProofTrustGate)
    }) as ProblemNode & { __provenance?: string; __derivationJournal?: string };
    // do not set derivation journal => manual
    const leaf = makeNode({ id: 'leaf-trust', state: 'unresolved', dependencyIds: ['core-agi-target'] });
    const state = makeMapState([coreNode, leaf]);

    // Walker should succeed (chain ok)
    const walk = walker.walkToRoot('leaf-trust', state);
    expect(walk.status).toBe('OK');

    // But use case should reject via trust gate because upstream core-agi-target is manual
    const result = useCase.execute({ leafId: 'leaf-trust', mapState: state });
    // Since ancestors: core-agi-target is resolved (manual) — trust gate blocks resolve
    // However residual calc would see ancestors resolved (state resolved) but trust gate blocks
    // So expect REJECTED_TRUST, not RESIDUAL_READY
    expect(result.kind).toBe('REJECTED_TRUST');
  });

  it('TrustGate: production provenance allows inherit after general resolved', () => {
    const { useCase, generalization } = createUseCase();
    const coreProd = makeNode({
      id: 'core-agi-target',
      state: 'resolved',
      type: 'core_singularity',
      description: 'production derivation',
    }) as ProblemNode & { __provenance?: string; __derivationJournal?: string };
    (coreProd as unknown as Record<string, unknown>).__provenance = 'production';
    (coreProd as unknown as Record<string, unknown>).__derivationJournal = 'walker output production provenance';

    const leaf = makeNode({ id: 'leaf-prod', state: 'unresolved', title: 'ProdClass', targetFunction: 'F_Prod', dependencyIds: ['core-agi-target'] });
    const state = makeMapState([coreProd, leaf]);

    // Need to also have root maybe but coreProd is root; ancestors resolved production => residual ready
    const r1 = useCase.execute({ leafId: 'leaf-prod', mapState: state });
    expect(r1.kind).toBe('RESIDUAL_READY');

    // Create second leaf same class and test inheritance after general resolved
    const leaf2 = makeNode({ id: 'leaf-prod2', state: 'unresolved', title: 'ProdClass', targetFunction: 'F_Prod', dependencyIds: ['core-agi-target'] });
    const state2 = makeMapState([coreProd, leaf, leaf2]);
    // First leaf already created general for its class
    const classId = new SingularityClassifier().classify(leaf);
    generalization.resolveGeneral(classId);
    const r2 = useCase.execute({ leafId: 'leaf-prod2', mapState: state2 });
    expect(r2.kind).toBe('INHERITED');
  });

  // Invariant: continuum phys-unified not auto resolved via instance
  it('Invariant: continuum phys-unified must not become resolved solely from instance success', () => {
    const { useCase } = createUseCase();
    // phys-unified is continuum parent, currently unresolved. Leaf depends on it.
    const phys = makeNode({ id: 'phys-unified', state: 'unresolved', type: 'scientific_task' });
    const leaf = makeNode({ id: 'leaf-phys', state: 'unresolved', dependencyIds: ['phys-unified'] });
    const state = makeMapState([phys, leaf]);

    const result = useCase.execute({ leafId: 'leaf-phys', mapState: state });
    // Should be DEBT because phys-unified unresolved, not auto resolve
    expect(result.kind).toBe('DEBT');
    if (result.kind === 'DEBT') {
      expect(result.debt).toContain('phys-unified');
    }
    // Ensure phys-unified still unresolved (not flipped via ad-hoc)
    const physAfter = state.nodes.find(n => n.id === 'phys-unified');
    expect(physAfter?.state).toBe('unresolved');
  });

  // ForbiddenClaims not present in patches
  it('No forbidden claims in emitted patches', () => {
    const { useCase } = createUseCase();
    const root = makeNode({ id: 'root', state: 'resolved', type: 'core_singularity' });
    const leaf = makeNode({ id: 'leaf-forbidden', state: 'unresolved', dependencyIds: ['root'] });
    const state = makeMapState([root, leaf]);
    const result = useCase.execute({ leafId: 'leaf-forbidden', mapState: state });
    expect(result.kind).toBe('RESIDUAL_READY');
    if (result.kind === 'RESIDUAL_READY') {
      const json = JSON.stringify(result.patch);
      expect(json).not.toMatch(/Clay Institute acceptance/i);
      expect(json).not.toMatch(/unified field theory proved/i);
      expect(json).not.toMatch(/QM-GR merger proved/i);
      expect(json).not.toMatch(/LEAN_VERIFIED/i);
      expect(json).not.toMatch(/empirical AGI safety/i);
    }
  });

  // Domain must not import React/DOM/network — static check via file content
  it('Domain purity: no React/DOM/network imports', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const domainFiles = [
      'src/proofChain/domain/types.ts',
      'src/proofChain/domain/proofChainWalker.ts',
      'src/proofChain/domain/residualObligationCalculator.ts',
      'src/proofChain/domain/singularityClassifier.ts',
      'src/proofChain/domain/generalizationPolicy.ts',
      'src/proofChain/domain/proofInheritancePolicy.ts',
      'src/proofChain/domain/proofTrustGate.ts',
      'src/proofChain/domain/patchSerializer.ts',
    ];
    for (const file of domainFiles) {
      const content = fs.readFileSync(path.join(process.cwd(), file), 'utf-8');
      expect(content).not.toMatch(/\bfrom\s+['"]react['"]/);
      expect(content).not.toMatch(/\bimport\s+.*\bReact\b/);
      expect(content).not.toMatch(/\bdocument\./);
      expect(content).not.toMatch(/\bwindow\./);
      expect(content).not.toMatch(/\bfetch\(/);
      expect(content).not.toMatch(/\baxios\b/);
    }
  });
});
