import { describe, expect, it } from 'vitest';
import { INITIAL_SOLUTION_CATALOG } from '../ricisSolutionCatalog';

interface AssuranceBriefModule {
  buildVerifiableAiAssuranceBrief(input: {
    readonly catalog: typeof INITIAL_SOLUTION_CATALOG;
    readonly monolithId?: string;
    readonly authoritySnapshot?: unknown;
    readonly disclosureRequest?: unknown;
  }): unknown;
}

const CONTRACT_PATH = './assuranceBrief.domain';
const future = () => import(/* @vite-ignore */ CONTRACT_PATH) as Promise<AssuranceBriefModule>;

function rejected(value: unknown, reason: string): void {
  expect(value).toMatchObject({ kind: 'REJECTED', reason });
}

function brief(value: unknown): Record<string, unknown> {
  expect(value).toMatchObject({ kind: 'PROJECTED' });
  return (value as { readonly brief: Record<string, unknown> }).brief;
}

describe('MARKET-RICIS-01 — closed inventory and authority boundary', () => {
  it('MAR01-QA-25: rejects every non-LLM calculator monolith instead of projecting a generic brief', async () => {
    const module = await future();
    for (const monolith of INITIAL_SOLUTION_CATALOG.monoliths.filter((item) => item.id !== 'calculator-llm_gradient')) {
      rejected(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG, monolithId: monolith.id }), 'REJECTED_UNAPPROVED_MONOLITH');
    }
  });

  it('MAR01-QA-26: specifically rejects owner-authorized P=NP and preserves its existing binding', async () => {
    const module = await future();
    rejected(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG, monolithId: 'calculator-p_vs_np' }), 'REJECTED_UNAPPROVED_MONOLITH');
    expect(INITIAL_SOLUTION_CATALOG.existingNodeBindings).toContainEqual({ monolithId: 'calculator-p_vs_np', nodeId: 'informatics-complexity' });
  });

  it('MAR01-QA-27: specifically rejects CDCC and Navier–Stokes existing calculator bindings', async () => {
    const module = await future();
    rejected(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG, monolithId: 'calculator-cdcc' }), 'REJECTED_UNAPPROVED_MONOLITH');
    rejected(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG, monolithId: 'calculator-navier_stokes' }), 'REJECTED_UNAPPROVED_MONOLITH');
  });

  it('MAR01-QA-28: cannot select the source through title, category, family or LLM keyword inference', async () => {
    const module = await future();
    for (const override of [
      { title: 'LLM Gradient Stability Monolith' },
      { category: 'Applied Computation' },
      { familyId: 'foundations' },
      { keyword: 'gradient' },
    ]) {
      rejected(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG, monolithId: JSON.stringify(override) }), 'REJECTED_UNAPPROVED_MONOLITH');
    }
  });

  it('MAR01-QA-29: rejects a request for compliance, certification, safety, deployment or legal conclusion', async () => {
    const module = await future();
    for (const request of ['COMPLIANT', 'CERTIFIED', 'SAFE', 'DEPLOYMENT_APPROVED', 'LEGAL_ADVICE']) {
      rejected(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG, disclosureRequest: request }), 'REJECTED_DISCLOSURE_REQUEST');
    }
  });

  it('MAR01-QA-30: has no resolved, green, trust, Lean-verified or Core-success result semantics', async () => {
    const module = await future();
    const output = JSON.stringify(brief(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG })));
    expect(output).not.toMatch(/resolved|green|trust|lean.?verified|core.?success/i);
  });

  it('MAR01-QA-31: has no user Lean/TeX bytes, source capture, SHA creation or evidence-ledger payload', async () => {
    const module = await future();
    const output = JSON.stringify(brief(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG })));
    expect(output).not.toMatch(/sourceBytes|latex|Fingerprint|capture|idempotency|ledger|sha256:v1/i);
  });

  it('MAR01-QA-32: prevents caller override of the fixed non-certification disclosure', async () => {
    const module = await future();
    rejected(module.buildVerifiableAiAssuranceBrief({
      catalog: INITIAL_SOLUTION_CATALOG,
      disclosureRequest: { classification: 'COMPLIANT' },
    }), 'REJECTED_DISCLOSURE_REQUEST');
  });

  it('MAR01-QA-33: has no proof, node state, trust or axiom mutation function in output', async () => {
    const module = await future();
    const output = brief(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG }));
    for (const key of ['setState', 'resolveNode', 'acceptProof', 'writeTrust', 'addAxiom', 'mutate']) {
      expect(output).not.toHaveProperty(key);
    }
  });

  it('MAR01-QA-34: exposes no provider, model, prompt, browser, network or calculator-launch result', async () => {
    const module = await future();
    const output = brief(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG }));
    for (const key of ['provider', 'model', 'prompt', 'launch', 'href', 'browser', 'network']) {
      expect(output).not.toHaveProperty(key);
    }
    expect(output.source).toMatchObject({ repositoryUrl: expect.stringMatching(/^https:\/\//) });
  });

  it('MAR01-QA-35: exposes no agent training, retraining or human-decision route', async () => {
    const module = await future();
    const output = JSON.stringify(brief(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG })));
    expect(output).not.toMatch(/trainAgent|retrain|decisionApplied|humanAction/i);
  });

  it('MAR01-QA-36: exposes no map, store, persistence, migration or UI side effect payload', async () => {
    const module = await future();
    const output = brief(module.buildVerifiableAiAssuranceBrief({ catalog: INITIAL_SOLUTION_CATALOG }));
    for (const key of ['mapStore', 'persistence', 'migration', 'render', 'initialMap', 'component']) {
      expect(output).not.toHaveProperty(key);
    }
  });
});
