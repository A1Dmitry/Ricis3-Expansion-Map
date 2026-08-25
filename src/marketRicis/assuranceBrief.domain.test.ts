import { describe, expect, it } from 'vitest';
import { INITIAL_SOLUTION_CATALOG } from '../ricisSolutionCatalog';

interface AssuranceBriefModule {
  buildVerifiableAiAssuranceBrief(input: {
    readonly catalog: typeof INITIAL_SOLUTION_CATALOG;
    readonly monolithId?: string;
    readonly authoritySnapshot?: unknown;
    readonly disclosureRequest?: unknown;
  }): unknown;
}

const CONTRACT_PATH = './assuranceBrief.domain';
const future = () => import(/* @vite-ignore */ CONTRACT_PATH) as Promise<AssuranceBriefModule>;

function projected(value: unknown): Record<string, unknown> {
  expect(value).toMatchObject({ kind: 'PROJECTED' });
  return (value as { readonly brief: Record<string, unknown> }).brief;
}

function llmSource() {
  const monolith = INITIAL_SOLUTION_CATALOG.monoliths.find((item) => item.id === 'calculator-llm_gradient');
  expect(monolith).toBeDefined();
  return monolith!.sourceEvidence;
}

describe('MARKET-RICIS-01 — source-bound verifiable AI assurance brief', () => {
  it('MAR01-QA-01: projects exactly the published LLM-gradient calculator monolith', async () => {
    const module = await future();
    expect(projected(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG }))).toMatchObject({
      monolithId: 'calculator-llm_gradient',
      nodeId: 'registry-118',
    });
  });

  it('MAR01-QA-02: preserves published bilingual title, category and family identity', async () => {
    const module = await future();
    const monolith = INITIAL_SOLUTION_CATALOG.monoliths.find((item) => item.id === 'calculator-llm_gradient')!;
    expect(projected(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG }))).toMatchObject({
      title: monolith.title,
      category: monolith.category,
      familyId: monolith.familyId,
    });
  });

  it('MAR01-QA-03: preserves the semantic-index expression from the immutable source catalogue', async () => {
    const module = await future();
    expect(projected(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG }))).toMatchObject({
      semanticIndexExpression: llmSource().semanticIndexExpression,
    });
  });

  it('MAR01-QA-04: preserves exact source repository, commit, path, ID, hash and licence', async () => {
    const module = await future();
    expect(projected(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG }))).toMatchObject({
      source: llmSource().source,
    });
  });

  it('MAR01-QA-05: accepts only a catalogue whose repository commit matches the LLM source commit', async () => {
    const module = await future();
    const invalidCatalog = { ...INITIAL_SOLUTION_CATALOG, sourceRepositoryCommit: 'wrong-source-commit' };
    expect(module.buildVerifiableAiAssuranceBrief({ catalog: invalidCatalog })).toMatchObject({
      kind: 'REJECTED',
      reason: 'REJECTED_SOURCE_IDENTITY',
    });
  });

  it('MAR01-QA-06: rejects a malformed LLM-gradient content hash without projecting a brief', async () => {
    const module = await future();
    const monoliths = INITIAL_SOLUTION_CATALOG.monoliths.map((item) => item.id === 'calculator-llm_gradient'
      ? { ...item, sourceEvidence: { ...item.sourceEvidence, source: { ...item.sourceEvidence.source, contentHash: 'not-a-sha' } } }
      : item);
    expect(module.buildVerifiableAiAssuranceBrief({ catalog: { ...INITIAL_SOLUTION_CATALOG, monoliths } })).toMatchObject({
      kind: 'REJECTED',
      reason: 'REJECTED_SOURCE_IDENTITY',
    });
  });

  it('MAR01-QA-07: rejects a missing LLM-gradient monolith rather than discovering an alternative', async () => {
    const module = await future();
    const monoliths = INITIAL_SOLUTION_CATALOG.monoliths.filter((item) => item.id !== 'calculator-llm_gradient');
    expect(module.buildVerifiableAiAssuranceBrief({ catalog: { ...INITIAL_SOLUTION_CATALOG, monoliths } })).toMatchObject({
      kind: 'REJECTED',
      reason: 'REJECTED_SOURCE_IDENTITY',
    });
  });

  it('MAR01-QA-08: freezes the projected root, brief, source and lane records', async () => {
    const module = await future();
    const result = module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG }) as { readonly brief: Record<string, unknown> };
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.brief)).toBe(true);
    expect(Object.isFrozen(result.brief.source as object)).toBe(true);
    expect(Object.isFrozen(result.brief.lanes as object)).toBe(true);
  });

  it('MAR01-QA-09: exposes exactly five named evidence lanes', async () => {
    const module = await future();
    const lanes = projected(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG })).lanes as Record<string, unknown>;
    expect(Object.keys(lanes).sort()).toEqual(['agent', 'core', 'human', 'lean', 'source']);
  });

  it('MAR01-QA-10: names RICIS_SOURCE_SOLVED only as a source-presentation lane', async () => {
    const module = await future();
    const lanes = projected(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG })).lanes as Record<string, Record<string, unknown>>;
    expect(lanes.source).toMatchObject({ availability: 'REPORTED', reportedStatus: 'RICIS_SOURCE_SOLVED' });
    expect(lanes.source).not.toHaveProperty('resolved');
    expect(lanes.source).not.toHaveProperty('trust');
  });

  it('MAR01-QA-11: fixes the non-certification disclosure and prohibits execution claims', async () => {
    const module = await future();
    expect(projected(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG })).disclosure).toEqual({
      classification: 'NOT_A_COMPLIANCE_OR_CERTIFICATION_DECISION',
      calculationPerformed: false,
      runtimeExecuted: false,
      legalAdviceProvided: false,
      authorityMutationPerformed: false,
    });
  });

  it('MAR01-QA-12: does not expose a node, proof, external Lean, axiom or trust payload', async () => {
    const module = await future();
    const brief = projected(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG }));
    for (const key of ['node', 'problemNode', 'proof', 'externalLean', 'axiom', 'trust', 'workflowState']) {
      expect(brief).not.toHaveProperty(key);
    }
  });
});
