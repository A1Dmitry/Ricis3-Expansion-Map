import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  LocalAnalysisApplicationService,
  LocalAnalysisTraceFactory,
  LocalExpressionNormalizer,
  LocalExpressionParser,
  LocalPatternClassifier,
  LocalRicisAnalyzer,
  LocalSemanticIndexer,
  LocalStructuralIdentityComparator,
  SourceExpressionFactory,
  DEFAULT_LOCAL_ANALYZER_LIMITS,
} from '../localRicisAnalyzer/localRicisAnalyzer';
import type {
  CoreExecutionFailure,
} from '../ricisCore/IRicisCoreEngine';
import type {
  FiniteStructuralKey,
  LocalStructuralReducerDependencies,
  StructuralBinaryExpression,
  StructuralExpression,
  StructuralFiniteLiteral,
  StructuralIdentifier,
  StructuralIndex,
  StructuralSourceReference,
  StructuralTypeTag,
} from './contracts';
import {
  LocalStructuralReductionApplicationService,
  StructuralExpressionMapper,
  StructuralReductionAdmissionPolicy,
  StructuralReducer,
} from './index';

const FIXED_TIME = 1_735_689_600_000;
const analyzerLimits = {
  ...DEFAULT_LOCAL_ANALYZER_LIMITS,
  maxInputCharacters: 128,
  maxTokenCount: 64,
  maxAstDepth: 16,
  maxTraceEntries: 64,
};
const reducerLimits = {
  maxStructuralDepth: 16,
  maxDerivationSteps: 64,
  maxSemanticKeysPerExpression: 32,
  maxFactorsPerProduct: 16,
};

function issuedSource(rawText: string) {
  const outcome = new SourceExpressionFactory().create(rawText, analyzerLimits);
  if (outcome.kind !== 'CREATED') throw new Error('Fixture source was rejected.');
  return outcome.source;
}

function analyzer() {
  return new LocalRicisAnalyzer({
    parser: new LocalExpressionParser(),
    normalizer: new LocalExpressionNormalizer(),
    identityComparator: new LocalStructuralIdentityComparator(),
    semanticIndexer: new LocalSemanticIndexer(),
    patternClassifier: new LocalPatternClassifier(),
    traceFactory: new LocalAnalysisTraceFactory(),
    clock: { now: () => FIXED_TIME },
    limits: analyzerLimits,
  });
}

function analysisApplication() {
  return new LocalAnalysisApplicationService(new SourceExpressionFactory(), analyzer(), analyzerLimits);
}

function failure(code: CoreExecutionFailure['code']): CoreExecutionFailure {
  return {
    success: false,
    code,
    userMessage: 'Core result is intentionally unavailable in this test fixture.',
    diagnostic: {
      origin: 'terminal',
      runtime: 'not_ready',
      retryable: true,
      occurredAt: FIXED_TIME,
    },
  };
}

function sourceReference(sourceHash: string, canonical: string, origin: 'ANALYZER_AST' | 'DERIVED_RICIS_RULE' = 'ANALYZER_AST'): StructuralSourceReference {
  return {
    sourceHash,
    sourceCanonical: canonical,
    sourceSpan: { start: 0, endExclusive: canonical.length },
    origin,
  };
}

function keys(sourceHash: string, canonical: string): readonly FiniteStructuralKey[] {
  return [{ key: `ratio:${canonical}`, kind: 'RATIO', sourceHash, sourceCanonical: canonical }];
}

function identity(sourceHash: string, canonical: string, typeTag: StructuralTypeTag = 'scalar', origin: 'ANALYZER_AST' | 'DERIVED_RICIS_RULE' = 'ANALYZER_AST') {
  return {
    structuralHash: `fixture:${sourceHash}:${typeTag}:${canonical}`,
    canonical,
    typeTag,
    source: sourceReference(sourceHash, canonical, origin),
  } as const;
}

