import { describe, expect, it } from 'vitest';
import { INITIAL_SOLUTION_CATALOG } from '../ricisSolutionCatalog';

interface IndustrialResearchModule {
  buildIndustrialResearchContext(input: {
    readonly catalog: typeof INITIAL_SOLUTION_CATALOG;
    readonly planOverride?: unknown;
  }): unknown;
}

const CONTRACT_PATH = './industrialResearchContext.domain';
const future = () => import(/* @vite-ignore */ CONTRACT_PATH) as Promise<IndustrialResearchModule>;
const EXPECTED_IDS = [
  'calculator-gravitational',
  'calculator-yang_mills',
  'calculator-chladni',
  'calculator-kinematic',
] as const;

function context(value: unknown): Record<string, unknown> {
  expect(value).toMatchObject({ kind: 'PROJECTED' });
  return (value as { readonly context: Record<string, unknown> }).context;
}

function sourceFor(id: typeof EXPECTED_IDS[number]) {
  const monolith = INITIAL_SOLUTION_CATALOG.monoliths.find((item) => item.id === id);
  expect(monolith).toBeDefined();
  return monolith!;
}

describe('INDUSTRIAL-RICIS-01 — static source-bound industrial research context', () => {
  it('IND01-QA-01: projects exactly the four approved source monoliths in G2 order', async () => {
    const module = await future();
    const records = context(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG })).records as readonly Record<string, unknown>[];
    expect(records.map((item) => item.monolithId)).toEqual(EXPECTED_IDS);
  });

  it('IND01-QA-02: projects the exact approved graph node identity for every record', async () => {
    const module = await future();
    const records = context(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG })).records as readonly Record<string, unknown>[];
    expect(records.map((item) => item.nodeId)).toEqual([
      'calculator-node-gravitational',
      'calculator-node-yang-mills',
      'calculator-node-chladni',
      'calculator-node-kinematic',
    ]);
  });

  it('IND01-QA-03: preserves published bilingual title, category and family identity', async () => {
    const module = await future();
    const records = context(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG })).records as readonly Record<string, unknown>[];
    for (const record of records) {
      const monolith = sourceFor(record.monolithId as typeof EXPECTED_IDS[number]);
      expect(record).toMatchObject({ title: monolith.title, category: monolith.category, familyId: monolith.familyId });
    }
  });

  it('IND01-QA-04: preserves each source semantic-index expression without evaluation', async () => {
    const module = await future();
    const records = context(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG })).records as readonly Record<string, unknown>[];
    for (const record of records) {
      expect(record.semanticIndexExpression).toBe(sourceFor(record.monolithId as typeof EXPECTED_IDS[number]).sourceEvidence.semanticIndexExpression);
    }
  });

  it('IND01-QA-05: preserves exact immutable source references and derivation hashes', async () => {
    const module = await future();
    const records = context(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG })).records as readonly Record<string, unknown>[];
    for (const record of records) {
      const source = sourceFor(record.monolithId as typeof EXPECTED_IDS[number]).sourceEvidence;
      expect(record).toMatchObject({ source: source.source, derivationHistoryHash: source.derivationHistoryHash });
    }
  });

  it('IND01-QA-06: assigns only the declared physical-field, resonance and manipulator contexts', async () => {
    const module = await future();
    const records = context(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG })).records as readonly Record<string, unknown>[];
    expect(records.map((item) => item.researchContext)).toEqual([
      'PHYSICAL_FIELD_RESEARCH_CONTEXT',
      'PHYSICAL_FIELD_RESEARCH_CONTEXT',
      'RESONANCE_RESEARCH_CONTEXT',
      'MANIPULATOR_KINEMATIC_RESEARCH_CONTEXT',
    ]);
  });

  it('IND01-QA-07: retains RICIS_SOURCE_SOLVED only as source-presentation basis', async () => {
    const module = await future();
    const records = context(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG })).records as readonly Record<string, unknown>[];
    for (const record of records) {
      expect(record).toMatchObject({ greenBasis: 'RICIS_SOURCE_SOLVED', provenance: { kind: 'CALCULATOR_CATALOG_READ_ONLY', catalogDerived: true } });
      expect(record).not.toHaveProperty('workflowState');
      expect(record).not.toHaveProperty('resolved');
    }
  });

  it('IND01-QA-08: fixes the non-control and non-safety disclosure', async () => {
    const module = await future();
    expect(context(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG })).disclosure).toEqual({
      classification: 'NOT_AN_INDUSTRIAL_CONTROL_OR_SAFETY_DECISION',
      calculationPerformed: false,
      runtimeExecuted: false,
      controlCommandProduced: false,
      safetyAssessmentPerformed: false,
      certificationOrComplianceConclusion: false,
    });
  });

  it('IND01-QA-09: freezes the result root, context, disclosure, records and source copies', async () => {
    const module = await future();
    const result = module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG }) as { readonly context: Record<string, unknown> };
    const projected = result.context;
    const records = projected.records as readonly Record<string, unknown>[];
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(projected)).toBe(true);
    expect(Object.isFrozen(projected.disclosure as object)).toBe(true);
    expect(Object.isFrozen(records)).toBe(true);
    expect(Object.isFrozen(records[0]!)).toBe(true);
    expect(Object.isFrozen(records[0]!.source as object)).toBe(true);
  });

  it('IND01-QA-10: rejects a source repository commit mismatch', async () => {
    const module = await future();
    expect(module.buildIndustrialResearchContext({ catalog: { ...INITIAL_SOLUTION_CATALOG, sourceRepositoryCommit: 'wrong-commit' } })).toMatchObject({
      kind: 'REJECTED', reason: 'REJECTED_SOURCE_IDENTITY',
    });
  });

  it('IND01-QA-11: rejects a malformed source content hash', async () => {
    const module = await future();
    const monoliths = INITIAL_SOLUTION_CATALOG.monoliths.map((item) => item.id === 'calculator-kinematic'
      ? { ...item, sourceEvidence: { ...item.sourceEvidence, source: { ...item.sourceEvidence.source, contentHash: 'not-a-hash' } } }
      : item);
    expect(module.buildIndustrialResearchContext({ catalog: { ...INITIAL_SOLUTION_CATALOG, monoliths } })).toMatchObject({
      kind: 'REJECTED', reason: 'REJECTED_SOURCE_IDENTITY',
    });
  });

  it('IND01-QA-12: rejects a malformed derivation-history hash', async () => {
    const module = await future();
    const monoliths = INITIAL_SOLUTION_CATALOG.monoliths.map((item) => item.id === 'calculator-chladni'
      ? { ...item, sourceEvidence: { ...item.sourceEvidence, derivationHistoryHash: 'bad' } }
      : item);
    expect(module.buildIndustrialResearchContext({ catalog: { ...INITIAL_SOLUTION_CATALOG, monoliths } })).toMatchObject({
      kind: 'REJECTED', reason: 'REJECTED_SOURCE_IDENTITY',
    });
  });

  it('IND01-QA-13: rejects a blank source semantic index', async () => {
    const module = await future();
    const monoliths = INITIAL_SOLUTION_CATALOG.monoliths.map((item) => item.id === 'calculator-gravitational'
      ? { ...item, sourceEvidence: { ...item.sourceEvidence, semanticIndexExpression: '  ' } }
      : item);
    expect(module.buildIndustrialResearchContext({ catalog: { ...INITIAL_SOLUTION_CATALOG, monoliths } })).toMatchObject({
      kind: 'REJECTED', reason: 'REJECTED_SOURCE_IDENTITY',
    });
  });

  it('IND01-QA-14: never exposes node, proof, Lean, trust, state or operational payloads', async () => {
    const module = await future();
    const projected = context(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG }));
    for (const key of ['node', 'problemNode', 'proof', 'externalLean', 'axiom', 'trust', 'workflowState', 'command', 'safetyFinding', 'risk', 'simulation', 'prediction']) {
      expect(projected).not.toHaveProperty(key);
    }
  });
});
