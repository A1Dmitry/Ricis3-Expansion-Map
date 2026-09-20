// ============================================================================
// QA METRIC CONSTANTS — "THE METRICS" BOUNDED CONTEXT
// ----------------------------------------------------------------------------
// Scale and thresholds of the quality score reported for a solve. They describe
// how a result is GRADED, not how the robot is built, not how the solver
// iterates, and not what the world is like.
//
// Keeping them out of the machine and solver modules is the point: a scoring
// scale can be re-based without touching a single physical or mechanical value.
//
// Dependency direction (STRICT_DEVELOPMENT_RULES §4): imports nothing.
// ============================================================================

/** Score scale: a perfect solve scores this, and never more. */
export const QA_SCORE_MAX = 100;

/** Floor of the reported score — the scale is clamped, not open-ended. */
export const QA_SCORE_MIN = 20;

/**
 * Direction-quality thresholds, degrees.
 *
 * `maxSingularDirectionDeviationDeg` is the deviation still counted as
 * direction-preserving inside a singular zone; `degradedDirectionThresholdDeg`
 * is where the classical baseline is reported as degraded.
 */
export const QA_DIRECTION_THRESHOLDS_DEG = Object.freeze({
  maxSingularDeviationDeg: 3.5,
  degradedThresholdDeg: 8.0,
});

/**
 * Score penalties of the QA formula.
 *
 * The score is `max(QA_SCORE_MIN, QA_SCORE_MAX - deviation*deg - posError*m)`,
 * so these two numbers are the exchange rate between a physical error and a
 * point. They were previously bare literals `1.5` and `50` at the call site —
 * an unnamed formula is not a documented metric.
 */
export const QA_SCORE_PENALTIES = Object.freeze({
  perDegreeOfDirectionDeviation: 1.5,
  perMetreOfPositionError: 50,
});

/**
 * Advantage-detection thresholds, i.e. when RICIS is reported to have beaten the
 * classical baseline on a given frame.
 *
 * These were six bare literals inside the detector's `if` conditions
 * (0.18, 12.0, 6.0, 1.8, 0.8, 0.05) — an unnamed decision rule. Naming them here
 * makes the rule reviewable and keeps the detector free of numbers.
 */
export const QA_ADVANTAGE_THRESHOLDS = Object.freeze({
  /** |det J| below which the frame counts as near-singular. */
  nearSingularityAbsDet: 0.18,
  /** |det J| below which the singularity counts as critical. */
  criticalSingularityAbsDet: 0.05,
  /** DLS direction deviation (deg) that counts as having lost the vector. */
  dlsDirectionLostDeg: 12.0,
  /** RICIS direction deviation (deg) that counts as having retained it. */
  ricisDirectionHeldDeg: 6.0,
  /** DLS velocity error (m/s) that counts as a damping-induced explosion. */
  dlsVelocityExplosionMps: 1.8,
  /** RICIS velocity error (m/s) that counts as a smooth O(1) step. */
  ricisVelocitySmoothMps: 0.8,
});
