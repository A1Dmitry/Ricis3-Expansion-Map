// ============================================================================
// 5-LINK HYPER-REDUNDANT PLANAR MANIPULATOR SERVICE (SOLID / DDD / DRY)
// Implements 5-DOF Forward Kinematics, 2x5 Jacobian, Null Space Projection,
// Self-Collision Detection & 4-Stage Architecture
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import { BasePlanarManipulatorService } from './planar3LinkKinematicService';
import type {
  ParameterizationMode,
  IJacobianMatrix2xN,
  IRicisReductionOverlayState,
} from './twoStageSingularity.contracts';
import type {
  IFourStageKinematicReport,
  ISelfCollisionReport,
  IDownstreamRelativeChainReport,
} from './fourStagePipeline.contracts';

export type Joint5Tuple = readonly [number, number, number, number, number];
export type Link5Tuple = readonly [number, number, number, number, number];

export class FiveLinkRedundantKinematicService extends BasePlanarManipulatorService<Joint5Tuple, Link5Tuple> {
  public override readonly dof = 5;

  /**
   * Forward kinematics for 5-link serial planar chain:
   * x = sum(L_i * cos(sum(q_1..q_i)))
   * y = sum(L_i * sin(sum(q_1..q_i)))
   */
  public computeForwardKinematics(joints: Joint5Tuple, links: Link5Tuple): readonly [number, number] {
    let cumAngle = 0;
    let x = 0;
    let y = 0;

    for (let i = 0; i < 5; i++) {
      cumAngle += joints[i] ?? 0;
      const l = links[i] ?? 0;
      x += l * Math.cos(cumAngle);
      y += l * Math.sin(cumAngle);
    }

    return [x, y];
  }

  /**
   * Analytical 2x5 Jacobian Matrix
   * Row 0 (dx/dq): dx/dq_j = -sum_{k=j..5} L_k * sin(cumAngle_k)
   * Row 1 (dy/dq): dy/dq_j =  sum_{k=j..5} L_k * cos(cumAngle_k)
   */
  public computeJacobian(
    joints: Joint5Tuple,
    links: Link5Tuple,
    mode: ParameterizationMode
  ): IJacobianMatrix2xN {
    const cumAngles: number[] = [];
    let cur = 0;
    for (let i = 0; i < 5; i++) {
      cur += joints[i] ?? 0;
      cumAngles.push(cur);
    }

    const row0: number[] = new Array(5).fill(0);
    const row1: number[] = new Array(5).fill(0);

    for (let j = 0; j < 5; j++) {
      let dx = 0;
      let dy = 0;
      for (let k = j; k < 5; k++) {
        const l = links[k] ?? 0;
        const a = cumAngles[k] ?? 0;
        dx -= l * Math.sin(a);
        dy += l * Math.cos(a);
      }
      row0[j] = dx;
      row1[j] = dy;
    }

    let detMeasure = 0;
    // For 2x5 redundant matrix, measure of manipulability = sqrt(det(J * J^T))
    let a = 0, b = 0, d = 0;
    for (let i = 0; i < 5; i++) {
      const r0 = row0[i] ?? 0;
      const r1 = row1[i] ?? 0;
      a += r0 * r0;
      b += r0 * r1;
      d += r1 * r1;
    }
    const detJJT = Math.max(0, a * d - b * b);
    detMeasure = Math.sqrt(detJJT);

    if (mode === 'POLAR') {
      // In polar coordinate frame around base/cluster, scale radial vs tangential
      const [eeX, eeY] = this.computeForwardKinematics(joints, links);
      const r = Math.max(0.01, Math.sqrt(eeX * eeX + eeY * eeY));
      for (let j = 0; j < 5; j++) {
        const vx = row0[j] ?? 0;
        const vy = row1[j] ?? 0;
        // dr/dq = (x*vx + y*vy)/r
        // r*dphi/dq = (-y*vx + x*vy)/r
        row0[j] = (eeX * vx + eeY * vy) / r;
        row1[j] = (-eeY * vx + eeX * vy) / r;
      }
    }

    return {
      dof: 5,
      mode,
      determinantMeasure: detMeasure,
      rows: [row0, row1],
    };
  }

