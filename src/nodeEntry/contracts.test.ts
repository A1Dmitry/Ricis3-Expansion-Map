import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  GraphHandoffUrl,
  NodeEntryBuildOutcome,
  NodeEntryCatalogProjection,
  NodeEntryManifest,
  NodeEntryViewModel,
} from './contracts';

const handoff = (nodeId: string) => `/?node=${encodeURIComponent(nodeId)}&from=node-entry` as GraphHandoffUrl;

function manifest(input: Pick<NodeEntryManifest, 'slug' | 'nodeId' | 'discipline' | 'publicTitle' | 'trustFraming' | 'safetyNotices'>): NodeEntryManifest {
  return {
    ...input,
    locale: 'ru',
    searchDescription: `Исследовательская точка входа: ${input.publicTitle}.`,
    readerQuestion: 'Как этот узел связан с общим графом?',
    editorialSummary: 'Контент описывает исследовательский узел и его границы, не заявляя решения.',
    sourceReferences: [{
      citationKey: `catalog:${input.nodeId}`,
      title: 'RICIS catalog provenance',
      url: 'https://github.com/A1Dmitry/Ricis3-Expansion-Map',
      sourceKind: 'catalog_provenance',
    }],
    review: {
      reviewedAt: 1_787_000_000_000,
      reviewerRole: input.discipline === 'pharmacy' ? 'medical_editor' : 'subject_editor',
      editorialPolicyVersion: 'node-entry-v1',
    },
    publicationState: 'published',
  };
}

const waveOne: readonly NodeEntryManifest[] = [
  manifest({
    slug: 'physics-hydrodynamic-singularities' as NodeEntryManifest['slug'],
    nodeId: 'real-catalog-38' as NodeEntryManifest['nodeId'],
    discipline: 'physics',
    publicTitle: 'Сингулярности в гидродинамике',
    trustFraming: 'research_node_unresolved',
    safetyNotices: ['research_only', 'not_a_formal_proof'],
  }),
  manifest({
    slug: 'number-theory-riemann-hypothesis' as NodeEntryManifest['slug'],
    nodeId: 'real-catalog-3' as NodeEntryManifest['nodeId'],
    discipline: 'number_theory',
    publicTitle: 'Гипотеза Римана',
    trustFraming: 'research_node_unresolved',
    safetyNotices: ['research_only', 'not_a_formal_proof'],
  }),
  manifest({
    slug: 'agi-intelligence-singularity' as NodeEntryManifest['slug'],
    nodeId: 'real-catalog-57' as NodeEntryManifest['nodeId'],
    discipline: 'agi',
    publicTitle: 'Сингулярность ИИ',
    trustFraming: 'research_node_unresolved',
    safetyNotices: ['research_only', 'hypothesis_not_prediction', 'not_a_formal_proof'],
  }),
  manifest({
    slug: 'pharmacy-blood-brain-barrier-delivery' as NodeEntryManifest['slug'],
    nodeId: 'real-catalog-79' as NodeEntryManifest['nodeId'],
    discipline: 'pharmacy',
    publicTitle: 'Гематоэнцефалический барьер',
    trustFraming: 'research_node_unresolved',
    safetyNotices: ['research_only', 'not_medical_advice', 'not_a_formal_proof'],
  }),
];

const unresolvedCatalogNode: NodeEntryCatalogProjection = {
  nodeId: 'real-catalog-3' as NodeEntryManifest['nodeId'],
  title: 'Гипотеза Римана',
  description: 'Все нетривиальные нули дзета-функции лежат на критической прямой.',
  state: 'unresolved',
  type: 'core_singularity',
  targetFunction: 'Formalize(ГипотезаРимана)',
  singularityHint: 'Полюс при s=1.',
  dependencyIds: [],
  dependentIds: [],
  zoneIds: ['math'],
};

function assertNonRendered(outcome: Exclude<NodeEntryBuildOutcome, { readonly kind: 'rendered' }>): string {
  switch (outcome.kind) {
    case 'manifest_not_found':
    case 'entry_not_reviewed':
    case 'source_provenance_required':
    case 'trust_framing_conflict':
    case 'medical_safety_notice_required':
    case 'duplicate_canonical':
      return outcome.kind;
    case 'node_not_found':
      return outcome.nodeId;
  }
}

