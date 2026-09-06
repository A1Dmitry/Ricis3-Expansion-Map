import {
  StructuralExpression,
  LocalStructuralRule,
  LocalStructuralPhase,
  StructuralRuleAuthority,
  StructuralPrecondition
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

  protected abstract checkApplicability(
    expression: StructuralExpression,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): { isApplicable: boolean; reason?: string };

  protected abstract executeReduction(expression: StructuralExpression): StructuralExpression;

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

    try {
      const reduced = this.executeReduction(expression);
      return {
        status: 'APPLIED',
        reduced,
        preconditions: [...HOMOGENEOUS_SCALAR_PRECONDITIONS],
        rule: this.ruleName,
        phase: this.phase
      };
    } catch (e: any) {
      return {
        status: 'DEFERRED',
        reason: e.message || 'Reduction execution failed'
      };
    }
  }
}

export class A6GeometricBridgeRule extends BaseSingularityRule {
  readonly ruleName = 'A6_HOMOGENEOUS_SCALAR_PRODUCT';
  readonly phase = 'A1_A4_A10';
  readonly authority = 'RICIS_III_EXPLICIT';

  private readonly extractor = new SingularityOperandExtractor();
  private readonly pairValidator = new SingularityPairValidator();
  private readonly factory = new StructuralExpressionFactory();

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

  protected executeReduction(expression: StructuralExpression): StructuralExpression {
    if (expression.kind !== 'BINARY') {
      throw new Error('Invalid expression shape for A6 reduction');
    }
    const pair = this.extractor.extractA6Pair(expression);
    if (!pair) {
      throw new Error('Operands not found for A6 reduction');
    }

    const defaultSource = expression.identity?.source ?? {
      sourceHash: 'default-source',
      sourceCanonical: 'source',
      sourceSpan: { start: 0, endExclusive: 6 },
      origin: 'DERIVED_RICIS_RULE' as const,
    };

    const zeroPayload = pair.zero.payload ?? {
      kind: 'FINITE_LITERAL',
      lexeme: '0',
      identity: {
        structuralHash: '0',
        canonical: '0',
        typeTag: 'scalar',
        source: defaultSource,
      },
      semanticKeys: [],
    };

    const infPayload = pair.infinity.payload ?? {
      kind: 'FINITE_LITERAL',
      lexeme: '1',
      identity: {
        structuralHash: '1',
        canonical: '1',
        typeTag: 'scalar',
        source: defaultSource,
      },
      semanticKeys: [],
    };

    return this.factory.createA6Product(zeroPayload, infPayload, defaultSource);
  }
}

export class A7InfinitySubtractionRule extends BaseSingularityRule {
  readonly ruleName = 'A7_HOMOGENEOUS_SCALAR_INDEXED_SUBTRACTION';
  readonly phase = 'A1_A4_A10';
  readonly authority = 'RICIS_III_EXPLICIT';

  private readonly extractor = new SingularityOperandExtractor();
  private readonly pairValidator = new SingularityPairValidator();
  private readonly factory = new StructuralExpressionFactory();

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

  protected executeReduction(expression: StructuralExpression): StructuralExpression {
    if (expression.kind !== 'BINARY') {
      throw new Error('Invalid expression shape for A7 reduction');
    }
    const pair = this.extractor.extractA7Pair(expression);
    if (!pair) {
      throw new Error('Operands not found for A7 reduction');
    }

    const defaultSource = expression.identity?.source ?? {
      sourceHash: 'default-source',
      sourceCanonical: 'source',
      sourceSpan: { start: 0, endExclusive: 6 },
      origin: 'DERIVED_RICIS_RULE' as const,
    };

    const leftPayload = pair.leftInfinity.payload ?? {
      kind: 'FINITE_LITERAL',
      lexeme: 'F',
      identity: {
        structuralHash: 'F',
        canonical: 'F',
        typeTag: 'scalar',
        source: defaultSource,
      },
      semanticKeys: [],
    };

    const rightPayload = pair.rightInfinity.payload ?? {
      kind: 'FINITE_LITERAL',
      lexeme: 'G',
      identity: {
        structuralHash: 'G',
        canonical: 'G',
        typeTag: 'scalar',
        source: defaultSource,
      },
      semanticKeys: [],
    };

    return this.factory.createA7Difference(leftPayload, rightPayload, defaultSource);
  }
}
