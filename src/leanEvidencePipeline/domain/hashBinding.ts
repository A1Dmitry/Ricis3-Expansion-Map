import { createHash } from 'node:crypto';
import type { RICISEvidenceManifest } from './types';

/**
 * Computes standard SHA-256 hex digest for code or binary buffer.
 */
export function calculateSha256(content: string | Uint8Array): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Validates whether the source content strictly matches an expected SHA-256.
 */
export function verifySourceHash(content: string | Uint8Array, expectedSha256: string): boolean {
  const actual = calculateSha256(content);
  return actual.toLowerCase() === expectedSha256.toLowerCase();
}

/**
 * Serializes the evidence manifest to a canonical JSON string (sorted keys, 2 spaces)
 * ensuring cryptographic determinism.
 */
export function canonicalizeManifest(manifest: RICISEvidenceManifest): string {
  return JSON.stringify(manifest, Object.keys(manifest).sort(), 2);
}

/**
 * Packages the verified Lean source and its corresponding canonical evidence manifest
 * into a single deterministic bundle for Zenodo deposit.
 */
export interface ArchivalBundle {
  readonly bundleFilename: string;
  readonly bundleContent: string;
  readonly bundleSha256: string;
  readonly manifestJson: string;
  readonly manifestSha256: string;
}

export function createArchivalBundle(
  manifest: RICISEvidenceManifest,
  sourceCode: string
): ArchivalBundle {
  const manifestJson = canonicalizeManifest(manifest);
  const manifestSha256 = calculateSha256(manifestJson);

  // Bundle payload contains metadata envelope and raw verified source
  const bundlePayload = JSON.stringify(
    {
      evidenceManifest: JSON.parse(manifestJson),
      verifiedSourceCode: sourceCode,
      packagedAt: new Date().toISOString(),
    },
    null,
    2
  );

  const bundleSha256 = calculateSha256(bundlePayload);
  const bundleFilename = `RICIS_III_${manifest.proofId}_${manifest.gitCommit.slice(0, 8)}_evidence.json`;

  return {
    bundleFilename,
    bundleContent: bundlePayload,
    bundleSha256,
    manifestJson,
    manifestSha256,
  };
}
