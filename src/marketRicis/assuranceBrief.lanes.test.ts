import { describe, expect, it } from 'vitest';
import { INITIAL_SOLUTION_CATALOG } from '../ricisSolutionCatalog';

interface AssuranceBriefModule {
  buildVerifiableAiAssuranceBrief(input: {
    readonly catalog: typeof INITIAL_SOLUTION_CATALOG;
    readonly authoritySnapshot?: unknown;
  }): unknown;
}

const CONTRACT_PATH = './assuranceBrief.domain';
const future = () => import(/* @vite-ignore */ CONTRACT_PATH) as Promise<AssuranceBriefModule>;

function sourceIdentity() {
  const monolith = INITIAL_SOLUTION_CATALOG.monoliths.find((item) => item.id === 'calculator-llm_gradient')!;
  return {
    monolithId: 'calculator-llm_gradient',
    catalogCommit: INITIAL_SOLUTION_CATALOG.sourceRepositoryCommit,
    contentHash: monolith.sourceEvidence.source.contentHash,
  };
}

function canonicalSnapshot(overrides: Partial<Record<'core' | 'lean' | 'human' | 'agent', unknown>> = {}) {
  const absent = { availability: 'NOT_PROVIDED' };
  const reported = (status: string) => ({
    availability: 'REPORTED',
    sourceKind: 'CANONICAL_READ_SNAPSHOT',
    reportedStatus: status,
  });
  return {
    sourceIdentity: sourceIdentity(),
    core: overrides.core ?? absent,
    lean: overrides.lean ?? absent,
    human: overrides.human ?? absent,
    agent: overrides.agent ?? absent,
    sampleReported: reported,
  };
}

function lanes(value: unknown): Record<string, Record<string, unknown>> {
  expect(value).toMatchObject({ kind: 'PROJECTED' });
  return (value as { readonly brief: { readonly lanes: Record<string, Record<string, unknown>> } }).brief.lanes;
}

