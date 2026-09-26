export type ExampleCategory =
  | 'singularity_zero_zero'
  | 'singularity_inf_inf'
  | 'differentiation'
  | 'integration'
  | 'physics_quantum'
  | 'trigonometry_transcendental'
  | 'financial_helpers';

export type ClassicalFailureMode =
  | 'NAN'
  | 'DIVIDE_BY_ZERO'
  | 'INDETERMINATE_FORM'
  | 'CAUCHY_LIMIT_REQUIRED'
  | 'NUMERICAL_INSTABILITY'
  | 'SMOOTH_INVARIANT';

export interface IRicisCatalogExample {
  readonly id: string;
  readonly title: string;
  readonly input: string;
  readonly category: ExampleCategory;
  readonly singularityPoint?: number;
  readonly defaultParamValue?: number;
  readonly expectedNumeric?: number;
  readonly description?: string;
  readonly leanTheoremRef?: string;
  /**
   * The explicit RICIS-III axioms governing the exact resolution (Level 3 Priority).
   * E.g. ['SP2', 'SP4', 'A4'], ['A1', 'A10'], ['A6'], ['L1'], ['Δ_plane'].
   */
  readonly ricisAxioms?: ReadonlyArray<string>;
  /**
   * Exact structural/algebraic method of resolution in O(1) complexity.
   */
  readonly ricisResolutionMethod?: string;
  /**
   * Demonstration of classical failure: why classical analysis fails at this exact coordinate
   * (e.g. produces NaN, 0/0, division by zero, or requires Cauchy limits / epsilon-delta approximations).
   */
  readonly classicalFailureExplanation?: string;
  /**
   * Classified failure mode of the classical calculus baseline.
   */
  readonly classicalStatus?: ClassicalFailureMode;
}

export interface ICatalogFilterOptions {
  readonly category?: ExampleCategory | 'all';
  readonly searchQuery?: string;
}

export interface IExampleCatalogService {
  getAllExamples(): ReadonlyArray<IRicisCatalogExample>;
  getExampleById(id: string): IRicisCatalogExample | undefined;
  getFilteredExamples(options: ICatalogFilterOptions): ReadonlyArray<IRicisCatalogExample>;
  getCategories(): ReadonlyArray<{ id: ExampleCategory; label: string; count: number }>;
}
