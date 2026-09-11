/**
 * src/services/leanCodegen/contracts/leanAst.types.ts
 * Строгая типизация синтаксического дерева (AST) выражений RICIS-III для Lean 4
 * Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
 */

/** Типы данных в модели глубокого вложения (Deep Embedding) */
export type LeanType = 'Scalar' | 'Vector2' | 'Matrix' | 'Monad';

/** Семантический дескриптор происхождения (Provenance / SP4) */
export interface LeanIndexOrigin {
  readonly symbol: string;
  readonly originalExpr?: string;
  readonly evaluationPoint?: string;
}

/** Вектор в 2D-пространстве RICIS-III (Geometric Bridge) */
export interface LeanVector2D {
  readonly x: LeanExprAst;
  readonly y: LeanExprAst;
}

/** Узлы AST алгебраических выражений RICIS-III */
export type LeanExprAst =
  | { readonly kind: 'Const'; readonly value: number | string }
  | { readonly kind: 'ZeroMonad'; readonly origin: LeanIndexOrigin }
  | { readonly kind: 'InfMonad'; readonly origin: LeanIndexOrigin }
  | { readonly kind: 'VectorMonolith'; readonly vector: LeanVector2D }
  | { readonly kind: 'Add'; readonly left: LeanExprAst; readonly right: LeanExprAst }
  | { readonly kind: 'Sub'; readonly left: LeanExprAst; readonly right: LeanExprAst }
  | { readonly kind: 'Mul'; readonly left: LeanExprAst; readonly right: LeanExprAst }
  | { readonly kind: 'Div'; readonly left: LeanExprAst; readonly right: LeanExprAst }
  | { readonly kind: 'SkewProduct'; readonly u: LeanVector2D; readonly v: LeanVector2D };

/** Аксиомы и протоколы переходов в дедуктивной системе Lean 4 */
export type LeanRewriteRule =
  | 'A1_Indexing'
  | 'A2_ZeroIndexedInfinity'
  | 'A3_ZeroIdentity'
  | 'A4_ZeroRatio'
  | 'A5_InfinityRatio'
  | 'A6_GeometricBridge'
  | 'A7_InfinitySubtraction'
  | 'A8_ZeroSubtraction'
  | 'A9_ScalarMultiplication'
  | 'A10_ScalarDivision'
  | 'L1_Identity'
  | 'SP1_Locality'
  | 'SP2_ReductionPriority'
  | 'SP3_IndexLaw'
  | 'SP4_SemanticPriority';

/** Шаг деривации (переход от одного состояния AST к другому) */
export interface LeanDerivationStep {
  readonly stepIndex: number;
  readonly phaseName: string;
  readonly rule: LeanRewriteRule;
  readonly sourceState: LeanExprAst;
  readonly targetState: LeanExprAst;
  readonly explanation: string;
}

/** Полная структура деривации доказательства */
export interface LeanProofDerivation {
  readonly theoremName: string;
  readonly claimTitle: string;
  readonly initialExpr: LeanExprAst;
  readonly finalInvariant: LeanExprAst;
  readonly steps: readonly LeanDerivationStep[];
}
