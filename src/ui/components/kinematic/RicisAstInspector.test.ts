import { describe, it, expect } from 'vitest';
import { formatAstExpr } from './RicisAstInspector';
import type { RicisAstExpr } from '../../../model/ricisSymbolicJacobian.contracts';

describe('RicisAstInspector Unit & Presentation Tests (QA Suite)', () => {
  it('correctly formats CONST, PARAM and VAR expressions into clean mathematical strings', () => {
    const cNode: RicisAstExpr = { kind: 'CONST', value: 3.14, type: 'SCALAR' };
    expect(formatAstExpr(cNode)).toBe('3.14');

    const pNode: RicisAstExpr = { kind: 'PARAM', name: 'L1', value: 0.8, type: 'LINK_LENGTH' };
    expect(formatAstExpr(pNode)).toBe('L1');

    const vNode: RicisAstExpr = { kind: 'VAR', name: 'q2', value: 0.5, type: 'JOINT_ANGLE' };
    expect(formatAstExpr(vNode)).toBe('q2');
  });

  it('formats trigonometric nodes cleanly (SIN, COS)', () => {
    const sinNode: RicisAstExpr = {
      kind: 'SIN',
      arg: { kind: 'VAR', name: 'q3', value: 0, type: 'JOINT_ANGLE' },
      type: 'TRIGONOMETRIC',
    };
    expect(formatAstExpr(sinNode)).toBe('sin(q3)');

    const cosNode: RicisAstExpr = {
      kind: 'COS',
      arg: { kind: 'VAR', name: 'q1', value: 1.2, type: 'JOINT_ANGLE' },
      type: 'TRIGONOMETRIC',
    };
    expect(formatAstExpr(cosNode)).toBe('cos(q1)');
  });

  it('formats SP4 semantic zero as 0_{F}', () => {
    const zeroNode: RicisAstExpr = {
      kind: 'SEMANTIC_ZERO',
      originExpr: {
        kind: 'SIN',
        arg: { kind: 'VAR', name: 'q3', value: 0, type: 'JOINT_ANGLE' },
        type: 'TRIGONOMETRIC',
      },
      evaluatedWeight: 0,
    };
    expect(formatAstExpr(zeroNode)).toBe('0_{sin(q3)}');
  });

  it('formats A1 semantic infinity as oo_{F}', () => {
    const infNode: RicisAstExpr = {
      kind: 'SEMANTIC_INF',
      indexExpr: {
        kind: 'PARAM',
        name: 'L2',
        value: 0.7,
        type: 'LINK_LENGTH',
      },
      evaluatedIndex: 0.7,
    };
    expect(formatAstExpr(infNode)).toBe('∞_{L2}');
  });

  it('formats A6 MONOLITH_INVARIANT node', () => {
    const monolithNode: RicisAstExpr = {
      kind: 'MONOLITH_INVARIANT',
      factorZero: {
        kind: 'SEMANTIC_ZERO',
        originExpr: { kind: 'CONST', value: 2, type: 'SCALAR' },
        evaluatedWeight: 0,
      },
      factorInf: {
        kind: 'SEMANTIC_INF',
        indexExpr: { kind: 'CONST', value: 5, type: 'SCALAR' },
        evaluatedIndex: 5,
      },
      invariantValue: 10,
    };
    expect(formatAstExpr(monolithNode)).toBe('Inv(0_{2} ⊗ ∞_{5} = 10)');
  });
});
