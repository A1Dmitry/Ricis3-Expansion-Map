import { describe, expect, it } from 'vitest';

type FutureApplication = Readonly<{
  createPassportReceiptService(dependencies: unknown): Readonly<{
    create(command: unknown): Promise<unknown>;
    list(): Promise<unknown>;
    read(receiptId: string): Promise<unknown>;
    revoke(command: unknown): Promise<unknown>;
    delete(command: unknown): Promise<unknown>;
    exportMetadata(): Promise<unknown>;
  }>;
}>;

const futureApplicationPath = './passportAccountOwnership.application';

const loadFutureApplication = async (): Promise<FutureApplication> =>
  import(/* @vite-ignore */ futureApplicationPath) as Promise<FutureApplication>;

const principal = Object.freeze({
  accountId: 'account-opaque-001',
  tenantId: 'tenant-opaque-001',
  authenticationEpoch: 'epoch-opaque-001',
});

const command = Object.freeze({
  idempotencyKey: 'request-opaque-001',
  nodeId: 'node-opaque-001',
  sourceFingerprint: 'fingerprint-opaque-001',
  requestedDisclosureTier: 'REFERENCE_ONLY',
});

const makeDependencies = (overrides: Record<string, unknown> = {}) => {
  const calls: string[] = [];
  return {
    calls,
    dependencies: {
      accountAccess: {
        async requireAuthenticatedPrincipal() {
          calls.push('principal');
          return principal;
        },
      },
      sourceLockReferences: {
        async readLockedReference() {
          calls.push('reference');
          return {
            nodeId: command.nodeId,
            sourceFingerprint: command.sourceFingerprint,
            sourceLocked: true,
            submittedAt: '2026-08-26T00:00:00.000Z',
            displayedTrustStatus: 'REQUIRES_CORE_LEAN',
          };
        },
      },
      receipts: {
        async createIfAbsent() {
          calls.push('create');
          return 'CREATED';
        },
        async listOwned() {
          calls.push('list');
          return [];
        },
        async readOwned() {
          calls.push('read');
          return 'NOT_FOUND';
        },
        async transitionOwned() {
          calls.push('transition');
          return 'APPLIED';
        },
      },
      ids: { issue: () => 'receipt-opaque-001' },
      clock: { now: () => '2026-08-26T00:01:00.000Z' },
      ...overrides,
    },
  };
};

describe('RICIS-PASSPORT-ACCOUNT-OWNERSHIP-01 G3 — pure application service', () => {
  it.each([
    ['A01', { accountAccess: { async requireAuthenticatedPrincipal() { return 'UNAUTHORIZED'; } } }, command, 'UNAUTHORIZED'],
    ['A02', { accountAccess: { async requireAuthenticatedPrincipal() { return 'UNAVAILABLE'; } } }, command, 'AUTH_UNAVAILABLE'],
    ['A03', { sourceLockReferences: { async readLockedReference() { return 'NOT_FOUND'; } } }, command, 'REFERENCE_NOT_FOUND'],
    ['A04', { sourceLockReferences: { async readLockedReference() { return 'MISMATCH'; } } }, command, 'REFERENCE_MISMATCH'],
    ['A05', { sourceLockReferences: { async readLockedReference() { return 'UNAVAILABLE'; } } }, command, 'REFERENCE_UNAVAILABLE'],
  ])('%s fails closed before any receipt write', async (_id, overrides, input, expected) => {
    const application = await loadFutureApplication();
    const fake = makeDependencies(overrides);
    const service = application.createPassportReceiptService(fake.dependencies);
    await expect(service.create(input)).resolves.toBe(expected);
    expect(fake.calls.includes('create')).toBe(false);
  });

  it.each([
    ['A06', {}, 'CREATED'],
    ['A07', { receipts: { ...makeDependencies().dependencies.receipts, async createIfAbsent() { return 'IDEMPOTENT_REPLAY'; } } }, 'IDEMPOTENT_REPLAY'],
    ['A08', { receipts: { ...makeDependencies().dependencies.receipts, async createIfAbsent() { return 'CONFLICT'; } } }, 'CONFLICT'],
    ['A09', { receipts: { ...makeDependencies().dependencies.receipts, async createIfAbsent() { return 'UNAVAILABLE'; } } }, 'REPOSITORY_UNAVAILABLE'],
  ])('%s maps create outcomes without proof or authority side effects', async (_id, overrides, expected) => {
    const application = await loadFutureApplication();
    const fake = makeDependencies(overrides);
    const service = application.createPassportReceiptService(fake.dependencies);
    await expect(service.create(command)).resolves.toBe(expected);
  });

  it.each([
    ['A10', 'list', undefined, []],
    ['A11', 'read', 'receipt-opaque-missing', 'NOT_FOUND'],
    ['A12', 'read', 'receipt-opaque-001', 'NOT_FOUND'],
  ])('%s derives owner scope before %s receipt access', async (_id, operation, receiptId, expected) => {
    const application = await loadFutureApplication();
    const fake = makeDependencies();
    const service = application.createPassportReceiptService(fake.dependencies);
    const result = operation === 'list' ? await service.list() : await service.read(receiptId as string);
    expect(result).toStrictEqual(expected);
    expect(fake.calls.includes('principal')).toBe(true);
    expect(fake.calls.includes('reference')).toBe(false);
  });

  it.each([
    ['A13', 'revoke', { receiptId: 'receipt-opaque-001', idempotencyKey: 'request-opaque-002' }, 'REVOKED'],
    ['A14', 'delete', { receiptId: 'receipt-opaque-001', idempotencyKey: 'request-opaque-003', confirmed: true }, 'DELETED'],
    ['A15', 'delete', { receiptId: 'receipt-opaque-001', idempotencyKey: 'request-opaque-004', confirmed: false }, 'INVALID_COMMAND'],
  ])('%s applies only owner-scoped lifecycle transitions', async (_id, operation, input, expected) => {
    const application = await loadFutureApplication();
    const fake = makeDependencies();
    const service = application.createPassportReceiptService(fake.dependencies);
    const result = operation === 'revoke' ? await service.revoke(input) : await service.delete(input);
    expect(result).toBe(expected);
  });

  it.each([
    ['A16', {}, []],
    ['A17', { receipts: { ...makeDependencies().dependencies.receipts, async listOwned() { return 'UNAVAILABLE'; } } }, 'REPOSITORY_UNAVAILABLE'],
    ['A18', { accountAccess: { async requireAuthenticatedPrincipal() { return 'UNAUTHORIZED'; } } }, 'UNAUTHORIZED'],
  ])('%s returns metadata-only export outcomes with no transport', async (_id, overrides, expected) => {
    const application = await loadFutureApplication();
    const fake = makeDependencies(overrides);
    const service = application.createPassportReceiptService(fake.dependencies);
    await expect(service.exportMetadata()).resolves.toStrictEqual(expected);
  });
});
