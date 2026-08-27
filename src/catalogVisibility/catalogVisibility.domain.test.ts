import { describe, expect, expectTypeOf, it } from 'vitest';
import type { MapState, ProblemNode, Proof, ScienceZone } from '../model/types';

type CatalogVisibilityBrand<TValue, TName extends string> = TValue & {
  readonly __catalogVisibilityBrand: TName;
};

type CanonicalCatalogNodeId = CatalogVisibilityBrand<string, 'CatalogVisibility.CanonicalNodeId'>;
type CatalogVisibilityDiagnosticCode =
  | 'unknown_deep_link_target'
  | 'duplicate_canonical_id'
  | 'blank_canonical_id'
  | 'missing_canonical_zone'
  | 'invalid_catalog_record';

interface CanonicalCatalogSnapshot {
  readonly nodes: readonly ProblemNode[];
  readonly zones: readonly ScienceZone[];
}

interface CatalogReconciliationInput {
  readonly persistedNodes: readonly ProblemNode[];
  readonly persistedZones: readonly ScienceZone[];
  readonly canonical: CanonicalCatalogSnapshot;
}

interface CatalogReconciliationPlan {
  readonly kind: 'reconciliation_planned';
  readonly nodeAdditions: readonly ProblemNode[];
  readonly zoneAdditions: readonly ScienceZone[];
}

type CatalogReconciliationOutcome =
  | { readonly kind: 'no_reconciliation_required' }
  | CatalogReconciliationPlan
  | {
      readonly kind: 'catalog_reconciliation_rejected';
      readonly code: CatalogVisibilityDiagnosticCode;
      readonly affectedId?: string;
    };

interface CatalogReconciliationApplicationInput {
  readonly map: MapState;
  readonly plan: CatalogReconciliationPlan;
}

interface CatalogReconciliationApplicationOutcome {
  readonly kind: 'applied' | 'no_change';
  readonly map: MapState;
  readonly addedNodeIds: readonly CanonicalCatalogNodeId[];
  readonly addedZoneIds: readonly string[];
}

interface CatalogSearchInput {
  readonly node: ProblemNode;
  readonly normalizedQuery: string;
  readonly isZoneVisible: boolean;
  readonly showOnlyDerivatives: boolean;
  readonly isDerivativeNode: boolean;
}

interface DeepLinkFocusInput {
  readonly requestedNodeId: string | null;
  readonly hydratedNodes: readonly ProblemNode[];
  readonly activeVisibleNodeIds: ReadonlySet<string>;
}

type DeepLinkFocusOutcome =
  | { readonly kind: 'no_deep_link_request' }
  | {
      readonly kind: 'focused_catalog_node';
      readonly nodeId: CanonicalCatalogNodeId;
      readonly inclusion: 'include_selected_node';
    }
  | {
      readonly kind: 'unknown_deep_link_target';
      readonly requestedNodeId: string;
      readonly diagnosticCode: 'unknown_deep_link_target';
    };

interface NodeVisibilityProjection {
  readonly visibleNodeIds: ReadonlySet<string>;
  readonly selectedNodeId: CanonicalCatalogNodeId | null;
  readonly deepLinkDiagnostic: Extract<DeepLinkFocusOutcome, { readonly kind: 'unknown_deep_link_target' }> | null;
}

interface CatalogVisibilityModule {
  readonly CanonicalCatalogReconciliationPlanner: new () => {
    plan(input: CatalogReconciliationInput): CatalogReconciliationOutcome;
  };
  readonly CatalogReconciliationApplication: new () => {
    apply(input: CatalogReconciliationApplicationInput): CatalogReconciliationApplicationOutcome;
  };
  readonly CanonicalNodeSearchMatcher: new () => {
    matches(input: CatalogSearchInput): boolean;
  };
  readonly DeepLinkFocusResolver: new () => {
    resolve(input: DeepLinkFocusInput): DeepLinkFocusOutcome;
  };
  readonly NodeVisibilityProjector: new () => {
    project(input: {
      readonly filteredNodeIds: ReadonlySet<string>;
      readonly focus: DeepLinkFocusOutcome;
    }): NodeVisibilityProjection;
  };
}

