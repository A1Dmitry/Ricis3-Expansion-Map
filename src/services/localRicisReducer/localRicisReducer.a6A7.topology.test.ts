import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SourceExpressionFactory } from '../localRicisAnalyzer/localRicisAnalyzer';
import { StructuralReducer } from './index';
import type { FiniteStructuralKey, StructuralBinaryExpression, StructuralExpression, StructuralIndex } from './contracts';

type FutureResult = { readonly status: string; readonly reason?: string };
interface FutureModule { planHomogeneousScalarA6A7(input: StructuralExpression): FutureResult; }
const future = async (): Promise<FutureModule> => import('./' + 'a6A7Homogeneous') as Promise<FutureModule>;
const sourceHash = 'sha256:v1:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';
const reducerLimits = { maxStructuralDepth: 16, maxDerivationSteps: 64, maxSemanticKeysPerExpression: 32, maxFactorsPerProduct: 16 };
const key = (canonical: string): readonly FiniteStructuralKey[] => [{ key: `ratio:${canonical}`, kind: 'RATIO', sourceHash, sourceCanonical: canonical }];
const id = (canonical: string) => ({ structuralHash: `fixture:scalar:${canonical}`, canonical, typeTag: 'scalar' as const, source: { sourceHash, sourceCanonical: canonical, sourceSpan: { start: 0, endExclusive: canonical.length }, origin: 'ANALYZER_AST' as const } });
const leaf = (canonical: string): Extract<StructuralExpression, { readonly kind: 'IDENTIFIER' }> => ({ kind: 'IDENTIFIER', name: canonical, identity: id(canonical), semanticKeys: key(canonical) });
const binary = (operator: StructuralBinaryExpression['operator'], left: StructuralExpression, right: StructuralExpression): StructuralBinaryExpression => {
  const symbol: Readonly<Record<StructuralBinaryExpression['operator'], string>> = { ADD: '+', SUBTRACT: '-', MULTIPLY: '*', DIVIDE: '/' };
  const canonical = `${left.identity.canonical} ${symbol[operator]} ${right.identity.canonical}`;
  return { kind: 'BINARY', operator, left, right, identity: id(canonical), semanticKeys: key(canonical) };
};
const index = (payload: StructuralExpression): StructuralIndex => ({ basis: 'SP4_SOURCE_EXPRESSION', payloadHash: payload.identity.structuralHash, payloadCanonical: payload.identity.canonical, payloadTypeTag: payload.identity.typeTag, sourceHash: payload.identity.source.sourceHash, semanticKeys: payload.semanticKeys });
const indexed = (kind: 'INDEXED_ZERO' | 'INDEXED_INFINITY', payload: StructuralExpression): StructuralExpression => ({ kind, payload, index: index(payload), identity: { ...id(kind === 'INDEXED_ZERO' ? `0_{${payload.identity.canonical}}` : `inf_{${payload.identity.canonical}}`), source: { ...id(payload.identity.canonical).source, origin: 'DERIVED_RICIS_RULE' } }, semanticKeys: payload.semanticKeys });
const a6 = (f: StructuralExpression, g: StructuralExpression) => binary('MULTIPLY', indexed('INDEXED_ZERO', f), indexed('INDEXED_INFINITY', g));
const a7 = (f: StructuralExpression, g: StructuralExpression) => binary('SUBTRACT', indexed('INDEXED_INFINITY', f), indexed('INDEXED_INFINITY', g));
function issuedSource(rawText: string) {
  const outcome = new SourceExpressionFactory().create(rawText, { maxInputCharacters: 128 });
  if (outcome.kind !== 'CREATED') throw new Error('Fixture source was rejected.');
  return outcome.source;
}

