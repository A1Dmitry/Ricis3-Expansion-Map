import type {
  CoreExecutionFailure,
  CoreRecoveryCode,
  CoreRecoveryDiagnostic,
} from './IRicisCoreEngine';
import {
  RICIS_PROOF_API_VERSION,
  type CreateProofRunRequest,
  type IRicisProofGateway,
  type ProofApiErrorResponse,
  type ProofCapabilitiesResponse,
  type ProofDocumentFormat,
  type ProofDocumentResponse,
  type ProofRunResponse,
  type ProofStructuralVerification,
  type ProofTraceEntry,
  type ProofTrustStatus,
} from './IRicisProofGateway';
import { ricisCoreApiUrl, resolveRicisCoreApiEndpoint, type RicisCoreApiEndpoint } from './coreEndpoint';

const ALLOWED_FORMATS = new Set<ProofDocumentFormat>(['Academic', 'Json', 'Latex', 'Log', 'Lean']);
const STRUCTURAL_VERIFICATIONS = new Set<ProofStructuralVerification>([
  'StructurallyVerified',
  'StructurallyNotVerified',
  'Rejected',
  'Unsupported',
]);
const TRUST_STATUSES = new Set<ProofTrustStatus>([
  'LeanVerified',
  'TrustedAxiom',
  'RequiresCoreLean',
  'StaticCheckPassed',
  'Hypothesis',
  'Rejected',
]);
const PROOF_RUN_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type EndpointResolver = () => RicisCoreApiEndpoint;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isStringRecord(value: unknown): value is Readonly<Record<string, string>> {
  return isRecord(value) && Object.values(value).every(isString);
}

function isProofFormat(value: unknown): value is ProofDocumentFormat {
  return isString(value) && ALLOWED_FORMATS.has(value as ProofDocumentFormat);
}

function isTraceEntry(value: unknown): value is ProofTraceEntry {
  return isRecord(value) &&
    typeof value.sequence === 'number' && Number.isInteger(value.sequence) &&
    isString(value.timestampUtc) && isString(value.severity) && isString(value.eventCode) && isString(value.stageType) &&
    isStringRecord(value.attributes) &&
    (value.beforeExpression === null || isString(value.beforeExpression)) &&
    (value.afterExpression === null || isString(value.afterExpression));
}

function isProofRunResponse(value: unknown): value is ProofRunResponse {
  if (!isRecord(value)) return false;
  return value.apiVersion === RICIS_PROOF_API_VERSION &&
    isString(value.proofRunId) && PROOF_RUN_ID.test(value.proofRunId) &&
    isString(value.correlationId) && isString(value.createdAtUtc) && isString(value.expiresAtUtc) && isString(value.coreVersion) &&
    isString(value.canonicalClaim) && isString(value.normalizedClaim) &&
    isString(value.structuralVerification) && STRUCTURAL_VERIFICATIONS.has(value.structuralVerification as ProofStructuralVerification) &&
    isString(value.trustStatus) && TRUST_STATUSES.has(value.trustStatus as ProofTrustStatus) &&
    isString(value.evidenceBoundaryResourceKey) &&
    Array.isArray(value.trace) && value.trace.every(isTraceEntry) &&
    Array.isArray(value.documents) && value.documents.every(document => isRecord(document) && isProofFormat(document.format) && isString(document.contentHash));
}

function isProofDocumentResponse(value: unknown): value is ProofDocumentResponse {
  return isRecord(value) &&
    value.apiVersion === RICIS_PROOF_API_VERSION &&
    isString(value.proofRunId) && PROOF_RUN_ID.test(value.proofRunId) &&
    isString(value.correlationId) && isProofFormat(value.format) && isString(value.contentType) && isString(value.content) &&
    isString(value.contentHash) && isString(value.trustStatus) && TRUST_STATUSES.has(value.trustStatus as ProofTrustStatus) &&
    isString(value.evidenceBoundaryResourceKey);
}

function isCapabilitiesResponse(value: unknown): value is ProofCapabilitiesResponse {
  return isRecord(value) &&
    value.apiVersion === RICIS_PROOF_API_VERSION &&
    Array.isArray(value.scenarios) && value.scenarios.every(isString) &&
    Array.isArray(value.formats) && value.formats.every(isProofFormat) &&
    isString(value.leanBoundaryResourceKey) && typeof value.isDurableSnapshotStore === 'boolean';
}

