import { describe, expect, it } from 'vitest';
import { INITIAL_SOLUTION_CATALOG } from '../ricisSolutionCatalog';

interface GraphDescriptorModule {
  buildCalculatorGraphProjection(input: { readonly catalog: typeof INITIAL_SOLUTION_CATALOG; readonly planOverride?: unknown }): unknown;
}

async function future(): Promise<GraphDescriptorModule> {
  const modulePath = './calculatorGraphDescriptor.domain';
  return import(/* @vite-ignore */ modulePath) as Promise<GraphDescriptorModule>;
}

function projected(module: GraphDescriptorModule, planOverride?: unknown): Record<string, unknown> {
  return module.buildCalculatorGraphProjection({ catalog: INITIAL_SOLUTION_CATALOG, planOverride }) as Record<string, unknown>;
}

function rejected(module: GraphDescriptorModule, planOverride: unknown): Record<string, unknown> {
  const result = projected(module, planOverride);
  expect(result.kind).toBe('REJECTED');
  return result;
}

function structuralKeys(value: unknown): readonly string[] {
  if (Array.isArray(value)) return value.flatMap(structuralKeys);
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => [key, ...structuralKeys(child)]);
}

describe('CALC-EXP-01 G4B — closed descriptor plan and authority boundary', () => {
  it('CEG4B-QA-31: rejects an eleventh descriptor plan item rather than extending inventory', async () => {
    const module = await future();
    expect(rejected(module, { append: { monolithId: 'calculator-extra' } })).toMatchObject({ reason: 'REJECTED_CLOSED_INVENTORY' });
  });

  it('CEG4B-QA-32: rejects P=NP because it is already bound to an existing map node', async () => {
    const module = await future();
    expect(rejected(module, { replaceFirst: { monolithId: 'calculator-p_vs_np' } })).toMatchObject({ reason: 'REJECTED_CLOSED_INVENTORY' });
  });

  it('CEG4B-QA-33: rejects CDCC because it is already bound to an existing map node', async () => {
    const module = await future();
    expect(rejected(module, { replaceFirst: { monolithId: 'calculator-cdcc' } })).toMatchObject({ reason: 'REJECTED_CLOSED_INVENTORY' });
  });

  it('CEG4B-QA-34: rejects Navier–Stokes because it is already bound to an existing map node', async () => {
    const module = await future();
    expect(rejected(module, { replaceFirst: { monolithId: 'calculator-navier_stokes' } })).toMatchObject({ reason: 'REJECTED_CLOSED_INVENTORY' });
  });

  it('CEG4B-QA-35: rejects LLM gradient because it is already bound to an existing map node', async () => {
    const module = await future();
    expect(rejected(module, { replaceFirst: { monolithId: 'calculator-llm_gradient' } })).toMatchObject({ reason: 'REJECTED_CLOSED_INVENTORY' });
  });

  it('CEG4B-QA-36: rejects a Jacobian-Conjecture registry-120 endpoint even where names overlap', async () => {
    const module = await future();
    expect(rejected(module, { relationEndpoint: 'registry-120' })).toMatchObject({ reason: 'REJECTED_UNAPPROVED_EXISTING_NODE' });
  });

  it('CEG4B-QA-37: rejects an unknown calculator monolith rather than fuzzy matching it', async () => {
    const module = await future();
    expect(rejected(module, { replaceFirst: { monolithId: 'calculator-jacobian' } })).toMatchObject({ reason: 'REJECTED_CLOSED_INVENTORY' });
  });

  it('CEG4B-QA-38: rejects source commit, content-hash or semantic-index identity mismatch', async () => {
    const module = await future();
    expect(rejected(module, { mutateSourceIdentity: true })).toMatchObject({ reason: 'REJECTED_SOURCE_IDENTITY' });
  });

  it('CEG4B-QA-39: rejects unknown zone, non-finite coordinate and duplicate node ID plan defects', async () => {
    const module = await future();
    expect(rejected(module, { invalidZone: 'space', coordinate: [0, Number.NaN, 2], duplicateNodeId: true })).toMatchObject({ reason: 'REJECTED_DESCRIPTOR_PLAN' });
  });

  it('CEG4B-QA-40: rejects an unknown, unplanned or reverse-direction source relation', async () => {
    const module = await future();
    expect(rejected(module, { relationId: 'fuzzy-riemann-to-complex', reverse: true })).toMatchObject({ reason: 'REJECTED_RELATION_IDENTITY' });
  });

  it('CEG4B-QA-41: never exposes proof, Lean, Core, agent, axiom, trust or resolved state in any rejection', async () => {
    const module = await future();
    const result = rejected(module, { relationEndpoint: 'registry-120' });
    expect(JSON.stringify(result)).not.toMatch(/proof|externalLean|lean|core|agent|axiom|trust|resolved/i);
  });

  it('CEG4B-QA-42: emits no limit, lHopital, NaN, numeric-evaluation or scalarised RICIS result vocabulary', async () => {
    const module = await future();
    const result = projected(module);
    expect(structuralKeys(result).map((key) => key.toLowerCase())).not.toEqual(
      expect.arrayContaining(['limit', 'lhopital', 'numericvalue', 'scalarized', 'nan']),
    );
  });
});
