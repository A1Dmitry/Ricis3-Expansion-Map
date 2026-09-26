// ============================================================================
// RICIS-III v7.7 CANONICAL MACHINE EPSILON & ZERO RECOGNITION
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
//
// FUNDAMENTAL LAW:
// RICIS-III computes strictly structurally and algebraically (AST, Exact Monoliths,
// SP1-SP4, A1-A10, Geometric Bridge). Arbitrary/invented numerical epsilon bands
// (e.g. 1e-4, 1e-6, 1e-7, 1e-9) in algebraic decision logic or singularity detection
// are STRICTLY FORBIDDEN and classified as Tukhta.
//
// The SINGLE canonical epsilon across the entire library is double machine epsilon
// (IEEE 754 Number.EPSILON = 2^-52 ≈ 2.220446049250313e-16 / double.Epsilon = Number.MIN_VALUE ≈ 5e-324).
// It is used EXCLUSIVELY for machine float zero-checking in mathematical projections
// and physical rendering/visualization.
// ============================================================================

/**
 * Canonical IEEE 754 double precision machine epsilon (2^-52 ≈ 2.220446049250313e-16).
 * Represents the difference between 1 and the smallest floating point number greater than 1.
 */
export const DOUBLE_EPSILON: number = Number.EPSILON;

/**
 * Smallest positive subnormal IEEE 754 double value (5e-324).
 * Matches C# `double.Epsilon`.
 */
export const DOUBLE_MIN_SUBNORMAL: number = Number.MIN_VALUE;

/**
 * Standard RICIS machine zero recognition for floating-point projections.
 * Strictly uses IEEE 754 machine epsilon (Number.EPSILON) to test equality to zero.
 */
export function isMachineZero(value: number, epsilon: number = DOUBLE_EPSILON): boolean {
  return Math.abs(value) <= epsilon;
}

/**
 * Safe floating point division for physical rendering and numerical projections.
 * Returns fallback if denominator is within machine zero precision.
 */
export function safeFloatDiv(numerator: number, denominator: number, fallback: number = 0): number {
  if (isMachineZero(denominator)) {
    return fallback;
  }
  return numerator / denominator;
}

/**
 * Safe vector 3D normalization for rendering and visualization.
 */
export function safeNormalize3D(x: number, y: number, z: number): [number, number, number] {
  const len = Math.hypot(x, y, z);
  if (isMachineZero(len)) {
    return [0, 0, 0];
  }
  return [x / len, y / len, z / len];
}