describe('LOCAL-RICIS-02 — A6/A7 topology, integration and release separation', () => {
  it('L02-QA-39: keeps future A6/A7 planner free of Core, network and browser runtime imports', async () => {
    await future();
    const source = readFileSync('src/services/localRicisReducer/a6A7Homogeneous.ts', 'utf8');
    expect(source).not.toMatch(/RicisCore|CoreProof|Wasm|fetch\(|XMLHttpRequest|WebSocket|window\.|window\.open|URL\(/i);
  });
  it('L02-QA-40: keeps future A6/A7 planner free of Lean, agent, model and provider execution', async () => {
    await future();
    const source = readFileSync('src/services/localRicisReducer/a6A7Homogeneous.ts', 'utf8');
    expect(source).not.toMatch(/agentRicis|generateProof|GoogleGenAI|\bprovider\b|\bprompt\b|from\s+['"][^'"]*(?:lean|lake|elan)[^'"]*['"]/i);
  });
  it('L02-QA-41: keeps future A6/A7 planner free of store, persistence, Passport, consent and writer imports', async () => {
    await future();
    const source = readFileSync('src/services/localRicisReducer/a6A7Homogeneous.ts', 'utf8');
    expect(source).not.toMatch(/mapStore|persistence|leanPassport|leanEvidenceConsent|Proof|externalLean|axiom|migrationAudit/i);
  });
  it('L02-QA-42: exposes no resolved, verified, trust or state authority in future planner result', async () => {
    const result = (await future()).planHomogeneousScalarA6A7(a6(leaf('F'), leaf('G')));
    expect(result).not.toHaveProperty('resolved');
    expect(result).not.toHaveProperty('verified');
    expect(result).not.toHaveProperty('trust');
    expect(result).not.toHaveProperty('state');
  });
  it('L02-QA-43: integrates approved homogeneous scalar A6 into the existing reducer singularity-first path', async () => {
    await future();
    const source = { ...issuedSource('x'), sourceHash };
    const result = new StructuralReducer(reducerLimits).reduce({ source, input: a6(leaf('F'), leaf('G')) });
    expect(result).toMatchObject({ status: 'LOCAL_STRUCTURAL_ASSESSMENT', reduced: { kind: 'BINARY', operator: 'MULTIPLY', left: { identity: { canonical: 'F' } }, right: { identity: { canonical: 'G' } } } });
  });
  it('L02-QA-44: integrates approved homogeneous scalar A7 into the existing reducer singularity-first path', async () => {
    await future();
    const source = { ...issuedSource('x'), sourceHash };
    const result = new StructuralReducer(reducerLimits).reduce({ source, input: a7(leaf('F'), leaf('G')) });
    expect(result).toMatchObject({ status: 'LOCAL_STRUCTURAL_ASSESSMENT', reduced: { kind: 'INDEXED_INFINITY', payload: { kind: 'BINARY', operator: 'SUBTRACT', identity: { canonical: 'F - G' } } } });
  });
  it('L02-QA-45: retains existing type mismatch deferral outside the two approved scalar cases', async () => {
    const vector = { ...leaf('V'), identity: { ...leaf('V').identity, typeTag: 'vector' as const } } as StructuralExpression;
    expect((await future()).planHomogeneousScalarA6A7(a6(leaf('F'), vector))).toMatchObject({ status: 'DEFER_TYPE_COMPOSITE' });
  });
  it('L02-QA-46: retains existing local-only provenance after A6 reducer integration', async () => {
    await future();
    const source = issuedSource('x');
    const result = new StructuralReducer(reducerLimits).reduce({ source, input: a6(leaf('F'), leaf('G')) });
    expect(result).toMatchObject({ provenance: { producer: 'LOCAL_TYPED_STRUCTURAL_REDUCER', localOnly: true, coreResultCreated: false, leanEvidenceCreated: false, proofCreated: false, trustStateChanged: false } });
  });
  it('L02-QA-47: confines implementation change to approved local reducer seam and new pure helper', async () => {
    await future();
    const reducerSource = readFileSync('src/services/localRicisReducer/index.ts', 'utf8');
    expect(reducerSource).toContain("./a6A7Homogeneous");
  });
  it('L02-QA-48: keeps the target test IDs unique and exactly fifty across four approved files', async () => {
    await future();
    const files = [
      'src/services/localRicisReducer/localRicisReducer.a6A7.contract.test.ts',
      'src/services/localRicisReducer/localRicisReducer.a6A7.ordering.test.ts',
      'src/services/localRicisReducer/localRicisReducer.a6A7.boundary.test.ts',
      'src/services/localRicisReducer/localRicisReducer.a6A7.topology.test.ts',
    ];
    const ids = files.flatMap(file => [...readFileSync(file, 'utf8').matchAll(/L02-QA-(\d{2})/g)].map(match => match[1]!));
    expect(ids).toHaveLength(50);
    expect(new Set(ids).size).toBe(50);
  });
  it('L02-QA-49: contains no release, version, commit or publication action in pure planner source', async () => {
    await future();
    const source = readFileSync('src/services/localRicisReducer/a6A7Homogeneous.ts', 'utf8');
    expect(source).not.toMatch(/package\.json|version|git\s+(commit|push)|publish/i);
  });
  it('L02-QA-50: keeps local application outcome separate from Core or Lean verification authority', async () => {
    await future();
    const source = issuedSource('x');
    const result = new StructuralReducer(reducerLimits).reduce({ source, input: a7(leaf('F'), leaf('G')) });
    expect(result).not.toHaveProperty('executionEngine');
    expect(result).not.toHaveProperty('isVerified');
    expect(result).not.toHaveProperty('lean4CodeSnippet');
  });
});
