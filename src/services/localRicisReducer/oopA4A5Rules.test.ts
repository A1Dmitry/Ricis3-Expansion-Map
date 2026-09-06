import { describe, it, expect } from 'vitest';
import type {
  StructuralExpression,
  StructuralIndexedZero,
  StructuralIndexedInfinity,
  StructuralBinaryExpression,
  StructuralSourceReference,
} from './contracts';
import {
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

function createScalar(value: number, canonical: string, hash: string): StructuralExpression {
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

function createIndexedInfinity(payload: StructuralExpression): StructuralIndexedInfinity {
  return Object.freeze({
    kind: 'INDEXED_INFINITY' as const,
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
      structuralHash: `inf:${payload.identity.structuralHash}`,
      canonical: `inf_{${payload.identity.canonical}}`,
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

describe('RICIS-III A4 & A5 OOP Singularity Rules', () => {
  const indexValidator = new SemanticIndexValidator();
  const typeValidator = new TypeConsistencyValidator();

  describe('A4ZeroQuotientRule (0_F / 0_G)', () => {
    it('QA-A4-01: редуцирует 0_F / 0_G в F / G с сохранением L1 идентичности', () => {
      const rule = new A4ZeroQuotientRule();
      const F = createScalar(5, 'F', 'hash:F');
      const G = createScalar(2, 'G', 'hash:G');
      const expr = createBinary('DIVIDE', createIndexedZero(F), createIndexedZero(G));

      const result = rule.evaluate(expr, indexValidator, typeValidator);
      expect(result.status).toBe('APPLIED');
      if (result.status === 'APPLIED') {
        expect(result.rule).toBe('A4_INDEXED_ZERO_OVER_INDEXED_ZERO');
        expect(result.phase).toBe('A1_A4_A10');
        expect(result.reduced.kind).toBe('BINARY');
        const binary = result.reduced as StructuralBinaryExpression;
        expect(binary.operator).toBe('DIVIDE');
        expect(binary.left.identity.canonical).toBe('F');
        expect(binary.right.identity.canonical).toBe('G');
      }
    });

    it('QA-A4-02: L1_IDENTITY: 0_F / 0_F редуцируется в F / F с сохранением типа', () => {
      const rule = new A4ZeroQuotientRule();
      const F = createScalar(5, 'F', 'hash:F');
      const expr = createBinary('DIVIDE', createIndexedZero(F), createIndexedZero(F));

      const result = rule.evaluate(expr, indexValidator, typeValidator);
      expect(result.status).toBe('APPLIED');
      if (result.status === 'APPLIED') {
        expect(result.reduced.identity.typeTag).toBe('scalar');
      }
    });

    it('QA-A4-03: не применяется к неподдерживаемым операторам (0_F + 0_G)', () => {
      const rule = new A4ZeroQuotientRule();
      const F = createScalar(5, 'F', 'hash:F');
      const G = createScalar(2, 'G', 'hash:G');
      const expr = createBinary('ADD', createIndexedZero(F), createIndexedZero(G));

      const result = rule.evaluate(expr, indexValidator, typeValidator);
      expect(result.status).toBe('NOT_APPLICABLE');
    });

    it('QA-A4-04: TCP Protocol: разнородные типы (0_scalar / 0_vector) переводятся в DEFERRED', () => {
      const rule = new A4ZeroQuotientRule();
      const F = createScalar(5, 'F', 'hash:F');
      const V = createVector('V', 'hash:V');
      const expr = createBinary('DIVIDE', createIndexedZero(F), createIndexedZero(V));

      const result = rule.evaluate(expr, indexValidator, typeValidator);
      expect(result.status).toBe('DEFERRED');
      if (result.status === 'DEFERRED') {
        expect(result.reason).toBe('TCP_COMPOSITE_REQUIRED');
      }
    });
  });

  describe('A5InfinityQuotientRule (inf_F / inf_G)', () => {
    it('QA-A5-01: редуцирует inf_F / inf_G в F / G', () => {
      const rule = new A5InfinityQuotientRule();
      const F = createScalar(10, 'F', 'hash:F');
      const G = createScalar(2, 'G', 'hash:G');
      const expr = createBinary('DIVIDE', createIndexedInfinity(F), createIndexedInfinity(G));

      const result = rule.evaluate(expr, indexValidator, typeValidator);
      expect(result.status).toBe('APPLIED');
      if (result.status === 'APPLIED') {
        expect(result.rule).toBe('A5_INDEXED_INFINITY_OVER_INDEXED_INFINITY');
        expect(result.phase).toBe('A1_A4_A10');
        expect(result.reduced.kind).toBe('BINARY');
        const binary = result.reduced as StructuralBinaryExpression;
        expect(binary.operator).toBe('DIVIDE');
        expect(binary.left.identity.canonical).toBe('F');
        expect(binary.right.identity.canonical).toBe('G');
      }
    });

    it('QA-A5-02: не применяется к оператору вычитания (inf_F - inf_G)', () => {
      const rule = new A5InfinityQuotientRule();
      const F = createScalar(10, 'F', 'hash:F');
      const G = createScalar(2, 'G', 'hash:G');
      const expr = createBinary('SUBTRACT', createIndexedInfinity(F), createIndexedInfinity(G));

      const result = rule.evaluate(expr, indexValidator, typeValidator);
      expect(result.status).toBe('NOT_APPLICABLE');
    });

    it('QA-A5-03: TCP Protocol: разнородные типы переводятся в DEFERRED', () => {
      const rule = new A5InfinityQuotientRule();
      const F = createScalar(10, 'F', 'hash:F');
      const V = createVector('V', 'hash:V');
      const expr = createBinary('DIVIDE', createIndexedInfinity(F), createIndexedInfinity(V));

      const result = rule.evaluate(expr, indexValidator, typeValidator);
      expect(result.status).toBe('DEFERRED');
      if (result.status === 'DEFERRED') {
        expect(result.reason).toBe('TCP_COMPOSITE_REQUIRED');
      }
    });
  });

  describe('SingularityRuleRegistry Integration (A4, A5, A6, A7)', () => {
    it('QA-REG-01: корректно находит и применяет все 4 правила в реестре', () => {
      const registry = new SingularityRuleRegistry();
      registry.register(new A4ZeroQuotientRule());
      registry.register(new A5InfinityQuotientRule());
      registry.register(new A6GeometricBridgeRule());
      registry.register(new A7InfinitySubtractionRule());

      const F = createScalar(5, 'F', 'hash:F');
      const G = createScalar(2, 'G', 'hash:G');

      const a4Expr = createBinary('DIVIDE', createIndexedZero(F), createIndexedZero(G));
      const a5Expr = createBinary('DIVIDE', createIndexedInfinity(F), createIndexedInfinity(G));
      const a6Expr = createBinary('MULTIPLY', createIndexedZero(F), createIndexedInfinity(G));
      const a7Expr = createBinary('SUBTRACT', createIndexedInfinity(F), createIndexedInfinity(G));

      const a4Rule = registry.findApplicableRule(a4Expr, indexValidator, typeValidator);
      expect(a4Rule?.ruleName).toBe('A4_INDEXED_ZERO_OVER_INDEXED_ZERO');

      const a5Rule = registry.findApplicableRule(a5Expr, indexValidator, typeValidator);
      expect(a5Rule?.ruleName).toBe('A5_INDEXED_INFINITY_OVER_INDEXED_INFINITY');

      const a6Rule = registry.findApplicableRule(a6Expr, indexValidator, typeValidator);
      expect(a6Rule?.ruleName).toBe('A6_HOMOGENEOUS_SCALAR_PRODUCT');

      const a7Rule = registry.findApplicableRule(a7Expr, indexValidator, typeValidator);
      expect(a7Rule?.ruleName).toBe('A7_HOMOGENEOUS_SCALAR_INDEXED_SUBTRACTION');
    });
  });
});
