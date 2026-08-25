import { describe, expect, it } from 'vitest';
import { INITIAL_SOLUTION_CATALOG } from '../ricisSolutionCatalog';

interface IndustrialResearchModule {
  buildIndustrialResearchContext(input: { readonly catalog: typeof INITIAL_SOLUTION_CATALOG; readonly planOverride?: unknown }): unknown;
}

const CONTRACT_PATH = './industrialResearchContext.domain';
const future = () => import(/* @vite-ignore */ CONTRACT_PATH) as Promise<IndustrialResearchModule>;

function rejected(value: unknown, reason: string) {
  expect(value).toMatchObject({ kind: 'REJECTED', reason });
}

describe('INDUSTRIAL-RICIS-01 — closed inventory and operational authority boundary', () => {
  it('IND01-QA-28: rejects a missing approved gravitational source record', async () => {
    const module = await future();
    const monoliths = INITIAL_SOLUTION_CATALOG.monoliths.filter((item) => item.id !== 'calculator-gravitational');
    rejected(module.buildIndustrialResearchContext({ catalog: { ...INITIAL_SOLUTION_CATALOG, monoliths } }), 'REJECTED_CLOSED_INVENTORY');
  });

  it('IND01-QA-29: rejects a test-only appended calculator record', async () => {
    const module = await future();
    rejected(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG, planOverride: { append: 'calculator-riemann' } }), 'REJECTED_CLOSED_INVENTORY');
  });

  it('IND01-QA-30: rejects a reordered closed record plan', async () => {
    const module = await future();
    rejected(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG, planOverride: { reorder: true } }), 'REJECTED_CLOSED_INVENTORY');
  });

  it('IND01-QA-31: rejects any existing calculator-bound node substitution', async () => {
    const module = await future();
    rejected(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG, planOverride: { existingNodeId: 'registry-118' } }), 'REJECTED_UNAPPROVED_EXISTING_NODE');
  });

  it('IND01-QA-32: rejects P=NP, CDCC, Navier–Stokes and LLM-gradient by closed identity', async () => {
    const module = await future();
    for (const monolithId of ['calculator-pnp', 'calculator-cdcc', 'calculator-navier_stokes', 'calculator-llm_gradient']) {
      rejected(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG, planOverride: { append: monolithId } }), 'REJECTED_CLOSED_INVENTORY');
    }
  });

  it('IND01-QA-33: does not use Jacobian text to associate the kinematic record with registry-120', async () => {
    const module = await future();
    rejected(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG, planOverride: { jacobianName: true, existingNodeId: 'registry-120' } }), 'REJECTED_UNAPPROVED_EXISTING_NODE');
  });

  it('IND01-QA-34: rejects a source identity mutation request', async () => {
    const module = await future();
    rejected(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG, planOverride: { mutateSourceIdentity: true } }), 'REJECTED_SOURCE_IDENTITY');
  });

  it('IND01-QA-35: rejects an unknown or malformed plan override', async () => {
    const module = await future();
    rejected(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG, planOverride: { unknown: 'robot-field-match' } }), 'REJECTED_CLOSED_INVENTORY');
  });

  it('IND01-QA-36: does not turn category, formula, robot, field, safety or twin words into inventory inference', async () => {
    const module = await future();
    for (const key of ['title', 'category', 'formula', 'robot', 'field', 'safety', 'twin']) {
      rejected(module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG, planOverride: { fuzzy: key } }), 'REJECTED_CLOSED_INVENTORY');
    }
  });

  it('IND01-QA-37: cannot emit a control command, recommendation, simulation, prediction or runtime result', async () => {
    const module = await future();
    const result = module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG }) as { readonly context: Record<string, unknown> };
    for (const key of ['command', 'control', 'recommendation', 'simulation', 'prediction', 'runtimeResult', 'trajectory', 'inverseKinematics']) {
      expect(result.context).not.toHaveProperty(key);
    }
  });

  it('IND01-QA-38: cannot emit a safety, risk, compliance, certification or legal conclusion', async () => {
    const module = await future();
    const result = module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG }) as { readonly context: Record<string, unknown> };
    for (const key of ['safetyFinding', 'riskAssessment', 'riskScore', 'compliance', 'certification', 'legalAdvice', 'safeToOperate']) {
      expect(result.context).not.toHaveProperty(key);
    }
  });

  it('IND01-QA-39: cannot write source, state, proof, Lean, axiom, trust, human or agent authority', async () => {
    const module = await future();
    const result = module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG }) as { readonly context: Record<string, unknown> };
    for (const key of ['sourceWriter', 'setState', 'proof', 'externalLean', 'axiom', 'trust', 'humanDecision', 'agentCompetence']) {
      expect(result.context).not.toHaveProperty(key);
    }
  });

  it('IND01-QA-40: uses only immutable source-bound presentation provenance', async () => {
    const module = await future();
    const result = module.buildIndustrialResearchContext({ catalog: INITIAL_SOLUTION_CATALOG }) as { readonly context: { readonly records: readonly Record<string, unknown>[] } };
    for (const record of result.context.records) {
      expect(record).toMatchObject({ provenance: { kind: 'CALCULATOR_CATALOG_READ_ONLY', catalogDerived: true } });
      expect(record).not.toHaveProperty('operationalAuthority');
      expect(record).not.toHaveProperty('runtimeStatus');
    }
  });
});
