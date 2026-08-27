export const displayTrustStatuses = ['REQUIRES_CORE_LEAN', 'LEAN_VERIFIED', 'TRUSTED_AXIOM', 'REJECTED'] as const;
export type DisplayTrustStatus = (typeof displayTrustStatuses)[number];

export type AuthenticatedPrincipal = Readonly<{
  accountId: string;
  tenantId: string;
  authenticationEpoch: string;
}>;

export type OwnerScope = Readonly<{
  accountId: string;
  tenantId: string;
}>;

export type LockedReference = Readonly<{
  nodeId: string;
  sourceFingerprint: string;
  sourceLocked: true;
  submittedAt: string;
  displayedTrustStatus: DisplayTrustStatus;
}>;

export type ReceiptLifecycle = 'ACTIVE' | 'REVOKED' | 'DELETED';

export type AccountOwnedPassportReceipt = Readonly<{
  receiptId: string;
  receiptVersion: 1;
  tenantId: string;
  accountId: string;
  nodeId: string;
  sourceFingerprint: string;
  sourceLocked: true;
  submittedAt: string;
  displayedTrustStatus: DisplayTrustStatus;
  disclosureTier: 'REFERENCE_ONLY';
  retentionClass: 'ACCOUNT_MANAGED';
  createdAt: string;
  reviewAt: string;
  lifecycle: ReceiptLifecycle;
}>;

const ownerKeys = ['accountId', 'tenantId', 'authenticationEpoch'] as const;
const referenceKeys = ['nodeId', 'sourceFingerprint', 'sourceLocked', 'submittedAt', 'displayedTrustStatus'] as const;
const receiptKeys = [
  'receiptId',
  'receiptVersion',
  'tenantId',
  'accountId',
  'nodeId',
  'sourceFingerprint',
  'sourceLocked',
  'submittedAt',
  'displayedTrustStatus',
  'disclosureTier',
  'retentionClass',
  'createdAt',
  'reviewAt',
  'lifecycle',
] as const;

const isObject = (value: unknown): value is { readonly [key: string]: unknown } =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasExactKeys = (value: { readonly [key: string]: unknown }, keys: readonly string[]): boolean => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isDisplayTrustStatus = (value: unknown): value is DisplayTrustStatus =>
  typeof value === 'string' && (displayTrustStatuses as readonly string[]).includes(value);

const isLifecycle = (value: unknown): value is ReceiptLifecycle =>
  value === 'ACTIVE' || value === 'REVOKED' || value === 'DELETED';

export function createOwnerScope(input: unknown): OwnerScope | undefined {
  if (!isObject(input) || !hasExactKeys(input, ownerKeys)) return undefined;
  if (!isNonEmptyString(input.accountId) || !isNonEmptyString(input.tenantId)) return undefined;
  if (!isNonEmptyString(input.authenticationEpoch)) return undefined;
  return Object.freeze({
    accountId: input.accountId,
    tenantId: input.tenantId,
  });
}

export function createLockedReference(input: unknown): LockedReference | undefined {
  if (!isObject(input) || !hasExactKeys(input, referenceKeys)) return undefined;
  if (!isNonEmptyString(input.nodeId) || !isNonEmptyString(input.sourceFingerprint)) return undefined;
  if (input.sourceLocked !== true || !isNonEmptyString(input.submittedAt)) return undefined;
  if (!isDisplayTrustStatus(input.displayedTrustStatus)) return undefined;
  return Object.freeze({
    nodeId: input.nodeId,
    sourceFingerprint: input.sourceFingerprint,
    sourceLocked: true,
    submittedAt: input.submittedAt,
    displayedTrustStatus: input.displayedTrustStatus,
  });
}

export function createReceipt(input: unknown): AccountOwnedPassportReceipt | undefined {
  if (!isObject(input) || !hasExactKeys(input, receiptKeys)) return undefined;
  if (!isNonEmptyString(input.receiptId) || input.receiptVersion !== 1) return undefined;
  if (!isNonEmptyString(input.tenantId) || !isNonEmptyString(input.accountId)) return undefined;
  if (!isNonEmptyString(input.nodeId) || !isNonEmptyString(input.sourceFingerprint)) return undefined;
  if (input.sourceLocked !== true || !isNonEmptyString(input.submittedAt)) return undefined;
  if (!isDisplayTrustStatus(input.displayedTrustStatus)) return undefined;
  if (input.disclosureTier !== 'REFERENCE_ONLY' || input.retentionClass !== 'ACCOUNT_MANAGED') return undefined;
  if (!isNonEmptyString(input.createdAt) || !isNonEmptyString(input.reviewAt)) return undefined;
  if (!isLifecycle(input.lifecycle)) return undefined;
  return Object.freeze({
    receiptId: input.receiptId,
    receiptVersion: 1,
    tenantId: input.tenantId,
    accountId: input.accountId,
    nodeId: input.nodeId,
    sourceFingerprint: input.sourceFingerprint,
    sourceLocked: true,
    submittedAt: input.submittedAt,
    displayedTrustStatus: input.displayedTrustStatus,
    disclosureTier: 'REFERENCE_ONLY',
    retentionClass: 'ACCOUNT_MANAGED',
    createdAt: input.createdAt,
    reviewAt: input.reviewAt,
    lifecycle: input.lifecycle,
  });
}

export function transitionReceipt(input: unknown): AccountOwnedPassportReceipt | undefined {
  if (!isObject(input) || !hasExactKeys(input, ['receipt', 'command'])) return undefined;
  const receipt = createReceipt(input.receipt);
  if (!receipt || (input.command !== 'REVOKE' && input.command !== 'DELETE')) return undefined;
  if (input.command === 'REVOKE' && receipt.lifecycle !== 'ACTIVE') return undefined;
  if (input.command === 'DELETE' && receipt.lifecycle === 'DELETED') return undefined;
  const lifecycle: ReceiptLifecycle = input.command === 'REVOKE' ? 'REVOKED' : 'DELETED';
  return Object.freeze({ ...receipt, lifecycle });
}
