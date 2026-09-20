import { describe, expect, it, vi } from 'vitest';
import { AST } from '../ast/ExpressionTypes';
import type { IRicisReductionEngine } from '../engine/IRicisReductionEngine';
import { RicisTypeScriptEngine } from '../engine/RicisTypeScriptEngine';
import type { RicisReductionResult } from '../engine/RicisEngineContracts';
import {
  RICIS_AUDIT_RULE_IDS,
  RicisAuditOrchestrator,
  getRicisAuditReport,
  isRicisAuditReport,
} from './index';

describe('RICIS audit R-01..R-12 orchestration', () => {
  it('runs the indexed zero-ratio scenario through the existing Core exactly once', () => {
    const core = new RicisTypeScriptEngine();
    const reduceSpy = vi.spyOn(core, 'reduce');
    const stageUpdates: string[] = [];
    const outcome = new RicisAuditOrchestrator({ core, clock: () => 1_727_000_000_000 }).execute(
      { auditId: 'audit-a4', expression: 'x => (x - x) / (x - x)', parameterValue: 0 },
      { onStageUpdate: update => stageUpdates.push(`${update.stage}:${update.status}`) },
    );

    const report = getRicisAuditReport(outcome);
    expect(report).toBeDefined();
    expect(reduceSpy).toHaveBeenCalledTimes(1);
    expect(report?.rules).toHaveLength(12);
    expect(report?.rules.map(rule => rule.id)).toEqual([...RICIS_AUDIT_RULE_IDS]);
    expect(report?.rules.find(rule => rule.id === 'R-04')?.status).toBe('PASS');
    expect(report?.rules.find(rule => rule.id === 'R-06')?.status).toBe('PASS');
    expect(report?.rules.find(rule => rule.id === 'R-12')?.status).toBe('PASS');
    expect(report?.evidence.coreTrace.some(step => step.ruleFamily === 'A4')).toBe(true);
    expect(report?.evidence.fallbackInvocationCount).toBe(0);
    expect(report?.leanVerified).toBe(false);
    expect(report?.trustBoundary).toBe('STRUCTURAL_ONLY');
    expect(stageUpdates).toEqual([
      'INPUT_VALIDATION:IN_PROGRESS', 'INPUT_VALIDATION:SUCCESS',
      'PARSE:IN_PROGRESS', 'PARSE:SUCCESS',
      'SEMANTIC_INDEX:IN_PROGRESS', 'SEMANTIC_INDEX:SUCCESS',
      'CORE_REDUCTION:IN_PROGRESS', 'CORE_REDUCTION:SUCCESS',
      'AUDIT_REPORT:SUCCESS',
    ]);
  });

  it('audits A6 indexed literals using the core A6 rule rather than JavaScript Infinity', () => {
    const outcome = new RicisAuditOrchestrator({ clock: () => 10 }).audit({
      auditId: 'audit-a6',
      expression: 'x => 0_F * inf_G',
    });
    const report = getRicisAuditReport(outcome);

    expect(report?.evidence.reduction.reduced).toEqual(AST.Mul(AST.Var('F'), AST.Var('G')));
    expect(report?.evidence.coreTrace.map(step => step.ruleFamily)).toContain('A6');
    expect(report?.evidence.containsJavaScriptInfinity).toBe(false);
    expect(report?.rules.find(rule => rule.id === 'R-07')?.status).toBe('PASS');
    expect(report?.isValid).toBe(true);
  });

  it('keeps non-singular symbolic audits honest by marking pattern-specific rules SKIPPED', () => {
    const outcome = new RicisAuditOrchestrator({ clock: () => 10 }).execute({
      auditId: 'audit-symbolic',
      expression: 'x => x + 1',
    });
    const report = getRicisAuditReport(outcome);

    expect(report?.rules.find(rule => rule.id === 'R-04')?.status).toBe('SKIPPED');
    expect(report?.rules.find(rule => rule.id === 'R-06')?.status).toBe('SKIPPED');
    expect(report?.rules.find(rule => rule.id === 'R-07')?.status).toBe('SKIPPED');
    expect(report?.rules.find(rule => rule.id === 'R-08')?.status).toBe('PASS');
    expect(report?.isValid).toBe(true);
  });

  it('rejects malformed and trailing input without invoking Core', () => {
    const core: IRicisReductionEngine = {
      areEqual: vi.fn(),
      reduce: vi.fn(() => {
        throw new Error('must not be called');
      }),
    };
    const orchestrator = new RicisAuditOrchestrator({ core });

    const malformed = orchestrator.execute({ auditId: 'bad-1', expression: 'x => x + 1 trailing' });
    const empty = orchestrator.execute({ auditId: 'bad-2', expression: '   ' });

    expect(malformed.kind).toBe('REJECTED');
    expect(empty.kind).toBe('REJECTED');
    expect(core.reduce).not.toHaveBeenCalled();
  });

  it('returns an immutable structural report with a stable fingerprint across clocks', () => {
    const request = { auditId: 'same', expression: 'x => sin(x) / x', parameterValue: 0 } as const;
    const first = getRicisAuditReport(new RicisAuditOrchestrator({ clock: () => 1 }).execute(request));
    const second = getRicisAuditReport(new RicisAuditOrchestrator({ clock: () => 2 }).execute(request));

    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(first?.fingerprint).toBe(second?.fingerprint);
    expect(first?.evidence.traceFingerprint).toBe(second?.evidence.traceFingerprint);
    expect(isRicisAuditReport(first)).toBe(true);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first?.rules)).toBe(true);
    expect(first?.createdAt).toBe(1);
    expect(second?.createdAt).toBe(2);
  });

  it('marks a JavaScript non-finite constant as a failed safety rule instead of evidence', () => {
    const core: IRicisReductionEngine = {
      areEqual: (left, right) => JSON.stringify(left) === JSON.stringify(right),
      reduce: (_expression): RicisReductionResult => ({
        original: AST.Const(1),
        reduced: AST.Const(Infinity),
        trace: [],
        isFullyResolved: true,
      }),
    };
    const report = getRicisAuditReport(new RicisAuditOrchestrator({ core }).execute({
      auditId: 'unsafe',
      expression: 'x => 1',
    }));

    expect(report?.rules.find(rule => rule.id === 'R-09')?.status).toBe('FAIL');
    expect(report?.isValid).toBe(false);
    expect(report?.leanVerified).toBe(false);
  });
});
