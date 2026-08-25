import { describe, expect, it } from 'vitest';
import { INITIAL_SOLUTION_CATALOG } from '../ricisSolutionCatalog';
import { CALCULATOR_GRAPH_STATIC_SEED } from '../calculatorGraphDescriptor/calculatorGraphDescriptor.seed';

type LaunchKind = 'READY' | 'UNCONFIGURED' | 'REJECTED';

type ExplorerEntry = Readonly<{
  readonly monolith: (typeof INITIAL_SOLUTION_CATALOG.monoliths)[number];
  readonly nodeId: string;
  readonly semanticIndexExpression: string;
  readonly launch: Readonly<{ readonly kind: LaunchKind; readonly href?: string; readonly reason?: string }>;
  readonly researchOnlyDisclosure: string;
}>;

type ExplorerProjection = Readonly<{
  readonly kind: 'PROJECTED';
  readonly entries: readonly ExplorerEntry[];
}>;

interface CalculatorExplorerModule {
  buildCalculatorExplorerProjection(input?: { readonly baseUrl?: string }): ExplorerProjection;
  getCalculatorExplorerEntryForNodeId(input: { readonly nodeId: string; readonly baseUrl?: string }): ExplorerEntry | undefined;
}

const CONTRACT_PATH = './calculatorExplorer.domain';
const future = () => import(/* @vite-ignore */ CONTRACT_PATH) as Promise<CalculatorExplorerModule>;
const expectedModes = [
  'CDCC', 'P_VS_NP', 'COMPLEX_ANALYSIS', 'RIEMANN', 'BSD', 'HODGE', 'POINCARE',
  'MANDELBROT', 'GRAVITATIONAL', 'NAVIER_STOKES', 'YANG_MILLS', 'CHLADNI', 'KINEMATIC', 'LLM_GRADIENT',
] as const;

function projection(module: CalculatorExplorerModule, baseUrl?: string): ExplorerProjection {
  return module.buildCalculatorExplorerProjection(baseUrl === undefined ? undefined : { baseUrl });
}

function entryByMode(result: ExplorerProjection, mode: string): ExplorerEntry {
  const entry = result.entries.find(item => item.monolith.calculator.mode === mode);
  expect(entry, `Expected calculator mode ${mode}`).toBeDefined();
  return entry!;
}

