// ============================================================================
// GENERIC N-LINK KINEMATIC SERVICE TESTS (1, 2, 3, 4, 5, N LINKS)
// ============================================================================

import { describe, it, expect } from 'vitest';
import { GenericNLinkKinematicService } from './genericNLinkKinematicService';
import { MANIPULATOR_LINK_LENGTHS_M } from './manipulatorConstants';

describe('GenericNLinkKinematicService (1, 2, 3, 4, 5, N links)', () => {
  it('supports 1-link manipulator', () => {
    const service = new GenericNLinkKinematicService(1);
    const joints = [Math.PI / 4];
    const links = [1.0];
    const [x, y] = service.computeForwardKinematics(joints, links);
    expect(x).toBeCloseTo(Math.cos(Math.PI / 4), 4);
    expect(y).toBeCloseTo(Math.sin(Math.PI / 4), 4);

    const J = service.computeJacobian(joints, links, 'CARTESIAN');
    expect(J.dof).toBe(1);
    expect(J.rows.length).toBe(2);
    expect(J.rows[0].length).toBe(1);
  });

  it('supports 2-link manipulator', () => {
    const service = new GenericNLinkKinematicService(2);
    const joints = [0, Math.PI / 2];
    const links = [1.0, 1.0];
    const [x, y] = service.computeForwardKinematics(joints, links);
    expect(x).toBeCloseTo(1.0, 4);
    expect(y).toBeCloseTo(1.0, 4);

    const J = service.computeJacobian(joints, links, 'CARTESIAN');
    expect(J.dof).toBe(2);
    expect(J.rows[0].length).toBe(2);
  });

  it('supports 3-link manipulator', () => {
    const service = new GenericNLinkKinematicService(3);
    const joints = [0, 0, 0];
    const links = MANIPULATOR_LINK_LENGTHS_M;
    const [x, y] = service.computeForwardKinematics(joints, links);
    expect(x).toBeCloseTo(1.9, 4);
    expect(y).toBeCloseTo(0, 4);
  });

  it('supports 4-link manipulator', () => {
    const service = new GenericNLinkKinematicService(4);
    const joints = [0.1, 0.2, -0.3, 0.4];
    const links = [0.5, 0.4, 0.3, 0.2];
    const [x, y] = service.computeForwardKinematics(joints, links);
    expect(Number.isNaN(x)).toBe(false);
    expect(Number.isNaN(y)).toBe(false);

    const escape = service.calculateSelfMotionEscape(joints, links);
    expect(escape.length).toBe(4);
  });

  it('supports 5-link manipulator', () => {
    const service = new GenericNLinkKinematicService(5);
    const joints = [0.2, 0.3, -0.4, 0.5, -0.1];
    const links = [0.4, 0.35, 0.3, 0.25, 0.2];
    const [x, y] = service.computeForwardKinematics(joints, links);
    expect(Number.isNaN(x)).toBe(false);

    const report = service.evaluateFourStagePipeline(joints, links, 'POLAR');
    expect(report.stage2RicisReduction.kernelRank).toBe(3);
    expect(report.stage1PolarTransition.isRepresentationSingularityEliminated).toBe(true);
  });

  it('supports arbitrary 8-link (N-link) hyper-redundant manipulator', () => {
    const service = new GenericNLinkKinematicService(8);
    const joints = new Array(8).fill(0.1);
    const links = new Array(8).fill(0.25);
    const [x, y] = service.computeForwardKinematics(joints, links);
    expect(x).toBeGreaterThan(0);

    const J = service.computeJacobian(joints, links, 'POLAR');
    expect(J.dof).toBe(8);
    expect(J.rows[0].length).toBe(8);
    expect(J.rows[1].length).toBe(8);

    const svd = service.computeSingularValues(J);
    expect(svd.sigmaMin).toBeGreaterThan(0);

    const report = service.evaluateFourStagePipeline(joints, links, 'POLAR');
    expect(report.stage2RicisReduction.kernelRank).toBe(6);
  });
});
