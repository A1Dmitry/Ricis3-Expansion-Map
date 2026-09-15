import { describe, expect, it } from 'vitest';
import { SEED_AXIOM_TABLE } from '../../ricisSeed/seedTable';
import { SingularityRuleRegistry } from './oopImplementation';
import {
  A4ZeroQuotientRule,
  A5InfinityQuotientRule,
  A6GeometricBridgeRule,
  A7InfinitySubtractionRule,
  A8ZeroSubtractionRule,
  A1FiniteOverZeroRule,
  A10FiniteTimesZeroRule,
  A15EqualOrderRule,
} from './oopRules';

describe('RCVAP: JSON ↔ TS Consistency Audit (P5)', () => {
  it('должен выводить разницу между задекларированными правилами в спецификации и реализованными в TS', () => {
    // 1. Get declared rules from seed document
    const declaredRules = new Set(SEED_AXIOM_TABLE.map(a => a.id));

    // 2. Get implemented rules
    // Using a manual list to represent what's actually available as rule classes
    const implementedRuleClasses = [
      new A4ZeroQuotientRule(),
      new A5InfinityQuotientRule(),
      new A6GeometricBridgeRule(),
      new A7InfinitySubtractionRule(),
      new A8ZeroSubtractionRule(),
      new A1FiniteOverZeroRule(),
      new A10FiniteTimesZeroRule(),
      new A15EqualOrderRule(),
    ];
    
    // Extrapolate the basic axiom ID from ruleName (e.g. 'A4_INDEXED_ZERO_OVER_INDEXED_ZERO' -> 'A4')
    const implementedRuleIds = new Set(implementedRuleClasses.map(r => r.ruleName.split('_')[0]));

    const declaredOnly = [...declaredRules].filter(id => !implementedRuleIds.has(id));
    const implementedOnly = [...implementedRuleIds].filter(id => !declaredRules.has(id as never));
    const both = [...declaredRules].filter(id => implementedRuleIds.has(id));

    // A11 is a meta rule, it shouldn't be a structural reducer rule
    
    // We expect A15 to be in implementedOnly because it is a candidate
    expect(implementedOnly).toContain('A15');
    
    // This provides a clear audit trail
    console.log({
      DECLARED_ONLY: declaredOnly,
      IMPLEMENTED_ONLY: implementedOnly,
      BOTH: both,
    });
  });
});
