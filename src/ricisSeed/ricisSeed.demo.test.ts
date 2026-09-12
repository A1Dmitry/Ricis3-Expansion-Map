import { describe, expect, it } from 'vitest';
import { createRicisSystem } from './ricisSeed.domain';
import { DEMO_PROBLEM_CATALOG, DEMO_RESOLVERS, HONEST_RESOLVERS, UNSOLVED_PROBLEM_REGISTRY } from './ricisSeed.unsolvedRegistry';
import type { RicisState } from './contracts';

const Ric = createRicisSystem({ resolvers: DEMO_RESOLVERS });

describe('RICIS SEED — реестр демонстрационных проблем', () => {
  it('покрывает каждую проблему реестра описанием для UI', () => {
    const catalogIds = DEMO_PROBLEM_CATALOG.map(entry => entry.problem.id).sort();
    const registryIds = [...UNSOLVED_PROBLEM_REGISTRY.map(entry => entry.id)].sort();
    expect(catalogIds).toEqual(registryIds);
  });

  it('реально ведёт себя так, как обещает подпись в каталоге (защита от расхождения UI и логики)', () => {
    for (const entry of DEMO_PROBLEM_CATALOG) {
      const result = Ric.ExpandTo((x: RicisState) => x.Resolve(entry.problem));
      const actual = result.kind === 'EXPANDED' ? 'EXPANDS' : 'REJECTED';
      expect(actual, `${entry.problem.id}: ${entry.expectationText}`).toBe(entry.expectation);
    }
  });

  it('честный набор решателей не содержит намеренно ошибочных сценариев', () => {
    const honest = createRicisSystem({ resolvers: HONEST_RESOLVERS });
    for (const entry of DEMO_PROBLEM_CATALOG.filter(item => item.trust === 'STRUCTURAL_PROOF')) {
      const result = honest.ExpandTo((x: RicisState) => x.Resolve(entry.problem));
      expect(result.kind, entry.problem.id).toBe('EXPANDED');
    }
  });

  it('содержит хотя бы один открытый класс без доказательства и четыре сценария отказа', () => {
    expect(DEMO_PROBLEM_CATALOG.filter(entry => entry.trust === 'OPEN_NO_PROOF')).toHaveLength(1);
    expect(DEMO_PROBLEM_CATALOG.filter(entry => entry.trust === 'REJECTION_DEMO').length).toBeGreaterThanOrEqual(4);
    expect(DEMO_PROBLEM_CATALOG.filter(entry => entry.trust === 'STRUCTURAL_PROOF').length).toBeGreaterThanOrEqual(3);
  });
});
