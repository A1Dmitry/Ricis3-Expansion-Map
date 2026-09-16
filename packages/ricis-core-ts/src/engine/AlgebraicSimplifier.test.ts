import { describe, expect, it } from 'vitest';
import { AlgebraicSimplifier, MAX_POLY_EXPANSION_EXPONENT } from './AlgebraicSimplifier';
import { AST, type Expression } from '../ast/ExpressionTypes';

const x = () => AST.Var('x');
const y = () => AST.Var('y');

describe('AlgebraicSimplifier.simplify — factorization correctness (BUG-05)', () => {
  it('(x^2 - a^2)/(x - a) factorizes to x + a for valid integer exponents', () => {
    // (x^2 - 4)/(x - 2) => x + 2
    const input = AST.Div(
      AST.Sub(AST.Pow(x(), AST.Const(2)), AST.Const(4)),
      AST.Sub(x(), AST.Const(2)),
    );
    const result = AlgebraicSimplifier.simplify(input) as Expression;
    expect(result.nodeType).toBe('Add');
  });

  it('(x^n - 1)/(x - 1) expands to the exact geometric sum for n within the bound', () => {
    // (x^3 - 1)/(x - 1) => x^2 + x + 1 (three terms)
    const input = AST.Div(
      AST.Sub(AST.Pow(x(), AST.Const(3)), AST.Const(1)),
      AST.Sub(x(), AST.Const(1)),
    );
    const result = AlgebraicSimplifier.simplify(input);
    expect(result.nodeType).toBe('Add');
    // x^2 + x + 1 = ((x^2 + x) + 1): the outer Add's right operand is Const(1).
    const outer = result as { left: unknown; right: { nodeType: string; value?: number } };
    expect(outer.right.nodeType).toBe('Constant');
    expect(outer.right.value).toBe(1);
  });

  it('BUG-05 case 1: (x*y*x - 1)/(x - 1) must NOT factorize — y must survive', () => {
    const input = AST.Div(
      AST.Sub(AST.Mul(x(), AST.Mul(y(), x())), AST.Const(1)),
      AST.Sub(x(), AST.Const(1)),
    );
    const result = AlgebraicSimplifier.simplify(input);
    // The result stays a symbolic Divide; the numerator still contains y.
    expect(result.nodeType).toBe('Divide');
    const serialized = JSON.stringify(result);
    expect(serialized).toContain('"name":"y"');
  });

  it('BUG-05 case 2: (x^(-2) - 1)/(x - 1) must NOT fold to Const(0)', () => {
    const input = AST.Div(
      AST.Sub(AST.Pow(x(), AST.Const(-2)), AST.Const(1)),
      AST.Sub(x(), AST.Const(1)),
    );
    const result = AlgebraicSimplifier.simplify(input);
    expect(result.nodeType).toBe('Divide');
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('"value":0'); // no Const(0) collapse
    expect(serialized).toContain('-2');            // the exponent stays symbolic
  });

  it('BUG-05 case 3: (x^0.5 - 1)/(x - 1) must NOT produce garbage terms', () => {
    const input = AST.Div(
      AST.Sub(AST.Pow(x(), AST.Const(0.5)), AST.Const(1)),
      AST.Sub(x(), AST.Const(1)),
    );
    const result = AlgebraicSimplifier.simplify(input);
    expect(result.nodeType).toBe('Divide');
    const serialized = JSON.stringify(result);
    expect(serialized).toContain('0.5');
  });

  it(`BUG-05 case 4 (DoS): n above ${MAX_POLY_EXPANSION_EXPONENT} refuses to expand (no billion-node hang)`, () => {
    const input = AST.Div(
      AST.Sub(AST.Pow(x(), AST.Const(1_000_000_000)), AST.Const(1)),
      AST.Sub(x(), AST.Const(1)),
    );
    const startedAt = Date.now();
    const result = AlgebraicSimplifier.simplify(input);
    expect(Date.now() - startedAt).toBeLessThan(1000);
    expect(result.nodeType).toBe('Divide');
  });

  it('expands for the boundary exponent n = 64 but refuses n = 65', () => {
    const atBound = AlgebraicSimplifier.simplify(
      AST.Div(
        AST.Sub(AST.Pow(x(), AST.Const(MAX_POLY_EXPANSION_EXPONENT)), AST.Const(1)),
        AST.Sub(x(), AST.Const(1)),
      ),
    );
    expect(atBound.nodeType).toBe('Add');

    const aboveBound = AlgebraicSimplifier.simplify(
      AST.Div(
        AST.Sub(AST.Pow(x(), AST.Const(MAX_POLY_EXPANSION_EXPONENT + 1)), AST.Const(1)),
        AST.Sub(x(), AST.Const(1)),
      ),
    );
    expect(aboveBound.nodeType).toBe('Divide');
  });

  it('pure x multiply-chain still factorizes: (x*x - 1)/(x - 1) => x + 1', () => {
    const input = AST.Div(
      AST.Sub(AST.Mul(x(), x()), AST.Const(1)),
      AST.Sub(x(), AST.Const(1)),
    );
    const result = AlgebraicSimplifier.simplify(input);
    expect(result.nodeType).toBe('Add');
  });

  it('multiply-chain with a constant leaf must not factorize', () => {
    // (2*x*x - 8)/(x - 2): 2*x*x is NOT x^2 — must stay symbolic.
    const input = AST.Div(
      AST.Sub(AST.Mul(AST.Const(2), AST.Mul(x(), x())), AST.Const(8)),
      AST.Sub(x(), AST.Const(2)),
    );
    const result = AlgebraicSimplifier.simplify(input);
    expect(result.nodeType).toBe('Divide');
  });
});
