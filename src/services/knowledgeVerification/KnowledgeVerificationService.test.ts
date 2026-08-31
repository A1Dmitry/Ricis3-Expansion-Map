import { describe, it, expect } from 'vitest';
import type {
  LeanProofArtifactDTO,
  MarkdownDocumentDTO,
  IKnowledgeVerificationService,
} from './contracts';
import { KnowledgeVerificationService } from './KnowledgeVerificationService';

describe('QA Step 3: KnowledgeVerificationService (md & Lean Formal Verification)', () => {
  const sampleLeanArtifacts: readonly LeanProofArtifactDTO[] = [
    {
      artifactId: 'ricis-chatbot-monetization',
      filePath: 'artifacts/proofs/ricis-chatbot-monetization.lean',
      relatedNodeId: 'ricis-chatbot-monetization',
      theoremName: 'Chatbot_Monetization_Resolution',
      appliedAxioms: ['A6', 'L1_IDENTITY'],
      complexityClass: 'O(1)',
      trustLevel: 'LEAN_VERIFIED',
      zenodoDoi: '10.5281/zenodo.21491712',
      hasSorryAxiom: false,
      astBridgeType: 'Inductive',
    },
    {
      artifactId: 'ricis-riemann-zeta-ast-bridge',
      filePath: 'artifacts/proofs/ricis-riemann-zeta-ast-bridge.standalone.lean',
      relatedNodeId: 'real-catalog-3',
      theoremName: 'Zeta_Pole_Structural_Identity',
      appliedAxioms: ['A4', 'L1_IDENTITY'],
      complexityClass: 'O(1)',
      trustLevel: 'LEAN_VERIFIED',
      zenodoDoi: '10.5281/zenodo.17872755',
      hasSorryAxiom: false,
      astBridgeType: 'Standalone',
    },
  ];

  const sampleMarkdownDocuments: readonly MarkdownDocumentDTO[] = [
    {
      documentId: 'doc-governance-catalog',
      layer: '00-governance',
      relativePath: 'docs/00-governance/DOCUMENTATION_CATALOG.md',
      title: 'RICIS-III Documentation Catalog',
      lastReviewedVersion: '0.4.98',
      referencedLeanArtifacts: ['ricis-chatbot-monetization', 'ricis-riemann-zeta-ast-bridge'],
      referencedNodeIds: ['ricis-chatbot-monetization', 'real-catalog-3'],
    },
    {
      documentId: 'doc-evidence-lean-audit',
      layer: '05-evidence',
      relativePath: 'docs/05-evidence/proofs/lean-boundary-audit-2026-08-18.md',
      title: 'Lean 4 Formal Proofs & Boundary Audit',
      lastReviewedVersion: '0.4.98',
      referencedLeanArtifacts: ['ricis-riemann-zeta-ast-bridge'],
      referencedNodeIds: ['real-catalog-3'],
    },
  ];

  it('correctly reports knowledge integrity when all references and trust boundaries hold', async () => {
    const service: IKnowledgeVerificationService = new KnowledgeVerificationService(
      sampleLeanArtifacts,
      sampleMarkdownDocuments
    );

    const report = await service.verifyKnowledgeIntegrity();
    expect(report.isConsistent).toBe(true);
    expect(report.totalDocuments).toBe(2);
    expect(report.totalLeanArtifacts).toBe(2);
    expect(report.verifiedArtifactsCount).toBe(2);
    expect(report.brokenDocumentLinks).toHaveLength(0);
    expect(report.trustBoundaryViolations).toHaveLength(0);
  });

  it('strictly flags trust boundary violations when an artifact contains sorryAx or invalid trust level', () => {
    const service = new KnowledgeVerificationService([], []);
    const invalidArtifact: LeanProofArtifactDTO = {
      artifactId: 'invalid-proof',
      filePath: 'artifacts/proofs/invalid.lean',
      relatedNodeId: 'node-x',
      theoremName: 'Bogus_Theorem',
      appliedAxioms: ['A6'],
      complexityClass: 'O(1)',
      trustLevel: 'LEAN_VERIFIED',
      hasSorryAxiom: true,
      astBridgeType: 'Inductive',
    };

    expect(service.assertTrustBoundary(invalidArtifact)).toBe(false);
  });

  it('detects unreferenced Lean artifacts and broken links', async () => {
    const documentWithBrokenLink: MarkdownDocumentDTO = {
      documentId: 'doc-broken',
      layer: '01-architecture',
      relativePath: 'docs/01-architecture/broken.md',
      title: 'Broken Ref Doc',
      lastReviewedVersion: '0.4.98',
      referencedLeanArtifacts: ['non-existent-lean-proof'],
      referencedNodeIds: ['real-catalog-3'],
    };

    const service = new KnowledgeVerificationService(
      sampleLeanArtifacts,
      [documentWithBrokenLink]
    );

    const report = await service.verifyKnowledgeIntegrity();
    expect(report.isConsistent).toBe(false);
    expect(report.brokenDocumentLinks).toContain('non-existent-lean-proof');
    expect(report.unreferencedLeanArtifacts).toContain('ricis-chatbot-monetization');
  });
});
