export type ExampleCategory =
  | 'singularity_zero_zero'
  | 'singularity_inf_inf'
  | 'differentiation'
  | 'integration'
  | 'physics_quantum'
  | 'trigonometry_transcendental'
  | 'financial_helpers';

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
