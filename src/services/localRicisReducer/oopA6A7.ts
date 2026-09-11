import { StructuralExpression } from './contracts';
import {
  ITypeConsistencyValidator,
  ISemanticIndexValidator,
  ISingularityRuleRegistry
} from './oopContracts';
import { RuleApplicationResult } from './oopContracts';

export class OopA6A7Reducer {
  constructor(
    private registry: ISingularityRuleRegistry,
    private typeValidator: ITypeConsistencyValidator,
    private indexValidator: ISemanticIndexValidator
  ) {}

  public planHomogeneousScalarA6A7(
    expression: StructuralExpression
  ): RuleApplicationResult {
    const applicableRule = this.registry.findApplicableRule(
      expression,
      this.indexValidator,
      this.typeValidator
    );

    if (applicableRule) {
      return applicableRule.evaluate(
        expression,
        this.indexValidator,
        this.typeValidator
      );
    }

    return { status: 'NOT_APPLICABLE', reason: 'UNSUPPORTED_SHAPE' };
  }
}
