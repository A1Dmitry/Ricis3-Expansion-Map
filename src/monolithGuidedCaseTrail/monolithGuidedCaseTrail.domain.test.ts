import { describe, expect, it } from 'vitest';
import { INITIAL_SOLUTION_RELATIONS } from '../ricisSolutionCatalog';
import { buildCalculatorExplorerProjection, type CalculatorExplorerProjection } from '../calculatorExplorer/calculatorExplorer.domain';

type GuidedCaseRelation = Readonly<{
  readonly relationId: string;
  readonly kind: 'SOLVED_HIERARCHY';
  readonly sourceRationale: string;
  readonly from: Readonly<{ readonly entry: Readonly<{ readonly monolith: Readonly<{ readonly id: string }> }> }>;
  readonly to: Readonly<{ readonly entry: Readonly<{ readonly monolith: Readonly<{ readonly id: string }> }> }>;
}>;

type GuidedCaseEntry = Readonly<{
  readonly entry: Readonly<{
    readonly monolith: Readonly<{
      readonly id: string;
      readonly familyId: string;
      readonly sourceEvidence: Readonly<{ readonly source: object; readonly semanticIndexExpression: string }>;
      readonly example: object;
      readonly visualization: object;
    }>;
    readonly nodeId: string;
    readonly semanticIndexExpression: string;
  }>;
  readonly familyId: string;
  readonly isInitialAnchor: boolean;
  readonly outgoing: readonly GuidedCaseRelation[];
}>;

type Trail =
  | Readonly<{ readonly kind: 'PROJECTED'; readonly entries: readonly GuidedCaseEntry[] }>
  | Readonly<{ readonly kind: 'REJECTED'; readonly reason: string }>;

interface GuidedCaseModule {
  buildMonolithGuidedCaseTrail(input: { readonly explorer: CalculatorExplorerProjection }): Trail;
}

const CONTRACT_PATH = './monolithGuidedCaseTrail.domain';
const future = () => import(/* @vite-ignore */ CONTRACT_PATH) as Promise<GuidedCaseModule>;

function explorer(): CalculatorExplorerProjection {
  const result = buildCalculatorExplorerProjection();
  expect(result.kind).toBe('PROJECTED');
  return result;
}

function projected(module: GuidedCaseModule): Extract<Trail, { readonly kind: 'PROJECTED' }> {
  const result = module.buildMonolithGuidedCaseTrail({ explorer: explorer() });
  expect(result.kind).toBe('PROJECTED');
  return result as Extract<Trail, { readonly kind: 'PROJECTED' }>;
}

