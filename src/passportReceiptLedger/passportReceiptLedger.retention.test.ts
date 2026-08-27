import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const applicationPath = resolve(process.cwd(), 'src/passportReceiptLedger/passportReceiptLedger.application.ts');
const applicationExists = existsSync(applicationPath);

const principal = { accountId: 'account-a', tenantId: 'tenant-a', authenticationEpoch: 'auth-epoch-1' } as const;
const activeReceipt = {
  receiptId: 'receipt-1', receiptVersion: 1, tenantId: 'tenant-a', accountId: 'account-a',
  nodeId: 'node-1', sourceFingerprint: 'sha256:locked-reference', sourceLocked: true,
  submittedAt: '2026-01-31T00:00:00.000Z', displayedTrustStatus: 'REQUIRES_CORE_LEAN',
  disclosureTier: 'REFERENCE_ONLY', retentionClass: 'ACCOUNT_MANAGED',
  createdAt: '2026-01-31T00:00:00.000Z', reviewAt: '2027-01-31T00:00:00.000Z', lifecycle: 'ACTIVE',
} as const;

async function loadApplication() {
  return import(pathToFileURL(applicationPath).href);
}

function dependencies(overrides: Record<string, unknown> = {}) {
  return {
    authorization: { requirePrincipal: async () => principal },
    sourceReferences: { readLockedReference: async () => ({
      nodeId: activeReceipt.nodeId, sourceFingerprint: activeReceipt.sourceFingerprint, sourceLocked: true,
      submittedAt: activeReceipt.submittedAt, displayedTrustStatus: activeReceipt.displayedTrustStatus,
    }) },
    ledger: {
      createIfAbsent: async () => 'CREATED',
      listOwned: async () => [activeReceipt],
      readOwned: async () => activeReceipt,
      revokeOwned: async () => 'APPLIED',
      deleteOwned: async () => 'DELETED',
    },
    ids: { issue: () => 'receipt-2' },
    clock: { now: () => '2026-06-01T00:00:00.000Z' },
    ...overrides,
  };
}

describe('B2-A G3 — passport receipt ledger retention and lifecycle', () => {
  it('B2G3-R01: requires the separately gated durable receipt application module', () => {
    expect(applicationExists).toBe(true);
  });

  if (applicationExists) {
    it('B2G3-R02: permits scoped metadata operations before reviewAt and returns closed JSON metadata only', async () => {
      const application = await loadApplication();
      const service = application.createPassportReceiptLedgerService(dependencies());
      await expect(service.list()).resolves.toEqual([activeReceipt]);
      await expect(service.exportMetadataJson()).resolves.toBe(JSON.stringify([activeReceipt]));
    });

    it('B2G3-R03: fails closed for list, read and export at reviewAt without retaining an automatic renewal path', async () => {
      const application = await loadApplication();
      const service = application.createPassportReceiptLedgerService(dependencies({
        clock: { now: () => '2027-01-31T00:00:00.000Z' },
      }));
      await expect(service.list()).resolves.toBe('RECEIPT_UNAVAILABLE');
      await expect(service.read('receipt-1')).resolves.toBe('RECEIPT_UNAVAILABLE');
      await expect(service.exportMetadataJson()).resolves.toBe('RECEIPT_UNAVAILABLE');
      expect('renew' in service).toBe(false);
    });

    it('B2G3-R04: sends an exact owner scope plus idempotency key for revoke and leaves receipt authority outside the service', async () => {
      const application = await loadApplication();
      let received: unknown;
      const service = application.createPassportReceiptLedgerService(dependencies({
        ledger: {
          createIfAbsent: async () => 'CREATED', listOwned: async () => [], readOwned: async () => 'NOT_FOUND',
          revokeOwned: async (input: unknown) => { received = input; return 'APPLIED'; }, deleteOwned: async () => 'DELETED',
        },
      }));
      await expect(service.revoke({ receiptId: 'receipt-1', idempotencyKey: 'revoke-1' })).resolves.toBe('REVOKED');
      expect(received).toEqual({
        scope: { accountId: 'account-a', tenantId: 'tenant-a' }, receiptId: 'receipt-1', idempotencyKey: 'revoke-1', lifecycle: 'REVOKED',
      });
      expect('acceptVerifiedExternalLeanProof' in service).toBe(false);
    });

    it('B2G3-R05: invokes physical exact-scope deletion with confirmation and never creates a tombstone result', async () => {
      const application = await loadApplication();
      let received: unknown;
      const service = application.createPassportReceiptLedgerService(dependencies({
        ledger: {
          createIfAbsent: async () => 'CREATED', listOwned: async () => [], readOwned: async () => 'NOT_FOUND', revokeOwned: async () => 'APPLIED',
          deleteOwned: async (input: unknown) => { received = input; return 'DELETED'; },
        },
      }));
      await expect(service.delete({ receiptId: 'receipt-1', idempotencyKey: 'delete-1', confirmed: true })).resolves.toBe('DELETED');
      expect(received).toEqual({
        scope: { accountId: 'account-a', tenantId: 'tenant-a' }, receiptId: 'receipt-1', idempotencyKey: 'delete-1', confirmed: true,
      });
      await expect(service.delete({ receiptId: 'receipt-1', idempotencyKey: 'delete-2', confirmed: false })).resolves.toBe('INVALID_COMMAND');
    });
  }
});
