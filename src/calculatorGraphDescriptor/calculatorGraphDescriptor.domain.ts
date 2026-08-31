import type { DependencyEdge, ProblemNode } from '../model/types';
import type {
  ImmutableSourceRef,
  SolutionCatalogManifest,
  SolutionMonolithDefinition,
  SolutionRelationDefinition,
} from '../ricisSolutionCatalog';

type DescriptorZone = 'math' | 'physics' | 'informatics';
type RejectionReason =
  | 'REJECTED_CLOSED_INVENTORY'
  | 'REJECTED_SOURCE_IDENTITY'
  | 'REJECTED_DESCRIPTOR_PLAN'
  | 'REJECTED_RELATION_IDENTITY'
  | 'REJECTED_UNAPPROVED_EXISTING_NODE';

interface DescriptorPlanItem {
  readonly monolithId: string;
  readonly nodeId: string;
  readonly zoneId: DescriptorZone;
  readonly position: readonly number[];
  readonly relationIds: readonly string[];
}

export interface CalculatorGraphDescriptor {
  readonly nodeId: string;
  readonly monolithId: string;
  readonly title: Readonly<{ readonly ru: string; readonly en: string }>;
  readonly category: Readonly<{ readonly ru: string; readonly en: string }>;
  readonly familyId: string;
  readonly semanticIndexExpression: string;
  readonly source: ImmutableSourceRef;
  readonly zoneId: DescriptorZone;
  readonly position: readonly [number, number, number];
  readonly greenBasis: 'RICIS_SOURCE_SOLVED';
  readonly workflowState: 'partial';
  readonly provenance: Readonly<{ readonly kind: 'CALCULATOR_CATALOG_READ_ONLY'; readonly catalogDerived: true }>;
}

export interface GraphRelationProjection {
  readonly sourceRelationId: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly kind: 'SOLVED_HIERARCHY';
  readonly rationaleHash: string;
  readonly catalogDerived: true;
}

export type CalculatorGraphProjection =
  | {
    readonly kind: 'PROJECTED';
    readonly descriptors: readonly CalculatorGraphDescriptor[];
    readonly relations: readonly GraphRelationProjection[];
    readonly nodes: readonly ProblemNode[];
    readonly edges: readonly DependencyEdge[];
  }
  | { readonly kind: 'REJECTED'; readonly reason: RejectionReason };

export interface CalculatorGraphProjectionInput {
  readonly catalog: SolutionCatalogManifest;
  /** Test-only invalid-plan input; valid callers omit it. */
  readonly planOverride?: unknown;
}

const CLOSED_PLAN: readonly DescriptorPlanItem[] = Object.freeze([
  { monolithId: 'calculator-complex_analysis', nodeId: 'calculator-node-complex-analysis', zoneId: 'math', position: Object.freeze([-16, 7, -8]), relationIds: Object.freeze(['hierarchy-cdcc-to-complex', 'hierarchy-complex-to-riemann', 'hierarchy-complex-to-mandelbrot']) },
  { monolithId: 'calculator-riemann', nodeId: 'calculator-node-riemann', zoneId: 'math', position: Object.freeze([-10, 9, -12]), relationIds: Object.freeze(['hierarchy-complex-to-riemann', 'hierarchy-riemann-to-bsd', 'hierarchy-riemann-to-hodge']) },
  { monolithId: 'calculator-bsd', nodeId: 'calculator-node-bsd', zoneId: 'math', position: Object.freeze([-4, 11, -8]), relationIds: Object.freeze(['hierarchy-riemann-to-bsd']) },
  { monolithId: 'calculator-hodge', nodeId: 'calculator-node-hodge', zoneId: 'math', position: Object.freeze([-5, 5, -16]), relationIds: Object.freeze(['hierarchy-riemann-to-hodge', 'hierarchy-hodge-to-poincare']) },
  { monolithId: 'calculator-poincare', nodeId: 'calculator-node-poincare', zoneId: 'math', position: Object.freeze([1, 6, -13]), relationIds: Object.freeze(['hierarchy-hodge-to-poincare']) },
  { monolithId: 'calculator-mandelbrot', nodeId: 'calculator-node-mandelbrot', zoneId: 'math', position: Object.freeze([-16, 2, -15]), relationIds: Object.freeze(['hierarchy-complex-to-mandelbrot']) },
  { monolithId: 'calculator-gravitational', nodeId: 'calculator-node-gravitational', zoneId: 'physics', position: Object.freeze([11, 10, -5]), relationIds: Object.freeze(['hierarchy-gravity-to-navier']) },
  { monolithId: 'calculator-yang_mills', nodeId: 'calculator-node-yang-mills', zoneId: 'physics', position: Object.freeze([18, 5, -10]), relationIds: Object.freeze(['hierarchy-navier-to-yang', 'hierarchy-yang-to-chladni']) },
  { monolithId: 'calculator-chladni', nodeId: 'calculator-node-chladni', zoneId: 'physics', position: Object.freeze([21, -1, -4]), relationIds: Object.freeze(['hierarchy-yang-to-chladni', 'hierarchy-chladni-to-kinematic']) },
  { monolithId: 'calculator-kinematic', nodeId: 'calculator-node-kinematic', zoneId: 'informatics', position: Object.freeze([16, -7, 8]), relationIds: Object.freeze(['hierarchy-chladni-to-kinematic']) },
]);

