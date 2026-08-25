import type {
  ImmutableSourceRef,
  SolutionCatalogManifest,
  SolutionMonolithDefinition,
} from '../ricisSolutionCatalog';

export type AssuranceLaneAvailability = 'NOT_PROVIDED' | 'REPORTED';

export interface AssuranceLane {
  readonly availability: AssuranceLaneAvailability;
  readonly sourceKind?: 'CATALOG_READ_ONLY' | 'CANONICAL_READ_SNAPSHOT';
  readonly reportedStatus?: string;
}

export interface AssuranceAuthoritySnapshot {
  readonly sourceIdentity: Readonly<{
    readonly monolithId: 'calculator-llm_gradient';
    readonly catalogCommit: string;
    readonly contentHash: string;
  }>;
  readonly core: AssuranceLane;
  readonly lean: AssuranceLane;
  readonly human: AssuranceLane;
  readonly agent: AssuranceLane;
}

export interface VerifiableAiAssuranceBrief {
  readonly monolithId: 'calculator-llm_gradient';
  readonly nodeId: 'registry-118';
  readonly title: Readonly<{ readonly ru: string; readonly en: string }>;
  readonly category: Readonly<{ readonly ru: string; readonly en: string }>;
  readonly familyId: string;
  readonly semanticIndexExpression: string;
  readonly source: ImmutableSourceRef;
  readonly lanes: Readonly<{
    readonly source: AssuranceLane;
    readonly core: AssuranceLane;
    readonly lean: AssuranceLane;
    readonly human: AssuranceLane;
    readonly agent: AssuranceLane;
  }>;
  readonly disclosure: Readonly<{
    readonly classification: 'NOT_A_COMPLIANCE_OR_CERTIFICATION_DECISION';
    readonly calculationPerformed: false;
    readonly runtimeExecuted: false;
    readonly legalAdviceProvided: false;
    readonly authorityMutationPerformed: false;
  }>;
  readonly governanceContext: Readonly<{
    readonly framework: 'AI_ASSURANCE_CONTEXT_ONLY';
    readonly nonBinding: true;
    readonly themes: readonly ['traceability', 'documentation', 'human_oversight', 'repeatable_risk_management'];
  }>;
}

export type AssuranceBriefRejection =
  | 'REJECTED_UNAPPROVED_MONOLITH'
  | 'REJECTED_SOURCE_IDENTITY'
  | 'REJECTED_AUTHORITY_SNAPSHOT'
  | 'REJECTED_DISCLOSURE_REQUEST';

export type AssuranceBriefResult =
  | { readonly kind: 'PROJECTED'; readonly brief: VerifiableAiAssuranceBrief }
  | { readonly kind: 'REJECTED'; readonly reason: AssuranceBriefRejection };

export interface AssuranceBriefInput {
  readonly catalog: SolutionCatalogManifest;
  readonly monolithId?: string;
  readonly authoritySnapshot?: unknown;
  readonly disclosureRequest?: unknown;
}

const TARGET_MONOLITH_ID = 'calculator-llm_gradient' as const;
const TARGET_NODE_ID = 'registry-118' as const;
const HASH = /^[a-f0-9]{64}$/;

function freeze<T>(value: T): T {
  return Object.freeze(value);
}

function absentLane(): AssuranceLane {
  return freeze({ availability: 'NOT_PROVIDED' });
}

function canonicalLane(value: unknown): AssuranceLane | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const lane = value as Record<string, unknown>;
  if (lane.availability === 'NOT_PROVIDED') {
    return freeze({ availability: 'NOT_PROVIDED' });
  }
  if (
    lane.availability === 'REPORTED'
    && lane.sourceKind === 'CANONICAL_READ_SNAPSHOT'
    && typeof lane.reportedStatus === 'string'
    && lane.reportedStatus.trim().length > 0
  ) {
    return freeze({
      availability: 'REPORTED',
      sourceKind: 'CANONICAL_READ_SNAPSHOT',
      reportedStatus: lane.reportedStatus,
    });
  }
  return undefined;
}

function sourceIsExact(catalog: SolutionCatalogManifest, monolith: SolutionMonolithDefinition): boolean {
  const evidence = monolith.sourceEvidence;
  const source = evidence.source;
  const binding = catalog.existingNodeBindings.find((item) => item.monolithId === TARGET_MONOLITH_ID);
  return monolith.id === TARGET_MONOLITH_ID
    && binding?.nodeId === TARGET_NODE_ID
    && catalog.sourceRepositoryCommit === source.commit
    && source.sourceId === TARGET_MONOLITH_ID
    && HASH.test(source.contentHash)
    && HASH.test(evidence.derivationHistoryHash)
    && evidence.semanticIndexExpression.trim().length > 0;
}

