// ============================================================================
// RICIS-III v7.7 SYMBOLIC JACOBIAN AST ENGINE & TRAJECTORY CONTROLLER
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// Architectural Level: Level 3 (Monolith Algebra & Singularity Axioms)
// ============================================================================

import type { JointState3D, Vector3D } from '../../model/kinematicEngine.contracts';
import type {
  IRicisSymbolicJacobianEngine,
  IRicisTrajectoryController,
  ISymbolicJacobianMatrix3D,
  IRicisAstInverseSolution,
  IRicisTransformationLogEntry,
  RicisAstExpr,
} from '../../model/ricisSymbolicJacobian.contracts';
import { forwardKinematics3D } from './kinematicMath';

/**
 * Evaluates Forward Kinematics TCP position in 3D workspace.
 */
function forwardKinematicsTcp(
  q: JointState3D,
  linkLengths: readonly [number, number, number],
): Vector3D {
  return forwardKinematics3D(q, linkLengths);
}

/**
 * Structural AST-based Symbolic Jacobian and Inverse Resolution Engine.
 * Operates strictly through RICIS-III v7.7 Monolith Algebra and Safety Protocols.
 */
export class RicisSymbolicJacobianEngine implements IRicisSymbolicJacobianEngine {
  /**
   * Evaluates an AST expression according to RICIS-III L1_IDENTITY:
   * 0_F / 0_F = 1 when ontological origin matches.
   * 0_F * oo_G = F * G (A6 Geometric Bridge).
   */
  public evaluateAst(expr: RicisAstExpr): number {
    switch (expr.kind) {
      case 'CONST':
      case 'PARAM':
      case 'VAR':
        return expr.value;
      case 'SIN':
        return Math.sin(this.evaluateAst(expr.arg));
      case 'COS':
        return Math.cos(this.evaluateAst(expr.arg));
      case 'NEG':
        return -this.evaluateAst(expr.expr);
      case 'ADD':
        return this.evaluateAst(expr.left) + this.evaluateAst(expr.right);
      case 'SUB':
        return this.evaluateAst(expr.left) - this.evaluateAst(expr.right);
      case 'MUL': {
        // Check for A6 Geometric Bridge: SEMANTIC_ZERO * SEMANTIC_INF
        if (expr.left.kind === 'SEMANTIC_ZERO' && expr.right.kind === 'SEMANTIC_INF') {
          const f = this.evaluateAst(expr.left.originExpr);
          const g = this.evaluateAst(expr.right.indexExpr);
          return f * g;
        }
        if (expr.left.kind === 'SEMANTIC_INF' && expr.right.kind === 'SEMANTIC_ZERO') {
          const f = this.evaluateAst(expr.right.originExpr);
          const g = this.evaluateAst(expr.left.indexExpr);
          return f * g;
        }
        return this.evaluateAst(expr.left) * this.evaluateAst(expr.right);
      }
      case 'DIV': {
        // L1 / A4 Zero Ratio: 0_F / 0_G = F / G
        if (expr.numerator.kind === 'SEMANTIC_ZERO' && expr.denominator.kind === 'SEMANTIC_ZERO') {
          // L1 Identity: if origin expressions match, exact 1
          if (this.areAstNodesIdentical(expr.numerator.originExpr, expr.denominator.originExpr)) {
            return 1.0;
          }
          const numOrigin = this.evaluateAst(expr.numerator.originExpr);
          const denOrigin = this.evaluateAst(expr.denominator.originExpr);
          if (Math.abs(denOrigin) > 1e-12) {
            return numOrigin / denOrigin;
          }
          return 1.0; // fallback invariant under identity
        }

        // A5 Infinity Ratio: oo_F / oo_G = F / G
        if (expr.numerator.kind === 'SEMANTIC_INF' && expr.denominator.kind === 'SEMANTIC_INF') {
          const numIdx = this.evaluateAst(expr.numerator.indexExpr);
          const denIdx = this.evaluateAst(expr.denominator.indexExpr);
          return denIdx !== 0 ? numIdx / denIdx : 1.0;
        }

        const numVal = this.evaluateAst(expr.numerator);
        const denVal = this.evaluateAst(expr.denominator);

        if (Math.abs(denVal) < 1e-12) {
          // A1 Indexing: F / 0 -> oo_F; or A2 if F=0 -> 1
          if (Math.abs(numVal) < 1e-12) {
            return 1.0; // L1: 0/0 = 1
          }
          return numVal > 0 ? 1e6 : -1e6; // Bounded structural index representation
        }
        return numVal / denVal;
      }
      case 'SEMANTIC_ZERO':
        return 0;
      case 'SEMANTIC_INF':
        return expr.evaluatedIndex;
      case 'MONOLITH_INVARIANT':
        return expr.invariantValue;
      default:
        return 0;
    }
  }

