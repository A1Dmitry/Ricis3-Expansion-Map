export type Fingerprint = `sha256:v1:${string}`;

export type PassportReadResult<T> =
  | { readonly kind: 'FOUND'; readonly value: T }
  | { readonly kind: 'ABSENT' }
  | { readonly kind: 'INCONCLUSIVE'; readonly reason: string };

export interface LeanPassportSourceSnapshot {
  readonly fingerprint: Fingerprint;
  readonly sourceName: string;
  readonly sourceBytes: Uint8Array;
  readonly byteLength: number;
  readonly parentFingerprint?: Fingerprint;
  readonly idempotencyKey: string;
}

export interface LeanPassportObservationSnapshot {
  readonly fingerprint: Fingerprint;
  readonly status: 'LOCAL_DIAGNOSTIC_ONLY' | 'INCONCLUSIVE' | 'REQUIRES_CORE_LEAN' | 'HOSTED_ADVISORY_ONLY';
  readonly authority: 'LOCAL' | 'HOSTED' | 'UNAVAILABLE' | 'MANUAL' | 'KERNEL_CANDIDATE';
  readonly reason: string;
}

export interface LeanPassportKernelFactSnapshot {
  readonly sourceFingerprint: Fingerprint;
  readonly toolchain: string;
  readonly command: string;
  readonly compilerOutput: string;
  readonly axiomReport: string;
  readonly runnerIdentity: string;
  readonly signature: string;
  readonly imageOrLock: string;
}

export interface LeanPassportHumanDecisionSnapshot {
  readonly sourceFingerprint: Fingerprint;
  readonly evidenceFingerprint: Fingerprint;
  readonly proposalId: string;
  readonly actorId: string;
  readonly decision: 'keep' | 'defer' | 'accept' | 'demote';
}

export interface LeanPassportAuthorityCorrelationSnapshot {
  readonly sourceFingerprint: Fingerprint;
  readonly evidenceFingerprint: Fingerprint;
  readonly authoritySnapshotId: string;
  readonly kernelFactFingerprint: Fingerprint;
  readonly basis: 'LEAN_KERNEL_VERIFIED';
}

export interface LeanPassportRicisBasisSnapshot {
  readonly basis: 'RICIS_III_SOLVED';
  readonly sourceReference: string;
}

export interface LeanPassportAgentConflictSnapshot {
  readonly advisoryFingerprint: Fingerprint;
  readonly kernelFingerprint: Fingerprint;
  readonly competenceState: 'TRAINING_REQUIRED';
  readonly effective: false;
}

export interface LeanPassportLegacyExternalLeanSnapshot {
  readonly sourceHash?: string;
  readonly source?: string;
  readonly verified?: boolean;
}

export interface LeanPassportReadModel {
  readonly findSource: (fingerprint: Fingerprint) => PassportReadResult<LeanPassportSourceSnapshot>;
  readonly listObservations: (fingerprint: Fingerprint) => readonly LeanPassportObservationSnapshot[];
  readonly findKernelFact: (fingerprint: Fingerprint) => PassportReadResult<LeanPassportKernelFactSnapshot>;
  readonly findHumanDecision: (fingerprint: Fingerprint) => PassportReadResult<LeanPassportHumanDecisionSnapshot>;
  readonly findCorrelation: (fingerprint: Fingerprint) => PassportReadResult<LeanPassportAuthorityCorrelationSnapshot>;
  readonly findRicisBasis: (nodeId?: string) => PassportReadResult<LeanPassportRicisBasisSnapshot>;
  readonly findAgentConflict: (fingerprint: Fingerprint) => PassportReadResult<LeanPassportAgentConflictSnapshot>;
  readonly findLegacyExternalLean: (nodeId?: string) => PassportReadResult<LeanPassportLegacyExternalLeanSnapshot>;
}

export interface PassportProjectionQuery {
  readonly sourceFingerprint: Fingerprint;
  readonly nodeId?: string;
  readonly requestedDisclosure: 'SOURCE_AND_BASIS' | 'SAFE_EVIDENCE_DETAILS';
}

