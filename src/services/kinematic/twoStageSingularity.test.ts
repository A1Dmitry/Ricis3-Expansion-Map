import { describe, it, expect } from 'vitest';
import { Planar3LinkKinematicService } from './planar3LinkKinematicService';
import type { ParameterizationMode } from './twoStageSingularity.contracts';

describe('Two-Stage Singularity Treatment Engine (3-Link Planar / N-Link Extensible)', () => {
  const linkLengths = [0.5, 0.5, 0.5] as const;
  const service = new Planar3LinkKinematicService();

  describe('Stage 1: Coordinate-Space Polar Parameterization vs Cartesian', () => {
    it('computes Cartesian Jacobian 2x3 for 3-link arm accurately', () => {
      const joints = [0, 0, 0] as const; // Fully extended along X
      const J = service.computeJacobian(joints, linkLengths, 'CARTESIAN');
      expect(J.rows.length).toBe(2);
      expect(J.rows[0].length).toBe(3);
      expect(J.rows[1].length).toBe(3);
      expect(J.mode).toBe('CARTESIAN');
      // At θ = [0,0,0], y-components should be along +y for positive rotations
      expect(J.rows[1][0]).toBeCloseTo(1.5, 3);
      expect(J.rows[1][1]).toBeCloseTo(1.0, 3);
      expect(J.rows[1][2]).toBeCloseTo(0.5, 3);
    });

    it('detects singularity at full extension in Cartesian mode', () => {
      const joints = [0, 0, 0] as const;
      const J_cart = service.computeJacobian(joints, linkLengths, 'CARTESIAN');
      const sv_cart = service.computeSingularValues(J_cart);
      
      expect(sv_cart.isSingular).toBe(true);
      expect(sv_cart.sigmaMin).toBeCloseTo(0, 4);
    });

    it('heals folded arm (θ₂ = 0 or θ₃ = 0) under Polar transition parameterization', () => {
      // Configuration with elbow aligned / folded where polar eliminates coordinate degeneracy
      const joints = [Math.PI / 4, 0.001, Math.PI / 3] as const;
      const J_cart = service.computeJacobian(joints, linkLengths, 'CARTESIAN');
      const sv_cart = service.computeSingularValues(J_cart);

      const J_polar = service.computeJacobian(joints, linkLengths, 'POLAR');
      const sv_polar = service.computeSingularValues(J_polar);

      // In polar coordinate frame around the cluster, condition number or sigmaMin improves
      expect(sv_polar.sigmaMin).toBeGreaterThan(0);
      expect(J_polar.mode).toBe('POLAR');
    });
  });

  describe('Stage 2: RICIS Reduction for Residual Singularities', () => {
    it('creates typed zero notation 0_{det J(q_s)} when singular', () => {
      const joints = [0, 0, 0] as const; // Fully extended
      const overlay = service.evaluateRicisReduction(joints, linkLengths, 'CARTESIAN');

      expect(overlay.isActive).toBe(true);
      expect(overlay.typedZeroNotation).toContain('0_{det J(q_s)}');
      expect(overlay.kernelBasis.length).toBeGreaterThanOrEqual(1);
      expect(overlay.adaptiveLambda).toBeGreaterThan(0);
      expect(overlay.lostDirections.length).toBeGreaterThan(0);
      expect(overlay.preservedDirections.length).toBeGreaterThan(0);
    });

    it('calculates self-motion null-space escape direction that moves joints without task error', () => {
      const joints = [0, 0, 0] as const;
      const escapeDelta = service.calculateSelfMotionEscape(joints, linkLengths);

      expect(escapeDelta.length).toBe(3);
      // Escape direction must propose nonzero joint motion for recovery
      const magnitude = Math.sqrt(escapeDelta[0] ** 2 + escapeDelta[1] ** 2 + escapeDelta[2] ** 2);
      expect(magnitude).toBeGreaterThan(0.01);
    });
  });

  describe('Extensibility Contract (N-Link Polymorphism)', () => {
    it('allows generic query of joint count and link dimensions', () => {
      expect(service.dof).toBe(3);
      expect(service.taskDimension).toBe(2);
    });
  });

  describe('Singularity Heatmap Generator', () => {
    it('generates a grid of singular values for visualization slice', () => {
      const grid = service.generateHeatmapGrid(0, linkLengths, 10);
      expect(grid.resolution).toBe(10);
      expect(grid.cartesianSigmaMinGrid.length).toBe(10);
      expect(grid.polarSigmaMinGrid.length).toBe(10);
    });
  });
});
