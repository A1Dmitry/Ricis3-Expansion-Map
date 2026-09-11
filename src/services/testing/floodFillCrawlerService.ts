import type { ProblemNode, Proof } from '../../model/types';
import type {
  IBugReport,
  ICrawlerConfig,
  ICrawlerSessionState,
  IFloodFillCrawlerService,
  INodeAuditResult,
} from '../../model/crawlerTesting.contracts';
import { BugReportLedger } from './bugReportLedger';
import { runManipulatorChaosStressTest } from './manipulatorStressTestService';

export const DEFAULT_CRAWLER_CONFIG: ICrawlerConfig = {
  maxGraphDepth: 25,
  verifyLatexRendering: true,
  verifyProofAxioms: true,
  auditTouchTargetSizes: true,
  runManipulatorStressTest: true,
  manipulatorStressIterations: 10,
  crawlDelayMs: 20,
};

/**
 * Checks LaTeX syntax for unbalanced delimiters or obvious parse corruptions
 */
function validateLatexSyntax(expr: string): { valid: boolean; error?: string } {
  if (!expr || expr.trim() === '') {
    return { valid: false, error: 'Empty formula expression' };
  }

  // Count braces
  let openBraces = 0;
  for (let i = 0; i < expr.length; i++) {
    const char = expr[i];
    const prev = i > 0 ? expr[i - 1] : '';
    if (char === '{' && prev !== '\\') openBraces++;
    if (char === '}' && prev !== '\\') openBraces--;
    if (openBraces < 0) {
      return { valid: false, error: 'Unbalanced closing curly brace }' };
    }
  }
  if (openBraces !== 0) {
    return { valid: false, error: `Unclosed curly brace(s): ${openBraces} missing` };
  }

  // Count parentheses
  let openParens = 0;
  for (let i = 0; i < expr.length; i++) {
    const char = expr[i];
    const prev = i > 0 ? expr[i - 1] : '';
    if (char === '(' && prev !== '\\') openParens++;
    if (char === ')' && prev !== '\\') openParens--;
    if (openParens < 0) {
      return { valid: false, error: 'Unbalanced closing parenthesis )' };
    }
  }
  if (openParens !== 0) {
    return { valid: false, error: `Unclosed parenthesis: ${openParens} missing` };
  }

  if (expr.includes('\\invalid{')) {
    return { valid: false, error: 'Contains invalid LaTeX command \\invalid{}' };
  }

  return { valid: true };
}

/**
 * Аудит отдельного узла графа на предмет целостности, формул, связей и доказательств
 */
