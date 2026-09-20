/**
 * R-08 — порядок pattern matching в RICIS является частью **Resolution Priority**.
 *
 * Аудит требует сопоставить его с:
 *   SP2 → A6 → type consistency → fallback
 * (расширяем A7/A4 внутри этого же упорядочения, поскольку они тоже аксиомы
 * разрешения сингулярностей).
 *
 * Чем меньше число — тем выше приоритет (проверяется первым).
 */
export enum ResolutionPriority {
  SP2 = 10, // структурная/алгебраическая отмена (см. AlgebraicSimplifier.simplify — единственный SP2)
  A6 = 20, // 0_F × ∞_G = F·G
  A7 = 25, // ∞_F − ∞_G = ∞_(F−G)
  A4 = 30, // 0_F / 0_G = F / G
  TypeConsistency = 40, // удобства классической алгебры (0_F + X = X)
  Fallback = 50, // структурная композиция Expr₁ ⊗ Expr₂
}
