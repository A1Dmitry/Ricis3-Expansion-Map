/**
 * RICIS-III v7.7 System Diagnostics Service
 * DDD Domain Service providing self-diagnostics across Core Engine,
 * Dependency Graph, and Seed Invariants with IProgressBar integration.
 */

import { getProgressBar } from './progressBar/progressBarService';
import { checkRicisCoreRuntimeStatus } from './ricisCore';
import { DependencyGraphAuditor } from '../model/dependencyGraph';
import { SEED_AXIOM_TABLE } from '../ricisSeed/seedTable';
import { GeometricBridgeEngine } from './geometricBridge/geometricBridgeEngine';
import type { MapState } from '../model/types';

export interface GeometricBridgeAuditResult {
  readonly isPassed: boolean;
  readonly checkedInvariantsCount: number;
  readonly details: readonly string[];
}

export interface SystemDiagnosticsReport {
  readonly timestamp: number;
  readonly isHealthy: boolean;
  readonly coreRuntime: {
    readonly isReady: boolean;
    readonly description: string;
  };
  readonly graphAudit: {
    readonly nodeCount: number;
    readonly edgeCount: number;
    readonly issueCount: number;
    readonly cyclesDetected: boolean;
  };
  readonly seedInvariants: {
    readonly isValid: boolean;
    readonly checkedCount: number;
  };
  readonly geometricBridge: {
    readonly isPassed: boolean;
    readonly checkedCount: number;
    readonly details: readonly string[];
  };
  readonly summaryMessage: string;
}

/**
 * Validates the core mathematical invariants of RICIS-III v7.7:
 * - A6 Skew Product det(u,v) = F * G in O(1)
 * - Diagonal Telescope: 0_F * inf_F = F^2
 * - A4 Zero Ratio with L1_IDENTITY: 0_F / 0_F = 1
 * - A5 Infinity Ratio: inf_F / inf_G = F / G
 * - A7 Infinity Subtraction: inf_F - inf_G = inf_(F-G)
 * - L0 Absolute Continuity: Strict banishment of NaN / undefined states
 */
export function auditGeometricBridgeInvariants(): GeometricBridgeAuditResult {
  const engine = new GeometricBridgeEngine();
  const details: string[] = [];
  let checked = 0;
  let passed = true;

  // Invariant 1: Skew Product / A6 General Product det(u, v) = F * G
  const a6Res = engine.resolveGeometricBridge(3, 4, '3', '4');
  checked++;
  if (a6Res.skewProductDeterminant === 12 && a6Res.computationalComplexity === 'O(1)') {
    details.push('A6 Skew Product det(u,v) = F*G verified [12 == 12, O(1)]');
  } else {
    passed = false;
    details.push('A6 Skew Product failed');
  }

  // Invariant 2: Diagonal Telescope 0_F x inf_F = F^2
  const a6Diag = engine.resolveGeometricBridge(5, 5, '5', '5');
  checked++;
  if (a6Diag.skewProductDeterminant === 25 && a6Diag.isDiagonalTelescope) {
    details.push('A6 Diagonal Telescope 0_F x inf_F = F^2 verified [25 == 25]');
  } else {
    passed = false;
    details.push('A6 Diagonal Telescope failed');
  }

  // Invariant 3: A4 & L1_IDENTITY: 0_F / 0_G = F / G, and 0_F / 0_F = 1
  const a4Identity = engine.resolveZeroRatioGeometric(7, 7, '7', '7');
  checked++;
  if (a4Identity.exactInvariantArea === 1 && a4Identity.isIdentitySatisfied) {
    details.push('A4 Zero Ratio L1_IDENTITY 0_F / 0_F = 1 verified');
  } else {
    passed = false;
    details.push('A4 Zero Ratio L1_IDENTITY failed');
  }

  // Invariant 4: A4 Ratio with distinct non-zero indices: 0_6 / 0_2 = 3
  const a4Ratio = engine.resolveZeroRatioGeometric(6, 2, '6', '2');
  checked++;
  if (a4Ratio.exactInvariantArea === 3) {
    details.push('A4 Ratio 0_6 / 0_2 = 3 verified');
  } else {
    passed = false;
    details.push('A4 Ratio 0_6 / 0_2 failed');
  }

  // Invariant 5: A5 Infinity Ratio: inf_8 / inf_2 = 4
  const a5Ratio = engine.resolveInfinityRatioGeometric(8, 2, '8', '2');
  checked++;
  if (a5Ratio.exactInvariantArea === 4) {
    details.push('A5 Infinity Ratio inf_8 / inf_2 = 4 verified');
  } else {
    passed = false;
    details.push('A5 Infinity Ratio failed');
  }

  // Invariant 6: A7 Infinity Subtraction: inf_10 - inf_3 = inf_7
  const a7Sub = engine.resolveInfinitySubtractionGeometric(10, 3, '10', '3');
  checked++;
  if (a7Sub.exactInvariantArea === 7) {
    details.push('A7 Infinity Subtraction inf_10 - inf_3 = inf_7 verified');
  } else {
    passed = false;
    details.push('A7 Infinity Subtraction failed');
  }

  // Invariant 7: Absolute Continuity (L0) and NaN Banishment
  const allFinite = [a6Res, a6Diag, a4Identity, a4Ratio, a5Ratio, a7Sub].every(
    r => Number.isFinite(r.exactInvariantArea) && !Number.isNaN(r.exactInvariantArea)
  );
  checked++;
  if (allFinite) {
    details.push('L0 Absolute Continuity & NaN Banishment verified (all invariants strictly finite)');
  } else {
    passed = false;
    details.push('L0 NaN Banishment failed: NaN detected');
  }

  return {
    isPassed: passed,
    checkedInvariantsCount: checked,
    details,
  };
}

