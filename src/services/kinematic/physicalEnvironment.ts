// ============================================================================
// PHYSICAL ENVIRONMENT — GENERAL PHYSICS BOUNDED CONTEXT
// ----------------------------------------------------------------------------
// Constants of the WORLD the manipulator acts in. They are properties of nature
// and of the installation site — NOT of the robot, NOT of the solver, NOT of
// the task. Gravitational acceleration is therefore an EXTERNAL, caller-supplied
// parameter; the default installation is Earth.
//
// Dependency direction (STRICT_DEVELOPMENT_RULES §4): this module imports
// nothing. It is the innermost ring — manipulator, solver and scenario layers
// may depend on it, never the reverse.
//
// DDD: nothing here may know about joints, Jacobians, grippers or QA scores.
// ============================================================================

/**
 * Standard acceleration of free fall, g_n = 9.80665 m/s^2 (exact).
 *
 * Defined, not measured: fixed by the 3rd CGPM (1901) as the conventional
 * standard gravity. Because it is a definition it carries no uncertainty and
 * must never be "tuned" to make a scene look better.
 */
export const STANDARD_GRAVITY_MPS2 = 9.80665;

/**
 * Dry-air density at the International Standard Atmosphere sea level
 * (15 degC, 101 325 Pa): rho = 1.225 kg/m^3.
 *
 * Enters the aerodynamic drag law F = 1/2 * rho * Cd * A * |v| * v. On a body
 * with no atmosphere it is exactly zero, which removes drag instead of
 * pretending a small one exists.
 */
export const ISA_SEA_LEVEL_AIR_DENSITY_KGPSM3 = 1.225;

/**
 * The world a scenario runs in.
 *
 * Deliberately a value object rather than module-level globals: a simulation
 * of the same manipulator on another body is a different environment instance,
 * not a different build.
 */
export interface IPhysicalEnvironment {
  /** Human-readable identification of the body/site (evidence, not decoration). */
  readonly label: string;
  /** Gravitational acceleration magnitude (m/s^2), always directed along -Z. */
  readonly gravityMps2: number;
  /** Ambient fluid density for aerodynamic drag (kg/m^3); 0 in vacuum. */
  readonly airDensityKgpsm3: number;
}

/**
 * Default installation: Earth, sea level, ISA atmosphere.
 *
 * This is the ONLY environment a caller gets when it does not ask for another
 * one, per the owner's directive "by default everything is for Earth".
 */
export const EARTH_SURFACE: IPhysicalEnvironment = Object.freeze({
  label: 'Earth, sea level (ISA)',
  gravityMps2: STANDARD_GRAVITY_MPS2,
  airDensityKgpsm3: ISA_SEA_LEVEL_AIR_DENSITY_KGPSM3,
});

/**
 * Lunar surface. g = 1.62 m/s^2 (Apollo-era gravimetry, 1/6 of terrestrial).
 * The Moon has no atmosphere to speak of, so drag is exactly zero rather than
 * a small invented number.
 */
export const MOON_SURFACE: IPhysicalEnvironment = Object.freeze({
  label: 'Moon, surface',
  gravityMps2: 1.62,
  airDensityKgpsm3: 0,
});

/**
 * Martian surface. g = 3.72076 m/s^2 (Mars gravity 0.379 g_n);
 * CO2 atmosphere at the mean surface pressure ~610 Pa gives rho ~ 0.020 kg/m^3.
 */
export const MARS_SURFACE: IPhysicalEnvironment = Object.freeze({
  label: 'Mars, mean surface',
  gravityMps2: 3.72076,
  airDensityKgpsm3: 0.02,
});

/** Every environment the project currently models; evidence for "which planet". */
export const KNOWN_ENVIRONMENTS: readonly IPhysicalEnvironment[] = Object.freeze([
  EARTH_SURFACE,
  MOON_SURFACE,
  MARS_SURFACE,
]);

/**
 * Resolve an environment for a simulation run.
 *
 * Absence of an explicit choice means Earth — never a made-up intermediate
 * value. A caller that wants another body must name it.
 */
export function resolveEnvironment(environment?: IPhysicalEnvironment): IPhysicalEnvironment {
  return environment ?? EARTH_SURFACE;
}
