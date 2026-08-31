import { AST, BinaryExpression, DerivativeExpression, Expression, FunctionExpression } from '../ast/ExpressionTypes';

export class SymbolicDifferentiator {
  /**
   * Вычисляет символьную производную d(expr)/d(varName)
   */
  static diff(expr: Expression, varName: string): Expression {
    switch (expr.nodeType) {
      case 'Constant':
        return AST.Const(0);

      case 'Parameter':
        return (expr as any).name === varName ? AST.Const(1) : AST.Const(0);

      case 'Add': {
        const add = expr as BinaryExpression;
        return this.cleanAdd(this.diff(add.left, varName), this.diff(add.right, varName));
      }

      case 'Subtract': {
        const sub = expr as BinaryExpression;
        return this.cleanSub(this.diff(sub.left, varName), this.diff(sub.right, varName));
      }

      case 'Multiply': {
        const mul = expr as BinaryExpression;
        // (u * v)' = u' * v + u * v'
        const u = mul.left;
        const v = mul.right;
        const du = this.diff(u, varName);
        const dv = this.diff(v, varName);
        const term1 = this.cleanMul(du, v);
        const term2 = this.cleanMul(u, dv);
        return this.cleanAdd(term1, term2);
      }

      case 'Divide': {
        const div = expr as BinaryExpression;
        // (u / v)' = (u' * v - u * v') / v^2
        const u = div.left;
        const v = div.right;
        const du = this.diff(u, varName);
        const dv = this.diff(v, varName);
        const num = this.cleanSub(this.cleanMul(du, v), this.cleanMul(u, dv));
        const den = this.cleanPow(v, 2);
        return this.cleanDiv(num, den);
      }

      case 'Power': {
        const pow = expr as BinaryExpression;
        // (u^n)' = n * u^(n-1) * u'
        if (pow.right.nodeType === 'Constant') {
          const n = (pow.right as any).value;
          const u = pow.left;
          const du = this.diff(u, varName);
          if (n === 0) return AST.Const(0);
          if (n === 1) return du;
          const nNode = AST.Const(n);
          const powNode = this.cleanPow(u, n - 1);
          return this.cleanMul(this.cleanMul(nNode, powNode), du);
        }
        break;
      }

      case 'Function': {
        const fn = expr as FunctionExpression;
        const arg0 = fn.args[0]!;
        const dArg0 = this.diff(arg0, varName);

        switch (fn.name.toLowerCase()) {
          case 'sin':
            // sin(u)' = cos(u) * u'
            return this.cleanMul(AST.Fn('cos', [arg0]), dArg0);
          case 'cos':
            // cos(u)' = -sin(u) * u'
            return this.cleanMul(this.cleanMul(AST.Const(-1), AST.Fn('sin', [arg0])), dArg0);
          case 'tan':
            // tan(u)' = u' / cos^2(u)
            return this.cleanDiv(dArg0, this.cleanPow(AST.Fn('cos', [arg0]), 2));
          case 'exp':
            // exp(u)' = exp(u) * u'
            return this.cleanMul(AST.Fn('exp', [arg0]), dArg0);
          case 'log':
          case 'ln':
            // ln(u)' = u' / u
            return this.cleanDiv(dArg0, arg0);
          case 'sinh':
            // sinh(u)' = cosh(u) * u'
            return this.cleanMul(AST.Fn('cosh', [arg0]), dArg0);
          case 'cosh':
            // cosh(u)' = sinh(u) * u'
            return this.cleanMul(AST.Fn('sinh', [arg0]), dArg0);
          case 'pow': {
            // pow(u, n)
            if (fn.args.length >= 2 && fn.args[1]!.nodeType === 'Constant') {
              const n = (fn.args[1] as any).value;
              const u = fn.args[0]!;
              const du = this.diff(u, varName);
              if (n === 0) return AST.Const(0);
              if (n === 1) return du;
              const nNode = AST.Const(n);
              const powNode = n - 1 === 1 ? u : AST.Fn('pow', [u, AST.Const(n - 1)]);
              return this.cleanMul(this.cleanMul(nNode, powNode), du);
            }
            break;
          }
        }
        break;
      }

      case 'Derivative': {
        const deriv = expr as DerivativeExpression;
        return this.diff(this.diff(deriv.expression, deriv.variable), varName);
      }
    }

    return AST.Diff(expr, varName);
  }

  private static cleanAdd(left: Expression, right: Expression): Expression {
    if (left.nodeType === 'Constant' && (left as any).value === 0) return right;
    if (right.nodeType === 'Constant' && (right as any).value === 0) return left;
    if (left.nodeType === 'Constant' && right.nodeType === 'Constant') {
      return AST.Const((left as any).value + (right as any).value);
    }
    return AST.Add(left, right);
  }

  private static cleanSub(left: Expression, right: Expression): Expression {
    if (right.nodeType === 'Constant' && (right as any).value === 0) return left;
    if (left.nodeType === 'Constant' && right.nodeType === 'Constant') {
      return AST.Const((left as any).value - (right as any).value);
    }
    return AST.Sub(left, right);
  }

  private static cleanMul(left: Expression, right: Expression): Expression {
    if (left.nodeType === 'Constant' && (left as any).value === 0) return AST.Const(0);
    if (right.nodeType === 'Constant' && (right as any).value === 0) return AST.Const(0);
    if (left.nodeType === 'Constant' && (left as any).value === 1) return right;
    if (right.nodeType === 'Constant' && (right as any).value === 1) return left;
    if (left.nodeType === 'Constant' && right.nodeType === 'Constant') {
      return AST.Const((left as any).value * (right as any).value);
    }
    return AST.Mul(left, right);
  }

  private static cleanDiv(left: Expression, right: Expression): Expression {
    if (left.nodeType === 'Constant' && (left as any).value === 0) return AST.Const(0);
    if (right.nodeType === 'Constant' && (right as any).value === 1) return left;
    if (left.nodeType === 'Constant' && right.nodeType === 'Constant') {
      return AST.Const((left as any).value / (right as any).value);
    }
    return AST.Div(left, right);
  }

  private static cleanPow(base: Expression, exponent: number): Expression {
    if (exponent === 0) return AST.Const(1);
    if (exponent === 1) return base;
    return AST.Pow(base, AST.Const(exponent));
  }
}