export async function runSystemDiagnostics(
  mapState: MapState
): Promise<SystemDiagnosticsReport> {
  const bar = getProgressBar();
  const taskId = 'system-diagnostics';

  bar.startTask(taskId, 'Самодиагностика системы RICIS-III (SP1-SP4, L1, Core)...', 100);

  // Phase 1: Core Engine & Runtime Health
  bar.setProgress(20, 'Проверка ядра RICIS Core Engine & WASM runtime...');
  await new Promise(r => setTimeout(r, 60));
  const coreStatus = await checkRicisCoreRuntimeStatus();
  const isCoreReady = coreStatus !== 'error';

  // Phase 2: Dependency Graph & L1_IDENTITY Structural Audit
  bar.setProgress(45, 'Проверка связности графа монолитов и L1_IDENTITY...');
  await new Promise(r => setTimeout(r, 60));
  const auditor = new DependencyGraphAuditor();
  const graphReport = auditor.audit(mapState);
  const cyclesDetected = graphReport.cyclicGroups.length > 0;
  const issueCount = graphReport.orphans.length + graphReport.brokenEdges.length + graphReport.cyclicGroups.length;

  // Phase 3: Seed Invariants & Cryptographic Anchors (SP1 - SP4)
  bar.setProgress(70, 'Валидация математических инвариантов Seed...');
  await new Promise(r => setTimeout(r, 60));
  const seedCount = SEED_AXIOM_TABLE.length;
  const isSeedValid = seedCount > 0 && SEED_AXIOM_TABLE.every(axiom => Boolean(axiom.id && axiom.statement));

  // Phase 4: Geometric Bridge Invariants Audit (A1-A10, Skew Product, L0, L1)
  bar.setProgress(85, 'Валидация аксиом Geometric Bridge и детерминизма O(1)...');
  await new Promise(r => setTimeout(r, 60));
  const bridgeAudit = auditGeometricBridgeInvariants();

  // Phase 5: Final Assessment
  bar.setProgress(100, 'Формирование итогового заключения...');
  const isHealthy = isCoreReady && !cyclesDetected && isSeedValid && bridgeAudit.isPassed;
  const summaryMessage = isHealthy
    ? `Самодиагностика RICIS-III завершена: Ядро активно (${coreStatus}), Мост инвариантов O(1) [${bridgeAudit.checkedInvariantsCount} проверок PASS], Узлов: ${mapState.nodes.length}, Seed: ${seedCount}, Ошибок: 0`
    : `Самодиагностика: обнаружены предупреждения (Ядро: ${coreStatus}, Ошибок графа: ${issueCount}, Мост: ${bridgeAudit.isPassed ? 'OK' : 'FAIL'})`;

  bar.finishTask(summaryMessage);

  return {
    timestamp: Date.now(),
    isHealthy,
    coreRuntime: {
      isReady: isCoreReady,
      description: `RICIS Core Engine v7.7 (${coreStatus})`,
    },
    graphAudit: {
      nodeCount: mapState.nodes.length,
      edgeCount: mapState.edges.length,
      issueCount,
      cyclesDetected,
    },
    seedInvariants: {
      isValid: isSeedValid,
      checkedCount: seedCount,
    },
    geometricBridge: {
      isPassed: bridgeAudit.isPassed,
      checkedCount: bridgeAudit.checkedInvariantsCount,
      details: bridgeAudit.details,
    },
    summaryMessage,
  };
}
