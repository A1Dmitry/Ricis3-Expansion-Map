// ============================================================================
// PROJECTILE MATERIAL — GENERAL PHYSICS BOUNDED CONTEXT
// ----------------------------------------------------------------------------
// Inertial and surface properties of the BODY being manipulated. These are
// properties of matter, not of the robot and not of the solver: the same ball
// has the same mass on Earth and on the Moon, while its WEIGHT differs because
// the environment differs (see physicalEnvironment.ts).
//
// Every number here is either a published standard or an explicitly labelled
// engineering assumption. Silent magic numbers are forbidden (AGENTS.md §2,
// "Anti-Magic Numbers"): a constant that cannot be justified does not belong
// in this module.
//
// Dependency direction (STRICT_DEVELOPMENT_RULES §4): imports nothing.
// ============================================================================

/**
 * ITF Rules of Tennis, Appendix I — the ball is specified by RANGES, so every
 * derived quantity below uses the midpoint of the published range and states it.
 */

/** ITF mass range: more than 56.0 g and less than 59.4 g. Midpoint. */
const ITF_MASS_MIN_KG = 0.056;
const ITF_MASS_MAX_KG = 0.0594;
export const TENNIS_BALL_MASS_KG = (ITF_MASS_MIN_KG + ITF_MASS_MAX_KG) / 2;

/** ITF diameter range: more than 6.54 cm and less than 6.86 cm. Midpoint. */
const ITF_DIAMETER_MIN_M = 0.0654;
const ITF_DIAMETER_MAX_M = 0.0686;
export const TENNIS_BALL_RADIUS_M = (ITF_DIAMETER_MIN_M + ITF_DIAMETER_MAX_M) / 4;

/**
 * ITF rebound specification: dropped from 100 inches (2.54 m) onto flat
 * concrete the ball must rebound between 135 cm and 147 cm. Midpoint 1.41 m.
 */
const ITF_REBOUND_DROP_HEIGHT_M = 2.54;
const ITF_REBOUND_RISE_MIN_M = 1.35;
const ITF_REBOUND_RISE_MAX_M = 1.47;
const ITF_REBOUND_RISE_M = (ITF_REBOUND_RISE_MIN_M + ITF_REBOUND_RISE_MAX_M) / 2;

/**
 * Coefficient of restitution, DERIVED — not tuned.
 *
 * For a bounce on a rigid massive floor, energy conservation gives
 * (1/2) m (e v)^2 = m g h' against (1/2) m v^2 = m g h, hence
 *
 *     e = sqrt(h' / h)
 *
 * Substituting the ITF heights yields ~0.745, inside the 0.728..0.761 band the
 * rule implies. The previous value 0.5 corresponded to no ball and no rule.
 */
export const TENNIS_BALL_RESTITUTION = Math.sqrt(ITF_REBOUND_RISE_M / ITF_REBOUND_DROP_HEIGHT_M);

/**
 * Sliding (kinetic) friction coefficient, vulcanised rubber against concrete.
 * Published measurements for dry rubber-on-concrete cluster at 0.6..0.85; the
 * lower bound is taken because a tennis ball's felt cover reduces grip and the
 * contact is brief. Enters the Coulomb bound on the tangential impact impulse.
 */
export const BALL_ON_CONCRETE_FRICTION = 0.6;

/**
 * Rolling resistance coefficient for a pressurised felt ball on a hard floor.
 * ASSUMPTION (not a published standard): taken an order of magnitude below the
 * sliding coefficient, as is typical for rolling versus sliding contact. It
 * only governs how quickly a settled ball stops creeping.
 */
export const BALL_ROLLING_RESISTANCE = 0.06;

/**
 * Aerodynamic drag coefficient of a sphere at Re ~ 1e5.
 * A smooth sphere gives ~0.47; the felt nap of a tennis ball raises it, and
 * measured values for tennis balls sit near 0.55. Enters F = 1/2 rho Cd A v^2.
 */
export const TENNIS_BALL_DRAG_COEFFICIENT = 0.55;

/** Projected (cross-section) area A = pi r^2, derived from the ITF radius. */
export const TENNIS_BALL_CROSS_SECTION_M2 = Math.PI * TENNIS_BALL_RADIUS_M * TENNIS_BALL_RADIUS_M;

/**
 * The projectile as a single value object.
 *
 * Mass is part of the body, never of the integrator: inertia belongs to matter.
 */
export interface IProjectileMaterial {
  readonly label: string;
  readonly massKg: number;
  readonly radiusM: number;
  readonly restitution: number;
  readonly dragCoefficient: number;
  readonly crossSectionM2: number;
  readonly slidingFriction: number;
  readonly rollingResistance: number;
}

/** The ITF tennis ball used by the catch / pick-and-place scenarios. */
export const TENNIS_BALL: IProjectileMaterial = Object.freeze({
  label: 'ITF tennis ball (range midpoints)',
  massKg: TENNIS_BALL_MASS_KG,
  radiusM: TENNIS_BALL_RADIUS_M,
  restitution: TENNIS_BALL_RESTITUTION,
  dragCoefficient: TENNIS_BALL_DRAG_COEFFICIENT,
  crossSectionM2: TENNIS_BALL_CROSS_SECTION_M2,
  slidingFriction: BALL_ON_CONCRETE_FRICTION,
  rollingResistance: BALL_ROLLING_RESISTANCE,
});

/**
 * Wall restitution of the wooden delivery box the balls are placed into.
 *
 * ASSUMPTION (not a published standard): a rigid plywood wall returns less
 * energy than the concrete slab the ITF test specifies, so this sits below
 * TENNIS_BALL_RESTITUTION. It is declared here as a labelled assumption rather
 * than left as a bare 0.35 at the call site.
 */
export const BOX_WALL_RESTITUTION = 0.35;

/**
 * Wall restitution for the TENNIS_ROOM (concrete walls). A tennis ball
 * rebounding off a painted concrete wall is assumed to lose slightly more
 * energy than the ITF slab-floor drop spec (TENNIS_BALL_RESTITUTION≈0.745),
 * but far more than the plywood delivery-box wall. Value chosen as 0.745
 * (same as slab floor) — conservative and consistent with the published ITF
 * rebound spec; tune down if walls feel too bouncy.
 */
export const CONCRETE_WALL_RESTITUTION = TENNIS_BALL_RESTITUTION;