function authorityLanes(snapshot: unknown, catalog: SolutionCatalogManifest, monolith: SolutionMonolithDefinition): Readonly<{
  readonly core: AssuranceLane;
  readonly lean: AssuranceLane;
  readonly human: AssuranceLane;
  readonly agent: AssuranceLane;
}> | AssuranceBriefRejection {
  if (snapshot === undefined) {
    return freeze({ core: absentLane(), lean: absentLane(), human: absentLane(), agent: absentLane() });
  }
  if (!snapshot || typeof snapshot !== 'object') return 'REJECTED_AUTHORITY_SNAPSHOT';
  const candidate = snapshot as Record<string, unknown>;
  const identity = candidate.sourceIdentity;
  if (!identity || typeof identity !== 'object') return 'REJECTED_AUTHORITY_SNAPSHOT';
  const sourceIdentity = identity as Record<string, unknown>;
  const source = monolith.sourceEvidence.source;
  if (
    sourceIdentity.monolithId !== TARGET_MONOLITH_ID
    || sourceIdentity.catalogCommit !== catalog.sourceRepositoryCommit
    || sourceIdentity.contentHash !== source.contentHash
  ) {
    return 'REJECTED_AUTHORITY_SNAPSHOT';
  }
  const core = canonicalLane(candidate.core);
  const lean = canonicalLane(candidate.lean);
  const human = canonicalLane(candidate.human);
  const agent = canonicalLane(candidate.agent);
  if (!core || !lean || !human || !agent) return 'REJECTED_AUTHORITY_SNAPSHOT';
  return freeze({ core, lean, human, agent });
}

export function buildVerifiableAiAssuranceBrief(input: AssuranceBriefInput): AssuranceBriefResult {
  if (input.disclosureRequest !== undefined) {
    return freeze({ kind: 'REJECTED', reason: 'REJECTED_DISCLOSURE_REQUEST' });
  }
  if (input.monolithId !== undefined && input.monolithId !== TARGET_MONOLITH_ID) {
    return freeze({ kind: 'REJECTED', reason: 'REJECTED_UNAPPROVED_MONOLITH' });
  }
  const monolith = input.catalog.monoliths.find((item) => item.id === TARGET_MONOLITH_ID);
  if (!monolith || !sourceIsExact(input.catalog, monolith)) {
    return freeze({ kind: 'REJECTED', reason: 'REJECTED_SOURCE_IDENTITY' });
  }
  const authority = authorityLanes(input.authoritySnapshot, input.catalog, monolith);
  if (typeof authority === 'string') {
    return freeze({ kind: 'REJECTED', reason: authority });
  }
  const brief: VerifiableAiAssuranceBrief = freeze({
    monolithId: TARGET_MONOLITH_ID,
    nodeId: TARGET_NODE_ID,
    title: freeze({ ...monolith.title }),
    category: freeze({ ...monolith.category }),
    familyId: monolith.familyId,
    semanticIndexExpression: monolith.sourceEvidence.semanticIndexExpression,
    source: freeze({ ...monolith.sourceEvidence.source }),
    lanes: freeze({
      source: freeze({
        availability: 'REPORTED',
        sourceKind: 'CATALOG_READ_ONLY',
        reportedStatus: 'RICIS_SOURCE_SOLVED',
      }),
      core: authority.core,
      lean: authority.lean,
      human: authority.human,
      agent: authority.agent,
    }),
    disclosure: freeze({
      classification: 'NOT_A_COMPLIANCE_OR_CERTIFICATION_DECISION',
      calculationPerformed: false,
      runtimeExecuted: false,
      legalAdviceProvided: false,
      authorityMutationPerformed: false,
    }),
    governanceContext: freeze({
      framework: 'AI_ASSURANCE_CONTEXT_ONLY',
      nonBinding: true,
      themes: freeze(['traceability', 'documentation', 'human_oversight', 'repeatable_risk_management']) as readonly ['traceability', 'documentation', 'human_oversight', 'repeatable_risk_management'],
    }),
  });
  return freeze({ kind: 'PROJECTED', brief });
}
