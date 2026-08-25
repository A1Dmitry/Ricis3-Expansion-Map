export type Fingerprint = `sha256:v1:${string}`;

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

type WorkflowBasis =
  | 'RICIS_III_SOLVED'
  | 'LEAN_KERNEL_VERIFIED'
  | 'HUMAN_CONFIRMED_NON_KERNEL'
  | 'REQUIRES_CORE_LEAN'
  | 'LOCAL_DIAGNOSTIC_ONLY'
  | 'HOSTED_ADVISORY_ONLY';

type VerificationObservationStatus =
  | 'LOCAL_DIAGNOSTIC_ONLY'
  | 'INCONCLUSIVE'
  | 'REQUIRES_CORE_LEAN'
  | 'HOSTED_ADVISORY_ONLY'
  | 'KERNEL_EVIDENCE_REJECTED';

type RecordResult<T> =
  | { readonly accepted: true; readonly value: T }
  | { readonly accepted: false; readonly reason: string; readonly observation?: VerificationObservation };

export interface LeanSourceVersion {
  readonly kind: 'LEAN_SOURCE_VERSION';
  readonly fingerprint: Fingerprint;
  readonly sourceName: string;
  readonly sourceBytes: Uint8Array;
  readonly byteLength: number;
  readonly parentFingerprint?: Fingerprint;
  readonly idempotencyKey: string;
}

export interface VerificationObservation {
  readonly kind: 'LEAN_VERIFICATION_OBSERVATION';
  readonly fingerprint: Fingerprint;
  readonly status: VerificationObservationStatus;
  readonly reason: string;
  readonly authority: 'LOCAL' | 'HOSTED' | 'UNAVAILABLE' | 'MANUAL' | 'KERNEL_CANDIDATE';
}

export interface StateTransitionProposal {
  readonly kind: 'STATE_TRANSITION_PROPOSAL';
  readonly id: string;
  readonly nodeId: string;
  readonly priorState: string;
  readonly proposedState: string;
  readonly sourceFingerprint: Fingerprint;
  readonly evidenceFingerprint?: Fingerprint;
  readonly effective: false;
}

export interface HumanLeanEvidenceDecision {
  readonly kind: 'HUMAN_LEAN_EVIDENCE_DECISION';
  readonly proposalId: string;
  readonly sourceFingerprint: Fingerprint;
  readonly evidenceFingerprint: Fingerprint;
  readonly actorId: string;
  readonly decision: 'keep' | 'defer' | 'accept' | 'demote';
}

export interface KernelEvidenceFact {
  readonly kind: 'KERNEL_EVIDENCE_FACT';
  readonly sourceFingerprint: Fingerprint;
  readonly toolchain: string;
  readonly command: string;
  readonly compilerOutput: string;
  readonly axiomReport: string;
  readonly runnerIdentity: string;
  readonly signature: string;
  readonly imageOrLock: string;
}

export interface AgentCompetenceConflict {
  readonly kind: 'AGENT_COMPETENCE_CONFLICT';
  readonly advisoryFingerprint: Fingerprint;
  readonly kernelFingerprint: Fingerprint;
  readonly competenceState: 'TRAINING_REQUIRED';
  readonly effective: false;
}

export interface RicisLeanVerificationPort {
  readonly providerId: string;
  verify(request: ProviderRequest): ProviderResponse;
}

export interface RicisVerificationHandoffPort {
  readonly providerId: 'manual-lean-web';
  createHandoff(request: PopupHandoffRequest): RecordResult<ManualHandoff>;
}

interface ProviderRequest {
  readonly sourceFingerprint: Fingerprint;
  readonly statementFingerprint: Fingerprint;
  readonly environmentFingerprint: Fingerprint;
  readonly explicitUploadConsent: boolean;
  readonly permittedSorries: boolean;
  readonly ignoreImports: boolean;
}

interface ProviderResponse {
  readonly providerId: string;
  readonly status: 'SUPPORTIVE' | 'INCONCLUSIVE' | 'FAILED';
  readonly sourceFingerprint?: Fingerprint;
  readonly processedSourceFingerprint?: Fingerprint;
  readonly signature?: string;
}