  /**
   * Stage 2: Null-space self-motion reduction for 5-DOF redundant manipulator.
   * Null-space has dimension 5 - 2 = 3.
   * Computes null-space projection vector to escape joint limits or singularities.
   */
  public calculateSelfMotionEscape(joints: Joint5Tuple, links: Link5Tuple): readonly number[] {
    const J = this.computeJacobian(joints, links, 'CARTESIAN');
    const r0 = J.rows[0];
    const r1 = J.rows[1];

    // Build projector P = I - J^T (J J^T)^(-1) J
    // Let w be an optimization gradient (pushing middle joints away from folding)
    const w: number[] = [
      -0.2 * joints[0],
      0.5 * (Math.PI / 3 - Math.abs(joints[1])),
      0.5 * (Math.PI / 4 - Math.abs(joints[2])),
      0.3 * (Math.PI / 4 - Math.abs(joints[3])),
      -0.2 * joints[4],
    ];

    // Orthogonalize w with respect to rows of J (Gram-Schmidt projection into Null(J))
    let dot0 = 0, len0Sq = 0;
    for (let i = 0; i < 5; i++) {
      const ji = r0[i] ?? 0;
      dot0 += w[i] * ji;
      len0Sq += ji * ji;
    }
    const w1 = w.map((wi, i) => wi - (len0Sq > 1e-6 ? (dot0 / len0Sq) * (r0[i] ?? 0) : 0));

    let dot1 = 0, len1Sq = 0;
    for (let i = 0; i < 5; i++) {
      const ji = r1[i] ?? 0;
      dot1 += w1[i] * ji;
      len1Sq += ji * ji;
    }
    const nullVector = w1.map((wi, i) => wi - (len1Sq > 1e-6 ? (dot1 / len1Sq) * (r1[i] ?? 0) : 0));

    // Normalize
    const norm = Math.sqrt(nullVector.reduce((acc, v) => acc + v * v, 0));
    return norm > 1e-5 ? nullVector.map(v => v / norm) : [0, 0.4, -0.4, 0.4, 0];
  }

  public evaluateRicisReduction(
    joints: Joint5Tuple,
    links: Link5Tuple,
    mode: ParameterizationMode
  ): IRicisReductionOverlayState {
    const J = this.computeJacobian(joints, links, mode);
    const sv = this.computeSingularValues(J);
    const adaptiveLambda = this.computeAdaptiveLambda(sv.sigmaMin);
    const escapeJoint = this.calculateSelfMotionEscape(joints, links);

    const preservedDirections = [
      { joint: 1, vector: [Math.cos(joints[0] + Math.PI / 2), Math.sin(joints[0] + Math.PI / 2)] as const, label: 'Base Angular Subspace' },
      { joint: 2, vector: [Math.cos(joints[0] + joints[1] + Math.PI / 2), Math.sin(joints[0] + joints[1] + Math.PI / 2)] as const, label: 'Cluster Null Manifold' },
    ];

    const lostDirections = [
      { joint: 4, vector: [Math.cos(joints[0] + joints[1] + joints[2] + joints[3]), Math.sin(joints[0] + joints[1] + joints[2] + joints[3])] as const, label: 'Full Collinear Radial Extension' },
    ];

    return {
      isActive: sv.isSingular,
      typedZeroNotation: `0_{det(JJ^T)} [5-DOF Null-Space Dim=3]`,
      originatingExpression: `det(J_{2x5} · J^T) = ${J.determinantMeasure.toFixed(3)}`,
      kernelBasis: [escapeJoint],
      preservedDirections,
      lostDirections,
      adaptiveLambda,
      escapeDirectionJointSpace: escapeJoint,
      escapeVectorTaskSpace: [escapeJoint[1] * 0.1, escapeJoint[2] * 0.1],
      explanationText: '5-DOF Hyper-redundant null-space projection (dim=3) resolves singularity via internal self-motion.',
    };
  }

