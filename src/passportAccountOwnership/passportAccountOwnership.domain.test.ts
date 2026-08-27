import { describe, expect, it } from 'vitest';

type FutureDomain = Readonly<{
  createOwnerScope(input: unknown): unknown;
  createLockedReference(input: unknown): unknown;
  createReceipt(input: unknown): unknown;
  transitionReceipt(input: unknown): unknown;
}>;

const futureDomainPath = './passportAccountOwnership.domain';

const loadFutureDomain = async (): Promise<FutureDomain> =>
  import(/* @vite-ignore */ futureDomainPath) as Promise<FutureDomain>;

const validOwner = Object.freeze({
  accountId: 'account-opaque-001',
  tenantId: 'tenant-opaque-001',
  authenticationEpoch: 'epoch-opaque-001',
});

const validReference = Object.freeze({
  nodeId: 'node-opaque-001',
  sourceFingerprint: 'fingerprint-opaque-001',
  sourceLocked: true,
  submittedAt: '2026-08-26T00:00:00.000Z',
  displayedTrustStatus: 'REQUIRES_CORE_LEAN',
});

const validReceipt = Object.freeze({
  receiptId: 'receipt-opaque-001',
  receiptVersion: 1,
  accountId: validOwner.accountId,
  tenantId: validOwner.tenantId,
  ...validReference,
  disclosureTier: 'REFERENCE_ONLY',
  retentionClass: 'ACCOUNT_MANAGED',
  createdAt: '2026-08-26T00:01:00.000Z',
  reviewAt: '2026-09-26T00:01:00.000Z',
  lifecycle: 'ACTIVE',
});

describe('RICIS-PASSPORT-ACCOUNT-OWNERSHIP-01 G3 — pure metadata domain', () => {
  it.each([
    ['D01', validOwner, { accountId: validOwner.accountId, tenantId: validOwner.tenantId }],
    ['D02', { ...validOwner, accountId: '   ' }, undefined],
    ['D03', { ...validOwner, tenantId: '' }, undefined],
    ['D04', { ...validOwner, authenticationEpoch: 7 }, undefined],
  ])('%s validates a closed authenticated owner scope', async (_id, input, expected) => {
    const domain = await loadFutureDomain();
    expect(domain.createOwnerScope(input)).toStrictEqual(expected);
  });

  it.each([
    ['D05', validReference, validReference],
    ['D06', { ...validReference, sourceLocked: false }, undefined],
    ['D07', { ...validReference, sourceFingerprint: ' ' }, undefined],
    ['D08', { ...validReference, displayedTrustStatus: 'UNKNOWN' }, undefined],
  ])('%s validates only a locked provenance reference', async (_id, input, expected) => {
    const domain = await loadFutureDomain();
    expect(domain.createLockedReference(input)).toStrictEqual(expected);
  });

  it.each([
    ['D09', validReceipt, validReceipt],
    ['D10', { ...validReceipt, receiptVersion: 2 }, undefined],
    ['D11', { ...validReceipt, disclosureTier: 'RAW' }, undefined],
    ['D12', { ...validReceipt, retentionClass: 'INFINITE' }, undefined],
    ['D13', { ...validReceipt, sourceLocked: false }, undefined],
    ['D14', { ...validReceipt, unexpectedField: 'reject' }, undefined],
  ])('%s accepts only the closed metadata receipt envelope', async (_id, input, expected) => {
    const domain = await loadFutureDomain();
    expect(domain.createReceipt(input)).toStrictEqual(expected);
  });

  it.each([
    ['D15', { receipt: validReceipt, command: 'REVOKE' }, 'REVOKED'],
    ['D16', { receipt: { ...validReceipt, lifecycle: 'DELETED' }, command: 'REVOKE' }, undefined],
  ])('%s applies only permitted terminal lifecycle transitions', async (_id, input, expectedLifecycle) => {
    const domain = await loadFutureDomain();
    const result = domain.transitionReceipt(input) as { lifecycle?: string } | undefined;
    expect(result?.lifecycle).toBe(expectedLifecycle);
  });
});
