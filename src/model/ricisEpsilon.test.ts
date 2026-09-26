import { describe, it, expect } from 'vitest';
import {
  DOUBLE_EPSILON,
  DOUBLE_MIN_SUBNORMAL,
  isMachineZero,
  safeFloatDiv,
  safeNormalize3D,
} from './ricisEpsilon';

describe('RICIS-III Canonical Machine Epsilon Specification', () => {
  it('defines canonical IEEE-754 double precision epsilon', () => {
    expect(DOUBLE_EPSILON).toBe(Number.EPSILON);
    expect(DOUBLE_EPSILON).toBeCloseTo(2.220446049250313e-16, 20);
    expect(DOUBLE_MIN_SUBNORMAL).toBe(Number.MIN_VALUE);
  });

  it('isMachineZero recognizes 0 and machine-precision residuals', () => {
    expect(isMachineZero(0)).toBe(true);
    expect(isMachineZero(1e-17)).toBe(true);
    expect(isMachineZero(-1e-17)).toBe(true);
    expect(isMachineZero(Number.EPSILON)).toBe(true);
    expect(isMachineZero(Number.MIN_VALUE)).toBe(true);

    // Regular mathematical values are not zero
    expect(isMachineZero(1e-4)).toBe(false);
    expect(isMachineZero(1e-7)).toBe(false);
    expect(isMachineZero(0.1)).toBe(false);
    expect(isMachineZero(1)).toBe(false);
  });

  it('safeFloatDiv avoids numerical singularities without arbitrary epsilon bands', () => {
    expect(safeFloatDiv(10, 2)).toBe(5);
    expect(safeFloatDiv(10, 0, 0)).toBe(0);
    expect(safeFloatDiv(10, 1e-18, 0)).toBe(0);
    expect(safeFloatDiv(10, 0.5)).toBe(20);
  });

  it('safeNormalize3D normalizes non-zero vectors and handles zero vectors safely', () => {
    const [nx, ny, nz] = safeNormalize3D(3, 0, 4);
    expect(nx).toBeCloseTo(0.6);
    expect(ny).toBe(0);
    expect(nz).toBeCloseTo(0.8);

    const [zx, zy, zz] = safeNormalize3D(0, 0, 0);
    expect(zx).toBe(0);
    expect(zy).toBe(0);
    expect(zz).toBe(0);
  });
});
