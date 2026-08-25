import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { INITIAL_SOLUTION_CATALOG } from '../ricisSolutionCatalog';

interface AssuranceBriefModule {
  buildVerifiableAiAssuranceBrief(input: { readonly catalog: typeof INITIAL_SOLUTION_CATALOG }): unknown;
}

const CONTRACT_PATH = './assuranceBrief.domain';
const future = () => import(/* @vite-ignore */ CONTRACT_PATH) as Promise<AssuranceBriefModule>;

async function source(): Promise<string> {
  await future();
  return readFileSync('src/marketRicis/assuranceBrief.domain.ts', 'utf8');
}

describe('MARKET-RICIS-01 — topology and release separation', () => {
  it('MAR01-QA-37: imports catalogue contracts only', async () => {
    const text = await source();
    expect(text).toMatch(/ricisSolutionCatalog/);
    expect(text).not.toMatch(/model\/types|MapState|ProblemNode|Proof/i);
  });

  it('MAR01-QA-38: has no Core, Lean, consent, Passport, agent, provider, network, browser, server, API, persistence, store, migration or UI dependency', async () => {
    const text = await source();
    const imports = text.match(/^import[\s\S]*?;$/gm)?.join('\n') ?? '';
    expect(imports).not.toMatch(/RicisCore|Wasm|lean|consent|Passport|agentRicis|server|apiClient|provider|mapStore|persistence|migration|react|tsx|component/i);
    expect(text).not.toMatch(/fetch\(|XMLHttpRequest|WebSocket|window\.|window\.open|postJson|provider|prompt/i);
  });

  it('MAR01-QA-39: treats the catalogue as read-only and contains no manifest mutation path', async () => {
    const text = await source();
    expect(text).not.toMatch(/catalog\.(?:push|splice|sort)\(|Object\.assign\(\s*catalog|delete\s+.*catalog|catalog\s*=/i);
  });

  it('MAR01-QA-40: has no generic discovery, fuzzy matcher or template path', async () => {
    const text = await source();
    expect(text).not.toMatch(/fuzzy|keywordMatch|titleMatch|formulaMatch|discover|template|findBy/i);
  });

  it('MAR01-QA-41: contains the required fixed non-certification disclosure literal', async () => {
    const text = await source();
    expect(text).toContain("NOT_A_COMPLIANCE_OR_CERTIFICATION_DECISION");
  });

  it('MAR01-QA-42: contains no compliance, certification, safety, legal applicability or deployment conclusion semantics', async () => {
    const text = await source();
    expect(text).not.toMatch(/COMPLIANT|CERTIFIED|DEPLOYMENT_APPROVED|LEGAL_ADVICE|REGULATORY_APPLICABILITY|\bsafe\b/i);
  });

  it('MAR01-QA-43: exposes static non-binding governance context without an external source URL or launch behavior', async () => {
    const module = await future();
    const result = module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG }) as { readonly brief: Record<string, unknown> };
    expect(result.brief.governanceContext).toMatchObject({ nonBinding: true });
    expect(JSON.stringify(result.brief.governanceContext)).not.toMatch(/https?:|href|launch|upload/i);
  });

  it('MAR01-QA-44: contains no source upload, external handoff or runtime source-reading behavior', async () => {
    const text = await source();
    expect(text).not.toMatch(/upload|new URL|location|href|calculatorBaseUrl|buildCalculatorLaunchLink|readFile|fs\//i);
  });

  it('MAR01-QA-45: keeps exactly forty-eight unique approved IDs across four MARKET-RICIS files', async () => {
    await future();
    const files = [
      'src/marketRicis/assuranceBrief.domain.test.ts',
      'src/marketRicis/assuranceBrief.lanes.test.ts',
      'src/marketRicis/assuranceBrief.boundary.test.ts',
      'src/marketRicis/assuranceBrief.topology.test.ts',
    ];
    const ids = files.flatMap((path) => [...readFileSync(path, 'utf8').matchAll(/MAR01-QA-\d{2}/g)].map((match) => match[0]));
    expect(ids).toHaveLength(48);
    expect(new Set(ids).size).toBe(48);
  });

  it('MAR01-QA-46: contains no version, commit, push, release or publication command behaviour', async () => {
    const text = await source();
    expect(text).not.toMatch(/npm\s+version|git\s+(?:commit|push)|release:check|softwareVersion|publish/i);
  });

  it('MAR01-QA-47: leaves existing catalogue cards and visual policy outside the new domain boundary', async () => {
    const text = await source();
    expect(text).not.toMatch(/toSolutionMonolithCardView|presentMapNodeVisualStatus|validateSolutionCatalogManifest|GreenBasis|SolutionMonolithCardView/i);
  });

  it('MAR01-QA-48: never references P=NP, user Lean/TeX or canonical consent/Passport/agent evidence records', async () => {
    const text = await source();
    expect(text).not.toMatch(/P_VS_NP|calculator-p_vs_np|latex|sourceBytes|Fingerprint|LeanSourceVersion|TRAINING_REQUIRED|leanEvidenceConsent|leanPassportProjection|agentRicis/i);
  });
});