const CONTRACT_PATH = './catalogVisibility.domain';
const future = () => import(/* @vite-ignore */ CONTRACT_PATH) as Promise<CatalogVisibilityModule>;

function mathZone(): ScienceZone {
  return {
    id: 'math',
    name: 'Mathematics',
    description: 'Canonical mathematics zone',
    nodeIds: [],
    economicProfile: { costToSolve: 1, costUnresolved: 2, marketGain: 3, riskLoss: 4 },
  };
}

function informaticsZone(): ScienceZone {
  return {
    id: 'informatics',
    name: 'Informatics',
    description: 'Canonical informatics zone',
    nodeIds: [],
    economicProfile: { costToSolve: 5, costUnresolved: 6, marketGain: 7, riskLoss: 8 },
  };
}

function node(id: string, overrides: Partial<ProblemNode> = {}): ProblemNode {
  return {
    id,
    title: `Node ${id}`,
    description: `Description ${id}`,
    state: 'unresolved',
    type: 'core_singularity',
    targetFunction: `Formalize(${id})`,
    zoneIds: ['math'],
    dependencyIds: [],
    dependentIds: [],
    fractalDepth: 1,
    economic: { costToSolve: 1, costUnresolved: 2, marketGain: 3, riskLoss: 4 },
    ...overrides,
  };
}

function catalogNode98(overrides: Partial<ProblemNode> = {}): ProblemNode {
  return node('real-catalog-98', {
    title: 'Pareto wealth distribution',
    description: 'Catalog discovery item for Pareto distribution singularity mapping.',
    targetFunction: 'Formalize(ParetoWealthDistribution)',
    zoneIds: ['economics'],
    ...overrides,
  });
}

function lockedProof(nodeId: string): Proof {
  return {
    nodeId,
    targetFunction: '0_F / 0_G',
    steps: [{ phase: 'external', name: 'Source lock', action: 'Preserved verbatim', expression: 'fixture-hash' }],
    finalResult: 'External source awaiting kernel verification',
    latex: 'theorem fixture : True := by trivial',
    externalLean: {
      sourceHash: 'fixture-hash',
      submittedAt: '2026-08-27T00:00:00.000Z',
      sourceLocked: true,
      trustStatus: 'TRUSTED_AXIOM',
    },
  };
}

function state(overrides: Partial<MapState> = {}): MapState {
  const root = node('core-agi-target', {
    title: 'RICIS Core AGI target',
    zoneIds: ['informatics'],
    dependencyIds: [],
  });
  const locked = node('source-locked-node', {
    type: 'scientific_task',
    state: 'partial',
  });
  return {
    nodes: [root, locked],
    edges: [{
      id: 'edge-user-owned',
      fromId: 'core-agi-target',
      toId: 'source-locked-node',
      strength: 0.7,
      stateColor: 'yellow',
      economicInfluence: 0.5,
    }],
    zones: [mathZone(), informaticsZone()],
    axioms: [],
    proofs: { 'source-locked-node': lockedProof('source-locked-node') },
    agentLogs: [],
    ...overrides,
  };
}

function canonical(nodes: readonly ProblemNode[] = [catalogNode98()]): CanonicalCatalogSnapshot {
  return {
    nodes,
    zones: [mathZone(), informaticsZone(), {
      id: 'economics',
      name: 'Economics',
      description: 'Canonical economics zone',
      nodeIds: [],
      economicProfile: { costToSolve: 9, costUnresolved: 10, marketGain: 11, riskLoss: 12 },
    }],
  };
}

function assertPlanned(outcome: CatalogReconciliationOutcome): CatalogReconciliationPlan {
  expect(outcome.kind).toBe('reconciliation_planned');
  if (outcome.kind !== 'reconciliation_planned') throw new Error('Expected reconciliation plan');
  return outcome;
}

function assertRejected(outcome: CatalogReconciliationOutcome, code: CatalogVisibilityDiagnosticCode): void {
  expect(outcome).toEqual(expect.objectContaining({ kind: 'catalog_reconciliation_rejected', code }));
}