export type PassportDisplayState =
  | 'SOURCE_CAPTURED'
  | 'DIAGNOSTIC_ONLY'
  | 'INCONCLUSIVE'
  | 'INTEGRITY_DIAGNOSTIC'
  | 'CORRELATED_READ_ONLY'
  | 'HUMAN_CONFIRMED_NON_KERNEL';

export interface SafeSourceDisclosure {
  readonly fingerprint: Fingerprint;
  readonly byteLength: number;
  readonly parentFingerprint?: Fingerprint;
  readonly text: string;
  readonly redactionPolicyVersion: 'passport-safe-display:v1';
  readonly disclosedOutputFingerprint: `display:v1:${string}`;
}

export interface PassportDiagnostic {
  readonly code: string;
  readonly reason: string;
}

export interface LeanPassportView {
  readonly state: PassportDisplayState;
  readonly source?: SafeSourceDisclosure;
  readonly observations: readonly Readonly<{ readonly status: string; readonly reason: string }>[];
  readonly basis: Readonly<{
    readonly ricis?: 'RICIS_III_SOLVED';
    readonly lean?: 'LEAN_KERNEL_VERIFIED';
    readonly human?: 'HUMAN_CONFIRMED_NON_KERNEL';
    readonly diagnostic?: 'REQUIRES_CORE_LEAN' | 'LOCAL_DIAGNOSTIC_ONLY' | 'HOSTED_ADVISORY_ONLY';
  }>;
  readonly diagnostics: readonly PassportDiagnostic[];
  readonly agent?: Readonly<{ readonly competenceState: 'TRAINING_REQUIRED'; readonly effective: false }>;
  readonly legacy?: Readonly<{ readonly state: 'LEGACY_PROVENANCE_UNCORRELATED'; readonly sourceHash?: string }>;
  readonly safeCopyText?: string;
  readonly capabilities: Readonly<{ readonly canMutate: false; readonly canVerify: false; readonly canUpload: false }>;
}

const FINGERPRINT_PATTERN = /^sha256:v1:[a-f0-9]{64}$/;
const MAX_DISCLOSURE_CHARACTERS = 4096;
const REDACTION_POLICY_VERSION = 'passport-safe-display:v1' as const;
const NO_CAPABILITIES = Object.freeze({ canMutate: false, canVerify: false, canUpload: false } as const);

const absent = <T>(): PassportReadResult<T> => Object.freeze({ kind: 'ABSENT' });
const inconclusive = <T>(reason: string): PassportReadResult<T> => Object.freeze({ kind: 'INCONCLUSIVE', reason });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isFingerprint(value: unknown): value is Fingerprint {
  return isString(value) && FINGERPRINT_PATTERN.test(value);
}

function isReadResult(value: unknown): value is PassportReadResult<unknown> {
  return isRecord(value) && (value.kind === 'FOUND' || value.kind === 'ABSENT' || value.kind === 'INCONCLUSIVE');
}

function isUint8Array(value: unknown): value is Uint8Array {
  return Object.prototype.toString.call(value) === '[object Uint8Array]';
}

function normalizeReadResult<T>(value: unknown, malformedCode: string): PassportReadResult<T> {
  if (!isReadResult(value)) return inconclusive(malformedCode);
  if (value.kind === 'FOUND' && !('value' in value)) return inconclusive(malformedCode);
  if (value.kind === 'INCONCLUSIVE' && !isString(value.reason)) return inconclusive(malformedCode);
  return value as PassportReadResult<T>;
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function redactText(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, '[REDACTED_BEARER]')
    .replace(/\b(?:secret|token|credential|api[_-]?key)\s*=\s*[^\s&]+/gi, '[REDACTED_SECRET]')
    .replace(/\/(?:home|Users)\/[A-Za-z0-9_.\-/]+/g, '[REDACTED_PATH]')
    .replace(/\$\([^)]*\)/g, '[REDACTED_SHELL_FRAGMENT]');
}

function safeReason(value: unknown): string {
  return redactText(escapeText(isString(value) ? value : 'UNSAFE_OR_MALFORMED_REASON'));
}

function boundedText(value: string): string {
  return value.length <= MAX_DISCLOSURE_CHARACTERS ? value : `${value.slice(0, MAX_DISCLOSURE_CHARACTERS)}…[TRUNCATED]`;
}

