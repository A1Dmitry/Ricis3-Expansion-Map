import { describe, it, expect } from 'vitest';
import { AstSubstitution } from './AstSubstitution';
import { AST, BinaryExpression, FunctionExpression, SingularityExpression, Expression } from '../ast/ExpressionTypes';
import { AlgebraicSimplifier } from './AlgebraicSimplifier';

describe('AstSubstitution - Generic Composition Engine', () => {
  it('P0: substitutes a simple parameter', () => {
    // x + 1
    const expr = AST.Add(AST.Var('x'), AST.Const(1));
    // Substitute x -> 2 => 2 + 1
    const res = AstSubstitution.substitute(expr, 'x', AST.Const(2));
    
    expect(res.nodeType).toBe('Add');
    expect((res as BinaryExpression).left).toEqual(AST.Const(2));
    expect((res as BinaryExpression).right).toEqual(AST.Const(1));
  });

  it('P1: Mandelbrot iteration verification n=0 to 3 via pure generic composition', () => {
    // Mandelbrot here is purely a generic composition test.
    // T(z,c) = z*z + c
    const z = AST.Var('z');
    const c = AST.Var('c');
    const T = AST.Add(AST.Mul(z, z), c);

    // S0 = 0
    let S: Expression = AST.Const(0);

    // S1 = T(S0) = 0*0 + c
    S = AstSubstitution.substitute(T, 'z', S);
    expect(S).toEqual(AST.Add(AST.Mul(AST.Const(0), AST.Const(0)), AST.Var('c')));

    // S2 = T(S1) = (0*0+c)*(0*0+c) + c
    S = AstSubstitution.substitute(T, 'z', S);
    expect((S as BinaryExpression).left.nodeType).toBe('Multiply');
    
    // Check that 'c' is perfectly preserved (no unintended mutations or losses)
    const leftOfMul = ((S as BinaryExpression).left as BinaryExpression).left as BinaryExpression;
    expect(leftOfMul.right.nodeType).toBe('Parameter');
    expect((leftOfMul.right as any).name).toBe('c');

    // S3 = T(S2)
    const S3 = AstSubstitution.substitute(T, 'z', S);
    expect(S3.nodeType).toBe('Add');
  });

  it('P8 & P9: Proves generic composition across multi-variable substitution, functions, and singularities', () => {
    // 1. Multi-variable substitution: f(x, y) = x*x + y*y
    const x = AST.Var('x');
    const y = AST.Var('y');
    const u = AST.Var('u');
    const f = AST.Add(AST.Mul(x, x), AST.Mul(y, y));

    // Substitute x -> cos(u), y -> sin(u)
    const cosU = AST.Fn('cos', [u]);
    const sinU = AST.Fn('sin', [u]);

    const fSubX = AstSubstitution.substitute(f, 'x', cosU);
    const fSubXY = AstSubstitution.substitute(fSubX, 'y', sinU);

    expect((fSubXY as BinaryExpression).left).toEqual(AST.Mul(cosU, cosU));
    expect((fSubXY as BinaryExpression).right).toEqual(AST.Mul(sinU, sinU));

    // 2. Singularity preservation across composition: 0_f(x) with x -> g(t)
    const singZero = AST.Zero(AST.Sub(AST.Mul(x, x), AST.Const(4))); // 0_{x^2 - 4}
    const t = AST.Var('t');
    const composedSing = AstSubstitution.substitute(singZero, 'x', AST.Add(t, AST.Const(1)));

    expect(composedSing.nodeType).toBe('SingularityZero');
    const basis = (composedSing as SingularityExpression).basis as BinaryExpression;
    expect(basis.nodeType).toBe('Subtract');
    expect((basis.left as BinaryExpression).left).toEqual(AST.Add(t, AST.Const(1)));

    // 3. Identity preservation: f(x) substituted with x returns the exact identical reference
    const unchanged = AstSubstitution.substitute(f, 'z', AST.Const(42));
    expect(unchanged).toBe(f); // Strict reference identity preserved (O(1) no-op)
  });

  it('P10: Validates Structural Sharing (DAG) memory complexity O(n) vs O(2^n)', () => {
    const z = AST.Var('z');
    const c = AST.Var('c');
    const T = AST.Add(AST.Mul(z, z), c);

    let S: Expression = AST.Const(0);

    function collectUniqueNodes(node: Expression, set: Set<Expression>) {
      if (set.has(node)) return;
      set.add(node);
      if ('left' in node && 'right' in node) {
        collectUniqueNodes((node as BinaryExpression).left, set);
        collectUniqueNodes((node as BinaryExpression).right, set);
      } else if ('args' in node) {
        (node as FunctionExpression).args.forEach(a => collectUniqueNodes(a, set));
      } else if ('basis' in node) {
        collectUniqueNodes((node as SingularityExpression).basis, set);
      }
    }

    // Iterate to n=10
    // If it was an unshared Tree (deep clone), we would have ~O(2^10) = 1024+ nodes.
    // Since it is a DAG (Structural Sharing), we expect strictly O(n) allocated objects.
    for (let i = 1; i <= 10; i++) {
      S = AstSubstitution.substitute(T, 'z', S);
    }

    const uniqueSet = new Set<Expression>();
    collectUniqueNodes(S, uniqueSet);

    // Verify memory constraint: 10 iterations creates fewer than 30 unique AST objects in heap!
    expect(uniqueSet.size).toBeLessThan(30);
    expect(uniqueSet.size).toBeGreaterThan(10);
  });

  it('P12: Symbolic equality with commutativity, derivatives, and singularity bases', () => {
    const x = AST.Var('x');
    const y = AST.Var('y');

    // 1. Commutative Addition: x + y == y + x
    const add1 = AST.Add(x, y);
    const add2 = AST.Add(y, x);
    expect(AlgebraicSimplifier.areEqual(add1, add2)).toBe(true);

    // 2. Commutative Multiplication: x * y == y * x
    const mul1 = AST.Mul(x, y);
    const mul2 = AST.Mul(y, x);
    expect(AlgebraicSimplifier.areEqual(mul1, mul2)).toBe(true);

    // 3. Non-commutative Subtraction: x - y != y - x
    const sub1 = AST.Sub(x, y);
    const sub2 = AST.Sub(y, x);
    expect(AlgebraicSimplifier.areEqual(sub1, sub2)).toBe(false);

    // 4. Derivative Equality: d/dx(x^2) == d/dx(x^2)
    const diff1 = AST.Diff(AST.Mul(x, x), 'x');
    const diff2 = AST.Diff(AST.Mul(x, x), 'x');
    expect(AlgebraicSimplifier.areEqual(diff1, diff2)).toBe(true);

    // 5. Singularity Basis Equality: 0_{x + y} == 0_{y + x}
    const sing1 = AST.Zero(add1);
    const sing2 = AST.Zero(add2);
    expect(AlgebraicSimplifier.areEqual(sing1, sing2)).toBe(true);
  });
});
