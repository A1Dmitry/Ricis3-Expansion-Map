import { describe, expect, it } from 'vitest';
import {
  createRational,
  formatRational,
  divRational,
  parseCanonicalStringToAst,
  SymbolicSeriesEngine,
  OrderProfileCalculator,
  A15EqualOrderRule,
} from './a15EqualOrderProfile';
import { SemanticIndexValidator, TypeConsistencyValidator } from './oopImplementation';
import {
  SingularityOperandExtractor,
  SingularityPairValidator,
  StructuralExpressionFactory,
} from './oopDomainServices';
import type { FiniteStructuralKey, StructuralExpression, StructuralIndex } from './contracts';

describe('A15 Structural Series & Profile Calculator', () => {
  it('creates and formats exact rational numbers with BigInt precision', () => {
    const r1 = createRational(1, 6);
    expect(formatRational(r1)).toBe('1 / 6');

    const r2 = createRational(1, 2);
    const quotient = divRational(r2, createRational(1));
    expect(formatRational(quotient)).toBe('1 / 2');
  });

  it('parses canonical mathematical strings to symbolic AST', () => {
    const ast1 = parseCanonicalStringToAst('t - sin(t)');
    expect(ast1).toBeDefined();
    expect(ast1?.kind).toBe('SUB');

    const ast2 = parseCanonicalStringToAst('1 - cos(t)');
    expect(ast2).toBeDefined();
    expect(ast2?.kind).toBe('SUB');
  });

  it('computes exact series coefficients for t - sin(t)', () => {
    const ast = parseCanonicalStringToAst('t - sin(t)');
    expect(ast).toBeDefined();
    if (!ast) return;

    const series = SymbolicSeriesEngine.expandAst(ast, 0, 10);
    // t - (t - t^3/6 + ...) = t^3/6
    const coeff3 = series.get(3);
    expect(coeff3).toBeDefined();
    expect(coeff3?.num).toBe(BigInt(1));
    expect(coeff3?.den).toBe(BigInt(6));
  });

  it('computes exact order and leading rational coefficient via OrderProfileCalculator', () => {
    const profileNum = OrderProfileCalculator.computeOrderAndDerivative('t - sin(t)', 0);
    expect(profileNum).toBeDefined();
    expect(profileNum?.order).toBe(3);
    expect(profileNum?.coeff.num).toBe(BigInt(1));
    expect(profileNum?.coeff.den).toBe(BigInt(6));

    const profileDen = OrderProfileCalculator.computeOrderAndDerivative('t^3', 0);
    expect(profileDen).toBeDefined();
    expect(profileDen?.order).toBe(3);
    expect(profileDen?.coeff.num).toBe(BigInt(1));
    expect(profileDen?.coeff.den).toBe(BigInt(1));
  });

  it('reduces equal order zero ratio structurally in A15EqualOrderRule without floating point approximation', () => {
    const factory = new StructuralExpressionFactory();
    const extractor = new SingularityOperandExtractor();
    const pairValidator = new SingularityPairValidator();
    const indexValidator = new SemanticIndexValidator();
    const typeValidator = new TypeConsistencyValidator();

    const rule = new A15EqualOrderRule(extractor, pairValidator, factory);

    const numKey: FiniteStructuralKey = {
      key: 't-sin(t)',
      kind: 'ZERO_ORIGIN',
      sourceHash: 'test',
      sourceCanonical: 't - sin(t)',
    };

    const denKey: FiniteStructuralKey = {
      key: 't^3',
      kind: 'ZERO_ORIGIN',
      sourceHash: 'test',
      sourceCanonical: 't^3',
    };

    const numPayload: StructuralExpression = {
      kind: 'FINITE_LITERAL',
      lexeme: 't - sin(t)',
      identity: {
        structuralHash: 't-sin(t)',
        canonical: 't - sin(t)',
        typeTag: 'scalar',
        source: {
          sourceHash: 'test',
          sourceCanonical: 'test',
          sourceSpan: { start: 0, endExclusive: 10 },
          origin: 'DERIVED_RICIS_RULE',
        },
      },
      semanticKeys: [numKey],
    };

    const denPayload: StructuralExpression = {
      kind: 'FINITE_LITERAL',
      lexeme: 't^3',
      identity: {
        structuralHash: 't^3',
        canonical: 't^3',
        typeTag: 'scalar',
        source: {
          sourceHash: 'test',
          sourceCanonical: 'test',
          sourceSpan: { start: 0, endExclusive: 3 },
          origin: 'DERIVED_RICIS_RULE',
        },
      },
      semanticKeys: [denKey],
    };

    const numIndex: StructuralIndex = {
      basis: 'SP4_SOURCE_EXPRESSION',
      payloadHash: 't-sin(t)',
      payloadCanonical: 't - sin(t)',
      payloadTypeTag: 'scalar',
      sourceHash: 'test',
      semanticKeys: [numKey],
    };

    const denIndex: StructuralIndex = {
      basis: 'SP4_SOURCE_EXPRESSION',
      payloadHash: 't^3',
      payloadCanonical: 't^3',
      payloadTypeTag: 'scalar',
      sourceHash: 'test',
      semanticKeys: [denKey],
    };

    const numExpr: StructuralExpression = {
      kind: 'INDEXED_ZERO',
      payload: numPayload,
      index: numIndex,
      identity: numPayload.identity,
      semanticKeys: numPayload.semanticKeys,
    };

    const denExpr: StructuralExpression = {
      kind: 'INDEXED_ZERO',
      payload: denPayload,
      index: denIndex,
      identity: denPayload.identity,
      semanticKeys: denPayload.semanticKeys,
    };

    const divExpr: StructuralExpression = {
      kind: 'BINARY',
      operator: 'DIVIDE',
      left: numExpr,
      right: denExpr,
      identity: {
        structuralHash: 'div',
        canonical: '(t - sin(t)) / (t^3)',
        typeTag: 'scalar',
        source: {
          sourceHash: 'test',
          sourceCanonical: 'test',
          sourceSpan: { start: 0, endExclusive: 19 },
          origin: 'DERIVED_RICIS_RULE',
        },
      },
      semanticKeys: [],
    };

    const result = rule.evaluate(divExpr, indexValidator, typeValidator);
    expect(result.status).toBe('APPLIED');
    if (result.status === 'APPLIED') {
      expect(result.reduced.identity.canonical).toBe('1 / 6');
    }
  });
});
