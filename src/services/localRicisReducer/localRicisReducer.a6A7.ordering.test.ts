import { describe, expect, it } from 'vitest';
import type { FiniteStructuralKey, StructuralBinaryExpression, StructuralExpression, StructuralIndex } from './contracts';

interface FutureModule {
  planHomogeneousScalarA6A7(input: StructuralExpression):
    | { readonly status: 'APPLY_A6'; readonly zeroPayload: StructuralExpression; readonly infinityPayload: StructuralExpression; readonly preconditions: readonly string[] }
    | { readonly status: 'APPLY_A7'; readonly leftPayload: StructuralExpression; readonly rightPayload: StructuralExpression; readonly preconditions: readonly string[] }
    | { readonly status: 'DEFER_TYPE_COMPOSITE' | 'NOT_APPLICABLE'; readonly reason: string };
}
const future = async (): Promise<FutureModule> => import('./' + 'a6A7Homogeneous') as Promise<FutureModule>;
const sourceHash = 'sha256:v1:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const key = (canonical: string): readonly FiniteStructuralKey[] => [{ key: `ratio:${canonical}`, kind: 'RATIO', sourceHash, sourceCanonical: canonical }];
const id = (canonical: string) => ({ structuralHash: `fixture:scalar:${canonical}`, canonical, typeTag: 'scalar' as const, source: { sourceHash, sourceCanonical: canonical, sourceSpan: { start: 0, endExclusive: canonical.length }, origin: 'ANALYZER_AST' as const } });
const leaf = (canonical: string): Extract<StructuralExpression, { readonly kind: 'IDENTIFIER' }> => ({ kind: 'IDENTIFIER', name: canonical, identity: id(canonical), semanticKeys: key(canonical) });
const binary = (operator: StructuralBinaryExpression['operator'], left: StructuralExpression, right: StructuralExpression): StructuralBinaryExpression => {
  const symbol: Readonly<Record<StructuralBinaryExpression['operator'], string>> = { ADD: '+', SUBTRACT: '-', MULTIPLY: '*', DIVIDE: '/' };
  const canonical = `${left.identity.canonical} ${symbol[operator]} ${right.identity.canonical}`;
  return { kind: 'BINARY', operator, left, right, identity: id(canonical), semanticKeys: key(canonical) };
};
const index = (payload: StructuralExpression): StructuralIndex => ({ basis: 'SP4_SOURCE_EXPRESSION', payloadHash: payload.identity.structuralHash, payloadCanonical: payload.identity.canonical, payloadTypeTag: payload.identity.typeTag, sourceHash: payload.identity.source.sourceHash, semanticKeys: payload.semanticKeys });
const indexed = (kind: 'INDEXED_ZERO' | 'INDEXED_INFINITY', payload: StructuralExpression): StructuralExpression => ({ kind, payload, index: index(payload), identity: { ...id(kind === 'INDEXED_ZERO' ? `0_{${payload.identity.canonical}}` : `inf_{${payload.identity.canonical}}`), typeTag: 'scalar', source: { ...id(payload.identity.canonical).source, origin: 'DERIVED_RICIS_RULE' } }, semanticKeys: payload.semanticKeys });
const a6 = (f: StructuralExpression, g: StructuralExpression) => binary('MULTIPLY', indexed('INDEXED_ZERO', f), indexed('INDEXED_INFINITY', g));
const a7 = (f: StructuralExpression, g: StructuralExpression) => binary('SUBTRACT', indexed('INDEXED_INFINITY', f), indexed('INDEXED_INFINITY', g));

