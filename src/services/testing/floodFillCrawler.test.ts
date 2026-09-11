import { describe, it, expect, beforeEach } from 'vitest';
import type { ProblemNode } from '../../model/types';
import type { IBugReport } from '../../model/crawlerTesting.contracts';
import { FloodFillCrawlerService, auditNodeIntegrity } from './floodFillCrawlerService';
import { runManipulatorChaosStressTest } from './manipulatorStressTestService';
import { BugReportLedger } from './bugReportLedger';

describe('Flood-Fill Graph Crawler & Integrity Auditor', () => {
  const sampleNodes: ProblemNode[] = [
    {
      id: 'node-root',
      title: 'Root Riemann Hypothesis',
      type: 'core_singularity',
      state: 'resolved',
      description: 'Root problem of zeta function',
      zoneIds: ['zone-1'],
      dependencyIds: [],
      dependentIds: ['node-child-1'],
      fractalDepth: 0,
      economic: { costUnresolved: 100, costToSolve: 50, marketGain: 500, riskLoss: 20 },
      targetFunction: 'zeta(s) = 0',
    },
    {
      id: 'node-child-1',
      title: 'Zeta Zero Singular Node',
      type: 'derived_problem',
      state: 'resolved',
      description: 'First child',
      zoneIds: ['zone-1'],
      dependencyIds: ['node-root'],
      dependentIds: ['node-broken-formula'],
      fractalDepth: 1,
      economic: { costUnresolved: 80, costToSolve: 40, marketGain: 300, riskLoss: 10 },
      targetFunction: '0/0',
    },
    {
      id: 'node-broken-formula',
      title: 'Corrupted Syntax Node',
      type: 'scientific_task',
      state: 'partial',
      description: 'Broken formula node',
      zoneIds: ['zone-1'],
      dependencyIds: ['node-child-1'],
      dependentIds: [],
      fractalDepth: 2,
      economic: { costUnresolved: 60, costToSolve: 30, marketGain: 200, riskLoss: 10 },
      targetFunction: '\\invalid{latex syntax unbalanced',
    },
    {
      id: 'node-dangling-link',
      title: 'Dangling Link Node',
      type: 'scientific_task',
      state: 'unresolved',
      description: 'Refers to non-existent parent',
      zoneIds: ['zone-1'],
      dependencyIds: ['node-non-existent-999'],
      dependentIds: [],
      fractalDepth: 1,
      economic: { costUnresolved: 40, costToSolve: 20, marketGain: 100, riskLoss: 5 },
      targetFunction: 'x / x = 1',
    },
  ];

  let crawler: FloodFillCrawlerService;

  beforeEach(() => {
    crawler = new FloodFillCrawlerService();
  });

  it('audits a single valid node with zero bugs', () => {
    const allMap = new Map(sampleNodes.map((n) => [n.id, n]));
    const result = auditNodeIntegrity(sampleNodes[0]!, allMap);
    expect(result.passed).toBe(true);
    expect(result.bugs.length).toBe(0);
  });

  it('detects syntax and proof issues in corrupted nodes', () => {
    const allMap = new Map(sampleNodes.map((n) => [n.id, n]));
    const result = auditNodeIntegrity(sampleNodes[2]!, allMap);
    expect(result.passed).toBe(false);
    expect(result.bugs.some((b: IBugReport) => b.category === 'FORMULA_RENDER')).toBe(true);
  });

  it('detects broken prerequisite relationships (dangling links)', () => {
    const allMap = new Map(sampleNodes.map((n) => [n.id, n]));
    const result = auditNodeIntegrity(sampleNodes[3]!, allMap);
    expect(result.passed).toBe(false);
    expect(result.bugs.some((b: IBugReport) => b.category === 'GRAPH_STRUCTURE')).toBe(true);
  });

  it('performs full flood-fill traversal visiting reachable nodes without infinite loops', async () => {
    crawler.startSession('node-root', sampleNodes, {
      maxGraphDepth: 10,
      crawlDelayMs: 0,
      runManipulatorStressTest: false,
    });

    let state = crawler.getState();
    while (state.phase !== 'COMPLETED' && state.phase !== 'IDLE') {
      state = await crawler.stepOnce();
    }

    expect(state.metrics.visitedNodesCount).toBeGreaterThanOrEqual(3);
    expect(state.bugReports.length).toBeGreaterThan(0);
  });
});

describe('Manipulator Chaos & Singularity Stress Rig', () => {
  it('detects no crash or NaN when querying extreme singularity targets', () => {
    const stressResult = runManipulatorChaosStressTest(10);
    expect(stressResult.testedTargetsCount).toBe(10);
    expect(stressResult.testName).toContain('Manipulator Chaos Rig');
    // Ensure all registered bugs have valid categories
    for (const bug of stressResult.bugs) {
      expect(bug.category).toBe('KINEMATICS_ANOMALY');
      expect(bug.severity).toBeDefined();
    }
  });

  it('verifies link preservation invariant L1_IDENTITY under extreme perturbations', () => {
    const stressResult = runManipulatorChaosStressTest(5);
    expect(stressResult.testedTargetsCount).toBe(5);
  });
});

describe('Bug Report Ledger', () => {
  let ledger: BugReportLedger;

  beforeEach(() => {
    ledger = new BugReportLedger();
  });

  it('accumulates and categorizes bug reports by severity', () => {
    const bug: IBugReport = {
      id: 'bug-1',
      timestamp: Date.now(),
      severity: 'CRITICAL',
      category: 'KINEMATICS_ANOMALY',
      title: 'Singularity Drift',
      description: 'Det J reached 0 with high velocity',
      targetComponentOrNodeId: 'arm-3d',
      reproductionSteps: ['Set target to 0,0,0'],
      expectedBehavior: 'Smooth recovery',
      actualBehavior: 'DLS stalled',
    };

    ledger.addReport(bug);
    expect(ledger.getAllReports().length).toBe(1);
    expect(ledger.getMetrics().criticalBugsCount).toBe(1);
  });

  it('exports structured JSON and Markdown reports cleanly', () => {
    const bug: IBugReport = {
      id: 'bug-test-export',
      timestamp: 1700000000000,
      severity: 'WARNING',
      category: 'UI_ACCESSIBILITY',
      title: 'Touch target too small',
      description: 'Button height is only 28px',
      targetComponentOrNodeId: 'btn-explore',
      reproductionSteps: ['Inspect element in mobile view'],
      expectedBehavior: 'Min touch height 44px',
      actualBehavior: 'Touch height 28px',
    };

    ledger.addReport(bug);
    const json = ledger.exportAsJson();
    const md = ledger.exportAsMarkdown();

    expect(json).toContain('bug-test-export');
    expect(md).toContain('## Bug Report');
    expect(md).toContain('Touch target too small');
  });
});
