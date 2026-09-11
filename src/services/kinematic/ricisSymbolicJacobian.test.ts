import { describe, it, expect } from 'vitest';
import type { JointState3D, Vector3D } from '../../model/kinematicEngine.contracts';
import {
  RicisSymbolicJacobianEngine,
  RicisTrajectoryController,
  toCoreAst,
  fromCoreAst,
} from './ricisSymbolicJacobian';

describe('RICIS-III v7.7 Symbolic Jacobian AST Engine (QA Suite)', () => {
  const linkLengths: [number, number, number] = [0.8, 1.0, 0.8]; // L0 (base), L1 (upper), L2 (forearm)
  const engine = new RicisSymbolicJacobianEngine();
  const controller = new RicisTrajectoryController(engine);

  describe('1. AST Construction & Identity (L0/L1)', () => {
    it('builds a structural Jacobian matrix without NaN or null entries', () => {
      const q: JointState3D = { q1: Math.PI / 4, q2: Math.PI / 3, q3: Math.PI / 6 };
      const J = engine.buildSymbolicJacobian(q, linkLengths);

      expect(J).toBeDefined();
      expect(J.m00).toBeDefined();
      expect(J.m22).toBeDefined();

      // Ensure every element evaluates to a real number
      const elements = [
        J.m00, J.m01, J.m02,
        J.m10, J.m11, J.m12,
        J.m20, J.m21, J.m22,
      ];
      for (const el of elements) {
        const val = engine.evaluateAst(el);
        expect(Number.isFinite(val)).toBe(true);
        expect(Number.isNaN(val)).toBe(false);
      }
    });

    it('preserves L1_IDENTITY: evaluating an identical factor ratio 0_F / 0_F returns 1', () => {
      const factorF = {
        kind: 'SIN' as const,
        arg: { kind: 'VAR' as const, name: 'q3' as const, value: 0, type: 'JOINT_ANGLE' as const },
        type: 'TRIGONOMETRIC' as const,
      };

      const semanticZeroNumerator = {
        kind: 'SEMANTIC_ZERO' as const,
        originExpr: factorF,
        evaluatedWeight: 0,
      };

      const semanticZeroDenominator = {
        kind: 'SEMANTIC_ZERO' as const,
        originExpr: factorF,
        evaluatedWeight: 0,
      };

      const ratio = {
        kind: 'DIV' as const,
        numerator: semanticZeroNumerator,
        denominator: semanticZeroDenominator,
        type: 'SCALAR' as const,
      };

      const result = engine.evaluateAst(ratio);
      expect(result).toBe(1);
    });
  });

  describe('2. Singularity Handling via SP2/SP4 & A1/A4/A6', () => {
    it('handles extended elbow singularity q3 = 0 without NaN or throwing', () => {
      // q3 = 0 implies det(J) = L1 * L2 * sin(0) = 0
      const qSingular: JointState3D = { q1: 0, q2: Math.PI / 4, q3: 0 };
      const cNorm: Vector3D = { x: 0, y: 0, z: 1 }; // Move purely upwards

      const solution = engine.solveJointVelocities(qSingular, cNorm, linkLengths);

      expect(solution).toBeDefined();
      expect(solution.isSingularZone).toBe(true);
      expect(solution.singularityType).toBe('ELBOW_EXTENDED');
      expect(Number.isNaN(solution.dq.dq1)).toBe(false);
      expect(Number.isNaN(solution.dq.dq2)).toBe(false);
      expect(Number.isNaN(solution.dq.dq3)).toBe(false);
      expect(Number.isFinite(solution.dq.dq1)).toBe(true);
      expect(Number.isFinite(solution.dq.dq2)).toBe(true);
      expect(Number.isFinite(solution.dq.dq3)).toBe(true);

      // Verify transformation logs contain SP2/SP4 and A6 / A4
      expect(solution.transformationLogs.length).toBeGreaterThan(0);
      const rulesApplied = solution.transformationLogs.map(l => l.rule);
      expect(rulesApplied).toContain('SP4_SEMANTIC_INDEX');
    });

    it('resolves A6 Geometric Bridge (0_F * oo_G = F * G) in NUMERICAL LAYER O(1)', () => {
      const factorF = {
        kind: 'CONST' as const,
        value: 2.5,
        type: 'SCALAR' as const,
      };
      const factorG = {
        kind: 'CONST' as const,
        value: 4.0,
        type: 'SCALAR' as const,
      };

      const monolith = {
        kind: 'MONOLITH_INVARIANT' as const,
        factorZero: {
          kind: 'SEMANTIC_ZERO' as const,
          originExpr: factorF,
          evaluatedWeight: 0,
        },
        factorInf: {
          kind: 'SEMANTIC_INF' as const,
          indexExpr: factorG,
          evaluatedIndex: 4.0,
        },
        invariantValue: 2.5 * 4.0,
      };

      const evalVal = engine.evaluateAst(monolith);
      expect(evalVal).toBe(10.0);
    });

    it('handles shoulder pole singularity (x=0, y=0, R=0) safely', () => {
      const qPole: JointState3D = { q1: 0, q2: Math.PI / 2, q3: -Math.PI / 2 };
      const cNorm: Vector3D = { x: 1, y: 0, z: 0 }; // Attempt to move radially from origin

      const solution = engine.solveJointVelocities(qPole, cNorm, linkLengths);
      expect(Number.isNaN(solution.dq.dq1)).toBe(false);
      expect(Number.isNaN(solution.dq.dq2)).toBe(false);
      expect(Number.isNaN(solution.dq.dq3)).toBe(false);
    });
  });

  describe('3. Manipulator Trajectory Tracking (Steps 1 to 9)', () => {
    it('executes iterative closed-loop tracking to target position B', () => {
      const initialJoints: JointState3D = { q1: 0, q2: Math.PI / 4, q3: Math.PI / 4 };
      const targetB: Vector3D = { x: 1.2, y: 0.4, z: 1.0 };
      const dt = 0.05;

      let currentJoints = { ...initialJoints };
      let finalResult = controller.step(currentJoints, targetB, linkLengths, dt);
      const initialDist = finalResult.distanceToTarget;

      // Simulate 50 steps
      for (let i = 0; i < 50; i++) {
        finalResult = controller.step(currentJoints, targetB, linkLengths, dt);
        currentJoints = finalResult.nextJoints;
        if (finalResult.isTargetReached) break;
      }

      // Distance should significantly decrease towards target
      expect(finalResult.distanceToTarget).toBeLessThan(initialDist);
      expect(Number.isNaN(finalResult.distanceToTarget)).toBe(false);
    });

    it('passes through extended boundary singularity without losing trajectory direction', () => {
      // Start in a singular configuration: arm fully outstretched
      const singularJoints: JointState3D = { q1: 0, q2: 0, q3: 0 };
      const targetTowardsInside: Vector3D = { x: 0.8, y: 0, z: 0.8 }; // Move inwards
      const dt = 0.04;

      let currentJoints = { ...singularJoints };
      let stepResult = controller.step(currentJoints, targetTowardsInside, linkLengths, dt);

      // Verify no NaN or infinite velocity
      expect(Number.isNaN(stepResult.nextJoints.q3)).toBe(false);
      expect(stepResult.solution.isSingularZone).toBe(true);

      // Subsequent step progresses away from singularity
      for (let i = 0; i < 15; i++) {
        stepResult = controller.step(currentJoints, targetTowardsInside, linkLengths, dt);
        currentJoints = stepResult.nextJoints;
      }

      expect(Math.abs(currentJoints.q3)).toBeGreaterThan(0.01);
      expect(Number.isNaN(currentJoints.q3)).toBe(false);
    });
  });

  describe('4. Symbolic Null-Space (P6 integration)', () => {
    it('builds a symbolic null-space 2x3 and evaluates to an orthogonal vector', () => {
      const q: JointState3D = { q1: Math.PI / 6, q2: Math.PI / 4, q3: Math.PI / 3 };
      const J = engine.buildSymbolicJacobian(q, linkLengths);

      const row0 = [J.m00, J.m01, J.m02] as const;
      const row1 = [J.m10, J.m11, J.m12] as const;

      const nullSpace = engine.buildSymbolicNullSpace2x3(row0, row1);
      expect(nullSpace.length).toBe(3);

      const vx = engine.evaluateAst(nullSpace[0]);
      const vy = engine.evaluateAst(nullSpace[1]);
      const vz = engine.evaluateAst(nullSpace[2]);

      expect(Number.isFinite(vx)).toBe(true);
      expect(Number.isFinite(vy)).toBe(true);
      expect(Number.isFinite(vz)).toBe(true);

      // Dot product with Row 0 (numerical check)
      const dot0 = engine.evaluateAst(row0[0]) * vx + engine.evaluateAst(row0[1]) * vy + engine.evaluateAst(row0[2]) * vz;
      // Dot product with Row 1 (numerical check)
      const dot1 = engine.evaluateAst(row1[0]) * vx + engine.evaluateAst(row1[1]) * vy + engine.evaluateAst(row1[2]) * vz;

      // In floating point, dot products should be extremely close to 0
      expect(dot0).toBeCloseTo(0, 9);
      expect(dot1).toBeCloseTo(0, 9);

      // P6 Requirement: EXACT SYMBOLIC ORTHOGONALITY
      // We must prove dot(J1, n) = 0 exactly in AST structure without floats.
      const isOrthogonal0 = engine.verifySymbolicOrthogonality(row0, nullSpace);
      const isOrthogonal1 = engine.verifySymbolicOrthogonality(row1, nullSpace);
      
      expect(isOrthogonal0).toBe(true);
      expect(isOrthogonal1).toBe(true);
    });
  });

  describe('P11: AST Unified Model Adapter (toCoreAst & fromCoreAst)', () => {
    it('converts kinematic AST to core AST and back preserving structural semantics', () => {
      const q: JointState3D = { q1: Math.PI / 4, q2: Math.PI / 3, q3: Math.PI / 6 };
      const J = engine.buildSymbolicJacobian(q, linkLengths);

      // Convert J.m00 (kinematic AST) to Core AST
      const coreNode = toCoreAst(J.m00);
      expect(coreNode).toBeDefined();
      expect(coreNode.nodeType).toBe('Multiply');

      // Convert Core AST back to Kinematic AST with context
      const roundTrip = fromCoreAst(coreNode, {
        q1: q.q1,
        q2: q.q2,
        q3: q.q3,
        L0: linkLengths[0],
        L1: linkLengths[1],
        L2: linkLengths[2],
      });
      expect(roundTrip).toBeDefined();

      // Ensure numerical evaluation remains exact
      const valOriginal = engine.evaluateAst(J.m00);
      const valRoundTrip = engine.evaluateAst(roundTrip);
      expect(valRoundTrip).toBeCloseTo(valOriginal, 10);
    });
  });
});