describe('CALC-EXP-02 — closed source-bound calculator explorer domain', () => {
  it('CE02-QA-01: projects exactly the fourteen published calculator modes in immutable catalogue order', async () => {
    const result = projection(await future());
    expect(result.kind).toBe('PROJECTED');
    expect(result.entries.map(item => item.monolith.calculator.mode)).toEqual(expectedModes);
  });

  it('CE02-QA-02: retains every catalogue monolith object by exact reference', async () => {
    const result = projection(await future());
    for (const monolith of INITIAL_SOLUTION_CATALOG.monoliths) {
      expect(entryByMode(result, monolith.calculator.mode).monolith).toBe(monolith);
    }
  });

  it('CE02-QA-03: keeps source commit, source path, source hash and preset hash unchanged', async () => {
    const result = projection(await future());
    for (const entry of result.entries) {
      const source = entry.monolith.sourceEvidence.source;
      expect(source.commit).toBe(INITIAL_SOLUTION_CATALOG.sourceRepositoryCommit);
      expect(source.contentHash).toMatch(/^[a-f0-9]{64}$/);
      expect(entry.monolith.calculator.presetHash).toMatch(/^[a-f0-9]{64}$/);
      expect(entry.semanticIndexExpression).toBe(entry.monolith.sourceEvidence.semanticIndexExpression);
    }
  });

  it('CE02-QA-04: maps the four historical catalogue bindings only to their explicit existing node IDs', async () => {
    const result = projection(await future());
    expect(entryByMode(result, 'P_VS_NP').nodeId).toBe('informatics-complexity');
    expect(entryByMode(result, 'CDCC').nodeId).toBe('registry-115');
    expect(entryByMode(result, 'NAVIER_STOKES').nodeId).toBe('registry-117');
    expect(entryByMode(result, 'LLM_GRADIENT').nodeId).toBe('registry-118');
  });

  it('CE02-QA-05: maps every unbound calculator case only to its frozen graph descriptor node', async () => {
    const result = projection(await future());
    const staticNodeIds = new Set(CALCULATOR_GRAPH_STATIC_SEED.nodes.map(node => node.id));
    for (const entry of result.entries.filter(item => !['P_VS_NP', 'CDCC', 'NAVIER_STOKES', 'LLM_GRADIENT'].includes(item.monolith.calculator.mode))) {
      expect(staticNodeIds.has(entry.nodeId)).toBe(true);
    }
  });

  it('CE02-QA-06: maps KINEMATIC exactly to calculator-node-kinematic with the J(q) semantic index', async () => {
    const entry = entryByMode(projection(await future()), 'KINEMATIC');
    expect(entry.nodeId).toBe('calculator-node-kinematic');
    expect(entry.semanticIndexExpression).toBe('J(q)');
  });

  it('CE02-QA-07: never aliases a calculator explorer entry to registry-120', async () => {
    const result = projection(await future());
    expect(result.entries.map(item => item.nodeId)).not.toContain('registry-120');
  });

  it('CE02-QA-08: rejects unknown node lookup without title, keyword or Jacobian fallback', async () => {
    const module = await future();
    for (const nodeId of ['registry-120', 'jacobian conjecture', 'KINEMATIC', 'calculator-node-unknown', 'J(q)']) {
      expect(module.getCalculatorExplorerEntryForNodeId({ nodeId })).toBeUndefined();
    }
  });

  it('CE02-QA-09: has one unique node ID and one unique calculator mode per entry', async () => {
    const result = projection(await future());
    expect(new Set(result.entries.map(item => item.nodeId)).size).toBe(14);
    expect(new Set(result.entries.map(item => item.monolith.calculator.mode)).size).toBe(14);
  });

  it('CE02-QA-10: preserves the owner-authorized P=NP monolith identity without reclassification', async () => {
    const entry = entryByMode(projection(await future()), 'P_VS_NP');
    expect(entry.monolith.id).toBe('calculator-p_vs_np');
    expect(entry.monolith.sourceEvidence.kind).toBe('RICIS_SOURCE_SOLVED');
    expect(entry.monolith.sourceEvidence.semanticIndexExpression).toBe('MersenneRingReduction(P, NP)');
  });

  it('CE02-QA-11: returns the existing builder UNCONFIGURED outcome when no calculator endpoint is configured', async () => {
    const result = projection(await future());
    for (const entry of result.entries) {
      expect(entry.launch).toEqual({ kind: 'UNCONFIGURED', reason: 'calculator_base_url_missing' });
    }
  });

  it('CE02-QA-12: delegates invalid non-HTTPS launch input to the unchanged rejected result', async () => {
    const result = projection(await future(), 'http://calculator.example.test');
    for (const entry of result.entries) expect(entry.launch).toEqual({ kind: 'REJECTED', reason: 'invalid_base_url' });
  });

  it('CE02-QA-13: exposes a READY launch only through the existing allowlisted static builder', async () => {
    const result = projection(await future(), 'https://calculator.example.test/');
    for (const entry of result.entries) {
      expect(entry.launch.kind).toBe('READY');
      expect(entry.launch.href).toContain(`mode=${entry.monolith.calculator.mode}`);
      expect(entry.launch.href).toContain('state=%7B%7D');
    }
  });

  it('CE02-QA-14: retains a fixed source-bound research-only disclosure for KINEMATIC', async () => {
    const entry = entryByMode(projection(await future()), 'KINEMATIC');
    expect(entry.researchOnlyDisclosure).toMatch(/не .*расч[её]т|no .*calculation/i);
    expect(entry.researchOnlyDisclosure).toMatch(/не .*управлен|no .*control/i);
    expect(entry.researchOnlyDisclosure).toMatch(/не .*безопас|no .*safety/i);
  });

  it('CE02-QA-15: returns the exact frozen explorer entry by node ID', async () => {
    const module = await future();
    const result = projection(module);
    const kinematic = entryByMode(result, 'KINEMATIC');
    expect(module.getCalculatorExplorerEntryForNodeId({ nodeId: 'calculator-node-kinematic' })).toBe(kinematic);
  });

  it('CE02-QA-16: freezes outer projection and entries without freezing or cloning source objects', async () => {
    const result = projection(await future());
    const entry = entryByMode(result, 'KINEMATIC');
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.entries)).toBe(true);
    expect(Object.isFrozen(entry)).toBe(true);
    expect(entry.monolith).toBe(INITIAL_SOLUTION_CATALOG.monoliths.find(item => item.id === 'calculator-kinematic'));
  });
});
