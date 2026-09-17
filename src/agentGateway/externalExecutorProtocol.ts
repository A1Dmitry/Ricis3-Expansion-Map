/**
 * Boundary contract for an unknown external executor.
 *
 * This is interaction metadata only: it does not add an axiom or interpret
 * RICIS. The existing response validator remains the solution gate; this
 * module makes its recovery advice explicit and dependency-scoped.
 */

export const RICIS_NORMATIVE_DOCUMENT =
  'docs/01-architecture/ricis-unified-complete-document-7.9-vector.json' as const;

export const IMMUTABILITY_DOCUMENT = 'docs/00-governance/RICIS_IMMUTABILITY_MANIFEST.md' as const;

export type ExternalExecutorStage = 'ENTRY' | 'SOLUTION_GATE';
export type RecoveryAction = 'NONE' | 'TARGETED_READ_AND_RETRY' | 'REJECT';

export interface ExternalExecutorSubmission {
  readonly ricisContextIdentified: boolean;
  readonly normativeDocuments: readonly string[];
  readonly appliedRules: readonly string[];
  readonly resultValid: boolean;
  /** Names of protected items the executor attempted to redefine. */
  readonly protectedRedefinitions?: readonly string[];
  /** Rules the executor claims to need but cannot identify. */
  readonly unknownRules?: readonly string[];
}

export interface ExternalExecutorGateDecision {
  readonly accepted: boolean;
  readonly stage: ExternalExecutorStage;
  readonly violation?: string;
  readonly requiredRules: readonly string[];
  readonly requiredDocuments: readonly string[];
  readonly recoveryAction: RecoveryAction;
}

const PROTECTED_RULES = new Set([
  'L0', 'L1', 'SP1', 'SP2', 'SP3', 'SP4', 'SP5', 'P1',
  'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A15', 'A11',
  'Immutable Manifest', 'protected core', 'Seed',
]);

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)]);
}

function sourceFor(rule: string): string {
  return PROTECTED_RULES.has(rule) || rule === 'RICIS-III'
    ? RICIS_NORMATIVE_DOCUMENT
    : IMMUTABILITY_DOCUMENT;
}

function rejection(
  violation: string,
  requiredRules: readonly string[],
  recoveryAction: RecoveryAction = 'TARGETED_READ_AND_RETRY',
): ExternalExecutorGateDecision {
  const rules = unique(requiredRules);
  return Object.freeze({
    accepted: false,
    stage: 'SOLUTION_GATE',
    violation,
    requiredRules: rules,
    requiredDocuments: Object.freeze([...new Set(rules.map(sourceFor))]),
    recoveryAction,
  });
}

/** Minimal entry handshake. It never asks an executor to read the repository. */
export function assessExternalExecutorEntry(
  input: Pick<ExternalExecutorSubmission, 'ricisContextIdentified' | 'normativeDocuments' | 'unknownRules'>,
): ExternalExecutorGateDecision {
  if (!input.ricisContextIdentified) return rejection('RICIS_CONTEXT_NOT_IDENTIFIED', ['RICIS-III']);
  if (input.unknownRules && input.unknownRules.length > 0) {
    return rejection('UNKNOWN_RULE_REQUIRES_NORMATIVE_READ', input.unknownRules);
  }
  return Object.freeze({
    accepted: true,
    stage: 'ENTRY',
    requiredRules: Object.freeze([]),
    requiredDocuments: Object.freeze([...input.normativeDocuments]),
    recoveryAction: 'NONE',
  });
}

/**
 * Solution gate for an external executor. It trusts neither strategy nor the
 * executor's assertion of compliance; only the declared boundary facts are
 * used. Missing rules produce targeted recovery, not a full-project reload.
 */
export function gateExternalExecutorSubmission(
  input: ExternalExecutorSubmission,
  requiredRules: readonly string[],
): ExternalExecutorGateDecision {
  const immutableAttempt = (input.protectedRedefinitions ?? []).find((rule) => PROTECTED_RULES.has(rule));
  if (immutableAttempt) return rejection('PROTECTED_RULE_REDEFINITION', [immutableAttempt], 'REJECT');

  const unknown = input.unknownRules?.[0];
  if (unknown) return rejection('UNKNOWN_RULE_REQUIRES_NORMATIVE_READ', [unknown]);
  if (!input.ricisContextIdentified) return rejection('RICIS_CONTEXT_NOT_IDENTIFIED', ['RICIS-III']);

  const missing = requiredRules.filter((rule) => !input.appliedRules.includes(rule));
  if (missing.length > 0) return rejection('REQUIRED_RULE_NOT_APPLIED', missing);
  if (!input.resultValid) return rejection('RICIS_RESULT_INVALID', requiredRules);

  return Object.freeze({
    accepted: true,
    stage: 'SOLUTION_GATE',
    requiredRules: Object.freeze([]),
    requiredDocuments: Object.freeze([]),
    recoveryAction: 'NONE',
  });
}

