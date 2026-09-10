// ============================================================================
// RICIS-III MONOLITH: LLM GRADIENT SINGULARITY COMPONENT
// Registry ID: calculator-llm_gradient | DOI: 10.5281/zenodo.21491712
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import React from 'react';
import { LLMGradientSingularityCard } from '../ui/components/llmGradient/LLMGradientSingularityCard';

export const LLMGradientSingularity: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto py-4">
      <LLMGradientSingularityCard />
    </div>
  );
};

export default LLMGradientSingularity;
