import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const BASELINE = 'ce3aacbdeba5ecd31b462484a82c5bccfe28cad1';
const DOMAIN = './monolithGuidedCaseTrail.domain';
const UI = '../ui/MonolithGuidedCaseTrail';

interface DomainModule {
  buildMonolithGuidedCaseTrail: unknown;
}

const future = () => import(/* @vite-ignore */ DOMAIN) as Promise<DomainModule>;
const source = (path: string) => readFileSync(path, 'utf8');
const protectedPaths = [
  'src/ricisSolutionCatalog/index.ts',
  'src/calculatorExplorer/calculatorExplorer.domain.ts',
  'src/calculatorGraphDescriptor/calculatorGraphDescriptor.seed.ts',
  'src/model/logic.ts',
  'src/model/audit.ts',
  'src/model/authoritativeProofStatePolicy.ts',
  'src/services/ricisCore/RicisWasmBridge.ts',
  'src/model/apiClient.ts',
  'src/industrialRicis/industrialResearchContext.domain.ts',
] as const;

describe('EDU-VIS-01 — closed topology and authority boundary', () => {
  it('EV01-QA-33: has exactly one pure guided-case domain module', async () => {
    const module = await future();
    expect(typeof module.buildMonolithGuidedCaseTrail).toBe('function');
  });

  it('EV01-QA-34: composes the presentational trail from Map3D only through a local open state and existing navigation callback', async () => {
    await future();
    const map = source('src/ui/Map3D.tsx');
    expect(map).toContain("import { MonolithGuidedCaseTrail } from './MonolithGuidedCaseTrail';");
    expect(map).toContain('setIsMonolithGuidedCaseTrailOpen');
    expect(map).toContain('onSelectNode={handleNavigateToNode}');
  });

  it('EV01-QA-35: uses calculator explorer and reviewed relations as the sole trail input', async () => {
    await future();
    const domain = source('src/monolithGuidedCaseTrail/monolithGuidedCaseTrail.domain.ts');
    expect(domain).toMatch(/calculatorExplorer/);
    expect(domain).toMatch(/INITIAL_SOLUTION_RELATIONS/);
    expect(domain).not.toMatch(/CATALOG_SEEDS|INITIAL_CALCULATOR_MONOLITHS|new\s+MapState/i);
  });

  it('EV01-QA-36: has no source/catalogue, graph descriptor or card mutation beyond G2 paths', async () => {
    await future();
    for (const path of protectedPaths.slice(0, 3)) {
      expect(source(path)).toBe(execFileSync('git', ['show', `${BASELINE}:${path}`], { encoding: 'utf8' }));
    }
    expect(source('src/ui/NodeCardDetails.tsx')).toBe(execFileSync('git', ['show', `${BASELINE}:src/ui/NodeCardDetails.tsx`], { encoding: 'utf8' }));
    expect(source('src/ui/SolutionMonolithCard.tsx')).toBe(execFileSync('git', ['show', `${BASELINE}:src/ui/SolutionMonolithCard.tsx`], { encoding: 'utf8' }));
  });

  it('EV01-QA-37: keeps all Core, Lean, proof, state, trust, API and industrial authority sources at baseline bytes', async () => {
    await future();
    for (const path of protectedPaths.slice(3)) {
      expect(source(path)).toBe(execFileSync('git', ['show', `${BASELINE}:${path}`], { encoding: 'utf8' }));
    }
  });

  it('EV01-QA-38: imports no Core, Lean, agent, API, provider or authority module in the new domain', async () => {
    await future();
    const domain = source('src/monolithGuidedCaseTrail/monolithGuidedCaseTrail.domain.ts');
    expect(domain).not.toMatch(/ricisCore|RicisWasm|Authoritative|\blean\b|lake|elan|agent|apiClient|provider|passport|consent|audit|logic/i);
  });

  it('EV01-QA-39: performs no network, storage, browser, worker or external-launch action in future domain/UI source', async () => {
    await future();
    const combined = `${source('src/monolithGuidedCaseTrail/monolithGuidedCaseTrail.domain.ts')}\n${source('src/ui/MonolithGuidedCaseTrail.tsx')}`;
    expect(combined).not.toMatch(/\b(fetch|XMLHttpRequest|WebSocket|window\.open|localStorage|sessionStorage|indexedDB|navigator\.|Worker|import\()\b/);
  });

  it('EV01-QA-40: contains no renderer, canvas, SVG/image asset, calculator execution or industrial-control surface', async () => {
    await future();
    const combined = `${source('src/monolithGuidedCaseTrail/monolithGuidedCaseTrail.domain.ts')}\n${source('src/ui/MonolithGuidedCaseTrail.tsx')}`;
    expect(combined).not.toMatch(/\b(canvas|webgl|iframe|<svg|<img|renderer|renderFrame|calculatorRun|execute|simulation|robotCommand|controlCommand|safetyAssessment|certification)\b/i);
  });

  it('EV01-QA-41: preserves direction by forbidding reverse or task-grounding relation construction', async () => {
    await future();
    const domain = source('src/monolithGuidedCaseTrail/monolithGuidedCaseTrail.domain.ts');
    expect(domain).toMatch(/relation\.fromMonolithId/);
    expect(domain).toMatch(/relation\.toMonolithId/);
    expect(domain).not.toMatch(/dependentNodeId|GROUNDS_DEPENDENT_TASK/);
  });

  it('EV01-QA-42: offers no direct source/proof/state/trust/axiom writer in future sources', async () => {
    await future();
    const combined = `${source('src/monolithGuidedCaseTrail/monolithGuidedCaseTrail.domain.ts')}\n${source('src/ui/MonolithGuidedCaseTrail.tsx')}`;
    expect(combined).not.toMatch(/\b(proofs|externalLean|trustStatus|sourceHash|formalStatement|workflowState|setState)\s*[:=]/);
  });

  it('EV01-QA-43: keeps the OIR candidate-path guard exact and preserves its no-audit-change contract', async () => {
    await future();
    const oir = source('src/model/audit.proofSynthesisContainment.test.ts');
    expect(oir).toContain("'--untracked-files=all'");
    expect(oir).toContain('monolithGuidedCaseTrail');
    expect(source('src/model/audit.ts')).toBe(execFileSync('git', ['show', `${BASELINE}:src/model/audit.ts`], { encoding: 'utf8' }));
  });

  it('EV01-QA-44: declares the UI module as presentational and free of external action imports', async () => {
    await future();
    const ui = source('src/ui/MonolithGuidedCaseTrail.tsx');
    expect(ui).toContain('onSelectNode');
    expect(ui).not.toMatch(/from\s+['"].*(api|agent|store|service|calculatorExplorer|ricisCore|lean)/i);
    expect(ui).not.toContain(UI);
  });
});
