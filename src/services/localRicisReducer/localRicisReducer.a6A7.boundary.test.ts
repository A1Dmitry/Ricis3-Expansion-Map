import { describe, expect, it } from 'vitest';
import type { FiniteStructuralKey, StructuralBinaryExpression, StructuralExpression, StructuralIndex, StructuralTypeTag } from './contracts';

type Result = { readonly status: string; readonly reason?: string };
interface FutureModule { planHomogeneousScalarA6A7(input: StructuralExpression): Result; }
const future = async (): Promise<FutureModule> => import('./' + 'a6A7Homogeneous') as Promise<FutureModule>;
const sourceHash = 'sha256:v1:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
const key = (canonical: string): readonly FiniteStructuralKey[] => [{ key: `ratio:${canonical}`, kind: 'RATIO', sourceHash, sourceCanonical: canonical }];
function identity(canonical: string, typeTag: StructuralTypeTag) {
  return { structuralHash: `fixture:${typeTag}:${canonical}`, canonical, typeTag, source: { sourceHash, sourceCanonical: canonical, sourceSpan: { start: 0, endExclusive: canonical.length }, origin: 'ANALYZER_AST' as const } } as const;
}
function leaf(canonical: string, typeTag: StructuralTypeTag = 'scalar'): Extract<StructuralExpression, { readonly kind: 'IDENTIFIER' }> {
  return { kind: 'IDENTIFIER', name: canonical, identity: identity(canonical, typeTag), semanticKeys: key(canonical) };
}
function binary(operator: StructuralBinaryExpression['operator'], left: StructuralExpression, right: StructuralExpression, typeTag: StructuralTypeTag = left.identity.typeTag): StructuralBinaryExpression {
  const symbol: Readonly<Record<StructuralBinaryExpression['operator'], string>> = { ADD: '+', SUBTRACT: '-', MULTIPLY: '*', DIVIDE: '/' };
  const canonical = `${left.identity.canonical} ${symbol[operator]} ${right.identity.canonical}`;
  return { kind: 'BINARY', operator, left, right, identity: identity(canonical, typeTag), semanticKeys: key(canonical) };
}
function index(payload: StructuralExpression): StructuralIndex {
  return { basis: 'SP4_SOURCE_EXPRESSION', payloadHash: payload.identity.structuralHash, payloadCanonical: payload.identity.canonical, payloadTypeTag: payload.identity.typeTag, sourceHash: payload.identity.source.sourceHash, semanticKeys: payload.semanticKeys };
}
function indexed(kind: 'INDEXED_ZERO' | 'INDEXED_INFINITY', payload: StructuralExpression, override?: Partial<StructuralIndex>): StructuralExpression {
  const canonical = kind === 'INDEXED_ZERO' ? `0_{${payload.identity.canonical}}` : `inf_{${payload.identity.canonical}}`;
  return { kind, payload, index: { ...index(payload), ...override }, identity: { ...identity(canonical, payload.identity.typeTag), source: { ...identity(canonical, payload.identity.typeTag).source, origin: 'DERIVED_RICIS_RULE' } }, semanticKeys: payload.semanticKeys } as StructuralExpression;
}
const a6 = (f: StructuralExpression, g: StructuralExpression) => binary('MULTIPLY', indexed('INDEXED_ZERO', f), indexed('INDEXED_INFINITY', g));
const a7 = (f: StructuralExpression, g: StructuralExpression) => binary('SUBTRACT', indexed('INDEXED_INFINITY', f), indexed('INDEXED_INFINITY', g));
const expectDeferred = (result: Result) => expect(result).toMatchObject({ status: 'DEFER_TYPE_COMPOSITE', reason: 'TYPE_PROMOTION_OR_COMPOSITE_DEFERRED' });