describe('LOCAL-RICIS-02 — A6/A7 ordering and structural safety', () => {
  it('L02-QA-15: retains source-bound payload identity through A6 eligibility', async () => {
    const plan = (await future()).planHomogeneousScalarA6A7(a6(leaf('F'), leaf('G')));
    expect(plan.status === 'APPLY_A6' && plan.zeroPayload.identity.source.sourceHash).toBe(sourceHash);
  });
  it('L02-QA-16: requires payload children to be structurally reduced before A6', async () => {
    const plan = (await future()).planHomogeneousScalarA6A7(a6(binary('DIVIDE', leaf('F'), leaf('one')), leaf('G')));
    expect(plan.status === 'APPLY_A6' && plan.preconditions).toContain('PAYLOAD_CHILDREN_REDUCED');
  });
  it('L02-QA-17: requires payload children to be structurally reduced before A7', async () => {
    const plan = (await future()).planHomogeneousScalarA6A7(a7(leaf('F'), binary('DIVIDE', leaf('G'), leaf('one'))));
    expect(plan.status === 'APPLY_A7' && plan.preconditions).toContain('PAYLOAD_CHILDREN_REDUCED');
  });
  it('L02-QA-18: records SP3 exact-type validation as an A6 precondition', async () => {
    const plan = (await future()).planHomogeneousScalarA6A7(a6(leaf('F'), leaf('G')));
    expect(plan.status === 'APPLY_A6' && plan.preconditions).toContain('EXACT_TYPE_EQUALITY');
  });
  it('L02-QA-19: records SP3 exact-type validation as an A7 precondition', async () => {
    const plan = (await future()).planHomogeneousScalarA6A7(a7(leaf('F'), leaf('G')));
    expect(plan.status === 'APPLY_A7' && plan.preconditions).toContain('EXACT_TYPE_EQUALITY');
  });
  it('L02-QA-20: marks finite semantic keys as necessary before A6 application', async () => {
    const plan = (await future()).planHomogeneousScalarA6A7(a6(leaf('F'), leaf('G')));
    expect(plan.status === 'APPLY_A6' && plan.preconditions).toContain('FINITE_SEMANTIC_KEYS');
  });
  it('L02-QA-21: marks finite semantic keys as necessary before A7 application', async () => {
    const plan = (await future()).planHomogeneousScalarA6A7(a7(leaf('F'), leaf('G')));
    expect(plan.status === 'APPLY_A7' && plan.preconditions).toContain('FINITE_SEMANTIC_KEYS');
  });
  it('L02-QA-22: records SP4 source-expression index availability for A6', async () => {
    const plan = (await future()).planHomogeneousScalarA6A7(a6(leaf('F'), leaf('G')));
    expect(plan.status === 'APPLY_A6' && plan.preconditions).toContain('SP4_SOURCE_INDEX_AVAILABLE');
  });
  it('L02-QA-23: records SP4 source-expression index availability for A7', async () => {
    const plan = (await future()).planHomogeneousScalarA6A7(a7(leaf('F'), leaf('G')));
    expect(plan.status === 'APPLY_A7' && plan.preconditions).toContain('SP4_SOURCE_INDEX_AVAILABLE');
  });
  it('L02-QA-24: preserves an A6 payload algebraic tail as a structural child', async () => {
    const f = binary('ADD', leaf('x'), leaf('tail'));
    const plan = (await future()).planHomogeneousScalarA6A7(a6(f, leaf('G')));
    expect(plan).toMatchObject({ status: 'APPLY_A6', zeroPayload: { identity: { canonical: 'x + tail' } } });
  });
  it('L02-QA-25: preserves ordered A7 subtraction rather than commuting payloads', async () => {
    const plan = (await future()).planHomogeneousScalarA6A7(a7(leaf('F'), leaf('G')));
    expect(plan).toMatchObject({ status: 'APPLY_A7', leftPayload: { identity: { canonical: 'F' } }, rightPayload: { identity: { canonical: 'G' } } });
  });
  it('L02-QA-26: never derives a local proof or resolved-state capability from rule ordering', async () => {
    const plan = (await future()).planHomogeneousScalarA6A7(a7(leaf('F'), leaf('G')));
    expect(plan).not.toHaveProperty('proof');
    expect(plan).not.toHaveProperty('resolved');
    expect(plan).not.toHaveProperty('externalLean');
  });
});
