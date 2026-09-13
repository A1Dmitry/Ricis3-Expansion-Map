import { describe, expect, it } from 'vitest';
import {
  createRicisSystem,
  type RicisSystem,
} from './ricisSeed.domain';
import type {
  ProofCertificate,
  ResolutionResult,
  RicisState,
  UnsolvedSingularProblem,
} from './contracts';
import { DEMO_RESOLVERS } from './ricisSeed.unsolvedRegistry';

describe('RICIS SEED — Compositional Proof Graph & Dependency Verification', () => {
  it('формирует композиционные зависимости доказательств (P_new ссылается на принятые P_prior)', () => {
    const ric = createRicisSystem({ resolvers: DEMO_RESOLVERS });

    // Проверяем, что в решённой A12 присутствуют зависимости от шагов A4 и CLASSICAL
    const expanded = ric.ExpandTo((x: RicisState) => x.Resolve({
      id: 'U-NESTED-SINGULAR-DIV',
      statement: '(0_F/0_G)/(0_H/0_K)',
      inputForm: '(0_F/0_G)/(0_H/0_K)',
      singularityClasses: ['NESTED_SINGULAR_DIV', 'ZERO_OVER_ZERO'],
      coverageClaim: ['SP2', 'SP3', 'A4'],
    }));

    expect(expanded.kind).toBe('EXPANDED');
    if (expanded.kind !== 'EXPANDED') return;

    const proof = expanded.axiom.proof;
    expect(proof).toBeDefined();
    expect(proof?.steps.length).toBe(3);

    // Правила шагов обязаны быть известны в R(n)
    const usedRules = proof!.steps.map(s => s.rule);
    expect(usedRules).toContain('A4');
    expect(usedRules).toContain('CLASSICAL');

    // Проверяем связность цепочки: to(i-1) === from(i)
    for (let i = 1; i < proof!.steps.length; i++) {
      expect(proof!.steps[i - 1]?.to).toBe(proof!.steps[i]?.from);
    }
  });

  it('отказывает в ExpandTo, если зависимость ссылается на ещё не принятое правило', () => {
    const ric = createRicisSystem({ resolvers: DEMO_RESOLVERS });

    // Пытаемся передать резолюцию с вымышленным/непринятым правилом
    const forgedResult: ResolutionResult = {
      kind: 'RESOLVED',
      resolution: {
        problem: {
          id: 'U-FORGED',
          statement: '0_X',
          inputForm: '0_X',
          singularityClasses: ['ZERO_OVER_ZERO'],
          coverageClaim: [],
        },
        candidate: {
          id: 'A99' as any,
          layer: 'AXIOM',
          statement: '0_X = 42',
          covers: ['ZERO_OVER_ZERO'],
          consequences: [{ inputForm: '0_X', outputForm: '42' }],
        },
        proof: {
          strategy: 'RICIS_STRUCTURAL',
          steps: [{ rule: 'NON_EXISTENT_RULE' as any, from: '0_X', to: '42' }],
          conclusion: '42',
          usesLimits: false,
          usesNumericApproximation: false,
        },
      },
    };

    const attempt = ric.ExpandTo(() => forgedResult);
    expect(attempt.kind).toBe('REJECTED');
    if (attempt.kind !== 'REJECTED') return;
    expect(attempt.reason).toBe('PROOF_RULE_UNKNOWN');
    expect(attempt.seed.generation).toBe(0);
  });
});
