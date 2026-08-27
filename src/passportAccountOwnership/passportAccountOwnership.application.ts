import {
  createLockedReference,
  createOwnerScope,
  createReceipt,
  type AccountOwnedPassportReceipt,
  type AuthenticatedPrincipal,
  type LockedReference,
  type OwnerScope,
} from './passportAccountOwnership.domain';

type AuthResult = AuthenticatedPrincipal | 'UNAVAILABLE' | 'UNAUTHORIZED';
type ReferenceResult = LockedReference | 'NOT_FOUND' | 'MISMATCH' | 'UNAVAILABLE';
type WriteResult = 'CREATED' | 'IDEMPOTENT_REPLAY' | 'CONFLICT' | 'UNAVAILABLE';
type ReadResult = AccountOwnedPassportReceipt | 'NOT_FOUND' | 'UNAVAILABLE';
type TransitionResult = 'APPLIED' | 'IDEMPOTENT_REPLAY' | 'CONFLICT' | 'NOT_FOUND' | 'UNAVAILABLE';

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

interface AccountAccessPort {
  requireAuthenticatedPrincipal(): Promise<AuthResult>;
}

interface SourceLockReferencePort {
  readLockedReference(input: Readonly<{
    nodeId: string;
    sourceFingerprint: string;
  }>): Promise<ReferenceResult>;
}

interface ReceiptRepository {
  createIfAbsent(receipt: AccountOwnedPassportReceipt): Promise<WriteResult>;
  listOwned(scope: OwnerScope): Promise<ReadonlyArray<AccountOwnedPassportReceipt> | 'UNAVAILABLE'>;
  readOwned(scope: OwnerScope, receiptId: string): Promise<ReadResult>;
  transitionOwned(input: Readonly<{
    scope: OwnerScope;
    receiptId: string;
    idempotencyKey: string;
    lifecycle: 'REVOKED' | 'DELETED';
    confirmed?: true;
  }>): Promise<TransitionResult>;
}

interface ReceiptIdPort {
  issue(): string;
}

interface LifecycleClock {
  now(): string;
}

export type PassportReceiptServiceDependencies = Readonly<{
  accountAccess: AccountAccessPort;
  sourceLockReferences: SourceLockReferencePort;
  receipts: ReceiptRepository;
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

const ownerFrom = async (
  accountAccess: AccountAccessPort,
): Promise<OwnerScope | 'AUTH_UNAVAILABLE' | 'UNAUTHORIZED' | 'INVALID_PRINCIPAL'> => {
  const result = await accountAccess.requireAuthenticatedPrincipal();
  if (result === 'UNAUTHORIZED') return 'UNAUTHORIZED';
  if (result === 'UNAVAILABLE') return 'AUTH_UNAVAILABLE';
  return createOwnerScope(result) ?? 'INVALID_PRINCIPAL';
};

const mapWriteResult = (result: WriteResult): string => {
  if (result === 'UNAVAILABLE') return 'REPOSITORY_UNAVAILABLE';
  return result;
};

const mapReferenceResult = (result: ReferenceResult): string => {
  if (result === 'NOT_FOUND') return 'REFERENCE_NOT_FOUND';
  if (result === 'MISMATCH') return 'REFERENCE_MISMATCH';
  if (result === 'UNAVAILABLE') return 'REFERENCE_UNAVAILABLE';
  return 'REFERENCE_INVALID';
};

const mapTransitionResult = (result: TransitionResult, lifecycle: 'REVOKED' | 'DELETED'): string => {
  if (result === 'APPLIED') return lifecycle;
  if (result === 'UNAVAILABLE') return 'REPOSITORY_UNAVAILABLE';
  return result;
};

export function createPassportReceiptService(dependencies: PassportReceiptServiceDependencies) {
  const create = async (input: unknown): Promise<unknown> => {
    if (!validCreateCommand(input)) return 'INVALID_COMMAND';
    const owner = await ownerFrom(dependencies.accountAccess);
    if (typeof owner === 'string') return owner;
    const referenceResult = await dependencies.sourceLockReferences.readLockedReference({
      nodeId: input.nodeId,
      sourceFingerprint: input.sourceFingerprint,
    });
    if (typeof referenceResult === 'string') return mapReferenceResult(referenceResult);
    const reference = createLockedReference(referenceResult);
    if (!reference) return 'REFERENCE_INVALID';
    if (reference.nodeId !== input.nodeId || reference.sourceFingerprint !== input.sourceFingerprint) {
      return 'REFERENCE_MISMATCH';
    }
    const createdAt = dependencies.clock.now();
    const receipt = createReceipt({
      receiptId: dependencies.ids.issue(),
      receiptVersion: 1,
      tenantId: owner.tenantId,
      accountId: owner.accountId,
      ...reference,
      disclosureTier: 'REFERENCE_ONLY',
      retentionClass: 'ACCOUNT_MANAGED',
      createdAt,
      reviewAt: createdAt,
      lifecycle: 'ACTIVE',
    });
    if (!receipt) return 'RECEIPT_INVALID';
    return mapWriteResult(await dependencies.receipts.createIfAbsent(receipt));
  };

  const list = async (): Promise<unknown> => {
    const owner = await ownerFrom(dependencies.accountAccess);
    if (typeof owner === 'string') return owner;
    const result = await dependencies.receipts.listOwned(owner);
    return result === 'UNAVAILABLE' ? 'REPOSITORY_UNAVAILABLE' : result;
  };

  const read = async (receiptId: string): Promise<unknown> => {
    if (!isNonEmptyString(receiptId)) return 'INVALID_COMMAND';
    const owner = await ownerFrom(dependencies.accountAccess);
    if (typeof owner === 'string') return owner;
    const result = await dependencies.receipts.readOwned(owner, receiptId);
    return result === 'UNAVAILABLE' ? 'REPOSITORY_UNAVAILABLE' : result;
  };

  const revoke = async (input: unknown): Promise<unknown> => {
    if (!validRevokeCommand(input)) return 'INVALID_COMMAND';
    const owner = await ownerFrom(dependencies.accountAccess);
    if (typeof owner === 'string') return owner;
    const result = await dependencies.receipts.transitionOwned({
      scope: owner,
      receiptId: input.receiptId,
      idempotencyKey: input.idempotencyKey,
      lifecycle: 'REVOKED',
    });
    return mapTransitionResult(result, 'REVOKED');
  };

  const deleteReceipt = async (input: unknown): Promise<unknown> => {
    if (!validDeleteCommand(input)) return 'INVALID_COMMAND';
    const owner = await ownerFrom(dependencies.accountAccess);
    if (typeof owner === 'string') return owner;
    const result = await dependencies.receipts.transitionOwned({
      scope: owner,
      receiptId: input.receiptId,
      idempotencyKey: input.idempotencyKey,
      lifecycle: 'DELETED',
      confirmed: true,
    });
    return mapTransitionResult(result, 'DELETED');
  };

  const exportMetadata = async (): Promise<unknown> => {
    const owner = await ownerFrom(dependencies.accountAccess);
    if (typeof owner === 'string') return owner;
    const result = await dependencies.receipts.listOwned(owner);
    if (result === 'UNAVAILABLE') return 'REPOSITORY_UNAVAILABLE';
    return result.map((receipt) => createReceipt(receipt)).every(Boolean)
      ? result.map((receipt) => createReceipt(receipt))
      : 'INVALID_RECEIPT';
  };

  return Object.freeze({ create, list, read, revoke, delete: deleteReceipt, exportMetadata });
}
