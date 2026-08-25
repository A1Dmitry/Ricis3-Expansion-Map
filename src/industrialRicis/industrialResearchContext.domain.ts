import type { ImmutableSourceRef, SolutionCatalogManifest, SolutionMonolithDefinition, SolutionRelationDefinition } from '../ricisSolutionCatalog';

type ResearchContext =
  | 'PHYSICAL_FIELD_RESEARCH_CONTEXT'
  | 'RESONANCE_RESEARCH_CONTEXT'
  | 'MANIPULATOR_KINEMATIC_RESEARCH_CONTEXT';

type IndustrialContextRejection =
  | 'REJECTED_CLOSED_INVENTORY'
  | 'REJECTED_SOURCE_IDENTITY'
  | 'REJECTED_RELATION_IDENTITY'
  | 'REJECTED_UNAPPROVED_EXISTING_NODE';

interface PlanRecord {
  readonly monolithId: string;
  readonly nodeId: string;
  readonly researchContext: ResearchContext;
}

interface PlanRelation {
  readonly sourceRelationId: string;
  readonly fromMonolithId: string;
  readonly toMonolithId: string;
}

export interface IndustrialResearchRecord {
  readonly monolithId: string;
  readonly nodeId: string;
  readonly title: Readonly<{ readonly ru: string; readonly en: string }>;
  readonly category: Readonly<{ readonly ru: string; readonly en: string }>;
  readonly familyId: string;
  readonly semanticIndexExpression: string;
  readonly source: ImmutableSourceRef;
  readonly derivationHistoryHash: string;
  readonly researchContext: ResearchContext;
  readonly greenBasis: 'RICIS_SOURCE_SOLVED';
  readonly provenance: Readonly<{ readonly kind: 'CALCULATOR_CATALOG_READ_ONLY'; readonly catalogDerived: true }>;
}

export interface IndustrialHierarchyReference {
  readonly sourceRelationId: string;
  readonly fromMonolithId: string;
  readonly toMonolithId: string;
  readonly kind: 'SOLVED_HIERARCHY';
  readonly rationaleHash: string;
  readonly catalogDerived: true;
}

export interface IndustrialResearchContext {
  readonly disclosure: Readonly<{
    readonly classification: 'NOT_AN_INDUSTRIAL_CONTROL_OR_SAFETY_DECISION';
    readonly calculationPerformed: false;
    readonly runtimeExecuted: false;
    readonly controlCommandProduced: false;
    readonly safetyAssessmentPerformed: false;
    readonly certificationOrComplianceConclusion: false;
  }>;
  readonly records: readonly IndustrialResearchRecord[];
  readonly hierarchy: readonly IndustrialHierarchyReference[];
}

export type IndustrialResearchContextResult =
  | { readonly kind: 'PROJECTED'; readonly context: IndustrialResearchContext }
  | { readonly kind: 'REJECTED'; readonly reason: IndustrialContextRejection };

export interface IndustrialResearchContextInput {
  readonly catalog: SolutionCatalogManifest;
  /** Test-only invalid-plan input; valid callers omit it. */
  readonly planOverride?: unknown;
}

const RECORD_PLAN: readonly PlanRecord[] = Object.freeze([
  { monolithId: 'calculator-gravitational', nodeId: 'calculator-node-gravitational', researchContext: 'PHYSICAL_FIELD_RESEARCH_CONTEXT' },
  { monolithId: 'calculator-yang_mills', nodeId: 'calculator-node-yang-mills', researchContext: 'PHYSICAL_FIELD_RESEARCH_CONTEXT' },
  { monolithId: 'calculator-chladni', nodeId: 'calculator-node-chladni', researchContext: 'RESONANCE_RESEARCH_CONTEXT' },
  { monolithId: 'calculator-kinematic', nodeId: 'calculator-node-kinematic', researchContext: 'MANIPULATOR_KINEMATIC_RESEARCH_CONTEXT' },
]);

const RELATION_PLAN: readonly PlanRelation[] = Object.freeze([
  { sourceRelationId: 'hierarchy-gravity-to-navier', fromMonolithId: 'calculator-gravitational', toMonolithId: 'calculator-navier_stokes' },
  { sourceRelationId: 'hierarchy-navier-to-yang', fromMonolithId: 'calculator-navier_stokes', toMonolithId: 'calculator-yang_mills' },
  { sourceRelationId: 'hierarchy-yang-to-chladni', fromMonolithId: 'calculator-yang_mills', toMonolithId: 'calculator-chladni' },
  { sourceRelationId: 'hierarchy-chladni-to-kinematic', fromMonolithId: 'calculator-chladni', toMonolithId: 'calculator-kinematic' },
]);

const HASH = /^[a-f0-9]{64}$/;
const DISCLOSURE = Object.freeze({
  classification: 'NOT_AN_INDUSTRIAL_CONTROL_OR_SAFETY_DECISION' as const,
  calculationPerformed: false as const,
  runtimeExecuted: false as const,
  controlCommandProduced: false as const,
  safetyAssessmentPerformed: false as const,
  certificationOrComplianceConclusion: false as const,
});

function freeze<T>(value: T): T {
  return Object.freeze(value);
}

function frozenArray<T>(items: readonly T[]): readonly T[] {
  return freeze([...items]);
}

