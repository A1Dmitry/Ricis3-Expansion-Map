// ============================================================================
// RICIS-III v7.7 SYMBOLIC JACOBIAN AST CONTRACTS
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// Architectural Level: Level 3 (Monolith Algebra & Singularity Axioms)
// ============================================================================

import type { Vector3D, JointState3D } from './kinematicEngine.contracts';

/**
 * Ontological Identity Type (L1C2 Type as Identity).
 */
export type RicisOntologyType =
  | 'SCALAR'
  | 'LINK_LENGTH'
  | 'JOINT_ANGLE'
  | 'TRIGONOMETRIC'
  | 'VELOCITY'
  | 'COORDINATE_CARTESIAN'
  | 'COORDINATE_CYLINDRICAL'
  | 'MONOLITH_COMPOSITE';

/**
 * Structural AST Node for the Symbolic Jacobian & Kinematic Chain.
 * Preserves functional identity (L0/L1) without premature floating-point numerical flattening.
 */
export type RicisAstExpr =
  | { readonly kind: 'CONST'; readonly value: number; readonly type: RicisOntologyType; readonly label?: string }
  | { readonly kind: 'PARAM'; readonly name: 'L0' | 'L1' | 'L2'; readonly value: number; readonly type: 'LINK_LENGTH' }
  | { readonly kind: 'VAR'; readonly name: 'q1' | 'q2' | 'q3'; readonly value: number; readonly type: 'JOINT_ANGLE' }
  | { readonly kind: 'SIN'; readonly arg: RicisAstExpr; readonly type: 'TRIGONOMETRIC' }
  | { readonly kind: 'COS'; readonly arg: RicisAstExpr; readonly type: 'TRIGONOMETRIC' }
  | { readonly kind: 'NEG'; readonly expr: RicisAstExpr; readonly type: RicisOntologyType }
  | { readonly kind: 'ADD'; readonly left: RicisAstExpr; readonly right: RicisAstExpr; readonly type: RicisOntologyType }
  | { readonly kind: 'SUB'; readonly left: RicisAstExpr; readonly right: RicisAstExpr; readonly type: RicisOntologyType }
  | { readonly kind: 'MUL'; readonly left: RicisAstExpr; readonly right: RicisAstExpr; readonly type: RicisOntologyType }
  | { readonly kind: 'DIV'; readonly numerator: RicisAstExpr; readonly denominator: RicisAstExpr; readonly type: RicisOntologyType }
  /**
   * SP4 Strongly-typed semantic zero: 0_F where F is the generating algebraic expression.
   */
  | { readonly kind: 'SEMANTIC_ZERO'; readonly originExpr: RicisAstExpr; readonly evaluatedWeight: number }
  /**
   * A1 Strongly-typed infinity: oo_F preserving numerator index F.
   */
  | { readonly kind: 'SEMANTIC_INF'; readonly indexExpr: RicisAstExpr; readonly evaluatedIndex: number }
  /**
   * Monolith Invariant node generated via A6 Geometric Bridge: 0_F * oo_G = F * G.
   */
  | {
      readonly kind: 'MONOLITH_INVARIANT';
      readonly factorZero: RicisAstExpr;
      readonly factorInf: RicisAstExpr;
      readonly invariantValue: number;
    };

/**
 * 3x3 Symbolic Matrix of AST Expressions representing the Analytical Jacobian J(q).
 */
export interface ISymbolicJacobianMatrix3D {
  readonly m00: RicisAstExpr;
  readonly m01: RicisAstExpr;
  readonly m02: RicisAstExpr;

  readonly m10: RicisAstExpr;
  readonly m11: RicisAstExpr;
  readonly m12: RicisAstExpr;

  readonly m20: RicisAstExpr;
  readonly m21: RicisAstExpr;
  readonly m22: RicisAstExpr;
}

/**
 * Axiom applied during AST transformation.
 */
export type RicisAxiomRule =
  | 'L0_CONTINUITY'
  | 'L1_IDENTITY'
  | 'SP2_REDUCTION'
  | 'SP4_SEMANTIC_INDEX'
  | 'A1_INDEXING'
  | 'A4_ZERO_RATIO'
  | 'A5_INF_RATIO'
  | 'A6_GEOMETRIC_BRIDGE';

/**
 * Audit log entry for AST transformation step.
 */
export interface IRicisTransformationLogEntry {
  readonly phase: 'Phase -1' | 'Phase 0' | 'Phase 0.5' | 'Phase 1' | 'Phase 2' | 'Phase 3' | 'Phase 4' | 'Phase 5' | 'Phase 6';
  readonly rule: RicisAxiomRule;
  readonly targetSubtree: string;
  readonly reducedSubtree: string;
  readonly justification: string;
}

/**
 * Result of resolving inverse Jacobian action on direction vector:
 * dq = J_inv(q) * C_norm via RICIS AST reduction.
 */
export interface IRicisAstInverseSolution {
  readonly dq: { readonly dq1: number; readonly dq2: number; readonly dq3: number };
  readonly evaluatedDeterminantAst: RicisAstExpr;
  readonly isSingularZone: boolean;
  readonly singularityType: 'NONE' | 'ELBOW_EXTENDED' | 'ELBOW_RETRACTED' | 'SHOULDER_POLE';
  readonly transformationLogs: readonly IRicisTransformationLogEntry[];
  readonly invariantPreserved: boolean;
  readonly astNodeCount: number;
}

/**
 * Abstract factory / Service contract for building and reducing the Symbolic Jacobian AST.
 */
export interface IRicisSymbolicJacobianEngine {
  buildSymbolicJacobian(
    q: JointState3D,
    linkLengths: readonly [number, number, number],
  ): ISymbolicJacobianMatrix3D;

  solveJointVelocities(
    q: JointState3D,
    cNorm: Vector3D,
    linkLengths: readonly [number, number, number],
    coordinateMode?: 'CARTESIAN' | 'CYLINDRICAL',
  ): IRicisAstInverseSolution;

  evaluateAst(expr: RicisAstExpr): number;
}

/**
 * Controller contract orchestrating steps 1 to 9 of manipulator trajectory tracking.
 */
export interface IRicisTrajectoryController {
  step(
    currentJoints: JointState3D,
    targetPosition: Vector3D,
    linkLengths: readonly [number, number, number],
    dt: number,
    velocityLimit?: number,
  ): {
    readonly nextJoints: JointState3D;
    readonly currentTcp: Vector3D;
    readonly errorVector: Vector3D;
    readonly distanceToTarget: number;
    readonly isTargetReached: boolean;
    readonly solution: IRicisAstInverseSolution;
  };
}