function displayFingerprint(fingerprint: Fingerprint, text: string): `display:v1:${string}` {
  return `display:v1:${fingerprint.slice(-12)}:${text.length}`;
}

function asSourceSnapshot(value: unknown): LeanPassportSourceSnapshot | undefined {
  if (!isRecord(value) || !isFingerprint(value.fingerprint) || !isString(value.sourceName) || !isUint8Array(value.sourceBytes)
    || !Number.isInteger(value.byteLength) || (value.byteLength as number) < 0 || !isString(value.idempotencyKey)
    || (value.parentFingerprint !== undefined && !isFingerprint(value.parentFingerprint))) return undefined;
  return value as unknown as LeanPassportSourceSnapshot;
}

function asKernelFact(value: unknown): LeanPassportKernelFactSnapshot | undefined {
  if (!isRecord(value) || !isFingerprint(value.sourceFingerprint) || !isString(value.axiomReport)) return undefined;
  return value as unknown as LeanPassportKernelFactSnapshot;
}

function asCorrelation(value: unknown): LeanPassportAuthorityCorrelationSnapshot | undefined {
  if (!isRecord(value) || !isFingerprint(value.sourceFingerprint) || !isFingerprint(value.evidenceFingerprint)
    || !isFingerprint(value.kernelFactFingerprint) || !isString(value.authoritySnapshotId) || value.basis !== 'LEAN_KERNEL_VERIFIED') return undefined;
  return value as unknown as LeanPassportAuthorityCorrelationSnapshot;
}

function asHumanDecision(value: unknown): LeanPassportHumanDecisionSnapshot | undefined {
  if (!isRecord(value) || !isFingerprint(value.sourceFingerprint) || !isFingerprint(value.evidenceFingerprint)
    || !isString(value.proposalId) || !isString(value.actorId)
    || (value.decision !== 'keep' && value.decision !== 'defer' && value.decision !== 'accept' && value.decision !== 'demote')) return undefined;
  return value as unknown as LeanPassportHumanDecisionSnapshot;
}

function asRicisBasis(value: unknown): LeanPassportRicisBasisSnapshot | undefined {
  if (!isRecord(value) || value.basis !== 'RICIS_III_SOLVED' || !isString(value.sourceReference)) return undefined;
  return value as unknown as LeanPassportRicisBasisSnapshot;
}

function asAgentConflict(value: unknown): LeanPassportAgentConflictSnapshot | undefined {
  if (!isRecord(value) || !isFingerprint(value.advisoryFingerprint) || !isFingerprint(value.kernelFingerprint)
    || value.competenceState !== 'TRAINING_REQUIRED' || value.effective !== false) return undefined;
  return value as unknown as LeanPassportAgentConflictSnapshot;
}

function asLegacyExternalLean(value: unknown): LeanPassportLegacyExternalLeanSnapshot | undefined {
  if (!isRecord(value) || (value.sourceHash !== undefined && !isString(value.sourceHash))) return undefined;
  return value as unknown as LeanPassportLegacyExternalLeanSnapshot;
}

function asObservation(value: unknown): LeanPassportObservationSnapshot | undefined {
  if (!isRecord(value) || !isFingerprint(value.fingerprint) || !isString(value.reason)
    || (value.status !== 'LOCAL_DIAGNOSTIC_ONLY' && value.status !== 'INCONCLUSIVE' && value.status !== 'REQUIRES_CORE_LEAN' && value.status !== 'HOSTED_ADVISORY_ONLY')
    || (value.authority !== 'LOCAL' && value.authority !== 'HOSTED' && value.authority !== 'UNAVAILABLE' && value.authority !== 'MANUAL' && value.authority !== 'KERNEL_CANDIDATE')) return undefined;
  return value as unknown as LeanPassportObservationSnapshot;
}

