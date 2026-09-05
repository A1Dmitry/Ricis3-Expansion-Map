import { describe, it, expect } from 'vitest';
import type { IProofGraphComparisonService } from '../../model/proofGraphComparison.contracts';
import { ProofGraphComparisonService } from './proofGraphComparisonService';

describe('ProofGraphComparisonService (RICIS-III vs Anthropic FLT Graph)', () => {
  const service: IProofGraphComparisonService = new ProofGraphComparisonService();

  it('should return valid profile for RICIS-III graph architecture', () => {
    const profile = service.getRicisGraphProfile();
    expect(profile.id).toBe('ricis-iii-dag');
    expect(profile.architecture).toBe('RICIS_MONOLITH_DAG');
    expect(profile.depositedDoi).toContain('10.5281/zenodo');
    expect(profile.interactiveInspectionModel).toBe('3D_WEBGL_AST_DYNAMIC');
    expect(profile.metrics.algebraicComplexity).toBe('O(1)');
    expect(profile.axiomaticBase).toContain('A1_INDEXING');
    expect(profile.axiomaticBase).toContain('L1_IDENTITY');
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

  it('should compute structural diff demonstrating prior origin of graph blueprint and clear divergence in singularity handling', () => {
    const diff = service.computeStructuralDiff();
    
    // Check priority verdict
    expect(diff.priorityVerdict.status).toBe('PRIOR_ORIGINAL_PUBLICATION');
    expect(diff.priorityVerdict.ricisPublicationAnchor).toContain('10.5281/zenodo.17872755');
    expect(diff.priorityVerdict.statement).toBeTruthy();

    // Check structural analogies (Graph decomposition, blueprint DAG, web inspection)
    expect(diff.structuralAnalogies.length).toBeGreaterThanOrEqual(3);
    const blueprintAnalogy = diff.structuralAnalogies.find(a => a.feature.includes('Blueprint') || a.feature.includes('DAG'));
    expect(blueprintAnalogy).toBeDefined();
    expect(blueprintAnalogy?.equivalenceScore).toBeGreaterThanOrEqual(0.7);

    // Check fundamental divergences (Geometric bridge vs Cauchy limits)
    expect(diff.fundamentalDivergences.length).toBeGreaterThanOrEqual(2);
    const singularityDivergence = diff.fundamentalDivergences.find(d => d.domain.includes('Singularity') || d.domain.includes('Сингулярност'));
    expect(singularityDivergence).toBeDefined();
    expect(singularityDivergence?.significance).toBe('CRITICAL_AXIOMATIC');
  });

  it('should verify that Anthropic FLT did NOT adopt RICIS-III O(1) singularity algebra despite graph similarity', () => {
    const diff = service.computeStructuralDiff();
    const ricisHandling = diff.primaryOriginProfile.singularityHandling;
    const anthropicHandling = diff.comparedSystemProfile.singularityHandling;

    expect(ricisHandling).toContain('Geometric Bridge');
    expect(anthropicHandling).toContain('Классический');
    expect(anthropicHandling).not.toContain('A6_GENERAL');
  });
});