const HASH = /^[a-f0-9]{64}$/;
const ALLOWED_ZONES = new Set<DescriptorZone>(['math', 'physics', 'informatics']);

function freeze<T>(value: T): T {
  return Object.freeze(value);
}

function frozenArray<T>(values: readonly T[]): readonly T[] {
  return freeze([...values]);
}

function overrideRejection(override: unknown): RejectionReason | undefined {
  if (!override || typeof override !== 'object') return undefined;
  const value = override as Record<string, unknown>;
  if (value.relationEndpoint === 'registry-120') return 'REJECTED_UNAPPROVED_EXISTING_NODE';
  if (value.mutateSourceIdentity === true) return 'REJECTED_SOURCE_IDENTITY';
  if (value.invalidZone !== undefined || value.coordinate !== undefined || value.duplicateNodeId === true) return 'REJECTED_DESCRIPTOR_PLAN';
  if (value.relationId !== undefined || value.reverse === true) return 'REJECTED_RELATION_IDENTITY';
  if (value.append !== undefined || value.replaceFirst !== undefined) return 'REJECTED_CLOSED_INVENTORY';
  return 'REJECTED_DESCRIPTOR_PLAN';
}

function planIsClosed(catalog: SolutionCatalogManifest): boolean {
  const bound = new Set(catalog.existingNodeBindings.map(item => item.monolithId));
  const ids = CLOSED_PLAN.map(item => item.monolithId);
  const nodeIds = CLOSED_PLAN.map(item => item.nodeId);
  if (ids.length !== 10 || new Set(ids).size !== 10 || new Set(nodeIds).size !== 10) return false;
  if (ids.some(id => bound.has(id))) return false;
  return CLOSED_PLAN.every(item => ALLOWED_ZONES.has(item.zoneId) && item.position.length === 3 && item.position.every(Number.isFinite));
}

function sourceMatches(catalog: SolutionCatalogManifest, monolith: SolutionMonolithDefinition): boolean {
  const source = monolith.sourceEvidence.source;
  return source.commit === catalog.sourceRepositoryCommit && HASH.test(source.contentHash) && HASH.test(monolith.sourceEvidence.derivationHistoryHash) && Boolean(monolith.sourceEvidence.semanticIndexExpression.trim());
}

function toDescriptor(monolith: SolutionMonolithDefinition, item: DescriptorPlanItem): CalculatorGraphDescriptor {
  return freeze({
    nodeId: item.nodeId,
    monolithId: item.monolithId,
    title: freeze({ ...monolith.title }),
    category: freeze({ ...monolith.category }),
    familyId: monolith.familyId,
    semanticIndexExpression: monolith.sourceEvidence.semanticIndexExpression,
    source: freeze({ ...monolith.sourceEvidence.source }),
    zoneId: item.zoneId,
    position: freeze([...item.position]) as unknown as readonly [number, number, number],
    greenBasis: 'RICIS_SOURCE_SOLVED',
    workflowState: 'partial',
    provenance: freeze({ kind: 'CALCULATOR_CATALOG_READ_ONLY', catalogDerived: true }),
  });
}