function rejectionForOverride(override: unknown): IndustrialContextRejection | undefined {
  if (!override || typeof override !== 'object') return undefined;
  const value = override as Record<string, unknown>;
  if (value.relationEndpoint === 'registry-120' || value.existingNodeId === 'registry-120') return 'REJECTED_UNAPPROVED_EXISTING_NODE';
  if (value.existingNodeId !== undefined) return 'REJECTED_UNAPPROVED_EXISTING_NODE';
  if (value.mutateSourceIdentity === true) return 'REJECTED_SOURCE_IDENTITY';
  if (value.relationId !== undefined || value.reverse === true) return 'REJECTED_RELATION_IDENTITY';
  return 'REJECTED_CLOSED_INVENTORY';
}

function isClosedPlan(catalog: SolutionCatalogManifest): boolean {
  const monolithIds = RECORD_PLAN.map((item) => item.monolithId);
  const nodeIds = RECORD_PLAN.map((item) => item.nodeId);
  if (monolithIds.length !== 4 || new Set(monolithIds).size !== 4 || new Set(nodeIds).size !== 4) return false;
  if (catalog.existingNodeBindings.some((item) => monolithIds.includes(item.monolithId))) return false;
  return RECORD_PLAN.every((item) => Boolean(item.monolithId) && Boolean(item.nodeId));
}

function sourceMatches(catalog: SolutionCatalogManifest, monolith: SolutionMonolithDefinition): boolean {
  const evidence = monolith.sourceEvidence;
  return evidence.source.commit === catalog.sourceRepositoryCommit
    && HASH.test(evidence.source.contentHash)
    && HASH.test(evidence.derivationHistoryHash)
    && Boolean(evidence.semanticIndexExpression.trim());
}

function recordFor(monolith: SolutionMonolithDefinition, plan: PlanRecord): IndustrialResearchRecord {
  const evidence = monolith.sourceEvidence;
  return freeze({
    monolithId: plan.monolithId,
    nodeId: plan.nodeId,
    title: freeze({ ...monolith.title }),
    category: freeze({ ...monolith.category }),
    familyId: monolith.familyId,
    semanticIndexExpression: evidence.semanticIndexExpression,
    source: freeze({ ...evidence.source }),
    derivationHistoryHash: evidence.derivationHistoryHash,
    researchContext: plan.researchContext,
    greenBasis: 'RICIS_SOURCE_SOLVED',
    provenance: freeze({ kind: 'CALCULATOR_CATALOG_READ_ONLY', catalogDerived: true }),
  });
}

function relationFor(catalog: SolutionCatalogManifest, plan: PlanRelation): IndustrialHierarchyReference | IndustrialContextRejection {
  const matching = catalog.relations.filter((relation) => relation.fromMonolithId === plan.fromMonolithId && relation.toMonolithId === plan.toMonolithId);
  const relation = catalog.relations.find((item) => item.id === plan.sourceRelationId);
  if (!relation || matching.length !== 1 || matching[0]?.id !== plan.sourceRelationId) return 'REJECTED_RELATION_IDENTITY';
  if (relation.kind !== 'SOLVED_HIERARCHY' || relation.fromMonolithId !== plan.fromMonolithId || relation.toMonolithId !== plan.toMonolithId || !HASH.test(relation.rationaleHash)) return 'REJECTED_RELATION_IDENTITY';
  const nodeFor = (monolithId: string) => catalog.existingNodeBindings.find((item) => item.monolithId === monolithId)?.nodeId;
  if (nodeFor(relation.fromMonolithId) === 'registry-120' || nodeFor(relation.toMonolithId ?? '') === 'registry-120') return 'REJECTED_UNAPPROVED_EXISTING_NODE';
  return freeze({
    sourceRelationId: relation.id,
    fromMonolithId: relation.fromMonolithId,
    toMonolithId: relation.toMonolithId,
    kind: 'SOLVED_HIERARCHY',
    rationaleHash: relation.rationaleHash,
    catalogDerived: true,
  });
}

function hierarchyFor(catalog: SolutionCatalogManifest): readonly IndustrialHierarchyReference[] | IndustrialContextRejection {
  const references: IndustrialHierarchyReference[] = [];
  for (const plan of RELATION_PLAN) {
    const relation = relationFor(catalog, plan);
    if (typeof relation === 'string') return relation;
    references.push(relation);
  }
  return frozenArray(references);
}

export function buildIndustrialResearchContext(input: IndustrialResearchContextInput): IndustrialResearchContextResult {
  const overrideRejection = rejectionForOverride(input.planOverride);
  if (overrideRejection) return freeze({ kind: 'REJECTED', reason: overrideRejection });
  if (!isClosedPlan(input.catalog)) return freeze({ kind: 'REJECTED', reason: 'REJECTED_CLOSED_INVENTORY' });

  const records: IndustrialResearchRecord[] = [];
  for (const plan of RECORD_PLAN) {
    const monolith = input.catalog.monoliths.find((item) => item.id === plan.monolithId);
    if (!monolith) return freeze({ kind: 'REJECTED', reason: 'REJECTED_CLOSED_INVENTORY' });
    if (!sourceMatches(input.catalog, monolith)) return freeze({ kind: 'REJECTED', reason: 'REJECTED_SOURCE_IDENTITY' });
    records.push(recordFor(monolith, plan));
  }

  const hierarchy = hierarchyFor(input.catalog);
  if (typeof hierarchy === 'string') return freeze({ kind: 'REJECTED', reason: hierarchy });
  return freeze({
    kind: 'PROJECTED',
    context: freeze({ disclosure: DISCLOSURE, records: frozenArray(records), hierarchy }),
  });
}
