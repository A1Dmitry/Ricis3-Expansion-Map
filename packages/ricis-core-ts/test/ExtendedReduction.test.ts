import { describe, it, expect } from 'vitest';
import {
  AST,
  AlgebraicSimplifier,
  FractionReducer,
  LambdaParser,
  RicisTypeScriptEngine,
  SemanticIndexer,
  SymbolicDifferentiator
} from '../src';

describe('RICIS-III Extended Reduction Engine & Critical Test Cases', () => {
  const engine = new RicisTypeScriptEngine();

  function solve(lambdaStr: string, x0: number) {
    const parsed = LambdaParser.parse(lambdaStr);
    const simplified = AlgebraicSimplifier.simplify(parsed.body);
    const indexed = SemanticIndexer.indexAtPoint(simplified, parsed.parameterName, x0);
    const reducedBasis = AlgebraicSimplifier.simplifySingularityBasis(indexed);
    return engine.reduce(reducedBasis);
  }

  describe('Critical Console Singularities Resolution', () => {
    it('L6: Sinc function (sin(x)/x at x=0 -> 1)', () => {
      const res = solve('x => sin(x) / x', 0);
      expect(res.reduced.nodeType).toBe('Constant');
      expect((res.reduced as any).value).toBe(1);
      expect(res.isFullyResolved).toBe(true);
    });

    it('L10: Exponential form ((exp(x)-1)/x at x=0 -> 1)', () => {
      const res = solve('x => (exp(x) - 1) / x', 0);
      expect(res.reduced.nodeType).toBe('Constant');
      expect((res.reduced as any).value).toBe(1);
    });

    it('L11: Trigonometric quadratic form ((1-cos(x))/(x*x) at x=0 -> 0.5)', () => {
      const res = solve('x => (1 - cos(x)) / (x * x)', 0);
      expect(res.reduced.nodeType).toBe('Constant');
      expect((res.reduced as any).value).toBe(0.5);
    });

    it('L12: Tangent ratio (tan(x)/x at x=0 -> 1)', () => {
      const res = solve('x => tan(x) / x', 0);
      expect(res.reduced.nodeType).toBe('Constant');
      expect((res.reduced as any).value).toBe(1);
    });

    it('L28: Cubic form with pow(x,3) ((pow(x,3)-8)/(x-2) at x=2 -> 12)', () => {
      const res = solve('x => (pow(x, 3) - 8) / (x - 2)', 2);
      expect(res.reduced.nodeType).toBe('Constant');
      expect((res.reduced as any).value).toBe(12);
    });

    it('L31: Gamma proxy (sin(pi*x)/x at x=0 -> pi)', () => {
      const res = solve('x => sin(pi * x) / x', 0);
      expect(res.reduced.nodeType).toBe('Constant');
      expect((res.reduced as any).value).toBeCloseTo(Math.PI, 10);
    });

    it('L42: High order 3rd Taylor ((x - sin(x)) / pow(x,3) at x=0 -> 1/6)', () => {
      const res = solve('x => (x - sin(x)) / pow(x, 3)', 0);
      expect(res.reduced.nodeType).toBe('Constant');
      expect((res.reduced as any).value).toBeCloseTo(1 / 6, 10);
    });

    it('L43: Hyperbolic 3rd Taylor ((sinh(x) - x) / pow(x,3) at x=0 -> 1/6)', () => {
      const res = solve('x => (sinh(x) - x) / pow(x, 3)', 0);
      expect(res.reduced.nodeType).toBe('Constant');
      expect((res.reduced as any).value).toBeCloseTo(1 / 6, 10);
    });

    it('L46: Exact symbolic zero in denominator (1 / (exp(x*x)-1) at x=0 -> Infinity_1)', () => {
      const res = solve('x => 1 / (exp(x * x) - 1)', 0);
      expect(res.reduced.nodeType).toBe('SingularityInfinity');
    });
  });

  describe('Logarithmic Singularities Reduction', () => {
    it('reduces ln(1+x)/x at x=0 -> 1', () => {
      const res = solve('x => log(1 + x) / x', 0);
      expect(res.reduced.nodeType).toBe('Constant');
      expect((res.reduced as any).value).toBe(1);
    });

    it('reduces ln(1+5*x)/x at x=0 -> 5', () => {
      const res = solve('x => log(1 + (5 * x)) / x', 0);
      expect(res.reduced.nodeType).toBe('Constant');
      expect((res.reduced as any).value).toBe(5);
    });

    it('reduces ln(x)/(x-1) at x=1 -> 1', () => {
      const res = solve('x => log(x) / (x - 1)', 1);
      expect(res.reduced.nodeType).toBe('Constant');
      expect((res.reduced as any).value).toBe(1);
    });
  });

  describe('Symbolic Differentiation Engine', () => {
    it('computes derivative of polynomial d(x^3)/dx = 3*x^2', () => {
      const expr = AST.Pow(AST.Var('x'), AST.Const(3));
      const diff = SymbolicDifferentiator.diff(expr, 'x');
      expect(diff.nodeType).toBe('Multiply');
      // 3 * x^2
      expect((diff as any).left.value).toBe(3);
      expect((diff as any).right.nodeType).toBe('Power');
    });

    it('computes derivative of sin(x) = cos(x)', () => {
      const expr = AST.Fn('sin', [AST.Var('x')]);
      const diff = SymbolicDifferentiator.diff(expr, 'x');
      expect(diff.nodeType).toBe('Function');
      expect((diff as any).name).toBe('cos');
    });

    it('computes derivative of ln(x) = 1/x', () => {
      const expr = AST.Fn('ln', [AST.Var('x')]);
      const diff = SymbolicDifferentiator.diff(expr, 'x');
      expect(diff.nodeType).toBe('Divide');
      expect((diff as any).left.value).toBe(1);
      expect((diff as any).right.name).toBe('x');
    });

    it('computes derivative of exp(x) = exp(x)', () => {
      const expr = AST.Fn('exp', [AST.Var('x')]);
      const diff = SymbolicDifferentiator.diff(expr, 'x');
      expect(diff.nodeType).toBe('Function');
      expect((diff as any).name).toBe('exp');
    });

    it('evaluates derivative node via RicisTypeScriptEngine', () => {
      const derivNode = AST.Diff(AST.Fn('sin', [AST.Var('x')]), 'x');
      const res = engine.reduce(derivNode);
      expect(res.reduced.nodeType).toBe('Function');
      expect((res.reduced as any).name).toBe('cos');
    });
  });

  describe('Integer Mixed Fraction Simplifier (e.g. 100/3 = 33 + 1/3)', () => {
    it('simplifies 100 / 3 into 33 + 1/3', () => {
      const result = FractionReducer.toMixedFraction(100, 3);
      expect(result.whole).toBe(33);
      expect(result.numerator).toBe(1);
      expect(result.denominator).toBe(3);
      expect(result.isNegative).toBe(false);
      expect(result.formatted).toBe('33 + 1/3');
    });

    it('simplifies 25 / 4 into 6 + 1/4', () => {
      const result = FractionReducer.toMixedFraction(25, 4);
      expect(result.whole).toBe(6);
      expect(result.numerator).toBe(1);
      expect(result.denominator).toBe(4);
      expect(result.formatted).toBe('6 + 1/4');
    });

    it('simplifies exact integer division 12 / 4 into 3', () => {
      const result = FractionReducer.toMixedFraction(12, 4);
      expect(result.whole).toBe(3);
      expect(result.numerator).toBe(0);
      expect(result.formatted).toBe('3');
    });

    it('handles proper fractions 2 / 5 as 2/5', () => {
      const result = FractionReducer.toMixedFraction(2, 5);
      expect(result.whole).toBe(0);
      expect(result.numerator).toBe(2);
      expect(result.denominator).toBe(5);
      expect(result.formatted).toBe('2/5');
    });

    it('creates AST mixed fraction expression for 100 / 3', () => {
      const ast = FractionReducer.simplifyDivisionToAst(100, 3);
      expect(ast.nodeType).toBe('Add');
      expect((ast as any).left.value).toBe(33);
      expect((ast as any).right.nodeType).toBe('Divide');
      expect((ast as any).right.left.value).toBe(1);
      expect((ast as any).right.right.value).toBe(3);
    });
  });
});
