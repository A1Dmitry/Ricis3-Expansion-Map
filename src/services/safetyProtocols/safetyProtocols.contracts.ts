// ============================================================================
// RICIS-III v7.7 SAFETY PROTOCOLS (SP1 - SP4) CONTRACTS
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

export interface IProtocolStatus {
  readonly protocol: 'SP1' | 'SP2' | 'SP3' | 'SP4';
  readonly name: string;
  readonly isCompliant: boolean;
  readonly details: string;
}

export interface IRationalZeroFactorExpression {
  readonly numeratorFactors: readonly string[];   // e.g. ['x - 5', 'x + 5']
  readonly denominatorFactors: readonly string[]; // e.g. ['x - 5']
  readonly pointVariable: string;                 // 'x'
  readonly pointValue: number;                    // 5
}

export interface ISafetyProtocolsVerificationResult {
  readonly originalExpression: string;
  readonly evaluatedPoint: string;
  readonly sp1LocalityReport: IProtocolStatus;
  readonly sp2ReductionPriorityReport: IProtocolStatus;
  readonly sp3IndexLawReport: IProtocolStatus;
  readonly sp4SemanticPriorityReport: IProtocolStatus;
  readonly allProtocolsPassed: boolean;
  readonly activeTailExpression: string;
  readonly resolvedInvariant: string;
  readonly paradoxPrevented: boolean; // e.g. prevented "1 = 10" false proof
}

export interface ISafetyProtocolsVerifier {
  verifyRationalSingularity(
    expr: IRationalZeroFactorExpression
  ): ISafetyProtocolsVerificationResult;

  verifySemanticIndexing(
    expressionText: string,
    evaluatedValue: number
  ): IProtocolStatus;
}
