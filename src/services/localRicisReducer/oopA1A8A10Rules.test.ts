import { describe, it, expect } from 'vitest';
import type {
  StructuralExpression,
  StructuralIndexedZero,
  StructuralIndexedInfinity,
  StructuralBinaryExpression,
  StructuralSourceReference,
} from './contracts';
import {
  A1FiniteOverZeroRule,
  A10FiniteTimesZeroRule,
  A8ZeroSubtractionRule,
  A4ZeroQuotientRule,
  A5InfinityQuotientRule,
  A6GeometricBridgeRule,
  A7InfinitySubtractionRule,
} from './oopRules';
import {
  SemanticIndexValidator,
  TypeConsistencyValidator,
  SingularityRuleRegistry,
} from './oopImplementation';

function createSourceRef(hash: string, canonical: string): StructuralSourceReference {
  return Object.freeze({
    sourceHash: hash,
    sourceCanonical: canonical,
    sourceSpan: { start: 0, endExclusive: canonical.length },
    origin: 'ANALYZER_AST' as const,
  });
}

function createScalar(value: number | string, canonical: string, hash: string): StructuralExpression {
  return Object.freeze({
    kind: 'FINITE_LITERAL' as const,
    lexeme: String(value),
    identity: Object.freeze({
      structuralHash: hash,
      canonical,
      typeTag: 'scalar' as const,
      source: createSourceRef(hash, canonical),
    }),
    semanticKeys: Object.freeze([
      Object.freeze({
        kind: 'FACTOR' as const,
        key: canonical,
        sourceHash: hash,
        sourceCanonical: canonical,
      }),
    ]),
  });
}

function createVector(canonical: string, hash: string): StructuralExpression {
  return Object.freeze({
    kind: 'IDENTIFIER' as const,
    name: canonical,
    identity: Object.freeze({
      structuralHash: hash,
      canonical,
      typeTag: 'vector' as const,
      source: createSourceRef(hash, canonical),
    }),
    semanticKeys: Object.freeze([
      Object.freeze({
        kind: 'FACTOR' as const,
        key: canonical,
        sourceHash: hash,
        sourceCanonical: canonical,
      }),
    ]),
  });
}

function createZeroLiteral(): StructuralExpression {
  return createScalar(0, '0', 'lit:0');
}

function createIndexedZero(payload: StructuralExpression): StructuralIndexedZero {
  return Object.freeze({
    kind: 'INDEXED_ZERO' as const,
    index: Object.freeze({
      basis: 'SP4_SOURCE_EXPRESSION' as const,
      payloadHash: payload.identity.structuralHash,
      payloadCanonical: payload.identity.canonical,
      payloadTypeTag: payload.identity.typeTag,
      sourceHash: payload.identity.source.sourceHash,
      semanticKeys: payload.semanticKeys,
    }),
    payload,
    identity: Object.freeze({
      structuralHash: `zero:${payload.identity.structuralHash}`,
      canonical: `0_{${payload.identity.canonical}}`,
      typeTag: payload.identity.typeTag,
      source: payload.identity.source,
    }),
    semanticKeys: payload.semanticKeys,
  });
}

function createBinary(
  operator: StructuralBinaryExpression['operator'],
  left: StructuralExpression,
  right: StructuralExpression
): StructuralBinaryExpression {
  const canonical = `(${left.identity.canonical} ${operator} ${right.identity.canonical})`;
  return Object.freeze({
    kind: 'BINARY' as const,
    operator,
    left,
    right,
    identity: Object.freeze({
      structuralHash: `bin:${operator}:${left.identity.structuralHash}:${right.identity.structuralHash}`,
      canonical,
      typeTag: left.identity.typeTag,
      source: left.identity.source,
    }),
    semanticKeys: Object.freeze([...left.semanticKeys, ...right.semanticKeys]),
  });
}

