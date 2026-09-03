import { describe, it, expect } from 'vitest';
import { OopA6A7Reducer } from './oopA6A7';
import {
  TypeConsistencyValidator,
  SemanticIndexValidator,
  SingularityRuleRegistry,
} from './oopImplementation';
import { ISingularityRule, RuleApplicationResult } from './oopContracts';
import { StructuralExpression } from './contracts';

describe('OOP A6/A7 Reducer Engine', () => {
  it('должен делегировать вызов найденному правилу', () => {
    const registry = new SingularityRuleRegistry();
    const typeValidator = new TypeConsistencyValidator();
    const indexValidator = new SemanticIndexValidator();

    const mockRule: ISingularityRule = {
      ruleName: 'A6_HOMOGENEOUS_SCALAR_PRODUCT',
      phase: 'A1_A4_A10',
      authority: 'RICIS_III_EXPLICIT',
      evaluate: () => ({
        status: 'APPLIED',
        reduced: {} as StructuralExpression,
        preconditions: [],
        rule: 'A6_HOMOGENEOUS_SCALAR_PRODUCT',
        phase: 'A1_A4_A10'
      })
    };

    registry.register(mockRule);

    const reducer = new OopA6A7Reducer(registry, typeValidator, indexValidator);
    const result = reducer.planHomogeneousScalarA6A7({} as StructuralExpression);

    expect(result.status).toBe('APPLIED');
    if (result.status === 'APPLIED') {
      expect(result.rule).toBe('A6_HOMOGENEOUS_SCALAR_PRODUCT');
    }
  });

  it('должен возвращать NOT_APPLICABLE, если правила не найдены', () => {
    const registry = new SingularityRuleRegistry();
    const typeValidator = new TypeConsistencyValidator();
    const indexValidator = new SemanticIndexValidator();

    const reducer = new OopA6A7Reducer(registry, typeValidator, indexValidator);
    const result = reducer.planHomogeneousScalarA6A7({} as StructuralExpression);

    expect(result.status).toBe('NOT_APPLICABLE');
  });
});
