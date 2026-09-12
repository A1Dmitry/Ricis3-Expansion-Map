/**
 * RICIS SEED — публичная точка входа протокола саморасширения (A11).
 *
 * Каноническая запись:
 *
 *     Ric.ExpandTo((x) => x.Resolve(UnsolvedSingularProblem))
 *
 *   x        — текущее состояние самой системы RICIS (аксиомы, покрытие, история);
 *   Resolve  — разрешить И доказать;
 *   ExpandTo — допустить доказанное правило в аксиоматику: R(n+1) = R(n) ∪ {A_new}.
 */

import { createRicisSystem } from './ricisSeed.domain';
import { DEMO_RESOLVERS, HONEST_RESOLVERS } from './ricisSeed.unsolvedRegistry';

export * from './contracts';
export * from './fingerprint';
export {
  axiomFromDefinition,
  computeSeedFingerprint,
  coveredClassesOf,
  coveredFormsOf,
  createRicisState,
  createRicisSystem,
  createSeed,
  createSeedAxioms,
  expandTo,
  findAxiom,
  grow,
  verifySeedInvariants,
  type RicisSystem,
  type RicisSystemOptions,
  type SeedInvariantReport,
} from './ricisSeed.domain';
export {
  DEMO_PROBLEM_CATALOG,
  DEMO_RESOLVERS,
  HONEST_RESOLVERS,
  UNSOLVED_PROBLEM_REGISTRY,
  findDemoProblem,
  type DemoProblemView,
  type DemoTrust,
} from './ricisSeed.unsolvedRegistry';
export { SEED_AXIOM_TABLE, type SeedAxiomDefinition } from './seedTable';

/** Готовый экземпляр с демонстрационными решателями (включая Challenger-сценарии отказов). */
export const Ric = createRicisSystem({ resolvers: DEMO_RESOLVERS });

/** Экземпляр только с честными решателями (без намеренно ошибочных сценариев). */
export const RicisSeedSystem = createRicisSystem({ resolvers: HONEST_RESOLVERS });