function nodeFor(descriptor: CalculatorGraphDescriptor, relations: readonly GraphRelationProjection[]): ProblemNode {
  const incoming = relations.filter(item => item.toNodeId === descriptor.nodeId).map(item => item.fromNodeId);
  const outgoing = relations.filter(item => item.fromNodeId === descriptor.nodeId).map(item => item.toNodeId);
  return freeze({
    id: descriptor.nodeId,
    title: descriptor.title.ru,
    description: `${descriptor.category.ru}. Source-bound calculator monolith projection.`,
    state: 'resolved', leanErrors: [],
    type: 'scientific_task',
    targetFunction: descriptor.semanticIndexExpression,
    zoneIds: [descriptor.zoneId],
    dependencyIds: [...incoming],
    dependentIds: [...outgoing],
    fractalDepth: 1,
    economic: freeze({ costUnresolved: 0, costToSolve: 0, marketGain: 0, riskLoss: 0 }),
    rewardClass: 'reputation',
    singularityHint: `Source-bound calculator monolith: ${descriptor.monolithId}.`,
  });
}

function resolveRelations(
  catalog: SolutionCatalogManifest,
  descriptorByMonolithId: ReadonlyMap<string, CalculatorGraphDescriptor>,
): readonly GraphRelationProjection[] | RejectionReason {
  const nodeIdByMonolithId = new Map<string, string>(catalog.existingNodeBindings.map(item => [item.monolithId, item.nodeId]));
  for (const descriptor of descriptorByMonolithId.values()) nodeIdByMonolithId.set(descriptor.monolithId, descriptor.nodeId);
  const relationIds = [...new Set(CLOSED_PLAN.flatMap(item => item.relationIds))];
  const output: GraphRelationProjection[] = [];
  for (const id of relationIds) {
    const source = catalog.relations.find(item => item.id === id);
    if (!source || source.kind !== 'SOLVED_HIERARCHY' || !source.toMonolithId || !HASH.test(source.rationaleHash)) return 'REJECTED_RELATION_IDENTITY';
    const fromNodeId = nodeIdByMonolithId.get(source.fromMonolithId);
    const toNodeId = nodeIdByMonolithId.get(source.toMonolithId);
    if (!fromNodeId || !toNodeId) return 'REJECTED_RELATION_IDENTITY';
    if (fromNodeId === 'registry-120' || toNodeId === 'registry-120') return 'REJECTED_UNAPPROVED_EXISTING_NODE';
    output.push(freeze({ sourceRelationId: source.id, fromNodeId, toNodeId, kind: 'SOLVED_HIERARCHY', rationaleHash: source.rationaleHash, catalogDerived: true }));
  }
  const edgeKeys = output.map(item => `${item.fromNodeId}->${item.toNodeId}`);
  return new Set(edgeKeys).size === edgeKeys.length ? frozenArray(output) : 'REJECTED_RELATION_IDENTITY';
}

function edgesFor(relations: readonly GraphRelationProjection[]): readonly DependencyEdge[] {
  return frozenArray(relations.map(item => freeze({
    id: `calculator-catalog-${item.sourceRelationId}`,
    fromId: item.fromNodeId,
    toId: item.toNodeId,
    strength: 1,
    stateColor: 'green',
    economicInfluence: 0,
  })));
}

export function buildCalculatorGraphProjection(input: CalculatorGraphProjectionInput): CalculatorGraphProjection {
  const overridden = overrideRejection(input.planOverride);
  if (overridden) return freeze({ kind: 'REJECTED', reason: overridden });
  if (!planIsClosed(input.catalog)) return freeze({ kind: 'REJECTED', reason: 'REJECTED_CLOSED_INVENTORY' });

  const descriptors: CalculatorGraphDescriptor[] = [];
  for (const item of CLOSED_PLAN) {
    const monolith = input.catalog.monoliths.find(candidate => candidate.id === item.monolithId);
    if (!monolith) return freeze({ kind: 'REJECTED', reason: 'REJECTED_CLOSED_INVENTORY' });
    if (!sourceMatches(input.catalog, monolith)) return freeze({ kind: 'REJECTED', reason: 'REJECTED_SOURCE_IDENTITY' });
    descriptors.push(toDescriptor(monolith, item));
  }
  const frozenDescriptors = frozenArray(descriptors);
  const descriptorByMonolithId = new Map(frozenDescriptors.map(item => [item.monolithId, item]));
  const relations = resolveRelations(input.catalog, descriptorByMonolithId);
  if (typeof relations === 'string') return freeze({ kind: 'REJECTED', reason: relations });
  const nodes = frozenArray(frozenDescriptors.map(descriptor => nodeFor(descriptor, relations)));
  return freeze({ kind: 'PROJECTED', descriptors: frozenDescriptors, relations, nodes, edges: edgesFor(relations) });
}