describe('LOCAL-RICIS-02 — A6/A7 deferral and safety boundary', () => {
  it('L02-QA-27: defers scalar/vector A6 without promotion', async () => expectDeferred((await future()).planHomogeneousScalarA6A7(a6(leaf('F', 'scalar'), leaf('V', 'vector')))));
  it('L02-QA-28: defers scalar/matrix A7 without promotion', async () => expectDeferred((await future()).planHomogeneousScalarA6A7(a7(leaf('F', 'scalar'), leaf('M', 'matrix')))));
  it('L02-QA-29: defers vector/vector A6 absent a separately typed morphism', async () => expectDeferred((await future()).planHomogeneousScalarA6A7(a6(leaf('V', 'vector'), leaf('W', 'vector')))));
  it('L02-QA-30: defers matrix/matrix A7 absent a separately typed morphism', async () => expectDeferred((await future()).planHomogeneousScalarA6A7(a7(leaf('M', 'matrix'), leaf('N', 'matrix')))));
  it('L02-QA-31: does not invent a composite type for heterogeneous A6', async () => {
    const result = (await future()).planHomogeneousScalarA6A7(a6(leaf('F', 'scalar'), leaf('V', 'vector')));
    expectDeferred(result);
    expect(result).not.toHaveProperty('compositeType');
    expect(result).not.toHaveProperty('tuple');
    expect(result).not.toHaveProperty('coercion');
  });
  it('L02-QA-32: rejects an index whose payload hash does not match its recursive payload', async () => {
    const f = leaf('F'); const g = leaf('G');
    const malformed = binary('MULTIPLY', indexed('INDEXED_ZERO', f, { payloadHash: 'wrong' }), indexed('INDEXED_INFINITY', g));
    expect((await future()).planHomogeneousScalarA6A7(malformed)).toMatchObject({ status: 'NOT_APPLICABLE' });
  });
  it('L02-QA-33: rejects an index whose source hash does not match the source-bound payload', async () => {
    const malformed = a7(leaf('F'), leaf('G')) as StructuralBinaryExpression;
    const left = indexed('INDEXED_INFINITY', leaf('F'), { sourceHash: 'foreign-source' });
    const right = malformed.right;
    expect((await future()).planHomogeneousScalarA6A7(binary('SUBTRACT', left, right))).toMatchObject({ status: 'NOT_APPLICABLE' });
  });
  it('L02-QA-34: rejects missing finite semantic keys rather than applying A6', async () => {
    const f = { ...leaf('F'), semanticKeys: [] } as StructuralExpression;
    expect((await future()).planHomogeneousScalarA6A7(a6(f, leaf('G')))).toMatchObject({ status: 'NOT_APPLICABLE' });
  });
  it('L02-QA-35: rejects an ordinary A5 infinity quotient from A6/A7 helper scope', async () => {
    const input = binary('DIVIDE', indexed('INDEXED_INFINITY', leaf('F')), indexed('INDEXED_INFINITY', leaf('G')));
    expect((await future()).planHomogeneousScalarA6A7(input)).toMatchObject({ status: 'NOT_APPLICABLE' });
  });
  it('L02-QA-36: has no limit, lHopital, NaN or numeric-fallback result vocabulary', async () => {
    const result = (await future()).planHomogeneousScalarA6A7(a6(leaf('F'), leaf('G')));
    expect(JSON.stringify(result)).not.toMatch(/limit|l.?h[oô]pital|NaN|parseFloat|fallback/i);
  });
  it('L02-QA-37: does not construct an answer from raw text or template fields', async () => {
    const result = (await future()).planHomogeneousScalarA6A7(a7(leaf('F'), leaf('G')));
    expect(result).not.toHaveProperty('template');
    expect(result).not.toHaveProperty('rawText');
    expect(result).not.toHaveProperty('latex');
  });
  it('L02-QA-38: never exposes proof, trust or state transition on malformed indexed input', async () => {
    const malformed = a6(leaf('F'), leaf('G')) as StructuralBinaryExpression;
    const result = (await future()).planHomogeneousScalarA6A7(binary('MULTIPLY', malformed.left, indexed('INDEXED_INFINITY', leaf('G'), { payloadCanonical: 'other' })));
    expect(result).toMatchObject({ status: 'NOT_APPLICABLE' });
    expect(result).not.toHaveProperty('proof');
    expect(result).not.toHaveProperty('trustStateChanged');
    expect(result).not.toHaveProperty('state');
  });
});
