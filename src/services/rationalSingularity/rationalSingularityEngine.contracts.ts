// ============================================================================
// RICIS-III v7.7 RATIONAL SINGULARITY ENGINE CONTRACTS
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// Verified via Lean 4 Core Theorem: A1_div_zero (resolveRICIS (div F zero) = infF F)
// ============================================================================

export type SingularityOutcomeType = 
  | 'INDEXED_INFINITY'    // F / 0 -> inf_{F} (Axiom A1, A10, Lean A1_div_zero)
  | 'REMOVABLE_SCALAR'    // 0_F / 0_F -> 1 * tail (SP1, SP2, L1)
  | 'INDEXED_ZERO';       // 0 / F -> 0_{F} (Axiom A9)

export interface ISingularityRootAnalysis {
  readonly root: number;                         // Корень уравнения D(x) = 0
  readonly rootVariable: string;                 // 'x'
  readonly denominatorMultiplicity: number;      // Кратность корня в D(x)
  readonly numeratorMultiplicity: number;        // Кратность корня в N(x)
  readonly canceledMultiplicity: number;         // min(mN, mD) (сокращенные по SP1/SP2)
  readonly residualNumeratorExpression: string;  // Остаточное выражение числителя
  readonly residualNumeratorValue: number;       // Численное значение остаточного числителя F
  readonly outcomeType: SingularityOutcomeType;  // Тип разрешения сингулярности
  readonly formattedRicisResult: string;         // Например: 'inf_{5}', '10', 'inf_{2}'
  readonly leanTheoremCitation: string;          // 'A1_div_zero' или 'divSelf_one'
}

export interface IRationalSingularityAnalysisResult {
  readonly originalNumerator: string;
  readonly originalDenominator: string;
  readonly variable: string;
  readonly denominatorRoots: readonly number[];  // Все корни D(x) = 0
  readonly singularPointsAnalysis: readonly ISingularityRootAnalysis[];
  readonly equationSolved: string;               // 'D(x) = 0'
}

export interface IRationalFactor {
  readonly factorText: string;                   // например 'x - 2'
  readonly root: number;                         // 2
  readonly power: number;                        // кратность (по умолчанию 1)
}

export interface IRationalFunctionInput {
  readonly variable: string;
  readonly numeratorFactors: readonly IRationalFactor[];
  readonly denominatorFactors: readonly IRationalFactor[];
  readonly numeratorConstant?: number;
  readonly denominatorConstant?: number;
}

export interface IRationalSingularityEngine {
  /**
   * Полный пайплайн RICIS-III для рациональной функции N(x)/D(x):
   * 1. Приравнивает D(x) = 0 и находит спектр корней {x_k}.
   * 2. Подставляет корни в числитель.
   * 3. Сокращает тождественные нули по SP1 / SP2.
   * 4. Остаток ненулевого числителя F при делении на 0 формирует inf_{F} по Аксиоме A1/A10.
   */
  resolveRationalSingularity(
    input: IRationalFunctionInput
  ): IRationalSingularityAnalysisResult;
}
