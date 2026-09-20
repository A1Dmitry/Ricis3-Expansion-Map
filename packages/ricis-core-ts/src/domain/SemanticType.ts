import { Expression } from '../ast/ExpressionTypes';

/**
 * R-05 — семантический тип узла. Используется `Index` как носителем
 * монолитной семантики (`SemanticType` в составе индекса).
 */
export type SemanticType =
  | 'Zero' // 0_F
  | 'Infinity' // ∞_G
  | 'Scalar' // константа
  | 'Algebraic'; // общее выражение

export function deriveSemanticType(expr: Expression): SemanticType {
  switch (expr.nodeType) {
    case 'SingularityZero':
      return 'Zero';
    case 'SingularityInfinity':
      return 'Infinity';
    case 'Constant':
      return 'Scalar';
    default:
      return 'Algebraic';
  }
}
