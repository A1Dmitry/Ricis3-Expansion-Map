import { describe, expect, it } from 'vitest';
import { INITIAL_SOLUTION_CATALOG } from '../ricisSolutionCatalog';

interface GraphDescriptorModule {
  buildCalculatorGraphProjection(input: { readonly catalog: typeof INITIAL_SOLUTION_CATALOG }): unknown;
}

const EXPECTED_MONOLITH_IDS = [
  'calculator-complex_analysis',
  'calculator-riemann',
  'calculator-bsd',
  'calculator-hodge',
  'calculator-poincare',
  'calculator-mandelbrot',
  'calculator-gravitational',
  'calculator-yang_mills',
  'calculator-chladni',
  'calculator-kinematic',
] as const;

const EXPECTED_NODE_IDS = [
  'calculator-node-complex-analysis',
  'calculator-node-riemann',
  'calculator-node-bsd',
  'calculator-node-hodge',
  'calculator-node-poincare',
  'calculator-node-mandelbrot',
  'calculator-node-gravitational',
  'calculator-node-yang-mills',
  'calculator-node-chladni',
  'calculator-node-kinematic',
] as const;

async function future(): Promise<GraphDescriptorModule> {
  const modulePath = './calculatorGraphDescriptor.domain';
  return import(/* @vite-ignore */ modulePath) as Promise<GraphDescriptorModule>;
}

function project(module: GraphDescriptorModule): Record<string, unknown> {
  return module.buildCalculatorGraphProjection({ catalog: INITIAL_SOLUTION_CATALOG }) as Record<string, unknown>;
}

function descriptors(result: Record<string, unknown>): readonly Record<string, unknown>[] {
  expect(result).toMatchObject({ kind: 'PROJECTED' });
  expect(Array.isArray(result.descriptors)).toBe(true);
  return result.descriptors as readonly Record<string, unknown>[];
}

describe('CALC-EXP-01 G4B — closed calculator graph descriptor domain', () => {
  it('CEG4B-QA-01: projects exactly the approved ten calculator monolith IDs', async () => {
    const result = project(await future());
    expect(descriptors(result).map(item => item.monolithId)).toEqual(EXPECTED_MONOLITH_IDS);
  });

  it('CEG4B-QA-02: projects exactly the approved ten stable physical node IDs', async () => {
    const result = project(await future());
    expect(descriptors(result).map(item => item.nodeId)).toEqual(EXPECTED_NODE_IDS);
  });

  it('CEG4B-QA-03: projects complex analysis with its exact source-bound semantic expression', async () => {
    const result = project(await future());
    expect(descriptors(result).find(item => item.monolithId === 'calculator-complex_analysis')).toMatchObject({ semanticIndexExpression: 'exp(1/z)' });
  });

  it('CEG4B-QA-04: projects Riemann with its exact source-bound semantic expression', async () => {
    const result = project(await future());
    expect(descriptors(result).find(item => item.monolithId === 'calculator-riemann')).toMatchObject({ semanticIndexExpression: 'zeta(s)' });
  });

  it('CEG4B-QA-05: projects BSD with its exact source-bound semantic expression', async () => {
    const result = project(await future());
    expect(descriptors(result).find(item => item.monolithId === 'calculator-bsd')).toMatchObject({ semanticIndexExpression: 'L(E, s)' });
  });

  it('CEG4B-QA-06: preserves the catalog source commit for every descriptor', async () => {
    const result = project(await future());
    for (const descriptor of descriptors(result)) {
      expect(descriptor).toMatchObject({ source: { commit: INITIAL_SOLUTION_CATALOG.sourceRepositoryCommit } });
    }
  });

  it('CEG4B-QA-07: preserves exact non-empty source content hashes without recomputation', async () => {
    const result = project(await future());
    for (const descriptor of descriptors(result)) {
      expect(descriptor).toMatchObject({ source: { contentHash: expect.stringMatching(/^[a-f0-9]{64}$/) } });
    }
  });

  it('CEG4B-QA-08: exposes only named RICIS source-green basis and partial workflow state', async () => {
    const result = project(await future());
    for (const descriptor of descriptors(result)) {
      expect(descriptor).toMatchObject({ greenBasis: 'RICIS_SOURCE_SOLVED', workflowState: 'partial' });
    }
  });

  it('CEG4B-QA-09: maps analytic descriptors only to the declared math zone', async () => {
    const result = project(await future());
    for (const id of EXPECTED_MONOLITH_IDS.slice(0, 6)) {
      expect(descriptors(result).find(item => item.monolithId === id)).toMatchObject({ zoneId: 'math' });
    }
  });

  it('CEG4B-QA-10: maps physical field descriptors only to the declared physics zone', async () => {
    const result = project(await future());
    for (const id of ['calculator-gravitational', 'calculator-yang_mills', 'calculator-chladni'] as const) {
      expect(descriptors(result).find(item => item.monolithId === id)).toMatchObject({ zoneId: 'physics' });
    }
  });

  it('CEG4B-QA-11: maps the kinematic monolith only to its declared informatics zone', async () => {
    const result = project(await future());
    expect(descriptors(result).find(item => item.monolithId === 'calculator-kinematic')).toMatchObject({ zoneId: 'informatics' });
  });

  it('CEG4B-QA-12: retains an immutable three-coordinate navigation position for every descriptor', async () => {
    const result = project(await future());
    for (const descriptor of descriptors(result)) {
      expect(descriptor.position).toHaveLength(3);
      expect(Object.isFrozen(descriptor.position as object)).toBe(true);
    }
  });

  it('CEG4B-QA-13: freezes the descriptor list and individual descriptor records', async () => {
    const result = project(await future());
    expect(Object.isFrozen(result.descriptors as object)).toBe(true);
    expect(descriptors(result).every(Object.isFrozen)).toBe(true);
  });

  it('CEG4B-QA-14: carries no proof, external Lean, Core, agent, axiom or trust authority field', async () => {
    const result = project(await future());
    for (const descriptor of descriptors(result)) {
      expect(JSON.stringify(descriptor)).not.toMatch(/externalLean|proof|toolchain|compilerOutput|axiom|trust|coreResult|agentResult/i);
    }
  });

  it('CEG4B-QA-15: is deterministic for the same immutable published catalog input', async () => {
    const module = await future();
    expect(project(module)).toEqual(project(module));
  });
});
