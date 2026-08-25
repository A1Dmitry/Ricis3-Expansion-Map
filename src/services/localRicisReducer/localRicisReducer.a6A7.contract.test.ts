import { describe, expect, it } from 'vitest';
import type {
  FiniteStructuralKey,
  StructuralBinaryExpression,
  StructuralExpression,
  StructuralIndex,
  StructuralTypeTag,
} from './contracts';

interface HomogeneousPlanModule {
  planHomogeneousScalarA6A7(input: StructuralExpression):
    | {
      readonly status: 'APPLY_A6';
      readonly zeroPayload: StructuralExpression;
      readonly infinityPayload: StructuralExpression;
      readonly typeTag: 'scalar';
      readonly preconditions: readonly string[];
    }
    | {
      readonly status: 'APPLY_A7';
      readonly leftPayload: StructuralExpression;
      readonly rightPayload: StructuralExpression;
      readonly typeTag: 'scalar';
      readonly preconditions: readonly string[];
    }
    | { readonly status: 'DEFER_TYPE_COMPOSITE'; readonly reason: 'TYPE_PROMOTION_OR_COMPOSITE_DEFERRED' }
    | { readonly status: 'NOT_APPLICABLE'; readonly reason: string };
}

const loadFutureModule = async (): Promise<HomogeneousPlanModule> =>
  import('./' + 'a6A7Homogeneous') as Promise<HomogeneousPlanModule>;

const sourceHash = 'sha256:v1:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

function keys(canonical: string): readonly FiniteStructuralKey[] {
  return [{ key: `ratio:${canonical}`, kind: 'RATIO', sourceHash, sourceCanonical: canonical }];
}

function identity(canonical: string, typeTag: StructuralTypeTag = 'scalar') {
  return {
    structuralHash: `fixture:${typeTag}:${canonical}`,
    canonical,
    typeTag,
    source: {
      sourceHash,
      sourceCanonical: canonical,
      sourceSpan: { start: 0, endExclusive: canonical.length },
      origin: 'ANALYZER_AST' as const,
    },
  } as const;
}

function identifier(canonical: string, typeTag: StructuralTypeTag = 'scalar'): Extract<StructuralExpression, { readonly kind: 'IDENTIFIER' }> {
  return { kind: 'IDENTIFIER', name: canonical, identity: identity(canonical, typeTag), semanticKeys: keys(canonical) };
}

