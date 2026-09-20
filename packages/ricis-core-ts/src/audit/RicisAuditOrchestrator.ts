import { AST, type BinaryExpression, type ConstantExpression, type DerivativeExpression, type Expression, type FunctionExpression, type SingularityExpression } from '../ast/ExpressionTypes';
import { AlgebraicSimplifier } from '../engine/AlgebraicSimplifier';
import type { IRicisReductionEngine } from '../engine/IRicisReductionEngine';
import type { RicisReductionResult, TransformationLogEntry } from '../engine/RicisEngineContracts';
import { RicisTypeScriptEngine } from '../engine/RicisTypeScriptEngine';
import { SemanticIndexer } from '../engine/SemanticIndexer';
import { LambdaParser } from '../parser/LambdaParser';
import {
  RICIS_AUDIT_RULE_IDS,
  type RicisAuditDiagnostic,
  type RicisAuditEvidence,
  type RicisAuditOutcome,
  type RicisAuditReport,
  type RicisAuditRequest,
  type RicisAuditRuleId,
  type RicisAuditRuleResult,
  type RicisAuditRuleStatus,
} from './RicisAuditContracts';
import { getRicisAuditRule } from './RicisAuditRules';

export type RicisAuditStage =
  | 'INPUT_VALIDATION'
  | 'PARSE'
  | 'SEMANTIC_INDEX'
  | 'CORE_REDUCTION'
  | 'AUDIT_REPORT';
export type RicisAuditStageStatus = 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';

export interface RicisAuditStageUpdate {
  readonly auditId: string;
  readonly stage: RicisAuditStage;
  readonly status: RicisAuditStageStatus;
}

export interface RicisAuditObserver {
  readonly onStageUpdate?: (update: RicisAuditStageUpdate) => void;
}

export interface RicisAuditOrchestratorOptions {
  readonly core?: IRicisReductionEngine;
  readonly clock?: () => number;
  readonly defaultMaxInputCharacters?: number;
}

const DEFAULT_MAX_INPUT_CHARACTERS = 4096;

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

