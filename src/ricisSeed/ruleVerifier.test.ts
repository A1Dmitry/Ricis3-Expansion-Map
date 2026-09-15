import { describe, expect, it } from 'vitest';
import { verifyProofChain, verifyProofStep } from './ruleVerifier';
import { canonicalizeForProof } from './canonicalForm';
import { createSeed, expandTo, createRicisSystem } from './ricisSeed.domain';
import type { ProofStep, UnsolvedProblemResolver, UnsolvedSingularProblem, CandidateAxiom, RicisState, ResolutionResult } from './contracts';

describe('RuleVerifier (P0 / P6 Adversarial Tests)', () => {
  it('validates genuine A6 steps: 0_F * inf_G -> F * G', () => {
    const validStep: ProofStep = {
      rule: 'A6',
      from: '0_F * inf_G',
      to: 'F * G',
    };
    const res = verifyProofStep(validStep);
    expect(res.valid).toBe(true);
    expect(res.ruleApplied).toBe('A6');
  });

  it('rejects forged A6 steps: 0_F * 0_G -> F * G', () => {
    const forgedStep: ProofStep = {
      rule: 'A6',
      from: '0_F * 0_G',
      to: 'F * G',
    };
    const res = verifyProofStep(forgedStep);
    expect(res.valid).toBe(false);
    expect(res.reason).toContain('Правило A6');
  });

  it('validates genuine A4 steps: 0_F / 0_G -> F / G', () => {
    const step: ProofStep = {
      rule: 'A4',
      from: '0_F / 0_G',
      to: 'F / G',
    };
    expect(verifyProofStep(step).valid).toBe(true);
  });

  it('rejects forged A4 steps: inf_F / 0_G -> F / G', () => {
    const step: ProofStep = {
      rule: 'A4',
      from: 'inf_F / 0_G',
      to: 'F / G',
    };
    expect(verifyProofStep(step).valid).toBe(false);
  });

  it('validates genuine A7 steps: inf_F - inf_G -> inf_(F - G)', () => {
    const step: ProofStep = {
      rule: 'A7',
      from: 'inf_F - inf_G',
      to: 'inf_(F - G)',
    };
    expect(verifyProofStep(step).valid).toBe(true);
  });

  it('validates genuine A1/A10 steps: F / 0 -> inf_F', () => {
    const step: ProofStep = {
      rule: 'A1',
      from: 'F / 0',
      to: 'inf_F',
    };
    expect(verifyProofStep(step).valid).toBe(true);
  });

  it('validates genuine A2 steps: inf_0 -> 1', () => {
    const step: ProofStep = {
      rule: 'A2',
      from: 'inf_0',
      to: '1',
    };
    expect(verifyProofStep(step).valid).toBe(true);
  });

  it('validates LOCAL_STRUCTURAL_REDUCTION with canonical commutativity / L1 folding', () => {
    const step: ProofStep = {
      rule: 'LOCAL_STRUCTURAL_REDUCTION',
      from: '(F + G) - (G + F)',
      to: '0',
    };
    expect(verifyProofStep(step).valid).toBe(true);
  });

  it('rejects forged LOCAL_STRUCTURAL_REDUCTION claiming arbitrary equality', () => {
    const step: ProofStep = {
      rule: 'LOCAL_STRUCTURAL_REDUCTION',
      from: 'F + G',
      to: 'F * G',
    };
    const res = verifyProofStep(step);
    expect(res.valid).toBe(false);
    expect(res.reason).toContain('неприменимо для перехода');
  });

  it('rejects proof chain with broken semantic link between step results and next input', () => {
    const steps: readonly ProofStep[] = [
      { rule: 'A6', from: '0_F * inf_G', to: 'F * G' },
      { rule: 'LOCAL_STRUCTURAL_REDUCTION', from: 'H * K', to: 'K * H' }, // разрыв: F*G != H*K
    ];
    const chainRes = verifyProofChain(steps);
    expect(chainRes.valid).toBe(false);
    expect(chainRes.failedStepIndex).toBe(1);
    expect(chainRes.reason).toContain('Разрыв цепочки между шагами 1 и 2');
  });

  it('P2: canonicalizeForProof returns ERR on malformed expressions', () => {
    const malformed = '0_F * (inf_G + ';
    const res = canonicalizeForProof(malformed);
    expect(res.kind).toBe('ERR');
    if (res.kind === 'ERR') {
      expect(res.error).toBeDefined();
    }
  });

  it('P3 / P6: Admissibility gate SEMANTIC_RULE_VERIFIED prevents expanding invalid proof steps', () => {
    const maliciousResolver: UnsolvedProblemResolver = {
      resolverId: 'test/malicious-forged-step-resolver',
      supportedProblemIds: ['P_FORGED'],
      resolve(prob: UnsolvedSingularProblem, _state: RicisState): ResolutionResult {
        return {
          kind: 'RESOLVED',
          resolution: {
            problem: prob,
            candidate: {
              id: 'A_FORGED_A6',
              layer: 'AXIOM',
              statement: '0_X * 0_Y = X * Y',
              guard: 'none',
              covers: ['ZERO_TIMES_INF'],
              consequences: [{ inputForm: '0_X * 0_Y', outputForm: 'X * Y' }],
            },
            proof: {
              strategy: 'RICIS_STRUCTURAL',
              steps: [
                // Поддельный шаг A6 с операндами 0_X * 0_Y вместо 0_X * inf_Y
                { rule: 'A6', from: '0_X * 0_Y', to: 'X * Y' },
              ],
              conclusion: 'X * Y',
              usesLimits: false,
              usesNumericApproximation: false,
            },
          },
        };
      },
    };

    const problem: UnsolvedSingularProblem = {
      id: 'P_FORGED',
      statement: 'Forged test problem',
      inputForm: '0_X * 0_Y',
      singularityClasses: ['ZERO_TIMES_INF'],
      coverageClaim: [],
    };

    const system = createRicisSystem({ resolvers: [maliciousResolver] });
    const expResult = system.ExpandTo((state) => state.Resolve(problem));
    expect(expResult.kind).toBe('REJECTED');
    if (expResult.kind === 'REJECTED') {
      expect(expResult.reason).toBe('SEMANTIC_RULE_INVALID');
      const semanticGate = expResult.trace.find(c => c.gate === 'SEMANTIC_RULE_VERIFIED');
      expect(semanticGate?.outcome).toBe('FAIL');
      expect(semanticGate?.detail).toContain('Правило A6');
    }
  });
});
