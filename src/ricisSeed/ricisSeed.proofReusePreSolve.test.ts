import { describe, expect, it } from 'vitest';
import {
  createRicisSystem,
  createSeed,
  type RicisSystem,
} from './ricisSeed.domain';
import {
  graphGuidedPreSolve,
  PreSolveMatcher,
} from './preSolver';
import type {
  UnsolvedSingularProblem,
  RicisState,
} from './contracts';
import { DEMO_RESOLVERS } from './ricisSeed.unsolvedRegistry';

describe('RICIS SEED — Graph-Guided Pre-Solve & Proof Reuse', () => {
  it('находит и повторно использует уже доказанное правило ДО вызова тяжелого Resolve', () => {
    // В графе уже есть A4: 0_F / 0_G = F / G и тождество L1: 0_F / 0_F = 1
    const ric = createRicisSystem({ resolvers: DEMO_RESOLVERS });
    const state = ric.seed;

    // Новая задача: 0_alpha / 0_alpha (структурный изоморфизм 0_F / 0_F)
    const problemIdentity: UnsolvedSingularProblem = {
      id: 'U-TEST-ISO-IDENTITY',
      statement: '0_alpha/0_alpha',
      inputForm: '0_alpha/0_alpha',
      singularityClasses: ['ZERO_OVER_ZERO'],
      coverageClaim: ['L1'],
    };

    const preSolveResult = graphGuidedPreSolve(state, problemIdentity);
    expect(preSolveResult.found).toBe(true);
    if (!preSolveResult.found) return;

    expect(preSolveResult.reusedRuleId).toBe('L1');
    expect(preSolveResult.outputForm).toBe('1');
    expect(preSolveResult.proofStrategy).toBe('RICIS_STRUCTURAL');
    expect(preSolveResult.reusedProof).toBeDefined();
    // Guard проверен: операнды структурно идентичны (alpha == alpha)
    expect(preSolveResult.guardSatisfied).toBe(true);
  });

  it('отклоняет слепой reuse (guard check): 0_alpha / 0_beta при alpha != beta не использует тождество 0_F/0_F = 1', () => {
    const ric = createRicisSystem({ resolvers: DEMO_RESOLVERS });
    const state = ric.seed;

    const problemDistinct: UnsolvedSingularProblem = {
      id: 'U-TEST-DISTINCT-ZEROES',
      statement: '0_alpha/0_beta',
      inputForm: '0_alpha/0_beta',
      singularityClasses: ['ZERO_OVER_ZERO'],
      coverageClaim: ['A4'],
    };

    const preSolveResult = graphGuidedPreSolve(state, problemDistinct);
    expect(preSolveResult.found).toBe(true);
    if (!preSolveResult.found) return;

    // Не должно вернуть L1 (1), а должно соответствовать общему правилу A4 (F/G)
    expect(preSolveResult.reusedRuleId).toBe('A4');
    expect(preSolveResult.outputForm).toBe('alpha/beta');
  });

  it('pre-solve извлекает доказательства добавленных аксиом (R1 -> A12 reuse)', () => {
    const ric = createRicisSystem({ resolvers: DEMO_RESOLVERS });
    // Расширяем до R1 (вводится A12: (0_F/0_G)/(0_H/0_K) = (F*K)/(G*H))
    const expanded = ric.ExpandTo((x: RicisState) => x.Resolve({
      id: 'U-NESTED-SINGULAR-DIV',
      statement: '(0_F/0_G)/(0_H/0_K)',
      inputForm: '(0_F/0_G)/(0_H/0_K)',
      singularityClasses: ['NESTED_SINGULAR_DIV', 'ZERO_OVER_ZERO'],
      coverageClaim: ['SP2', 'SP3', 'A4'],
    }));
    expect(expanded.kind).toBe('EXPANDED');
    if (expanded.kind !== 'EXPANDED') return;

    // Новая изоморфная задача с другими символами: (0_A/0_B)/(0_C/0_D)
    const isomorphicNested: UnsolvedSingularProblem = {
      id: 'U-TEST-ISO-NESTED',
      statement: '(0_A/0_B)/(0_C/0_D)',
      inputForm: '(0_A/0_B)/(0_C/0_D)',
      singularityClasses: ['NESTED_SINGULAR_DIV'],
      coverageClaim: ['A12'],
    };

    const preSolveResult = graphGuidedPreSolve(expanded.seed, isomorphicNested);
    expect(preSolveResult.found).toBe(true);
    if (!preSolveResult.found) return;

    expect(preSolveResult.reusedRuleId).toBe('A12');
    expect(preSolveResult.outputForm).toBe('(A*D)/(B*C)');
    expect(preSolveResult.reusedProof?.conclusion).toBe('(F*K)/(G*H)');
  });

  it('одна и та же запись узнаётся независимо от перестановки множителей и пробелов (нормализация)', () => {
    const ric = createRicisSystem({ resolvers: DEMO_RESOLVERS });
    const state = ric.seed;

    // Та же форма, что следствие A6 «0_F*inf_G», но записанная с перестановкой
    // множителей, пробелами и невидимым символом: глазами — одно и то же.
    const commuted: UnsolvedSingularProblem = {
      id: 'U-TEST-COMMUTED-A6',
      statement: 'inf_G * 0_F',
      inputForm: 'inf_G * 0_F',
      singularityClasses: ['ZERO_TIMES_INF'],
      coverageClaim: ['A6'],
    };

    const result = graphGuidedPreSolve(state, commuted);
    expect(result.found).toBe(true);
    if (!result.found) return;
    expect(result.reusedRuleId).toBe('A6');

    // И с «грязной» записью: NBSP, перенос строки, zero-width
    const dirty: UnsolvedSingularProblem = {
      ...commuted,
      id: 'U-TEST-DIRTY-A6',
      inputForm: 'inf_G\u00a0*\u200b\n0_F',
    };
    const dirtyResult = graphGuidedPreSolve(state, dirty);
    expect(dirtyResult.found).toBe(true);
    if (!dirtyResult.found) return;
    expect(dirtyResult.reusedRuleId).toBe('A6');
  });
});
