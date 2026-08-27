import {
  createDurableReceipt,
  createLockedReference,
  isReceiptExpired,
  readDurableReceipt,
  type DurablePassportReceipt,
} from './passportReceiptLedger.domain';

type OwnerScope = Readonly<{
  accountId: string;
  tenantId: string;
}>;

type AuthenticatedPrincipal = Readonly<{
  accountId: string;
  tenantId: string;
  authenticationEpoch: string;
}>;

type LockedReference = Readonly<{
  nodeId: string;
  sourceFingerprint: string;
  sourceLocked: true;
  submittedAt: string;
  displayedTrustStatus: 'REQUIRES_CORE_LEAN' | 'LEAN_VERIFIED' | 'TRUSTED_AXIOM' | 'REJECTED';
}>;

type AuthorizationResult = AuthenticatedPrincipal | 'UNAUTHORIZED' | 'UNAVAILABLE';
type ReferenceResult = LockedReference | 'MISMATCH' | 'NOT_FOUND' | 'UNAVAILABLE';
type CreateResult = 'CREATED' | 'IDEMPOTENT_REPLAY' | 'CONFLICT' | 'UNAVAILABLE';
type ReadResult = DurablePassportReceipt | 'NOT_FOUND' | 'OUT_OF_SCOPE' | 'EXPIRED' | 'UNAVAILABLE';
type ListResult = ReadonlyArray<DurablePassportReceipt> | 'UNAVAILABLE' | 'EXPIRED';
type RevokeResult = 'APPLIED' | 'IDEMPOTENT_REPLAY' | 'CONFLICT' | 'NOT_FOUND' | 'OUT_OF_SCOPE' | 'EXPIRED' | 'UNAVAILABLE';
type DeleteResult = 'DELETED' | 'IDEMPOTENT_REPLAY' | 'CONFLICT' | 'NOT_FOUND' | 'OUT_OF_SCOPE' | 'EXPIRED' | 'UNAVAILABLE';

type CreateCommand = Readonly<{
  idempotencyKey: string;
  nodeId: string;
  sourceFingerprint: string;
  requestedDisclosureTier: 'REFERENCE_ONLY';
}>;

type RevokeCommand = Readonly<{
  receiptId: string;
  idempotencyKey: string;
}>;

type DeleteCommand = Readonly<{
  receiptId: string;
  idempotencyKey: string;
  confirmed: true;
}>;

interface AuthorizationPort {
  requirePrincipal(): Promise<AuthorizationResult>;
}

interface SourceReferencePort {
  readLockedReference(input: Readonly<{
    nodeId: string;
    sourceFingerprint: string;
  }>): Promise<ReferenceResult>;
}

interface ReceiptLedgerPort {
  createIfAbsent(receipt: DurablePassportReceipt, idempotencyKey: string): Promise<CreateResult>;
  listOwned(scope: OwnerScope): Promise<ListResult>;
  readOwned(scope: OwnerScope, receiptId: string): Promise<ReadResult>;
  revokeOwned(input: Readonly<{
    scope: OwnerScope;
    receiptId: string;
    idempotencyKey: string;
    lifecycle: 'REVOKED';
  }>): Promise<RevokeResult>;
  deleteOwned(input: Readonly<{
    scope: OwnerScope;
    receiptId: string;
    idempotencyKey: string;
    confirmed: true;
  }>): Promise<DeleteResult>;
}

interface ReceiptIdPort {
  issue(): string;
}

interface LifecycleClock {
  now(): string;
}

export type PassportReceiptLedgerDependencies = Readonly<{
  authorization: AuthorizationPort;
  sourceReferences: SourceReferencePort;
  ledger: ReceiptLedgerPort;
  ids: ReceiptIdPort;
  clock: LifecycleClock;
}>;

const isObject = (value: unknown): value is { readonly [key: string]: unknown } =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasExactKeys = (value: { readonly [key: string]: unknown }, keys: readonly string[]): boolean => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const validCreateCommand = (value: unknown): value is CreateCommand =>
  isObject(value) &&
  hasExactKeys(value, ['idempotencyKey', 'nodeId', 'sourceFingerprint', 'requestedDisclosureTier']) &&
  isNonEmptyString(value.idempotencyKey) &&
  isNonEmptyString(value.nodeId) &&
  isNonEmptyString(value.sourceFingerprint) &&
  value.requestedDisclosureTier === 'REFERENCE_ONLY';

const validRevokeCommand = (value: unknown): value is RevokeCommand =>
  isObject(value) &&
  hasExactKeys(value, ['receiptId', 'idempotencyKey']) &&
  isNonEmptyString(value.receiptId) &&
  isNonEmptyString(value.idempotencyKey);

const validDeleteCommand = (value: unknown): value is DeleteCommand =>
  isObject(value) &&
  hasExactKeys(value, ['receiptId', 'idempotencyKey', 'confirmed']) &&
  isNonEmptyString(value.receiptId) &&
  isNonEmptyString(value.idempotencyKey) &&
  value.confirmed === true;

