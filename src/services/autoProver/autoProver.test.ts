import { describe, expect, it } from 'vitest';
import {
  NodeScheduler,
  ProofAgent,
  Checker,
  RefinementLoop,
  RicisAutoProverEngine,
  type AutoProverProgress,
} from './autoProver';
import type { MapState, ProblemNode, DependencyEdge } from '../../model/types';

describe('RICIS-III Auto Prover Core Engine v7.7 (Full-Map Expansion)', () => {
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
      state: 'resolved',
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
    {
      id: 'phys-skew-product',
      title: 'Геометрический мост 0_F * infty_G',
      description: 'Косое произведение ортогональных векторов',
      state: 'unresolved',
      type: 'core_singularity',
      targetFunction: '0_F * infty_G = det(u,v)',
      zoneIds: ['physics'],
      dependencyIds: ['math-singularity'],
      dependentIds: [],
      fractalDepth: 1,
      economic: {
        costUnresolved: 200000,
        costToSolve: 2000,
        marketGain: 5000000,
        riskLoss: 100000,
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
    {
      id: 'edge-2',
      fromId: 'math-singularity',
      toId: 'phys-skew-product',
      strength: 0.8,
      stateColor: 'blue',
      economicInfluence: 2000,
    },
  ];

  const sampleState: MapState = {
    nodes: sampleNodes,
    edges: sampleEdges,
    zones: [
      { id: 'math', name: 'Математика', description: 'Чистая математика', nodeIds: ['math-singularity', 'node-derived-1'], economicProfile: { costUnresolved: 0, costToSolve: 0, marketGain: 0, riskLoss: 0 } },
      { id: 'physics', name: 'Физика', description: 'Теоретическая физика', nodeIds: ['phys-skew-product'], economicProfile: { costUnresolved: 0, costToSolve: 0, marketGain: 0, riskLoss: 0 } },
    ],
    axioms: [],
    proofs: {},
    agentLogs: [],
  };

  it('NodeScheduler correctly calculates fractal centrality and ranks nodes', () => {
    const scheduler = new NodeScheduler();
    const scores = scheduler.calculateFractalCentrality(sampleNodes, sampleEdges);

    expect(scores.length).toBe(3);
    expect(scores[0].nodeId).toBe('math-singularity');
    expect(scores[0].rank).toBe(1);
    expect(scores[0].centralityScore).toBeGreaterThan(scores[1].centralityScore);
  });

  it('NodeScheduler schedules nodes for all scopes (all, unresolved, zone, selected, singularities)', () => {
    const scheduler = new NodeScheduler();

    // 1. All scope
    const allTasks = scheduler.scheduleNextTasks(sampleState, { scope: 'all' });
    expect(allTasks.length).toBe(3);

    // 2. Unresolved scope
    const unresolvedTasks = scheduler.scheduleNextTasks(sampleState, { scope: 'unresolved' });
    expect(unresolvedTasks.length).toBe(2);
    expect(unresolvedTasks.every((t) => t.node.state !== 'resolved')).toBe(true);

    // 3. Zone scope
    const physTasks = scheduler.scheduleNextTasks(sampleState, { scope: 'zone', zoneId: 'physics' });
    expect(physTasks.length).toBe(1);
    expect(physTasks[0].node.id).toBe('phys-skew-product');

    // 4. Selected scope
    const selectedTasks = scheduler.scheduleNextTasks(sampleState, { scope: 'selected', selectedNodeId: 'node-derived-1' });
    expect(selectedTasks.length).toBe(1);
    expect(selectedTasks[0].node.id).toBe('node-derived-1');
  });

  it('ProofAgent generates valid Lean 4 for singularity ratio (A4) and skew products (A6)', () => {
    const agent = new ProofAgent();

    const a4Proof = agent.generateRicisLeanProof('math-singularity', 'Сингулярность [0/0]', '0_f / 0_g');
    expect(a4Proof).toContain('import RICIS3.Core');
    expect(a4Proof).toContain('theorem proof_math_singularity');
    expect(a4Proof).toContain('ricis_axiom_a4');
    expect(a4Proof).not.toContain('Real');
    expect(a4Proof).not.toContain('lim');

    const a6Proof = agent.generateRicisLeanProof('phys-skew', 'Skew Product', '0_F * infty_G = det(u,v)');
    expect(a6Proof).toContain('import RICIS3.Core');
    expect(a6Proof).toContain('ricis_geometric_bridge_skew_product');
  });

  it('Checker validates generated Lean code without errors using existing verifier (DRY)', () => {
    const agent = new ProofAgent();
    const checker = new Checker();
    const leanCode = agent.generateRicisLeanProof('math-singularity', 'Сингулярность [0/0]', '0_f / 0_g');

    const audit = checker.verify(leanCode, 'Сингулярность [0/0]', '0_f / 0_g');

    expect(audit.isValid).toBe(true);
    expect(audit.errors.length).toBe(0);
  });

  it('RefinementLoop successfully executes iterative proof generation and synthesized proof construction', async () => {
    const refinement = new RefinementLoop();
    const result = await refinement.proveAndRefine(sampleNodes[0], '0_f / 0_g');

    expect(result.success).toBe(true);
    expect(result.iterationsUsed).toBe(1);
    expect(result.transformationLog.l1IdentityVerified).toBe(true);
    expect(result.auditResult.isValid).toBe(true);
    expect(result.synthesizedProof).toBeDefined();
    expect(result.synthesizedProof?.steps.length).toBeGreaterThan(3);
  });

  it('RicisAutoProverEngine runs full map pipeline with real-time progress callback', async () => {
    const engine = new RicisAutoProverEngine();
    const progressLog: AutoProverProgress[] = [];

    const results = await engine.runFullMapProver(sampleState, {}, (p) => {
      progressLog.push({ ...p });
    });

    expect(results.length).toBe(3);
    expect(results.every((r) => r.success)).toBe(true);
    expect(progressLog.length).toBeGreaterThan(0);
    const lastProgress = progressLog[progressLog.length - 1];
    expect(lastProgress.isComplete).toBe(true);
    expect(lastProgress.succeededCount).toBe(3);
  });

  it('RicisAutoProverEngine respects abort signal for graceful cancellation', async () => {
    const engine = new RicisAutoProverEngine();
    const abortController = new AbortController();
    abortController.abort(); // pre-aborted

    const results = await engine.runAutoProverPipeline(sampleState, {
      scope: 'all',
      signal: abortController.signal,
    });

    expect(results.length).toBe(0);
  });
});
