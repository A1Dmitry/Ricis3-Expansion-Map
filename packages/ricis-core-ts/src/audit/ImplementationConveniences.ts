import { listAxiomsMeta, listConveniencesMeta, ResolutionRuleMeta } from '../operations/ResolutionCatalog';

/**
 * R-09 / closing principle — разделение axiomatic RICIS laws и
 * implementation conveniences / classical algebra rules.
 *
 * Заявление «100% consistent with Main» слишком сильное, пока в реализации
 * есть conveniences, отсутствующие в перечне Main. Этот модуль даёт честный
 * список conveniences для аудит-метаданных. Данные берутся из декларативного
 * `ResolutionCatalog` (без дублирования логики редукции).
 */
export function listConveniences(): readonly ResolutionRuleMeta[] {
  return listConveniencesMeta();
}

export function listAxioms(): readonly ResolutionRuleMeta[] {
  return listAxiomsMeta();
}

/**
 * Возвращает честную сводку для метаданных: какие правила — аксиомы,
 * какие — conveniences, и НЕ заявляет «0 assumptions» / «100% consistency»,
 * пока conveniences присутствуют.
 */
export function metadataHonesty(): {
  axioms: readonly ResolutionRuleMeta[];
  conveniences: readonly ResolutionRuleMeta[];
  claimsFullConsistencyWithMain: boolean;
} {
  return {
    axioms: listAxiomsMeta(),
    conveniences: listConveniencesMeta(),
    // «100% consistent with Main» оправдано ТОЛЬКО если conveniences пусты.
    claimsFullConsistencyWithMain: listConveniencesMeta().length === 0,
  };
}
