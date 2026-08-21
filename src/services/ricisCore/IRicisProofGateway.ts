import type { CoreExecutionFailure } from './IRicisCoreEngine';

/** Fixed v1 API version for server-owned Core proof snapshots. */
export const RICIS_PROOF_API_VERSION = 'v1' as const;

/** Allowlisted snapshot document formats exposed by the authoritative v1 transport. */
export type ProofDocumentFormat = 'Academic' | 'Json' | 'Latex' | 'Log' | 'Lean';

/** Core structural verification status; it is independent from Lean evidence. */
export type ProofStructuralVerification =
  | 'StructurallyVerified'
  | 'StructurallyNotVerified'
  | 'Rejected'
  | 'Unsupported';

/** Evidence status emitted only by the authoritative Core proof snapshot. */
export type ProofTrustStatus =
  | 'LeanVerified'
  | 'TrustedAxiom'
  | 'RequiresCoreLean'
  | 'StaticCheckPassed'
  | 'Hypothesis'
  | 'Rejected';

/** Bounded create request accepted by `POST /api/proofs/v1/runs`. */
export interface CreateProofRunRequest {
  readonly claim: string;
  readonly expected: string;
  readonly requestedFormats: readonly ProofDocumentFormat[];
}

/** Audit-safe trace data returned from the immutable Core snapshot. */
export interface ProofTraceEntry {
  readonly sequence: number;
  readonly timestampUtc: string;
  readonly severity: string;
  readonly eventCode: string;
  readonly stageType: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly beforeExpression: string | null;
  readonly afterExpression: string | null;
}

/** Descriptor of a pre-rendered document held by the same immutable proof snapshot. */
export interface ProofDocumentDescriptor {
  readonly format: ProofDocumentFormat;
  readonly contentHash: string;
}

/** Compact immutable proof run response actually emitted by Ricis.WebApi v1. */
export interface ProofRunResponse {
  readonly apiVersion: typeof RICIS_PROOF_API_VERSION;
  readonly proofRunId: string;
  readonly correlationId: string;
  readonly createdAtUtc: string;
  readonly expiresAtUtc: string;
  readonly coreVersion: string;
  readonly canonicalClaim: string;
  readonly normalizedClaim: string;
  readonly structuralVerification: ProofStructuralVerification;
  readonly trustStatus: ProofTrustStatus;
  readonly evidenceBoundaryResourceKey: string;
  readonly trace: readonly ProofTraceEntry[];
  readonly documents: readonly ProofDocumentDescriptor[];
}

/** Immutable pre-rendered document from the server-owned proof snapshot. */
export interface ProofDocumentResponse {
  readonly apiVersion: typeof RICIS_PROOF_API_VERSION;
  readonly proofRunId: string;
  readonly correlationId: string;
  readonly format: ProofDocumentFormat;
  readonly contentType: string;
  readonly content: string;
  readonly contentHash: string;
  readonly trustStatus: ProofTrustStatus;
  readonly evidenceBoundaryResourceKey: string;
}

/** Fixed capability response; this is transport metadata, never theorem authority. */
export interface ProofCapabilitiesResponse {
  readonly apiVersion: typeof RICIS_PROOF_API_VERSION;
  readonly scenarios: readonly string[];
  readonly formats: readonly ProofDocumentFormat[];
  readonly leanBoundaryResourceKey: string;
  readonly isDurableSnapshotStore: boolean;
}

/** Safe error payload returned by the v1 route without raw exception or input disclosure. */
export interface ProofApiErrorResponse {
  readonly apiVersion: typeof RICIS_PROOF_API_VERSION;
  readonly code: string;
  readonly messageResourceKey: string;
  readonly retryable: boolean;
  readonly safeParameters: Readonly<Record<string, string>>;
}

/**
 * Application port for authoritative Core proof snapshots. Its implementation
 * must use fixed v1 routes and must never call a TypeScript fallback engine.
 */
export interface IRicisProofGateway {
  createRun(request: CreateProofRunRequest): Promise<ProofRunResponse | CoreExecutionFailure>;
  getRun(proofRunId: string): Promise<ProofRunResponse | CoreExecutionFailure>;
  getDocument(proofRunId: string, format: ProofDocumentFormat): Promise<ProofDocumentResponse | CoreExecutionFailure>;
  getCapabilities(): Promise<ProofCapabilitiesResponse | CoreExecutionFailure>;
}

/** Narrows an authoritative proof transport failure without treating it as proof evidence. */
export function isProofGatewayFailure(
  result: ProofRunResponse | ProofDocumentResponse | ProofCapabilitiesResponse | CoreExecutionFailure,
): result is CoreExecutionFailure {
  return 'success' in result && result.success === false;
}