function binary(
  operator: StructuralBinaryExpression['operator'],
  left: StructuralExpression,
  right: StructuralExpression,
  typeTag: StructuralTypeTag = left.identity.typeTag,
): StructuralBinaryExpression {
  const symbol: Readonly<Record<StructuralBinaryExpression['operator'], string>> = {
    ADD: '+', SUBTRACT: '-', MULTIPLY: '*', DIVIDE: '/',
  };
  const canonical = `${left.identity.canonical} ${symbol[operator]} ${right.identity.canonical}`;
  return { kind: 'BINARY', operator, left, right, identity: identity(canonical, typeTag), semanticKeys: keys(canonical) };
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

function indexed(kind: 'INDEXED_ZERO' | 'INDEXED_INFINITY', payload: StructuralExpression): StructuralExpression {
  const canonical = kind === 'INDEXED_ZERO' ? `0_{${payload.identity.canonical}}` : `inf_{${payload.identity.canonical}}`;
  return {
    kind,
    payload,
    index: indexFor(payload),
    identity: {
      ...identity(canonical, payload.identity.typeTag),
      source: { ...identity(canonical, payload.identity.typeTag).source, origin: 'DERIVED_RICIS_RULE' },
    },
    semanticKeys: payload.semanticKeys,
  };
}

function a6(f: StructuralExpression, g: StructuralExpression, commuted = false): StructuralExpression {
  const zero = indexed('INDEXED_ZERO', f);
  const infinity = indexed('INDEXED_INFINITY', g);
  return binary('MULTIPLY', commuted ? infinity : zero, commuted ? zero : infinity);
}

function a7(f: StructuralExpression, g: StructuralExpression): StructuralExpression {
  return binary('SUBTRACT', indexed('INDEXED_INFINITY', f), indexed('INDEXED_INFINITY', g));
}

describe('LOCAL-RICIS-02 — A6/A7 homogeneous scalar contract', () => {
  it('L02-QA-01: plans homogeneous scalar indexed-zero times indexed-infinity as A6', async () => {
    const future = await loadFutureModule();
    const plan = future.planHomogeneousScalarA6A7(a6(identifier('F'), identifier('G')));
    expect(plan).toMatchObject({ status: 'APPLY_A6', typeTag: 'scalar', zeroPayload: { identity: { canonical: 'F' } }, infinityPayload: { identity: { canonical: 'G' } } });
  });

  it('L02-QA-02: plans the commuted homogeneous scalar A6 shape without changing payload roles', async () => {
    const future = await loadFutureModule();
    const plan = future.planHomogeneousScalarA6A7(a6(identifier('F'), identifier('G'), true));
    expect(plan).toMatchObject({ status: 'APPLY_A6', zeroPayload: { identity: { canonical: 'F' } }, infinityPayload: { identity: { canonical: 'G' } } });
  });

  it('L02-QA-03: plans homogeneous scalar indexed-infinity subtraction as A7', async () => {
    const future = await loadFutureModule();
    const plan = future.planHomogeneousScalarA6A7(a7(identifier('F'), identifier('G')));
    expect(plan).toMatchObject({ status: 'APPLY_A7', typeTag: 'scalar', leftPayload: { identity: { canonical: 'F' } }, rightPayload: { identity: { canonical: 'G' } } });
  });

  it('L02-QA-04: keeps the A6 plan typed scalar rather than returning an untyped numeric value', async () => {
    const future = await loadFutureModule();
    const plan = future.planHomogeneousScalarA6A7(a6(identifier('x'), identifier('y')));
    expect(plan).toMatchObject({ status: 'APPLY_A6', typeTag: 'scalar' });
    expect(plan).not.toHaveProperty('value');
    expect(plan).not.toHaveProperty('numericValue');
    expect(plan).not.toHaveProperty('scalarized');
  });

  it('L02-QA-05: keeps the A7 plan typed scalar and source-bound for derived indexing', async () => {
    const future = await loadFutureModule();
    const plan = future.planHomogeneousScalarA6A7(a7(identifier('x'), identifier('y')));
    expect(plan).toMatchObject({ status: 'APPLY_A7', typeTag: 'scalar' });
    expect(plan.status === 'APPLY_A7' && plan.leftPayload.identity.source.sourceHash).toBe(sourceHash);
  });

  it('L02-QA-06: preserves distinct A6 recursive payload identities without scalarization', async () => {
    const future = await loadFutureModule();
    const left = binary('ADD', identifier('x'), identifier('one'));
    const right = binary('SUBTRACT', identifier('y'), identifier('two'));
    const plan = future.planHomogeneousScalarA6A7(a6(left, right));
    expect(plan).toMatchObject({ status: 'APPLY_A6', zeroPayload: { identity: { canonical: 'x + one' } }, infinityPayload: { identity: { canonical: 'y - two' } } });
  });

  it('L02-QA-07: preserves ordered A7 recursive subtraction payload identities', async () => {
    const future = await loadFutureModule();
    const plan = future.planHomogeneousScalarA6A7(a7(identifier('F'), identifier('G')));
    expect(plan).toMatchObject({ status: 'APPLY_A7', leftPayload: { identity: { canonical: 'F' } }, rightPayload: { identity: { canonical: 'G' } } });
  });

  it('L02-QA-08: does not collapse identical A6 payloads to a unit or one payload', async () => {
    const future = await loadFutureModule();
    const f = identifier('F');
    const plan = future.planHomogeneousScalarA6A7(a6(f, f));
    expect(plan).toMatchObject({ status: 'APPLY_A6', zeroPayload: { identity: { canonical: 'F' } }, infinityPayload: { identity: { canonical: 'F' } } });
  });

  it('L02-QA-09: does not collapse identical A7 payloads to scalar zero', async () => {
    const future = await loadFutureModule();
    const f = identifier('F');
    const plan = future.planHomogeneousScalarA6A7(a7(f, f));
    expect(plan).toMatchObject({ status: 'APPLY_A7', leftPayload: { identity: { canonical: 'F' } }, rightPayload: { identity: { canonical: 'F' } } });
  });

  it('L02-QA-10: includes exact-type and source-bound index requirements in A6 plan', async () => {
    const future = await loadFutureModule();
    const plan = future.planHomogeneousScalarA6A7(a6(identifier('F'), identifier('G')));
    expect(plan.status === 'APPLY_A6' && plan.preconditions).toEqual(expect.arrayContaining(['EXACT_TYPE_EQUALITY', 'FINITE_SEMANTIC_KEYS', 'SP4_SOURCE_INDEX_AVAILABLE']));
  });

  it('L02-QA-11: includes exact-type and source-bound index requirements in A7 plan', async () => {
    const future = await loadFutureModule();
    const plan = future.planHomogeneousScalarA6A7(a7(identifier('F'), identifier('G')));
    expect(plan.status === 'APPLY_A7' && plan.preconditions).toEqual(expect.arrayContaining(['EXACT_TYPE_EQUALITY', 'FINITE_SEMANTIC_KEYS', 'SP4_SOURCE_INDEX_AVAILABLE']));
  });

  it('L02-QA-12: rejects ordinary non-indexed multiplication from approved A6 plan', async () => {
    const future = await loadFutureModule();
    const plan = future.planHomogeneousScalarA6A7(binary('MULTIPLY', identifier('F'), identifier('G')));
    expect(plan).toMatchObject({ status: 'NOT_APPLICABLE' });
  });

  it('L02-QA-13: rejects ordinary non-indexed subtraction from approved A7 plan', async () => {
    const future = await loadFutureModule();
    const plan = future.planHomogeneousScalarA6A7(binary('SUBTRACT', identifier('F'), identifier('G')));
    expect(plan).toMatchObject({ status: 'NOT_APPLICABLE' });
  });

  it('L02-QA-14: returns immutable plan data with no writer or authority capability', async () => {
    const future = await loadFutureModule();
    const plan = future.planHomogeneousScalarA6A7(a6(identifier('F'), identifier('G')));
    expect(Object.isFrozen(plan)).toBe(true);
    expect(plan).not.toHaveProperty('proof');
    expect(plan).not.toHaveProperty('trustStateChanged');
    expect(plan).not.toHaveProperty('execute');
  });
});
