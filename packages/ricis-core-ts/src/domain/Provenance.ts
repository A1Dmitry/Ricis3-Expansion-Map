import { Expression } from '../ast/ExpressionTypes';
import { InstanceId } from './InstanceId';

/**
 * R-06 / R-07 — происхождение (provenance) результата бинарной операции.
 *
 * Аудит выделяет ДВЕ концепции происхождения:
 *   1. Structural provenance:  Expr_new = Expr₁ ⊗ Expr₂
 *      (результирующее выражение уже хранится в новом индексе).
 *   2. Explicit provenance:    parents_new = [M₁, M₂]
 *      (явные ссылки на родительские экземпляры).
 *
 * Первая уже есть в текущей архитектуре. Вторая (R-07, OPEN-QUESTION) —
 * согласно последнему пояснению Main, требуется. Реализуем explicit provenance
 * по умолчанию, но храним обе формы в едином значимом объекте (DRY).
 */
export interface Provenance {
  readonly kind: 'atomic' | 'structural' | 'explicit';
  /** Structural provenance: результирующее Expr (всегда присутствует). */
  readonly resultExpr: Expression;
  /** Explicit provenance: родительские экземпляры [M₁, M₂] (R-07). Только при kind === 'explicit'. */
  readonly parents?: readonly [InstanceId, InstanceId];
}

export const atomicProvenance = (expr: Expression): Provenance => ({
  kind: 'atomic',
  resultExpr: expr,
});

export const structuralProvenance = (expr: Expression): Provenance => ({
  kind: 'structural',
  resultExpr: expr,
});

export const explicitProvenance = (
  resultExpr: Expression,
  parents: readonly [InstanceId, InstanceId],
): Provenance => ({
  kind: 'explicit',
  resultExpr,
  parents,
});
