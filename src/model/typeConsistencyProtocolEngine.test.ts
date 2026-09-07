// ============================================================================
// QA AUTOMATION SUITE: RICIS-III TYPE CONSISTENCY PROTOCOL (TCP) & MONOLITHS
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { TypeConsistencyProtocolEngine } from './typeConsistencyProtocolEngine';
import type { IRicisTypeSignature } from './typeConsistencyProtocol.contracts';

describe('RICIS-III Type Consistency Protocol (TCP) & Monolith Hierarchy Tests', () => {
  let tcpEngine: TypeConsistencyProtocolEngine;

  const scalarType: IRicisTypeSignature = { kind: 'SCALAR_NUMERIC' };
  const polyType: IRicisTypeSignature = { kind: 'POLYNOMIAL_SYMBOL' };
  const timeType: IRicisTypeSignature = { kind: 'PHYSICAL_TIME', unit: 's' };
  const spaceType: IRicisTypeSignature = { kind: 'PHYSICAL_SPACE', unit: 'm' };

  beforeEach(() => {
    tcpEngine = new TypeConsistencyProtocolEngine();
  });

  it('QA-TCP-01: Homogeneous [T(F) == T(G)]: Прямая алгебраическая операция inf_5 + inf_3 = inf_8', () => {
    const relation = tcpEngine.checkCompatibility(scalarType, scalarType);
    expect(relation).toBe('HOMOGENEOUS');

    const result = tcpEngine.executeSingularAddition(
      { index: '5', type: scalarType, isInfinity: true },
      { index: '3', type: scalarType, isInfinity: true }
    );

    expect(result.relation).toBe('HOMOGENEOUS');
    expect(result.resolvedInvariant).toBe('∞_8');
    expect(result.isMonolithFormed).toBe(false);
  });

  it('QA-TCP-02: Compatible [T(F) ⊂ T(G)]: Повышение типа inf_5 + inf_2x = inf_(5+2x)', () => {
    const relation = tcpEngine.checkCompatibility(scalarType, polyType);
    expect(relation).toBe('COMPATIBLE');

    const result = tcpEngine.executeSingularAddition(
      { index: '5', type: scalarType, isInfinity: true },
      { index: '2x', type: polyType, isInfinity: true }
    );

    expect(result.relation).toBe('COMPATIBLE');
    expect(result.resultingType.kind).toBe('POLYNOMIAL_SYMBOL');
    expect(result.resolvedInvariant).toBe('∞_(5+2x)');
  });

  it('QA-TCP-03: Incompatible Types: Формирование многомерного составного монолита inf_Time + inf_Space', () => {
    const relation = tcpEngine.checkCompatibility(timeType, spaceType);
    expect(relation).toBe('INCOMPATIBLE');

    const result = tcpEngine.executeSingularAddition(
      { index: 'Time', type: timeType, isInfinity: true },
      { index: 'Space', type: spaceType, isInfinity: true }
    );

    expect(result.relation).toBe('INCOMPATIBLE');
    expect(result.isMonolithFormed).toBe(true);
    expect(result.monolith?.order).toBe(1); // Order 1 Monolith
    expect(result.monolith?.isComposite).toBe(true);
    expect(result.resolvedInvariant).toBe('∞_(Time, Space)');
  });

  it('QA-TCP-04: Fractal Law: R(Q) = {Q, T(Q), inf_Q, 0_Q, R(inf_Q), R(0_Q)} с защитой от переполнения', () => {
    const unfolding = tcpEngine.unfoldFractalLaw('SingularityPoint', spaceType, 2);

    expect(unfolding.identity).toBe('SingularityPoint');
    expect(unfolding.zeroMonad).toBe('0_SingularityPoint');
    expect(unfolding.infiniteMonad).toBe('∞_SingularityPoint');
    expect(unfolding.recursiveDepth).toBe(0);

    // 1-й уровень вложенности
    expect(unfolding.subUnfoldingZero).toBeDefined();
    expect(unfolding.subUnfoldingZero?.identity).toBe('0_SingularityPoint');
    expect(unfolding.subUnfoldingZero?.recursiveDepth).toBe(1);

    // 2-й уровень вложенности
    expect(unfolding.subUnfoldingZero?.subUnfoldingZero?.recursiveDepth).toBe(2);
    // На глубине 2 рекурсия корректно останавливается
    expect(unfolding.subUnfoldingZero?.subUnfoldingZero?.subUnfoldingZero).toBeUndefined();
  });

  it('QA-TCP-05: L0 и L1 инвариант: ни один монолит не имеет пустой идентичности', () => {
    const monolith = tcpEngine.createAtomicMonolith('F_Origin', scalarType);
    expect(monolith.order).toBe(0);
    expect(monolith.invariant).toBe('F_Origin');
    expect(monolith.typeSignature.kind).toBe('SCALAR_NUMERIC');
  });
});
