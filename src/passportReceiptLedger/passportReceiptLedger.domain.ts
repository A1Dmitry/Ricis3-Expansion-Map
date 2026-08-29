export const receiptLifecycleValues = ['ACTIVE', 'REVOKED', 'DELETED'] as const;

type ReceiptLifecycle = (typeof receiptLifecycleValues)[number];
type DisplayTrustStatus = 'REQUIRES_CORE_LEAN' | 'LEAN_VERIFIED' | 'TRUSTED_AXIOM' | 'REJECTED';

type LockedReference = Readonly<{
  nodeId: string;
  sourceFingerprint: string;
  sourceLocked: true;
  submittedAt: string;
  displayedTrustStatus: DisplayTrustStatus;
}>;

export type DurablePassportReceipt = Readonly<{
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

type ReceiptCreationInput = Readonly<{
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
  lifecycle: ReceiptLifecycle;
}>;

const creationKeys = [
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
  'lifecycle',
] as const;

const receiptKeys = [...creationKeys, 'reviewAt'] as const;
const referenceKeys = ['nodeId', 'sourceFingerprint', 'sourceLocked', 'submittedAt', 'displayedTrustStatus'] as const;

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
  value === 'REQUIRES_CORE_LEAN' || value === 'LEAN_VERIFIED' || value === 'TRUSTED_AXIOM' || value === 'REJECTED';

const isReceiptLifecycle = (value: unknown): value is ReceiptLifecycle =>
  value === 'ACTIVE' || value === 'REVOKED' || value === 'DELETED';

const parseIsoInstant = (value: unknown): Date | undefined => {
  if (!isNonEmptyString(value)) return undefined;
  try {
    const instant = new Date(value);
    return instant.toISOString() === value ? instant : undefined;
  } catch {
    return undefined;
  }
};

const twelveCalendarMonthsAfter = (createdAt: string): string | undefined => {
  const instant = parseIsoInstant(createdAt);
  if (!instant) return undefined;
  const year = instant.getUTCFullYear() + 1;
  const month = instant.getUTCMonth();
  const day = Math.min(
    instant.getUTCDate(),
    new Date(Date.UTC(year, month + 1, 0)).getUTCDate(),
  );
  return new Date(Date.UTC(
    year,
    month,
    day,
    instant.getUTCHours(),
    instant.getUTCMinutes(),
    instant.getUTCSeconds(),
    instant.getUTCMilliseconds(),
  )).toISOString();
};

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

export function createDurableReceipt(input: unknown): DurablePassportReceipt | undefined {
  if (!isObject(input) || !hasExactKeys(input, creationKeys)) return undefined;
  if (!isNonEmptyString(input.receiptId) || input.receiptVersion !== 1) return undefined;
  if (!isNonEmptyString(input.tenantId) || !isNonEmptyString(input.accountId)) return undefined;
  const reference = createLockedReference({
    nodeId: input.nodeId,
    sourceFingerprint: input.sourceFingerprint,
    sourceLocked: input.sourceLocked,
    submittedAt: input.submittedAt,
    displayedTrustStatus: input.displayedTrustStatus,
  });
  if (!reference || input.disclosureTier !== 'REFERENCE_ONLY' || input.retentionClass !== 'ACCOUNT_MANAGED') return undefined;
  if (!isReceiptLifecycle(input.lifecycle) || !isNonEmptyString(input.createdAt)) return undefined;
  const reviewAt = twelveCalendarMonthsAfter(input.createdAt);
  if (!reviewAt) return undefined;
  return Object.freeze({
    receiptId: input.receiptId,
    receiptVersion: 1,
    tenantId: input.tenantId,
    accountId: input.accountId,
    ...reference,
    disclosureTier: 'REFERENCE_ONLY',
    retentionClass: 'ACCOUNT_MANAGED',
    createdAt: input.createdAt,
    reviewAt,
    lifecycle: input.lifecycle,
  });
}

export function readDurableReceipt(input: unknown): DurablePassportReceipt | undefined {
  if (!isObject(input) || !hasExactKeys(input, receiptKeys)) return undefined;
  const created = createDurableReceipt({
    receiptId: input.receiptId,
    receiptVersion: input.receiptVersion,
    tenantId: input.tenantId,
    accountId: input.accountId,
    nodeId: input.nodeId,
    sourceFingerprint: input.sourceFingerprint,
    sourceLocked: input.sourceLocked,
    submittedAt: input.submittedAt,
    displayedTrustStatus: input.displayedTrustStatus,
    disclosureTier: input.disclosureTier,
    retentionClass: input.retentionClass,
    createdAt: input.createdAt,
    lifecycle: input.lifecycle,
  });
  return created && created.reviewAt === input.reviewAt ? created : undefined;
}

export function isReceiptExpired(receipt: DurablePassportReceipt, now: string): boolean {
  const reviewAt = parseIsoInstant(receipt.reviewAt);
  const current = parseIsoInstant(now);
  return !reviewAt || !current || current.getTime() >= reviewAt.getTime();
}