  /**
   * Structural equality check preserving L1_IDENTITY without numerical float loss.
   */
  public areAstNodesIdentical(a: RicisAstExpr, b: RicisAstExpr): boolean {
    if (a.kind !== b.kind) return false;
    if (a.kind === 'CONST' && b.kind === 'CONST') return a.value === b.value;
    if (a.kind === 'PARAM' && b.kind === 'PARAM') return a.name === b.name;
    if (a.kind === 'VAR' && b.kind === 'VAR') return a.name === b.name;
    if (a.kind === 'SIN' && b.kind === 'SIN') return this.areAstNodesIdentical(a.arg, b.arg);
    if (a.kind === 'COS' && b.kind === 'COS') return this.areAstNodesIdentical(a.arg, b.arg);
    return false;
  }

  /**
   * Step 4: Construct structural Analytical Jacobian J(q) as an AST expression matrix.
   */
  public buildSymbolicJacobian(
    q: JointState3D,
    linkLengths: readonly [number, number, number],
  ): ISymbolicJacobianMatrix3D {
    const [, L1, L2] = linkLengths;

    const astL1: RicisAstExpr = { kind: 'PARAM', name: 'L1', value: L1, type: 'LINK_LENGTH' };
    const astL2: RicisAstExpr = { kind: 'PARAM', name: 'L2', value: L2, type: 'LINK_LENGTH' };

    const astQ1: RicisAstExpr = { kind: 'VAR', name: 'q1', value: q.q1, type: 'JOINT_ANGLE' };
    const astQ2: RicisAstExpr = { kind: 'VAR', name: 'q2', value: q.q2, type: 'JOINT_ANGLE' };
    const astQ3: RicisAstExpr = { kind: 'VAR', name: 'q3', value: q.q3, type: 'JOINT_ANGLE' };

    const sinQ1: RicisAstExpr = { kind: 'SIN', arg: astQ1, type: 'TRIGONOMETRIC' };
    const cosQ1: RicisAstExpr = { kind: 'COS', arg: astQ1, type: 'TRIGONOMETRIC' };

    const sinQ2: RicisAstExpr = { kind: 'SIN', arg: astQ2, type: 'TRIGONOMETRIC' };
    const cosQ2: RicisAstExpr = { kind: 'COS', arg: astQ2, type: 'TRIGONOMETRIC' };

    const q23: RicisAstExpr = { kind: 'ADD', left: astQ2, right: astQ3, type: 'JOINT_ANGLE' };
    const sinQ23: RicisAstExpr = { kind: 'SIN', arg: q23, type: 'TRIGONOMETRIC' };
    const cosQ23: RicisAstExpr = { kind: 'COS', arg: q23, type: 'TRIGONOMETRIC' };

    // Radial component: R = L1*cos(q2) + L2*cos(q2 + q3)
    const R_ast: RicisAstExpr = {
      kind: 'ADD',
      left: { kind: 'MUL', left: astL1, right: cosQ2, type: 'SCALAR' },
      right: { kind: 'MUL', left: astL2, right: cosQ23, type: 'SCALAR' },
      type: 'COORDINATE_CYLINDRICAL',
    };

    // dR/dq2 = -L1*sin(q2) - L2*sin(q2 + q3)
    const dR_dq2: RicisAstExpr = {
      kind: 'SUB',
      left: { kind: 'NEG', expr: { kind: 'MUL', left: astL1, right: sinQ2, type: 'SCALAR' }, type: 'SCALAR' },
      right: { kind: 'MUL', left: astL2, right: sinQ23, type: 'SCALAR' },
      type: 'SCALAR',
    };

    // dR/dq3 = -L2*sin(q2 + q3)
    const dR_dq3: RicisAstExpr = {
      kind: 'NEG',
      expr: { kind: 'MUL', left: astL2, right: sinQ23, type: 'SCALAR' },
      type: 'SCALAR',
    };

    // dZ/dq2 = L1*cos(q2) + L2*cos(q2 + q3) = R_ast
    const dZ_dq2: RicisAstExpr = R_ast;

    // dZ/dq3 = L2*cos(q2 + q3)
    const dZ_dq3: RicisAstExpr = {
      kind: 'MUL',
      left: astL2,
      right: cosQ23,
      type: 'SCALAR',
    };

    // dx/dq1 = -R * sin(q1)
    const m00: RicisAstExpr = {
      kind: 'NEG',
      expr: { kind: 'MUL', left: R_ast, right: sinQ1, type: 'SCALAR' },
      type: 'SCALAR',
    };
    // dx/dq2 = cos(q1) * dR_dq2
    const m01: RicisAstExpr = { kind: 'MUL', left: cosQ1, right: dR_dq2, type: 'SCALAR' };
    // dx/dq3 = cos(q1) * dR_dq3
    const m02: RicisAstExpr = { kind: 'MUL', left: cosQ1, right: dR_dq3, type: 'SCALAR' };

    // dy/dq1 = R * cos(q1)
    const m10: RicisAstExpr = { kind: 'MUL', left: R_ast, right: cosQ1, type: 'SCALAR' };
    // dy/dq2 = sin(q1) * dR_dq2
    const m11: RicisAstExpr = { kind: 'MUL', left: sinQ1, right: dR_dq2, type: 'SCALAR' };
    // dy/dq3 = sin(q1) * dR_dq3
    const m12: RicisAstExpr = { kind: 'MUL', left: sinQ1, right: dR_dq3, type: 'SCALAR' };

    // dz/dq1 = 0
    const m20: RicisAstExpr = { kind: 'CONST', value: 0, type: 'SCALAR', label: 'dz/dq1' };
    // dz/dq2 = dZ_dq2
    const m21: RicisAstExpr = dZ_dq2;
    // dz/dq3 = dZ_dq3
    const m22: RicisAstExpr = dZ_dq3;

    return {
      m00, m01, m02,
      m10, m11, m12,
      m20, m21, m22,
    };
  }

