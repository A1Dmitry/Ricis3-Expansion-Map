import { describe, it, expect } from 'vitest';
import { A6GeometricBridgeRule, A7InfinitySubtractionRule } from './oopRules';
import { SemanticIndexValidator, TypeConsistencyValidator } from './oopImplementation';
import { StructuralExpression } from './contracts';

describe('RICIS-III OOP Rules - Concrete Axiom Tests', () => {
  const indexValidator = new SemanticIndexValidator();
  const typeValidator = new TypeConsistencyValidator();

  describe('A6GeometricBridgeRule (0 * inf)', () => {
    it('должно применяться к 0 * inf', () => {
      const rule = new A6GeometricBridgeRule();
      
      const expr = {
        kind: 'BINARY',
        operator: 'MULTIPLY',
        left: { kind: 'INDEXED_ZERO' },
        right: { kind: 'INDEXED_INFINITY' },
      } as unknown as StructuralExpression;

      const result = rule.evaluate(expr, indexValidator, typeValidator);
      expect(result.status).toBe('APPLIED');
      if (result.status === 'APPLIED') {
        expect(result.rule).toBe('A6_HOMOGENEOUS_SCALAR_PRODUCT');
      }
    });

    it('не должно применяться к 0 + inf', () => {
      const rule = new A6GeometricBridgeRule();
      
      const expr = {
        kind: 'BINARY',
        operator: 'ADD', // Invalid operator
        left: { kind: 'INDEXED_ZERO' },
        right: { kind: 'INDEXED_INFINITY' },
      } as unknown as StructuralExpression;

      const result = rule.evaluate(expr, indexValidator, typeValidator);
      expect(result.status).toBe('NOT_APPLICABLE');
    });
  });

  describe('A7InfinitySubtractionRule (inf - inf)', () => {
    it('должно применяться к inf - inf', () => {
      const rule = new A7InfinitySubtractionRule();
      
      const expr = {
        kind: 'BINARY',
        operator: 'SUBTRACT',
        left: { kind: 'INDEXED_INFINITY' },
        right: { kind: 'INDEXED_INFINITY' },
      } as unknown as StructuralExpression;

      const result = rule.evaluate(expr, indexValidator, typeValidator);
      expect(result.status).toBe('APPLIED');
      if (result.status === 'APPLIED') {
        expect(result.rule).toBe('A7_HOMOGENEOUS_SCALAR_INDEXED_SUBTRACTION');
      }
    });
  });
});
