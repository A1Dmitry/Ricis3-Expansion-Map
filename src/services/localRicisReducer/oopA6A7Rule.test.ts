import { describe, it, expect } from 'vitest';
import { A6HomogeneousScalarProductRule } from './oopA6A7Rule';
import { TypeConsistencyValidator, SemanticIndexValidator } from './oopImplementation';
import {
  StructuralExpression,
  StructuralIndex,
  StructuralIndexedZero,
  StructuralIndexedInfinity,
} from './contracts';

describe('A6HomogeneousScalarProductRule', () => {
  const typeValidator = new TypeConsistencyValidator();
  const indexValidator = new SemanticIndexValidator();
  const rule = new A6HomogeneousScalarProductRule();

  it('должен возвращать NOT_APPLICABLE для не-умножения', () => {
    const expr: StructuralExpression = {
      kind: 'BINARY',
      operator: 'ADD',
      left: {
        kind: 'FINITE_LITERAL',
        lexeme: '1',
        identity: {
          structuralHash: '1',
          canonical: '1',
          typeTag: 'scalar',
          source: { sourceHash: 's', sourceCanonical: '1', sourceSpan: { start: 0, endExclusive: 1 }, origin: 'ANALYZER_AST' },
        },
        semanticKeys: [],
      },
      right: {
        kind: 'FINITE_LITERAL',
        lexeme: '2',
        identity: {
          structuralHash: '2',
          canonical: '2',
          typeTag: 'scalar',
          source: { sourceHash: 's', sourceCanonical: '2', sourceSpan: { start: 0, endExclusive: 1 }, origin: 'ANALYZER_AST' },
        },
        semanticKeys: [],
      },
      identity: {
        structuralHash: 'add',
        canonical: '1 + 2',
        typeTag: 'scalar',
        source: { sourceHash: 's', sourceCanonical: '1 + 2', sourceSpan: { start: 0, endExclusive: 5 }, origin: 'ANALYZER_AST' },
      },
      semanticKeys: [],
    };
    const result = rule.evaluate(expr, indexValidator, typeValidator);
    expect(result.status).toBe('NOT_APPLICABLE');
  });

  it('должен возвращать APPLIED для корректного A6 произведения (0_F * inf_F)', () => {
    const src = 'srcHash';
    const fPayload: StructuralExpression = {
      kind: 'IDENTIFIER',
      name: 'F',
      identity: {
        structuralHash: 'hashF',
        canonical: 'F',
        typeTag: 'scalar',
        source: { sourceHash: src, sourceCanonical: 'F', sourceSpan: { start: 0, endExclusive: 1 }, origin: 'ANALYZER_AST' },
      },
      semanticKeys: [{ key: 'ratio:F', kind: 'RATIO', sourceHash: src, sourceCanonical: 'F' }],
    };
    const gPayload: StructuralExpression = {
      kind: 'IDENTIFIER',
      name: 'G',
      identity: {
        structuralHash: 'hashG',
        canonical: 'G',
        typeTag: 'scalar',
        source: { sourceHash: src, sourceCanonical: 'G', sourceSpan: { start: 0, endExclusive: 1 }, origin: 'ANALYZER_AST' },
      },
      semanticKeys: [{ key: 'ratio:G', kind: 'RATIO', sourceHash: src, sourceCanonical: 'G' }],
    };

    const zeroIndex: StructuralIndex = {
      basis: 'SP4_SOURCE_EXPRESSION',
      payloadHash: 'hashF',
      payloadCanonical: 'F',
      payloadTypeTag: 'scalar',
      sourceHash: src,
      semanticKeys: fPayload.semanticKeys,
    };
    const infIndex: StructuralIndex = {
      basis: 'SP4_SOURCE_EXPRESSION',
      payloadHash: 'hashG',
      payloadCanonical: 'G',
      payloadTypeTag: 'scalar',
      sourceHash: src,
      semanticKeys: gPayload.semanticKeys,
    };

    const zeroExpr: StructuralIndexedZero = {
      kind: 'INDEXED_ZERO',
      payload: fPayload,
      index: zeroIndex,
      identity: {
        structuralHash: '0_F',
        canonical: '0_{F}',
        typeTag: 'scalar',
        source: { sourceHash: src, sourceCanonical: '0_{F}', sourceSpan: { start: 0, endExclusive: 4 }, origin: 'DERIVED_RICIS_RULE' },
      },
      semanticKeys: fPayload.semanticKeys,
    };
    const infExpr: StructuralIndexedInfinity = {
      kind: 'INDEXED_INFINITY',
      payload: gPayload,
      index: infIndex,
      identity: {
        structuralHash: 'inf_G',
        canonical: 'inf_{G}',
        typeTag: 'scalar',
        source: { sourceHash: src, sourceCanonical: 'inf_{G}', sourceSpan: { start: 0, endExclusive: 6 }, origin: 'DERIVED_RICIS_RULE' },
      },
      semanticKeys: gPayload.semanticKeys,
    };

    const expr: StructuralExpression = {
      kind: 'BINARY',
      operator: 'MULTIPLY',
      left: zeroExpr,
      right: infExpr,
      identity: {
        structuralHash: 'mult',
        canonical: '0_{F} * inf_{G}',
        typeTag: 'scalar',
        source: { sourceHash: src, sourceCanonical: '0_{F} * inf_{G}', sourceSpan: { start: 0, endExclusive: 15 }, origin: 'DERIVED_RICIS_RULE' },
      },
      semanticKeys: [...fPayload.semanticKeys, ...gPayload.semanticKeys],
    };

    const result = rule.evaluate(expr, indexValidator, typeValidator);
    expect(result.status).toBe('APPLIED');
    if (result.status === 'APPLIED') {
      expect(result.rule).toBe('A6_HOMOGENEOUS_SCALAR_PRODUCT');
      expect(result.preconditions.length).toBeGreaterThan(0);
    }
  });
});