export function auditNodeIntegrity(
  node: ProblemNode,
  allNodesMap: Map<string, ProblemNode>,
  proofMap?: Map<string, Proof>
): INodeAuditResult {
  const bugs: IBugReport[] = [];

  // 1. Проверка базовых атрибутов
  if (!node.title || node.title.trim().length < 3) {
    bugs.push({
      id: `bug-title-${node.id}`,
      timestamp: Date.now(),
      severity: 'WARNING',
      category: 'UI_ACCESSIBILITY',
      title: `Node title is missing or too short for "${node.id}"`,
      description: `Every graph node must have a meaningful title >= 3 characters.`,
      targetComponentOrNodeId: node.id,
      reproductionSteps: [`Inspect node with ID: ${node.id}`],
      expectedBehavior: 'Meaningful descriptive title.',
      actualBehavior: `Title is "${node.title || ''}"`,
    });
  }

  // 2. Проверка формулы и синтаксиса
  if (!node.targetFunction || node.targetFunction.trim() === '') {
    bugs.push({
      id: `bug-targetfn-missing-${node.id}`,
      timestamp: Date.now(),
      severity: 'WARNING',
      category: 'FORMULA_RENDER',
      title: `Missing targetFunction on node "${node.title}" (${node.id})`,
      description: `Node does not specify a target analytical formula or singularity for evaluation.`,
      targetComponentOrNodeId: node.id,
      reproductionSteps: [`Select node ${node.id}`, `Open NodeCardDetails / Formula sandbox`],
      expectedBehavior: 'Target function should be specified (e.g. 0/0, zeta(s), det(J)).',
      actualBehavior: 'targetFunction is undefined or empty string.',
    });
  } else {
    const latexCheck = validateLatexSyntax(node.targetFunction);
    if (!latexCheck.valid) {
      bugs.push({
        id: `bug-latex-syntax-${node.id}`,
        timestamp: Date.now(),
        severity: 'CRITICAL',
        category: 'FORMULA_RENDER',
        title: `Corrupted LaTeX syntax in targetFunction of "${node.title}"`,
        description: `LaTeX validation error: ${latexCheck.error}`,
        targetComponentOrNodeId: node.id,
        reproductionSteps: [`Load node ${node.id}`, `Render LaTeX via LatexRenderer: "${node.targetFunction}"`],
        expectedBehavior: 'Well-formed LaTeX string with balanced braces and valid commands.',
        actualBehavior: `Parse error: ${latexCheck.error}`,
        telemetryData: { formula: node.targetFunction },
      });
    }
  }

  // 3. Проверка связности графа (Dangling links)
  const deps = node.dependencyIds || [];
  for (const depId of deps) {
    if (!allNodesMap.has(depId)) {
      bugs.push({
        id: `bug-dangling-dep-${node.id}-${depId}`,
        timestamp: Date.now(),
        severity: 'CRITICAL',
        category: 'GRAPH_STRUCTURE',
        title: `Dangling dependency ID "${depId}" in node "${node.title}"`,
        description: `Node refers to a non-existent parent dependency in dependencyIds.`,
        targetComponentOrNodeId: node.id,
        reproductionSteps: [`Traverse dependencyIds of node ${node.id}`, `Query node Map for key "${depId}"`],
        expectedBehavior: `Dependency node "${depId}" must exist in graph database.`,
        actualBehavior: `Node "${depId}" was not found in dataset.`,
      });
    }
  }

  const dependents = node.dependentIds || [];
  for (const childId of dependents) {
    if (!allNodesMap.has(childId)) {
      bugs.push({
        id: `bug-dangling-child-${node.id}-${childId}`,
        timestamp: Date.now(),
        severity: 'WARNING',
        category: 'GRAPH_STRUCTURE',
        title: `Dangling dependent child ID "${childId}" in node "${node.title}"`,
        description: `Node refers to a non-existent dependent child in dependentIds.`,
        targetComponentOrNodeId: node.id,
        reproductionSteps: [`Traverse dependentIds of node ${node.id}`],
        expectedBehavior: `Child node "${childId}" must exist in dataset.`,
        actualBehavior: `Child node "${childId}" not found.`,
      });
    }
  }

  // 4. Проверка доказательств и формальной верификации Lean
  if (node.leanErrors && node.leanErrors.length > 0) {
    bugs.push({
      id: `bug-lean-error-${node.id}`,
      timestamp: Date.now(),
      severity: 'CRITICAL',
      category: 'PROOF_INTEGRITY',
      title: `Formal Lean 4 verification error on "${node.title}"`,
      description: `Lean kernel reported errors: ${node.leanErrors.join('; ')}`,
      targetComponentOrNodeId: node.id,
      reproductionSteps: [`Open Proof Trust Console for node ${node.id}`],
      expectedBehavior: 'Zero formal Lean kernel errors.',
      actualBehavior: `Reported errors: ${node.leanErrors.join(', ')}`,
      telemetryData: { leanErrors: node.leanErrors },
    });
  }

  if (proofMap && proofMap.has(node.id)) {
    const proof = proofMap.get(node.id)!;
    if (proof.externalLean && proof.externalLean.trustStatus === 'REJECTED') {
      bugs.push({
        id: `bug-proof-rejected-${node.id}`,
        timestamp: Date.now(),
        severity: 'CRITICAL',
        category: 'PROOF_INTEGRITY',
        title: `Rejected Lean provenance status on "${node.title}"`,
        description: `External proof was rejected by Lean verification boundary.`,
        targetComponentOrNodeId: node.id,
        reproductionSteps: [`Inspect proof for node ${node.id}`],
        expectedBehavior: 'Proof should have valid trust status.',
        actualBehavior: 'Proof trustStatus is REJECTED.',
      });
    }
  }

  return {
    nodeId: node.id,
    passed: bugs.length === 0,
    bugs,
  };
}

export class FloodFillCrawlerService implements IFloodFillCrawlerService {
  private config: ICrawlerConfig = DEFAULT_CRAWLER_CONFIG;
  private ledger: BugReportLedger = new BugReportLedger();
  private allNodesMap: Map<string, ProblemNode> = new Map();
  private proofMap?: Map<string, Proof>;

  private phase: ICrawlerSessionState['phase'] = 'IDLE';
  private visitedNodes: Set<string> = new Set();
  private queue: string[] = [];
  private currentNodeId: string | null = null;
  private currentKinematicTestName: string | null = null;

  private startTime: number = 0;
  private uiAuditedCount: number = 0;
  private kinematicTestedCount: number = 0;

  public startSession(
    rootNodeId: string,
    allNodes: readonly ProblemNode[],
    config?: Partial<ICrawlerConfig>,
    proofMap?: Map<string, Proof>
  ): void {
    this.config = { ...DEFAULT_CRAWLER_CONFIG, ...config };
    this.allNodesMap = new Map(allNodes.map((n) => [n.id, n]));
    this.proofMap = proofMap;
    this.ledger.clear();

    this.visitedNodes = new Set();
    this.queue = [];
    this.uiAuditedCount = 0;
    this.kinematicTestedCount = 0;
    this.startTime = Date.now();

    // Start with root or first node
    const startNodeId = this.allNodesMap.has(rootNodeId)
      ? rootNodeId
      : allNodes[0]?.id;

    if (startNodeId) {
      this.queue.push(startNodeId);
      this.phase = 'FLOOD_FILL_GRAPH_CRAWL';
      this.currentNodeId = startNodeId;
    } else {
      this.phase = 'COMPLETED';
      this.currentNodeId = null;
    }
  }

