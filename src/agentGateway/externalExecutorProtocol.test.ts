import { describe, expect, it } from 'vitest';
import { assessExternalExecutorEntry, gateExternalExecutorSubmission, RICIS_NORMATIVE_DOCUMENT } from './externalExecutorProtocol';

const base = { ricisContextIdentified: true, normativeDocuments: [RICIS_NORMATIVE_DOCUMENT] } as const;

describe('external executor entry and solution gate', () => {
  it('accepts a compliance-first executor without extra reading', () => {
    const result = gateExternalExecutorSubmission({ ...base, appliedRules: ['SP4'], resultValid: true }, ['SP4']);
    expect(result).toMatchObject({ accepted: true, stage: 'SOLUTION_GATE', recoveryAction: 'NONE' });
  });
  it('returns only targeted dependencies for partial-read recovery', () => {
    const result = gateExternalExecutorSubmission({ ...base, appliedRules: [], resultValid: false }, ['SP4']);
    expect(result).toMatchObject({ accepted: false, violation: 'REQUIRED_RULE_NOT_APPLIED', recoveryAction: 'TARGETED_READ_AND_RETRY' });
    expect(result.requiredRules).toEqual(['SP4']);
    expect(result.requiredDocuments).toEqual([RICIS_NORMATIVE_DOCUMENT]);
  });
  it('rejects a non-compliant result regardless of strategy', () => {
    expect(gateExternalExecutorSubmission({ ...base, appliedRules: [], resultValid: false }, ['L1']).accepted).toBe(false);
  });
  it('rejects protected redefinition without mutating the boundary', () => {
    const result = gateExternalExecutorSubmission({ ...base, appliedRules: ['SP4'], resultValid: true, protectedRedefinitions: ['SP4'] }, ['SP4']);
    expect(result).toMatchObject({ accepted: false, violation: 'PROTECTED_RULE_REDEFINITION', recoveryAction: 'REJECT' });
    expect(gateExternalExecutorSubmission({ ...base, appliedRules: ['SP4'], resultValid: true }, ['SP4']).accepted).toBe(true);
  });
  it('routes unknown rules to the normative source', () => {
    const result = assessExternalExecutorEntry({ ...base, unknownRules: ['SP5'] });
    expect(result).toMatchObject({ accepted: false, violation: 'UNKNOWN_RULE_REQUIRES_NORMATIVE_READ' });
    expect(result.requiredRules).toEqual(['SP5']);
  });
  it('provides a minimal entry handshake', () => {
    expect(assessExternalExecutorEntry(base)).toMatchObject({ accepted: true, stage: 'ENTRY' });
  });
});
