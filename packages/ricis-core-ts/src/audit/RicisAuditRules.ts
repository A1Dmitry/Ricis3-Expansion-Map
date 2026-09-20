import {
  RICIS_AUDIT_RULE_IDS,
  type RicisAuditRuleDefinition,
  type RicisAuditRuleId,
} from './RicisAuditContracts';

/**
 * R-01..R-12 are deliberately contracts about the execution boundary and its
 * evidence. They are not claims that a local TypeScript run is a Lean proof.
 */
export const RICIS_AUDIT_RULES: readonly RicisAuditRuleDefinition[] = [
  {
    id: 'R-01',
    title: 'Bounded input',
    requirement: 'The audit receives a non-empty expression within the configured input limit.',
    severity: 'ERROR',
  },
  {
    id: 'R-02',
    title: 'Complete parse',
    requirement: 'The existing RICIS parser accepts the complete lambda and does not silently ignore a suffix.',
    severity: 'ERROR',
  },
  {
    id: 'R-03',
    title: 'Source identity',
    requirement: 'The original source is retained and bound to a deterministic content hash.',
    severity: 'ERROR',
  },
  {
    id: 'R-04',
    title: 'SP4 semantic index',
    requirement: 'An explicitly requested evaluation point is represented through the existing semantic indexer.',
    severity: 'ERROR',
  },
  {
    id: 'R-05',
    title: 'L1 identity',
    requirement: 'Structural identity and cancellation remain observable in the existing Core trace when applicable.',
    severity: 'ERROR',
  },
  {
    id: 'R-06',
    title: 'A4 indexed zero ratio',
    requirement: 'An indexed 0_F / 0_G case is reduced by the existing Core A4 rule, not by a numeric epsilon.',
    severity: 'ERROR',
  },
  {
    id: 'R-07',
    title: 'A6 general product',
    requirement: 'A 0_F * infinity_G case is reduced by the existing Core A6 rule.',
    severity: 'ERROR',
  },
  {
    id: 'R-08',
    title: 'Transformation history',
    requirement: 'Every Core transformation retains before/after expressions and an ordered rule family.',
    severity: 'ERROR',
  },
  {
    id: 'R-09',
    title: 'Numeric safety',
    requirement: 'The audit never accepts JavaScript NaN or JavaScript Infinity as a structural result.',
    severity: 'ERROR',
  },
  {
    id: 'R-10',
    title: 'Single Core path',
    requirement: 'One orchestration run invokes the supplied Core exactly once and has no fallback invocation.',
    severity: 'ERROR',
  },
  {
    id: 'R-11',
    title: 'Deterministic evidence',
    requirement: 'The report fingerprint is derived from stable source, AST, result and trace data only.',
    severity: 'ERROR',
  },
  {
    id: 'R-12',
    title: 'Trust boundary',
    requirement: 'The result is explicitly structural-only and can never self-promote to Lean-verified evidence.',
    severity: 'WARNING',
  },
] as const;

const definitionsById = new Map<RicisAuditRuleId, RicisAuditRuleDefinition>(
  RICIS_AUDIT_RULES.map(definition => [definition.id, definition]),
);

export function getRicisAuditRule(id: RicisAuditRuleId): RicisAuditRuleDefinition {
  // The constant list and union are maintained together; this is a defensive
  // guard for JavaScript callers that bypass TypeScript.
  const definition = definitionsById.get(id);
  if (!definition) throw new Error(`Unknown RICIS audit rule: ${id}`);
  return definition;
}

export function getRicisAuditRules(): readonly RicisAuditRuleDefinition[] {
  return RICIS_AUDIT_RULES;
}

export function hasAllRicisAuditRules(ids: readonly string[]): boolean {
  return ids.length === RICIS_AUDIT_RULE_IDS.length &&
    RICIS_AUDIT_RULE_IDS.every(id => ids.includes(id));
}