interface PopupHandoffRequest {
  readonly sourceFingerprint?: Fingerprint;
  readonly requestedMode?: 'copy-and-open-clean' | 'prefill';
  readonly explicitUrlExposureConsent?: boolean;
  readonly userGesture?: boolean;
  readonly destination?: string;
}

interface ManualHandoff {
  readonly kind: 'MANUAL_LEAN_WEB_HANDOFF';
  readonly mode: 'COPY_AND_OPEN_CLEAN' | 'PREFILL';
  readonly sourceFingerprint: Fingerprint;
  readonly authority: 'MANUAL_DIAGNOSTIC_ONLY';
}

const sourceByIdempotency = new Map<string, LeanSourceVersion>();
const proposalByIdempotency = new Map<string, StateTransitionProposal>();

const PROVIDER_ORDER = [
  'SourceHashGuard',
  'ExplicitConsentGuard',
  'BoundedRequestGuard',
  'ProviderAdapter',
  'ResultNormalizer',
  'AppendOnlyObservationRecorder',
] as const;

const emptyTopology = (): readonly string[] => [];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isFingerprint(value: unknown): value is Fingerprint {
  return isString(value) && /^sha256:v1:[a-f0-9]{64}$/.test(value);
}

function cloneBytes(value: Uint8Array): Uint8Array {
  return new Uint8Array(value);
}

function asFingerprintFromBytes(bytes: Uint8Array): Fingerprint {
  return `sha256:v1:${sha256Hex(bytes)}`;
}

function rejected(reason: string, observation?: VerificationObservation): RecordResult<never> {
  return observation === undefined ? { accepted: false, reason } : { accepted: false, reason, observation };
}

function accepted<T>(value: T): RecordResult<T> {
  return { accepted: true, value };
}

/**
 * Pure SHA-256 so browser-side capture can disclose exact bytes without Node, a service,
 * a provider SDK, network access or a trust claim. A fingerprint identifies bytes only.
 */
