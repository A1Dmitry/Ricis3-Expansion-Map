// ============================================================================
// SOLVER CONSTANTS — "THE ALGORITHM" BOUNDED CONTEXT
// ----------------------------------------------------------------------------
// Tuning of the numerical methods: iteration step, damping, tracking gains,
// convergence guards. They change when the ALGORITHM changes — never when the
// robot, the payload or the planet does.
//
// These are dimensionless or step-shaped quantities by nature. Anything with a
// physical unit that belongs to the world, the body or the machine lives in
// physicalEnvironment.ts / projectileMaterial.ts / manipulatorConstants.ts.
//
// Dependency direction (STRICT_DEVELOPMENT_RULES §4): imports nothing.
// ============================================================================

/** Integration step of the kinematic loop (seconds), the 60 FPS frame. */
export const SOLVER_DT_SEC = 0.016;

/**
 * Determinant magnitude below which the Jacobian is treated as singular.
 *
 * A CLASSIFIER threshold for the shared numerical base, not a RICIS quantity:
 * the symbolic path resolves the singularity through the axioms and does not
 * consult it. Left explicit and owned here so it can never be mistaken for a
 * RICIS epsilon.
 */
export const SINGULARITY_DETERMINANT_THRESHOLD = 0.15;

/**
 * Numerical guards of the classical solvers.
 *
 * `boundaryEpsilonM` keeps a division away from the workspace boundary;
 * `manifoldProjectionOffsetM` re-enters the reachable manifold by a fixed small
 * step; `minRadialDistanceGuard` prevents a zero-length radial division.
 *
 * NOTE for the owner: these three are absolute invented magnitudes of exactly
 * the kind the RICIS epsilon doctrine rejects. They sit in the CLASSICAL
 * baseline, not in the RICIS core (which is epsilon-free), and removing them
 * requires re-deriving the classical guards structurally — flagged, not hidden.
 */
export const SOLVER_NUMERICAL_GUARDS = Object.freeze({
  boundaryEpsilonM: 1e-4,
  manifoldProjectionOffsetM: 0.001,
  minRadialDistanceGuard: 1e-6,
});

/** Damping factor lambda of the classical baseline DLS solver. */
export const DLS_DAMPING_FACTOR = 0.15;

/** Damping factor lambda of the ghost comparison arm (deliberately worse). */
export const GHOST_DLS_DAMPING_FACTOR = 0.18;

/**
 * Controller gains of the classical tracking loop.
 *
 * `azimuthGain` scales the base-rotation command, `planarVelocityGain` the
 * planar one, `ricisLerpRateMultiplier` the per-frame fraction of the remaining
 * Cartesian error the exact algebraic tracker closes.
 */
export const SOLVER_GAINS = Object.freeze({
  azimuth: 2.5,
  planarVelocity: 3.0,
  ricisLerpRateMultiplier: 8.0,
});

/**
 * Joint-rate clamp of the symbolic solver (rad/s).
 *
 * Bounds |dq| per step so the L0 continuity guarantee holds regardless of how
 * large the reduced command became near the radial singularity.
 */
export const MAX_JOINT_RATE_RAD_S = 4.0;
