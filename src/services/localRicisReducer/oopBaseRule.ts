import {
  StructuralExpression,
  LocalStructuralRule,
  LocalStructuralPhase,
  StructuralRuleAuthority,
  StructuralSourceReference,
} from './contracts';
import type {
  ISingularityRule,
  RuleApplicationResult,
  ISemanticIndexValidator,
  ITypeConsistencyValidator,
  ISingularityOperandExtractor,
  ISingularityPairValidator,
  IStructuralExpressionFactory,
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
