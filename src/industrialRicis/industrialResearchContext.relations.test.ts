import { describe, expect, it } from 'vitest';
import { INITIAL_SOLUTION_CATALOG } from '../ricisSolutionCatalog';

interface IndustrialResearchModule {
  buildIndustrialResearchContext(input: { readonly catalog: typeof INITIAL_SOLUTION_CATALOG; readonly planOverride?: unknown }): unknown;
}

const CONTRACT_PATH = './industrialResearchContext.domain';
const future = () => import(/* @vite-ignore */ CONTRACT_PATH) as Promise<IndustrialResearchModule>;
const RELATIONS = [
  ['hierarchy-gravity-to-navier', 'calculator-gravitational', 'calculator-navier_stokes'],
  ['hierarchy-navier-to-yang', 'calculator-navier_stokes', 'calculator-yang_mills'],
  ['hierarchy-yang-to-chladni', 'calculator-yang_mills', 'calculator-chladni'],
  ['hierarchy-chladni-to-kinematic', 'calculator-chladni', 'calculator-kinematic'],
] as const;

function hierarchy(value: unknown): readonly Record<string, unknown>[] {
  expect(value).toMatchObject({ kind: 'PROJECTED' });
  return (value as { readonly context: { readonly hierarchy: readonly Record<string, unknown>[] } }).context.hierarchy;
}

describe('INDUSTRIAL-RICIS-01 — exact published hierarchy context', () => {
  it('IND01-QA-15: projects exactly the four approved source relation IDs in G2 order', async () => {
    const module = await future();
    expect(hierarchy(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG })).map((item) => item.sourceRelationId)).toEqual(RELATIONS.map(([id]) => id));
  });

  it('IND01-QA-16: preserves the published from/to monolith direction for every hierarchy reference', async () => {
    const module = await future();
    const entries = hierarchy(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG }));
    expect(entries.map((item) => [item.fromMonolithId, item.toMonolithId])).toEqual(RELATIONS.map(([, from, to]) => [from, to]));
  });

  it('IND01-QA-17: preserves SOLVED_HIERARCHY kind and source rationale hash', async () => {
    const module = await future();
    const entries = hierarchy(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG }));
    for (const entry of entries) {
      const catalogRelation = INITIAL_SOLUTION_CATALOG.relations.find((item) => item.id === entry.sourceRelationId)!;
      expect(entry).toMatchObject({ kind: 'SOLVED_HIERARCHY', rationaleHash: catalogRelation.rationaleHash });
    }
  });

  it('IND01-QA-18: treats Navier–Stokes only as a hierarchy endpoint, never an emitted node payload', async () => {
    const module = await future();
    const result = module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG }) as { readonly context: Record<string, unknown> };
    const records = result.context.records as readonly Record<string, unknown>[];
    expect(records.map((item) => item.monolithId)).not.toContain('calculator-navier_stokes');
    expect(result.context).not.toHaveProperty('nodes');
    expect(result.context).not.toHaveProperty('registry117');
  });

  it('IND01-QA-19: rejects a missing approved hierarchy relation', async () => {
    const module = await future();
    const relations = INITIAL_SOLUTION_CATALOG.relations.filter((item) => item.id !== 'hierarchy-yang-to-chladni');
    expect(module.buildIndustrialResearchContext({ catalog: { ...INITIAL_SOLUTION_CATALOG, relations } })).toMatchObject({ kind: 'REJECTED', reason: 'REJECTED_RELATION_IDENTITY' });
  });

  it('IND01-QA-20: rejects a reverse hierarchy direction', async () => {
    const module = await future();
    const relations = INITIAL_SOLUTION_CATALOG.relations.map((item) => item.id === 'hierarchy-chladni-to-kinematic'
      ? { ...item, fromMonolithId: item.toMonolithId!, toMonolithId: item.fromMonolithId }
      : item);
    expect(module.buildIndustrialResearchContext({ catalog: { ...INITIAL_SOLUTION_CATALOG, relations } })).toMatchObject({ kind: 'REJECTED', reason: 'REJECTED_RELATION_IDENTITY' });
  });

  it('IND01-QA-21: rejects a relation with a non-hierarchy kind', async () => {
    const module = await future();
    const relations = INITIAL_SOLUTION_CATALOG.relations.map((item) => item.id === 'hierarchy-gravity-to-navier'
      ? { ...item, kind: 'UNRELATED' as never }
      : item);
    expect(module.buildIndustrialResearchContext({ catalog: { ...INITIAL_SOLUTION_CATALOG, relations } })).toMatchObject({ kind: 'REJECTED', reason: 'REJECTED_RELATION_IDENTITY' });
  });

  it('IND01-QA-22: rejects a malformed hierarchy rationale hash', async () => {
    const module = await future();
    const relations = INITIAL_SOLUTION_CATALOG.relations.map((item) => item.id === 'hierarchy-navier-to-yang'
      ? { ...item, rationaleHash: 'bad' }
      : item);
    expect(module.buildIndustrialResearchContext({ catalog: { ...INITIAL_SOLUTION_CATALOG, relations } })).toMatchObject({ kind: 'REJECTED', reason: 'REJECTED_RELATION_IDENTITY' });
  });

  it('IND01-QA-23: rejects a duplicate endpoint pair instead of multiplying hierarchy meaning', async () => {
    const module = await future();
    const duplicate = INITIAL_SOLUTION_CATALOG.relations.find((item) => item.id === 'hierarchy-yang-to-chladni')!;
    const relations = [...INITIAL_SOLUTION_CATALOG.relations, { ...duplicate, id: 'unapproved-duplicate' }];
    expect(module.buildIndustrialResearchContext({ catalog: { ...INITIAL_SOLUTION_CATALOG, relations } })).toMatchObject({ kind: 'REJECTED', reason: 'REJECTED_RELATION_IDENTITY' });
  });

  it('IND01-QA-24: rejects a planned relation that points to registry-120', async () => {
    const module = await future();
    expect(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG, planOverride: { relationEndpoint: 'registry-120' } })).toMatchObject({ kind: 'REJECTED', reason: 'REJECTED_UNAPPROVED_EXISTING_NODE' });
  });

  it('IND01-QA-25: rejects an unapproved hierarchy relation ID', async () => {
    const module = await future();
    expect(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG, planOverride: { relationId: 'hierarchy-complex-to-riemann' } })).toMatchObject({ kind: 'REJECTED', reason: 'REJECTED_RELATION_IDENTITY' });
  });

  it('IND01-QA-26: rejects a test-only relation reversal request', async () => {
    const module = await future();
    expect(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG, planOverride: { reverse: true } })).toMatchObject({ kind: 'REJECTED', reason: 'REJECTED_RELATION_IDENTITY' });
  });

  it('IND01-QA-27: freezes hierarchy references and never exposes mutable graph edge fields', async () => {
    const module = await future();
    const entries = hierarchy(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG }));
    expect(Object.isFrozen(entries)).toBe(true);
    expect(Object.isFrozen(entries[0]!)).toBe(true);
    for (const entry of entries) {
      expect(entry).not.toHaveProperty('strength');
      expect(entry).not.toHaveProperty('stateColor');
      expect(entry).not.toHaveProperty('economicInfluence');
    }
  });
});
