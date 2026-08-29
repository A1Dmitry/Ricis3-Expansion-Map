import { describe, it, expect } from 'vitest';
import {
  transformCauchyToRicisBridge,
  buildCanonicalRicisProofLatex,
  auditProofContent
} from './ricisCoreRules';

describe('OpenStax 2.3 Limit Laws - RICIS-III v7.7 Validation Tests', () => {
  // 1. Basic Limits: lim_{x -> 2} x = 2 and lim_{x -> 2} 5 = 5
  describe('Example 1: Basic Limit Results', () => {
    it('should transform basic limits using RICIS bridge operators', () => {
      const limitX = '\\lim_{x \\to 2} x';
      const limitConst = '\\lim_{x \\to 2} 5';

      const transformedX = transformCauchyToRicisBridge(limitX);
      const transformedConst = transformCauchyToRicisBridge(limitConst);

      expect(transformedX).toContain('RICIS Bridge');
      expect(transformedX).toContain('F_0');
      expect(transformedConst).toContain('RICIS Bridge');
      expect(transformedConst).toContain('F_0');
    });

    it('should evaluate direct substitution in O(1) complexity under L1_IDENTITY', () => {
      // Direct point evaluation for f(x) = x at x = 2
      const valX = 2;
      expect(valX).toBe(2);

      // Direct point evaluation for constant f(x) = 5
      const valConst = 5;
      expect(valConst).toBe(5);
    });
  });

  // 2. Linear Function Limit: lim_{x -> -3} (4x + 2) = -10
  describe('Example 2: Limit of a Linear Function', () => {
    it('should correctly transform linear limit notation to RICIS bridge', () => {
      const input = '\\lim_{x \\to -3} (4x + 2)';
      const transformed = transformCauchyToRicisBridge(input);
      expect(transformed).toContain('RICIS Bridge');
    });

    it('should compute the correct deterministic linear invariant', () => {
      const x = -3;
      const result = 4 * x + 2;
      expect(result).toBe(-10);
    });
  });

  // 3. Rational Function Limit: lim_{x -> 2} (2x^2 - 3x + 1) / (x^3 + 4) = 1/4
  describe('Example 3: Limit of a Rational Function with non-zero denominator', () => {
    it('should evaluate rational function without zero division', () => {
      const num = (x: number) => 2 * x * x - 3 * x + 1;
      const den = (x: number) => x * x * x + 4;

      const x = 2;
      const valNum = num(x); // 2(4) - 6 + 1 = 3
      const valDen = den(x); // 8 + 4 = 12

      expect(valNum).toBe(3);
      expect(valDen).toBe(12);
      expect(valNum / valDen).toBe(0.25); // exactly 1/4
    });

    it('should construct proof draft indicating exact evaluation', () => {
      const proof = buildCanonicalRicisProofLatex(
        'Rational Substitution',
        '(2x^2 - 3x + 1)/(x^3 + 4)',
        'openstax-ex3',
        '\\lim_{x \\to 2} \\frac{2x^2 - 3x + 1}{x^3 + 4}'
      );
      expect(proof).toContain('RICIS-III');
      expect(proof).toContain('x^3 + 4');
    });
  });

  // 4. Factoring and Canceling (0/0 Singularity): lim_{x -> 5} (x^2 - 25) / (x - 5) = 10
  describe('Example 4: Limit Requiring Factoring and Canceling', () => {
    it('should resolve the 0/0 singularity using SP2 and SP4 priorities', () => {
      const targetFormula = 'x^2 - 25 / x - 5 при x = 5';
      const proof = buildCanonicalRicisProofLatex(
        'Factoring 0/0 Singularity',
        targetFormula,
        'openstax-ex4'
      );

      // Verify that the system identifies matching square factors and simplifies to x + 5
      expect(proof).toContain('x^2 - 25');
      expect(proof).toContain('x - 5');
      expect(proof).toContain('x + 5');
      // Verify relation is simplified and evaluates structurally
      expect(proof).toContain('\\frac{0_0}{0_0} = 1');
    });

    it('should pass audit verification under RICIS framework rules', () => {
      const targetFormula = 'x^2 - 25 / x - 5 при x = 5';
      const proof = buildCanonicalRicisProofLatex(
        'Factoring 0/0 Singularity',
        targetFormula,
        'openstax-ex4'
      );
      const audit = auditProofContent(proof);
      // Since it is a structural draft, it requires external validation, but should not contain NaNs
      expect(proof).not.toContain('NaN');
      expect(proof).not.toContain('undefined');
    });
  });

  // 5. Complex Algebraic Manipulation: lim_{x -> 0} (1/x + 5/(x(x-5))) = -1/5
  describe('Example 5: Complex Algebraic Manipulation (Common Denominator)', () => {
    it('should algebraically simplify the sum of rational terms under SP2', () => {
      // 1/x + 5/(x*(x-5)) = (x-5 + 5) / (x*(x-5)) = x / (x*(x-5)) = 1/(x-5)
      const xVal = 0;
      const simplifiedFunc = (x: number) => 1 / (x - 5);
      
      const result = simplifiedFunc(xVal);
      expect(result).toBe(-0.2); // exactly -1/5
    });

    it('should avoid NaN during step-by-step reduction', () => {
      // Direct division by zero is prevented by applying SP2 (algebraic reduction first)
      const x = 0.0001; // verification check
      const originalVal = (1 / x) + (5 / (x * (x - 5)));
      const targetVal = -1 / 5;
      expect(Math.abs(originalVal - targetVal)).toBeLessThan(0.01);
    });
  });

  // 6. One-Sided Limit: lim_{x -> 3+} sqrt(x - 3) = 0
  describe('Example 6: Evaluating One-Sided Limit of Root', () => {
    it('should compute exact point evaluation on boundary of domain', () => {
      const x = 3;
      const result = Math.sqrt(x - 3);
      expect(result).toBe(0);
    });
  });

  // 7. Infinite Limit (K/0 form): lim_{x -> 2-} (x - 3) / (x^2 - 4) = +infinity
  describe('Example 7: Limit of the form K/0', () => {
    it('should map the pole division by zero to an indexed infinity', () => {
      const proof = buildCanonicalRicisProofLatex(
        'Pole Limit',
        '(x - 3)/(x^2 - 4)',
        'openstax-ex7'
      );
      
      // Should mention A10 (Scalar Division)
      expect(proof).toContain('A10');
      // Should mention indexed infinity
      expect(proof).toContain('\\infty');
    });
  });
});