function sourceDisclosure(source: LeanPassportSourceSnapshot): SafeSourceDisclosure {
  const decoded = new TextDecoder().decode(new Uint8Array(source.sourceBytes));
  const text = boundedText(escapeText(decoded));
  return Object.freeze({
    fingerprint: source.fingerprint,
    byteLength: source.byteLength,
    ...(source.parentFingerprint === undefined ? {} : { parentFingerprint: source.parentFingerprint }),
    text,
    redactionPolicyVersion: REDACTION_POLICY_VERSION,
    disclosedOutputFingerprint: displayFingerprint(source.fingerprint, text),
  });
}

function makeView(input: {
  readonly state: PassportDisplayState;
  readonly source?: SafeSourceDisclosure;
  readonly observations?: readonly Readonly<{ readonly status: string; readonly reason: string }>[];
  readonly basis?: LeanPassportView['basis'];
  readonly diagnostics?: readonly PassportDiagnostic[];
  readonly agent?: LeanPassportView['agent'];
  readonly legacy?: LeanPassportView['legacy'];
}): LeanPassportView {
  const source = input.source;
  return Object.freeze({
    state: input.state,
    ...(source === undefined ? {} : { source }),
    observations: Object.freeze([...(input.observations ?? [])]),
    basis: Object.freeze({ ...(input.basis ?? {}) }),
    diagnostics: Object.freeze([...(input.diagnostics ?? [])]),
    ...(input.agent === undefined ? {} : { agent: input.agent }),
    ...(input.legacy === undefined ? {} : { legacy: input.legacy }),
    ...(source === undefined ? {} : { safeCopyText: source.text }),
    capabilities: NO_CAPABILITIES,
  });
}

function diagnosticView(state: PassportDisplayState, code: string, reason: string, source?: SafeSourceDisclosure): LeanPassportView {
  return makeView({ state, source, basis: { diagnostic: 'REQUIRES_CORE_LEAN' }, diagnostics: [{ code, reason: safeReason(reason) }] });
}

function invoke<T>(operation: () => unknown, malformedCode: string): PassportReadResult<T> {
  try {
    return normalizeReadResult<T>(operation(), malformedCode);
  } catch {
    return inconclusive<T>(malformedCode);
  }
}

function inspectSupportingViews(readModel: LeanPassportReadModel, fingerprint: Fingerprint, nodeId: string | undefined): {
  readonly ricis?: 'RICIS_III_SOLVED';
  readonly agent?: LeanPassportView['agent'];
  readonly legacy?: LeanPassportView['legacy'];
} {
  const ricisResult = invoke<LeanPassportRicisBasisSnapshot>(() => readModel.findRicisBasis(nodeId), 'RICIS_BASIS_UNAVAILABLE');
  const agentResult = invoke<LeanPassportAgentConflictSnapshot>(() => readModel.findAgentConflict(fingerprint), 'AGENT_CONFLICT_UNAVAILABLE');
  const legacyResult = invoke<LeanPassportLegacyExternalLeanSnapshot>(() => readModel.findLegacyExternalLean(nodeId), 'LEGACY_PROVENANCE_UNAVAILABLE');
  const ricis = ricisResult.kind === 'FOUND' && asRicisBasis(ricisResult.value) !== undefined ? 'RICIS_III_SOLVED' : undefined;
  const agentSnapshot = agentResult.kind === 'FOUND' ? asAgentConflict(agentResult.value) : undefined;
  const legacySnapshot = legacyResult.kind === 'FOUND' ? asLegacyExternalLean(legacyResult.value) : undefined;
  return Object.freeze({
    ...(ricis === undefined ? {} : { ricis }),
    ...(agentSnapshot === undefined ? {} : { agent: Object.freeze({ competenceState: 'TRAINING_REQUIRED' as const, effective: false as const }) }),
    ...(legacySnapshot === undefined ? {} : { legacy: Object.freeze({ state: 'LEGACY_PROVENANCE_UNCORRELATED' as const, ...(legacySnapshot.sourceHash === undefined ? {} : { sourceHash: legacySnapshot.sourceHash }) }) }),
  });
}