function identifier(sourceHash: string, name: string, typeTag: StructuralTypeTag = 'scalar'): StructuralIdentifier {
  return { kind: 'IDENTIFIER', name, identity: identity(sourceHash, name, typeTag), semanticKeys: keys(sourceHash, name) };
}

function literal(sourceHash: string, lexeme: string, typeTag: StructuralTypeTag = 'scalar'): StructuralFiniteLiteral {
  return { kind: 'FINITE_LITERAL', lexeme, identity: identity(sourceHash, lexeme, typeTag), semanticKeys: keys(sourceHash, lexeme) };
}

function binary(
  sourceHash: string,
  operator: StructuralBinaryExpression['operator'],
  left: StructuralExpression,
  right: StructuralExpression,
  typeTag: StructuralTypeTag = left.identity.typeTag,
): StructuralBinaryExpression {
  const symbols: Readonly<Record<StructuralBinaryExpression['operator'], string>> = {
    ADD: '+',
    SUBTRACT: '-',
    MULTIPLY: '*',
    DIVIDE: '/',
  };
  const canonical = `${left.identity.canonical} ${symbols[operator]} ${right.identity.canonical}`;
  return {
    kind: 'BINARY',
    operator,
    left,
    right,
    identity: identity(sourceHash, canonical, typeTag),
    semanticKeys: keys(sourceHash, canonical),
  };
}

function indexFor(payload: StructuralExpression): StructuralIndex {
  return {
    basis: 'SP4_SOURCE_EXPRESSION',
    payloadHash: payload.identity.structuralHash,
    payloadCanonical: payload.identity.canonical,
    payloadTypeTag: payload.identity.typeTag,
    sourceHash: payload.identity.source.sourceHash,
    semanticKeys: payload.semanticKeys,
  };
}

function indexedZero(payload: StructuralExpression): Extract<StructuralExpression, { readonly kind: 'INDEXED_ZERO' }> {
  return {
    kind: 'INDEXED_ZERO',
    payload,
    index: indexFor(payload),
    identity: identity(payload.identity.source.sourceHash, `0_{${payload.identity.canonical}}`, payload.identity.typeTag, 'DERIVED_RICIS_RULE'),
    semanticKeys: payload.semanticKeys,
  };
}

function indexedInfinity(payload: StructuralExpression): Extract<StructuralExpression, { readonly kind: 'INDEXED_INFINITY' }> {
  return {
    kind: 'INDEXED_INFINITY',
    payload,
    index: indexFor(payload),
    identity: identity(payload.identity.source.sourceHash, `inf_{${payload.identity.canonical}}`, payload.identity.typeTag, 'DERIVED_RICIS_RULE'),
    semanticKeys: payload.semanticKeys,
  };
}

function reducer() {
  return new StructuralReducer(reducerLimits);
}

function mapper() {
  return new StructuralExpressionMapper(reducerLimits);
}

function dependencies(): LocalStructuralReducerDependencies {
  return {
    analysisApplication: analysisApplication(),
    mapper: mapper(),
    reducer: reducer(),
    admissionPolicy: new StructuralReductionAdmissionPolicy(),
    limits: reducerLimits,
  };
}

function assertLocalOnly(result: Record<string, unknown>): void {
  expect(result).toMatchObject({
    provenance: {
      producer: 'LOCAL_TYPED_STRUCTURAL_REDUCER',
      localOnly: true,
      coreResultCreated: false,
      leanEvidenceCreated: false,
      proofCreated: false,
      trustStateChanged: false,
    },
  });
  for (const forbidden of ['success', 'invariant', 'executionEngine', 'proof', 'externalLean', 'isVerified', 'resolved', 'lean4CodeSnippet']) {
    expect(result).not.toHaveProperty(forbidden);
  }
}

