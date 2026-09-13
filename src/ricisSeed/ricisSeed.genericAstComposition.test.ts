import { describe, expect, it } from 'vitest';
import { AstSubstitution } from '../../packages/ricis-core-ts/src/engine/AstSubstitution';
import { AST, type BinaryExpression, type Expression } from '../../packages/ricis-core-ts/src/ast/ExpressionTypes';

describe('RICIS — Generic AST Substitution & Recurrence (Mandelbrot S_n without ad-hoc engine)', () => {
  // Базовая операция: T(z, c) = z^2 + c = (z * z) + c
  // S_0 = 0
  // S_1 = T(0, c) = (0 * 0) + c = c
  // S_2 = T(S_1, c) = (c * c) + c
  // S_3 = T(S_2, c) = (((c * c) + c) * ((c * c) + c)) + c

  // T(z, c) = (z * z) + c
  const z = AST.Var('z');
  const c = AST.Var('c');
  const T_template: BinaryExpression = AST.Add(AST.Mul(z, z), c);

  it('вычисляет рекуррентные шаги S0, S1, S2, S3 чисто через generic AST substitution, сохраняя c', () => {
    // S0 = 0
    const zeroConst: Expression = AST.Const(0);

    // S1 = T(S0, c) -> подстановка z := 0 в T(z, c)
    const S1 = AstSubstitution.substitute(T_template, 'z', zeroConst);
    expect(S1.nodeType).toBe('Add');
    const S1bin = S1 as BinaryExpression;
    expect(S1bin.right).toEqual(AST.Var('c'));

    // S2 = T(S1, c) -> подстановка z := S1 в T(z, c)
    const S2 = AstSubstitution.substitute(T_template, 'z', S1);
    expect(S2.nodeType).toBe('Add');
    const S2bin = S2 as BinaryExpression;
    expect(S2bin.right).toEqual(AST.Var('c'));
    // Левая часть S2 — это S1 * S1
    const S2left = S2bin.left as BinaryExpression;
    expect(S2left.nodeType).toBe('Multiply');
    expect(S2left.left).toBe(S1);
    expect(S2left.right).toBe(S1); // Structural sharing (DAG invariant)!

    // S3 = T(S2, c) -> подстановка z := S2 в T(z, c)
    const S3 = AstSubstitution.substitute(T_template, 'z', S2);
    expect(S3.nodeType).toBe('Add');
    const S3bin = S3 as BinaryExpression;
    expect(S3bin.right).toEqual(AST.Var('c'));
    const S3left = S3bin.left as BinaryExpression;
    expect(S3left.nodeType).toBe('Multiply');
    expect(S3left.left).toBe(S2);
    expect(S3left.right).toBe(S2); // Structural sharing (DAG invariant)!
  });

  it('сохраняет неизменность ссылок (structural sharing) если переменная отсутствует', () => {
    const expr = AST.Add(AST.Var('x'), AST.Var('y'));
    const res = AstSubstitution.substitute(expr, 'z', AST.Var('val'));
    // Никаких аллокаций новых объектов, возвращается точно тот же инстанс
    expect(res).toBe(expr);
  });
});