export function createLeanPassportProjection(readModel: LeanPassportReadModel): { readonly present: (query: PassportProjectionQuery) => LeanPassportView } {
  return Object.freeze({
    present: (query: PassportProjectionQuery): LeanPassportView => {
      if (!isRecord(query) || !isFingerprint(query.sourceFingerprint) || (query.requestedDisclosure !== 'SOURCE_AND_BASIS' && query.requestedDisclosure !== 'SAFE_EVIDENCE_DETAILS')
        || (query.nodeId !== undefined && !isString(query.nodeId))) throw new Error('INVALID_CANONICAL_FINGERPRINT');
      const fingerprint = query.sourceFingerprint;
      const sourceResult = invoke<LeanPassportSourceSnapshot>(() => readModel.findSource(fingerprint), 'SOURCE_READ_UNAVAILABLE');
      if (sourceResult.kind === 'INCONCLUSIVE') return diagnosticView('INCONCLUSIVE', sourceResult.reason, sourceResult.reason);
      if (sourceResult.kind === 'ABSENT') return diagnosticView('INCONCLUSIVE', 'SOURCE_ABSENT', 'SOURCE_ABSENT');
      const source = asSourceSnapshot(sourceResult.value);
      if (source === undefined || source.fingerprint !== fingerprint) return diagnosticView('INTEGRITY_DIAGNOSTIC', 'MALFORMED_SOURCE_SNAPSHOT', 'MALFORMED_SOURCE_SNAPSHOT');
      const disclosedSource = sourceDisclosure(source);
      const supporting = inspectSupportingViews(readModel, fingerprint, query.nodeId);

      const correlationResult = invoke<LeanPassportAuthorityCorrelationSnapshot>(() => readModel.findCorrelation(fingerprint), 'CORRELATION_UNAVAILABLE');
      if (correlationResult.kind === 'INCONCLUSIVE') return makeView({ state: 'INCONCLUSIVE', source: disclosedSource, basis: { ...supporting, diagnostic: 'REQUIRES_CORE_LEAN' }, diagnostics: [{ code: correlationResult.reason, reason: safeReason(correlationResult.reason) }], agent: supporting.agent, legacy: supporting.legacy });
      const correlation = correlationResult.kind === 'FOUND' ? asCorrelation(correlationResult.value) : undefined;
      if (correlationResult.kind === 'FOUND' && (correlation === undefined || correlation.sourceFingerprint !== fingerprint || correlation.evidenceFingerprint !== fingerprint || correlation.kernelFactFingerprint !== fingerprint)) {
        return makeView({ state: 'INTEGRITY_DIAGNOSTIC', source: disclosedSource, basis: { ...supporting, diagnostic: 'REQUIRES_CORE_LEAN' }, diagnostics: [{ code: 'CORRELATION_FINGERPRINT_MISMATCH', reason: 'CORRELATION_FINGERPRINT_MISMATCH' }], agent: supporting.agent, legacy: supporting.legacy });
      }

      const kernelResult = invoke<LeanPassportKernelFactSnapshot>(() => readModel.findKernelFact(fingerprint), 'KERNEL_FACT_UNAVAILABLE');
      if (kernelResult.kind === 'FOUND') {
        const kernel = asKernelFact(kernelResult.value);
        if (kernel === undefined || kernel.sourceFingerprint !== fingerprint) {
          return makeView({ state: 'INTEGRITY_DIAGNOSTIC', source: disclosedSource, basis: { ...supporting, diagnostic: 'REQUIRES_CORE_LEAN' }, diagnostics: [{ code: 'KERNEL_SOURCE_FINGERPRINT_MISMATCH', reason: 'KERNEL_SOURCE_FINGERPRINT_MISMATCH' }], agent: supporting.agent, legacy: supporting.legacy });
        }
        if (/sorry(?:Ax)?/i.test(kernel.axiomReport)) {
          return makeView({ state: 'INTEGRITY_DIAGNOSTIC', source: disclosedSource, basis: { ...supporting, diagnostic: 'REQUIRES_CORE_LEAN' }, diagnostics: [{ code: 'UNSAFE_AXIOM_EVIDENCE', reason: 'UNSAFE_AXIOM_EVIDENCE' }], agent: supporting.agent, legacy: supporting.legacy });
        }
      }

      const decisionResult = invoke<LeanPassportHumanDecisionSnapshot>(() => readModel.findHumanDecision(fingerprint), 'HUMAN_DECISION_UNAVAILABLE');
      if (decisionResult.kind === 'FOUND') {
        const decision = asHumanDecision(decisionResult.value);
        if (decision === undefined || decision.sourceFingerprint !== fingerprint || decision.evidenceFingerprint !== fingerprint) {
          return makeView({ state: 'INTEGRITY_DIAGNOSTIC', source: disclosedSource, basis: { ...supporting, diagnostic: 'REQUIRES_CORE_LEAN' }, diagnostics: [{ code: 'STALE_HUMAN_DECISION_CONTEXT', reason: 'STALE_HUMAN_DECISION_CONTEXT' }], agent: supporting.agent, legacy: supporting.legacy });
        }
      }

      let observations: readonly Readonly<{ readonly status: string; readonly reason: string }>[] = [];
      try {
        const readObservations = readModel.listObservations(fingerprint);
        if (!Array.isArray(readObservations)) return makeView({ state: 'INTEGRITY_DIAGNOSTIC', source: disclosedSource, basis: { ...supporting, diagnostic: 'REQUIRES_CORE_LEAN' }, diagnostics: [{ code: 'MALFORMED_OBSERVATION_COLLECTION', reason: 'MALFORMED_OBSERVATION_COLLECTION' }], agent: supporting.agent, legacy: supporting.legacy });
        const typedObservations = readObservations.map(asObservation);
        if (typedObservations.some((observation) => observation === undefined || observation.fingerprint !== fingerprint)) return makeView({ state: 'INTEGRITY_DIAGNOSTIC', source: disclosedSource, basis: { ...supporting, diagnostic: 'REQUIRES_CORE_LEAN' }, diagnostics: [{ code: 'MALFORMED_OBSERVATION', reason: 'MALFORMED_OBSERVATION' }], agent: supporting.agent, legacy: supporting.legacy });
        observations = Object.freeze(typedObservations.map((observation) => Object.freeze({ status: observation!.status, reason: safeReason(observation!.reason) })));
      } catch {
        return makeView({ state: 'INCONCLUSIVE', source: disclosedSource, basis: { ...supporting, diagnostic: 'REQUIRES_CORE_LEAN' }, diagnostics: [{ code: 'OBSERVATION_READ_UNAVAILABLE', reason: 'OBSERVATION_READ_UNAVAILABLE' }], agent: supporting.agent, legacy: supporting.legacy });
      }

      if (kernelResult.kind === 'FOUND' && correlation !== undefined) {
        return makeView({ state: 'CORRELATED_READ_ONLY', source: disclosedSource, observations, basis: { ...supporting, lean: 'LEAN_KERNEL_VERIFIED' }, agent: supporting.agent, legacy: supporting.legacy });
      }
      if (kernelResult.kind === 'FOUND') {
        return makeView({ state: 'INCONCLUSIVE', source: disclosedSource, observations, basis: { ...supporting, diagnostic: 'REQUIRES_CORE_LEAN' }, diagnostics: [{ code: 'KERNEL_FACT_UNCORRELATED', reason: 'KERNEL_FACT_UNCORRELATED' }], agent: supporting.agent, legacy: supporting.legacy });
      }
      if (decisionResult.kind === 'FOUND') {
        return makeView({ state: 'HUMAN_CONFIRMED_NON_KERNEL', source: disclosedSource, observations, basis: { ...supporting, human: 'HUMAN_CONFIRMED_NON_KERNEL' }, agent: supporting.agent, legacy: supporting.legacy });
      }
      const hosted = observations.find((observation) => observation.status === 'HOSTED_ADVISORY_ONLY');
      if (hosted !== undefined) return makeView({ state: 'DIAGNOSTIC_ONLY', source: disclosedSource, observations, basis: { ...supporting, diagnostic: 'HOSTED_ADVISORY_ONLY' }, agent: supporting.agent, legacy: supporting.legacy });
      const local = observations.find((observation) => observation.status === 'LOCAL_DIAGNOSTIC_ONLY');
      if (local !== undefined) return makeView({ state: 'DIAGNOSTIC_ONLY', source: disclosedSource, observations, basis: { ...supporting, diagnostic: 'LOCAL_DIAGNOSTIC_ONLY' }, agent: supporting.agent, legacy: supporting.legacy });
      return makeView({ state: 'SOURCE_CAPTURED', source: disclosedSource, observations, basis: { ...supporting, diagnostic: 'REQUIRES_CORE_LEAN' }, agent: supporting.agent, legacy: supporting.legacy });
    },
  });
}

