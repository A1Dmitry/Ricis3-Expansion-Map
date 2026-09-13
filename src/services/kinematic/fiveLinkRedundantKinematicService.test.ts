// ============================================================================
// 5-LINK HYPER-REDUNDANT MANIPULATOR TESTS (DRY / SOLID / RICIS-III)
// ============================================================================

import { describe, it, expect } from 'vitest';
import { FiveLinkRedundantKinematicService, type Joint5Tuple, type Link5Tuple } from './fiveLinkRedundantKinematicService';

describe('FiveLinkRedundantKinematicService', () => {
  const service = new FiveLinkRedundantKinematicService();
  const links: Link5Tuple = [0.4, 0.35, 0.3, 0.25, 0.2];

  it('computes forward kinematics correctly when stretched along X-axis', () => {
    const joints: Joint5Tuple = [0, 0, 0, 0, 0];
    const [x, y] = service.computeForwardKinematics(joints, links);
    const expectedX = 0.4 + 0.35 + 0.3 + 0.25 + 0.2;
    expect(x).toBeCloseTo(expectedX, 4);
    expect(y).toBeCloseTo(0, 4);
  });

  it('computes forward kinematics correctly with right angle turns', () => {
    const joints: Joint5Tuple = [Math.PI / 2, 0, 0, 0, 0];
    const [x, y] = service.computeForwardKinematics(joints, links);
    const totalL = 0.4 + 0.35 + 0.3 + 0.25 + 0.2;
    expect(x).toBeCloseTo(0, 4);
    expect(y).toBeCloseTo(totalL, 4);
  });

  it('computes 2x5 Jacobian with correct dimensions', () => {
    const joints: Joint5Tuple = [0.2, 0.3, -0.4, 0.5, -0.1];
    const J = service.computeJacobian(joints, links, 'CARTESIAN');
    expect(J.dof).toBe(5);
    expect(J.rows.length).toBe(2);
    expect(J.rows[0].length).toBe(5);
    expect(J.rows[1].length).toBe(5);
    expect(J.determinantMeasure).toBeGreaterThan(0);
  });

  it('performs polar transition without throwing or returning NaN', () => {
    const joints: Joint5Tuple = [0.2, 0.3, -0.4, 0.5, -0.1];
    const J = service.computeJacobian(joints, links, 'POLAR');
    expect(J.dof).toBe(5);
    expect(Number.isNaN(J.rows[0][0])).toBe(false);
    expect(Number.isNaN(J.rows[1][0])).toBe(false);
  });

  it('evaluates null space self-motion escape vector with 5 dimensions', () => {
    const joints: Joint5Tuple = [0, 0, 0, 0, 0];
    const escape = service.calculateSelfMotionEscape(joints, links);
    expect(escape.length).toBe(5);
    escape.forEach(val => expect(Number.isNaN(val)).toBe(false));
  });

  it('evaluates four stage pipeline successfully', () => {
    const joints: Joint5Tuple = [0.1, 0.2, 0.3, 0.4, 0.5];
    const report = service.evaluateFourStagePipeline(joints, links, 'POLAR');
    expect(report.stage1PolarTransition.isRepresentationSingularityEliminated).toBe(true);
    expect(report.stage2RicisReduction.isResidualSingularityResolved).toBe(true);
    expect(report.stage2RicisReduction.kernelRank).toBe(3);
    expect(report.stage3SelfCollision.isColliding).toBe(false);
    expect(report.stage4DownstreamMotion.isRelativeMotionPreserved).toBe(true);
  });
});
