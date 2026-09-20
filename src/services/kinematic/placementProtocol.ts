// ============================================================================
// FRAGILE-OBJECT PLACEMENT PROTOCOL — BOUNDED CONTEXT
// ----------------------------------------------------------------------------
// The "egg protocol": how gently a fragile payload is approached, grasped,
// carried, lowered and released. These are PROCESS parameters — neither world
// physics (`physicalEnvironment`), nor body properties (`projectileMaterial`),
// nor machine geometry (`manipulatorConstants`), nor solver numerics
// (`solverConstants`). They change when the handling procedure changes.
//
// Every value was an inline literal in the phase machine, so the protocol could
// not be read or reviewed as a whole, and no two phases could be compared. They
// are named here and justified individually.
//
// Dependency direction (STRICT_DEVELOPMENT_RULES §4): imports nothing.
// ============================================================================

/** Heights the protocol holds the payload at, metres. */
export const PLACEMENT_HEIGHTS_M = Object.freeze({
  /**
   * Cruise altitude above the payload / box during approach and transit.
   *
   * Must clear the tallest obstacle the arm flies over while staying well
   * inside the 1.5 m planar reach, so a transit never brushes the workspace
   * boundary.
   */
  safeHoverM: 0.35,
  /**
   * Standoff above the box floor at which the gripper opens.
   *
   * The payload is lowered to this height and released, so it drops under
   * gravity the last few centimetres instead of being pushed into the floor.
   */
  softReleaseStandoffM: 0.05,
  /** Grasp height for a payload resting on the floor, metres. */
  pickM: 0.03,
  /**
   * Height above the box floor a released payload comes to rest at.
   * Slightly above the release standoff: the payload settles, it is not pressed.
   */
  settleRestM: 0.03,
});

/**
 * Arrival tolerances, metres. A phase advances when the end-effector is inside
 * its tolerance OR its dwell budget expires — the budget is a watchdog against
 * a phase that can never converge, never the primary exit.
 */
export const PLACEMENT_ARRIVAL_TOLERANCES_M = Object.freeze({
  /** Planar arrival over the payload during hover. */
  hoverPlanarM: 0.05,
  /** Vertical arrival over the payload during hover. */
  hoverVerticalM: 0.08,
  /** 3-D arrival at the grasp point. */
  descentM: 0.04,
  /** Vertical arrival at cruise altitude after the lift. */
  liftVerticalM: 0.06,
  /** Planar arrival over the box after transit. */
  transitPlanarM: 0.08,
  /** 3-D arrival at the box hover point. */
  boxAlignM: 0.05,
  /** Vertical arrival at the box floor. */
  releaseVerticalM: 0.04,
  /** Planar arrival at the box floor. */
  releasePlanarM: 0.08,
  /** Vertical arrival at cruise altitude during the empty retract. */
  retractVerticalM: 0.06,
});

/**
 * Per-phase dwell budgets, seconds — watchdogs, not the intended path.
 *
 * Each is generous relative to the arrival tolerance it backs, so under normal
 * tracking the tolerance fires first and the budget is never reached.
 */
export const PLACEMENT_DWELL_BUDGETS_SEC = Object.freeze({
  approachS: 3.0,
  descentS: 2.5,
  /** Time allowed for the gripper to close on the payload. */
  gripCloseS: 0.4,
  liftS: 2.0,
  transitS: 3.5,
  boxAlignS: 1.2,
  releaseS: 2.5,
  /** Time allowed for the gripper to open before retracting. */
  gripOpenS: 0.5,
  retractS: 2.0,
});

/**
 * Lateral scatter applied to a released payload so successive payloads do not
 * stack in one point, metres (half-span).
 *
 * The offset is DETERMINISTIC — derived from how many payloads have already
 * been placed. This used to be `Math.random()`, which made the placement
 * outcome unreproducible and broke the project's determinism contract
 * (seeded PRNG only, no wall-clock, no unseeded randomness); it also meant the
 * controller's own unit test could not assert where the payload ended up.
 */
export const PLACEMENT_SETTLE_SCATTER_HALF_SPAN_M = 0.05;

/** Azimuth alignment window, degrees: below it the base rotation is "on target". */
export const PLACEMENT_AZIMUTH_ALIGNED_DEG = 5.0;

/**
 * Cartesian hold pose used before a target exists, metres.
 *
 * A neutral standoff in front of the base, well inside the workspace, so the
 * first frame never commands a singular or out-of-reach point.
 */
export const PLACEMENT_IDLE_HOLD_POSE_M = Object.freeze({ x: 0.5, y: 0, z: 0.3 });

/**
 * Golden angle, radians: the irrational turn that makes a Vogel spiral never
 * repeat a bearing. Derived from the golden ratio, `pi * (3 - sqrt(5))`, not a
 * chosen number.
 */
const GOLDEN_ANGLE_RAD = Math.PI * (3 - Math.sqrt(5));

/**
 * Deterministic scatter offset for the n-th released payload (0-based).
 *
 * A Vogel (sunflower) spiral: bearing advances by the golden angle, so no two
 * payloads ever share a direction, and the radius `span * sqrt(n / (n + 1))`
 * grows monotonically toward — but never reaches — `span`. Both properties are
 * what a concentric-ring walk could not guarantee: rings that start at the same
 * corner re-emit points already used by the inner ring, so payload 9 landed
 * exactly where payload 1 had. Measured over the first 200 indices: all
 * distinct, max radius 0.049874 m against the 0.05 m span.
 *
 * The first payload sits at the centre, which is where a single delivery
 * belongs.
 */
export function settleScatterOffsetM(placedIndex: number): { x: number; y: number } {
  if (placedIndex <= 0) return { x: 0, y: 0 };
  const span = PLACEMENT_SETTLE_SCATTER_HALF_SPAN_M;
  const radius = span * Math.sqrt(placedIndex / (placedIndex + 1));
  const bearing = placedIndex * GOLDEN_ANGLE_RAD;
  return { x: radius * Math.cos(bearing), y: radius * Math.sin(bearing) };
}
