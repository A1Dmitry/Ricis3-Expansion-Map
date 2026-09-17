import type {
  RICISEvidenceManifest,
  EvidenceArchivalEligibility,
  ProofVerificationStatus,
  LeanEnvironment,
} from './types';
import { calculateSha256 } from './hashBinding';

export interface IEvidenceGate {
  evaluateArchivalEligibility(
    manifest: RICISEvidenceManifest,
    sourceContent?: string
  ): EvidenceArchivalEligibility;
  deriveEffectiveStatus(manifest: RICISEvidenceManifest): ProofVerificationStatus;
}

export class EvidenceGate implements IEvidenceGate {
  /**
   * Deterministic evaluation of archival eligibility (Task §9):
   *
   * IF local verification == PASS
   * AND independent verification == PASS
   * AND !sorryAxDetected
   * AND sourceSha256 == hash(sourceContent)
   * AND gitCommit is non-empty
   * AND environment matches
   * THEN artifact MAY be archived
   * ELSE artifact MUST NOT be presented as verified evidence
   */
  evaluateArchivalEligibility(
    manifest: RICISEvidenceManifest,
    sourceContent?: string
  ): EvidenceArchivalEligibility {
    // 1. Git commit presence
    if (!manifest.gitCommit || manifest.gitCommit.trim() === '' || manifest.gitCommit === 'UNCOMMITTED') {
      return {
        eligible: false,
        failureCode: 'GIT_COMMIT_MISMATCH',
        reason: 'Git commit hash is missing or uncommitted; evidence must be bound to an immutable commit.',
      };
    }

    // 2. Local verification check
    if (manifest.verification.local.status !== 'PASS' || manifest.verification.local.exitCode !== 0) {
      return {
        eligible: false,
        failureCode: 'LOCAL_VERIFICATION_FAILURE',
        reason: `Local Lean kernel verification failed with exit code ${manifest.verification.local.exitCode}`,
      };
    }

    // 3. Local sorryAx check
    if (manifest.verification.local.sorryAxDetected) {
      return {
        eligible: false,
        failureCode: 'SORRY_AX_DETECTED',
        reason: 'Local proof contains sorry / sorryAx axiom, which invalidates formal completeness.',
      };
    }

    // 4. Independent external verification check
    if (manifest.verification.independent.status !== 'PASS') {
      return {
        eligible: false,
        failureCode: 'EXTERNAL_VERIFICATION_FAILURE',
        reason: `Independent external Lean verification status is ${manifest.verification.independent.status} (required: PASS)`,
      };
    }

    // 5. Independent sorryAx check
    if (manifest.verification.independent.sorryAxDetected) {
      return {
        eligible: false,
        failureCode: 'SORRY_AX_DETECTED',
        reason: 'Independent verification detected sorry / sorryAx axiom.',
      };
    }

    // 6. Environment consistency check
    if (manifest.verification.independent.verifierEnvironment) {
      const isEnvMatch = this.compareEnvironments(
        manifest.environment,
        manifest.verification.independent.verifierEnvironment
      );
      if (!isEnvMatch) {
        return {
          eligible: false,
          failureCode: 'ENVIRONMENT_MISMATCH',
          reason: `Environment mismatch between declared (${manifest.environment.toolchain}) and verifier (${manifest.verification.independent.verifierEnvironment.toolchain})`,
        };
      }
    }

    // 7. Cryptographic hash check if source is provided
    if (sourceContent !== undefined) {
      const computedHash = calculateSha256(sourceContent);
      if (computedHash.toLowerCase() !== manifest.sourceSha256.toLowerCase()) {
        return {
          eligible: false,
          failureCode: 'SOURCE_HASH_MISMATCH',
          reason: `Source content SHA-256 (${computedHash}) does not match manifest SHA-256 (${manifest.sourceSha256})`,
        };
      }
    }

    return { eligible: true };
  }

  /**
   * Evaluates the legitimate verification state of the manifest without trusting self-claims.
   */
  deriveEffectiveStatus(manifest: RICISEvidenceManifest): ProofVerificationStatus {
    const isLocalPass =
      manifest.verification.local.status === 'PASS' &&
      manifest.verification.local.exitCode === 0 &&
      !manifest.verification.local.sorryAxDetected;

    const isIndependentPass =
      isLocalPass &&
      manifest.verification.independent.status === 'PASS' &&
      !manifest.verification.independent.sorryAxDetected;

    const isArchived =
      isIndependentPass &&
      Boolean(manifest.zenodo?.versionDoi) &&
      Boolean(manifest.zenodo?.depositionId);

    if (isArchived) return 'ARCHIVED';
    if (isIndependentPass) return 'INDEPENDENTLY_VERIFIED';
    if (isLocalPass) return 'LOCAL_VERIFIED';
    return 'UNVERIFIED';
  }

  private compareEnvironments(a: LeanEnvironment, b: LeanEnvironment): boolean {
    const leanMatch = a.leanVersion.trim().toLowerCase() === b.leanVersion.trim().toLowerCase();
    const mathlibMatch = (a.mathlibVersion ?? null) === (b.mathlibVersion ?? null);
    return leanMatch && mathlibMatch;
  }
}
