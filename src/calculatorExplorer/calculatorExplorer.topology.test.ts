import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

interface FutureDomain {
  buildCalculatorExplorerProjection(input?: { readonly baseUrl?: string }): unknown;
}
interface FutureUi {
  CalculatorExplorer: unknown;
}

const DOMAIN_PATH = './calculatorExplorer.domain';
const UI_PATH = '../ui/CalculatorExplorer';
const futureDomain = () => import(/* @vite-ignore */ DOMAIN_PATH) as Promise<FutureDomain>;
const futureUi = () => import(/* @vite-ignore */ UI_PATH) as Promise<FutureUi>;
const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const baseline = '9afd3ff097e05e25f8c7b219300daa9bbe1cbf29';

function unchanged(path: string): void {
  const published = execFileSync('git', ['show', `${baseline}:${path}`], { encoding: 'utf8' });
  expect(source(path)).toBe(published);
}

describe('CALC-EXP-02 — topology and authority boundary', () => {
  it('CE02-QA-29: provides exactly the approved pure domain and presentational UI modules', async () => {
    const domain = await futureDomain();
    const ui = await futureUi();
    expect(typeof domain.buildCalculatorExplorerProjection).toBe('function');
    expect(ui.CalculatorExplorer).toBeDefined();
  });

  it('CE02-QA-30: keeps the explorer domain free of Core, Lean, proof, agent, API, provider, network, storage and browser-open imports', async () => {
    await futureDomain();
    const text = source('src/calculatorExplorer/calculatorExplorer.domain.ts');
    expect(text).not.toMatch(/from ['"][^'"]*(core|lean|proof|agent|apiClient|provider|store|persist|industrialRicis)[^'"]*['"]/i);
    expect(text).not.toMatch(/\b(fetch|XMLHttpRequest|WebSocket|window\.open|localStorage|sessionStorage|navigator\.|document\.|axios)\b/i);
  });

  it('CE02-QA-31: keeps the explorer UI presentational with no direct external operation, transport or control token', async () => {
    await futureUi();
    const text = source('src/ui/CalculatorExplorer.tsx');
    expect(text).not.toMatch(/\b(fetch|XMLHttpRequest|WebSocket|window\.open|localStorage|sessionStorage|navigator\.|iframe|postMessage|controlCommand|safetyAssessment|certification)\b/i);
    expect(text).not.toMatch(/from ['"][^'"]*(core|lean|agent|apiClient|provider|industrialRicis|store|persist)[^'"]*['"]/i);
  });

  it('CE02-QA-32: composes Map3D through the existing navigation callback instead of a solver, renderer or external launch call', async () => {
    await futureUi();
    const text = source('src/ui/Map3D.tsx');
    expect(text).toContain("from './CalculatorExplorer'");
    expect(text).toMatch(/<CalculatorExplorer[\s\S]*onSelectNode=\{handleNavigateToNode\}/);
    expect(text).not.toMatch(/CalculatorExplorer[\s\S]{0,500}(handleSolve|window\.open|fetch)/);
  });

  it('CE02-QA-33: makes NodeCardDetails use the pure explorer resolver rather than a fuzzy lookup', async () => {
    await futureDomain();
    const text = source('src/ui/NodeCardDetails.tsx');
    expect(text).toContain("from '../calculatorExplorer/calculatorExplorer.domain'");
    expect(text).toMatch(/getCalculatorExplorerEntryForNodeId\(\{\s*nodeId:\s*node\.id/);
    expect(text).not.toMatch(/includes\(node\.title\)|toLowerCase\(\).*calculator|fuzzy|keyword/i);
  });

  it('CE02-QA-34: extends the existing static graph seed rather than duplicating CLOSED_PLAN or graph builder logic', async () => {
    await futureDomain();
    const seed = source('src/calculatorGraphDescriptor/calculatorGraphDescriptor.seed.ts');
    const domain = source('src/calculatorExplorer/calculatorExplorer.domain.ts');
    expect(seed).toContain('CALCULATOR_GRAPH_STATIC_SEED');
    expect(domain).toContain('CALCULATOR_GRAPH_STATIC_SEED');
    expect(domain).not.toMatch(/CLOSED_PLAN|buildCalculatorGraphProjection|calculator-node-kinematic.*registry-120/i);
  });

  it('CE02-QA-35: leaves calculator catalogue definitions and the existing launch builder byte-for-byte unchanged', async () => {
    await futureDomain();
    unchanged('src/ricisSolutionCatalog/index.ts');
  });

  it('CE02-QA-36: leaves Core/OIR/industrial authority surfaces byte-for-byte unchanged', async () => {
    await futureDomain();
    for (const path of [
      'src/model/logic.ts',
      'src/model/audit.ts',
      'src/industrialRicis/industrialResearchContext.domain.ts',
    ]) unchanged(path);
  });

  it('CE02-QA-37: has no writer, proof-template, state or trust decision path in the new domain/UI sources', async () => {
    await futureDomain();
    await futureUi();
    const text = `${source('src/calculatorExplorer/calculatorExplorer.domain.ts')}\n${source('src/ui/CalculatorExplorer.tsx')}`;
    expect(text).not.toMatch(/setState|updateProof|generateProof|authoritative|trustStatus\s*=|proof\.latex|sourceEvidence\s*=|writeFile/i);
  });

  it('CE02-QA-38: preserves P=NP as the exact existing catalogue identity and never labels it as hypothesis', async () => {
    await futureDomain();
    const text = source('src/calculatorExplorer/calculatorExplorer.domain.ts');
    expect(text).not.toMatch(/P\s*=\s*NP[^\n]{0,80}(hypothesis|conjecture)/i);
    expect(text).not.toMatch(/P_VS_NP[^\n]{0,80}(replace|rewrite|demote)/i);
  });

  it('CE02-QA-39: maintains an explicit user-action boundary and no automatic calculator/render navigation', async () => {
    await futureUi();
    const text = source('src/ui/CalculatorExplorer.tsx');
    expect(text).toMatch(/onSelectNode/);
    expect(text).not.toMatch(/useEffect[\s\S]{0,800}(onSelectNode|location\.|window\.)/);
    expect(text).not.toMatch(/auto.*launch|auto.*render|automatic/i);
  });

  it('CE02-QA-40: includes the fixed research-only manipulator disclosure in the source-bound UI projection', async () => {
    await futureDomain();
    await futureUi();
    const text = `${source('src/calculatorExplorer/calculatorExplorer.domain.ts')}\n${source('src/ui/CalculatorExplorer.tsx')}`;
    expect(text).toMatch(/не .*расч[её]т|no .*calculation/i);
    expect(text).toMatch(/не .*управлен|no .*control/i);
    expect(text).toMatch(/не .*безопас|no .*safety/i);
  });
});
