import type { StructuralExpression } from './contracts';
import {
  SymbolicAstNode,
  parseCanonicalStringToAst,
  structuralToSymbolicAst,
  SymbolicSeriesEngine,
  ExactRational,
} from './a15SeriesEngine';

const ZERO_BI = BigInt(0);

export type OrderProfileResult =
  | {
      readonly isResolved: true;
      readonly status: 'RESOLVED';
      readonly order: number;
      readonly derivValue: number;
      readonly coeff: ExactRational;
    }
  | {
      readonly isResolved: false;
      readonly status: 'UNRESOLVED';
      readonly reason: string;
      readonly expression: StructuralExpression | string;
      readonly order?: undefined;
      readonly derivValue?: undefined;
      readonly coeff?: undefined;
    };

/**
 * Calculates exact structural order of vanishing ord_a(f) and structural profile leading coefficient
 * via pure symbolic AST series expansion (NO limits, NO finite differences, NO floating point approximations).
 */
export class OrderProfileCalculator {
  public static computeOrderAndDerivative(
    expression: StructuralExpression | string,
    evalPoint = 0,
    maxOrder = 20
  ): OrderProfileResult {
    let ast: SymbolicAstNode | undefined;
    if (typeof expression === 'string') {
      ast = parseCanonicalStringToAst(expression);
    } else {
      ast = structuralToSymbolicAst(expression);
    }

    if (!ast) {
      return {
        isResolved: false,
        status: 'UNRESOLVED',
        reason: 'Failed to parse expression to symbolic AST',
        expression,
      };
    }

    const series = SymbolicSeriesEngine.expandAst(ast, evalPoint, maxOrder);
    for (let order = 0; order <= maxOrder; order++) {
      const coeff = series.get(order);
      if (coeff && coeff.num !== ZERO_BI) {
        if (coeff.den === ZERO_BI) {
          return {
            isResolved: false,
            status: 'UNRESOLVED',
            reason: 'Zero denominator in series coefficient',
            expression,
          };
        }
        const floatVal = Number(coeff.num) / Number(coeff.den);
        if (!Number.isFinite(floatVal)) {
          return {
            isResolved: false,
            status: 'UNRESOLVED',
            reason: 'Non-finite float value in derivative conversion',
            expression,
          };
        }
        return {
          isResolved: true,
          status: 'RESOLVED',
          order,
          derivValue: floatVal,
          coeff,
        };
      }
    }

    return {
      isResolved: false,
      status: 'UNRESOLVED',
      reason: 'No non-zero series coefficient found within maxOrder',
      expression,
    };
  }
}
