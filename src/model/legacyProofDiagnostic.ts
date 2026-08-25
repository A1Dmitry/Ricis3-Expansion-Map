import type { Axiom, ProblemNode, Proof } from './types';

export type LegacyProofDiagnosticClassification = 'LOCAL_DIAGNOSTIC_ONLY';

export interface LegacyProofDocumentDelegate {
  (node: ProblemNode, axioms: Axiom[]): Promise<Proof>;
}

export interface LegacyProofDiagnosticAuthority {
  readonly coreExecuted: false;
  readonly leanKernelVerified: false;
  readonly sourceEvidenceWritten: false;
  readonly trustDecisionWritten: false;
  readonly workflowStateWritten: false;
}

export interface LegacyProofDiagnostic {
  readonly classification: LegacyProofDiagnosticClassification;
  readonly document: Proof;
  readonly authority: LegacyProofDiagnosticAuthority;
}

export interface LegacyProofDiagnosticInput {
  readonly node: ProblemNode;
  readonly axioms: Axiom[];
  readonly documentDelegate: LegacyProofDocumentDelegate;
}

const AUTHORITY: LegacyProofDiagnosticAuthority = Object.freeze({
  coreExecuted: false,
  leanKernelVerified: false,
  sourceEvidenceWritten: false,
  trustDecisionWritten: false,
  workflowStateWritten: false,
});

function hasUnexpectedInput(input: object): boolean {
  return Object.prototype.hasOwnProperty.call(input, 'override');
}

export async function createLegacyProofDiagnostic(input: LegacyProofDiagnosticInput): Promise<LegacyProofDiagnostic> {
  if (hasUnexpectedInput(input)) {
    throw new Error('LOCAL_DIAGNOSTIC_INPUT_REJECTED');
  }
  if (typeof input.documentDelegate !== 'function') {
    throw new TypeError('LOCAL_DIAGNOSTIC_DELEGATE_REQUIRED');
  }

  const document = await input.documentDelegate(input.node, input.axioms);
  return Object.freeze({
    classification: 'LOCAL_DIAGNOSTIC_ONLY',
    document,
    authority: AUTHORITY,
  });
}
