import type {
  IKnowledgeVerificationService,
  KnowledgeIntegrityReportDTO,
  LeanProofArtifactDTO,
  MarkdownDocumentDTO,
} from './contracts';

/**
 * Сервис верификации связности и границ доверия между документацией и Lean 4
 */
export class KnowledgeVerificationService implements IKnowledgeVerificationService {
  constructor(
    private readonly leanArtifacts: readonly LeanProofArtifactDTO[],
    private readonly markdownDocuments: readonly MarkdownDocumentDTO[]
  ) {}

  public async getLeanArtifacts(): Promise<readonly LeanProofArtifactDTO[]> {
    return this.leanArtifacts;
  }

  public async getMarkdownDocuments(): Promise<readonly MarkdownDocumentDTO[]> {
    return this.markdownDocuments;
  }

  public assertTrustBoundary(artifact: LeanProofArtifactDTO): boolean {
    if (artifact.hasSorryAxiom && (artifact.trustLevel === 'LEAN_VERIFIED' || artifact.trustLevel === 'TRUSTED_AXIOM')) {
      return false;
    }
    return true;
  }

  public async verifyKnowledgeIntegrity(): Promise<KnowledgeIntegrityReportDTO> {
    const brokenDocumentLinks: string[] = [];
    const trustBoundaryViolations: string[] = [];
    const referencedArtifactIds = new Set<string>();

    const knownArtifactIds = new Set(this.leanArtifacts.map((a) => a.artifactId));

    for (const doc of this.markdownDocuments) {
      for (const artifactId of doc.referencedLeanArtifacts) {
        if (!knownArtifactIds.has(artifactId)) {
          brokenDocumentLinks.push(artifactId);
        } else {
          referencedArtifactIds.add(artifactId);
        }
      }
    }

    for (const artifact of this.leanArtifacts) {
      if (!this.assertTrustBoundary(artifact)) {
        trustBoundaryViolations.push(artifact.artifactId);
      }
    }

    const unreferencedLeanArtifacts = this.leanArtifacts
      .map((a) => a.artifactId)
      .filter((id) => !referencedArtifactIds.has(id));

    const verifiedArtifactsCount = this.leanArtifacts.filter(
      (a) => a.trustLevel === 'LEAN_VERIFIED' || a.trustLevel === 'TRUSTED_AXIOM'
    ).length;

    const isConsistent =
      brokenDocumentLinks.length === 0 &&
      trustBoundaryViolations.length === 0 &&
      unreferencedLeanArtifacts.length === 0;

    return {
      totalDocuments: this.markdownDocuments.length,
      totalLeanArtifacts: this.leanArtifacts.length,
      verifiedArtifactsCount,
      brokenDocumentLinks,
      unreferencedLeanArtifacts,
      trustBoundaryViolations,
      isConsistent,
    };
  }
}
