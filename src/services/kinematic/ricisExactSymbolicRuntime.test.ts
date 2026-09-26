// ============================================================================
// P5-EXACT-SYMBOLIC-RUNTIME — GUARDS FOR THE KINEMATIC RICIS LAYER
//
// RICIS decides the topology of a singularity STRUCTURALLY: substitute into the
// parent expression, fold constants exactly, then test `val === 0` / `!isFinite(val)`
// (SP4 semantic indexing, and the reference implementation
// packages/ricis-core-ts/src/engine/SemanticIndexer.indexAtPoint). A band of the
// form `Math.abs(x) < 1e-k` is a numeric heuristic and is forbidden by P5.
//
// An epsilon is admissible ONLY as a comparison of two reals at the real epsilon
// of the storage type (Number.EPSILON for a double), never as an invented small
// number. These tests pin both halves of that rule: a source scan proving no
// invented magnitude survives in the RICIS runtime, and behavioural proofs that
// the decisions are now exact.
// ============================================================================

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  RicisSymbolicJacobianEngine,
  RICIS_INFINITY_PROJECTION,
} from './ricisSymbolicJacobian';
import { Planar3LinkKinematicService } from './planar3LinkKinematicService';
import { FiveLinkRedundantKinematicService } from './fiveLinkRedundantKinematicService';
import { GenericNLinkKinematicService } from './genericNLinkKinematicService';
import type { JointState3D, Vector3D } from '../../model/kinematicEngine.contracts';
import { MANIPULATOR_LINK_LENGTHS_M } from './manipulatorConstants';

const KINEMATIC_RICIS_MODULE = 'src/services/kinematic/ricisSymbolicJacobian.ts';
const LINK_LENGTHS = MANIPULATOR_LINK_LENGTHS_M;

