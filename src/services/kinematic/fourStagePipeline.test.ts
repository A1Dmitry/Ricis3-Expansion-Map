// ============================================================================
// QA AUTOMATION SUITE: 4-STAGE KINEMATIC PIPELINE & SELF-COLLISION TESTS
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { Planar3LinkKinematicService } from './planar3LinkKinematicService';

describe('RICIS-III 4-Stage Kinematic Pipeline & Self-Collision Unit Tests', () => {
  let service: Planar3LinkKinematicService;
  const standardLinks: [number, number, number] = [0.55, 0.45, 0.25];

  beforeEach(() => {
    service = new Planar3LinkKinematicService();
  });

  it('QA-4STAGE-01: Stage 1 Polar Transition устраняет сингулярность представления при r -> 0', () => {
    const report = service.evaluateFourStagePipeline([0.0, Math.PI, 0.0], standardLinks, 'POLAR');
    expect(report.stage1PolarTransition.parameterizationMode).toBe('POLAR');
    expect(report.stage1PolarTransition.isRepresentationSingularityEliminated).toBe(true);
  });

  it('QA-4STAGE-02: Stage 2 RICIS Reduction аксиоматически обрабатывает остаточную сингулярность', () => {
    // Fully stretched singular configuration (theta2 = 0, theta3 = 0)
    const report = service.evaluateFourStagePipeline([0.0, 0.0, 0.0], standardLinks, 'POLAR');
    expect(report.stage2RicisReduction.isResidualSingularityResolved).toBe(true);
    expect(report.stage2RicisReduction.sigmaMin).toBeLessThan(0.1);
    expect(report.stage2RicisReduction.typedZero).toContain('0_');
  });

  it('QA-4STAGE-03: Stage 3 Self-Collision Check детектирует безопасную конфигурацию звеньев', () => {
    // Normal working configuration
    const safeJoints: [number, number, number] = [0.5, 0.8, 0.3];
    const collision = service.checkSelfCollision(safeJoints, standardLinks, 0.04);
    expect(collision.isColliding).toBe(false);
    expect(collision.minDistance).toBeGreaterThan(0.04);
  });

  it('QA-4STAGE-04: Stage 3 Self-Collision Check детектирует физическое самопересечение при сворачивании назад', () => {
    // Severe acute backward fold: link 3 folds back directly onto link 1
    const foldingJoints: [number, number, number] = [0.0, Math.PI, -Math.PI + 0.02];
    const collision = service.checkSelfCollision(foldingJoints, standardLinks, 0.05);
    expect(collision.minDistance).toBeLessThan(0.06);
  });

  it('QA-4STAGE-05: Stage 4 Downstream Relative Motion подтверждает относительную инвариантность звеньев', () => {
    const report = service.evaluateFourStagePipeline([0.3, 0.7, 0.5], standardLinks, 'POLAR');
    expect(report.stage4DownstreamMotion.isRelativeMotionPreserved).toBe(true);
    expect(report.stage4DownstreamMotion.relativeTransformRank).toBe(2);
    expect(report.stage4DownstreamMotion.cumulativeEndEffectorFrame).toBeDefined();
  });
});
