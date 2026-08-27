import { describe, expect, it } from 'vitest';

type FutureApplication = Readonly<{
  createPassportReceiptService(dependencies: unknown): Readonly<{
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

const owner = Object.freeze({
  accountId: 'account-opaque-owner',
  tenantId: 'tenant-opaque-owner',
  authenticationEpoch: 'epoch-opaque-owner',
});

const makeDependencies = () => {
  const observedScopes: unknown[] = [];
  return {
    observedScopes,
    dependencies: {
      accountAccess: { async requireAuthenticatedPrincipal() { return owner; } },
      sourceLockReferences: { async readLockedReference() { return 'NOT_FOUND'; } },
      receipts: {
        async createIfAbsent() { return 'CREATED'; },
        async listOwned(scope: unknown) { observedScopes.push(scope); return []; },
        async readOwned(scope: unknown) { observedScopes.push(scope); return 'NOT_FOUND'; },
        async transitionOwned(input: unknown) { observedScopes.push(input); return 'NOT_FOUND'; },
      },
      ids: { issue: () => 'receipt-opaque-owner' },
      clock: { now: () => '2026-08-26T00:00:00.000Z' },
    },
  };
};

describe('RICIS-PASSPORT-ACCOUNT-OWNERSHIP-01 G3 — tenant isolation and lifecycle privacy', () => {
  it.each([
    ['I01', 'list', undefined, []],
    ['I02', 'read', 'receipt-opaque-unknown', 'NOT_FOUND'],
    ['I03', 'read', 'receipt-opaque-cross-owner', 'NOT_FOUND'],
    ['I04', 'export', undefined, []],
  ])('%s derives the same authenticated account and tenant for %s', async (_id, operation, receiptId, expected) => {
    const application = await loadFutureApplication();
    const fake = makeDependencies();
    const service = application.createPassportReceiptService(fake.dependencies);
    const result = operation === 'list'
      ? await service.list()
      : operation === 'read'
        ? await service.read(receiptId as string)
        : await service.exportMetadata();
    expect(result).toStrictEqual(expected);
    expect(JSON.stringify(fake.observedScopes)).toContain(owner.accountId);
    expect(JSON.stringify(fake.observedScopes)).toContain(owner.tenantId);
  });

  it.each([
    ['I05', { receiptId: 'receipt-opaque-unknown', idempotencyKey: 'request-opaque-isolation-01' }, 'NOT_FOUND'],
    ['I06', { receiptId: 'receipt-opaque-cross-tenant', idempotencyKey: 'request-opaque-isolation-02' }, 'NOT_FOUND'],
    ['I07', { receiptId: 'receipt-opaque-owner', idempotencyKey: 'request-opaque-isolation-03', confirmed: true }, 'NOT_FOUND'],
  ])('%s does not disclose or mutate another owner lifecycle record', async (_id, input, expected) => {
    const application = await loadFutureApplication();
    const fake = makeDependencies();
    const service = application.createPassportReceiptService(fake.dependencies);
    const result = 'confirmed' in input ? await service.delete(input) : await service.revoke(input);
    expect(result).toBe(expected);
  });

  it.each([
    ['I08', 'https://example.invalid'],
    ['I09', 'token-opaque-forbidden'],
    ['I10', 'unexpectedField'],
  ])('%s rejects client-shaped transport or ownership escalation data %s', async (_id, forbiddenValue) => {
    const application = await loadFutureApplication();
    const fake = makeDependencies();
    const service = application.createPassportReceiptService(fake.dependencies);
    await expect(service.revoke({
      receiptId: 'receipt-opaque-owner',
      idempotencyKey: 'request-opaque-isolation-04',
      forbiddenValue,
    })).resolves.toBe('INVALID_COMMAND');
  });
});
