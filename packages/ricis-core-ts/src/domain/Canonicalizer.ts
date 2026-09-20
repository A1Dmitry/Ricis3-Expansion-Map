import {
  Expression,
  BinaryExpression,
  FunctionExpression,
  SingularityExpression,
  DerivativeExpression,
} from '../ast/ExpressionTypes';

/**
 * R-02 — `Expr` — это рекурсивное дерево (машинное выражение), а НЕ строка.
 * Каноническая *строка* — это производное представление, получаемое здесь
 * (`normalizeExpr` из аудита). Тождество определяется по канонической форме,
 * а не по синтаксису исходного дерева.
 *
 * DDD: чистый доменный сервис (без состояния). ISP: узкий интерфейс.
 */
export interface ICanonicalizer {
  canonicalize(expr: Expression): string;
}

export class AstCanonicalizer implements ICanonicalizer {
  canonicalize(expr: Expression): string {
    return this.walk(expr);
  }

  private walk(e: Expression): string {
    switch (e.nodeType) {
      case 'Constant':
        return `c(${(e as any).value})`;
      case 'Parameter':
        return `v(${(e as any).name})`;
      case 'Add':
      case 'Multiply': {
        // Коммутативные операции: канонический порядок детей,
        // чтобы `a+b` и `b+a` давали одинаковую строку.
        const b = e as BinaryExpression;
        const l = this.walk(b.left);
        const r = this.walk(b.right);
        const [a, c] = l <= r ? [l, r] : [r, l];
        return `${e.nodeType}(${a},${c})`;
      }
      case 'Subtract':
      case 'Divide':
      case 'Power': {
        const b = e as BinaryExpression;
        return `${e.nodeType}(${this.walk(b.left)},${this.walk(b.right)})`;
      }
      case 'Function': {
        const f = e as FunctionExpression;
        const args = f.args.map((a) => this.walk(a)).join(',');
        return `fn(${f.name.toLowerCase()},${args})`;
      }
      case 'SingularityZero':
      case 'SingularityInfinity': {
        const s = e as SingularityExpression;
        const tag = e.nodeType === 'SingularityZero' ? '0' : 'inf';
        return `${tag}(${this.walk(s.basis)})`;
      }
      case 'Derivative': {
        const d = e as DerivativeExpression;
        return `d(${this.walk(d.expression)},${d.variable})`;
      }
    }
  }
}
