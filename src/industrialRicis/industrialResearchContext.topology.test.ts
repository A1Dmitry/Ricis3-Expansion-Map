import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { INITIAL_SOLUTION_CATALOG } from '../ricisSolutionCatalog';

interface IndustrialResearchModule {
  buildIndustrialResearchContext(input: { readonly catalog: typeof INITIAL_SOLUTION_CATALOG; readonly planOverride?: unknown }): unknown;
}

const CONTRACT_PATH = './industrialResearchContext.domain';
const future = () => import(/* @vite-ignore */ CONTRACT_PATH) as Promise<IndustrialResearchModule>;
async function source(): Promise<string> {
  await future();
  return readFileSync('src/industrialRicis/industrialResearchContext.domain.ts', 'utf8');
}

describe('INDUSTRIAL-RICIS-01 — topology, immutability and release separation', () => {
  it('IND01-QA-41: imports only catalogue type contracts in the pure production domain', async () => {
    const module = await future();
    expect(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG })).toMatchObject({ kind: 'PROJECTED' });
    const text = await source();
    expect(text.match(/^import .* from /gm) ?? []).toHaveLength(1);
    expect(text).toMatch(/^import type \{[\s\S]*\} from ['"]\.\.\/ricisSolutionCatalog['"];$/m);
  });

  it('IND01-QA-42: has no Core, calculator executor, local reducer, Lean, consent, Passport, agent, provider or model dependency', async () => {
    const text = await source();
    expect(text).not.toMatch(/^import.*(RicisCore|Wasm|calculatorGraphDescriptor|localRicisReducer|lean|Consent|Passport|agent|provider|model)/im);
  });

  it('IND01-QA-43: has no browser, network, server, API, source-read or external action dependency', async () => {
    const text = await source();
    expect(text).not.toMatch(/^import.*(react|three|browser|window|fetch|network|server|api|http|upload|readFile|child_process)/im);
    expect(text).not.toMatch(/\b(fetch|XMLHttpRequest|WebSocket|window\.open|readFileSync|exec|spawn)\b/);
  });

  it('IND01-QA-44: has no robotics-control, telemetry, industrial-protocol or device dependency', async () => {
    const text = await source();
    expect(text).not.toMatch(/^import.*(ROS|OPC|PLC|SCADA|telemetry|sensor|device|actuator|robot)/im);
    expect(text).not.toMatch(/\b(ros|opcua|plc|scada|telemetry|sensor|actuator)\b/i);
  });

  it('IND01-QA-45: has no UI, map, store, persistence or migration dependency', async () => {
    const text = await source();
    expect(text).not.toMatch(/^import.*(component|Map|store|persist|migration|initialMap|ProblemNode|DependencyEdge)/im);
    expect(text).not.toMatch(/\b(localStorage|sessionStorage|indexedDB)\b/);
  });

  it('IND01-QA-46: does not mutate the supplied catalogue, monolith or relation arrays', async () => {
    const module = await future();
    const before = JSON.stringify(INITIAL_SOLUTION_CATALOG);
    module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG });
    expect(JSON.stringify(INITIAL_SOLUTION_CATALOG)).toBe(before);
  });

  it('IND01-QA-47: cannot expose a writer or operational capability method', async () => {
    const module = await future();
    const result = module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG }) as { readonly context: Record<string, unknown> };
    for (const key of ['write', 'save', 'dispatch', 'control', 'execute', 'simulate', 'assessSafety', 'certify', 'recommend']) {
      expect(result.context).not.toHaveProperty(key);
    }
  });

  it('IND01-QA-48: contains no version, commit, tag, push, publish or release behavior', async () => {
    const text = await source();
    expect(text).not.toMatch(/\b(npm version|git commit|git push|publish|release:check|APP_VERSION)\b/i);
  });

  it('IND01-QA-49: never references P=NP, user Lean/TeX or canonical consent/passport/agent evidence records directly', async () => {
    const text = await source();
    expect(text).not.toMatch(/calculator-pnp|user Lean|user TeX|leanEvidenceConsent|leanPassportProjection|agentRicis/i);
  });

  it('IND01-QA-50: uses fixed informational disclosure rather than an industrial operation or safety verdict', async () => {
    const module = await future();
    const result = module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG }) as { readonly context: { readonly disclosure: Record<string, unknown> } };
    expect(result.context.disclosure).toMatchObject({
      classification: 'NOT_AN_INDUSTRIAL_CONTROL_OR_SAFETY_DECISION',
      calculationPerformed: false,
      runtimeExecuted: false,
      controlCommandProduced: false,
      safetyAssessmentPerformed: false,
      certificationOrComplianceConclusion: false,
    });
  });
});