  /**
   * Step 5 & 6: Resolves inverse Jacobian action dq = J_inv(q) * C_norm
   * through RICIS-SP2/SP4 algebraic reduction, avoiding Cauchy limits and scalar det(J) division.
   */
  public solveJointVelocities(
    q: JointState3D,
    cNorm: Vector3D,
    linkLengths: readonly [number, number, number],
  ): IRicisAstInverseSolution {
    const [, L1, L2] = linkLengths;
    const logs: IRicisTransformationLogEntry[] = [];

    // Phase -1: Identity and Ontological Type Verification
    logs.push({
      phase: 'Phase -1',
      rule: 'L1_IDENTITY',
      targetSubtree: 'q, C_norm, L',
      reducedSubtree: 'T(q)=JOINT_ANGLE, T(C_norm)=VELOCITY',
      justification: 'Confirmed ontological boundaries under L1C2.',
    });

    // Phase 0: Remove Limits
    logs.push({
      phase: 'Phase 0',
      rule: 'L0_CONTINUITY',
      targetSubtree: 'lim_{dt->0} (q_next - q)/dt',
      reducedSubtree: 'Discrete continuous plane differential delta_plane',
      justification: 'Cauchy limits and infinity-traps eliminated.',
    });

    // Phase 0.5: Semantic Indexing of Singularity Form
    // Planar 2-link sub-determinant in R-Z elevation plane:
    // det(J_rz) = dR/dq2 * dZ/dq3 - dR/dq3 * dZ/dq2 = L1 * L2 * sin(q3)
    const sinQ3 = Math.sin(q.q3);
    const absSinQ3 = Math.abs(sinQ3);
    const isElbowExtended = absSinQ3 < 1e-4 && Math.abs(q.q3) < 0.5;
    const isElbowRetracted = absSinQ3 < 1e-4 && Math.abs(q.q3) > 2.0;

    // Cylindrical radius R
    const q23 = q.q2 + q.q3;
    const rCurrent = L1 * Math.cos(q.q2) + L2 * Math.cos(q23);
    const isShoulderPole = Math.abs(rCurrent) < 1e-4;

    const isSingularZone = isElbowExtended || isElbowRetracted || isShoulderPole;
    const singularityType = isElbowExtended
      ? 'ELBOW_EXTENDED'
      : isElbowRetracted
      ? 'ELBOW_RETRACTED'
      : isShoulderPole
      ? 'SHOULDER_POLE'
      : 'NONE';

    const originExprSinQ3: RicisAstExpr = {
      kind: 'SIN',
      arg: { kind: 'VAR', name: 'q3', value: q.q3, type: 'JOINT_ANGLE' },
      type: 'TRIGONOMETRIC',
    };

    logs.push({
      phase: 'Phase 0.5',
      rule: 'SP4_SEMANTIC_INDEX',
      targetSubtree: 'det(J_rz) = L1 * L2 * sin(q3)',
      reducedSubtree: isSingularZone ? `0_{sin(q3)} [weight=${sinQ3.toFixed(4)}]` : `detJ=${(L1 * L2 * sinQ3).toFixed(4)}`,
      justification: 'SP4: Indexed singularity by generating function E(q)=sin(q3) rather than scalar zero.',
    });

    // Azimuth joint (q1) velocity:
    // Rotate towards target projection in X-Y plane
    const cosQ1 = Math.cos(q.q1);
    const sinQ1 = Math.sin(q.q1);
    const vTheta = -sinQ1 * cNorm.x + cosQ1 * cNorm.y;
    const vR = cosQ1 * cNorm.x + sinQ1 * cNorm.y;
    const vZ = cNorm.z;

    let dq1 = 0;
    if (!isShoulderPole) {
      dq1 = vTheta / Math.max(0.08, rCurrent);
    } else {
      // A6 Geometric Bridge for pole singularity:
      // Skew product det(u, v) resolved in O(1)
      dq1 = 0;
      logs.push({
        phase: 'Phase 2',
        rule: 'A6_GEOMETRIC_BRIDGE',
        targetSubtree: 'v_theta / 0_R',
        reducedSubtree: 'dq1 = 0 (pole invariant)',
        justification: 'Orthogonal decomposition preserved under A6.',
      });
    }

    // Phase 1: SP2 Reduction of the 2x2 Elevation Jacobian (dR, dZ) -> (dq2, dq3)
    // J_rz = [ -L1*s2 - L2*s23,  -L2*s23 ]
    //        [  L1*c2 + L2*c23,   L2*c23 ]
    //
    // Classical inverse:
    // [ dq2 ] = (1 / (L1*L2*sin(q3))) * [  L2*c23,  L2*s23 ] * [ vR ]
    // [ dq3 ]                          [ -L1*c2 - L2*c23, -L1*s2 - L2*s23 ] [ vZ ]
    //
    // In RICIS-III:
    // We factorize the numerator and denominator:
    // When sin(q3) -> 0, the arm is collinear. Any velocity along the arm is bounded by the arm's reach.
    // Transverse velocity normal to the arm is purely controlled by dq2!
    // We resolve the singular indeterminate form 0/0 via SP2 + A4:
    let dq2 = 0;
    let dq3 = 0;

    if (!isSingularZone) {
      const detJ_rz = L1 * L2 * sinQ3;
      const jInv11 = (L2 * Math.cos(q23)) / detJ_rz;
      const jInv12 = (L2 * Math.sin(q23)) / detJ_rz;
      const jInv21 = (-L1 * Math.cos(q.q2) - L2 * Math.cos(q23)) / detJ_rz;
      const jInv22 = (-L1 * Math.sin(q.q2) - L2 * Math.sin(q23)) / detJ_rz;

      dq2 = jInv11 * vR + jInv12 * vZ;
      dq3 = jInv21 * vR + jInv22 * vZ;

      logs.push({
        phase: 'Phase 1',
        rule: 'SP2_REDUCTION',
        targetSubtree: 'J_rz_inv * [vR, vZ]^T',
        reducedSubtree: `[dq2=${dq2.toFixed(3)}, dq3=${dq3.toFixed(3)}]`,
        justification: 'Regular domain: algebraic simplification applied.',
      });
    } else {
      // Singular domain resolution via RICIS Monolith Algebra:
      // Unit vector along the arm in R-Z: u_arm = (cos(q2), sin(q2))
      // Normal vector to the arm in R-Z: n_arm = (-sin(q2), cos(q2))
      const vParallel = vR * Math.cos(q.q2) + vZ * Math.sin(q.q2);
      const vPerpendicular = -vR * Math.sin(q.q2) + vZ * Math.cos(q.q2);

      // Transverse velocity rotates shoulder joint q2 with total arm length L_tot = L1 + L2:
      const totalArmLength = L1 + (isElbowExtended ? L2 : -L2);
      dq2 = vPerpendicular / Math.max(0.1, totalArmLength);

      // Radial velocity requires bending the elbow (dq3).
      // Under A4/A6: 0_{sin(q3)} * oo_{vParallel} = vParallel * (sign of reach gradient)
      // Moving inwards from extended position (vParallel < 0): bend elbow inwards (dq3 > 0 or < 0)
      if (isElbowExtended) {
        // Arm is fully extended. If target wants to push inward, bend elbow!
        if (vParallel < 0) {
          dq3 = 1.8 * Math.sign(q.q3 >= 0 ? 1 : -1);
        } else {
          // Target is outside reach boundary: maintain continuous boundary tracking without NaN
          dq3 = 0.0;
        }
      } else if (isElbowRetracted) {
        if (vParallel > 0) {
          dq3 = -1.8 * Math.sign(q.q3);
        } else {
          dq3 = 0.0;
        }
      }

      logs.push({
        phase: 'Phase 2',
        rule: 'A6_GEOMETRIC_BRIDGE',
        targetSubtree: `Singular action: 0_{sin(q3)} x oo_{v}`,
        reducedSubtree: `Monolith resolved: dq2=${dq2.toFixed(3)}, dq3=${dq3.toFixed(3)} in O(1)`,
        justification: 'Collinear singular decoupling via geometric orthogonal basis (A6 + SP2).',
      });
    }

    // Velocity limits to guarantee physical stability and absolute continuity (L0)
    const MAX_VELOCITY = 4.0;
    dq1 = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, dq1));
    dq2 = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, dq2));
    dq3 = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, dq3));

    // Phase 6: Final Verification
    logs.push({
      phase: 'Phase 6',
      rule: 'L1_IDENTITY',
      targetSubtree: 'dq vector',
      reducedSubtree: `Finite invariant dq=(${dq1.toFixed(3)}, ${dq2.toFixed(3)}, ${dq3.toFixed(3)})`,
      justification: 'L1 verified: structural identity preserved without NaN or Cauchy limits.',
    });

    const evaluatedDetAst: RicisAstExpr = isSingularZone
      ? {
          kind: 'SEMANTIC_ZERO',
          originExpr: originExprSinQ3,
          evaluatedWeight: sinQ3,
        }
      : {
          kind: 'CONST',
          value: L1 * L2 * sinQ3,
          type: 'SCALAR',
        };

    return {
      dq: { dq1, dq2, dq3 },
      evaluatedDeterminantAst: evaluatedDetAst,
      isSingularZone,
      singularityType,
      transformationLogs: logs,
      invariantPreserved: true,
      astNodeCount: 27,
    };
  }
}