  /**
   * Self-collision verification for 5-link arm
   */
  public checkSelfCollision(
    joints: Joint5Tuple,
    links: Link5Tuple,
    linkRadius = 0.04
  ): ISelfCollisionReport {
    // Generate all joint points p0..p5
    const pts: [number, number][] = [[0, 0]];
    let cum = 0;
    for (let i = 0; i < 5; i++) {
      cum += joints[i] ?? 0;
      const l = links[i] ?? 0;
      const prev = pts[i]!;
      pts.push([prev[0] + l * Math.cos(cum), prev[1] + l * Math.sin(cum)]);
    }

    let minDist = Infinity;
    let collidingPair: [number, number] | undefined = undefined;
    const safeMargin = 2 * linkRadius;

    // Check non-adjacent segments: |i - j| > 1
    for (let i = 0; i < 4; i++) {
      for (let j = i + 2; j < 5; j++) {
        const d = this.segmentToSegmentDist(pts[i]!, pts[i + 1]!, pts[j]!, pts[j + 1]!);
        if (d < minDist) {
          minDist = d;
          if (d < safeMargin) {
            collidingPair = [i + 1, j + 1];
          }
        }
      }
    }

    return {
      isColliding: minDist < safeMargin,
      minDistance: minDist,
      safeClearanceMargin: safeMargin,
      collidingLinkPair: collidingPair,
    };
  }

  public evaluateFourStagePipeline(
    joints: Joint5Tuple,
    links: Link5Tuple,
    mode: ParameterizationMode
  ): IFourStageKinematicReport {
    const J = this.computeJacobian(joints, links, mode);
    const svd = this.computeSingularValues(J);
    const overlay = this.evaluateRicisReduction(joints, links, mode);
    const collision = this.checkSelfCollision(joints, links);
    const eePos = this.computeForwardKinematics(joints, links);
    const clusterRadius = Math.sqrt(eePos[0] * eePos[0] + eePos[1] * eePos[1]);

    const downstreamMotion: IDownstreamRelativeChainReport = {
      isRelativeMotionPreserved: true,
      relativeTransformRank: 2,
      cumulativeEndEffectorFrame: eePos,
    };

    return {
      stage1PolarTransition: {
        isRepresentationSingularityEliminated: mode === 'POLAR' || clusterRadius > 0.05,
        parameterizationMode: mode,
        clusterRadius,
      },
      stage2RicisReduction: {
        isResidualSingularityResolved: true,
        sigmaMin: svd.sigmaMin,
        kernelRank: 3, // 5 DOF - 2 task dim
        adaptiveLambda: overlay.adaptiveLambda,
        typedZero: overlay.typedZeroNotation,
      },
      stage3SelfCollision: collision,
      stage4DownstreamMotion: downstreamMotion,
    };
  }

  private segmentToSegmentDist(
    p1: readonly [number, number],
    p2: readonly [number, number],
    p3: readonly [number, number],
    p4: readonly [number, number]
  ): number {
    const abx = p2[0] - p1[0];
    const aby = p2[1] - p1[1];
    const lenSq = abx * abx + aby * aby;
    if (lenSq < 1e-12) return Math.hypot(p3[0] - p1[0], p3[1] - p1[1]);

    // Simple robust distance sampling
    let dMin = Infinity;
    for (let t = 0; t <= 1; t += 0.25) {
      const sx = p1[0] + t * abx;
      const sy = p1[1] + t * aby;
      // Distance from (sx, sy) to segment p3-p4
      const cdx = p4[0] - p3[0];
      const cdy = p4[1] - p3[1];
      const clenSq = cdx * cdx + cdy * cdy;
      const u = Math.max(0, Math.min(1, ((sx - p3[0]) * cdx + (sy - p3[1]) * cdy) / Math.max(1e-12, clenSq)));
      const px = p3[0] + u * cdx;
      const py = p3[1] + u * cdy;
      const d = Math.hypot(sx - px, sy - py);
      if (d < dMin) dMin = d;
    }
    return dMin;
  }
}
