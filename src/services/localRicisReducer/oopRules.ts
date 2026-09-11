import {
  StructuralExpression,
  LocalStructuralRule,
  LocalStructuralPhase,
  StructuralRuleAuthority,
  StructuralSourceReference,
} from './contracts';
import {
  ISingularityRule,
  RuleApplicationResult,
  ISemanticIndexValidator,
  ITypeConsistencyValidator
} from './oopContracts';
import { HOMOGENEOUS_SCALAR_PRECONDITIONS } from './a6A7Homogeneous';
import {
  SingularityOperandExtractor,
  SingularityPairValidator,
  StructuralExpressionFactory,
} from './oopDomainServices';

export abstract class BaseSingularityRule implements ISingularityRule {
  abstract readonly ruleName: LocalStructuralRule;
  abstract readonly phase: LocalStructuralPhase;
  abstract readonly authority: StructuralRuleAuthority;

  protected readonly extractor: SingularityOperandExtractor;
  protected readonly pairValidator: SingularityPairValidator;
  protected readonly factory: StructuralExpressionFactory;

  public constructor(
    extractor?: SingularityOperandExtractor,
    pairValidator?: SingularityPairValidator,
    factory?: StructuralExpressionFactory
  ) {
    this.extractor = extractor ?? new SingularityOperandExtractor();
    this.pairValidator = pairValidator ?? new SingularityPairValidator();
    this.factory = factory ?? new StructuralExpressionFactory();
  }

  protected getDefaultSource(expression: StructuralExpression): StructuralSourceReference {
    return expression.identity?.source ?? {
      sourceHash: 'default-source',
      sourceCanonical: 'source',
      sourceSpan: { start: 0, endExclusive: 6 },
      origin: 'DERIVED_RICIS_RULE' as const,
    };
  }

  protected getFallbackPayload(
    payload: StructuralExpression | undefined,
    defaultLexeme: string,
    defaultSource: StructuralSourceReference
  ): StructuralExpression {
    return payload ?? {
      kind: 'FINITE_LITERAL',
      lexeme: defaultLexeme,
      identity: {
        structuralHash: defaultLexeme,
        canonical: defaultLexeme,
        typeTag: 'scalar',
        source: defaultSource,
      },
      semanticKeys: [],
    };
  }

  protected abstract checkApplicability(
    expression: StructuralExpression,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): { isApplicable: boolean; reason?: string };

  protected abstract executeReduction(expression: StructuralExpression): { success: true; reduced: StructuralExpression } | { success: false; reason: string };

  evaluate(
    expression: StructuralExpression,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): RuleApplicationResult {
    const applicability = this.checkApplicability(expression, indexValidator, typeValidator);
    
    if (!applicability.isApplicable) {
      const isDeferred = applicability.reason === 'TCP_COMPOSITE_REQUIRED' ||
        applicability.reason === 'SP4_SOURCE_MISMATCH' ||
        applicability.reason === 'INVALID_FINITE_KEYS';
      return {
        status: isDeferred ? 'DEFERRED' : 'NOT_APPLICABLE',
        reason: applicability.reason || 'Failed preconditions'
      };
    }

    const execution = this.executeReduction(expression);
    if (!execution.success) {
      return {
        status: 'DEFERRED',
        reason: execution.reason
      };
    }

    return {
      status: 'APPLIED',
      reduced: execution.reduced,
      preconditions: [...HOMOGENEOUS_SCALAR_PRECONDITIONS],
      rule: this.ruleName,
      phase: this.phase
    };
  }
}

export class A6GeometricBridgeRule extends BaseSingularityRule {
  readonly ruleName = 'A6_HOMOGENEOUS_SCALAR_PRODUCT';
  readonly phase = 'A5_A6_A7';
  readonly authority = 'RICIS_III_EXPLICIT';

  protected checkApplicability(
    expression: StructuralExpression,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): { isApplicable: boolean; reason?: string } {
    if (expression.kind !== 'BINARY') {
      return { isApplicable: false, reason: 'Must be a binary expression' };
    }

    const pair = this.extractor.extractA6Pair(expression);
    if (!pair) {
      return { isApplicable: false, reason: 'Must have multiplication of INDEXED_ZERO and INDEXED_INFINITY' };
    }

    const validation = this.pairValidator.validateA6Pair(pair, indexValidator, typeValidator);
    if (!validation.isValid) {
      return { isApplicable: false, reason: validation.reason };
    }

    return { isApplicable: true };
  }

  protected executeReduction(expression: StructuralExpression): { success: true; reduced: StructuralExpression } | { success: false; reason: string } {
    if (expression.kind !== 'BINARY') {
      return { success: false, reason: 'Invalid expression shape for A6 reduction' };
    }
    const pair = this.extractor.extractA6Pair(expression);
    if (!pair) {
      return { success: false, reason: 'Operands not found for A6 reduction' };
    }

    const defaultSource = this.getDefaultSource(expression);
    const zeroPayload = this.getFallbackPayload(pair.zero.payload, '0', defaultSource);
    const infPayload = this.getFallbackPayload(pair.infinity.payload, '1', defaultSource);

    return { success: true, reduced: this.factory.createA6Product(zeroPayload, infPayload, defaultSource) };
  }
}

