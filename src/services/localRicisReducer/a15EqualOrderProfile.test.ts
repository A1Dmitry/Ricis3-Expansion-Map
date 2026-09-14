import { describe, expect, it } from 'vitest';
import {
  toCanonicalRationalString,
  OrderProfileCalculator,
  A15EqualOrderRule,
} from './a15EqualOrderProfile';
import { SemanticIndexValidator, TypeConsistencyValidator } from './oopImplementation';
import type { StructuralExpression, StructuralSourceReference } from './contracts';

const mockSource: StructuralSourceReference = {
  sourceHash: 'test-hash-a15',
  sourceCanonical: 't - sin(t)',
  sourceSpan: { start: 0, endExclusive: 10 },
  origin: 'DERIVED_RICIS_RULE',
};

function makeMockExpression(canonical: string): StructuralExpression {
  return {
    kind: 'FINITE_LITERAL',
    lexeme: canonical,
    identity: {
      structuralHash: `mock:${canonical}`,
      canonical,
      typeTag: 'scalar',
      source: mockSource,
    },
    semanticKeys: [
      {
        kind: 'FACTOR',
        key: `key:${canonical}`,
        sourceHash: mockSource.sourceHash,
        sourceCanonical: canonical,
      },
    ],
  };
}

describe('A15 Rational Converter & Order Profile Calculator', () => {
  it('converts floating values near fractions to exact canonical strings', () => {
    expect(toCanonicalRationalString(1 / 6)).toBe('1 / 6');
    expect(toCanonicalRationalString(1 / 2)).toBe('1 / 2');
    expect(toCanonicalRationalString(1 / 3)).toBe('1 / 3');
    expect(toCanonicalRationalString(1)).toBe('1');
    expect(toCanonicalRationalString(0)).toBe('0');
  });

  it('computes order of vanishing and derivative at a = 0 for sin(t) / t', () => {
    const exprSin = makeMockExpression('sin(t)');
    const exprT = makeMockExpression('t');

    const profileSin = OrderProfileCalculator.computeOrderAndDerivative(exprSin, 0);
    const profileT = OrderProfileCalculator.computeOrderAndDerivative(exprT, 0);

    expect(profileSin).toBeDefined();
    expect(profileT).toBeDefined();

    expect(profileSin.order).toBe(1);
    expect(profileT.order).toBe(1);

    expect(Math.abs(profileSin.derivValue! - 1.0)).toBeLessThan(1e-3);
    expect(Math.abs(profileT.derivValue! - 1.0)).toBeLessThan(1e-3);
  });

  it('computes order 3 for (t - sin(t)) and t^3', () => {
    const exprF = makeMockExpression('t - sin(t)');
    const exprG = makeMockExpression('t^3');

    const profileF = OrderProfileCalculator.computeOrderAndDerivative(exprF, 0);
    const profileG = OrderProfileCalculator.computeOrderAndDerivative(exprG, 0);

    expect(profileF).toBeDefined();
    expect(profileG).toBeDefined();

    expect(profileF.order).toBe(3);
    expect(profileG.order).toBe(3);

    const ratio = profileF.derivValue! / profileG.derivValue!;
    expect(toCanonicalRationalString(ratio)).toBe('1 / 6');
  });
});

describe('A15EqualOrderRule Execution', () => {
  it('successfully reduces (t - sin(t)) / t^3 to 1 / 6', () => {
    const num = makeMockExpression('t - sin(t)');
    const den = makeMockExpression('t^3');

    const divisionExpr: StructuralExpression = {
      kind: 'BINARY',
      operator: 'DIVIDE',
      left: num,
      right: den,
      identity: {
        structuralHash: 'mock:div-a15',
        canonical: '(t - sin(t)) / (t^3)',
        typeTag: 'scalar',
        source: mockSource,
      },
      semanticKeys: [...num.semanticKeys, ...den.semanticKeys],
    };

    const rule = new A15EqualOrderRule();
    const typeValidator = new TypeConsistencyValidator();
    const indexValidator = new SemanticIndexValidator();

    const evaluation = rule.evaluate(divisionExpr, indexValidator, typeValidator);
    expect(evaluation.status).toBe('APPLIED');

    if (evaluation.status === 'APPLIED') {
      expect(evaluation.reduced.identity.canonical).toBe('1 / 6');
    }
  });

  it('successfully reduces (1 - cos(t)) / t^2 to 1 / 2', () => {
    const num = makeMockExpression('1 - cos(t)');
    const den = makeMockExpression('t^2');

    const divisionExpr: StructuralExpression = {
      kind: 'BINARY',
      operator: 'DIVIDE',
      left: num,
      right: den,
      identity: {
        structuralHash: 'mock:div-cos-a15',
        canonical: '(1 - cos(t)) / (t^2)',
        typeTag: 'scalar',
        source: mockSource,
      },
      semanticKeys: [...num.semanticKeys, ...den.semanticKeys],
    };

    const rule = new A15EqualOrderRule();
    const typeValidator = new TypeConsistencyValidator();
    const indexValidator = new SemanticIndexValidator();

    const evaluation = rule.evaluate(divisionExpr, indexValidator, typeValidator);
    expect(evaluation.status).toBe('APPLIED');

    if (evaluation.status === 'APPLIED') {
      expect(evaluation.reduced.identity.canonical).toBe('1 / 2');
    }
  });

  it('rejects truncated series approximation for transcendental functions at non-zero evaluation point (P1 guard)', () => {
    const profile = OrderProfileCalculator.computeOrderAndDerivative('sin(t)', 5);
    // At evalPoint = 5, sin(t) has a non-zero constant argument u_0 = 5.
    // Unshifted Maclaurin expansion is rejected, returning undefined instead of a fake truncated rational approximation.
    expect(profile.isResolved).toBe(false);
    expect(profile.status).toBe('UNRESOLVED');
  });
});
