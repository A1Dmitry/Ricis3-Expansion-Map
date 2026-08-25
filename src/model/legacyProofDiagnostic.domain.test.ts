import { describe, expect, it } from 'vitest';
import type { Axiom, ProblemNode, Proof } from './types';

interface LegacyProofDiagnosticModule {
  createLegacyProofDiagnostic(input: {
    readonly node: ProblemNode;
    readonly axioms: readonly Axiom[];
    readonly documentDelegate: (node: ProblemNode, axioms: readonly Axiom[]) => Promise<Proof>;
    readonly override?: unknown;
  }): Promise<unknown>;
}

const CONTRACT_PATH = './legacyProofDiagnostic';
const future = () => import(/* @vite-ignore */ CONTRACT_PATH) as Promise<LegacyProofDiagnosticModule>;

function node(): ProblemNode {
  return {
    id: 'legacy-diagnostic-node', title: 'Legacy diagnostic node', targetFunction: '0_F / 0_G', description: '',
    state: 'unresolved', type: 'scientific_task', economic: { costToSolve: 0, costUnresolved: 0, marketGain: 0, riskLoss: 0 },
    dependencyIds: [], dependentIds: [], zoneIds: ['math'], fractalDepth: 0,
  };
}

function axiom(): Axiom {
  return { id: 'legacy-axiom', sourceNodeId: 'legacy-diagnostic-node', formalStatement: 'L1', usedByNodeIds: [] };
}

function document(): Proof {
  return {
    nodeId: 'legacy-diagnostic-node', targetFunction: '0_F / 0_G', steps: [], finalResult: 'REQUIRES_CORE_LEAN',
    latex: 'REQUIRES_CORE_LEAN', externalLean: { sourceHash: 'source-hash', sourceLocked: true } as never,
  };
}

async function diagnostic(module: LegacyProofDiagnosticModule, proof = document()): Promise<{ readonly [key: string]: unknown }> {
  return module.createLegacyProofDiagnostic({ node: node(), axioms: [axiom()], documentDelegate: async () => proof }) as Promise<{ readonly [key: string]: unknown }>;
}

describe('OIR-02 — pure local diagnostic ownership', () => {
  it('OIR02-QA-01: classifies every result exactly as LOCAL_DIAGNOSTIC_ONLY', async () => {
    const module = await future();
    expect(await diagnostic(module)).toMatchObject({ classification: 'LOCAL_DIAGNOSTIC_ONLY' });
  });

  it('OIR02-QA-02: retains the exact delegate proof object by reference', async () => {
    const module = await future();
    const proof = document();
    expect((await diagnostic(module, proof)).document).toBe(proof);
  });

  it('OIR02-QA-03: preserves the nested externalLean reference without cloning or writing it', async () => {
    const module = await future();
    const proof = document();
    expect(((await diagnostic(module, proof)).document as Proof).externalLean).toBe(proof.externalLean);
  });

  it('OIR02-QA-04: freezes the outer result and fixed authority record only', async () => {
    const module = await future();
    const result = await diagnostic(module);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.authority as object)).toBe(true);
    expect(Object.isFrozen(result.document as object)).toBe(false);
  });

  it('OIR02-QA-05: fixes all Core, Lean, source, trust and workflow authority flags false', async () => {
    const module = await future();
    expect((await diagnostic(module)).authority).toEqual({
      coreExecuted: false, leanKernelVerified: false, sourceEvidenceWritten: false, trustDecisionWritten: false, workflowStateWritten: false,
    });
  });

  it('OIR02-QA-06: passes the exact caller node to the delegate', async () => {
    const module = await future();
    const inputNode = node();
    let received: ProblemNode | undefined;
    await module.createLegacyProofDiagnostic({ node: inputNode, axioms: [axiom()], documentDelegate: async (value) => { received = value; return document(); } });
    expect(received).toBe(inputNode);
  });

  it('OIR02-QA-07: passes the exact readonly axiom collection to the delegate', async () => {
    const module = await future();
    const axioms = [axiom()] as const;
    let received: readonly Axiom[] | undefined;
    await module.createLegacyProofDiagnostic({ node: node(), axioms, documentDelegate: async (_node, value) => { received = value; return document(); } });
    expect(received).toBe(axioms);
  });

  it('OIR02-QA-08: invokes the delegate exactly once', async () => {
    const module = await future();
    let calls = 0;
    await module.createLegacyProofDiagnostic({ node: node(), axioms: [axiom()], documentDelegate: async () => { calls += 1; return document(); } });
    expect(calls).toBe(1);
  });

  it('OIR02-QA-09: propagates a delegate rejection unchanged without local fallback', async () => {
    const module = await future();
    const failure = new Error('delegate failure');
    await expect(module.createLegacyProofDiagnostic({ node: node(), axioms: [axiom()], documentDelegate: async () => { throw failure; } })).rejects.toBe(failure);
  });

  it('OIR02-QA-10: exposes no state, trust, source, proof-writing or Core/Lean result field', async () => {
    const module = await future();
    const result = await diagnostic(module);
    for (const key of ['state', 'workflowState', 'resolved', 'trust', 'source', 'proof', 'externalLean', 'axiom', 'coreResult', 'leanResult']) {
      expect(result).not.toHaveProperty(key);
    }
  });

  it('OIR02-QA-11: rejects every test-only override rather than granting authority options', async () => {
    const module = await future();
    await expect(module.createLegacyProofDiagnostic({ node: node(), axioms: [axiom()], documentDelegate: async () => document(), override: { resolved: true } })).rejects.toThrow();
  });

  it('OIR02-QA-12: preserves delegate document fields byte-for-byte in the diagnostic payload', async () => {
    const module = await future();
    const proof = document();
    expect((await diagnostic(module, proof)).document).toEqual(proof);
  });
});