describe('MARKET-RICIS-01 — authority lane separation', () => {
  it('MAR01-QA-13: defaults the Core lane to NOT_PROVIDED', async () => {
    const module = await future();
    expect(lanes(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG })).core).toEqual({ availability: 'NOT_PROVIDED' });
  });

  it('MAR01-QA-14: accepts a Core report only with exact canonical source identity', async () => {
    const module = await future();
    const snapshot = canonicalSnapshot({ core: canonicalSnapshot().sampleReported('CORE_REPORT_OPAQUE') });
    expect(lanes(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG, authoritySnapshot: snapshot })).core).toEqual({
      availability: 'REPORTED',
      sourceKind: 'CANONICAL_READ_SNAPSHOT',
      reportedStatus: 'CORE_REPORT_OPAQUE',
    });
  });

  it('MAR01-QA-15: preserves an opaque Core status without deriving a success claim', async () => {
    const module = await future();
    const snapshot = canonicalSnapshot({ core: canonicalSnapshot().sampleReported('ANY_OPAQUE_CORE_LITERAL') });
    const core = lanes(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG, authoritySnapshot: snapshot })).core;
    expect(core.reportedStatus).toBe('ANY_OPAQUE_CORE_LITERAL');
    expect(core).not.toHaveProperty('success');
    expect(core).not.toHaveProperty('verified');
  });

  it('MAR01-QA-16: rejects malformed or foreign Core snapshot identity', async () => {
    const module = await future();
    const snapshot = canonicalSnapshot({ core: canonicalSnapshot().sampleReported('CORE') });
    const foreign = { ...snapshot, sourceIdentity: { ...sourceIdentity(), contentHash: '0'.repeat(64) } };
    expect(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG, authoritySnapshot: foreign })).toMatchObject({
      kind: 'REJECTED',
      reason: 'REJECTED_AUTHORITY_SNAPSHOT',
    });
  });

  it('MAR01-QA-17: defaults the Lean lane to NOT_PROVIDED', async () => {
    const module = await future();
    expect(lanes(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG })).lean).toEqual({ availability: 'NOT_PROVIDED' });
  });

  it('MAR01-QA-18: accepts a Lean lane only as an opaque canonical read snapshot', async () => {
    const module = await future();
    const snapshot = canonicalSnapshot({ lean: canonicalSnapshot().sampleReported('LEAN_STATUS_REPORTED_BY_OWNER') });
    expect(lanes(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG, authoritySnapshot: snapshot })).lean).toEqual({
      availability: 'REPORTED',
      sourceKind: 'CANONICAL_READ_SNAPSHOT',
      reportedStatus: 'LEAN_STATUS_REPORTED_BY_OWNER',
    });
  });

  it('MAR01-QA-19: never promotes an opaque Lean literal to trust or verification', async () => {
    const module = await future();
    const snapshot = canonicalSnapshot({ lean: canonicalSnapshot().sampleReported('LEAN_VERIFIED') });
    const lean = lanes(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG, authoritySnapshot: snapshot })).lean;
    expect(lean.reportedStatus).toBe('LEAN_VERIFIED');
    expect(lean).not.toHaveProperty('trust');
    expect(lean).not.toHaveProperty('kernelVerified');
  });

  it('MAR01-QA-20: rejects reported Lean data without CANONICAL_READ_SNAPSHOT provenance', async () => {
    const module = await future();
    const snapshot = canonicalSnapshot({ lean: { availability: 'REPORTED', sourceKind: 'BROWSER_PAYLOAD', reportedStatus: 'LEAN_VERIFIED' } });
    expect(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG, authoritySnapshot: snapshot })).toMatchObject({
      kind: 'REJECTED',
      reason: 'REJECTED_AUTHORITY_SNAPSHOT',
    });
  });

  it('MAR01-QA-21: defaults Human and Agent lanes to NOT_PROVIDED', async () => {
    const module = await future();
    const result = lanes(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG }));
    expect(result.human).toEqual({ availability: 'NOT_PROVIDED' });
    expect(result.agent).toEqual({ availability: 'NOT_PROVIDED' });
  });

  it('MAR01-QA-22: preserves Human and Agent reports only as independent opaque read lanes', async () => {
    const module = await future();
    const snapshot = canonicalSnapshot({
      human: canonicalSnapshot().sampleReported('HUMAN_DECISION_REPORTED'),
      agent: canonicalSnapshot().sampleReported('TRAINING_REQUIRED'),
    });
    const result = lanes(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG, authoritySnapshot: snapshot }));
    expect(result.human.reportedStatus).toBe('HUMAN_DECISION_REPORTED');
    expect(result.agent.reportedStatus).toBe('TRAINING_REQUIRED');
    expect(result.human).not.toHaveProperty('decisionApplied');
    expect(result.agent).not.toHaveProperty('retrained');
  });

  it('MAR01-QA-23: keeps all lanes independent from the source presentation lane', async () => {
    const module = await future();
    const snapshot = canonicalSnapshot({
      core: canonicalSnapshot().sampleReported('CORE'),
      lean: canonicalSnapshot().sampleReported('LEAN'),
      human: canonicalSnapshot().sampleReported('HUMAN'),
      agent: canonicalSnapshot().sampleReported('AGENT'),
    });
    const result = lanes(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG, authoritySnapshot: snapshot }));
    expect(result.source).toMatchObject({ reportedStatus: 'RICIS_SOURCE_SOLVED' });
    expect(result.source).not.toHaveProperty('derivedFrom');
  });

  it('MAR01-QA-24: produces deterministic deeply frozen lanes for the same canonical snapshot', async () => {
    const module = await future();
    const snapshot = canonicalSnapshot({ agent: canonicalSnapshot().sampleReported('CONFLICT') });
    const first = module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG, authoritySnapshot: snapshot });
    const second = module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG, authoritySnapshot: snapshot });
    expect(first).toEqual(second);
    const result = lanes(first);
    expect(Object.isFrozen(result.core)).toBe(true);
    expect(Object.isFrozen(result.lean)).toBe(true);
    expect(Object.isFrozen(result.human)).toBe(true);
    expect(Object.isFrozen(result.agent)).toBe(true);
  });
});