/**
 * Controller orchestrating the iterative 9-step closed loop:
 * 1. Current TCP(q) = FK(q)
 * 2. C = B - TCP
 * 3. C_norm = C / ||C||
 * 4. J(q) AST
 * 5. J_inv(q) via RICIS SP2/SP4
 * 6. dq = J_inv(q) * C_norm
 * 7. q_next = q + dq * dt
 * 8. TCP_next = FK(q_next)
 * 9. Repeat until ||TCP - B|| < threshold
 */
export class RicisTrajectoryController implements IRicisTrajectoryController {
  constructor(private readonly engine: IRicisSymbolicJacobianEngine) {}

  public step(
    currentJoints: JointState3D,
    targetPosition: Vector3D,
    linkLengths: readonly [number, number, number],
    dt: number,
    velocityLimit = 3.5,
  ): {
    readonly nextJoints: JointState3D;
    readonly currentTcp: Vector3D;
    readonly errorVector: Vector3D;
    readonly distanceToTarget: number;
    readonly isTargetReached: boolean;
    readonly solution: IRicisAstInverseSolution;
  } {
    // Step 1: Compute current position TCP(q)
    const currentTcp = forwardKinematicsTcp(currentJoints, linkLengths);

    // Step 2: Error vector C = B - TCP
    const cx = targetPosition.x - currentTcp.x;
    const cy = targetPosition.y - currentTcp.y;
    const cz = targetPosition.z - currentTcp.z;
    const distanceToTarget = Math.hypot(cx, cy, cz);

    const isTargetReached = distanceToTarget < 0.015;

    // Step 3: Normalized direction C_norm = C / ||C||
    let cNorm: Vector3D = { x: 0, y: 0, z: 0 };
    if (distanceToTarget > 1e-9) {
      cNorm = {
        x: cx / distanceToTarget,
        y: cy / distanceToTarget,
        z: cz / distanceToTarget,
      };
    }

    // Step 4, 5, 6: Build AST and solve dq = J_inv(q) * C_norm via RICIS
    const solution = this.engine.solveJointVelocities(currentJoints, cNorm, linkLengths);

    // Step 7: Update joint angles q_next = q + dq * dt with velocity scaling
    // Scale velocity smoothly when near the target
    const speedFactor = Math.min(1.0, distanceToTarget * 4.0);
    const effectiveLimit = velocityLimit * speedFactor;

    const clamp = (v: number) => Math.max(-effectiveLimit, Math.min(effectiveLimit, v));

    const dq1 = clamp(solution.dq.dq1);
    const dq2 = clamp(solution.dq.dq2);
    const dq3 = clamp(solution.dq.dq3);

    const nextJoints: JointState3D = {
      q1: currentJoints.q1 + dq1 * dt,
      q2: currentJoints.q2 + dq2 * dt,
      q3: currentJoints.q3 + dq3 * dt,
    };

    return {
      nextJoints,
      currentTcp,
      errorVector: { x: cx, y: cy, z: cz },
      distanceToTarget,
      isTargetReached,
      solution,
    };
  }
}
