import { describe, expect, it } from 'vitest';
import { INITIAL_SOLUTION_CATALOG } from '../ricisSolutionCatalog';

interface GraphDescriptorModule {
  buildCalculatorGraphProjection(input: { readonly catalog: typeof INITIAL_SOLUTION_CATALOG }): unknown;
}

async function future(): Promise<GraphDescriptorModule> {
  const modulePath = './calculatorGraphDescriptor.domain';
  return import(/* @vite-ignore */ modulePath) as Promise<GraphDescriptorModule>;
}

function result(module: GraphDescriptorModule): Record<string, unknown> {
  return module.buildCalculatorGraphProjection({ catalog: INITIAL_SOLUTION_CATALOG }) as Record<string, unknown>;
}

function relations(value: Record<string, unknown>): readonly Record<string, unknown>[] {
  expect(value).toMatchObject({ kind: 'PROJECTED' });
  expect(Array.isArray(value.relations)).toBe(true);
  return value.relations as readonly Record<string, unknown>[];
}

function relation(value: Record<string, unknown>, sourceRelationId: string): Record<string, unknown> | undefined {
  return relations(value).find(item => item.sourceRelationId === sourceRelationId);
}

describe('CALC-EXP-01 G4B — explicit calculator graph relation projection', () => {
  it('CEG4B-QA-16: maps CDCC to the physical complex-analysis descriptor through exact catalog relation identity', async () => {
    expect(relation(result(await future()), 'hierarchy-cdcc-to-complex')).toMatchObject({ fromNodeId: 'registry-115', toNodeId: 'calculator-node-complex-analysis', kind: 'SOLVED_HIERARCHY' });
  });

  it('CEG4B-QA-17: maps complex analysis to Riemann in catalog direction only', async () => {
    expect(relation(result(await future()), 'hierarchy-complex-to-riemann')).toMatchObject({ fromNodeId: 'calculator-node-complex-analysis', toNodeId: 'calculator-node-riemann' });
  });

  it('CEG4B-QA-18: maps complex analysis to Mandelbrot in catalog direction only', async () => {
    expect(relation(result(await future()), 'hierarchy-complex-to-mandelbrot')).toMatchObject({ fromNodeId: 'calculator-node-complex-analysis', toNodeId: 'calculator-node-mandelbrot' });
  });

  it('CEG4B-QA-19: maps Riemann to BSD in catalog direction only', async () => {
    expect(relation(result(await future()), 'hierarchy-riemann-to-bsd')).toMatchObject({ fromNodeId: 'calculator-node-riemann', toNodeId: 'calculator-node-bsd' });
  });

  it('CEG4B-QA-20: maps Riemann to Hodge in catalog direction only', async () => {
    expect(relation(result(await future()), 'hierarchy-riemann-to-hodge')).toMatchObject({ fromNodeId: 'calculator-node-riemann', toNodeId: 'calculator-node-hodge' });
  });

  it('CEG4B-QA-21: maps Hodge to Poincare in catalog direction only', async () => {
    expect(relation(result(await future()), 'hierarchy-hodge-to-poincare')).toMatchObject({ fromNodeId: 'calculator-node-hodge', toNodeId: 'calculator-node-poincare' });
  });

  it('CEG4B-QA-22: maps gravitational to the exact existing Navier–Stokes node', async () => {
    expect(relation(result(await future()), 'hierarchy-gravity-to-navier')).toMatchObject({ fromNodeId: 'calculator-node-gravitational', toNodeId: 'registry-117' });
  });

  it('CEG4B-QA-23: maps existing Navier–Stokes to Yang–Mills without recreating Navier', async () => {
    expect(relation(result(await future()), 'hierarchy-navier-to-yang')).toMatchObject({ fromNodeId: 'registry-117', toNodeId: 'calculator-node-yang-mills' });
  });

  it('CEG4B-QA-24: maps Yang–Mills to Chladni in catalog direction only', async () => {
    expect(relation(result(await future()), 'hierarchy-yang-to-chladni')).toMatchObject({ fromNodeId: 'calculator-node-yang-mills', toNodeId: 'calculator-node-chladni' });
  });

  it('CEG4B-QA-25: maps Chladni to kinematic without a Jacobian-Conjecture edge', async () => {
    const value = result(await future());
    expect(relation(value, 'hierarchy-chladni-to-kinematic')).toMatchObject({ fromNodeId: 'calculator-node-chladni', toNodeId: 'calculator-node-kinematic' });
    expect(JSON.stringify(relations(value))).not.toContain('registry-120');
  });

  it('CEG4B-QA-26: carries only exact catalog source relation IDs and rationale hashes', async () => {
    const value = result(await future());
    const sourceIds = new Set(INITIAL_SOLUTION_CATALOG.relations.map(item => item.id));
    for (const item of relations(value)) {
      expect(sourceIds.has(String(item.sourceRelationId))).toBe(true);
      expect(item).toMatchObject({ catalogDerived: true, rationaleHash: expect.stringMatching(/^[a-f0-9]{64}$/) });
    }
  });

  it('CEG4B-QA-27: emits no title, keyword, formula or zone-derived relation rationale', async () => {
    const value = result(await future());
    expect(JSON.stringify(relations(value))).not.toMatch(/keyword\s+match|fuzzy|title\s+match|formula\s+match|zone\s+match/i);
  });

  it('CEG4B-QA-28: does not reverse any catalog relationship direction', async () => {
    const value = result(await future());
    expect(relations(value).some(item => item.fromNodeId === 'calculator-node-riemann' && item.toNodeId === 'calculator-node-complex-analysis')).toBe(false);
  });

  it('CEG4B-QA-29: has neither duplicate source relation identity nor duplicate physical edge', async () => {
    const value = result(await future());
    const ids = relations(value).map(item => String(item.sourceRelationId));
    const edges = relations(value).map(item => `${String(item.fromNodeId)}->${String(item.toNodeId)}`);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(edges).size).toBe(edges.length);
  });

  it('CEG4B-QA-30: freezes relation projections and does not expose dependent-node state/trust mutation', async () => {
    const value = result(await future());
    expect(Object.isFrozen(value.relations as object)).toBe(true);
    expect(relations(value).every(Object.isFrozen)).toBe(true);
    expect(JSON.stringify(relations(value))).not.toMatch(/state|trust|proof|externalLean|leanVerified|resolved/i);
  });
});