export class A7InfinitySubtractionRule extends BaseSingularityRule {
  readonly ruleName = 'A7_HOMOGENEOUS_SCALAR_INDEXED_SUBTRACTION';
  readonly phase = 'A5_A6_A7';
  readonly authority = 'RICIS_III_EXPLICIT';

  protected checkApplicability(
    expression: StructuralExpression,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): { isApplicable: boolean; reason?: string } {
    if (expression.kind !== 'BINARY') {
      return { isApplicable: false, reason: 'Must be a binary expression' };
    }

    const pair = this.extractor.extractA7Pair(expression);
    if (!pair) {
      return { isApplicable: false, reason: 'Both operands must be INDEXED_INFINITY with subtraction' };
    }

    const validation = this.pairValidator.validateA7Pair(pair, indexValidator, typeValidator);
    if (!validation.isValid) {
      return { isApplicable: false, reason: validation.reason };
    }

    return { isApplicable: true };
  }

  protected executeReduction(expression: StructuralExpression): { success: true; reduced: StructuralExpression } | { success: false; reason: string } {
    if (expression.kind !== 'BINARY') {
      return { success: false, reason: 'Invalid expression shape for A7 reduction' };
    }
    const pair = this.extractor.extractA7Pair(expression);
    if (!pair) {
      return { success: false, reason: 'Operands not found for A7 reduction' };
    }

    const defaultSource = this.getDefaultSource(expression);
    const leftPayload = this.getFallbackPayload(pair.leftInfinity.payload, 'F', defaultSource);
    const rightPayload = this.getFallbackPayload(pair.rightInfinity.payload, 'G', defaultSource);

    return { success: true, reduced: this.factory.createA7Difference(leftPayload, rightPayload, defaultSource) };
  }
}

export class A4ZeroQuotientRule extends BaseSingularityRule {
  readonly ruleName = 'A4_INDEXED_ZERO_OVER_INDEXED_ZERO';
  readonly phase = 'A1_A4_A10';
  readonly authority = 'RICIS_III_EXPLICIT';

  protected checkApplicability(
    expression: StructuralExpression,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): { isApplicable: boolean; reason?: string } {
    if (expression.kind !== 'BINARY') {
      return { isApplicable: false, reason: 'Must be a binary expression' };
    }

    const pair = this.extractor.extractA4Pair(expression);
    if (!pair) {
      return { isApplicable: false, reason: 'Both operands must be INDEXED_ZERO with division' };
    }

    const validation = this.pairValidator.validateA4Pair(pair, indexValidator, typeValidator);
    if (!validation.isValid) {
      return { isApplicable: false, reason: validation.reason };
    }

    return { isApplicable: true };
  }

  protected executeReduction(expression: StructuralExpression): { success: true; reduced: StructuralExpression } | { success: false; reason: string } {
    if (expression.kind !== 'BINARY') {
      return { success: false, reason: 'Invalid expression shape for A4 reduction' };
    }
    const pair = this.extractor.extractA4Pair(expression);
    if (!pair) {
      return { success: false, reason: 'Operands not found for A4 reduction' };
    }

    const defaultSource = this.getDefaultSource(expression);
    const numPayload = this.getFallbackPayload(pair.numeratorZero.payload, 'F', defaultSource);
    const denPayload = this.getFallbackPayload(pair.denominatorZero.payload, 'G', defaultSource);

    return { success: true, reduced: this.factory.createA4Quotient(numPayload, denPayload, defaultSource) };
  }
}

export class A5InfinityQuotientRule extends BaseSingularityRule {
  readonly ruleName = 'A5_INDEXED_INFINITY_OVER_INDEXED_INFINITY';
  readonly phase = 'A1_A4_A10';
  readonly authority = 'RICIS_III_EXPLICIT';

  protected checkApplicability(
    expression: StructuralExpression,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): { isApplicable: boolean; reason?: string } {
    if (expression.kind !== 'BINARY') {
      return { isApplicable: false, reason: 'Must be a binary expression' };
    }

    const pair = this.extractor.extractA5Pair(expression);
    if (!pair) {
      return { isApplicable: false, reason: 'Both operands must be INDEXED_INFINITY with division' };
    }

    const validation = this.pairValidator.validateA5Pair(pair, indexValidator, typeValidator);
    if (!validation.isValid) {
      return { isApplicable: false, reason: validation.reason };
    }

    return { isApplicable: true };
  }

  protected executeReduction(expression: StructuralExpression): { success: true; reduced: StructuralExpression } | { success: false; reason: string } {
    if (expression.kind !== 'BINARY') {
      return { success: false, reason: 'Invalid expression shape for A5 reduction' };
    }
    const pair = this.extractor.extractA5Pair(expression);
    if (!pair) {
      return { success: false, reason: 'Operands not found for A5 reduction' };
    }

    const defaultSource = this.getDefaultSource(expression);
    const numPayload = this.getFallbackPayload(pair.numeratorInfinity.payload, 'F', defaultSource);
    const denPayload = this.getFallbackPayload(pair.denominatorInfinity.payload, 'G', defaultSource);

    return { success: true, reduced: this.factory.createA5Quotient(numPayload, denPayload, defaultSource) };
  }
}

