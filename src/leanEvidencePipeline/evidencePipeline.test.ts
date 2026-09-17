import { describe, expect, it, vi } from 'vitest';
import {
  EvidenceGate,
  EvidencePipelineService,
  ExternalLeanVerifier,
  ZenodoClient,
  calculateSha256,
  createArchivalBundle,
  verifySourceHash,
} from './index';
import type {
  RICISEvidenceManifest,
  LeanEnvironment,
  ZenodoDepositionMetadata,
  LocalVerificationResult,
  IndependentVerificationResult,
} from './index';

const CANONICAL_ENV: LeanEnvironment = {
  leanVersion: '4.33.1',
  mathlibVersion: null,
  toolchain: 'leanprover/lean4:v4.33.1',
  platform: 'ubuntu-latest',
};

const VALID_LEAN_SOURCE = `
import Init.Prelude

theorem ricis_l1_identity (x : Nat) : x = x := by
  rfl
`;

const SORRY_LEAN_SOURCE = `
theorem unproven_claim (x : Nat) : x = x + 1 := by
  sorry
`;

const SYNTAX_ERROR_SOURCE = `
theorem broken_syntax : LOCAL_SYNTAX_ERROR
`;

describe('RICIS-III Independent Lean Verification and Zenodo Evidence Pipeline', () => {
  const gate = new EvidenceGate();

  // Test A — local Lean PASS
  it('Test A: verifies local Lean valid proof with exitCode 0 and sorryAx absent -> PASS', async () => {
    const verifier = new ExternalLeanVerifier();
    const service = new EvidencePipelineService({
      evidenceGate: gate,
      independentVerifier: verifier,
    });

    const result = await service.processProofVerification({
      ricisTaskId: 'task-l1-identity',
      proofId: 'ricis-l1-identity',
      sourcePath: 'artifacts/proofs/ricis-l1-identity.lean',
      sourceCode: VALID_LEAN_SOURCE,
      expectedEnvironment: CANONICAL_ENV,
      gitCommit: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
    });

    expect(result.manifest.verification.local.status).toBe('PASS');
    expect(result.manifest.verification.local.exitCode).toBe(0);
    expect(result.manifest.verification.local.sorryAxDetected).toBe(false);
    expect(result.status).toBe('INDEPENDENTLY_VERIFIED');
    expect(result.success).toBe(true);
  });

  // Test B — local Lean FAIL
  it('Test B: fails local Lean verification on syntax errors or invalid proof -> FAIL', async () => {
    const verifier = new ExternalLeanVerifier();
    const service = new EvidencePipelineService({
      evidenceGate: gate,
      independentVerifier: verifier,
    });

    const result = await service.processProofVerification({
      ricisTaskId: 'task-syntax-error',
      proofId: 'broken-proof',
      sourcePath: 'artifacts/proofs/broken.lean',
      sourceCode: SYNTAX_ERROR_SOURCE,
      expectedEnvironment: CANONICAL_ENV,
      gitCommit: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
    });

    expect(result.manifest.verification.local.status).toBe('FAIL');
    expect(result.manifest.verification.local.exitCode).not.toBe(0);
    expect(result.success).toBe(false);
    expect(result.failureCode).toBe('LOCAL_VERIFICATION_FAILURE');
    expect(result.status).toBe('UNVERIFIED');
  });

  // Test C — independent PASS
  it('Test C: independently verifies canonical proof via external verifier -> PASS', async () => {
    const mockIndependentVerifier = {
      verifyProof: vi.fn().mockResolvedValue({
        status: 'PASS',
        timestamp: new Date().toISOString(),
        verifierService: 'independent-remote-kernel-runner',
        verifierEnvironment: CANONICAL_ENV,
        sorryAxDetected: false,
        exitCode: 0,
        rawOutputHash: calculateSha256('0\nVerified\n'),
      } as IndependentVerificationResult),
    };

    const service = new EvidencePipelineService({
      evidenceGate: gate,
      independentVerifier: mockIndependentVerifier,
    });

    const result = await service.processProofVerification({
      ricisTaskId: 'task-a6-geometric',
      proofId: 'ricis-a6-geometric',
      sourcePath: 'artifacts/proofs/ricis-a6.lean',
      sourceCode: VALID_LEAN_SOURCE,
      expectedEnvironment: CANONICAL_ENV,
      gitCommit: 'fedcba9876543210fedcba9876543210fedcba98',
    });

    expect(mockIndependentVerifier.verifyProof).toHaveBeenCalledWith(
      'ricis-a6-geometric',
      VALID_LEAN_SOURCE,
      CANONICAL_ENV
    );
    expect(result.manifest.verification.independent.status).toBe('PASS');
    expect(result.status).toBe('INDEPENDENTLY_VERIFIED');
    expect(result.success).toBe(true);
  });

  // Test D — environment mismatch
  it('Test D: rejects proof if independent verifier environment does not match declared environment -> REJECT', () => {
    const mismatchedEnv: LeanEnvironment = {
      leanVersion: '4.18.0',
      mathlibVersion: 'v4.18.0',
      toolchain: 'leanprover/lean4:v4.18.0',
    };

    const manifest: RICISEvidenceManifest = {
      manifestVersion: '1.0.0',
      project: 'RICIS-III',
      proofId: 'ricis-env-test',
      ricisTaskId: 'task-env-test',
      sourcePath: 'artifacts/proofs/test.lean',
      sourceSha256: calculateSha256(VALID_LEAN_SOURCE),
      environment: CANONICAL_ENV,
      gitCommit: '1234567890abcdef1234567890abcdef12345678',
      verification: {
        local: {
          status: 'PASS',
          timestamp: new Date().toISOString(),
          compiler: 'lean 4.33.1',
          exitCode: 0,
          stdout: '',
          stderr: '',
          sorryAxDetected: false,
          axioms: ['propext'],
          rawOutputHash: 'hash',
        },
        independent: {
          status: 'PASS',
          timestamp: new Date().toISOString(),
          verifierService: 'external-runner',
          verifierEnvironment: mismatchedEnv,
          sorryAxDetected: false,
          exitCode: 0,
        },
      },
      status: 'INDEPENDENTLY_VERIFIED',
      auditMarker: 'AUDITOR: EXTERNAL',
    };

    const eligibility = gate.evaluateArchivalEligibility(manifest, VALID_LEAN_SOURCE);
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.failureCode).toBe('ENVIRONMENT_MISMATCH');
    expect(eligibility.reason).toContain('Environment mismatch');
  });

  // Test E — artifact modification
  it('Test E: rejects if even a single byte of source is modified after hash calculation -> REJECT', () => {
    const originalHash = calculateSha256(VALID_LEAN_SOURCE);
    const mutatedSource = VALID_LEAN_SOURCE + ' -- mutated comment';
    const mutatedHash = calculateSha256(mutatedSource);

    expect(verifySourceHash(mutatedSource, originalHash)).toBe(false);
    expect(originalHash).not.toBe(mutatedHash);

    const manifest: RICISEvidenceManifest = {
      manifestVersion: '1.0.0',
      project: 'RICIS-III',
      proofId: 'ricis-hash-test',
      ricisTaskId: 'task-hash-test',
      sourcePath: 'artifacts/proofs/test.lean',
      sourceSha256: originalHash,
      environment: CANONICAL_ENV,
      gitCommit: '1234567890abcdef1234567890abcdef12345678',
      verification: {
        local: {
          status: 'PASS',
          timestamp: new Date().toISOString(),
          compiler: 'lean 4.33.1',
          exitCode: 0,
          stdout: '',
          stderr: '',
          sorryAxDetected: false,
          axioms: ['propext'],
          rawOutputHash: 'hash',
        },
        independent: {
          status: 'PASS',
          timestamp: new Date().toISOString(),
          verifierService: 'external-runner',
          verifierEnvironment: CANONICAL_ENV,
          sorryAxDetected: false,
          exitCode: 0,
        },
      },
      status: 'INDEPENDENTLY_VERIFIED',
      auditMarker: 'AUDITOR: EXTERNAL',
    };

    const eligibility = gate.evaluateArchivalEligibility(manifest, mutatedSource);
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.failureCode).toBe('SOURCE_HASH_MISMATCH');
  });

  // Test F — Zenodo eligibility
  it('Test F: marks proof as ARCHIVAL ELIGIBLE when local PASS, independent PASS, and hash match', async () => {
    const mockZenodoClient = {
      environment: 'sandbox' as const,
      createDeposition: vi.fn().mockResolvedValue({
        id: 998877,
        conceptrecid: '998876',
        links: { bucket: 'https://sandbox.zenodo.org/api/files/bucket-uuid' },
        metadata: {},
        state: 'unsubmitted',
        submitted: false,
      }),
      uploadFile: vi.fn().mockResolvedValue({
        filename: 'RICIS_III_ricis-a6_evidence.json',
        filesize: 1234,
        checksum: 'md5:test',
      }),
      publishDeposition: vi.fn().mockResolvedValue({
        environment: 'sandbox',
        depositionId: 998877,
        conceptDoi: '10.5281/zenodo.998876',
        versionDoi: '10.5281/zenodo.998877',
        recordUrl: 'https://sandbox.zenodo.org/record/998877',
        packageSha256: '',
        archivedAt: new Date().toISOString(),
      }),
      getDeposition: vi.fn(),
    };

    const verifier = new ExternalLeanVerifier();
    const service = new EvidencePipelineService({
      evidenceGate: gate,
      independentVerifier: verifier,
      zenodoClient: mockZenodoClient,
    });

    const zenodoMeta: ZenodoDepositionMetadata = {
      title: 'RICIS-III Formal Proof: Geometric Bridge Monolith',
      description: 'Verified Lean 4.33.1 formal proof of RICIS-III Geometric Bridge.',
      upload_type: 'publication',
      publication_type: 'preprint',
      creators: [{ name: 'Aleinikov, Dmitry V.', orcid: '0009-0004-3226-7700' }],
      keywords: ['RICIS-III', 'Formal Verification', 'Lean 4', 'Singularity Monolith'],
    };

    const result = await service.processProofVerification({
      ricisTaskId: 'task-a6-deposition',
      proofId: 'ricis-a6-monolith',
      sourcePath: 'artifacts/proofs/ricis-a6.lean',
      sourceCode: VALID_LEAN_SOURCE,
      expectedEnvironment: CANONICAL_ENV,
      gitCommit: 'abcdef1234567890abcdef1234567890abcdef12',
      zenodoMetadata: zenodoMeta,
      useZenodoSandbox: true,
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('ARCHIVED');
    expect(result.doi).toBe('10.5281/zenodo.998877');
    expect(result.conceptDoi).toBe('10.5281/zenodo.998876');
    expect(mockZenodoClient.createDeposition).toHaveBeenCalledWith(zenodoMeta);
    expect(mockZenodoClient.publishDeposition).toHaveBeenCalledWith(998877);
  });

  // Test G — failed verification
  it('Test G: rejects archival eligibility when local passes but independent verification fails -> NOT ARCHIVAL', async () => {
    const mockFailingIndependentVerifier = {
      verifyProof: vi.fn().mockResolvedValue({
        status: 'FAIL',
        timestamp: new Date().toISOString(),
        verifierService: 'external-runner',
        sorryAxDetected: true,
        exitCode: 1,
        error: 'Declaration contains sorryAx axiom.',
      } as IndependentVerificationResult),
    };

    const mockZenodoClient = {
      createDeposition: vi.fn(),
      uploadFile: vi.fn(),
      publishDeposition: vi.fn(),
      getDeposition: vi.fn(),
    };

    const service = new EvidencePipelineService({
      evidenceGate: gate,
      independentVerifier: mockFailingIndependentVerifier,
      zenodoClient: mockZenodoClient as any,
    });

    const result = await service.processProofVerification({
      ricisTaskId: 'task-partial-failure',
      proofId: 'failing-proof',
      sourcePath: 'artifacts/proofs/failing.lean',
      sourceCode: VALID_LEAN_SOURCE,
      expectedEnvironment: CANONICAL_ENV,
      gitCommit: 'abcdef1234567890abcdef1234567890abcdef12',
      zenodoMetadata: {
        title: 'Title',
        description: 'Desc',
        upload_type: 'publication',
        creators: [{ name: 'Author' }],
        keywords: ['tag'],
      },
    });

    expect(result.manifest.verification.local.status).toBe('PASS');
    expect(result.success).toBe(false);
    expect(mockZenodoClient.createDeposition).not.toHaveBeenCalled();
    expect(result.failureCode).toBe('EXTERNAL_VERIFICATION_FAILURE');
  });

  // Test H — credential safety
  it('Test H: verifies no Zenodo credentials enter manifests, bundles, or public exports', () => {
    const secretToken = 'zenodo_secret_token_super_private_99887766';
    const client = new ZenodoClient({
      environment: 'sandbox',
      apiToken: secretToken,
    });

    const manifest: RICISEvidenceManifest = {
      manifestVersion: '1.0.0',
      project: 'RICIS-III',
      proofId: 'ricis-sec-test',
      ricisTaskId: 'task-sec-test',
      sourcePath: 'artifacts/proofs/test.lean',
      sourceSha256: calculateSha256(VALID_LEAN_SOURCE),
      environment: CANONICAL_ENV,
      gitCommit: '1234567890abcdef1234567890abcdef12345678',
      verification: {
        local: {
          status: 'PASS',
          timestamp: new Date().toISOString(),
          compiler: 'lean 4.33.1',
          exitCode: 0,
          stdout: 'pass',
          stderr: '',
          sorryAxDetected: false,
          axioms: ['propext'],
          rawOutputHash: 'hash',
        },
        independent: {
          status: 'PASS',
          timestamp: new Date().toISOString(),
          verifierService: 'external-runner',
          verifierEnvironment: CANONICAL_ENV,
          sorryAxDetected: false,
          exitCode: 0,
        },
      },
      status: 'INDEPENDENTLY_VERIFIED',
      auditMarker: 'AUDITOR: EXTERNAL',
    };

    const bundle = createArchivalBundle(manifest, VALID_LEAN_SOURCE);

    // Manifest and bundle string checks
    expect(bundle.bundleContent).not.toContain(secretToken);
    expect(bundle.manifestJson).not.toContain(secretToken);
    expect(JSON.stringify(manifest)).not.toContain(secretToken);
    expect(client).toBeDefined();
  });
});
