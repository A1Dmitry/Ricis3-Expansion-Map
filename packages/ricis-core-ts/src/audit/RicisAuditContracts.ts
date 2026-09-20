import type { Expression } from '../ast/ExpressionTypes';
import type { RicisReductionResult, TransformationLogEntry } from '../engine/RicisEngineContracts';

/** The twelve auditable RICIS requirements delivered by this bounded context. */
export const RICIS_AUDIT_RULE_IDS = [
  'R-01',
  'R-02',
  'R-03',
  'R-04',
  'R-05',
  'R-06',
  'R-07',
  'R-08',
  'R-09',
  'R-10',
  'R-11',
  'R-12',
] as const;

export type RicisAuditRuleId = (typeof RICIS_AUDIT_RULE_IDS)[number];
export type RicisAuditRuleStatus = 'PASS' | 'FAIL' | 'SKIPPED';
export type RicisAuditSeverity = 'ERROR' | 'WARNING' | 'INFO';
export type RicisAuditTrustBoundary = 'STRUCTURAL_ONLY';

export interface RicisAuditRuleDefinition {
  readonly id: RicisAuditRuleId;
  readonly title: string;
  readonly requirement: string;
  readonly severity: RicisAuditSeverity;
}

export interface RicisAuditRuleResult {
  readonly id: RicisAuditRuleId;
  readonly status: RicisAuditRuleStatus;
  readonly evidence: readonly string[];
  readonly detail: string;
}

export interface RicisAuditRequest {
  /** A caller-owned correlation key. It is never interpreted as executable code. */
  readonly auditId: string;
  /** A bounded lambda understood by the existing RICIS parser, for example `x => sin(x) / x`. */
  readonly expression: string;
  /** Optional SP4 indexing point. Omission means that the expression is audited symbolically. */
  readonly parameterValue?: number;
  readonly maxInputCharacters?: number;
}

export interface RicisAuditDiagnostic {
  readonly code:
    | 'AUDIT_INPUT_EMPTY'
    | 'AUDIT_INPUT_LIMIT_EXCEEDED'
    | 'AUDIT_INPUT_INVALID_POINT'
    | 'AUDIT_PARSE_REJECTED'
    | 'AUDIT_CORE_REJECTED';
  readonly messageResourceKey: string;
  readonly safeParameters: Readonly<Record<string, string>>;
}

export interface RicisAuditEvidence {
  readonly sourceHash: string;
  readonly canonicalSource: string;
  readonly parameterValue?: number;
  readonly normalizedExpression: Expression;
  readonly indexedExpression: Expression;
  readonly reduction: RicisReductionResult;
  readonly coreTrace: readonly TransformationLogEntry[];
  readonly coreInvocationCount: number;
  readonly fallbackInvocationCount: 0;
  readonly semanticIndexApplied: boolean;
  readonly containsNaN: boolean;
  readonly containsJavaScriptInfinity: boolean;
  readonly traceFingerprint: string;
}

export interface RicisAuditReport {
  readonly kind: 'RICIS_AUDIT_REPORT';
  readonly auditId: string;
  readonly createdAt: number;
  readonly trustBoundary: RicisAuditTrustBoundary;
  readonly leanVerified: false;
  readonly isValid: boolean;
  readonly rules: readonly RicisAuditRuleResult[];
  readonly evidence: RicisAuditEvidence;
  readonly fingerprint: string;
}

export type RicisAuditOutcome =
  | { readonly kind: 'REPORT'; readonly report: RicisAuditReport }
  | { readonly kind: 'REJECTED'; readonly diagnostic: RicisAuditDiagnostic };

export function isRicisAuditReport(value: unknown): value is RicisAuditReport {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<RicisAuditReport>;
  return candidate.kind === 'RICIS_AUDIT_REPORT' &&
    typeof candidate.auditId === 'string' &&
    candidate.trustBoundary === 'STRUCTURAL_ONLY' &&
    candidate.leanVerified === false &&
    Array.isArray(candidate.rules) &&
    candidate.rules.length === RICIS_AUDIT_RULE_IDS.length;
}
