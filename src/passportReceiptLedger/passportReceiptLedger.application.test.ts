import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const applicationPath = resolve(process.cwd(), 'src/passportReceiptLedger/passportReceiptLedger.application.ts');
const applicationExists = existsSync(applicationPath);

const principal = { accountId: 'account-a', tenantId: 'tenant-a', authenticationEpoch: 'auth-epoch-1' } as const;
const reference = {
  nodeId: 'node-1',
  sourceFingerprint: 'sha256:locked-reference',
  sourceLocked: true,
  submittedAt: '2026-01-31T00:00:00.000Z',
  displayedTrustStatus: 'REQUIRES_CORE_LEAN',
} as const;

async function loadApplication() {
  return import(pathToFileURL(applicationPath).href);
}

function dependencies(overrides: Record<string, unknown> = {}) {
  return {
    authorization: {
      requirePrincipal: async () => principal,
    },
    sourceReferences: {
      readLockedReference: async () => reference,
    },
    ledger: {
      createIfAbsent: async () => 'CREATED',
      listOwned: async () => [],
      readOwned: async () => 'NOT_FOUND',
      revokeOwned: async () => 'APPLIED',
      deleteOwned: async () => 'DELETED',
    },
    ids: { issue: () => 'receipt-1' },
    clock: { now: () => '2026-01-31T00:00:00.000Z' },
    ...overrides,
  };
}

describe('B2-A G3 — passport receipt ledger application', () => {
  it('B2G3-A01: requires the separately gated durable receipt application module', () => {
    expect(applicationExists).toBe(true);
  });

  if (applicationExists) {
    it('B2G3-A02: derives account and tenant only from the authenticated principal on create', async () => {
      const application = await loadApplication();
      let received: unknown;
      const service = application.createPassportReceiptLedgerService(dependencies({
        ledger: {
          createIfAbsent: async (receipt: unknown) => {
            received = receipt;
            return 'CREATED';
          },
          listOwned: async () => [],
          readOwned: async () => 'NOT_FOUND',
          revokeOwned: async () => 'APPLIED',
          deleteOwned: async () => 'DELETED',
        },
      }));

      await expect(service.create({
        idempotencyKey: 'create-1',
        nodeId: 'node-1',
        sourceFingerprint: 'sha256:locked-reference',
        requestedDisclosureTier: 'REFERENCE_ONLY',
        accountId: 'attacker-account',
      })).resolves.toBe('INVALID_COMMAND');
      await expect(service.create({
        idempotencyKey: 'create-2',
        nodeId: 'node-1',
        sourceFingerprint: 'sha256:locked-reference',
        requestedDisclosureTier: 'REFERENCE_ONLY',
      })).resolves.toBe('CREATED');
      expect(received).toMatchObject({ accountId: 'account-a', tenantId: 'tenant-a' });
    });

    it('B2G3-A03: sends both exact owner scope dimensions to every read/list command', async () => {
      const application = await loadApplication();
      const calls: Array<{ op: string; scope: unknown }> = [];
      const service = application.createPassportReceiptLedgerService(dependencies({
        ledger: {
          createIfAbsent: async () => 'CREATED',
          listOwned: async (scope: unknown) => {
            calls.push({ op: 'list', scope });
            return [];
          },
          readOwned: async (scope: unknown) => {
            calls.push({ op: 'read', scope });
            return 'NOT_FOUND';
          },
          revokeOwned: async () => 'APPLIED',
          deleteOwned: async () => 'DELETED',
        },
      }));
      await service.list();
      await service.read('receipt-1');
      expect(calls).toEqual([
        { op: 'list', scope: { accountId: 'account-a', tenantId: 'tenant-a' } },
        { op: 'read', scope: { accountId: 'account-a', tenantId: 'tenant-a' } },
      ]);
    });

    it('B2G3-A04: collapses absent, foreign and expired receipt reads to the same non-enumerating outcome', async () => {
      const application = await loadApplication();
      for (const result of ['NOT_FOUND', 'OUT_OF_SCOPE', 'EXPIRED']) {
        const service = application.createPassportReceiptLedgerService(dependencies({
          ledger: {
            createIfAbsent: async () => 'CREATED',
            listOwned: async () => [],
            readOwned: async () => result,
            revokeOwned: async () => 'APPLIED',
            deleteOwned: async () => 'DELETED',
          },
        }));
        await expect(service.read('untrusted-id')).resolves.toBe('RECEIPT_UNAVAILABLE');
      }
    });

    it('B2G3-A05: preserves typed fail-closed authorization, reference and ledger-outage outcomes', async () => {
      const application = await loadApplication();
      const unauthorized = application.createPassportReceiptLedgerService(dependencies({
        authorization: { requirePrincipal: async () => 'UNAUTHORIZED' },
      }));
      await expect(unauthorized.list()).resolves.toBe('UNAUTHORIZED');

      const missingReference = application.createPassportReceiptLedgerService(dependencies({
        sourceReferences: { readLockedReference: async () => 'MISMATCH' },
      }));
      await expect(missingReference.create({
        idempotencyKey: 'create-1', nodeId: 'node-1', sourceFingerprint: 'other', requestedDisclosureTier: 'REFERENCE_ONLY',
      })).resolves.toBe('REFERENCE_UNAVAILABLE');

      const unavailable = application.createPassportReceiptLedgerService(dependencies({
        ledger: {
          createIfAbsent: async () => 'UNAVAILABLE', listOwned: async () => 'UNAVAILABLE', readOwned: async () => 'UNAVAILABLE',
          revokeOwned: async () => 'UNAVAILABLE', deleteOwned: async () => 'UNAVAILABLE',
        },
      }));
      await expect(unavailable.list()).resolves.toBe('LEDGER_UNAVAILABLE');
    });
  }
});