describe('Node-led marketing — Step 3 entry contract QA', () => {
  it('NQA01: Wave 1 maps one reviewed, published, sourced manifest to each approved discipline/node pair', () => {
    expect(waveOne.map((entry) => [entry.discipline, entry.nodeId])).toEqual([
      ['physics', 'real-catalog-38'],
      ['number_theory', 'real-catalog-3'],
      ['agi', 'real-catalog-57'],
      ['pharmacy', 'real-catalog-79'],
    ]);
    expect(waveOne.every((entry) => entry.publicationState === 'published' && entry.review !== undefined && entry.sourceReferences.length > 0)).toBe(true);
  });

  it('NQA02: unresolved research framing never encodes a solved or formal-proof status in the entry contract', () => {
    expect(waveOne.every((entry) => entry.trustFraming === 'research_node_unresolved')).toBe(true);
    expect(waveOne.every((entry) => entry.safetyNotices.includes('not_a_formal_proof'))).toBe(true);
    expect(unresolvedCatalogNode.state).toBe('unresolved');
  });

  it('NQA03: AGI and Pharmacy manifests preserve domain-specific safety framing', () => {
    const agi = waveOne.find((entry) => entry.discipline === 'agi');
    const pharmacy = waveOne.find((entry) => entry.discipline === 'pharmacy');
    expect(agi?.safetyNotices).toContain('hypothesis_not_prediction');
    expect(pharmacy?.safetyNotices).toContain('not_medical_advice');
  });

  it('NQA04: graph handoff is a normal selected-node URL and has no proof, balance, identity or referral payload', () => {
    const url = handoff('real-catalog-38');
    expect(url).toBe('/?node=real-catalog-38&from=node-entry');
    expect(url).not.toContain('proof');
    expect(url).not.toContain('token');
    expect(url).not.toContain('ref=');
    expect(url).not.toContain('account');
  });

  it('NQA05: non-render outcomes are closed and prevent an indexable static entry by contract', () => {
    const outcomes: readonly Exclude<NodeEntryBuildOutcome, { readonly kind: 'rendered' }>[] = [
      { kind: 'entry_not_reviewed' },
      { kind: 'source_provenance_required' },
      { kind: 'trust_framing_conflict' },
      { kind: 'medical_safety_notice_required' },
      { kind: 'duplicate_canonical' },
      { kind: 'node_not_found', nodeId: 'unknown-node' as NodeEntryManifest['nodeId'] },
      { kind: 'manifest_not_found' },
    ];
    expect(outcomes.map(assertNonRendered)).toEqual([
      'entry_not_reviewed',
      'source_provenance_required',
      'trust_framing_conflict',
      'medical_safety_notice_required',
      'duplicate_canonical',
      'unknown-node',
      'manifest_not_found',
    ]);
  });

  it('NQA06: browser-safe entry view joins editorial framing with catalog projection instead of carrying mutable graph/proof authority', () => {
    const view: NodeEntryViewModel = {
      slug: waveOne[1]!.slug,
      locale: 'ru',
      canonicalUrl: 'https://a1dmitry.github.io/Ricis3-Expansion-Map/nodes/number-theory-riemann-hypothesis/' as NodeEntryViewModel['canonicalUrl'],
      graphHandoffUrl: handoff('real-catalog-3'),
      manifest: waveOne[1]!,
      catalogNode: unresolvedCatalogNode,
      neighbours: [],
    };
    expect(view.catalogNode.state).toBe('unresolved');
    expect(view).not.toHaveProperty('proof');
    expect(view).not.toHaveProperty('leanEvidence');
    expect(view).not.toHaveProperty('graphMutation');
  });

  it('NQA07: TypeScript keeps page identity, canonical and graph handoff distinct from raw strings', () => {
    expectTypeOf<NodeEntryManifest['slug']>().not.toEqualTypeOf<string>();
    expectTypeOf<NodeEntryViewModel['canonicalUrl']>().not.toEqualTypeOf<GraphHandoffUrl>();
    expectTypeOf<NodeEntryCatalogProjection['state']>().toEqualTypeOf<'unresolved' | 'partial' | 'resolved'>();
  });
});
