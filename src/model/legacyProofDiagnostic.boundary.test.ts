import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Axiom, ProblemNode, Proof } from './types';

interface LegacyProofDiagnosticModule {
  createLegacyProofDiagnostic(input: { readonly node: ProblemNode; readonly axioms: readonly Axiom[]; readonly documentDelegate: () => Promise<Proof>; readonly override?: unknown }): Promise<unknown>;
}
const CONTRACT_PATH = './legacyProofDiagnostic';
const future = () => import(/* @vite-ignore */ CONTRACT_PATH) as Promise<LegacyProofDiagnosticModule>;
const node = (): ProblemNode => ({ id: 'boundary-node', title: 'Boundary', targetFunction: 'F/G', description: '', state: 'partial', type: 'scientific_task', economic: { costToSolve: 0, costUnresolved: 0, marketGain: 0, riskLoss: 0 }, dependencyIds: [], dependentIds: [], zoneIds: [], fractalDepth: 0 });
const axiom = (): Axiom => ({ id: 'boundary-axiom', sourceNodeId: 'boundary-node', formalStatement: 'L1', usedByNodeIds: [] });
const proof = (): Proof => ({ nodeId: 'boundary-node', targetFunction: 'F/G', steps: [], finalResult: 'diagnostic', latex: 'REQUIRES_CORE_LEAN' });
async function source(): Promise<string> { await future(); return readFileSync('src/model/legacyProofDiagnostic.ts', 'utf8'); }

describe('OIR-02 — authority and provenance boundary', () => {
  it('OIR02-QA-25: exposes no MapState, node, proof, axiom, source or trust write method', async () => {
    const module = await future();
    expect(Object.keys(module).sort()).toEqual(['createLegacyProofDiagnostic']);
  });

  it('OIR02-QA-26: does not manufacture an externalLean payload when the document lacks one', async () => {
    const module = await future();
    const result = await module.createLegacyProofDiagnostic({ node: node(), axioms: [axiom()], documentDelegate: async () => proof() }) as { readonly document: Proof };
    expect(result.document).not.toHaveProperty('externalLean');
  });

  it('OIR02-QA-27: does not write a workflow state, resolved state or trust decision onto the document', async () => {
    const module = await future();
    const result = await module.createLegacyProofDiagnostic({ node: node(), axioms: [axiom()], documentDelegate: async () => proof() }) as { readonly document: Record<string, unknown> };
    for (const key of ['state', 'workflowState', 'resolved', 'trust', 'trustStatus']) expect(result.document).not.toHaveProperty(key);
  });

  it('OIR02-QA-28: does not append or mutate the caller axiom collection', async () => {
    const module = await future();
    const axioms = [axiom()];
    const before = JSON.stringify(axioms);
    await module.createLegacyProofDiagnostic({ node: node(), axioms, documentDelegate: async () => proof() });
    expect(JSON.stringify(axioms)).toBe(before);
  });

  it('OIR02-QA-29: does not mutate the caller node object', async () => {
    const module = await future();
    const input = node();
    const before = JSON.stringify(input);
    await module.createLegacyProofDiagnostic({ node: input, axioms: [axiom()], documentDelegate: async () => proof() });
    expect(JSON.stringify(input)).toBe(before);
  });

  it('OIR02-QA-30: has no P=NP, user Lean/TeX, canonical consent or passport selection path', async () => {
    const text = await source();
    expect(text).not.toMatch(/calculator-pnp|P_VS_NP|user Lean|user TeX|leanEvidenceConsent|leanPassportProjection|sourceBytes|Fingerprint/i);
  });

  it('OIR02-QA-31: has no canonical proof, LaTeX repair, regex rewriting or generic template behavior', async () => {
    const text = await source();
    expect(text).not.toMatch(/buildCanonicalRicisProofLatex|repairAgentLatex|transformCauchy|replace\(|\.match\(|template|canonical/i);
  });

  it('OIR02-QA-32: has no numerical, limit, L’Hôpital or NaN evaluation path', async () => {
    const text = await source();
    expect(text).not.toMatch(/parseFloat|Number\(|Math\.|limit|L'H[oô]pital|NaN|evaluate\(/i);
  });

  it('OIR02-QA-33: has no transport, provider, model, prompt or agent invocation path', async () => {
    const text = await source();
    expect(text).not.toMatch(/postJson|fetch\(|XMLHttpRequest|WebSocket|provider|model|prompt|agent|\/api\//i);
  });

  it('OIR02-QA-34: rejects an override request rather than interpreting authority semantics', async () => {
    const module = await future();
    await expect(module.createLegacyProofDiagnostic({ node: node(), axioms: [axiom()], documentDelegate: async () => proof(), override: { trust: 'LeanVerified' } })).rejects.toThrow();
  });

  it('OIR02-QA-35: cannot generate a document without an injected delegate', async () => {
    const module = await future();
    await expect(module.createLegacyProofDiagnostic({ node: node(), axioms: [axiom()], documentDelegate: undefined as never })).rejects.toThrow();
  });

  it('OIR02-QA-36: preserves document source fields by identity rather than adding source ownership', async () => {
    const module = await future();
    const existing = { ...proof(), source: { id: 'caller-owned-source' } } as Proof;
    const result = await module.createLegacyProofDiagnostic({ node: node(), axioms: [axiom()], documentDelegate: async () => existing }) as { readonly document: Proof };
    expect(result.document).toBe(existing);
    expect((result.document as unknown as { source: unknown }).source).toBe((existing as unknown as { source: unknown }).source);
  });
});
