// ============================================================================
// BUG-05 REGRESSION: (x^n − a^n)/(x − a) factorization in the public
// @ricis/core-ts engine. Every case below was reproduced as a wrong result
// (or an engine hang) before the guard was in place.
// ============================================================================

import { describe, it, expect } from 'vitest';
import { AST } from '../ast/ExpressionTypes';
import { AlgebraicSimplifier } from './AlgebraicSimplifier';

const x = () => AST.Var('x');
const y = () => AST.Var('y');

/** x^2 + x + 1 */
const quadraticSum = () => AST.Add(AST.Add(AST.Pow(x(), AST.Const(2)), x()), AST.Const(1));

describe('AlgebraicSimplifier — geometric-sum factorization (BUG-05)', () => {
  it('still expands (x^3 − 1)/(x − 1) to x^2 + x + 1 (valid case preserved)', () => {
    const expr = AST.Div(AST.Sub(AST.Pow(x(), AST.Const(3)), AST.Const(1)), AST.Sub(x(), AST.Const(1)));
    expect(AlgebraicSimplifier.simplify(expr)).toEqual(quadraticSum());
  });

  it('still expands the pure multiply chain (x*x*x − 1)/(x − 1)', () => {
    const chain = AST.Mul(AST.Mul(x(), x()), x());
    const expr = AST.Div(AST.Sub(chain, AST.Const(1)), AST.Sub(x(), AST.Const(1)));
    expect(AlgebraicSimplifier.simplify(expr)).toEqual(quadraticSum());
  });

  it('still expands (x^4 − 81)/(x − 3) to x^3 + 3x^2 + 9x + 27', () => {
    const expr = AST.Div(AST.Sub(AST.Pow(x(), AST.Const(4)), AST.Const(81)), AST.Sub(x(), AST.Const(3)));
    const expected = AST.Add(
      AST.Add(AST.Add(AST.Pow(x(), AST.Const(3)), AST.Mul(AST.Const(3), AST.Pow(x(), AST.Const(2)))), AST.Mul(AST.Const(9), x())),
      AST.Const(27),
    );
    expect(AlgebraicSimplifier.simplify(expr)).toEqual(expected);
  });

  it('refuses (x*y*x − 1)/(x − 1) instead of silently dropping y', () => {
    const chain = AST.Mul(AST.Mul(x(), y()), x());
    const expr = AST.Div(AST.Sub(chain, AST.Const(1)), AST.Sub(x(), AST.Const(1)));
    // Before the fix this returned x + 1 — y simply vanished.
    const result = AlgebraicSimplifier.simplify(expr);
    expect(result).toEqual(expr);
  });

  it('refuses a negative exponent: (x^(−2) − 1)/(x − 1) is not Const(0)', () => {
    const expr = AST.Div(AST.Sub(AST.Pow(x(), AST.Const(-2)), AST.Const(1)), AST.Sub(x(), AST.Const(1)));
    const result = AlgebraicSimplifier.simplify(expr);
    expect(result).toEqual(expr);
    expect(result.nodeType).toBe('Divide');
  });

  it('refuses a fractional exponent: (x^0.5 − 1)/(x − 1) is not x^(−0.5)', () => {
    const expr = AST.Div(AST.Sub(AST.Pow(x(), AST.Const(0.5)), AST.Const(1)), AST.Sub(x(), AST.Const(1)));
    const result = AlgebraicSimplifier.simplify(expr);
    expect(result).toEqual(expr);
    expect(result.nodeType).toBe('Divide');
  });

  it('refuses an unbounded exponent (x^1e9 − 1)/(x − 1) and returns immediately (DoS guard)', () => {
    const expr = AST.Div(AST.Sub(AST.Pow(x(), AST.Const(1_000_000_000)), AST.Const(1)), AST.Sub(x(), AST.Const(1)));
    const startedAt = Date.now();
    const result = AlgebraicSimplifier.simplify(expr);
    expect(result).toEqual(expr);
    expect(Date.now() - startedAt).toBeLessThan(1000);
  });
});
