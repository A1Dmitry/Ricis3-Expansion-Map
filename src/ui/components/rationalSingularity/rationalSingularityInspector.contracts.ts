// ============================================================================
// RICIS-III RATIONAL SINGULARITY INSPECTOR UI CONTRACTS
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import type {
  IRationalSingularityAnalysisResult,
  IRationalFunctionInput,
} from '../../../services/rationalSingularity/rationalSingularityEngine.contracts';

export interface IRationalSingularityInspectorProps {
  readonly exampleId: string;
  readonly title: string;
  readonly rationalInput: IRationalFunctionInput;
  readonly description?: string;
}

export interface IRationalSingularityViewModel {
  readonly analysis: IRationalSingularityAnalysisResult;
  readonly hasSingularities: boolean;
  readonly isA1Applicable: boolean;
}