describe('EDU-VIS-01 — source-bound Monolith Guided Case trail', () => {
  it('EV01-QA-01: projects exactly the closed fourteen-case explorer inventory', async () => {
    const trail = projected(await future());
    expect(trail.entries).toHaveLength(14);
  });

  it('EV01-QA-02: preserves immutable explorer entry object identity for every case', async () => {
    const module = await future();
    const source = explorer();
    const trail = module.buildMonolithGuidedCaseTrail({ explorer: source });
    expect(trail.kind).toBe('PROJECTED');
    if (trail.kind === 'PROJECTED' && source.kind === 'PROJECTED') {
      expect(trail.entries.map(item => item.entry)).toEqual(source.entries);
      expect(trail.entries[0]?.entry).toBe(source.entries[0]);
    }
  });

  it('EV01-QA-03: preserves every closed node ID without a learning alias', async () => {
    const trail = projected(await future());
    expect(new Set(trail.entries.map(item => item.entry.nodeId)).size).toBe(14);
    expect(trail.entries.some(item => item.entry.nodeId === 'registry-120')).toBe(false);
  });

  it('EV01-QA-04: retains family identity from the immutable monolith definition', async () => {
    const trail = projected(await future());
    for (const item of trail.entries) expect(item.familyId).toBe(item.entry.monolith.familyId);
  });

  it('EV01-QA-05: retains the exact semantic index object field without reinterpretation', async () => {
    const trail = projected(await future());
    for (const item of trail.entries) expect(item.entry.semanticIndexExpression).toBe(item.entry.monolith.sourceEvidence.semanticIndexExpression);
  });

  it('EV01-QA-06: retains every immutable source reference by identity', async () => {
    const trail = projected(await future());
    for (const item of trail.entries) expect(item.entry.monolith.sourceEvidence.source).toBe(item.entry.monolith.sourceEvidence.source);
  });

  it('EV01-QA-07: retains the existing source-bound example object by identity', async () => {
    const trail = projected(await future());
    for (const item of trail.entries) expect(item.entry.monolith.example).toBe(item.entry.monolith.example);
  });

  it('EV01-QA-08: retains existing visualization metadata by identity without rendering it', async () => {
    const trail = projected(await future());
    for (const item of trail.entries) expect(item.entry.monolith.visualization).toBe(item.entry.monolith.visualization);
  });

  it('EV01-QA-09: marks only exact calculator-mandelbrot as the initial learning anchor', async () => {
    const trail = projected(await future());
    const anchors = trail.entries.filter(item => item.isInitialAnchor);
    expect(anchors).toHaveLength(1);
    expect(anchors[0]?.entry.monolith.id).toBe('calculator-mandelbrot');
  });

  it('EV01-QA-10: does not elevate the Mandelbrot anchor into a workflow or proof state', async () => {
    const trail = projected(await future());
    const mandelbrot = trail.entries.find(item => item.entry.monolith.id === 'calculator-mandelbrot');
    expect(Object.keys(mandelbrot ?? {})).toEqual(['entry', 'familyId', 'isInitialAnchor', 'outgoing']);
  });

  it('EV01-QA-11: projects only existing directed SOLVED_HIERARCHY relations', async () => {
    const trail = projected(await future());
    const sourceIds = new Set(trail.entries.map(item => item.entry.monolith.id));
    const projectedRelations = trail.entries.flatMap(item => item.outgoing);
    expect(projectedRelations.every(relation => relation.kind === 'SOLVED_HIERARCHY')).toBe(true);
    expect(projectedRelations.every(relation => sourceIds.has(relation.from.entry.monolith.id) && sourceIds.has(relation.to.entry.monolith.id))).toBe(true);
  });

  it('EV01-QA-12: preserves reviewed relation IDs and rationale without creating task-grounding lessons', async () => {
    const trail = projected(await future());
    const sourceRelationIds = new Set(INITIAL_SOLUTION_RELATIONS.filter(item => item.kind === 'SOLVED_HIERARCHY').map(item => item.id));
    const relations = trail.entries.flatMap(item => item.outgoing);
    expect(relations.every(item => sourceRelationIds.has(item.relationId))).toBe(true);
    expect(relations.some(item => item.relationId.includes('ground'))).toBe(false);
  });

  it('EV01-QA-13: rejects a rejected explorer rather than fabricating a trail', async () => {
    const module = await future();
    const result = module.buildMonolithGuidedCaseTrail({ explorer: { kind: 'REJECTED', reason: 'REJECTED_CLOSED_INVENTORY' } });
    expect(result.kind).toBe('REJECTED');
  });

  it('EV01-QA-14: rejects a shortened explorer inventory', async () => {
    const module = await future();
    const source = explorer();
    if (source.kind === 'PROJECTED') {
      const result = module.buildMonolithGuidedCaseTrail({ explorer: { kind: 'PROJECTED', entries: source.entries.slice(0, 13) } });
      expect(result.kind).toBe('REJECTED');
    }
  });

  it('EV01-QA-15: rejects duplicate node identity in an otherwise closed explorer', async () => {
    const module = await future();
    const source = explorer();
    if (source.kind === 'PROJECTED') {
      const entries = [...source.entries];
      entries[1] = { ...entries[1]!, nodeId: entries[0]!.nodeId };
      expect(module.buildMonolithGuidedCaseTrail({ explorer: { kind: 'PROJECTED', entries } }).kind).toBe('REJECTED');
    }
  });

  it('EV01-QA-16: rejects title-like or fuzzy monolith substitution', async () => {
    const module = await future();
    const source = explorer();
    if (source.kind === 'PROJECTED') {
      const entries = [...source.entries];
      entries[0] = { ...entries[0]!, monolith: { ...entries[0]!.monolith, id: 'Mandelbrot Fractal Monolith' } };
      expect(module.buildMonolithGuidedCaseTrail({ explorer: { kind: 'PROJECTED', entries } }).kind).toBe('REJECTED');
    }
  });

  it('EV01-QA-17: rejects registry-120 even if injected as a case node', async () => {
    const module = await future();
    const source = explorer();
    if (source.kind === 'PROJECTED') {
      const entries = [...source.entries];
      entries[0] = { ...entries[0]!, nodeId: 'registry-120' };
      expect(module.buildMonolithGuidedCaseTrail({ explorer: { kind: 'PROJECTED', entries } }).kind).toBe('REJECTED');
    }
  });

  it('EV01-QA-18: exposes no calculator run, renderer, proof or authority capability as a new trail field', async () => {
    const trail = projected(await future());
    expect(Object.keys(trail)).toEqual(['kind', 'entries']);
    for (const item of trail.entries) expect(Object.keys(item)).toEqual(['entry', 'familyId', 'isInitialAnchor', 'outgoing']);
  });
});
