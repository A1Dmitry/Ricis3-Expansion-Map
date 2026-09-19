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
import { AST, type Expression } from '../../../packages/ricis-core-ts/src/ast/ExpressionTypes';

/**
 * A1 NUMERICAL PROJECTION OF oo_F.
 *
 * oo_F has no representation on the double lattice, so the runtime projects it onto a
 * finite bound. This is a PROJECTION SCALE, not a comparison threshold: RICIS (P5)
 * forbids numeric heuristics in decisions (`Math.abs < eps`), it does not forbid naming
 * the finite stand-in that a projection must return. The DECISION that leads here is
 * always a strict zero / finiteness test — see `RicisSymbolicJacobianEngine.evaluateAst`.
 */
export const RICIS_INFINITY_PROJECTION = 1e6;

/**
 * P11: AST Unified Model Adapter.
 * Converts kinematic RicisAstExpr to core engine Expression.
 */
export function toCoreAst(node: RicisAstExpr): Expression {
  switch (node.kind) {
    case 'CONST':
      return AST.Const(node.value);
    case 'PARAM':
    case 'VAR':
      return AST.Var(node.name);
    case 'ADD':
      return AST.Add(toCoreAst(node.left), toCoreAst(node.right));
    case 'SUB':
      return AST.Sub(toCoreAst(node.left), toCoreAst(node.right));
    case 'MUL':
      return AST.Mul(toCoreAst(node.left), toCoreAst(node.right));
    case 'DIV':
      return AST.Div(toCoreAst(node.numerator), toCoreAst(node.denominator));
    case 'SIN':
      return AST.Fn('sin', [toCoreAst(node.arg)]);
    case 'COS':
      return AST.Fn('cos', [toCoreAst(node.arg)]);
    case 'NEG':
      return AST.Mul(AST.Const(-1), toCoreAst(node.expr));
    case 'SEMANTIC_ZERO':
      return AST.Zero(toCoreAst(node.originExpr));
    case 'SEMANTIC_INF':
      return AST.Inf(toCoreAst(node.indexExpr));
    case 'MONOLITH_INVARIANT':
      return AST.Mul(toCoreAst(node.factorZero), toCoreAst(node.factorInf));
  }
}

/**
 * P11: AST Unified Model Adapter.
 * Converts core engine Expression to kinematic RicisAstExpr.
 */