/** Strips block and line comments so the scan sees code, not documentation. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
}

function collectTypeScriptFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectTypeScriptFiles(full));
    else if (full.endsWith('.ts') && !full.endsWith('.test.ts')) out.push(full);
  }
  return out;
}

describe('P5: no invented numeric thresholds in the RICIS runtime', () => {
  it('the kinematic RICIS module decides topology without a magnitude band', () => {
    const code = stripComments(
      readFileSync(resolve(process.cwd(), KINEMATIC_RICIS_MODULE), 'utf8')
    );
    // No decimal-exponent literal at all in executable code: neither `1e-4` bands nor
    // `1e-12` division guards. The only magnitudes left are Number.EPSILON (the storage
    // type's own epsilon) and the documented A1 projection scale.
    expect(code).not.toMatch(/\d+(\.\d+)?[eE][+-]\d+/);
    expect(code).toContain('Number.EPSILON');
  });

  it('the exact symbolic core and the seed stay free of numeric thresholds', () => {
    const roots = ['packages/ricis-core-ts/src', 'src/ricisSeed'];
    const offenders: string[] = [];
    for (const root of roots) {
      for (const file of collectTypeScriptFiles(resolve(process.cwd(), root))) {
        const code = stripComments(readFileSync(file, 'utf8'));
        // `< 1e-k` / `> 1e-k` style comparisons are the heuristic P5 forbids.
        if (/[<>]=?\s*\d+(\.\d+)?[eE]-\d+/.test(code)) offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('Phase 0.5 (SP4): the singularity is indexed by the expression, not by a band', () => {
  const engine = new RicisSymbolicJacobianEngine();
  const up: Vector3D = { x: 0, y: 0, z: 1 };
  const at = (q3: number): JointState3D => ({ q1: 0.3, q2: 0.7, q3 });

  it('indexes exactly at the structural zeros of sin(q3): q3 = k*pi', () => {
    expect(engine.solveJointVelocities(at(0), up, LINK_LENGTHS).singularityType).toBe('ELBOW_EXTENDED');
    expect(engine.solveJointVelocities(at(2 * Math.PI), up, LINK_LENGTHS).singularityType).toBe('ELBOW_EXTENDED');
    expect(engine.solveJointVelocities(at(Math.PI), up, LINK_LENGTHS).singularityType).toBe('ELBOW_RETRACTED');
    expect(engine.solveJointVelocities(at(-Math.PI), up, LINK_LENGTHS).singularityType).toBe('ELBOW_RETRACTED');
  });

  it('no longer indexes the former 1e-4 neighbourhood: those are regular points', () => {
    // Math.sin at these arguments is a genuine non-zero double, far above the
    // representation residual |q3| * Number.EPSILON. The old `absSinQ3 < 1e-4` band
    // declared ELBOW_EXTENDED here; that was a heuristic, not a structural fact.
    for (const q3 of [1e-4, 1e-7, 0.073]) {
      const residualBound = Math.abs(q3) * Number.EPSILON;
      expect(Math.abs(Math.sin(q3))).toBeGreaterThan(residualBound);
      const solution = engine.solveJointVelocities(at(q3), up, LINK_LENGTHS);
      expect(solution.isSingularZone).toBe(false);
      expect(solution.singularityType).toBe('NONE');
    }
  });

  it('the indexed zone is no wider than the representation residual of a double', () => {
    // Sweep the elbow through a full turn: the ONLY configurations that may be indexed
    // are those whose |sin q3| is within |q3| * Number.EPSILON of zero.
    let indexedOutsideResidual = 0;
    for (let i = 0; i <= 4000; i++) {
      const q3 = -Math.PI + (2 * Math.PI * i) / 4000;
      const solution = engine.solveJointVelocities(at(q3), up, LINK_LENGTHS);
      if (!solution.isSingularZone) continue;
      const residualBound = Math.abs(q3) * Number.EPSILON;
      if (Math.abs(Math.sin(q3)) > residualBound) indexedOutsideResidual++;
    }
    expect(indexedOutsideResidual).toBe(0);
  });
});

describe('Phase 1 (SP2): the reduced elevation inverse is regular where the algebra says so', () => {
  const engine = new RicisSymbolicJacobianEngine();
  const L1 = LINK_LENGTHS[1];

  it('a purely transverse command gives dq2 = P/L1 for every q3, including exactly 0', () => {
    // SP2 cancels sin(q3) out of the transverse channel exactly, so this limit is a
    // regular value, not a singularity to be band-guarded.
    const q2 = 0.7;
    const transverse: Vector3D = { x: -Math.sin(q2), y: 0, z: Math.cos(q2) };
    for (const q3 of [1e-2, 1e-5, 1e-9, 1e-14, 0]) {
      const { dq } = engine.solveJointVelocities({ q1: 0, q2, q3 }, transverse, LINK_LENGTHS);
      expect(Number.isFinite(dq.dq2)).toBe(true);
      expect(Number.isFinite(dq.dq3)).toBe(true);
      expect(dq.dq2).toBeCloseTo(1 / L1, 9);
      expect(dq.dq3).toBeCloseTo(-1 / L1, 9);
    }
  });

  it('keeps the elbow rate finite and free of NaN straight through the singular point', () => {
    const q2 = 0.7;
    const transverse: Vector3D = { x: -Math.sin(q2), y: 0, z: Math.cos(q2) };
    let previous: number | null = null;
    for (const q3 of [-1e-6, -1e-9, 0, 1e-9, 1e-6]) {
      const { dq } = engine.solveJointVelocities({ q1: 0, q2, q3 }, transverse, LINK_LENGTHS);
      expect(Number.isNaN(dq.dq2) || Number.isNaN(dq.dq3)).toBe(false);
      if (previous !== null) expect(Math.abs(dq.dq2 - previous)).toBeLessThan(1e-6);
      previous = dq.dq2;
    }
  });
});

describe('A1 / A4 / L1: evaluateAst decides topology with the storage type’s own predicates', () => {
  const engine = new RicisSymbolicJacobianEngine();
  const constant = (value: number) => ({ kind: 'CONST' as const, value, type: 'SCALAR' as const });
  const divide = (a: number, b: number) => ({
    kind: 'DIV' as const,
    numerator: constant(a),
    denominator: constant(b),
    type: 'SCALAR' as const,
  });

  it('projects F/0 onto the finite index with the sign of F (A1)', () => {
    expect(engine.evaluateAst(divide(1, 0))).toBe(RICIS_INFINITY_PROJECTION);
    expect(engine.evaluateAst(divide(-1, 0))).toBe(-RICIS_INFINITY_PROJECTION);
    expect(engine.evaluateAst(divide(1, -0))).toBe(-RICIS_INFINITY_PROJECTION);
  });

  it('resolves 0_F / 0_F = 1 by identity, not by proximity (L1)', () => {
    expect(engine.evaluateAst(divide(0, 0))).toBe(1);
    expect(engine.evaluateAst(divide(0, -0))).toBe(1);
  });

  it('catches an overflowing quotient through isFinite instead of a 1e-12 band', () => {
    // 1 / 1e-320 overflows a double. The former `Math.abs(denVal) < 1e-12` guard caught it
    // by magnitude; the strict test catches it because the type itself reports !isFinite.
    expect(engine.evaluateAst(divide(1, 1e-320))).toBe(RICIS_INFINITY_PROJECTION);
    expect(engine.evaluateAst(divide(1, 2))).toBe(0.5);
  });
});

describe('Azimuth: the lever R is signed, so dq1 must follow 1/R exactly', () => {
  const engine = new RicisSymbolicJacobianEngine();
  const tangential: Vector3D = { x: 0, y: 1, z: 0 }; // q1 = 0 => vTheta = 1

  it('does not let a lower floor flip the sign of dq1 when the arm crosses the base axis', () => {
    const cases: readonly (readonly [number, number])[] = [
      [Math.PI / 2, Math.PI / 2],
      [Math.PI / 2, 0.6 * Math.PI],
      [0.3, 0.4],
    ];
    for (const [q2, q3] of cases) {
      const rCurrent =
        LINK_LENGTHS[1] * Math.cos(q2) + LINK_LENGTHS[2] * Math.cos(q2 + q3);
      const { dq } = engine.solveJointVelocities({ q1: 0, q2, q3 }, tangential, LINK_LENGTHS);
      expect(Math.sign(dq.dq1)).toBe(Math.sign(1 / rCurrent));
      expect(dq.dq1).toBeCloseTo(1 / rCurrent, 9);
    }
  });
});

describe('Kinematic services: complete elimination of Math.max(0.01) and safeR heuristics', () => {
  const KINEMATIC_FILES = [
    'src/services/kinematic/planar3LinkKinematicService.ts',
    'src/services/kinematic/fiveLinkRedundantKinematicService.ts',
    'src/services/kinematic/genericNLinkKinematicService.ts',
  ];

  it('proves no Math.max(0.01) or safeR = Math.max(1e-5) exists in kinematic services', () => {
    for (const file of KINEMATIC_FILES) {
      const code = stripComments(readFileSync(resolve(process.cwd(), file), 'utf8'));
      expect(code).not.toContain('Math.max(0.01');
      expect(code).not.toContain('safeR');
    }
  });

  it('evaluates Planar3LinkKinematicService at exact clusterReach = 0 without NaN or throw', () => {
    const service = new Planar3LinkKinematicService();
    // l2 = 0.5, l3 = 0.5, q3 = PI => clusterReach = 0
    const links = [0.5, 0.5, 0.5] as const;
    const joints = [0, 0, Math.PI] as const;
    const J = service.computeJacobian(joints, links, 'POLAR');
    expect(J.mode).toBe('POLAR');
    expect(J.rows[0].every((val: number) => Number.isFinite(val))).toBe(true);
    expect(J.rows[1].every((val: number) => Number.isFinite(val))).toBe(true);
    // At clusterReach = 0, p13 and p23 evaluate to exact 0
    expect(J.rows[0][2]).toBe(0);
    expect(J.rows[1][2]).toBe(0);
  });

  it('evaluates FiveLinkRedundantKinematicService at exact origin r = 0 without NaN', () => {
    const service = new FiveLinkRedundantKinematicService();
    // Folded arm summing to (0, 0)
    const links = [0.5, 0.5, 0.5, 0.5, 0] as const;
    const joints = [0, Math.PI, 0, Math.PI, 0] as const;
    const [x, y] = service.computeForwardKinematics(joints, links);
    expect(Math.hypot(x, y)).toBeCloseTo(0, 6);
    const J = service.computeJacobian(joints, links, 'POLAR');
    expect(J.rows[0].every((val: number) => Number.isFinite(val))).toBe(true);
    expect(J.rows[1].every((val: number) => Number.isFinite(val))).toBe(true);
  });

  it('evaluates GenericNLinkKinematicService at exact origin r = 0 without NaN', () => {
    const service = new GenericNLinkKinematicService(2);
    // 2 links of length 1, folded onto each other: (1, 0) + (-1, 0) = (0, 0)
    const links = [1.0, 1.0];
    const joints = [0, Math.PI];
    const [x, y] = service.computeForwardKinematics(joints, links);
    expect(Math.hypot(x, y)).toBeCloseTo(0, 6);
    const J = service.computeJacobian(joints, links, 'POLAR');
    expect(J.rows[0].every((val: number) => Number.isFinite(val))).toBe(true);
    expect(J.rows[1].every((val: number) => Number.isFinite(val))).toBe(true);
  });
});
