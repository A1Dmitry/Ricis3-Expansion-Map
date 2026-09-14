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
import { BaseSingularityRule } from './oopBaseRule';

export * from './a15SeriesEngine';
import {
  ExactRational,
  createRational,
  formatRational,
  toCanonicalRationalString,
  parseCanonicalStringToAst,
  structuralToSymbolicAst,
  SymbolicSeriesEngine,
  divRational,
} from './a15SeriesEngine';
import { OrderProfileCalculator, type OrderProfileResult } from './orderProfileCalculator';
export { OrderProfileCalculator, type OrderProfileResult };

const ZERO_BI = BigInt(0);

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

    if (!pair.numProfileCoeff || !pair.denProfileCoeff || pair.denProfileCoeff.num === ZERO_BI) {
      return { success: false, reason: 'Exact rational profile coefficients required for A15 reduction' };
    }

    const ratioCoeff = divRational(pair.numProfileCoeff, pair.denProfileCoeff);
    const canonicalStr = formatRational(ratioCoeff);

    return {
      success: true,
      reduced: this.factory.createA15ProfileQuotient(canonicalStr, defaultSource),
    };
  }
}
