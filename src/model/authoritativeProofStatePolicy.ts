import type { CoreExecutionFailure } from '../services/ricisCore/IRicisCoreEngine';
import type { ProofRunResponse, ProofStructuralVerification, ProofTrustStatus } from '../services/ricisCore/IRicisProofGateway';
import type { NodeState } from './types';

/** Immutable input required for a proof-state decision. Legacy proof booleans are deliberately absent. */
export interface AuthoritativeProofStateInput {
  readonly currentState: NodeState;
  readonly structuralVerification: ProofStructuralVerification;
  readonly trustStatus: ProofTrustStatus;
}

/** Result of a two-axis Core proof-state decision. */
export interface AuthoritativeProofStateDecision {
  readonly state: NodeState;
  readonly decisionResourceKey: string;
  readonly preserved: boolean;
}

/**
 * Maps only authoritative Core response axes to a map state. `goalMatched`,
 * QED labels, document validity, fallback output and UI-local data cannot enter
 * this API and therefore cannot resolve a node.
 */
export class AuthoritativeProofStatePolicy {
  public apply(input: AuthoritativeProofStateInput): AuthoritativeProofStateDecision {
    if (input.trustStatus === 'LeanVerified') {
      return { state: 'resolved', decisionResourceKey: 'proof.core.state.leanVerified', preserved: false };
    }

    if (input.trustStatus === 'Rejected') {
      return { state: 'unresolved', decisionResourceKey: 'proof.core.state.rejected', preserved: false };
    }

    return {
      state: 'partial',
      decisionResourceKey: input.trustStatus === 'TrustedAxiom'
        ? 'proof.core.state.trustedAxiom'
        : input.structuralVerification === 'StructurallyVerified'
          ? 'proof.core.state.structuralOnly'
          : 'proof.core.state.requiresEvidence',
      preserved: false,
    };
  }

  /** Preserves current state when the Core transport failed before an authoritative snapshot existed. */
  public preserveOnFailure(currentState: NodeState, _failure: CoreExecutionFailure): AuthoritativeProofStateDecision {
    return { state: currentState, decisionResourceKey: 'proof.core.state.transportFailure', preserved: true };
  }

  /** Projects a validated Core response into this policy without accepting any browser-owned proof shape. */
  public applyRun(currentState: NodeState, run: ProofRunResponse): AuthoritativeProofStateDecision {
    return this.apply({
      currentState,
      structuralVerification: run.structuralVerification,
      trustStatus: run.trustStatus,
    });
  }
}
