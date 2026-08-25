import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Axiom, MapState, ProblemNode, Proof } from './types';

interface LegacyProofDiagnosticModule {
  createLegacyProofDiagnostic(input: unknown): Promise<unknown>;
}

const CONTRACT_PATH = './legacyProofDiagnostic';
const future = () => import(/* @vite-ignore */ CONTRACT_PATH) as Promise<LegacyProofDiagnosticModule>;

function node(state: ProblemNode['state'] = 'unresolved'): ProblemNode {
  return { id: 'logic-node', title: 'Logic node', targetFunction: '0/0', description: '', state, type: 'scientific_task', economic: { costToSolve: 0, costUnresolved: 0, marketGain: 0, riskLoss: 0 }, dependencyIds: [], dependentIds: [], zoneIds: ['math'], fractalDepth: 0 };
}
function axiom(): Axiom { return { id: 'axiom', sourceNodeId: 'logic-node', formalStatement: 'L1', usedByNodeIds: [] }; }
function proof(): Proof { return { nodeId: 'logic-node', targetFunction: '0/0', steps: [], finalResult: 'diagnostic', latex: 'REQUIRES_CORE_LEAN' }; }
function map(existingProof?: Proof, state: ProblemNode['state'] = 'unresolved'): MapState {
  return { nodes: [node(state)], edges: [], zones: [], axioms: [axiom()], proofs: existingProof ? { 'logic-node': existingProof } : {}, agentLogs: [] };
}
async function logic() { return import('./logic'); }
async function source(): Promise<string> { await future(); return readFileSync('src/model/logic.ts', 'utf8'); }

describe('OIR-02 — narrow solve-node integration', () => {
  it('OIR02-QA-13: exposes the pure diagnostic module before examining logic integration', async () => {
    const module = await future();
    expect(module.createLegacyProofDiagnostic).toBeTypeOf('function');
  });

  it('OIR02-QA-14: preserves the public generateProof compatibility signature', async () => {
    const text = await source();
    expect(text).toMatch(/export async function generateProof\(node: ProblemNode, allAxioms: Axiom\[\]\): Promise<Proof>/);
  });

  it('OIR02-QA-15: imports only the single pure diagnostic factory from the new module', async () => {
    const text = await source();
    expect(text).toMatch(/^import \{ createLegacyProofDiagnostic \} from ['"]\.\/legacyProofDiagnostic['"];$/m);
  });

  it('OIR02-QA-16: uses the diagnostic factory only in the no-existing-proof solve branch', async () => {
    const text = await source();
    const branch = text.slice(text.indexOf('if (existingProof && existingProof.latex)'), text.indexOf('const updatedNode'));
    expect(branch).toMatch(/createLegacyProofDiagnostic\(/);
    expect(branch).toMatch(/documentDelegate: generateProof/);
    expect(branch).toMatch(/proof = diagnostic\.document/);
  });

  it('OIR02-QA-17: preserves exact existing proof reference without invoking a diagnostic delegate branch', async () => {
    await future();
    const existing = proof();
    const result = await (await logic()).solveNodeLogic(map(existing), 'logic-node');
    expect(result.proofs['logic-node']).toBe(existing);
  });

  it('OIR02-QA-18: preserves an existing resolved node state exactly as published', async () => {
    await future();
    const result = await (await logic()).solveNodeLogic(map(proof(), 'resolved'), 'logic-node');
    expect(result.nodes[0]!.state).toBe('resolved');
  });

  it('OIR02-QA-19: keeps a new locally generated document partial, never resolved', async () => {
    await future();
    const result = await (await logic()).solveNodeLogic(map(), 'logic-node');
    expect(result.nodes[0]!.state).toBe('partial');
    expect(result.nodes[0]!.state).not.toBe('resolved');
  });

  it('OIR02-QA-20: retains generated local document under the original node identity', async () => {
    await future();
    const result = await (await logic()).solveNodeLogic(map(), 'logic-node');
    expect(result.proofs['logic-node']).toMatchObject({ nodeId: 'logic-node', finalResult: 'Axiom Extracted: logic-node_resolved' });
  });

  it('OIR02-QA-21: retains published local diagnostic warning and does not introduce a Core claim', async () => {
    await future();
    const result = await (await logic()).solveNodeLogic(map(), 'logic-node');
    expect(result.nodes[0]!.leanWarnings).toEqual(['proof.core.state.localDiagnosticOnly']);
    expect(result.nodes[0]!.leanWarnings).not.toContain('LeanVerified');
  });

  it('OIR02-QA-22: leaves strict Core bridge and authoritative policy out of the logic import surface', async () => {
    const text = await source();
    expect(text).not.toMatch(/^import.*(RicisWasmBridge|IRicisCoreEngine|AuthoritativeProofStatePolicy|ProofRunResponse)/m);
  });

  it('OIR02-QA-23: does not move api transport policy into the new diagnostic module', async () => {
    await future();
    const text = readFileSync('src/model/legacyProofDiagnostic.ts', 'utf8');
    expect(text).not.toMatch(/postJson|apiClient|fetch\(|\/api\/generateProof|provider|prompt/i);
  });

  it('OIR02-QA-24: does not change public logic fallback wording or proof diagnostic status', async () => {
    await future();
    const current = await (await logic()).generateProof(node(), [axiom()]);
    expect(current.latex).toContain('REQUIRES_CORE_LEAN');
    expect(current.finalResult).toBe('Axiom Extracted: logic-node_resolved');
  });
});
