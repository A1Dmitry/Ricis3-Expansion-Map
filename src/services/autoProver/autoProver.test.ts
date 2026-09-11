import { describe, expect, it } from 'vitest';
import {
  NodeScheduler,
  ProofAgent,
  Checker,
  RefinementLoop,
  RicisAutoProverEngine,
} from './autoProver';
import type { MapState, ProblemNode, DependencyEdge } from '../../model/types';

describe('RICIS-III Auto Prover Core Engine', () => {
  const sampleNodes: ProblemNode[] = [
    {
      id: 'math-singularity',
      title: 'Фундаментальная Сингулярность [0/0]',
      description: 'Центральный узел геометрии RICIS',
      state: 'unresolved',
      type: 'core_singularity',
      targetFunction: '0_f / 0_g',
      zoneIds: ['math'],
      dependencyIds: [],
      dependentIds: ['node-derived-1', 'node-derived-2'],
      fractalDepth: 0,
      economic: {
        costUnresolved: 1000000,
        costToSolve: 1000,
        marketGain: 50000000,
        riskLoss: 500000,
      },
      ricisSolvable: true,
    },
    {
      id: 'node-derived-1',
      title: 'Производная задача A4',
      description: 'Сопряжённая сингулярность',
      state: 'unresolved',
      type: 'derived_problem',
      targetFunction: '0_A / 0_B',
      zoneIds: ['math'],
      dependencyIds: ['math-singularity'],
      dependentIds: [],
      fractalDepth: 1,
      economic: {
        costUnresolved: 50000,
        costToSolve: 500,
        marketGain: 1000000,
        riskLoss: 10000,
      },
      ricisSolvable: true,
    },
  ];

  const sampleEdges: DependencyEdge[] = [
    {
      id: 'edge-1',
      fromId: 'math-singularity',
      toId: 'node-derived-1',
      strength: 1.0,
      stateColor: 'green',
      economicInfluence: 1000,
    },
  ];

  const sampleState: MapState = {
    nodes: sampleNodes,
    edges: sampleEdges,
    zones: [],
    axioms: [],
    proofs: {},
    agentLogs: [],
  };

  it('NodeScheduler correctly calculates fractal centrality and ranks nodes', () => {
    const scheduler = new NodeScheduler();
    const scores = scheduler.calculateFractalCentrality(sampleNodes, sampleEdges);

    expect(scores.length).toBe(2);
    expect(scores[0].nodeId).toBe('math-singularity');
    expect(scores[0].rank).toBe(1);
    expect(scores[0].centralityScore).toBeGreaterThan(scores[1].centralityScore);
  });

  it('ProofAgent generates valid RICIS Lean 4 code without classical mathematics', () => {
    const agent = new ProofAgent();
    const leanCode = agent.generateRicisLeanProof('math-singularity', 'Сингулярность [0/0]', '0_f / 0_g');

    expect(leanCode).toContain('import RICIS3.Core');
    expect(leanCode).toContain('theorem proof_math_singularity');
    expect(leanCode).toContain('ricis_axiom_a4');
    expect(leanCode).not.toContain('Real');
    expect(leanCode).not.toContain('lim');
    expect(leanCode).not.toContain("L'Hopital");
    expect(leanCode).not.toContain('NaN');
  });

  it('Checker validates generated Lean code without errors using existing verifier (DRY)', () => {
    const agent = new ProofAgent();
    const checker = new Checker();
    const leanCode = agent.generateRicisLeanProof('math-singularity', 'Сингулярность [0/0]', '0_f / 0_g');

    const audit = checker.verify(leanCode, 'Сингулярность [0/0]', '0_f / 0_g');

    expect(audit.isValid).toBe(true);
    expect(audit.errors.length).toBe(0);
  });

  it('RefinementLoop successfully executes iterative proof generation and verification', async () => {
    const refinement = new RefinementLoop();
    const result = await refinement.proveAndRefine(sampleNodes[0], '0_f / 0_g');

    expect(result.success).toBe(true);
    expect(result.iterationsUsed).toBe(1);
    expect(result.transformationLog.l1IdentityVerified).toBe(true);
    expect(result.auditResult.isValid).toBe(true);
  });

  it('RicisAutoProverEngine runs complete pipeline on map state', async () => {
    const engine = new RicisAutoProverEngine();
    const results = await engine.runAutoProverPipeline(sampleState, 2);

    expect(results.length).toBe(2);
    expect(results[0].success).toBe(true);
    expect(results[0].nodeId).toBe('math-singularity');
    expect(results[1].success).toBe(true);
    expect(results[1].nodeId).toBe('node-derived-1');
  });
});
