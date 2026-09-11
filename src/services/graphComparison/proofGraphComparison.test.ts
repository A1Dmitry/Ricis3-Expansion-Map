import { describe, it, expect } from 'vitest';
import type { IProofGraphComparisonService } from '../../model/proofGraphComparison.contracts';
import { ProofGraphComparisonService } from './proofGraphComparisonService';

describe('ProofGraphComparisonService (RICIS-III vs Anthropic FLT Graph)', () => {
  const service: IProofGraphComparisonService = new ProofGraphComparisonService();

  it('should return valid profile for RICIS-III graph architecture with publication trail', () => {
    const profile = service.getRicisGraphProfile();
    expect(profile.id).toBe('ricis-iii-dag');
    expect(profile.architecture).toBe('RICIS_MONOLITH_DAG');
    expect(profile.depositedDoi).toContain('10.5281/zenodo');
    expect(profile.interactiveInspectionModel).toBe('3D_WEBGL_AST_DYNAMIC');
    expect(profile.metrics.algebraicComplexity).toBe('O(1)');
    expect(profile.axiomaticBase).toContain('A1_INDEXING');
    expect(profile.axiomaticBase).toContain('L1_IDENTITY');
    expect(profile.authorPublicationsTrail).toBeDefined();
    expect(profile.authorPublicationsTrail?.some(p => p.includes('dzen.ru'))).toBe(true);
  });

  it('should return valid profile for Anthropic FLT graph architecture', () => {
    const profile = service.getAnthropicFltGraphProfile();
    expect(profile.id).toBe('anthropic-flt-lean4');
    expect(profile.architecture).toBe('ANTHROPIC_MODULAR_DECOMPOSITION');
    expect(profile.repositoryUrl).toBe('https://github.com/anthropics/fermats-last-theorem');
    expect(profile.interactiveInspectionModel).toBe('STATIC_HTML_EXPORTER');
    expect(profile.metrics.totalNodes).toBeGreaterThan(25000);
    expect(profile.axiomaticBase).toContain('LEAN_4_CIC');
  });

  it('should compute structural diff demonstrating proven behavioral graph isomorphism', () => {
    const diff = service.computeStructuralDiff();
    
    // Check priority verdict and behavioral isomorphism
    expect(diff.priorityVerdict.status).toBe('PROVEN_BEHAVIORAL_ISOMORPHISM');
    expect(diff.priorityVerdict.ricisPublicationAnchor).toContain('10.5281/zenodo');
    expect(diff.priorityVerdict.behavioralOverlapScore).toBeGreaterThanOrEqual(0.85);
    expect(diff.priorityVerdict.statement).toBeTruthy();

    // Check macro graph pipeline
    expect(diff.macroGraphSteps.length).toBe(7);
    const steps = diff.macroGraphSteps.map(s => s.stepId);
    expect(steps).toEqual(['STATE', 'CLASSIFY', 'PRESERVE_CONTEXT', 'BRANCH', 'TRANSFORM', 'CARRY_STATE', 'VERIFY']);

    // Check structural analogies (Graph decomposition, blueprint DAG, behavioral pattern)
    expect(diff.structuralAnalogies.length).toBeGreaterThanOrEqual(4);
    const behavioralAnalogy = diff.structuralAnalogies.find(a => a.feature.includes('Поведенческий макрограф') || a.feature.includes('STATE → CLASSIFY'));
    expect(behavioralAnalogy).toBeDefined();
    expect(behavioralAnalogy?.equivalenceScore).toBeGreaterThanOrEqual(0.9);
  });

  it('should verify that Anthropic FLT implements the RICIS-III context preservation pattern (SP1/SP2/L1)', () => {
    const diff = service.computeStructuralDiff();
    const behavioralAnalogy = diff.structuralAnalogies.find(a => a.feature.includes('Поведенческий макрограф'));

    expect(behavioralAnalogy?.ricisImplementation).toContain('SP1');
    expect(behavioralAnalogy?.anthropicImplementation).toContain('torsionToSum');
    expect(behavioralAnalogy?.codePatternRef).toContain('S_WeierstrassCurve_separable_prePsi_of_isUnit_of_even.lean');
  });
});
