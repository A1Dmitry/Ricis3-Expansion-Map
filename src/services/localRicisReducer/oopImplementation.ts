import {
  FiniteStructuralKey,
  StructuralExpression,
  StructuralIndex,
  StructuralTypeTag,
  LocalStructuralRule,
  LocalStructuralPhase,
} from './contracts';
import {
  ITypeConsistencyValidator,
  ISemanticIndexValidator,
  ISingularityRule,
  ISingularityRuleRegistry,
  RuleApplicationResult,
} from './oopContracts';

export class TypeConsistencyValidator implements ITypeConsistencyValidator {
  checkCompatibility(leftTag: StructuralTypeTag, rightTag: StructuralTypeTag) {
    if (leftTag === 'scalar' && rightTag === 'scalar') {
      return {
        isCompatible: true,
        resultTag: 'scalar' as const,
        requiresCompositeDeferral: false,
      };
    }
    return {
      isCompatible: false,
      requiresCompositeDeferral: true,
    };
  }
}

export class SemanticIndexValidator implements ISemanticIndexValidator {
  isKeyValid(key: FiniteStructuralKey): boolean {
    return key.key.length > 0 && key.key.length <= 512 &&
      key.sourceHash.length > 0 && key.sourceCanonical.length > 0;
  }

  hasValidFiniteKeys(expression: StructuralExpression): boolean {
    if (expression.semanticKeys.length === 0 || !expression.semanticKeys.every(k => this.isKeyValid(k))) return false;
    
    switch (expression.kind) {
      case 'UNARY':
        return this.hasValidFiniteKeys(expression.operand);
      case 'BINARY':
        return this.hasValidFiniteKeys(expression.left) && this.hasValidFiniteKeys(expression.right);
      case 'INDEXED_ZERO':
      case 'INDEXED_INFINITY':
        return expression.index.semanticKeys.length > 0 &&
          expression.index.semanticKeys.every(k => this.isKeyValid(k)) && 
          this.hasValidFiniteKeys(expression.payload);
      default:
        return true;
    }
  }

  isIndexMatching(index: StructuralIndex, payload: StructuralExpression): boolean {
    return index.payloadHash === payload.identity.structuralHash &&
      index.payloadCanonical === payload.identity.canonical &&
      index.payloadTypeTag === payload.identity.typeTag &&
      index.sourceHash === payload.identity.source.sourceHash;
  }
}

export class SingularityRuleRegistry implements ISingularityRuleRegistry {
  private rules: ISingularityRule[] = [];

  register(rule: ISingularityRule): void {
    this.rules.push(rule);
  }

  getRules(): readonly ISingularityRule[] {
    return this.rules;
  }

  findApplicableRule(
    expression: StructuralExpression,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): ISingularityRule | undefined {
    for (const rule of this.rules) {
      const result = rule.evaluate(expression, indexValidator, typeValidator);
      if (result.status === 'APPLIED') {
        return rule;
      }
    }
    return undefined;
  }
}