describe('P1 catalog visibility — Step 3 red-first domain QA', () => {
  it('CVN-QA-01: plans exactly one missing canonical node and only its required zone without an edge payload', async () => {
    const module = await future();
    const map = state();
    const outcome = new module.CanonicalCatalogReconciliationPlanner().plan({
      persistedNodes: map.nodes,
      persistedZones: map.zones,
      canonical: canonical(),
    });

    const plan = assertPlanned(outcome);
    expect(plan.nodeAdditions.map((candidate) => candidate.id)).toEqual(['real-catalog-98']);
    expect(plan.zoneAdditions.map((candidate) => candidate.id)).toEqual(['economics']);
    expect(plan).not.toHaveProperty('edges');
    expect(plan).not.toHaveProperty('proofs');
    expect(plan).not.toHaveProperty('coreStatus');
    expect(plan.nodeAdditions[0]?.state).toBe('unresolved');
  });

  it('CVN-QA-02: applies a valid plan additively while preserving every pre-existing node, edge, proof, axiom and log', async () => {
    const module = await future();
    const map = state({ axioms: [{ id: 'L1', sourceNodeId: 'core-agi-target', formalStatement: 'X = X', usedByNodeIds: ['core-agi-target'] }] });
    const beforeExistingNodes = structuredClone(map.nodes);
    const beforeEdges = structuredClone(map.edges);
    const beforeProofs = structuredClone(map.proofs);
    const beforeAxioms = structuredClone(map.axioms);
    const beforeLogs = structuredClone(map.agentLogs);
    const planner = new module.CanonicalCatalogReconciliationPlanner();
    const plan = assertPlanned(planner.plan({ persistedNodes: map.nodes, persistedZones: map.zones, canonical: canonical() }));

    const outcome = new module.CatalogReconciliationApplication().apply({ map, plan });

    expect(outcome.kind).toBe('applied');
    expect(outcome.addedNodeIds).toEqual(['real-catalog-98']);
    expect(outcome.map.nodes.slice(0, beforeExistingNodes.length)).toEqual(beforeExistingNodes);
    expect(outcome.map.edges).toEqual(beforeEdges);
    expect(outcome.map.proofs).toEqual(beforeProofs);
    expect(outcome.map.axioms).toEqual(beforeAxioms);
    expect(outcome.map.agentLogs).toEqual(beforeLogs);
    expect(outcome.map.proofs['real-catalog-98']).toBeUndefined();
  });

  it('CVN-QA-03: is idempotent after the first add-only application and produces no second mutation', async () => {
    const module = await future();
    const initial = state();
    const planner = new module.CanonicalCatalogReconciliationPlanner();
    const firstPlan = assertPlanned(planner.plan({ persistedNodes: initial.nodes, persistedZones: initial.zones, canonical: canonical() }));
    const once = new module.CatalogReconciliationApplication().apply({ map: initial, plan: firstPlan });

    const secondPlan = planner.plan({ persistedNodes: once.map.nodes, persistedZones: once.map.zones, canonical: canonical() });

    expect(secondPlan).toEqual({ kind: 'no_reconciliation_required' });
  });

  it('CVN-QA-04: gives existing runtime type, state and metadata precedence over a same-ID canonical record', async () => {
    const module = await future();
    const runtimeNode = catalogNode98({
      type: 'scientific_task',
      state: 'unresolved',
      title: 'User-owned runtime title',
      description: 'User-owned runtime description',
      targetFunction: 'UserOwnedTarget()',
      zoneIds: ['informatics'],
    });
    const map = state({ nodes: [...state().nodes, runtimeNode] });
    const before = structuredClone(runtimeNode);

    const outcome = new module.CanonicalCatalogReconciliationPlanner().plan({
      persistedNodes: map.nodes,
      persistedZones: map.zones,
      canonical: canonical([catalogNode98({ type: 'core_singularity', state: 'partial' })]),
    });

    expect(outcome).toEqual({ kind: 'no_reconciliation_required' });
    expect(map.nodes.find((candidate) => candidate.id === 'real-catalog-98')).toEqual(before);
  });

  it('CVN-QA-05: cannot mutate a source-locked external Lean proof or elevate its trust while materializing catalog visibility', async () => {
    const module = await future();
    const map = state();
    const beforeProofs = structuredClone(map.proofs);
    const plan = assertPlanned(new module.CanonicalCatalogReconciliationPlanner().plan({
      persistedNodes: map.nodes,
      persistedZones: map.zones,
      canonical: canonical(),
    }));

    const outcome = new module.CatalogReconciliationApplication().apply({ map, plan });

    expect(outcome.map.proofs).toEqual(beforeProofs);
    expect(outcome.map.proofs['source-locked-node']?.externalLean?.sourceLocked).toBe(true);
    expect(outcome.map.proofs['source-locked-node']?.externalLean?.trustStatus).toBe('TRUSTED_AXIOM');
    expect(outcome.map.proofs).not.toHaveProperty('real-catalog-98');
  });

  it('CVN-QA-06: rejects blank IDs, duplicate canonical IDs and unknown canonical zones atomically', async () => {
    const module = await future();
    const planner = new module.CanonicalCatalogReconciliationPlanner();
    const map = state();
    const input = { persistedNodes: map.nodes, persistedZones: map.zones };

    assertRejected(planner.plan({ ...input, canonical: canonical([catalogNode98({ id: '   ' })]) }), 'blank_canonical_id');
    assertRejected(planner.plan({ ...input, canonical: canonical([catalogNode98(), catalogNode98()]) }), 'duplicate_canonical_id');
    assertRejected(planner.plan({
      ...input,
      canonical: { nodes: [catalogNode98({ zoneIds: ['missing-zone'] })], zones: [mathZone(), informaticsZone()] },
    }), 'missing_canonical_zone');
    expect(map).toEqual(state());
  });

  it('CVN-QA-07: copies no edge and does not infer one even when a canonical node declares a parent relationship', async () => {
    const module = await future();
    const map = state();
    const catalogEntry = catalogNode98({ dependencyIds: ['core-agi-target'] });
    const plan = assertPlanned(new module.CanonicalCatalogReconciliationPlanner().plan({
      persistedNodes: map.nodes,
      persistedZones: map.zones,
      canonical: canonical([catalogEntry]),
    }));

    const outcome = new module.CatalogReconciliationApplication().apply({ map, plan });

    expect(outcome.map.edges).toEqual(map.edges);
    expect(outcome.map.edges.some((edge) => edge.fromId === 'core-agi-target' && edge.toId === 'real-catalog-98')).toBe(false);
  });

  it('CVN-QA-08: matches a canonical node ID case-insensitively without relying on its title', async () => {
    const module = await future();
    const target = catalogNode98();

    const matches = new module.CanonicalNodeSearchMatcher().matches({
      node: target,
      normalizedQuery: 'REAL-CATALOG-98',
      isZoneVisible: true,
      showOnlyDerivatives: false,
      isDerivativeNode: false,
    });

    expect(matches).toBe(true);
  });

  it('CVN-QA-09: retains title, description and target-function search matching as additive behavior', async () => {
    const module = await future();
    const matcher = new module.CanonicalNodeSearchMatcher();
    const target = catalogNode98({
      title: 'Pareto wealth distribution',
      description: 'A singular value distribution catalogue entry',
      targetFunction: 'Formalize(ParetoWealthDistribution)',
    });

    for (const normalizedQuery of ['pareto', 'singular value', 'formalize(paretowealthdistribution)']) {
      expect(matcher.matches({
        node: target,
        normalizedQuery,
        isZoneVisible: true,
        showOnlyDerivatives: false,
        isDerivativeNode: false,
      })).toBe(true);
    }
  });

  it('CVN-QA-10: resolves a valid deep link only to its exact hydrated ID after reconciliation', async () => {
    const module = await future();
    const resolver = new module.DeepLinkFocusResolver();
    const hydratedNodes = [...state().nodes, catalogNode98()];

    const outcome = resolver.resolve({
      requestedNodeId: 'real-catalog-98',
      hydratedNodes,
      activeVisibleNodeIds: new Set(['core-agi-target']),
    });

    expect(outcome).toEqual({
      kind: 'focused_catalog_node',
      nodeId: 'real-catalog-98',
      inclusion: 'include_selected_node',
    });
  });

  it('CVN-QA-11: includes a valid selected deep-link node in the render projection without resetting active filters', async () => {
    const module = await future();
    const filteredNodeIds = new Set(['core-agi-target']);
    const outcome = new module.DeepLinkFocusResolver().resolve({
      requestedNodeId: 'real-catalog-98',
      hydratedNodes: [...state().nodes, catalogNode98()],
      activeVisibleNodeIds: filteredNodeIds,
    });

    const projection = new module.NodeVisibilityProjector().project({ filteredNodeIds, focus: outcome });

    expect(filteredNodeIds).toEqual(new Set(['core-agi-target']));
    expect(projection.visibleNodeIds).toEqual(new Set(['core-agi-target', 'real-catalog-98']));
    expect(projection.selectedNodeId).toBe('real-catalog-98');
    expect(projection.deepLinkDiagnostic).toBeNull();
  });

  it('CVN-QA-12: reports an exact unknown ID without node creation, fallback selection, proof/Core/Lean payload or URL-side mutation', async () => {
    const module = await future();
    const resolver = new module.DeepLinkFocusResolver();
    const outcome = resolver.resolve({
      requestedNodeId: 'unknown-catalog-node',
      hydratedNodes: state().nodes,
      activeVisibleNodeIds: new Set(['core-agi-target']),
    });

    expect(outcome).toEqual({
      kind: 'unknown_deep_link_target',
      requestedNodeId: 'unknown-catalog-node',
      diagnosticCode: 'unknown_deep_link_target',
    });
    const projection = new module.NodeVisibilityProjector().project({
      filteredNodeIds: new Set(['core-agi-target']),
      focus: outcome,
    });
    expect(projection.selectedNodeId).toBeNull();
    expect(projection.visibleNodeIds).toEqual(new Set(['core-agi-target']));
    expect(projection.deepLinkDiagnostic).toEqual(outcome);
    expect(outcome).not.toHaveProperty('proof');
    expect(outcome).not.toHaveProperty('coreStatus');
    expect(outcome).not.toHaveProperty('leanEvidence');
    expect(outcome).not.toHaveProperty('fallbackNodeId');
  });

  it('CVN-QA-13: maintains exact selection when camera geometry is later unavailable because presentation geometry is not identity resolution', async () => {
    const module = await future();
    const outcome = new module.DeepLinkFocusResolver().resolve({
      requestedNodeId: 'real-catalog-98',
      hydratedNodes: [...state().nodes, catalogNode98()],
      activeVisibleNodeIds: new Set(),
    });

    expect(outcome).toMatchObject({ kind: 'focused_catalog_node', nodeId: 'real-catalog-98' });
    expect(outcome).not.toHaveProperty('nodePosition');
    expect(outcome).not.toHaveProperty('cameraPlan');
  });

  it('CVN-QA-14: keeps catalog visibility contract data-only and not a path for singularity computation, proof or Core/Lean assertions', async () => {
    const module = await future();
    const plan = assertPlanned(new module.CanonicalCatalogReconciliationPlanner().plan({
      persistedNodes: state().nodes,
      persistedZones: state().zones,
      canonical: canonical(),
    }));

    expect(plan).not.toHaveProperty('singularityResult');
    expect(plan).not.toHaveProperty('reducedInvariant');
    expect(plan).not.toHaveProperty('proof');
    expect(plan).not.toHaveProperty('externalLean');
    expect(plan).not.toHaveProperty('coreStatus');
    expectTypeOf<CatalogReconciliationPlan['nodeAdditions']>().toMatchTypeOf<readonly ProblemNode[]>();
    expectTypeOf<DeepLinkFocusOutcome>().toMatchTypeOf<{ readonly kind: string }>();
  });
});
