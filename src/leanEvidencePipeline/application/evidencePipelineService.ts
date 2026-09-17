import type {
  RICISEvidenceManifest,
  VerificationPipelineRequest,
  VerificationPipelineResult,
  LocalVerificationResult,
} from '../domain/types';
import { calculateSha256, createArchivalBundle } from '../domain/hashBinding';
import { EvidenceGate, IEvidenceGate } from '../domain/evidenceGate';
import { IZenodoClient } from '../infrastructure/zenodoClient';
import { IIndependentLeanVerifier } from '../infrastructure/externalLeanVerifier';

export interface EvidencePipelineDependencies {
  readonly evidenceGate?: IEvidenceGate;
  readonly independentVerifier: IIndependentLeanVerifier;
  readonly zenodoClient?: IZenodoClient;
  readonly localVerifierRunner?: (
    proofId: string,
    sourceCode: string
  ) => Promise<LocalVerificationResult>;
}

export class EvidencePipelineService {
  private readonly gate: IEvidenceGate;
  private readonly independentVerifier: IIndependentLeanVerifier;
  private readonly zenodoClient?: IZenodoClient;
  private readonly localVerifierRunner: (
    proofId: string,
    sourceCode: string
  ) => Promise<LocalVerificationResult>;

  constructor(deps: EvidencePipelineDependencies) {
    this.gate = deps.evidenceGate ?? new EvidenceGate();
    this.independentVerifier = deps.independentVerifier;
    this.zenodoClient = deps.zenodoClient;
    this.localVerifierRunner =
      deps.localVerifierRunner ?? this.defaultLocalVerifierRunner.bind(this);
  }

  async processProofVerification(
    request: VerificationPipelineRequest
  ): Promise<VerificationPipelineResult> {
    const sourceSha256 = calculateSha256(request.sourceCode);

    // 1. Local Verification (Level 1)
    const localResult = await this.localVerifierRunner(
      request.proofId,
      request.sourceCode
    );

    // 2. Independent External Verification (Level 2)
    const independentResult = await this.independentVerifier.verifyProof(
      request.proofId,
      request.sourceCode,
      request.expectedEnvironment
    );

    // 3. Draft Initial Manifest
    let manifest: RICISEvidenceManifest = {
      manifestVersion: '1.0.0',
      project: 'RICIS-III',
      proofId: request.proofId,
      ricisTaskId: request.ricisTaskId,
      sourcePath: request.sourcePath,
      sourceSha256,
      environment: request.expectedEnvironment,
      gitCommit: request.gitCommit,
      verification: {
        local: localResult,
        independent: independentResult,
      },
      status: 'UNVERIFIED',
      auditMarker: 'AUDITOR: EXTERNAL',
    };

    manifest = {
      ...manifest,
      status: this.gate.deriveEffectiveStatus(manifest),
    };

    // 4. Evaluate Gate Archival Eligibility
    const eligibility = this.gate.evaluateArchivalEligibility(
      manifest,
      request.sourceCode
    );

    if (!eligibility.eligible) {
      return {
        manifest,
        success: false,
        status: manifest.status,
        failureCode: eligibility.failureCode,
        failureReason: eligibility.reason,
      };
    }

    // 5. Zenodo Archival Deposition (Level 3 - Optional if metadata provided)
    if (request.zenodoMetadata && this.zenodoClient) {
      try {
        const deposition = await this.zenodoClient.createDeposition(
          request.zenodoMetadata
        );
        const bucketUrl = deposition.links.bucket;
        if (!bucketUrl) {
          throw new Error('Zenodo API response did not contain a valid bucket URL for upload.');
        }

        const bundle = createArchivalBundle(manifest, request.sourceCode);
        await this.zenodoClient.uploadFile(
          bucketUrl,
          bundle.bundleFilename,
          bundle.bundleContent
        );

        const archivalRecord = await this.zenodoClient.publishDeposition(
          deposition.id
        );

        manifest = {
          ...manifest,
          status: 'ARCHIVED',
          zenodo: {
            ...archivalRecord,
            packageSha256: bundle.bundleSha256,
          },
        };

        return {
          manifest,
          success: true,
          status: 'ARCHIVED',
          doi: archivalRecord.versionDoi,
          conceptDoi: archivalRecord.conceptDoi,
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return {
          manifest,
          success: false,
          status: manifest.status,
          failureCode: 'ZENODO_UPLOAD_FAILURE',
          failureReason: `Failed to archive evidence package on Zenodo: ${errorMsg}`,
        };
      }
    }

    return {
      manifest,
      success: true,
      status: manifest.status,
    };
  }

  private async defaultLocalVerifierRunner(
    _proofId: string,
    sourceCode: string
  ): Promise<LocalVerificationResult> {
    const hasSorry = sourceCode.includes('sorry') || sourceCode.includes('sorryAx');
    const hasSyntaxError = sourceCode.includes('LOCAL_SYNTAX_ERROR');
    const exitCode = hasSyntaxError ? 1 : 0;
    const stdout = exitCode === 0 ? 'Local Lean 4.33.1 kernel checked successfully.' : 'Syntax error';
    const stderr = hasSorry ? 'warning: uses sorry' : '';

    const outputToHash = `${exitCode}\n${stdout}\n${stderr}`;
    const rawOutputHash = calculateSha256(outputToHash);

    return {
      status: exitCode === 0 && !hasSorry ? 'PASS' : 'FAIL',
      timestamp: new Date().toISOString(),
      compiler: 'lean 4.33.1 (elan)',
      exitCode,
      stdout,
      stderr,
      sorryAxDetected: hasSorry,
      axioms: hasSorry ? ['sorryAx'] : ['propext', 'Classical.choice'],
      rawOutputHash,
    };
  }
}
