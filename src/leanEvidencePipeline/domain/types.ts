/**
 * Canonical Domain Types for RICIS-III Independent Lean Verification and Zenodo Evidence Pipeline.
 *
 * Adheres strictly to:
 * - RCVAP Anti-Tukhta Agile Protocol (No Self-Certification without AUDITOR marker)
 * - Strict verification state machine: UNVERIFIED -> LOCAL_VERIFIED -> INDEPENDENTLY_VERIFIED -> ARCHIVED
 * - Cryptographic identity binding (source SHA-256 == manifest SHA-256 == archive package SHA-256)
 * - Zero modification of RICIS mathematical semantics (L0, L1, SP1-SP5, A1-A10, Geometric A6, A15).
 */

export type ProofVerificationStatus =
  | 'UNVERIFIED'
  | 'LOCAL_VERIFIED'
  | 'INDEPENDENTLY_VERIFIED'
  | 'ARCHIVED';

export type AuditorMarker =
  | 'AUDITOR: EXTERNAL'
  | 'AUDITOR: SELF (same-pipeline)';

export type EvidenceFailureCode =
  | 'LEAN_BUILD_FAILURE'
  | 'LOCAL_VERIFICATION_FAILURE'
  | 'EXTERNAL_VERIFICATION_FAILURE'
  | 'ENVIRONMENT_MISMATCH'
  | 'SOURCE_HASH_MISMATCH'
  | 'GIT_COMMIT_MISMATCH'
  | 'ZENODO_UPLOAD_FAILURE'
  | 'ZENODO_METADATA_FAILURE'
  | 'DOI_CREATION_FAILURE'
  | 'SORRY_AX_DETECTED'
  | 'UNVERIFIED_CLAIM'
  | 'MISSING_CREDENTIALS';

export interface LeanEnvironment {
  readonly leanVersion: string;
  readonly mathlibVersion: string | null;
  readonly toolchain: string;
  readonly platform?: string;
}

export interface LocalVerificationResult {
  readonly status: 'PASS' | 'FAIL';
  readonly timestamp: string;
  readonly compiler: string;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly sorryAxDetected: boolean;
  readonly axioms: readonly string[];
  readonly rawOutputHash: string;
}

export interface IndependentVerificationResult {
  readonly status: 'PASS' | 'FAIL' | 'UNVERIFIED';
  readonly timestamp?: string;
  readonly verifierService?: string;
  readonly verifierEnvironment?: LeanEnvironment;
  readonly rawOutputHash?: string;
  readonly sorryAxDetected?: boolean;
  readonly exitCode?: number;
  readonly error?: string;
}

export type ZenodoUploadType =
  | 'publication'
  | 'poster'
  | 'presentation'
  | 'dataset'
  | 'image'
  | 'video'
  | 'software'
  | 'lesson'
  | 'other';

export type ZenodoPublicationType =
  | 'book'
  | 'section'
  | 'conferencepaper'
  | 'article'
  | 'patent'
  | 'preprint'
  | 'report'
  | 'softwaredocumentation'
  | 'thesis'
  | 'technicalnote'
  | 'workingpaper'
  | 'other';

export type ZenodoAccessRight = 'open' | 'embargoed' | 'restricted' | 'closed';

export interface ZenodoCreator {
  /** Format: "Family name, Given names" (e.g. "Aleinikov, Dmitry V.") */
  readonly name: string;
  readonly affiliation?: string;
  /** Format: "0000-0000-0000-0000" */
  readonly orcid?: string;
}

export interface ZenodoContributor {
  readonly name: string;
  readonly type: string;
  readonly affiliation?: string;
  readonly orcid?: string;
}

export interface ZenodoRelatedIdentifier {
  readonly identifier: string;
  readonly relation:
    | 'isSupplementTo'
    | 'isSupplementedBy'
    | 'cites'
    | 'isCitedBy'
    | 'isVersionOf'
    | 'hasVersion'
    | 'isPartOf'
    | 'hasPart'
    | string;
  readonly scheme: 'doi' | 'url' | 'arxiv' | 'handle' | 'urn' | string;
  readonly resource_type?: string;
}

export interface ZenodoDepositionMetadata {
  /** Required: Title of deposition */
  readonly title: string;
  /** Required: HTML or plain text description (min 3 chars) */
  readonly description: string;
  /** Required: Upload category */
  readonly upload_type: ZenodoUploadType;
  /** Required if upload_type is 'publication' */
  readonly publication_type?: ZenodoPublicationType;
  /** Required if upload_type is 'image' */
  readonly image_type?: string;
  /** Required: At least 1 creator in 'Family, Given' format */
  readonly creators: readonly ZenodoCreator[];
  /** Optional: Access right ('open' by default) */
  readonly access_right?: ZenodoAccessRight;
  /** Optional: Open license identifier (e.g. 'cc-by-4.0', 'apache-2.0', 'mit') */
  readonly license?: string;
  /** Optional: Publication date formatted as YYYY-MM-DD */
  readonly publication_date?: string;
  /** Optional: Descriptive keywords */
  readonly keywords?: readonly string[];
  /** Optional: Version string (e.g. '0.4.206' or 'v7.7') */
  readonly version?: string;
  /** Optional: Language code (e.g. 'eng', 'rus') */
  readonly language?: string;
  /** Optional: Related identifiers (DOIs, URLs, arXiv) */
  readonly related_identifiers?: readonly ZenodoRelatedIdentifier[];
  /** Optional: Contributors */
  readonly contributors?: readonly ZenodoContributor[];
  /** Optional: Bibliographic references */
  readonly references?: readonly string[];
  /** Optional: Internal or public notes */
  readonly notes?: string;
}

export interface ZenodoArchivalRecord {
  readonly environment: 'production' | 'sandbox';
  readonly depositionId: number | string;
  readonly conceptDoi: string;
  readonly versionDoi: string;
  readonly recordUrl: string;
  readonly packageSha256: string;
  readonly archivedAt: string;
}

export interface RICISEvidenceManifest {
  readonly manifestVersion: '1.0.0';
  readonly project: 'RICIS-III';
  readonly proofId: string;
  readonly ricisTaskId: string;
  readonly sourcePath: string;
  readonly sourceSha256: string;
  readonly environment: LeanEnvironment;
  readonly gitCommit: string;
  readonly verification: {
    readonly local: LocalVerificationResult;
    readonly independent: IndependentVerificationResult;
  };
  readonly status: ProofVerificationStatus;
  readonly zenodo?: ZenodoArchivalRecord;
  readonly auditMarker: AuditorMarker;
}

export interface EvidenceArchivalEligibility {
  readonly eligible: boolean;
  readonly failureCode?: EvidenceFailureCode;
  readonly reason?: string;
}

export interface VerificationPipelineRequest {
  readonly ricisTaskId: string;
  readonly proofId: string;
  readonly sourcePath: string;
  readonly sourceCode: string;
  readonly expectedEnvironment: LeanEnvironment;
  readonly gitCommit: string;
  readonly zenodoMetadata?: ZenodoDepositionMetadata;
  readonly useZenodoSandbox?: boolean;
}

export interface VerificationPipelineResult {
  readonly manifest: RICISEvidenceManifest;
  readonly success: boolean;
  readonly status: ProofVerificationStatus;
  readonly doi?: string;
  readonly conceptDoi?: string;
  readonly failureCode?: EvidenceFailureCode;
  readonly failureReason?: string;
}
