import { describe, it, expect } from 'vitest';
import {
  TypeConsistencyValidator,
  SemanticIndexValidator,
  SingularityRuleRegistry,
} from './oopImplementation';
import { ISingularityRule, RuleApplicationResult } from './oopContracts';
import { StructuralExpression, StructuralTypeTag, StructuralIndex, FiniteStructuralKey, LocalStructuralRule, LocalStructuralPhase } from './contracts';

describe('RICIS-III OOP Contracts & Base Implementation Tests (Шаг 3)', () => {
  describe('Type Consistency Protocol (TCP) - L1C2', () => {
    it('должен подтверждать совместимость одинаковых типов (Homogeneous)', () => {
      const validator = new TypeConsistencyValidator();
      const result = validator.checkCompatibility('scalar', 'scalar');

      expect(result.isCompatible).toBe(true);
      expect(result.resultTag).toBe('scalar');
      expect(result.requiresCompositeDeferral).toBe(false);
    });

    it('должен отклонять несовместимые типы (Incompatible)', () => {
      const validator = new TypeConsistencyValidator();
      const result = validator.checkCompatibility('scalar', 'vector');

      expect(result.isCompatible).toBe(false);
      expect(result.requiresCompositeDeferral).toBe(true);
    });
  });

  describe('Semantic Indexing (SP4)', () => {
    const validator = new SemanticIndexValidator();

    it('должен валидировать корректный FiniteStructuralKey', () => {
      const key: FiniteStructuralKey = {
        key: 'x-5',
        kind: 'FACTOR',
        sourceHash: 'hash1',
        sourceCanonical: 'x - 5',
      };
      expect(validator.isKeyValid(key)).toBe(true);
    });

    it('должен отклонять пустые ключи', () => {
      const key: FiniteStructuralKey = {
        key: '   ',
        kind: 'FACTOR',
        sourceHash: 'hash1',
        sourceCanonical: '',
      };
      expect(validator.isKeyValid(key)).toBe(false);
    });

    it('должен подтверждать совпадение индекса и payload выражения (SP4)', () => {
      const index: StructuralIndex = {
        basis: 'SP4_SOURCE_EXPRESSION',
        payloadHash: 'hash123',
        payloadCanonical: 'x',
        payloadTypeTag: 'scalar',
        sourceHash: 'srcHash',
        semanticKeys: [],
      };
      const expression = {
        identity: { 
          structuralHash: 'hash123',
          canonical: 'x',
          typeTag: 'scalar',
          source: { sourceHash: 'srcHash' }
        }
      } as unknown as StructuralExpression;

      expect(validator.isIndexMatching(index, expression)).toBe(true);
    });
  });

  describe('Singularity Rule Registry & DI', () => {
    it('должен находить первое применимое правило', () => {
      const registry = new SingularityRuleRegistry();
      const indexValidator = new SemanticIndexValidator();
      const typeValidator = new TypeConsistencyValidator();

      const mockRuleA6: ISingularityRule = {
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

      const mockRuleA7: ISingularityRule = {
        ruleName: 'A7_HOMOGENEOUS_SCALAR_INDEXED_SUBTRACTION',
        phase: 'A1_A4_A10',
        authority: 'RICIS_III_EXPLICIT',
        evaluate: () => ({
          status: 'NOT_APPLICABLE',
          reason: 'Mismatch'
        })
      };

      registry.register(mockRuleA7);
      registry.register(mockRuleA6);

      const applicable = registry.findApplicableRule(
        {} as StructuralExpression,
        indexValidator,
        typeValidator
      );

      expect(applicable).toBeDefined();
      expect(applicable?.ruleName).toBe('A6_HOMOGENEOUS_SCALAR_PRODUCT');
    });
  });
});