function sha256Hex(input: Uint8Array): string {
  const values = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const constants = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);
  const bitLength = input.length * 8;
  const paddedLength = Math.ceil((input.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(input);
  padded[input.length] = 0x80;
  const lengthView = new DataView(padded.buffer);
  lengthView.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);
  lengthView.setUint32(paddedLength - 4, bitLength >>> 0, false);
  const words = new Uint32Array(64);
  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index += 1) words[index] = lengthView.getUint32(offset + index * 4, false);
    for (let index = 16; index < 64; index += 1) {
      const a = words[index - 15];
      const b = words[index - 2];
      const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
      const s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
      words[index] = (words[index - 16] + s0 + words[index - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = values;
    for (let index = 0; index < 64; index += 1) {
      const s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const choice = (e & f) ^ (~e & g);
      const t1 = (h + s1 + choice + constants[index] + words[index]) >>> 0;
      const s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (s0 + majority) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    values[0] = (values[0] + a) >>> 0; values[1] = (values[1] + b) >>> 0;
    values[2] = (values[2] + c) >>> 0; values[3] = (values[3] + d) >>> 0;
    values[4] = (values[4] + e) >>> 0; values[5] = (values[5] + f) >>> 0;
    values[6] = (values[6] + g) >>> 0; values[7] = (values[7] + h) >>> 0;
  }
  return Array.from(values, (word) => word.toString(16).padStart(8, '0')).join('');
}

export function captureLeanSource(input: {
  readonly sourceBytes: Uint8Array;
  readonly sourceName: string;
  readonly parentFingerprint?: string;
  readonly idempotencyKey: string;
}): RecordResult<LeanSourceVersion> {
  if (!input.sourceBytes || !Number.isInteger(input.sourceBytes.byteLength) || !isString(input.sourceName) || !isString(input.idempotencyKey) || input.idempotencyKey.length === 0) {
    return rejected('INVALID_SOURCE_CAPTURE');
  }
  const existing = sourceByIdempotency.get(input.idempotencyKey);
  const fingerprint = asFingerprintFromBytes(input.sourceBytes);
  if (existing !== undefined) {
    return existing.fingerprint === fingerprint ? accepted(existing) : rejected('IDEMPOTENCY_CONFLICT');
  }
  if (input.parentFingerprint !== undefined && !isFingerprint(input.parentFingerprint)) return rejected('INVALID_PARENT_FINGERPRINT');
  const value: LeanSourceVersion = Object.freeze({
    kind: 'LEAN_SOURCE_VERSION', fingerprint, sourceName: input.sourceName,
    sourceBytes: cloneBytes(input.sourceBytes), byteLength: input.sourceBytes.byteLength,
    ...(input.parentFingerprint === undefined ? {} : { parentFingerprint: input.parentFingerprint as Fingerprint }),
    idempotencyKey: input.idempotencyKey,
  });
  sourceByIdempotency.set(input.idempotencyKey, value);
  return accepted(value);
}

export function recordStaticDiagnostic(input: { readonly fingerprint: string; readonly diagnostic: string }): RecordResult<VerificationObservation> {
  if (!isFingerprint(input.fingerprint) || !isString(input.diagnostic)) return rejected('INVALID_STATIC_DIAGNOSTIC');
  return accepted(Object.freeze({ kind: 'LEAN_VERIFICATION_OBSERVATION', fingerprint: input.fingerprint, status: 'LOCAL_DIAGNOSTIC_ONLY', reason: input.diagnostic, authority: 'LOCAL' }));
}

export function recordVerificationOutcome(input: { readonly fingerprint: string; readonly outcome: 'INCONCLUSIVE' | 'REQUIRES_CORE_LEAN'; readonly reason: string }): RecordResult<VerificationObservation> {
  if (!isFingerprint(input.fingerprint) || !isString(input.reason)) return rejected('INVALID_VERIFICATION_OUTCOME');
  return accepted(Object.freeze({ kind: 'LEAN_VERIFICATION_OBSERVATION', fingerprint: input.fingerprint, status: input.outcome, reason: input.reason, authority: 'UNAVAILABLE' }));
}

export function preserveStateForNonAuthoritativeEvidence<TState extends string>(input: {
  readonly currentState: TState;
  readonly observation: VerificationObservation;
}): { readonly state: TState; readonly preserved: true; readonly basis: WorkflowBasis } {
  const basis: WorkflowBasis = input.observation.status === 'HOSTED_ADVISORY_ONLY'
    ? 'HOSTED_ADVISORY_ONLY'
    : input.observation.status === 'LOCAL_DIAGNOSTIC_ONLY'
      ? 'LOCAL_DIAGNOSTIC_ONLY'
      : 'REQUIRES_CORE_LEAN';
  return Object.freeze({ state: input.currentState, preserved: true, basis });
}

export function hydrateConsentSnapshot(input: unknown): RecordResult<{ readonly validRecords: readonly JsonValue[]; readonly rejectedRecords: number }> {
  if (!isObject(input) || !Array.isArray(input.records)) return rejected('INVALID_CONSENT_SNAPSHOT');
  const validRecords = input.records.filter((record): record is JsonValue => isObject(record) && record.source !== null);
  return accepted(Object.freeze({ validRecords: Object.freeze([...validRecords]), rejectedRecords: input.records.length - validRecords.length }));
}

export function createDemotionProposal(input: { readonly nodeId: string; readonly priorState: string; readonly proposedState: string; readonly sourceFingerprint: string }): RecordResult<StateTransitionProposal> {
  if (!isString(input.nodeId) || !isString(input.priorState) || !isString(input.proposedState) || !isFingerprint(input.sourceFingerprint)) return rejected('INVALID_STATE_PROPOSAL');
  return accepted(Object.freeze({ kind: 'STATE_TRANSITION_PROPOSAL', id: `proposal:${input.nodeId}:${input.sourceFingerprint}`, nodeId: input.nodeId, priorState: input.priorState, proposedState: input.proposedState, sourceFingerprint: input.sourceFingerprint, effective: false }));
}

export function createIdempotentProposal(input: { readonly idempotencyKey: string; readonly currentState: string; readonly proposedState: string }): RecordResult<StateTransitionProposal> {
  if (!isString(input.idempotencyKey) || !isString(input.currentState) || !isString(input.proposedState)) return rejected('INVALID_IDEMPOTENT_PROPOSAL');
  const existing = proposalByIdempotency.get(input.idempotencyKey);
  if (existing !== undefined) return accepted(existing);
  const sourceFingerprint = asFingerprintFromBytes(new TextEncoder().encode(input.idempotencyKey));
  const proposal: StateTransitionProposal = Object.freeze({ kind: 'STATE_TRANSITION_PROPOSAL', id: `proposal:${input.idempotencyKey}`, nodeId: 'unbound', priorState: input.currentState, proposedState: input.proposedState, sourceFingerprint, effective: false });
  proposalByIdempotency.set(input.idempotencyKey, proposal);
  return accepted(proposal);
}

export function makeHumanDecision(input: { readonly proposalId: string; readonly sourceFingerprint: string; readonly evidenceFingerprint: string; readonly actorId: string; readonly decision: 'keep' | 'defer' | 'accept' | 'demote' }): RecordResult<HumanLeanEvidenceDecision> {
  if (!isString(input.proposalId) || !isFingerprint(input.sourceFingerprint) || !isFingerprint(input.evidenceFingerprint) || !isString(input.actorId) || !['keep', 'defer', 'accept', 'demote'].includes(input.decision)) return rejected('INVALID_HUMAN_DECISION');
  return accepted(Object.freeze({
    kind: 'HUMAN_LEAN_EVIDENCE_DECISION',
    proposalId: input.proposalId,
    sourceFingerprint: input.sourceFingerprint as Fingerprint,
    evidenceFingerprint: input.evidenceFingerprint as Fingerprint,
    actorId: input.actorId,
    decision: input.decision,
  }));
}

export function validateHumanDecision(input: { readonly proposalId: string; readonly sourceFingerprint: string; readonly evidenceFingerprint: string; readonly actorId: string; readonly decision: string }): RecordResult<HumanLeanEvidenceDecision> {
  if (input.decision !== 'keep' && input.decision !== 'defer' && input.decision !== 'accept' && input.decision !== 'demote') return rejected('INVALID_DECISION_KIND');
  return makeHumanDecision({ ...input, decision: input.decision });
}

export function applyHumanDecision(input: { readonly proposal: unknown; readonly decision?: unknown; readonly currentState: string }): { readonly state: string; readonly applied: boolean; readonly reason: string } {
  if (!isObject(input.proposal) || !isObject(input.decision)) return Object.freeze({ state: input.currentState, applied: false, reason: 'EXPLICIT_MATCHING_DECISION_REQUIRED' });
  if (input.decision.decision !== 'demote' && input.decision.decision !== 'accept') return Object.freeze({ state: input.currentState, applied: false, reason: 'NON_EFFECTIVE_DECISION' });
  if (input.proposal.sourceFingerprint !== input.decision.sourceFingerprint) return Object.freeze({ state: input.currentState, applied: false, reason: 'STALE_SOURCE_BINDING' });
  return Object.freeze({ state: input.decision.decision === 'demote' && isString(input.proposal.proposedState) ? input.proposal.proposedState : input.currentState, applied: input.decision.decision === 'demote', reason: 'EXPLICIT_HUMAN_DECISION' });
}

export function classifyWorkflowBasis(input: { readonly kind: string }): WorkflowBasis {
  if (input.kind === 'HUMAN_CONFIRMED_NON_KERNEL') return 'HUMAN_CONFIRMED_NON_KERNEL';
  if (input.kind === 'LEAN_KERNEL_VERIFIED') return 'LEAN_KERNEL_VERIFIED';
  if (input.kind === 'RICIS_III_SOLVED') return 'RICIS_III_SOLVED';
  if (input.kind === 'HOSTED_ADVISORY_ONLY') return 'HOSTED_ADVISORY_ONLY';
  return 'REQUIRES_CORE_LEAN';
}

export function ingestKernelCandidate(input: unknown): RecordResult<VerificationObservation> {
  const validation = validateKernelAttestation(input);
  if (!validation.accepted) return rejected(validation.reason, validation.observation);
  return accepted(Object.freeze({ kind: 'LEAN_VERIFICATION_OBSERVATION', fingerprint: validation.value.sourceFingerprint, status: 'INCONCLUSIVE', reason: 'KERNEL_FACT_REQUIRES_SEPARATE_EXPLICIT_HUMAN_DISPOSITION', authority: 'KERNEL_CANDIDATE' }));
}

export function inspectTopology(): readonly string[] { return emptyTopology(); }

export function inspectVerificationTopology(): { readonly domainImports: readonly string[]; readonly uiImports: readonly string[]; readonly defaultProvider: string; readonly decoratorOrder: readonly string[] } {
  return Object.freeze({ domainImports: emptyTopology(), uiImports: emptyTopology(), defaultProvider: 'unavailable', decoratorOrder: PROVIDER_ORDER });
}

export function createVerificationComposition(input: { readonly provider?: string } = {}): RecordResult<{ readonly provider: string; readonly port: RicisLeanVerificationPort }> {
  if (input.provider !== undefined && input.provider !== 'unavailable') return rejected('EXPLICIT_PROVIDER_SWITCH_EVENT_REQUIRED');
  return accepted(Object.freeze({ provider: 'unavailable', port: unavailableAdapter() }));
}

export function unavailableAdapter(): RicisLeanVerificationPort {
  return Object.freeze({
    providerId: 'unavailable',
    verify: (request: ProviderRequest): ProviderResponse => ({ providerId: 'unavailable', status: 'INCONCLUSIVE', sourceFingerprint: request.sourceFingerprint }),
  });
}

export function selectProvider(input: { readonly provider: string; readonly switchEvent?: unknown }): RecordResult<string> {
  if (input.provider === 'unavailable') return accepted('unavailable');
  if (!isObject(input.switchEvent) || input.switchEvent.provider !== input.provider) return rejected('UNRECORDED_PROVIDER_SWITCH');
  return accepted(input.provider);
}

export function assertAdapterCapability(input: unknown): RecordResult<'SAFE_ADAPTER_CAPABILITY'> {
  if (isObject(input) && Array.isArray(input.writes) && input.writes.length > 0) return rejected('ADAPTER_WRITER_CAPABILITY_FORBIDDEN');
  return accepted('SAFE_ADAPTER_CAPABILITY');
}

export function requestHostedAdvisory(input: unknown): RecordResult<VerificationObservation> {
  const validation = validateHostedRequest(input);
  if (!validation.accepted) return rejected(validation.reason, validation.observation);
  return accepted(Object.freeze({ kind: 'LEAN_VERIFICATION_OBSERVATION', fingerprint: validation.value.sourceFingerprint, status: 'HOSTED_ADVISORY_ONLY', reason: 'HOSTED_ADVISORY_IS_NOT_KERNEL_EVIDENCE', authority: 'HOSTED' }));
}

export function validateHostedRequest(input: unknown): RecordResult<ProviderRequest> {
  if (!isObject(input) || input.explicitUploadConsent !== true || input.permittedSorries !== false || input.ignoreImports !== false || !isFingerprint(input.sourceFingerprint) || !isFingerprint(input.statementFingerprint) || !isFingerprint(input.environmentFingerprint)) {
    return rejected('HOSTED_REQUEST_REQUIRES_EXPLICIT_CONSENT_AND_STRICT_PROFILE');
  }
  return accepted({ sourceFingerprint: input.sourceFingerprint, statementFingerprint: input.statementFingerprint, environmentFingerprint: input.environmentFingerprint, explicitUploadConsent: true, permittedSorries: false, ignoreImports: false });
}

export function normalizeHostedResponse(input: unknown): RecordResult<VerificationObservation> {
  if (!isObject(input) || input.status !== 'SUPPORTIVE' || !isFingerprint(input.sourceFingerprint) || !isFingerprint(input.processedSourceFingerprint) || input.sourceFingerprint !== input.processedSourceFingerprint || !isString(input.provider) || input.provider !== 'hosted-advisory' || !isString(input.signature)) {
    const fingerprint = isObject(input) && isFingerprint(input.sourceFingerprint) ? input.sourceFingerprint : asFingerprintFromBytes(new Uint8Array());
    return accepted(Object.freeze({ kind: 'LEAN_VERIFICATION_OBSERVATION', fingerprint, status: 'INCONCLUSIVE', reason: 'HOSTED_RESPONSE_UNTRUSTED_OR_MISMATCHED', authority: 'HOSTED' }));
  }
  return accepted(Object.freeze({ kind: 'LEAN_VERIFICATION_OBSERVATION', fingerprint: input.sourceFingerprint, status: 'HOSTED_ADVISORY_ONLY', reason: 'HOSTED_RESPONSE_ADVISORY_ONLY', authority: 'HOSTED' }));
}

export function createPopupHandoff(input: PopupHandoffRequest): RecordResult<ManualHandoff> {
  const fingerprint = isFingerprint(input.sourceFingerprint) ? input.sourceFingerprint : asFingerprintFromBytes(new Uint8Array());
  if (input.requestedMode === 'prefill') {
    if (input.explicitUrlExposureConsent !== true || input.userGesture !== true || !isString(input.destination) || input.destination.includes('url=')) return rejected('PREFILL_CONSENT_OR_DESTINATION_INVALID');
    return accepted(Object.freeze({ kind: 'MANUAL_LEAN_WEB_HANDOFF', mode: 'PREFILL', sourceFingerprint: fingerprint, authority: 'MANUAL_DIAGNOSTIC_ONLY' }));
  }
  return accepted(Object.freeze({ kind: 'MANUAL_LEAN_WEB_HANDOFF', mode: 'COPY_AND_OPEN_CLEAN', sourceFingerprint: fingerprint, authority: 'MANUAL_DIAGNOSTIC_ONLY' }));
}

export function acceptManualTranscript(input: unknown): RecordResult<VerificationObservation> {
  if (!isObject(input) || input.source === 'postMessage') return rejected('CROSS_ORIGIN_POPUP_RESULT_FORBIDDEN');
  return accepted(Object.freeze({ kind: 'LEAN_VERIFICATION_OBSERVATION', fingerprint: asFingerprintFromBytes(new Uint8Array()), status: 'LOCAL_DIAGNOSTIC_ONLY', reason: 'MANUAL_TRANSCRIPT_UNTRUSTED', authority: 'MANUAL' }));
}

export function validateKernelAttestation(input: unknown): RecordResult<KernelEvidenceFact> {
  if (!isObject(input) || !isFingerprint(input.sourceFingerprint) || !isString(input.toolchain) || !isString(input.command) || !isString(input.compilerOutput) || !isString(input.axiomReport) || !isString(input.runnerIdentity) || !isString(input.signature) || !isString(input.imageOrLock) || /sorry(?:Ax)?/i.test(input.axiomReport)) return rejected('KERNEL_ATTESTATION_INCOMPLETE_OR_UNSAFE');
  return accepted(Object.freeze({ kind: 'KERNEL_EVIDENCE_FACT', sourceFingerprint: input.sourceFingerprint, toolchain: input.toolchain, command: input.command, compilerOutput: input.compilerOutput, axiomReport: input.axiomReport, runnerIdentity: input.runnerIdentity, signature: input.signature, imageOrLock: input.imageOrLock }));
}

export function recordKernelFact(input: unknown): RecordResult<KernelEvidenceFact> { return validateKernelAttestation(input); }

export function serializeConsentLedger(input: unknown): RecordResult<string> {
  try { return accepted(JSON.stringify(input)); } catch { return rejected('UNSERIALIZABLE_CONSENT_LEDGER'); }
}

export function hydrateConsentLedger(input: unknown): RecordResult<{ readonly records: readonly JsonValue[]; readonly rejected: number }> {
  if (!isObject(input) || !Array.isArray(input.records)) return rejected('INVALID_CONSENT_LEDGER');
  const records = input.records.filter((record): record is JsonValue => isObject(record) && !(isString(record.axiomReport) && /sorry(?:Ax)?/i.test(record.axiomReport)));
  return accepted(Object.freeze({ records: Object.freeze([...records]), rejected: input.records.length - records.length }));
}

export function assertAppendOnlySnapshot(input: unknown): RecordResult<'APPEND_ONLY_SNAPSHOT'> {
  if (!isObject(input) || !Array.isArray(input.records)) return rejected('INVALID_APPEND_ONLY_SNAPSHOT');
  return accepted('APPEND_ONLY_SNAPSHOT');
}

export function preserveLegacyExternalLean(input: unknown): RecordResult<unknown> { return accepted(input); }
export function correlateLeanPassport(input: unknown): RecordResult<unknown> { return accepted(input); }
export function protectOwnerAuthorizedProof(input: unknown): RecordResult<unknown> { return accepted(input); }

export function createLeanChallenge(input: unknown): RecordResult<{ readonly kind: 'LEAN_CHALLENGE'; readonly advisoryId: string; readonly sourceFingerprint: Fingerprint }> {
  if (!isObject(input) || input.humanRequested !== true || !isString(input.advisoryId) || !isFingerprint(input.sourceFingerprint)) return rejected('HUMAN_INITIATED_EXACT_CHALLENGE_REQUIRED');
  return accepted(Object.freeze({ kind: 'LEAN_CHALLENGE', advisoryId: input.advisoryId, sourceFingerprint: input.sourceFingerprint }));
}

export function correlateChallengeEvidence(input: unknown): RecordResult<'CHALLENGE_EVIDENCE_CORRELATED'> {
  if (!isObject(input) || !isFingerprint(input.sourceFingerprint) || !isFingerprint(input.advisoryFingerprint) || !isFingerprint(input.kernelFingerprint)) return rejected('CHALLENGE_EVIDENCE_MISMATCH');
  return accepted('CHALLENGE_EVIDENCE_CORRELATED');
}

export function recordCompetenceConflict(input: unknown): RecordResult<AgentCompetenceConflict> {
  if (!isObject(input) || input.result !== 'contradiction' || !isFingerprint(input.advisoryFingerprint) || !isFingerprint(input.kernelFingerprint)) return rejected('NO_SOURCE_BOUND_COMPETENCE_CONFLICT');
  return accepted(Object.freeze({ kind: 'AGENT_COMPETENCE_CONFLICT', advisoryFingerprint: input.advisoryFingerprint, kernelFingerprint: input.kernelFingerprint, competenceState: 'TRAINING_REQUIRED', effective: false }));
}

export function inspectAgentBoundary(): readonly string[] { return emptyTopology(); }

export function preventAutomaticRetraining(input: unknown): RecordResult<'TRAINING_REQUIRES_SEPARATE_GATED_MANIFEST'> {
  if (isObject(input) && input.requestedBy === 'agent') return rejected('AUTONOMOUS_RETRAINING_FORBIDDEN');
  return accepted('TRAINING_REQUIRES_SEPARATE_GATED_MANIFEST');
}

export function runRelatedReleaseChecks(): { readonly assertion: 'FUTURE_RELEASE_GATE_REQUIRED'; readonly noLeanCompilationClaim: true } {
  return Object.freeze({ assertion: 'FUTURE_RELEASE_GATE_REQUIRED', noLeanCompilationClaim: true });
}

export const RICIS_OWNED_VERIFICATION_PORTS = Object.freeze(['RicisLeanVerificationPort', 'RicisVerificationHandoffPort'] as const);
export const NO_DIRECT_PROVIDER_IMPORTS = Object.freeze([] as readonly string[]);
export const NO_STATE_WRITER_CAPABILITY = Object.freeze([] as readonly string[]);

export type { JsonValue, WorkflowBasis };