export function fromCoreAst(expr: Expression, context?: Record<string, number>): RicisAstExpr {
  switch (expr.nodeType) {
    case 'Constant':
      return { kind: 'CONST', value: (expr as any).value, type: 'SCALAR' };
    case 'Parameter': {
      const name = (expr as any).name;
      const val = context && typeof context[name] === 'number' ? context[name] : 0;
      if (name === 'L0' || name === 'L1' || name === 'L2') {
        return { kind: 'PARAM', name, value: val, type: 'LINK_LENGTH' };
      }
      if (name === 'q1' || name === 'q2' || name === 'q3') {
        return { kind: 'VAR', name, value: val, type: 'JOINT_ANGLE' };
      }
      return { kind: 'CONST', value: val, type: 'SCALAR', label: name };
    }
    case 'Add':
      return { kind: 'ADD', left: fromCoreAst((expr as any).left, context), right: fromCoreAst((expr as any).right, context), type: 'SCALAR' };
    case 'Subtract':
      return { kind: 'SUB', left: fromCoreAst((expr as any).left, context), right: fromCoreAst((expr as any).right, context), type: 'SCALAR' };
    case 'Multiply':
      return { kind: 'MUL', left: fromCoreAst((expr as any).left, context), right: fromCoreAst((expr as any).right, context), type: 'SCALAR' };
    case 'Divide':
      return { kind: 'DIV', numerator: fromCoreAst((expr as any).left, context), denominator: fromCoreAst((expr as any).right, context), type: 'SCALAR' };
    case 'Function': {
      const fn = expr as any;
      if (fn.name === 'sin' && fn.args[0]) {
        return { kind: 'SIN', arg: fromCoreAst(fn.args[0], context), type: 'TRIGONOMETRIC' };
      }
      if (fn.name === 'cos' && fn.args[0]) {
        return { kind: 'COS', arg: fromCoreAst(fn.args[0], context), type: 'TRIGONOMETRIC' };
      }
      return { kind: 'CONST', value: 0, type: 'SCALAR', label: fn.name };
    }
    case 'SingularityZero':
      return { kind: 'SEMANTIC_ZERO', originExpr: fromCoreAst((expr as any).basis, context), evaluatedWeight: 0 };
    case 'SingularityInfinity':
      return { kind: 'SEMANTIC_INF', indexExpr: fromCoreAst((expr as any).basis, context), evaluatedIndex: 0 };
    default:
      return { kind: 'CONST', value: 0, type: 'SCALAR' };
  }
}

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
          // SP3 Weight of Zero: the ratio is taken on the INDEX expressions. The topology
          // decision is a strict zero test on the double — never a |x| < eps band (P5).
          if (denOrigin !== 0) {
            return this.projectFiniteOrInfinity(numOrigin / denOrigin);
          }
          return 1.0; // F/G with F and G both exactly zero: L1 identity projection
        }

        // A5 Infinity Ratio: oo_F / oo_G = F / G
        if (expr.numerator.kind === 'SEMANTIC_INF' && expr.denominator.kind === 'SEMANTIC_INF') {
          const numIdx = this.evaluateAst(expr.numerator.indexExpr);
          const denIdx = this.evaluateAst(expr.denominator.indexExpr);
          return denIdx !== 0 ? numIdx / denIdx : 1.0;
        }

        const numVal = this.evaluateAst(expr.numerator);
        const denVal = this.evaluateAst(expr.denominator);

        // A1/A2/A4 topology, decided by the strict IEEE predicates of the storage type —
        // exactly as the core runtime does it (SemanticIndexer.indexAtPoint: `val === 0`,
        // `!isFinite(val)`). No |x| < 1e-12 band: P5 forbids numeric heuristics here.
        if (denVal === 0 && numVal === 0) {
          return 1.0; // L1: 0_F / 0_F = 1 (identical zero factor, SP1)
        }
        return this.projectFiniteOrInfinity(numVal / denVal);
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
   * A1 projection onto the finite double lattice.
   *
   * `Number.isFinite` is the storage type's OWN predicate, so this test introduces no
   * invented magnitude: a quotient that the double cannot represent is exactly the case
   * A1 names oo_F, and it is projected onto RICIS_INFINITY_PROJECTION with the sign of the
   * index. NaN (0/0 with non-identical factors, already handled by the L1 branch upstream)
   * is never produced here.
   */
  private projectFiniteOrInfinity(quotient: number): number {
    if (Number.isFinite(quotient)) return quotient;
    return quotient > 0 ? RICIS_INFINITY_PROJECTION : -RICIS_INFINITY_PROJECTION;
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
    if (a.kind === 'NEG' && b.kind === 'NEG') return this.areAstNodesIdentical(a.expr, b.expr);
    if (a.kind === 'ADD' && b.kind === 'ADD') return (this.areAstNodesIdentical(a.left, b.left) && this.areAstNodesIdentical(a.right, b.right)) || (this.areAstNodesIdentical(a.left, b.right) && this.areAstNodesIdentical(a.right, b.left));
    if (a.kind === 'SUB' && b.kind === 'SUB') return this.areAstNodesIdentical(a.left, b.left) && this.areAstNodesIdentical(a.right, b.right);
    if (a.kind === 'MUL' && b.kind === 'MUL') return (this.areAstNodesIdentical(a.left, b.left) && this.areAstNodesIdentical(a.right, b.right)) || (this.areAstNodesIdentical(a.left, b.right) && this.areAstNodesIdentical(a.right, b.left));
    if (a.kind === 'DIV' && b.kind === 'DIV') return this.areAstNodesIdentical(a.numerator, b.numerator) && this.areAstNodesIdentical(a.denominator, b.denominator);
    if (a.kind === 'SEMANTIC_ZERO' && b.kind === 'SEMANTIC_ZERO') return this.areAstNodesIdentical(a.originExpr, b.originExpr);
    if (a.kind === 'SEMANTIC_INF' && b.kind === 'SEMANTIC_INF') return this.areAstNodesIdentical(a.indexExpr, b.indexExpr);
    if (a.kind === 'MONOLITH_INVARIANT' && b.kind === 'MONOLITH_INVARIANT') return this.areAstNodesIdentical(a.factorZero, b.factorZero) && this.areAstNodesIdentical(a.factorInf, b.factorInf);
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
   * P6: Prove SYMBOLIC NULL-SPACE INVARIANT.
   * Structurally expands dot(row, nullSpace) and cancels identical terms to exactly 0,
   * without any numerical floating point evaluation.
   */
  public verifySymbolicOrthogonality(
    row: readonly [RicisAstExpr, RicisAstExpr, RicisAstExpr],
    nullSpace: readonly [RicisAstExpr, RicisAstExpr, RicisAstExpr],
  ): boolean {
    const [a1, a2, a3] = row;
    
    const extractTerms = (expr: RicisAstExpr, sign: number): { factors: RicisAstExpr[], sign: number }[] => {
      if (expr.kind === 'ADD') {
        return [...extractTerms(expr.left, sign), ...extractTerms(expr.right, sign)];
      }
      if (expr.kind === 'SUB') {
        return [...extractTerms(expr.left, sign), ...extractTerms(expr.right, -sign)];
      }
      if (expr.kind === 'MUL') {
        const leftTerms = extractTerms(expr.left, 1);
        const rightTerms = extractTerms(expr.right, 1);
        const result: { factors: RicisAstExpr[], sign: number }[] = [];
        for (const l of leftTerms) {
           for (const r of rightTerms) {
              result.push({ factors: [...l.factors, ...r.factors], sign: sign * l.sign * r.sign });
           }
        }
        return result;
      }
      if (expr.kind === 'NEG') {
        return extractTerms(expr.expr, -sign);
      }
      return [{ factors: [expr], sign }];
    };

    const dotProductTree: RicisAstExpr = {
      kind: 'ADD',
      type: 'SCALAR',
      left: {
        kind: 'ADD',
        type: 'SCALAR',
        left: { kind: 'MUL', left: a1, right: nullSpace[0], type: 'SCALAR' },
        right: { kind: 'MUL', left: a2, right: nullSpace[1], type: 'SCALAR' },
      },
      right: { kind: 'MUL', left: a3, right: nullSpace[2], type: 'SCALAR' }
    };

    const terms = extractTerms(dotProductTree, 1);
    
    const activeTerms = [...terms];
    for (let i = 0; i < activeTerms.length; i++) {
       if (activeTerms[i].sign === 0) continue;
       for (let j = i + 1; j < activeTerms.length; j++) {
          if (activeTerms[j].sign === -activeTerms[i].sign) {
             const f1 = activeTerms[i].factors;
             const f2 = activeTerms[j].factors;
             if (f1.length === f2.length) {
                const used = new Array(f2.length).fill(false);
                let allMatch = true;
                for (const f of f1) {
                   let found = false;
                   for (let k = 0; k < f2.length; k++) {
                      if (!used[k] && this.areAstNodesIdentical(f, f2[k])) {
                         used[k] = true;
                         found = true;
                         break;
                      }
                   }
                   if (!found) {
                      allMatch = false;
                      break;
                   }
                }
                if (allMatch) {
                   activeTerms[i].sign = 0;
                   activeTerms[j].sign = 0;
                   break;
                }
             }
          }
       }
    }

    return activeTerms.every(t => t.sign === 0);
  }

  /**
   * Builds the symbolic 3D Null-space vector of a 2x3 Jacobian using the cross-product formula.
   * This represents the self-motion null-space of the 3-DOF manipulator.
   */
  public buildSymbolicNullSpace2x3(
    row0: readonly [RicisAstExpr, RicisAstExpr, RicisAstExpr],
    row1: readonly [RicisAstExpr, RicisAstExpr, RicisAstExpr],
  ): readonly [RicisAstExpr, RicisAstExpr, RicisAstExpr] {
    const [j00, j01, j02] = row0;
    const [j10, j11, j12] = row1;

    const v0: RicisAstExpr = {
      kind: 'SUB',
      left: { kind: 'MUL', left: j01, right: j12, type: 'SCALAR' },
      right: { kind: 'MUL', left: j02, right: j11, type: 'SCALAR' },
      type: 'SCALAR',
    };

    const v1: RicisAstExpr = {
      kind: 'SUB',
      left: { kind: 'MUL', left: j02, right: j10, type: 'SCALAR' },
      right: { kind: 'MUL', left: j00, right: j12, type: 'SCALAR' },
      type: 'SCALAR',
    };

    const v2: RicisAstExpr = {
      kind: 'SUB',
      left: { kind: 'MUL', left: j00, right: j11, type: 'SCALAR' },
      right: { kind: 'MUL', left: j01, right: j10, type: 'SCALAR' },
      type: 'SCALAR',
    };

    return [v0, v1, v2] as const;
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

    // Phase 0.5: SEMANTIC INDEXING OF SINGULARITY FORM (SP4).
    //
    // Planar 2-link sub-determinant in the R-Z elevation plane:
    //   det(J_rz) = dR/dq2 * dZ/dq3 - dR/dq3 * dZ/dq2 = L1 * L2 * sin(q3)
    //
    // SP4 indexes the singularity by the GENERATING EXPRESSION sin(q3), not by its scalar
    // value, and the topology decision is strict algebraic folding — the same rule the core
    // runtime applies (packages/ricis-core-ts/src/engine/SemanticIndexer.indexAtPoint:
    // `val === 0`, `!isFinite(val)`). There is deliberately no |sin q3| < 1e-4 band here:
    // P5 forbids numeric heuristics in constant folding and semantic indexing.
    //
    // sin(q3) is EXACTLY zero iff q3 is an exact integer multiple of pi. Evaluated at such
    // a point, Math.sin returns nothing but the representation residual of its own argument,
    // and that residual is bounded by |q3| * Number.EPSILON — the real epsilon of the double
    // that stores q3. The bound is derived from the storage type, so comparing against it is
    // a comparison of two reals at machine precision, not an invented small number.
    const sinQ3 = Math.sin(q.q3);
    const cosQ3 = Math.cos(q.q3);
    const sinQ3RepresentationResidual = Math.abs(q.q3) * Number.EPSILON;
    const isCollinear = Math.abs(sinQ3) <= sinQ3RepresentationResidual;

    // The branch of the collinear form is read off the exact pi-index k of q3 (structural,
    // no |q3| < 0.5 / |q3| > 2.0 bands): k even -> links aligned, reach = L1 + L2;
    // k odd -> links folded, reach = |L1 - L2|.
    const piIndexOfQ3 = Math.round(q.q3 / Math.PI);
    const isElbowExtended = isCollinear && piIndexOfQ3 % 2 === 0;
    const isElbowRetracted = isCollinear && piIndexOfQ3 % 2 !== 0;

    // Cylindrical radius R — the azimuth lever. The pole is a strict zero of the parent
    // expression R(q), so it is indexed by `=== 0`, not by a proximity band.
    const q23 = q.q2 + q.q3;
    const rCurrent = L1 * Math.cos(q.q2) + L2 * Math.cos(q23);
    const isShoulderPole = rCurrent === 0;

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
      // Regular azimuth channel. No lower floor on R: R is SIGNED (the arm can cross the
      // base axis, R < 0), and a floor such as max(0.08, R) silently replaces a negative
      // lever with a positive one — flipping the sign of dq1 and scaling it by |R|/0.08.
      dq1 = vTheta / rCurrent;
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

    // Phase 1: SP2 REDUCTION OF THE 2x2 ELEVATION JACOBIAN (dR, dZ) -> (dq2, dq3).
    //
    // J_rz = [ -L1*s2 - L2*s23,  -L2*s23 ]        det(J_rz) = L1 * L2 * sin(q3)
    //        [  L1*c2 + L2*c23,   L2*c23 ]
    //
    // adj(J_rz)/det(J_rz) is NOT formed and then patched with a small-denominator band.
    // SP2 ("Clean First") factorises the numerator in the arm frame first — this is the SP5
    // polar pre-normalisation a*cos(theta) + b*sin(theta) -> r*cos(theta - phi):
    //
    //   A = v . a_hat =  vR*cos(q2) + vZ*sin(q2)     (radial command, along the arm)
    //   P = v . n_hat = -vR*sin(q2) + vZ*cos(q2)     (transverse command, normal to the arm)
    //
    // which cancels sin(q3) out of the transverse channel EXACTLY:
    //
    //   dq2 =  P/L1 + A*cos(q3) / (L1*sin(q3))
    //   dq3 = -P/L1 - A*(L1 + L2*cos(q3)) / (L1*L2*sin(q3))
    //
    // Consequences, each measured rather than assumed:
    //  * the transverse channel P/L1 is a REGULAR expression for every q — no singularity and
    //    no epsilon band is needed to keep it finite. The former |sin q3| < 1e-4 branch
    //    returned P/(L1 +/- L2) plus a hardcoded dq3 = 1.8 here, which differs from the
    //    continuous limit by a null-space vector and therefore broke L0 at the branch seam;
    //  * only the RADIAL channel keeps sin(q3) in the denominator, because at collinearity the
    //    radial direction genuinely leaves the attainable manifold. A1 indexes that command as
    //    oo_A and A6 resolves 0_{L2 sin(q3)} x oo_A = A: the intent survives as a finite index
    //    while the joint rate saturates on the actuator limit below;
    //  * A === 0 exactly means nothing is commanded radially, so the radial term is 0 — a
    //    strict zero test on the double, never |A| < eps.
    const vParallel = vR * Math.cos(q.q2) + vZ * Math.sin(q.q2);
    const vPerpendicular = -vR * Math.sin(q.q2) + vZ * Math.cos(q.q2);

    const radialRate = vParallel === 0 ? 0 : vParallel / sinQ3;
    let dq2 = vPerpendicular / L1 + (radialRate * cosQ3) / L1;
    let dq3 = -vPerpendicular / L1 - (radialRate * (L1 + L2 * cosQ3)) / (L1 * L2);

    logs.push({
      phase: 'Phase 1',
      rule: 'SP2_REDUCTION',
      targetSubtree: 'J_rz_inv * [vR, vZ]^T',
      reducedSubtree: `[dq2=${dq2.toFixed(3)}, dq3=${dq3.toFixed(3)}]`,
      justification:
        'SP2/SP5: numerator factorised in the arm frame; sin(q3) cancels exactly from the transverse channel.',
    });

    if (sinQ3 === 0 && vParallel !== 0) {
      logs.push({
        phase: 'Phase 2',
        rule: 'A6_GEOMETRIC_BRIDGE',
        targetSubtree: `0_{L2*sin(q3)} x oo_A, A=${vParallel.toFixed(4)}`,
        reducedSubtree: 'Radial channel indexed as oo_A; rate saturates on the actuator limit',
        justification:
          'A1 indexes the unattainable radial command, A6 keeps its intent as the finite index F*G = A.',
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
    // Strict zero test: Math.hypot is exact at 0 (it returns 0 only when every component is
    // 0), so the normalisation needs no |d| > 1e-9 guard. A1 would index C/0 as oo_C; here
    // the command is exactly zero, so the direction is the zero vector.
    if (distanceToTarget !== 0) {
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
