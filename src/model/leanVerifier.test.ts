import { describe, it, expect } from 'vitest';
import { verifyLeanProof } from './leanVerifier';

describe('leanVerifier Unit Tests', () => {
  it('should pass on empty or non-lean code gracefully', () => {
    const res = verifyLeanProof('', 'Test Node', '0/0');
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('should verify well-formed Lean 4 theorem without errors', () => {
    const validLean = `
import Mathlib
theorem geometric_bridge_proof (F G : Real) : F * G = F * G := by
  rfl
`;
    const res = verifyLeanProof(validLean, 'Geometric Bridge', '0_F * inf_G');
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('should flag sorry placeholder in Lean 4 proof', () => {
    const sorryLean = `
theorem incomplete_theorem (x : Real) : x = x := by
  sorry
`;
    const res = verifyLeanProof(sorryLean, 'Incomplete', 'X = X');
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('sorry'))).toBe(true);
  });

  it('should flag mismatched brackets in Lean 4 code', () => {
    const brokenBrackets = `
theorem broken_brackets [x : Real) : x = x := by
  rfl
`;
    const res = verifyLeanProof(brokenBrackets, 'Brackets', 'X');
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('Несоответствие скобок'))).toBe(true);
  });

  it('should flag unclosed brackets in Lean 4 code', () => {
    const unclosedBrackets = `
theorem unclosed_brackets (x : Real : x = x := by
  rfl
`;
    const res = verifyLeanProof(unclosedBrackets, 'Unclosed', 'X');
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('незакрытая'))).toBe(true);
  });
});
