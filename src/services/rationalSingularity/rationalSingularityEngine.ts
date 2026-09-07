// ============================================================================
// RICIS-III v7.7 RATIONAL SINGULARITY ENGINE IMPLEMENTATION
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// Compliant with Axioms A1, A4, A10, SP1, SP2, and Lean 4 Theorem: A1_div_zero
// ============================================================================

import type {
  IRationalSingularityEngine,
  IRationalFunctionInput,
  IRationalSingularityAnalysisResult,
  ISingularityRootAnalysis,
  SingularityOutcomeType,
  IRationalFactor,
} from './rationalSingularityEngine.contracts';

export class RationalSingularityEngine implements IRationalSingularityEngine {
  /**
   * Вычисляет разрешение сингулярностей дроби N(x)/D(x) по RICIS-III:
   * 1. Находит все корни уравнения D(x) = 0.
   * 2. Подставляет корни в N(x) и во внешние множители D(x).
   * 3. Сокращает общие тождественные нуль-факторы по SP1/SP2 (L1).
   * 4. Если в знаменателе остаётся нуль, вычисляет остаточное ненулевое
   *    значение F и формирует ∞_{F} по Аксиоме A1/A10 и теореме Lean A1_div_zero.
   */
  public resolveRationalSingularity(
    input: IRationalFunctionInput
  ): IRationalSingularityAnalysisResult {
    const numConst = input.numeratorConstant ?? 1;
    const denConst = input.denominatorConstant ?? 1;

    // Шаг 1: Нахождение спектра корней уравнения D(x) = 0
    const uniqueRoots = Array.from(
      new Set(input.denominatorFactors.map((f) => f.root))
    ).sort((a, b) => a - b);

    const singularPointsAnalysis: ISingularityRootAnalysis[] = [];

    for (const r of uniqueRoots) {
      // Кратность корня r в знаменателе D(x)
      const denFactorsWithRoot = input.denominatorFactors.filter(
        (f) => f.root === r
      );
      const mD = denFactorsWithRoot.reduce((sum, f) => sum + f.power, 0);

      // Кратность корня r в числителе N(x)
      const numFactorsWithRoot = input.numeratorFactors.filter(
        (f) => f.root === r
      );
      const mN = numFactorsWithRoot.reduce((sum, f) => sum + f.power, 0);

      // Шаг 2 & 3: Сокращение тождественных нулей (SP1, SP2, L1)
      const canceled = Math.min(mN, mD);
      const remMD = mD - canceled;
      const remMN = mN - canceled;

      // Вычисляем значение оставшихся множителей в точке r
      // 1. Числитель (без canceled множителей (x - r))
      let numVal = numConst;
      for (const nf of input.numeratorFactors) {
        if (nf.root === r) {
          numVal *= Math.pow(r - nf.root, nf.power - canceled);
        } else {
          numVal *= Math.pow(r - nf.root, nf.power);
        }
      }

      // 2. Знаменатель (без canceled множителей (x - r))
      let denRemVal = denConst;
      for (const df of input.denominatorFactors) {
        if (df.root === r) {
          // Если remMD > 0, то этот множитель обращается в 0
          // Мы отделяем неисчезающую часть знаменателя D_rem(r)
          continue;
        } else {
          denRemVal *= Math.pow(r - df.root, df.power);
        }
      }

      const F = numVal / denRemVal;

      let outcomeType: SingularityOutcomeType;
      let formattedRicisResult: string;
      let leanTheoremCitation: string;

      if (remMD > 0) {
        // Знаменатель по-прежнему обращается в ноль (полюс / неустранимая сингулярность)
        // По Аксиоме A1 и A10: F / 0 -> inf_{F} (Lean: A1_div_zero)
        outcomeType = 'INDEXED_INFINITY';
        formattedRicisResult = `∞_{${this.formatNumber(F)}}`;
        leanTheoremCitation = 'A1_div_zero';
      } else if (remMN > 0) {
        // Числитель обращается в ноль (нуль функции)
        outcomeType = 'INDEXED_ZERO';
        formattedRicisResult = `0_{${this.formatNumber(F)}}`;
        leanTheoremCitation = 'A10_mul_zero';
      } else {
        // Полное взаимное сокращение нулей (устранимая сингулярность 0/0 по SP1 / L1)
        outcomeType = 'REMOVABLE_SCALAR';
        formattedRicisResult = `${this.formatNumber(F)}`;
        leanTheoremCitation = 'divSelf_one';
      }

      singularPointsAnalysis.push({
        root: r,
        rootVariable: input.variable,
        denominatorMultiplicity: mD,
        numeratorMultiplicity: mN,
        canceledMultiplicity: canceled,
        residualNumeratorExpression: `F = ${this.formatNumber(F)}`,
        residualNumeratorValue: F,
        outcomeType,
        formattedRicisResult,
        leanTheoremCitation,
      });
    }

    const originalNumerator = this.formatPolynomial(
      input.numeratorFactors,
      numConst,
      input.variable
    );
    const originalDenominator = this.formatPolynomial(
      input.denominatorFactors,
      denConst,
      input.variable
    );

    return {
      originalNumerator,
      originalDenominator,
      variable: input.variable,
      denominatorRoots: uniqueRoots,
      singularPointsAnalysis,
      equationSolved: `D(${input.variable}) = 0`,
    };
  }

  private formatNumber(n: number): string {
    if (Number.isInteger(n)) return n.toString();
    return parseFloat(n.toFixed(6)).toString();
  }

  private formatPolynomial(
    factors: readonly IRationalFactor[],
    constant: number,
    _variable: string
  ): string {
    const parts: string[] = [];
    if (constant !== 1 || factors.length === 0) {
      parts.push(constant.toString());
    }
    for (const f of factors) {
      const powStr = f.power > 1 ? `^${f.power}` : '';
      parts.push(`(${f.factorText})${powStr}`);
    }
    return parts.join(' * ');
  }
}