function isProofApiError(value: unknown): value is ProofApiErrorResponse {
  return isRecord(value) &&
    value.apiVersion === RICIS_PROOF_API_VERSION && isString(value.code) && isString(value.messageResourceKey) &&
    typeof value.retryable === 'boolean' && isStringRecord(value.safeParameters);
}

/** Fixed-route HTTP transport for immutable, authoritative Ricis.Core proof snapshots. */
export class CoreProofHttpGateway implements IRicisProofGateway {
  public constructor(
    private readonly endpointResolver: EndpointResolver = resolveRicisCoreApiEndpoint,
    private readonly fetcher: FetchLike = (input, init) => fetch(input, init),
  ) {}

  public async createRun(request: CreateProofRunRequest): Promise<ProofRunResponse | CoreExecutionFailure> {
    if (!this.isValidCreateRequest(request)) return this.failure('CORE_INPUT_REJECTED');
    return this.request('proofs/v1/runs', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ apiVersion: RICIS_PROOF_API_VERSION, ...request }),
      signal: AbortSignal.timeout(15_000),
    }, isProofRunResponse);
  }

  public async getRun(proofRunId: string): Promise<ProofRunResponse | CoreExecutionFailure> {
    if (!this.isProofRunId(proofRunId)) return this.failure('CORE_INPUT_REJECTED');
    return this.request(`proofs/v1/runs/${proofRunId}`, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    }, isProofRunResponse);
  }

  public async getDocument(proofRunId: string, format: ProofDocumentFormat): Promise<ProofDocumentResponse | CoreExecutionFailure> {
    if (!this.isProofRunId(proofRunId) || !isProofFormat(format)) return this.failure('CORE_INPUT_REJECTED');
    return this.request(`proofs/v1/runs/${proofRunId}/documents/${format}`, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    }, isProofDocumentResponse);
  }

  public async getCapabilities(): Promise<ProofCapabilitiesResponse | CoreExecutionFailure> {
    return this.request('proofs/v1/capabilities', {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    }, isCapabilitiesResponse);
  }

  private isValidCreateRequest(request: CreateProofRunRequest): boolean {
    return isString(request.claim) && request.claim.trim().length > 0 && request.claim.length <= 4096 &&
      isString(request.expected) && request.expected.trim().length > 0 && request.expected.length <= 4096 &&
      Array.isArray(request.requestedFormats) && request.requestedFormats.length > 0 &&
      request.requestedFormats.every(isProofFormat) && new Set(request.requestedFormats).size === request.requestedFormats.length;
  }

  private isProofRunId(value: string): boolean {
    return isString(value) && PROOF_RUN_ID.test(value);
  }

  private async request<T>(
    path: string,
    init: RequestInit,
    isValidPayload: (value: unknown) => value is T,
  ): Promise<T | CoreExecutionFailure> {
    const endpoint = this.endpointResolver();
    const url = ricisCoreApiUrl(endpoint, path);
    if (!url) return this.failure('CORE_INFRASTRUCTURE_ERROR', endpoint.safeDetail);

    try {
      const response = await this.fetcher(url, init);
      const payload = await this.readJson(response);
      if (!response.ok) {
        return this.failureFromResponse(response.status, payload);
      }
      return isValidPayload(payload) ? payload : this.failure('CORE_INVALID_RESPONSE', undefined, response.status);
    } catch {
      return this.failure('CORE_INFRASTRUCTURE_ERROR');
    }
  }

  private async readJson(response: Response): Promise<unknown> {
    try {
      return await response.json() as unknown;
    } catch {
      return null;
    }
  }

  private failureFromResponse(status: number, payload: unknown): CoreExecutionFailure {
    if (isProofApiError(payload)) {
      return this.failure(
        status >= 500 ? 'CORE_INFRASTRUCTURE_ERROR' : 'CORE_INPUT_REJECTED',
        payload.messageResourceKey,
        status,
        payload.retryable,
      );
    }
    return this.failure(status >= 500 ? 'CORE_INFRASTRUCTURE_ERROR' : 'CORE_INVALID_RESPONSE', undefined, status);
  }

  private failure(
    code: CoreRecoveryCode,
    safeDetail?: string,
    httpStatus?: number,
    retryable = code === 'CORE_INFRASTRUCTURE_ERROR',
  ): CoreExecutionFailure {
    const diagnostic: CoreRecoveryDiagnostic = {
      origin: 'proof_console',
      runtime: 'csharp_api',
      retryable,
      httpStatus,
      safeDetail,
      occurredAt: Date.now(),
    };
    return {
      success: false,
      code,
      userMessage: `proof.core.gateway.${code}`,
      diagnostic,
    };
  }
}
