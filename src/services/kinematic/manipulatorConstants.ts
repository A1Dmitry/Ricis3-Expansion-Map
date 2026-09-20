// ============================================================================
// MANIPULATOR CONSTANTS — "THE MACHINE" BOUNDED CONTEXT
// ----------------------------------------------------------------------------
// Properties of THIS robot: its links, its joint stops, its clearance from the
// floor, the size of its workspace. They change when the hardware changes and
// for no other reason.
//
// NOT here, by design (DDD):
//   - gravity / air            -> physicalEnvironment.ts  (the world)
//   - ball mass / restitution  -> projectileMaterial.ts   (the body)
//   - damping, gains, dt       -> solverConstants.ts      (the algorithm)
//   - score scale              -> qaMetricConstants.ts    (the metrics)
//
// Dependency direction (STRICT_DEVELOPMENT_RULES §4): imports nothing.
// ============================================================================

/**
 * Link lengths [L0, L1, L2] in metres.
 *
 * L0 is the fixed column, L1 the shoulder link, L2 the forearm. Planar reach is
 * L1 + L2 = 1.5 m, which is the workspace radius every reachability test in the
 * project compares against.
 *
 * Single source of truth: this constant previously existed as three independent
 * literals (page, benchmark, controller default) that could silently diverge —
 * a DRY violation, since a robot cannot have two different forearm lengths.
 */
export const MANIPULATOR_LINK_LENGTHS_M: readonly [number, number, number] = Object.freeze([
  0.4, 0.8, 0.7,
]);

/** Planar reach of the arm, DERIVED from the links rather than restated. */
export const MANIPULATOR_REACH_M = MANIPULATOR_LINK_LENGTHS_M[1] + MANIPULATOR_LINK_LENGTHS_M[2];

/**
 * Joint 3 (elbow) limits, radians.
 *
 * The elbow is a symmetric revolute joint, so its two working branches carry
 * mirrored stops. The classic solvers clamped only the elbow-down branch, which
 * drove the elbow UNDER THE FLOOR on low picks; the elbow-up branch below is the
 * standard collision-avoidance answer for those targets.
 */
export const ELBOW_JOINT_LIMITS = Object.freeze({
  /** Elbow-down branch minimum (rad). */
  minDownRad: 0.01,
  /** Elbow-down branch maximum, as an offset past the folded pose (rad). */
  maxDownOffsetRad: 0.05,
  /**
   * Elbow-up branch minimum (rad), MIRRORED from the down-branch offset so the
   * two stops cannot drift apart: -(pi - offset).
   */
  minUpRad: -(Math.PI - 0.05),
});

/** Minimum physical clearance between the elbow joint and the room floor (m). */
export const ELBOW_FLOOR_CLEARANCE_M = 0.02;

/** Hysteresis margin for elbow branch flipping: mirror only when strictly higher (m). */
export const ELBOW_FLIP_HYSTERESIS_M = 0.04;

/**
 * Duration of a joint-space elbow-branch reconfiguration (seconds).
 *
 * A 3-DOF arm chasing a 3-DOF Cartesian target has no null space, so switching
 * IK branch is unavoidable — but applying the mirror in one frame teleports the
 * shoulder by up to 2 rad, a visible snap at 60 FPS. The engine therefore slews
 * q2/q3 across this window at bounded joint velocity.
 */
export const ELBOW_BRANCH_TRANSITION_SEC = 0.35;

/**
 * Workspace validity margins.
 *
 * `minReachBufferM` keeps the radial channel away from a zero-thickness
 * singularity at the pole; `boundaryMarginRatio` allows the numerical solver to
 * report a target marginally outside the analytic envelope instead of rejecting
 * it on floating-point noise alone.
 */
export const WORKSPACE_LIMITS = Object.freeze({
  minReachBufferM: 0.05,
  boundaryMarginRatio: 1.05,
});

/** The arm's planar working annulus, measured from the shoulder joint. */
export interface IWorkspaceAnnulus {
  /** Closest attainable shoulder-to-target distance (m). */
  readonly minReachM: number;
  /** Farthest attainable shoulder-to-target distance (m). */
  readonly maxReachM: number;
}

/**
 * Working annulus of a 3-link arm, DERIVED from its links.
 *
 * A two-link planar chain from the shoulder can place its tip anywhere between
 * the fully folded radius `|L1 - L2|` and the fully extended one `L1 + L2`;
 * `minReachBufferM` keeps the inner edge off the zero-thickness singularity at
 * the pole. Nothing here is a free parameter.
 *
 * Single source of truth on purpose. The reachability test in the scenario
 * controller used to carry its own inline pair — `maxReach = L1 + L2 - 0.06`
 * and `minReach = 0.25` — which disagreed with the envelope the solver itself
 * enforces (`|L1 - L2| + 0.05` .. `L1 + L2`). One robot was therefore carrying
 * two different workspaces: the planner promised targets the solver treated as
 * out of bounds, and vice versa. A DRY violation with a physical consequence.
 */
export function workspaceAnnulus(
  linkLengths: readonly [number, number, number]
): IWorkspaceAnnulus {
  const [, L1, L2] = linkLengths;
  return {
    minReachM: Math.abs(L1 - L2) + WORKSPACE_LIMITS.minReachBufferM,
    maxReachM: L1 + L2,
  };
}
