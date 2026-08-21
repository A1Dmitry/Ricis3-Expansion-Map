import { describe, expect, it } from 'vitest';
import { sanitizeMap } from './persistence';
import type { MapState, ProblemNode, Proof } from './types';

function node(id: string, state: ProblemNode['state']): ProblemNode {
  return {
    id,
    title: `Node ${id}`,
    description: 'Persistence sanitation fixture',
    state,
    type: 'scientific_task',
    targetFunction: '0_5 * inf_3',
    zoneIds: ['math'],
    dependencyIds: [],
    dependentIds: [],
    fractalDepth: 1,
    economic: { costToSolve: 1, costUnresolved: 2, marketGain: 3, riskLoss: 4 },
  };
}

function proof(nodeId: string): Proof {
  return {
    nodeId,
    targetFunction: '0_5 * inf_3',
    steps: [{ phase: 1, name: 'A6', action: 'bridge', expression: '15' }],
    finalResult: '15',
    latex: 'RICIS A6: 0_F * \\infty_G = F * G; specification https://doi.org/10.5281/zenodo.21836220',
  };
}

function state(nodes: ProblemNode[], proofs: MapState['proofs'] = {}): MapState {
  return {
    nodes,
    edges: [],
    zones: [{
      id: 'math',
      name: 'Math',
      description: 'Math',
      nodeIds: [],
      economicProfile: { costToSolve: 0, costUnresolved: 0, marketGain: 0, riskLoss: 0 },
    }],
    axioms: [],
    proofs,
    agentLogs: [],
  };
}

describe('sanitizeMap proof-state integrity', () => {
  it('demotes resolved nodes without a proof record to partial', () => {
    const sanitized = sanitizeMap(state([node('unproven', 'resolved')]));

    expect(sanitized.nodes[0]?.state).toBe('partial');
  });

  it('demotes resolved nodes backed only by a locally valid proof record', () => {
    const sanitized = sanitizeMap(state([node('local-proof', 'resolved')], { 'local-proof': proof('local-proof') }));

    expect(sanitized.nodes[0]?.state).toBe('partial');
    expect(sanitized.proofs['local-proof']?.nodeId).toBe('local-proof');
  });

  it('demotes persisted trusted external contracts without authoritative Core Lean status', () => {
    const trustedAxiomProof: Proof = {
      ...proof('trusted-axiom'),
      externalLean: {
        sourceHash: 'fixture-trusted-axiom',
        submittedAt: '2026-08-21T00:00:00.000Z',
        sourceLocked: true,
        trustStatus: 'TRUSTED_AXIOM',
      },
    };

    const sanitized = sanitizeMap(state([node('trusted-axiom', 'resolved')], { 'trusted-axiom': trustedAxiomProof }));

    expect(sanitized.nodes[0]?.state).toBe('partial');
  });

  it('preserves resolved nodes only when persisted Lean evidence is authoritative', () => {
    const leanVerifiedProof: Proof = {
      ...proof('lean-verified'),
      externalLean: {
        sourceHash: 'fixture-lean-verified',
        submittedAt: '2026-08-21T00:00:00.000Z',
        sourceLocked: true,
        trustStatus: 'LEAN_VERIFIED',
      },
    };

    const sanitized = sanitizeMap(state([node('lean-verified', 'resolved')], { 'lean-verified': leanVerifiedProof }));

    expect(sanitized.nodes[0]?.state).toBe('resolved');
  });

  it('does not demote unresolved or partial nodes', () => {
    const sanitized = sanitizeMap(state([node('unresolved', 'unresolved'), node('partial', 'partial')]));

    expect(sanitized.nodes.map(candidate => candidate.state)).toEqual(['unresolved', 'partial']);
  });
});