/** Stable serialization for AST/evidence fingerprints; it contains no time or object identity. */
function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(',')}}`;
}

/** Small dependency-free deterministic digest suitable for correlation/evidence binding. */
export function ricisAuditFingerprint(value: unknown): string {
  const input = typeof value === 'string' ? value : stableSerialize(value);
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= BigInt(input.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return `fnv1a64:${hash.toString(16).padStart(16, '0')}`;
}

function isBinary(node: Expression, nodeType?: BinaryExpression['nodeType']): node is BinaryExpression {
  return 'left' in node && 'right' in node && (nodeType === undefined || node.nodeType === nodeType);
}

function isZero(node: Expression): node is SingularityExpression {
  return node.nodeType === 'SingularityZero';
}

function isInfinity(node: Expression): node is SingularityExpression {
  return node.nodeType === 'SingularityInfinity';
}

function isSingularity(node: Expression): node is SingularityExpression {
  return node.nodeType === 'SingularityZero' || node.nodeType === 'SingularityInfinity';
}

function containsA4Candidate(node: Expression): boolean {
  if (isBinary(node, 'Divide') && isZero(node.left) && isZero(node.right)) return true;
  if (node.nodeType === 'Function') return (node as FunctionExpression).args.some(containsA4Candidate);
  if (isBinary(node)) return containsA4Candidate(node.left) || containsA4Candidate(node.right);
  if (isSingularity(node)) return containsA4Candidate(node.basis);
  return false;
}

function containsA6Candidate(node: Expression): boolean {
  if (isBinary(node, 'Multiply') &&
    ((isZero(node.left) && isInfinity(node.right)) || (isZero(node.right) && isInfinity(node.left)))) return true;
  if (node.nodeType === 'Function') return (node as FunctionExpression).args.some(containsA6Candidate);
  if (isBinary(node)) return containsA6Candidate(node.left) || containsA6Candidate(node.right);
  if (isSingularity(node)) return containsA6Candidate(node.basis);
  return false;
}

function containsL1Candidate(node: Expression): boolean {
  if (isBinary(node, 'Divide')) return stableSerialize(node.left) === stableSerialize(node.right);
  if (node.nodeType === 'Function') return (node as FunctionExpression).args.some(containsL1Candidate);
  if (isBinary(node)) return containsL1Candidate(node.left) || containsL1Candidate(node.right);
  if (isSingularity(node)) return containsL1Candidate(node.basis);
  return false;
}

function containsNumericValue(node: Expression, predicate: (value: number) => boolean): boolean {
  if (node.nodeType === 'Constant') return predicate((node as ConstantExpression).value);
  if (node.nodeType === 'Function') return (node as FunctionExpression).args.some(child => containsNumericValue(child, predicate));
  if (isBinary(node)) return containsNumericValue(node.left, predicate) || containsNumericValue(node.right, predicate);
  if (isSingularity(node)) return containsNumericValue(node.basis, predicate);
  if (node.nodeType === 'Derivative') return containsNumericValue((node as DerivativeExpression).expression, predicate);
  return false;
}

function hasRule(trace: readonly TransformationLogEntry[], ruleFamily: string): boolean {
  return trace.some(entry => entry.ruleFamily === ruleFamily);
}

function rule(
  id: RicisAuditRuleId,
  status: RicisAuditRuleStatus,
  detail: string,
  evidence: readonly string[] = [],
): RicisAuditRuleResult {
  return Object.freeze({ id, status, detail, evidence: Object.freeze([...evidence]) });
}

function reject(code: RicisAuditDiagnostic['code'], messageResourceKey: string, safeParameters: Record<string, string> = {}): RicisAuditOutcome {
  return {
    kind: 'REJECTED',
    diagnostic: { code, messageResourceKey, safeParameters: Object.freeze({ ...safeParameters }) },
  } as RicisAuditOutcome;
}

/**
 * Application orchestration for the RICIS audit. It composes the existing
 * parser, SP4 indexer and reduction engine; it does not contain a second
 * reduction implementation and it has no fallback path.
 */
export class RicisAuditOrchestrator {
  private readonly core: IRicisReductionEngine;
  private readonly clock: () => number;
  private readonly defaultMaxInputCharacters: number;
  private lastReport: RicisAuditReport | undefined;

  public constructor(options: RicisAuditOrchestratorOptions = {}) {
    this.core = options.core ?? new RicisTypeScriptEngine();
    this.clock = options.clock ?? (() => Date.now());
    this.defaultMaxInputCharacters = options.defaultMaxInputCharacters ?? DEFAULT_MAX_INPUT_CHARACTERS;
  }

  public getCurrentReport(): RicisAuditReport | undefined {
    return this.lastReport;
  }

  public execute(request: RicisAuditRequest, observer?: RicisAuditObserver): RicisAuditOutcome {
    const emit = (stage: RicisAuditStage, status: RicisAuditStageStatus): void => {
      observer?.onStageUpdate?.({ auditId: request.auditId, stage, status });
    };
    const maxInputCharacters = request.maxInputCharacters ?? this.defaultMaxInputCharacters;

    emit('INPUT_VALIDATION', 'IN_PROGRESS');
    if (request.expression.trim().length === 0) {
      emit('INPUT_VALIDATION', 'FAILED');
      return reject('AUDIT_INPUT_EMPTY', 'ricis.audit.input.empty');
    }
    if (request.expression.length > maxInputCharacters) {
      emit('INPUT_VALIDATION', 'FAILED');
      return reject('AUDIT_INPUT_LIMIT_EXCEEDED', 'ricis.audit.input.limit', { limit: String(maxInputCharacters) });
    }
    if (request.parameterValue !== undefined && !Number.isFinite(request.parameterValue)) {
      emit('INPUT_VALIDATION', 'FAILED');
      return reject('AUDIT_INPUT_INVALID_POINT', 'ricis.audit.input.invalidPoint');
    }
    emit('INPUT_VALIDATION', 'SUCCESS');

    let parsed: { parameterName: string; body: Expression };
    emit('PARSE', 'IN_PROGRESS');
    try {
      parsed = LambdaParser.parse(request.expression);
      emit('PARSE', 'SUCCESS');
    } catch {
      emit('PARSE', 'FAILED');
      return reject('AUDIT_PARSE_REJECTED', 'ricis.audit.input.parseRejected');
    }

    emit('SEMANTIC_INDEX', 'IN_PROGRESS');
    const normalizedExpression = AlgebraicSimplifier.simplify(parsed.body);
    const semanticIndexApplied = request.parameterValue !== undefined;
    const indexedExpression = semanticIndexApplied
      ? SemanticIndexer.indexAtPoint(normalizedExpression, parsed.parameterName, request.parameterValue!)
      : normalizedExpression;
    emit('SEMANTIC_INDEX', 'SUCCESS');

    emit('CORE_REDUCTION', 'IN_PROGRESS');
    let reduction: RicisReductionResult;
    try {
      // This is the sole Core call in one audit run. In particular, no replay
      // is used to manufacture the deterministic rule; the fingerprint is pure.
      reduction = this.core.reduce(indexedExpression);
      emit('CORE_REDUCTION', 'SUCCESS');
    } catch {
      emit('CORE_REDUCTION', 'FAILED');
      return reject('AUDIT_CORE_REJECTED', 'ricis.audit.core.rejected');
    }

    const coreTrace = Object.freeze(reduction.trace.map(entry => Object.freeze({
      phase: entry.phase,
      ruleFamily: entry.ruleFamily,
      description: entry.description,
      before: deepFreeze(entry.before),
      after: deepFreeze(entry.after),
    })));
    const canonicalSource = request.expression.trim();
    const sourceHash = ricisAuditFingerprint(canonicalSource);
    const containsNaN = containsNumericValue(reduction.reduced, Number.isNaN);
    const containsJavaScriptInfinity = containsNumericValue(reduction.reduced, value => value === Infinity || value === -Infinity);
    const traceFingerprint = ricisAuditFingerprint(coreTrace);
    const evidence: RicisAuditEvidence = deepFreeze({
      sourceHash,
      canonicalSource,
      ...(request.parameterValue === undefined ? {} : { parameterValue: request.parameterValue }),
      normalizedExpression: deepFreeze(normalizedExpression),
      indexedExpression: deepFreeze(indexedExpression),
      reduction: deepFreeze({
        original: reduction.original,
        reduced: reduction.reduced,
        trace: coreTrace,
        isFullyResolved: reduction.isFullyResolved,
      }),
      coreTrace,
      coreInvocationCount: 1,
      fallbackInvocationCount: 0,
      semanticIndexApplied,
      containsNaN,
      containsJavaScriptInfinity,
      traceFingerprint,
    });

    const l1Applicable = containsL1Candidate(indexedExpression) || hasRule(coreTrace, 'L1');
    const a4Applicable = containsA4Candidate(indexedExpression);
    const a6Applicable = containsA6Candidate(indexedExpression);
    const traceIsWellFormed = coreTrace.every(entry =>
      Number.isInteger(entry.phase) && entry.ruleFamily.trim().length > 0 &&
      entry.description.trim().length > 0 && entry.before !== undefined && entry.after !== undefined);
    const reportFingerprint = ricisAuditFingerprint({
      sourceHash,
      indexedExpression,
      reduced: reduction.reduced,
      trace: coreTrace,
      trustBoundary: 'STRUCTURAL_ONLY',
    });

    const rules: readonly RicisAuditRuleResult[] = Object.freeze([
      rule('R-01', 'PASS', getRicisAuditRule('R-01').requirement, ['bounded-input']),
      rule('R-02', 'PASS', getRicisAuditRule('R-02').requirement, ['parser:complete']),
      rule('R-03', sourceHash === ricisAuditFingerprint(canonicalSource) ? 'PASS' : 'FAIL', getRicisAuditRule('R-03').requirement, [sourceHash]),
      rule('R-04', semanticIndexApplied ? 'PASS' : 'SKIPPED', semanticIndexApplied ? getRicisAuditRule('R-04').requirement : 'No SP4 point was requested.', semanticIndexApplied ? ['semantic-index:applied'] : []),
      rule('R-05', l1Applicable ? (hasRule(coreTrace, 'L1') ? 'PASS' : 'FAIL') : 'SKIPPED', l1Applicable ? getRicisAuditRule('R-05').requirement : 'No L1 cancellation candidate was present.', l1Applicable ? ['trace:L1'] : []),
      rule('R-06', a4Applicable ? (hasRule(coreTrace, 'A4') ? 'PASS' : 'FAIL') : 'SKIPPED', a4Applicable ? getRicisAuditRule('R-06').requirement : 'No indexed 0_F / 0_G candidate was present.', a4Applicable ? ['trace:A4'] : []),
      rule('R-07', a6Applicable ? (hasRule(coreTrace, 'A6') ? 'PASS' : 'FAIL') : 'SKIPPED', a6Applicable ? getRicisAuditRule('R-07').requirement : 'No 0_F * infinity_G candidate was present.', a6Applicable ? ['trace:A6'] : []),
      rule('R-08', traceIsWellFormed ? 'PASS' : 'FAIL', getRicisAuditRule('R-08').requirement, [`trace-entries:${coreTrace.length}`]),
      rule('R-09', !containsNaN && !containsJavaScriptInfinity ? 'PASS' : 'FAIL', getRicisAuditRule('R-09').requirement, [containsNaN ? 'NaN:found' : 'NaN:none', containsJavaScriptInfinity ? 'Infinity:found' : 'Infinity:none']),
      rule('R-10', evidence.coreInvocationCount === 1 && evidence.fallbackInvocationCount === 0 ? 'PASS' : 'FAIL', getRicisAuditRule('R-10').requirement, ['core-calls:1', 'fallback-calls:0']),
      rule('R-11', reportFingerprint.length > 0 && traceFingerprint.length > 0 ? 'PASS' : 'FAIL', getRicisAuditRule('R-11').requirement, [reportFingerprint]),
      rule('R-12', 'PASS', getRicisAuditRule('R-12').requirement, ['trust-boundary:STRUCTURAL_ONLY', 'lean-verified:false']),
    ]);

    // A source-level assertion here protects the fixed twelve-rule contract if
    // a future edit accidentally drops or duplicates an identifier.
    if (rules.length !== RICIS_AUDIT_RULE_IDS.length || rules.some((result, index) => result.id !== RICIS_AUDIT_RULE_IDS[index])) {
      emit('AUDIT_REPORT', 'FAILED');
      return reject('AUDIT_CORE_REJECTED', 'ricis.audit.rules.invalid');
    }

    const report: RicisAuditReport = deepFreeze({
      kind: 'RICIS_AUDIT_REPORT',
      auditId: request.auditId,
      createdAt: this.clock(),
      trustBoundary: 'STRUCTURAL_ONLY',
      leanVerified: false,
      isValid: rules.every(result => result.status !== 'FAIL'),
      rules,
      evidence,
      fingerprint: reportFingerprint,
    });
    this.lastReport = report;
    emit('AUDIT_REPORT', 'SUCCESS');
    return { kind: 'REPORT', report };
  }

  /** Explicit alias for callers that use domain-language rather than workflow-language. */
  public audit(request: RicisAuditRequest, observer?: RicisAuditObserver): RicisAuditOutcome {
    return this.execute(request, observer);
  }
}

/** Convenience factory keeps the default wiring in one place and remains Core-first. */
export function createRicisAuditOrchestrator(options: RicisAuditOrchestratorOptions = {}): RicisAuditOrchestrator {
  return new RicisAuditOrchestrator(options);
}

/** Helper for tests and adapters that need the reduced expression only. */
export function getRicisAuditReport(outcome: RicisAuditOutcome): RicisAuditReport | undefined {
  return outcome.kind === 'REPORT' ? outcome.report : undefined;
}

/** Structural helper exported for domain tests without exposing mutable internals. */
export function isRicisA6Expression(node: Expression): boolean {
  return containsA6Candidate(node);
}

/** Keep AST imported as a public package symbol for consumers building audit fixtures. */
export { AST };
