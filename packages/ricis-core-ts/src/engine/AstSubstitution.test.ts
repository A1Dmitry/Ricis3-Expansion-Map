import { describe, it, expect } from 'vitest';
import { AstSubstitution } from './AstSubstitution';
import { AST, BinaryExpression, FunctionExpression, SingularityExpression, Expression } from '../ast/ExpressionTypes';

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

  it('P1: Mandelbrot iteration verification n=0 to 3', () => {
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
  });

  it('P3: Validates Structural Sharing (DAG) memory complexity', () => {
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
    // If it was a Tree (deep clone), we would have ~O(2^10) nodes.
    // Since it is a DAG (Structural Sharing), we expect O(n) objects.
    for (let i = 1; i <= 10; i++) {
      S = AstSubstitution.substitute(T, 'z', S);
    }

    const uniqueSet = new Set<Expression>();
    collectUniqueNodes(S, uniqueSet);

    // Verify memory constraint!
    expect(uniqueSet.size).toBeLessThan(30);
  });
});
