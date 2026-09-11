// ============================================================================
// RICIS-III TRACE-DRIVEN LEAN PROOF GENERATOR (MVVM ORCHESTRATOR)
// Connects Real ProofStep Execution Models to Lean AST Document ViewModels
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import type {
  ITraceDrivenLeanProofGenerator,
  ILeanTraceViewModelFactory,
  ILeanTraceDocumentTemplate,
  IProofTraceExecutionModel,
} from '../contracts/leanMvvm.contracts';

export class TraceDrivenLeanProofGenerator implements ITraceDrivenLeanProofGenerator {
  constructor(
    private readonly vmFactory: ILeanTraceViewModelFactory,
    private readonly template: ILeanTraceDocumentTemplate
  ) {}

  public generateProofFromTrace(model: IProofTraceExecutionModel): string {
    const viewModel = this.vmFactory.createViewModel(model);
    return this.template.render(viewModel);
  }
}
