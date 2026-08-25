/// <reference types="vitest/globals" />

import { readFileSync } from 'node:fs';
import { auditMapRicisProofIntegrity } from './audit';
import { auditAndFixMapGraph } from './migrationAudit';
import type { MapState, ProblemNode, Proof } from './types';

const SOURCE_LOCKED_PNP_PROOF: Proof = {
  nodeId: 'pnp-source-bound',
  targetFunction: 'MersenneRingReduction(P, NP)',
  steps: [
    {
      phase: 'owner-derivation',
      name: 'RICIS P=NP source-bound derivation',
      action: 'Preserve immutable monolith provenance',
      expression: 'P_RICIS = NP_RICIS',
    },
  ],
  finalResult: 'P = NP (owner-authorized RICIS result)',
  latex: 'OWNER-BOUND-RICIS-PNP-SOURCE::cab7b258f7a753bf9914008a160412cda1dec68b1e1facbe4da3ac86e3bbf01a',
  externalLean: {
    sourceHash: 'owner-bound-pnp-source-v77',
    submittedAt: '2026-08-24T00:00:00.000Z',
    sourceLocked: true,
    trustStatus: 'REQUIRES_CORE_LEAN',
  },
};

function node(overrides: Partial<ProblemNode> = {}): ProblemNode {
  return {
    id: 'pnp-source-bound',
    title: 'P vs NP — RICIS Mersenne monolith',
    description: 'Source-bound migration preservation fixture.',
    state: 'partial',
    type: 'scientific_task',
    targetFunction: 'MersenneRingReduction(P, NP)',
    zoneIds: ['informatics'],
    dependencyIds: [],
    dependentIds: [],
    fractalDepth: 1,
    economic: { costToSolve: 1, costUnresolved: 2, marketGain: 3, riskLoss: 4 },
    ...overrides,
  };
}

function map(nodes: ProblemNode[], proofs: MapState['proofs']): MapState {
  return {
    nodes,
    edges: [],
    zones: [
      {
        id: 'informatics',
        name: 'Informatics',
        description: 'Informatics',
        nodeIds: nodes.map(candidate => candidate.id),
        economicProfile: { costToSolve: 0, costUnresolved: 0, marketGain: 0, riskLoss: 0 },
      },
    ],
    axioms: [],
    proofs,
    agentLogs: [],
  };
}

function auditInPreserveMode(input: MapState) {
  return auditMapRicisProofIntegrity(input, { proofRepairMode: 'preserve' });
}

describe('OIR-01 — source-bound proof preservation', () => {
  it('preserves a source-bound P=NP Proof object byte-for-byte and by identity across migration', () => {
    const originalProof = { ...SOURCE_LOCKED_PNP_PROOF };
    const input = map([node()], { [originalProof.nodeId]: originalProof });

    const migrated = auditAndFixMapGraph(input);
    const resultingProof = migrated.map.proofs[originalProof.nodeId];

    expect(resultingProof).toBe(originalProof);
    expect(resultingProof).toStrictEqual(originalProof);
    expect(resultingProof?.externalLean).toBe(originalProof.externalLean);
    expect(migrated.map.nodes.find(candidate => candidate.id === originalProof.nodeId)?.state).toBe('partial');
  });

  it('does not create a P=NP proof when a P-vs-NP/Mersenne node enters migration without one', () => {
    const input = map([node({ id: 'pnp-no-proof' })], {});

    const migrated = auditAndFixMapGraph(input);

    expect(migrated.map.proofs['pnp-no-proof']).toBeUndefined();
    expect(migrated.map.nodes.find(candidate => candidate.id === 'pnp-no-proof')?.state).toBe('partial');
  });

  it('preserve audit mode leaves an invalid existing proof object and its LaTex untouched', () => {
    const invalidProof: Proof = {
      ...SOURCE_LOCKED_PNP_PROOF,
      nodeId: 'invalid-source-bound',
      latex: 'OWNER-BOUND-UNREPAIRED-SOURCE::invalid-for-legacy-audit',
    };
    const input = map([node({ id: invalidProof.nodeId, title: 'Mersenne source identity' })], {
      [invalidProof.nodeId]: invalidProof,
    });

    const audited = auditInPreserveMode(input);

    expect(audited.repairedProofsCount).toBe(0);
    expect(audited.map.proofs[invalidProof.nodeId]).toBe(invalidProof);
    expect(audited.map.proofs[invalidProof.nodeId]?.latex).toBe(invalidProof.latex);
    expect(audited.map.proofs[invalidProof.nodeId]?.externalLean).toBe(invalidProof.externalLean);
  });

  it('preserves the default audit caller source identity after OIR-03 containment', () => {
    const invalidProof: Proof = {
      ...SOURCE_LOCKED_PNP_PROOF,
      nodeId: 'legacy-repair-fixture',
      latex: 'legacy malformed proof text without a validation marker',
    };
    const input = map([node({ id: invalidProof.nodeId, title: 'Unrelated legacy proof fixture' })], {
      [invalidProof.nodeId]: invalidProof,
    });

    const audited = auditMapRicisProofIntegrity(input);

    expect(audited.repairedProofsCount).toBe(0);
    expect(audited.map.proofs[invalidProof.nodeId]).toBe(invalidProof);
    expect(audited.map.proofs[invalidProof.nodeId]?.latex).toBe(invalidProof.latex);
    expect(audited.map.proofs[invalidProof.nodeId]?.externalLean).toBe(invalidProof.externalLean);
  });

  it('contains no P-vs-NP keyword template writer or canonical-proof builder dependency in migration source', () => {
    const source = readFileSync('src/model/migrationAudit.ts', 'utf8');

    expect(source).not.toContain("import { buildCanonicalRicisProofLatex } from './ricisCoreRules';");
    expect(source).not.toContain('const isPvsNP =');
    expect(source).not.toContain("finalResult: 'P = NP [Детерминированное побитовое сведение в кольцах Мерсенна M = 2^k - 1]'");
    expect(source).toContain("auditMapRicisProofIntegrity(tempMap, { proofRepairMode: 'preserve' })");
  });

  it('keeps migration isolated from agent, Core, Lean toolchain and generic proof generation', () => {
    const source = readFileSync('src/model/migrationAudit.ts', 'utf8');

    for (const forbidden of [
      '/api/generateProof',
      'callAIWithFallback',
      'RicisWasmBridge',
      'externalLean',
      'lean4CodeSnippet',
      'Gemini',
      'NaN',
      'limit',
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });
});