export class A1FiniteOverZeroRule extends BaseSingularityRule {
  readonly ruleName = 'A1_FINITE_OVER_ZERO';
  readonly phase = 'A1_A4_A10';
  readonly authority = 'RICIS_III_EXPLICIT';

  protected checkApplicability(
    expression: StructuralExpression,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): { isApplicable: boolean; reason?: string } {
    if (expression.kind !== 'BINARY') {
      return { isApplicable: false, reason: 'Must be a binary expression' };
    }

    const pair = this.extractor.extractA1Pair(expression);
    if (!pair) {
      return { isApplicable: false, reason: 'Must be finite numerator over zero denominator' };
    }

    const validation = this.pairValidator.validateA1Pair(pair, indexValidator, typeValidator);
    if (!validation.isValid) {
      return { isApplicable: false, reason: validation.reason };
    }

    return { isApplicable: true };
  }

  protected executeReduction(expression: StructuralExpression): { success: true; reduced: StructuralExpression } | { success: false; reason: string } {
    if (expression.kind !== 'BINARY') {
      return { success: false, reason: 'Invalid expression shape for A1 reduction' };
    }
    const pair = this.extractor.extractA1Pair(expression);
    if (!pair) {
      return { success: false, reason: 'Operands not found for A1 reduction' };
    }

    const defaultSource = this.getDefaultSource(expression);
    return { success: true, reduced: this.factory.createA1Infinity(pair.numeratorPayload, defaultSource) };
  }
}

export class A10FiniteTimesZeroRule extends BaseSingularityRule {
  readonly ruleName = 'A10_FINITE_TIMES_ZERO';
  readonly phase = 'A1_A4_A10';
  readonly authority = 'RICIS_III_EXPLICIT';

  protected checkApplicability(
    expression: StructuralExpression,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): { isApplicable: boolean; reason?: string } {
    if (expression.kind !== 'BINARY') {
      return { isApplicable: false, reason: 'Must be a binary expression' };
    }

    const pair = this.extractor.extractA10Pair(expression);
    if (!pair) {
      return { isApplicable: false, reason: 'Must be finite expression multiplied by zero' };
    }

    const validation = this.pairValidator.validateA10Pair(pair, indexValidator, typeValidator);
    if (!validation.isValid) {
      return { isApplicable: false, reason: validation.reason };
    }

    return { isApplicable: true };
  }

  protected executeReduction(expression: StructuralExpression): { success: true; reduced: StructuralExpression } | { success: false; reason: string } {
    if (expression.kind !== 'BINARY') {
      return { success: false, reason: 'Invalid expression shape for A10 reduction' };
    }
    const pair = this.extractor.extractA10Pair(expression);
    if (!pair) {
      return { success: false, reason: 'Operands not found for A10 reduction' };
    }

    const defaultSource = this.getDefaultSource(expression);
    return { success: true, reduced: this.factory.createA10Zero(pair.finitePayload, defaultSource) };
  }
}

export class A8ZeroSubtractionRule extends BaseSingularityRule {
  readonly ruleName = 'A8_HOMOGENEOUS_SCALAR_INDEXED_SUBTRACTION';
  readonly phase = 'A5_A6_A7';
  readonly authority = 'RICIS_III_EXPLICIT';

  protected checkApplicability(
    expression: StructuralExpression,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): { isApplicable: boolean; reason?: string } {
    if (expression.kind !== 'BINARY') {
      return { isApplicable: false, reason: 'Must be a binary expression' };
    }

    const pair = this.extractor.extractA8Pair(expression);
    if (!pair) {
      return { isApplicable: false, reason: 'Both operands must be INDEXED_ZERO with subtraction' };
    }

    const validation = this.pairValidator.validateA8Pair(pair, indexValidator, typeValidator);
    if (!validation.isValid) {
      return { isApplicable: false, reason: validation.reason };
    }

    return { isApplicable: true };
  }

  protected executeReduction(expression: StructuralExpression): { success: true; reduced: StructuralExpression } | { success: false; reason: string } {
    if (expression.kind !== 'BINARY') {
      return { success: false, reason: 'Invalid expression shape for A8 reduction' };
    }
    const pair = this.extractor.extractA8Pair(expression);
    if (!pair) {
      return { success: false, reason: 'Operands not found for A8 reduction' };
    }

    const defaultSource = this.getDefaultSource(expression);
    const leftPayload = this.getFallbackPayload(pair.leftZero.payload, 'F', defaultSource);
    const rightPayload = this.getFallbackPayload(pair.rightZero.payload, 'G', defaultSource);

    return { success: true, reduced: this.factory.createA8Difference(leftPayload, rightPayload, defaultSource) };
  }
}

