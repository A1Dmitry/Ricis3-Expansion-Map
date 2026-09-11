/**
 * Уровни доверия к формальным математическим доказательствам RICIS-III
 */
export type ProofTrustLevel = 
  | 'DRAFT'
  | 'STATIC_CHECK_PASSED'
  | 'REQUIRES_CORE_LEAN'
  | 'LEAN_VERIFIED'
  | 'TRUSTED_AXIOM';

/**
 * Иерархические уровни нормативной и исследовательской документации
 */
export type DocumentationLayer =
  | '00-governance'
  | '01-architecture'
  | '02-sprints'
  | '03-quality'
  | '04-calculator-integration'
  | '05-evidence'
  | '06-canonical-template';

/**
 * Метаданные формального доказательства Lean 4
 */
export interface LeanProofArtifactDTO {
  readonly artifactId: string;
  readonly filePath: string;
  readonly relatedNodeId: string;
  readonly theoremName: string;
  readonly appliedAxioms: readonly ('A1' | 'A4' | 'A6' | 'A7' | 'A8' | 'L1_IDENTITY')[];
  readonly complexityClass: 'O(1)' | 'O(log N)' | 'O(N)';
  readonly trustLevel: ProofTrustLevel;
  readonly zenodoDoi?: string;
  readonly hasSorryAxiom: boolean;
  readonly astBridgeType: 'Inductive' | 'Structural' | 'Standalone';
}

/**
 * Метаданные документа из каталога Markdown знаний
 */
export interface MarkdownDocumentDTO {
  readonly documentId: string;
  readonly layer: DocumentationLayer;
  readonly relativePath: string;
  readonly title: string;
  readonly canonicalDoi?: string;
  readonly lastReviewedVersion: string;
  readonly referencedLeanArtifacts: readonly string[];
  readonly referencedNodeIds: readonly string[];
}

/**
 * Результат кросс-валидации связности документации и Lean-доказательств
 */
export interface KnowledgeIntegrityReportDTO {
  readonly totalDocuments: number;
  readonly totalLeanArtifacts: number;
  readonly verifiedArtifactsCount: number;
  readonly brokenDocumentLinks: readonly string[];
  readonly unreferencedLeanArtifacts: readonly string[];
  readonly trustBoundaryViolations: readonly string[];
  readonly isConsistent: boolean;
}

/**
 * Контракт сервиса валидации и индексации знаний RICIS-III (DI-совместимый)
 */
export interface IKnowledgeVerificationService {
  getLeanArtifacts(): Promise<readonly LeanProofArtifactDTO[]>;
  getMarkdownDocuments(): Promise<readonly MarkdownDocumentDTO[]>;
  verifyKnowledgeIntegrity(): Promise<KnowledgeIntegrityReportDTO>;
  assertTrustBoundary(artifact: LeanProofArtifactDTO): boolean;
}