const scopeFrom = async (authorization: AuthorizationPort): Promise<OwnerScope | 'UNAUTHORIZED' | 'LEDGER_UNAVAILABLE'> => {
  const result = await authorization.requirePrincipal();
  if (result === 'UNAUTHORIZED') return 'UNAUTHORIZED';
  if (result === 'UNAVAILABLE') return 'LEDGER_UNAVAILABLE';
  if (!isNonEmptyString(result.accountId) || !isNonEmptyString(result.tenantId) || !isNonEmptyString(result.authenticationEpoch)) {
    return 'UNAUTHORIZED';
  }
  return Object.freeze({ accountId: result.accountId, tenantId: result.tenantId });
};

const unavailableRead = (result: ReadResult): DurablePassportReceipt | 'RECEIPT_UNAVAILABLE' | 'LEDGER_UNAVAILABLE' => {
  if (result === 'UNAVAILABLE') return 'LEDGER_UNAVAILABLE';
  if (result === 'NOT_FOUND' || result === 'OUT_OF_SCOPE' || result === 'EXPIRED') return 'RECEIPT_UNAVAILABLE';
  return result;
};

const availabilityOf = (receipt: DurablePassportReceipt, now: string): DurablePassportReceipt | 'RECEIPT_UNAVAILABLE' =>
  isReceiptExpired(receipt, now) ? 'RECEIPT_UNAVAILABLE' : receipt;

export function createPassportReceiptLedgerService(dependencies: PassportReceiptLedgerDependencies) {
  const create = async (input: unknown): Promise<unknown> => {
    if (!validCreateCommand(input)) return 'INVALID_COMMAND';
    const scope = await scopeFrom(dependencies.authorization);
    if (typeof scope === 'string') return scope;
    const referenceResult = await dependencies.sourceReferences.readLockedReference({
      nodeId: input.nodeId,
      sourceFingerprint: input.sourceFingerprint,
    });
    if (typeof referenceResult === 'string') return 'REFERENCE_UNAVAILABLE';
    const reference = createLockedReference(referenceResult);
    if (!reference || reference.nodeId !== input.nodeId || reference.sourceFingerprint !== input.sourceFingerprint) {
      return 'REFERENCE_UNAVAILABLE';
    }
    const receipt = createDurableReceipt({
      receiptId: dependencies.ids.issue(),
      receiptVersion: 1,
      tenantId: scope.tenantId,
      accountId: scope.accountId,
      ...reference,
      disclosureTier: 'REFERENCE_ONLY',
      retentionClass: 'ACCOUNT_MANAGED',
      createdAt: dependencies.clock.now(),
      lifecycle: 'ACTIVE',
    });
    if (!receipt) return 'INVALID_COMMAND';
    return dependencies.ledger.createIfAbsent(receipt, input.idempotencyKey);
  };

  const list = async (): Promise<unknown> => {
    const scope = await scopeFrom(dependencies.authorization);
    if (typeof scope === 'string') return scope;
    const result = await dependencies.ledger.listOwned(scope);
    if (result === 'UNAVAILABLE') return 'LEDGER_UNAVAILABLE';
    if (result === 'EXPIRED' || result.some(receipt => isReceiptExpired(receipt, dependencies.clock.now()))) {
      return 'RECEIPT_UNAVAILABLE';
    }
    const receipts = result.map(readDurableReceipt);
    return receipts.every((receipt): receipt is DurablePassportReceipt => receipt !== undefined)
      ? receipts
      : 'RECEIPT_UNAVAILABLE';
  };

  const read = async (receiptId: string): Promise<unknown> => {
    if (!isNonEmptyString(receiptId)) return 'INVALID_COMMAND';
    const scope = await scopeFrom(dependencies.authorization);
    if (typeof scope === 'string') return scope;
    const result = unavailableRead(await dependencies.ledger.readOwned(scope, receiptId));
    return typeof result === 'string' ? result : availabilityOf(result, dependencies.clock.now());
  };

  const exportMetadataJson = async (): Promise<unknown> => {
    const result = await list();
    return Array.isArray(result) ? JSON.stringify(result) : result;
  };

  const revoke = async (input: unknown): Promise<unknown> => {
    if (!validRevokeCommand(input)) return 'INVALID_COMMAND';
    const scope = await scopeFrom(dependencies.authorization);
    if (typeof scope === 'string') return scope;
    const result = await dependencies.ledger.revokeOwned({
      scope,
      receiptId: input.receiptId,
      idempotencyKey: input.idempotencyKey,
      lifecycle: 'REVOKED',
    });
    if (result === 'APPLIED') return 'REVOKED';
    if (result === 'UNAVAILABLE') return 'LEDGER_UNAVAILABLE';
    return 'RECEIPT_UNAVAILABLE';
  };

  const deleteReceipt = async (input: unknown): Promise<unknown> => {
    if (!validDeleteCommand(input)) return 'INVALID_COMMAND';
    const scope = await scopeFrom(dependencies.authorization);
    if (typeof scope === 'string') return scope;
    const result = await dependencies.ledger.deleteOwned({
      scope,
      receiptId: input.receiptId,
      idempotencyKey: input.idempotencyKey,
      confirmed: true,
    });
    if (result === 'DELETED') return 'DELETED';
    if (result === 'UNAVAILABLE') return 'LEDGER_UNAVAILABLE';
    return 'RECEIPT_UNAVAILABLE';
  };

  return Object.freeze({ create, list, read, exportMetadataJson, revoke, delete: deleteReceipt });
}