  public pauseSession(): void {
    if (this.phase !== 'COMPLETED' && this.phase !== 'IDLE') {
      this.phase = 'PAUSED';
    }
  }

  public resumeSession(): void {
    if (this.phase === 'PAUSED') {
      this.phase = this.queue.length > 0 ? 'FLOOD_FILL_GRAPH_CRAWL' : 'MANIPULATOR_STRESS_RIG';
    }
  }

  public stopSession(): void {
    this.phase = 'COMPLETED';
    this.queue = [];
  }

  public clearBugs(): void {
    this.ledger.clear();
  }

  public async stepOnce(): Promise<ICrawlerSessionState> {
    if (this.phase === 'IDLE' || this.phase === 'PAUSED' || this.phase === 'COMPLETED') {
      return this.getState();
    }

    if (this.phase === 'FLOOD_FILL_GRAPH_CRAWL') {
      if (this.queue.length === 0) {
        // All nodes crawled, transition to UI / Manipulator tests
        if (this.config.runManipulatorStressTest) {
          this.phase = 'MANIPULATOR_STRESS_RIG';
          this.currentKinematicTestName = 'Manipulator 3D Singularity Chaos Rig';
        } else {
          this.phase = 'COMPLETED';
          this.currentNodeId = null;
        }
        return this.getState();
      }

      // Pop next node from queue
      const nextId = this.queue.shift()!;
      this.currentNodeId = nextId;

      if (!this.visitedNodes.has(nextId)) {
        this.visitedNodes.add(nextId);
        const node = this.allNodesMap.get(nextId);

        if (node) {
          // 1. Audit node
          const audit = auditNodeIntegrity(node, this.allNodesMap, this.proofMap);
          if (audit.bugs.length > 0) {
            this.ledger.addReports(audit.bugs);
          }
          this.uiAuditedCount += 3; // audited title, formula, links

          // 2. Discover neighbors (dependencies, dependents, same zone nodes)
          const neighbors: string[] = [
            ...(node.dependencyIds || []),
            ...(node.dependentIds || []),
          ];

          // Check max depth constraint
          if (this.visitedNodes.size < this.config.maxGraphDepth) {
            for (const neighborId of neighbors) {
              if (this.allNodesMap.has(neighborId) && !this.visitedNodes.has(neighborId) && !this.queue.includes(neighborId)) {
                this.queue.push(neighborId);
              }
            }
          }
        }
      }

      // If queue is empty after this step, check if unvisited isolated nodes remain in dataset
      if (this.queue.length === 0 && this.visitedNodes.size < Math.min(this.allNodesMap.size, this.config.maxGraphDepth)) {
        for (const [id] of this.allNodesMap) {
          if (!this.visitedNodes.has(id)) {
            this.queue.push(id);
            break;
          }
        }
      }

      if (this.queue.length === 0) {
        if (this.config.runManipulatorStressTest) {
          this.phase = 'MANIPULATOR_STRESS_RIG';
          this.currentKinematicTestName = 'Manipulator 3D Singularity Chaos Rig';
        } else {
          this.phase = 'COMPLETED';
          this.currentNodeId = null;
        }
      }

      return this.getState();
    }

    if (this.phase === 'MANIPULATOR_STRESS_RIG') {
      const stressResult = runManipulatorChaosStressTest(this.config.manipulatorStressIterations);
      this.kinematicTestedCount += stressResult.testedTargetsCount;
      if (stressResult.bugs.length > 0) {
        this.ledger.addReports(stressResult.bugs);
      }
      this.phase = 'COMPLETED';
      this.currentKinematicTestName = null;
      this.currentNodeId = null;
      return this.getState();
    }

    return this.getState();
  }

  public getState(): ICrawlerSessionState {
    const metrics = this.ledger.getMetrics();
    return {
      phase: this.phase,
      config: this.config,
      metrics: {
        totalNodesDiscovered: this.allNodesMap.size,
        visitedNodesCount: this.visitedNodes.size,
        uiElementsAuditedCount: this.uiAuditedCount,
        kinematicVectorsTestedCount: this.kinematicTestedCount,
        criticalBugsCount: metrics.criticalBugsCount,
        warningBugsCount: metrics.warningBugsCount,
        ergonomicsBugsCount: metrics.ergonomicsBugsCount,
        elapsedTimeMs: this.startTime > 0 ? Date.now() - this.startTime : 0,
      },
      currentNodeId: this.currentNodeId,
      currentKinematicTestName: this.currentKinematicTestName,
      bugReports: this.ledger.getAllReports(),
      visitedNodeIds: Array.from(this.visitedNodes),
      pendingNodeQueue: [...this.queue],
    };
  }

  public exportReportsAsJson(): string {
    return this.ledger.exportAsJson();
  }

  public exportReportsAsMarkdown(): string {
    return this.ledger.exportAsMarkdown();
  }
}