describe('LOCAL-RICIS-01 — approved G3 red tests', () => {
  it('LRS01: maps an analyzer-issued AST to an immutable scalar structural tree with source identity, not a raw-text payload', async () => {
    const source = issuedSource('(x - 5) * (x + 5) / (x - 5)');
    const analysis = await analyzer().analyze({ source, origin: 'explicit_user_action', requestedLocale: 'en-US', correlationId: 'LRS01' }, new AbortController().signal);
    if (!analysis.ast) throw new Error('Fixture AST was not produced.');

    const outcome = mapper().map({ source: analysis.source, ast: analysis.ast, semanticIndex: analysis.semanticIndex });

    expect(outcome).toMatchObject({ status: 'MAPPED', expression: { kind: 'BINARY', operator: 'DIVIDE', identity: { typeTag: 'scalar', source: { sourceHash: source.sourceHash } } } });
    if (outcome.status !== 'MAPPED') return;
    expect(Object.values(outcome.expression).flatMap(value => typeof value === 'string' ? [value] : [])).not.toContain(source.rawText);
    expect(Object.isFrozen(outcome.expression)).toBe(true);
  });

  it('LRS02: refuses a label-only indexed candidate because `0_F` is not a recursive F payload', async () => {
    const source = issuedSource('0_F / 0_F');
    const analysis = await analyzer().analyze({ source, origin: 'explicit_user_action', requestedLocale: 'en-US', correlationId: 'LRS02' }, new AbortController().signal);
    if (!analysis.ast) throw new Error('Fixture AST was not produced.');

    expect(mapper().map({ source: analysis.source, ast: analysis.ast, semanticIndex: analysis.semanticIndex })).toEqual({
      status: 'NON_APPLICABLE',
      reason: 'LABEL_ONLY_INDEXED_OPERAND',
    });
  });

  it('LRS03: applies SP2 associative exact-factor cancellation before any indexed axiom and preserves the remaining structural expression', () => {
    const source = issuedSource('(x - 5) * (x + 5) / (x - 5)');
    const x = identifier(source.sourceHash, 'x');
    const five = literal(source.sourceHash, '5');
    const xMinusFive = binary(source.sourceHash, 'SUBTRACT', x, five);
    const xPlusFive = binary(source.sourceHash, 'ADD', x, five);
    const input = binary(source.sourceHash, 'DIVIDE', binary(source.sourceHash, 'MULTIPLY', xMinusFive, xPlusFive), xMinusFive);

    const result = reducer().reduce({ source, input });

    expect(result.status).toBe('LOCAL_STRUCTURAL_ASSESSMENT');
    if (result.status !== 'LOCAL_STRUCTURAL_ASSESSMENT') return;
    expect(result.reduced).toMatchObject({ kind: 'BINARY', operator: 'ADD', left: { kind: 'IDENTIFIER', name: 'x' }, right: { kind: 'FINITE_LITERAL', lexeme: '5' } });
    expect(result.derivation.map(step => step.rule)).toContain('SP2_ASSOCIATIVE_FACTOR_CANCELLATION');
    expect(result.derivation.map(step => step.rule)).not.toContain('A1_FINITE_OVER_ZERO');
    assertLocalOnly(result as unknown as Record<string, unknown>);
  });

  it('LRS04: reduces F inside A1 bottom-up, then creates an indexed infinity whose payload is the reduced recursive F expression', () => {
    const source = issuedSource('((x - 5) * (x + 5) / (x - 5)) / 0');
    const x = identifier(source.sourceHash, 'x');
    const five = literal(source.sourceHash, '5');
    const xMinusFive = binary(source.sourceHash, 'SUBTRACT', x, five);
    const xPlusFive = binary(source.sourceHash, 'ADD', x, five);
    const reducibleF = binary(source.sourceHash, 'DIVIDE', binary(source.sourceHash, 'MULTIPLY', xMinusFive, xPlusFive), xMinusFive);
    const input = binary(source.sourceHash, 'DIVIDE', reducibleF, literal(source.sourceHash, '0'));

    const result = reducer().reduce({ source, input });

    expect(result.status).toBe('LOCAL_STRUCTURAL_ASSESSMENT');
    if (result.status !== 'LOCAL_STRUCTURAL_ASSESSMENT') return;
    expect(result.reduced).toMatchObject({ kind: 'INDEXED_INFINITY', payload: { kind: 'BINARY', operator: 'ADD', identity: { canonical: 'x + 5' } }, index: { basis: 'SP4_SOURCE_EXPRESSION', payloadCanonical: 'x + 5' } });
    const sp2 = result.derivation.findIndex(step => step.rule === 'SP2_ASSOCIATIVE_FACTOR_CANCELLATION' && step.outcome === 'APPLIED');
    const a1 = result.derivation.findIndex(step => step.rule === 'A1_FINITE_OVER_ZERO' && step.outcome === 'APPLIED');
    expect(sp2).toBeGreaterThanOrEqual(0);
    expect(a1).toBeGreaterThan(sp2);
  });

  it('LRS05: applies A10 to F × 0 without scalarizing F and indexes the full reduced payload under SP4', () => {
    const source = issuedSource('((x - 5) * (x + 5) / (x - 5)) * 0');
    const x = identifier(source.sourceHash, 'x');
    const five = literal(source.sourceHash, '5');
    const xMinusFive = binary(source.sourceHash, 'SUBTRACT', x, five);
    const reducibleF = binary(source.sourceHash, 'DIVIDE', binary(source.sourceHash, 'MULTIPLY', xMinusFive, binary(source.sourceHash, 'ADD', x, five)), xMinusFive);

    const result = reducer().reduce({ source, input: binary(source.sourceHash, 'MULTIPLY', reducibleF, literal(source.sourceHash, '0')) });

    expect(result.status).toBe('LOCAL_STRUCTURAL_ASSESSMENT');
    if (result.status !== 'LOCAL_STRUCTURAL_ASSESSMENT') return;
    expect(result.reduced).toMatchObject({ kind: 'INDEXED_ZERO', payload: { kind: 'BINARY', operator: 'ADD', identity: { canonical: 'x + 5' } }, index: { basis: 'SP4_SOURCE_EXPRESSION', payloadCanonical: 'x + 5' } });
    expect(result.derivation.map(step => step.rule)).toEqual(expect.arrayContaining(['A10_FINITE_TIMES_ZERO', 'SP4_SOURCE_EXPRESSION_INDEX']));
  });

  it('LRS06: applies A4 only after SP3 exact type/key checks, discloses F/G, and runs bounded SP2 cleanup on the disclosed monolith', () => {
    const source = issuedSource('0_F / 0_G');
    const x = identifier(source.sourceHash, 'x');
    const five = literal(source.sourceHash, '5');
    const factor = binary(source.sourceHash, 'SUBTRACT', x, five);
    const f = binary(source.sourceHash, 'MULTIPLY', factor, binary(source.sourceHash, 'ADD', x, five));
    const g = factor;

    const result = reducer().reduce({ source, input: binary(source.sourceHash, 'DIVIDE', indexedZero(f), indexedZero(g)) });

    expect(result.status).toBe('LOCAL_STRUCTURAL_ASSESSMENT');
    if (result.status !== 'LOCAL_STRUCTURAL_ASSESSMENT') return;
    expect(result.reduced).toMatchObject({ kind: 'BINARY', operator: 'ADD', identity: { canonical: 'x + 5' } });
    const rules = result.derivation.map(step => step.rule);
    expect(rules.indexOf('SP3_EXACT_TYPE_AND_FINITE_KEY_CHECK')).toBeLessThan(rules.indexOf('A4_INDEXED_ZERO_OVER_INDEXED_ZERO'));
    expect(rules.indexOf('A4_INDEXED_ZERO_OVER_INDEXED_ZERO')).toBeLessThan(rules.lastIndexOf('SP2_ASSOCIATIVE_FACTOR_CANCELLATION'));
    expect(result.derivation).toEqual(expect.arrayContaining([expect.objectContaining({ rule: 'A4_INDEXED_ZERO_OVER_INDEXED_ZERO', authority: 'RICIS_III_EXPLICIT', outcome: 'APPLIED' })]));
  });

  it('LRS07: rejects indexed-zero division with incompatible exact type tags instead of promotion, scalarization, or composite invention', () => {
    const source = issuedSource('0_F / 0_G');
    const vectorPayload = identifier(source.sourceHash, 'v', 'vector');
    const scalarPayload = identifier(source.sourceHash, 's', 'scalar');

    const result = reducer().reduce({ source, input: binary(source.sourceHash, 'DIVIDE', indexedZero(vectorPayload), indexedZero(scalarPayload), 'vector') });

    expect(result).toMatchObject({ status: 'NON_APPLICABLE', reason: 'TYPE_TAG_MISMATCH' });
    assertLocalOnly(result as unknown as Record<string, unknown>);
  });

  it('LRS08: applies only approved homogeneous scalar A6/A7 after payload reduction, preserving local-only authority', () => {
    const source = issuedSource('x');
    const x = identifier(source.sourceHash, 'x');
    const y = identifier(source.sourceHash, 'y');
    const a6 = reducer().reduce({ source, input: binary(source.sourceHash, 'MULTIPLY', indexedZero(x), indexedInfinity(y)) });
    const a7 = reducer().reduce({ source, input: binary(source.sourceHash, 'SUBTRACT', indexedInfinity(x), indexedInfinity(y)) });

    expect(a6).toMatchObject({ status: 'LOCAL_STRUCTURAL_ASSESSMENT', reduced: { kind: 'BINARY', operator: 'MULTIPLY', left: { identity: { canonical: 'x' } }, right: { identity: { canonical: 'y' } } } });
    expect(a7).toMatchObject({ status: 'LOCAL_STRUCTURAL_ASSESSMENT', reduced: { kind: 'INDEXED_INFINITY', payload: { kind: 'BINARY', operator: 'SUBTRACT', identity: { canonical: 'x - y' } } } });
    expect(a6.status === 'LOCAL_STRUCTURAL_ASSESSMENT' && a6.derivation).toEqual(expect.arrayContaining([expect.objectContaining({ rule: 'A6_HOMOGENEOUS_SCALAR_PRODUCT', authority: 'RICIS_III_EXPLICIT', outcome: 'APPLIED' })]));
    expect(a7.status === 'LOCAL_STRUCTURAL_ASSESSMENT' && a7.derivation).toEqual(expect.arrayContaining([expect.objectContaining({ rule: 'A7_HOMOGENEOUS_SCALAR_INDEXED_SUBTRACTION', authority: 'RICIS_III_EXPLICIT', outcome: 'APPLIED' })]));
    assertLocalOnly(a6 as unknown as Record<string, unknown>);
    assertLocalOnly(a7 as unknown as Record<string, unknown>);
  });

  it('LRS09: inherited exact structural algebra cancels an ordinary shared factor after singularity-first inspection', () => {
    const source = issuedSource('(a * b) / (a * c)');
    const a = identifier(source.sourceHash, 'a');
    const input = binary(source.sourceHash, 'DIVIDE', binary(source.sourceHash, 'MULTIPLY', a, identifier(source.sourceHash, 'b')), binary(source.sourceHash, 'MULTIPLY', a, identifier(source.sourceHash, 'c')));

    const result = reducer().reduce({ source, input });

    expect(result.status).toBe('LOCAL_STRUCTURAL_ASSESSMENT');
    if (result.status !== 'LOCAL_STRUCTURAL_ASSESSMENT') return;
    expect(result.reduced).toMatchObject({ kind: 'BINARY', operator: 'DIVIDE', identity: { canonical: 'b / c' } });
    expect(result.derivation).toEqual(expect.arrayContaining([expect.objectContaining({ rule: 'SP2_ASSOCIATIVE_FACTOR_CANCELLATION', authority: 'INHERITED_CLASSICAL_STRUCTURAL_ALGEBRA_GEOMETRY', outcome: 'APPLIED' })]));
  });

  it('LRS10: retains ordered immutable history, original source hash and finite semantic keys for every local assessment', () => {
    const source = issuedSource('x / 0');
    const result = reducer().reduce({ source, input: binary(source.sourceHash, 'DIVIDE', identifier(source.sourceHash, 'x'), literal(source.sourceHash, '0')) });

    expect(result.status).toBe('LOCAL_STRUCTURAL_ASSESSMENT');
    if (result.status !== 'LOCAL_STRUCTURAL_ASSESSMENT') return;
    expect(result.provenance.sourceHash).toBe(source.sourceHash);
    expect(result.derivation.map(step => step.sequence)).toEqual(result.derivation.map((_, index) => index + 1));
    expect(Object.isFrozen(result.derivation)).toBe(true);
    expect(result.derivation.every(step => Object.isFrozen(step))).toBe(true);
    expect(JSON.stringify(result)).not.toContain('NaN');
    expect(result.reduced.semanticKeys.length).toBeLessThanOrEqual(reducerLimits.maxSemanticKeysPerExpression);
  });

  it('LRS11: stops deterministically at a structural limit rather than expanding branches or returning a scalar approximation', () => {
    const source = issuedSource('x');
    const strictReducer = new StructuralReducer({ ...reducerLimits, maxStructuralDepth: 1 });
    const input = binary(source.sourceHash, 'MULTIPLY', binary(source.sourceHash, 'MULTIPLY', identifier(source.sourceHash, 'a'), identifier(source.sourceHash, 'b')), identifier(source.sourceHash, 'c'));

    expect(strictReducer.reduce({ source, input })).toMatchObject({ status: 'NON_APPLICABLE', reason: 'STRUCTURAL_LIMIT_REACHED' });
  });

  it('LRS12: permits the explicit local route after true Core unavailability but never after Core input rejection', () => {
    const policy = new StructuralReductionAdmissionPolicy();
    expect(policy.permits(failure('CORE_UNAVAILABLE'), 'explicit_user_action')).toBe(true);
    expect(policy.permits(failure('CORE_INFRASTRUCTURE_ERROR'), 'explicit_user_action')).toBe(true);
    expect(policy.permits(failure('CORE_INVALID_RESPONSE'), 'explicit_user_action')).toBe(true);
    expect(policy.permits(failure('CORE_INPUT_REJECTED'), 'explicit_user_action')).toBe(false);
  });

  it('LRS13: application service invokes existing analyzer once only after explicit admitted recovery and never re-invokes Core or an agent', async () => {
    const dependencySet = dependencies();
    const analyzeSpy = vi.spyOn(dependencySet.analysisApplication, 'analyzeExplicitly');
    const service = new LocalStructuralReductionApplicationService(dependencySet);

    const result = await service.reduceExplicitly({ rawText: 'x / 0', origin: 'explicit_user_action', requestedLocale: 'en-US', correlationId: 'LRS13', coreRecovery: failure('CORE_UNAVAILABLE') }, new AbortController().signal);

    expect(analyzeSpy).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('LOCAL_STRUCTURAL_ASSESSMENT');
    assertLocalOnly(result as unknown as Record<string, unknown>);
  });

  it('LRS14: topology excludes legacy fallback, proof/template, agent, network and state/trust imports from local reducer implementation', () => {
    const source = readFileSync('src/services/localRicisReducer/index.ts', 'utf8');
    expect(source).not.toMatch(/RicisFallbackEngine|ricisCoreRules|logic\.ts|generateProof|canonical.*latex|agent|fetch\(|XMLHttpRequest|WebSocket|useMapStore|persistence|authoritativeProofStatePolicy/i);
  });

  it('LRS15: preserves an ordinary quotient with no exact common factor and records inherited SP2 non-application', () => {
    const source = issuedSource('(a * b) / (d * c)');
    const input = binary(source.sourceHash, 'DIVIDE', binary(source.sourceHash, 'MULTIPLY', identifier(source.sourceHash, 'a'), identifier(source.sourceHash, 'b')), binary(source.sourceHash, 'MULTIPLY', identifier(source.sourceHash, 'd'), identifier(source.sourceHash, 'c')));

    const result = reducer().reduce({ source, input });

    expect(result.status).toBe('LOCAL_STRUCTURAL_ASSESSMENT');
    if (result.status !== 'LOCAL_STRUCTURAL_ASSESSMENT') return;
    expect(result.reduced).toMatchObject({ kind: 'BINARY', operator: 'DIVIDE', identity: { canonical: 'a * b / (d * c)' } });
    expect(result.derivation).toEqual(expect.arrayContaining([expect.objectContaining({ rule: 'SP2_ASSOCIATIVE_FACTOR_CANCELLATION', authority: 'INHERITED_CLASSICAL_STRUCTURAL_ALGEBRA_GEOMETRY', outcome: 'NOT_APPLICABLE' })]));
  });

  it('LRS16: resolves identical indexed zeros through A4 before local L1, without erasing an enclosing tail', () => {
    const source = issuedSource('0_F / 0_F');
    const payload = identifier(source.sourceHash, 'F');
    const result = reducer().reduce({ source, input: binary(source.sourceHash, 'DIVIDE', indexedZero(payload), indexedZero(payload)) });

    expect(result.status).toBe('LOCAL_STRUCTURAL_ASSESSMENT');
    if (result.status !== 'LOCAL_STRUCTURAL_ASSESSMENT') return;
    expect(result.reduced).toMatchObject({ kind: 'FINITE_LITERAL', lexeme: '1' });
    const a4 = result.derivation.findIndex(step => step.rule === 'A4_INDEXED_ZERO_OVER_INDEXED_ZERO' && step.outcome === 'APPLIED');
    const l1 = result.derivation.findIndex(step => step.rule === 'L1_IDENTICAL_DIVISION' && step.outcome === 'APPLIED');
    expect(a4).toBeGreaterThanOrEqual(0);
    expect(l1).toBeGreaterThan(a4);
  });

  it('LRS17: resolves identical indexed infinities through A5 before local L1 and retains source-bound typed payload identity', () => {
    const source = issuedSource('inf_F / inf_F');
    const payload = identifier(source.sourceHash, 'F');
    const result = reducer().reduce({ source, input: binary(source.sourceHash, 'DIVIDE', indexedInfinity(payload), indexedInfinity(payload)) });

    expect(result.status).toBe('LOCAL_STRUCTURAL_ASSESSMENT');
    if (result.status !== 'LOCAL_STRUCTURAL_ASSESSMENT') return;
    expect(result.reduced).toMatchObject({ kind: 'FINITE_LITERAL', lexeme: '1' });
    expect(result.derivation).toEqual(expect.arrayContaining([expect.objectContaining({ rule: 'A5_INDEXED_INFINITY_OVER_INDEXED_INFINITY', authority: 'RICIS_III_EXPLICIT', outcome: 'APPLIED' })]));
    const a5 = result.derivation.findIndex(step => step.rule === 'A5_INDEXED_INFINITY_OVER_INDEXED_INFINITY' && step.outcome === 'APPLIED');
    const l1 = result.derivation.findIndex(step => step.rule === 'L1_IDENTICAL_DIVISION' && step.outcome === 'APPLIED');
    expect(l1).toBeGreaterThan(a5);
  });
});
