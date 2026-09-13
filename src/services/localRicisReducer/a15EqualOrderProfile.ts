import type {
  StructuralBinaryExpression,
  StructuralExpression,
  StructuralSourceReference,
} from './contracts';
import type {
  A15OperandPair,
  ISemanticIndexValidator,
  ITypeConsistencyValidator,
} from './oopContracts';
import { BaseSingularityRule } from './oopRules';

/**
 * Rational approximation converter: turns floating point values near standard fractions
 * (e.g. 0.16666666666666666 -> 1/6) into canonical exact strings.
 */
export function toCanonicalRationalString(val: number): string {
  if (Number.isInteger(val)) {
    return String(val);
  }
  const maxDen = 1000;
  let bestNum = Math.round(val);
  let bestDen = 1;
  let minErr = Math.abs(val - bestNum);

  for (let den = 1; den <= maxDen; den++) {
    const num = Math.round(val * den);
    const err = Math.abs(val - num / den);
    if (err < minErr - 1e-9) {
      minErr = err;
      bestNum = num;
      bestDen = den;
      if (err < 1e-12) break;
    }
  }

  if (minErr < 1e-5 && bestDen > 1) {
    const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
    const g = gcd(bestNum, bestDen);
    const n = bestNum / g;
    const d = bestDen / g;
    if (d === 1) return String(n);
    return `${n} / ${d}`;
  }

  return String(Number(val.toFixed(6)));
}

/**
 * Calculates numerical or symbolic derivatives D^n f(a) and order ord_a(f).
 */
export class OrderProfileCalculator {
  /**
   * Computes the order of vanishing ord_a(f) and value D^d f(a).
   */
  public static computeOrderAndDerivative(
    expression: StructuralExpression,
    evalPoint = 0,
    maxOrder = 10
  ): { order: number; derivValue: number } | undefined {
    const fn = this.compileEvaluator(expression);
    if (!fn) return undefined;

    const eps = 1e-4;
    for (let order = 0; order <= maxOrder; order++) {
      const derivVal = this.evaluateDerivativeAt(fn, evalPoint, order, eps);
      if (Math.abs(derivVal) > 1e-5) {
        return { order, derivValue: derivVal };
      }
    }
    return undefined;
  }

  /**
   * Compiles a StructuralExpression or canonical string into a JavaScript numerical function.
   */
  public static compileEvaluator(expression: StructuralExpression): ((t: number) => number) | undefined {
    let canon = expression.identity?.canonical ?? '';
    if (expression.kind === 'INDEXED_ZERO' || expression.kind === 'INDEXED_INFINITY') {
      canon = expression.payload?.identity?.canonical ?? canon;
    }

    try {
      let jsExpr = canon
        .replace(/\b(x|t)\b/g, 't')
        .replace(/\bsin\b/g, 'Math.sin')
        .replace(/\bcos\b/g, 'Math.cos')
        .replace(/\bsinh\b/g, 'Math.sinh')
        .replace(/\bcosh\b/g, 'Math.cosh')
        .replace(/\bexp\b/g, 'Math.exp')
        .replace(/\blog\b/g, 'Math.log')
        .replace(/(\w+|\([^)]+\))\s*\^\s*(\d+)/g, 'Math.pow($1, $2)');

      jsExpr = jsExpr.replace(/0_\{([^}]+)\}/g, '($1)').replace(/inf_\{([^}]+)\}/g, '($1)');

      const fn = new Function('t', `try { return ${jsExpr}; } catch(e) { return NaN; }`) as (t: number) => number;
      const testVal = fn(0.1);
      if (typeof testVal === 'number' && !isNaN(testVal)) {
        return fn;
      }
    } catch {
      // Fallback if dynamic compilation fails
    }
    return undefined;
  }

  /**
   * Central finite differences stencil for order n derivative.
   */
  public static evaluateDerivativeAt(
    fn: (t: number) => number,
    a: number,
    order: number,
    h = 1e-4
  ): number {
    if (order === 0) return fn(a);
    if (order === 1) return (fn(a + h) - fn(a - h)) / (2 * h);
    if (order === 2) return (fn(a + h) - 2 * fn(a) + fn(a - h)) / (h * h);
    if (order === 3) return (fn(a + 2 * h) - 2 * fn(a + h) + 2 * fn(a - h) - fn(a - 2 * h)) / (2 * h * h * h);
    if (order === 4) return (fn(a + 2 * h) - 4 * fn(a + h) + 6 * fn(a) - 4 * fn(a - h) + fn(a - 2 * h)) / (Math.pow(h, 4));

    const prevOrderFn = (x: number) => this.evaluateDerivativeAt(fn, x, order - 1, h);
    return (prevOrderFn(a + h) - prevOrderFn(a - h)) / (2 * h);
  }
}

/**
 * A15 Equal-Order Structural Profile Rule:
 * Resolve([F/G], a) := D^d F(a) / D^d G(a) when ord_a(F) = ord_a(G) = d.
 */
export class A15EqualOrderRule extends BaseSingularityRule {
  readonly ruleName = 'A15_EQUAL_ORDER_STRUCTURAL_PROFILE';
  readonly phase = 'A1_A4_A10';
  readonly authority = 'RICIS_III_EXPLICIT';

  protected checkApplicability(
    expression: StructuralExpression,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): { isApplicable: boolean; reason?: string } {
    if (expression.kind !== 'BINARY' || expression.operator !== 'DIVIDE') {
      return { isApplicable: false, reason: 'Must be a binary division expression' };
    }

    const pair = this.extractor.extractA15Pair(expression);
    if (!pair) {
      return { isApplicable: false, reason: 'Expression is not an A15 equal-order candidate' };
    }

    const validation = this.pairValidator.validateA15Pair(pair, indexValidator, typeValidator);
    if (!validation.isValid) {
      return { isApplicable: false, reason: validation.reason };
    }

    return { isApplicable: true };
  }

  protected executeReduction(expression: StructuralExpression): { success: true; reduced: StructuralExpression } | { success: false; reason: string } {
    if (expression.kind !== 'BINARY') {
      return { success: false, reason: 'Invalid expression shape for A15 reduction' };
    }
    const pair = this.extractor.extractA15Pair(expression);
    if (!pair) {
      return { success: false, reason: 'Operands not found for A15 reduction' };
    }

    const defaultSource = this.getDefaultSource(expression);
    const ratio = pair.numDerivValue / pair.denDerivValue;
    const canonicalStr = toCanonicalRationalString(ratio);

    return {
      success: true,
      reduced: this.factory.createA15ProfileQuotient(canonicalStr, defaultSource),
    };
  }
}