describe('RICIS-III A1, A10, A8 OOP Singularity Rules', () => {
  const indexValidator = new SemanticIndexValidator();
  const typeValidator = new TypeConsistencyValidator();

  describe('A1FiniteOverZeroRule (F / 0 -> inf_F)', () => {
    it('QA-A1-01: редуцирует 5 / 0 в inf_5', () => {
      const rule = new A1FiniteOverZeroRule();
      const F = createScalar(5, '5', 'hash:5');
      const zero = createZeroLiteral();
      const expr = createBinary('DIVIDE', F, zero);

      const result = rule.evaluate(expr, indexValidator, typeValidator);
      expect(result.status).toBe('APPLIED');
      if (result.status === 'APPLIED') {
        expect(result.rule).toBe('A1_FINITE_OVER_ZERO');
        expect(result.phase).toBe('A1_A4_A10');
        expect(result.reduced.kind).toBe('INDEXED_INFINITY');
        const inf = result.reduced as StructuralIndexedInfinity;
        expect(inf.payload.identity.canonical).toBe('5');
      }
    });

    it('QA-A1-02: не применяется к 0 / 0 (делегируется A4)', () => {
      const rule = new A1FiniteOverZeroRule();
      const zero = createZeroLiteral();
      const expr = createBinary('DIVIDE', zero, zero);

      const result = rule.evaluate(expr, indexValidator, typeValidator);
      expect(result.status).toBe('NOT_APPLICABLE');
    });

    it('QA-A1-03: TCP Protocol: разнородные типы (vector / 0) переводятся в DEFERRED', () => {
      const rule = new A1FiniteOverZeroRule();
      const V = createVector('V', 'hash:V');
      const zero = createZeroLiteral();
      const expr = createBinary('DIVIDE', V, zero);

      const result = rule.evaluate(expr, indexValidator, typeValidator);
      expect(result.status).toBe('DEFERRED');
      if (result.status === 'DEFERRED') {
        expect(result.reason).toBe('TCP_COMPOSITE_REQUIRED');
      }
    });
  });

  describe('A10FiniteTimesZeroRule (F * 0 -> 0_F)', () => {
    it('QA-A10-01: редуцирует 7 * 0 в 0_7', () => {
      const rule = new A10FiniteTimesZeroRule();
      const F = createScalar(7, '7', 'hash:7');
      const zero = createZeroLiteral();
      const expr = createBinary('MULTIPLY', F, zero);

      const result = rule.evaluate(expr, indexValidator, typeValidator);
      expect(result.status).toBe('APPLIED');
      if (result.status === 'APPLIED') {
        expect(result.rule).toBe('A10_FINITE_TIMES_ZERO');
        expect(result.phase).toBe('A1_A4_A10');
        expect(result.reduced.kind).toBe('INDEXED_ZERO');
        const zeroRes = result.reduced as StructuralIndexedZero;
        expect(zeroRes.payload.identity.canonical).toBe('7');
      }
    });

    it('QA-A10-02: редуцирует 0 * Y в 0_Y (коммутативность)', () => {
      const rule = new A10FiniteTimesZeroRule();
      const Y = createScalar('Y', 'Y', 'hash:Y');
      const zero = createZeroLiteral();
      const expr = createBinary('MULTIPLY', zero, Y);

      const result = rule.evaluate(expr, indexValidator, typeValidator);
      expect(result.status).toBe('APPLIED');
      if (result.status === 'APPLIED') {
        expect(result.rule).toBe('A10_FINITE_TIMES_ZERO');
        expect(result.reduced.kind).toBe('INDEXED_ZERO');
        const zeroRes = result.reduced as StructuralIndexedZero;
        expect(zeroRes.payload.identity.canonical).toBe('Y');
      }
    });
  });

  describe('A8ZeroSubtractionRule (0_F - 0_G -> 0_{F - G})', () => {
    it('QA-A8-01: редуцирует 0_F - 0_G в 0_{F - G}', () => {
      const rule = new A8ZeroSubtractionRule();
      const F = createScalar('F', 'F', 'hash:F');
      const G = createScalar('G', 'G', 'hash:G');
      const expr = createBinary('SUBTRACT', createIndexedZero(F), createIndexedZero(G));

      const result = rule.evaluate(expr, indexValidator, typeValidator);
      expect(result.status).toBe('APPLIED');
      if (result.status === 'APPLIED') {
        expect(result.rule).toBe('A8_HOMOGENEOUS_SCALAR_INDEXED_SUBTRACTION');
        expect(result.phase).toBe('A5_A6_A7');
        expect(result.reduced.kind).toBe('INDEXED_ZERO');
        const zeroRes = result.reduced as StructuralIndexedZero;
        expect(zeroRes.payload.kind).toBe('BINARY');
      }
    });

    it('QA-A8-02: TCP Protocol: разнородные типы (0_scalar - 0_vector) переводятся в DEFERRED', () => {
      const rule = new A8ZeroSubtractionRule();
      const F = createScalar('F', 'F', 'hash:F');
      const V = createVector('V', 'hash:V');
      const expr = createBinary('SUBTRACT', createIndexedZero(F), createIndexedZero(V));

      const result = rule.evaluate(expr, indexValidator, typeValidator);
      expect(result.status).toBe('DEFERRED');
      if (result.status === 'DEFERRED') {
        expect(result.reason).toBe('TCP_COMPOSITE_REQUIRED');
      }
    });
  });

  describe('Complete SingularityRuleRegistry (7 Rules)', () => {
    it('QA-REG-FULL: успешно регистрирует все 7 правил сингулярностей', () => {
      const registry = new SingularityRuleRegistry();
      registry.register(new A4ZeroQuotientRule());
      registry.register(new A5InfinityQuotientRule());
      registry.register(new A6GeometricBridgeRule());
      registry.register(new A7InfinitySubtractionRule());
      registry.register(new A8ZeroSubtractionRule());
      registry.register(new A1FiniteOverZeroRule());
      registry.register(new A10FiniteTimesZeroRule());

      expect(registry.getRules().length).toBe(7);

      const F = createScalar(5, '5', 'hash:5');
      const zero = createZeroLiteral();
      const a1Expr = createBinary('DIVIDE', F, zero);
      const a10Expr = createBinary('MULTIPLY', F, zero);

      const a1Found = registry.findApplicableRule(a1Expr, indexValidator, typeValidator);
      expect(a1Found?.ruleName).toBe('A1_FINITE_OVER_ZERO');

      const a10Found = registry.findApplicableRule(a10Expr, indexValidator, typeValidator);
      expect(a10Found?.ruleName).toBe('A10_FINITE_TIMES_ZERO');
    });
  });
});
