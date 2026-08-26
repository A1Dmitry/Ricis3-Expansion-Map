export type ExternalLeanDisplayTrustStatus =
  | 'REQUIRES_CORE_LEAN'
  | 'LEAN_VERIFIED'
  | 'TRUSTED_AXIOM'
  | 'REJECTED';

export type SourceBoundPassportReference = Readonly<{
  readonly nodeId: string;
  readonly sourceFingerprint: string;
  readonly submittedAt: string;
  readonly trustStatus: ExternalLeanDisplayTrustStatus;
  readonly sourceLocked: true;
}>;

export type EphemeralPassportSessionView = Readonly<{
  readonly state: 'SOURCE_BOUND_READ_ONLY';
  readonly reference: SourceBoundPassportReference;
  readonly basis: 'SOURCE_LOCKED_PROVENANCE';
  readonly disclosures: readonly string[];
  readonly capabilities: Readonly<{
    readonly canMutate: false;
    readonly canVerify: false;
    readonly canUpload: false;
    readonly canPersist: false;
    readonly canRevealRawSource: false;
  }>;
}>;

const allowedTrustStatuses = new Set<ExternalLeanDisplayTrustStatus>([
  'REQUIRES_CORE_LEAN',
  'LEAN_VERIFIED',
  'TRUSTED_AXIOM',
  'REJECTED',
]);

const referenceKeys = new Set([
  'nodeId',
  'sourceFingerprint',
  'submittedAt',
  'trustStatus',
  'sourceLocked',
]);

const disclosures = Object.freeze([
  'Сессия только для чтения.',
  'Ссылка основана на SOURCE_LOCKED_PROVENANCE.',
  'Lean Kernel не запускается.',
  'Исходный текст Lean не раскрывается.',
  'Ничего не сохраняется.',
]);

const capabilities = Object.freeze({
  canMutate: false,
  canVerify: false,
  canUpload: false,
  canPersist: false,
  canRevealRawSource: false,
} as const);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function assertExactReference(input: unknown): asserts input is SourceBoundPassportReference {
  if (!isRecord(input)) throw new Error('Passport reference must be a record.');
  if (Object.keys(input).some(key => !referenceKeys.has(key))) {
    throw new Error('Passport reference contains an unsupported field.');
  }
  if (!isNonEmptyString(input.nodeId)) throw new Error('Passport reference requires a non-empty node ID.');
  if (!isNonEmptyString(input.sourceFingerprint) || !input.sourceFingerprint.startsWith('sha256:')) {
    throw new Error('Passport reference requires a source fingerprint.');
  }
  if (!isNonEmptyString(input.submittedAt) || Number.isNaN(Date.parse(input.submittedAt))) {
    throw new Error('Passport reference requires a valid submission timestamp.');
  }
  if (input.sourceLocked !== true) throw new Error('Passport reference requires an immutable source lock.');
  if (typeof input.trustStatus !== 'string' || !allowedTrustStatuses.has(input.trustStatus as ExternalLeanDisplayTrustStatus)) {
    throw new Error('Passport reference contains an unsupported trust status.');
  }
}

export function createEphemeralPassportSession(input: unknown): EphemeralPassportSessionView {
  assertExactReference(input);
  const reference = Object.freeze({
    nodeId: input.nodeId,
    sourceFingerprint: input.sourceFingerprint,
    submittedAt: input.submittedAt,
    trustStatus: input.trustStatus,
    sourceLocked: true as const,
  });

  return Object.freeze({
    state: 'SOURCE_BOUND_READ_ONLY' as const,
    reference,
    basis: 'SOURCE_LOCKED_PROVENANCE' as const,
    disclosures,
    capabilities,
  });
}
