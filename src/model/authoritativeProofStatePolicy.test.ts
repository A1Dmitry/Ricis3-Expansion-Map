import { describe, expect, it } from 'vitest';
import { AuthoritativeProofStatePolicy } from './authoritativeProofStatePolicy';

const policy = new AuthoritativeProofStatePolicy();

describe('AuthoritativeProofStatePolicy', () => {
  it('resolves only current LeanVerified evidence', () => {
    expect(policy.apply({
      currentState: 'unresolved',
      structuralVerification: 'StructurallyVerified',
      trustStatus: 'LeanVerified',
    })).toEqual({ state: 'resolved', decisionResourceKey: 'proof.core.state.leanVerified', preserved: false });
  });

  it.each([
    ['TrustedAxiom', 'StructurallyVerified'],
    ['RequiresCoreLean', 'StructurallyVerified'],
    ['StaticCheckPassed', 'StructurallyVerified'],
    ['Hypothesis', 'StructurallyNotVerified'],
  ] as const)('keeps %s evidence partial even when structural state is %s', (trustStatus, structuralVerification) => {
    expect(policy.apply({ currentState: 'unresolved', structuralVerification, trustStatus }).state).toBe('partial');
  });

  it('maps Rejected to unresolved and preserves existing state on Core transport failure', () => {
    expect(policy.apply({
      currentState: 'partial',
      structuralVerification: 'Rejected',
      trustStatus: 'Rejected',
    })).toMatchObject({ state: 'unresolved', preserved: false });
    expect(policy.preserveOnFailure('resolved', {
      success: false,
      code: 'CORE_UNAVAILABLE',
      userMessage: 'proof.core.gateway.CORE_UNAVAILABLE',
      diagnostic: {
        origin: 'proof_console',
        runtime: 'csharp_api',
        retryable: true,
        occurredAt: 0,
      },
    })).toEqual({ state: 'resolved', decisionResourceKey: 'proof.core.state.transportFailure', preserved: true });
  });
});