export function createUnavailablePassportReadModel(): LeanPassportReadModel {
  const unavailableResult = <T>(): PassportReadResult<T> => inconclusive<T>('PASSPORT_READ_MODEL_UNAVAILABLE');
  return Object.freeze({
    findSource: () => unavailableResult<LeanPassportSourceSnapshot>(),
    listObservations: () => Object.freeze([]),
    findKernelFact: () => unavailableResult<LeanPassportKernelFactSnapshot>(),
    findHumanDecision: () => unavailableResult<LeanPassportHumanDecisionSnapshot>(),
    findCorrelation: () => unavailableResult<LeanPassportAuthorityCorrelationSnapshot>(),
    findRicisBasis: () => unavailableResult<LeanPassportRicisBasisSnapshot>(),
    findAgentConflict: () => unavailableResult<LeanPassportAgentConflictSnapshot>(),
    findLegacyExternalLean: () => unavailableResult<LeanPassportLegacyExternalLeanSnapshot>(),
  });
}

export function inspectLeanPassportProjectionTopology(): Readonly<{
  readonly domainImports: readonly string[];
  readonly uiImports: readonly string[];
  readonly runtimeCalls: readonly string[];
  readonly ownedOperations: readonly string[];
  readonly forbiddenCapabilities: readonly string[];
  readonly legacyCandidateImports: readonly string[];
  readonly compatibilityGuarantees: readonly string[];
  readonly immutableBoundaries: readonly string[];
  readonly releasePolicy: Readonly<{ readonly minimumNextPatchAfter: '0.4.44'; readonly currentCandidateMaySetVersion: false; readonly currentCandidateMayPublish: false }>;
}> {
  return Object.freeze({
    domainImports: Object.freeze([]),
    uiImports: Object.freeze([]),
    runtimeCalls: Object.freeze([]),
    ownedOperations: Object.freeze([]),
    forbiddenCapabilities: Object.freeze([
      'SOURCE_CAPTURE', 'EVIDENCE_WRITE', 'STATE_WRITE', 'PROOF_WRITE', 'AXIOM_WRITE', 'TRUST_WRITE',
      'PROVIDER_SELECT', 'NETWORK', 'POPUP', 'TRAINING', 'CORE_WRITE',
    ]),
    legacyCandidateImports: Object.freeze([]),
    compatibilityGuarantees: Object.freeze([
      'LEAN_CONSENT_SOURCE_PRESERVATION', 'NO_AUTOMATIC_STATE_DEMOTION', 'BROWSER_SELF_CERTIFICATION_FORBIDDEN',
      'OIR_PROOF_LATEX_EXTERNAL_LEAN_IDENTITY_PRESERVED', 'NO_TEMPLATE_PROOF_REWRITE',
    ]),
    immutableBoundaries: Object.freeze([
      'RICIS_III_V7_7', 'L0', 'L1', 'SP1', 'SP2', 'SP3', 'SP4', 'A1', 'A4', 'A5', 'A6', 'A7', 'A10',
      'OWNER_AUTHORIZED_P_EQUALS_NP', 'USER_LEAN_TEX_EXACT_SOURCE',
    ]),
    releasePolicy: Object.freeze({ minimumNextPatchAfter: '0.4.44', currentCandidateMaySetVersion: false, currentCandidateMayPublish: false }),
  });
}

export function inspectPassportProjectionQueryContract(): Readonly<{ readonly allowedFields: readonly string[]; readonly forbiddenFields: readonly string[] }> {
  return Object.freeze({
    allowedFields: Object.freeze(['sourceFingerprint', 'nodeId', 'requestedDisclosure']),
    forbiddenFields: Object.freeze(['sourceBytes', 'providerId', 'targetState', 'decision', 'url', 'credential', 'command', 'commit', 'push', 'publish', 'version']),
  });
}
