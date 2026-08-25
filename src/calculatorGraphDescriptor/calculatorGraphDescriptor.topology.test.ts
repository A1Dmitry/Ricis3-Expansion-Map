import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { INITIAL_SOLUTION_CATALOG } from '../ricisSolutionCatalog';

interface GraphDescriptorModule {
  buildCalculatorGraphProjection(input: { readonly catalog: typeof INITIAL_SOLUTION_CATALOG }): unknown;
}

async function future(): Promise<GraphDescriptorModule> {
  const modulePath = './calculatorGraphDescriptor.domain';
  return import(/* @vite-ignore */ modulePath) as Promise<GraphDescriptorModule>;
}

async function source(): Promise<string> {
  await future();
  return readFileSync('src/calculatorGraphDescriptor/calculatorGraphDescriptor.domain.ts', 'utf8');
}

async function initialMapSeed(): Promise<{ initialMap: { readonly nodes: readonly { readonly id: string }[]; readonly edges: readonly { readonly id: string }[] } }> {
  const mapPath = '../model/initialMap';
  return import(/* @vite-ignore */ mapPath) as Promise<{ initialMap: { readonly nodes: readonly { readonly id: string }[]; readonly edges: readonly { readonly id: string }[] } }>;
}

describe('CALC-EXP-01 G4B — topology, static seed and release separation', () => {
  it('CEG4B-QA-43: imports calculator catalog and graph type contracts only', async () => {
    const text = await source();
    expect(text).toMatch(/ricisSolutionCatalog/);
    expect(text).toMatch(/model\/types/);
  });

  it('CEG4B-QA-44: has no Core, Lean, agent, provider, network, server, browser, popup, store or persistence runtime dependency', async () => {
    const text = await source();
    expect(text).not.toMatch(/RicisCore|Wasm|fetch\(|XMLHttpRequest|WebSocket|window\.|window\.open|agentRicis|GoogleGenAI|generateProof|\bprovider\b|\bprompt\b|mapStore|persistence|leanPassport|leanEvidenceConsent|from\s+['"][^'"]*(?:lean|lake|elan)[^'"]*['"]/i);
  });

  it('CEG4B-QA-45: treats the source catalogue as read-only and contains no manifest mutation path', async () => {
    const text = await source();
    expect(text).not.toMatch(/catalog\.(?:push|splice|sort)\(|Object\.assign\(\s*catalog|delete\s+.*catalog|catalog\s*=/i);
  });

  it('CEG4B-QA-46: has no existing ProblemNode writer, substitution or regeneration path', async () => {
    const text = await source();
    expect(text).not.toMatch(/initialMap|KNOWN_SINGULARITY_PROBLEMS|migrationAudit|Proof|externalLean|TRUSTED_AXIOM|LEAN_VERIFIED/i);
  });

  it('CEG4B-QA-47: composes exactly ten static descriptors and their explicit edge projections into the initial graph seed', async () => {
    const module = await future();
    const result = module.buildCalculatorGraphProjection({ catalog: INITIAL_SOLUTION_CATALOG }) as Record<string, unknown>;
    expect(result).toMatchObject({ kind: 'PROJECTED' });
    const expectedNodeIds = (result.nodes as readonly { readonly id: string }[]).map((node) => node.id);
    const expectedEdgeIds = (result.edges as readonly { readonly id: string }[]).map((edge) => edge.id);
    expect(expectedNodeIds).toHaveLength(10);
    expect((result.relations as readonly unknown[]).length).toBeGreaterThan(0);

    const { initialMap } = await initialMapSeed();
    expect(initialMap.nodes.filter((node) => expectedNodeIds.includes(node.id)).map((node) => node.id)).toEqual(expectedNodeIds);
    expect(initialMap.edges.filter((edge) => expectedEdgeIds.includes(edge.id)).map((edge) => edge.id)).toEqual(expectedEdgeIds);
  });

  it('CEG4B-QA-48: contains no generic discovery, fuzzy matcher or graph template source path', async () => {
    const text = await source();
    expect(text).not.toMatch(/fuzzy|keywordMatch|titleMatch|formulaMatch|discover|template/i);
  });

  it('CEG4B-QA-49: treats source-green as named catalog basis and has no Lean/Core/status escalation function', async () => {
    const text = await source();
    expect(text).toContain("greenBasis: 'RICIS_SOURCE_SOLVED'");
    expect(text).not.toMatch(/setState|resolveNode|verifyLean|coreResult|trustTransition/i);
  });

  it('CEG4B-QA-50: constructs no calculator launch URL, external source URL or user preset route', async () => {
    const text = await source();
    expect(text).not.toMatch(/new URL|calculatorBaseUrl|buildCalculatorLaunchLink|preset|location|href/i);
  });

  it('CEG4B-QA-51: contains no release, version, commit, push or publication command behaviour', async () => {
    const text = await source();
    expect(text).not.toMatch(/npm\s+version|git\s+(?:commit|push)|release:check|softwareVersion|publish/i);
  });

  it('CEG4B-QA-52: keeps target IDs unique and exactly fifty-four across four approved G4B files', async () => {
    await future();
    const files = [
      'src/calculatorGraphDescriptor/calculatorGraphDescriptor.domain.test.ts',
      'src/calculatorGraphDescriptor/calculatorGraphDescriptor.relations.test.ts',
      'src/calculatorGraphDescriptor/calculatorGraphDescriptor.boundary.test.ts',
      'src/calculatorGraphDescriptor/calculatorGraphDescriptor.topology.test.ts',
    ];
    const ids = files.flatMap(path => [...readFileSync(path, 'utf8').matchAll(/CEG4B-QA-\d{2}/g)].map(match => match[0]));
    expect(ids).toHaveLength(54);
    expect(new Set(ids).size).toBe(54);
  });

  it('CEG4B-QA-53: leaves published CALC-EXP G4A source catalog and card tests outside the future module boundary', async () => {
    const text = await source();
    expect(text).not.toMatch(/toSolutionMonolithCardView|buildCalculatorLaunchLink|presentMapNodeVisualStatus|validateSolutionCatalogManifest/i);
  });

  it('CEG4B-QA-54: never references owner P=NP source, user Lean/TeX bytes or canonical consent/passport/agent records', async () => {
    const text = await source();
    expect(text).not.toMatch(/P_VS_NP|calculator-p_vs_np|latex|sourceBytes|Fingerprint|LeanSourceVersion|TRAINING_REQUIRED/i);
  });
});
