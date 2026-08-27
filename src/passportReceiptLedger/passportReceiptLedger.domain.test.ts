import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const domainPath = resolve(process.cwd(), 'src/passportReceiptLedger/passportReceiptLedger.domain.ts');
const domainExists = existsSync(domainPath);

const baseInput = {
  receiptId: 'receipt-1',
  receiptVersion: 1,
  tenantId: 'tenant-a',
  accountId: 'account-a',
  nodeId: 'node-1',
  sourceFingerprint: 'sha256:locked-reference',
  sourceLocked: true,
  submittedAt: '2026-01-31T00:00:00.000Z',
  displayedTrustStatus: 'REQUIRES_CORE_LEAN',
  disclosureTier: 'REFERENCE_ONLY',
  retentionClass: 'ACCOUNT_MANAGED',
  createdAt: '2026-01-31T00:00:00.000Z',
  lifecycle: 'ACTIVE',
} as const;

async function loadDomain() {
  return import(pathToFileURL(domainPath).href);
}

describe('B2-A G3 — passport receipt ledger domain', () => {
  it('B2G3-D01: requires the separately gated durable receipt domain module', () => {
    expect(domainExists).toBe(true);
  });

  if (domainExists) {
    it('B2G3-D02: creates only the closed receipt envelope and derives reviewAt exactly 12 calendar months after creation', async () => {
      const domain = await loadDomain();
      const receipt = domain.createDurableReceipt(baseInput);

      expect(receipt).toEqual({ ...baseInput, reviewAt: '2027-01-31T00:00:00.000Z' });
      expect(Object.isFrozen(receipt)).toBe(true);
      expect(Object.keys(receipt ?? {}).sort()).toEqual([
        'accountId', 'createdAt', 'disclosureTier', 'displayedTrustStatus', 'lifecycle', 'nodeId',
        'receiptId', 'receiptVersion', 'retentionClass', 'reviewAt', 'sourceFingerprint',
        'sourceLocked', 'submittedAt', 'tenantId',
      ]);
    });

    it('B2G3-D03: rejects unknown and source-shaped fields rather than persisting an open payload', async () => {
      const domain = await loadDomain();
      expect(domain.createDurableReceipt({ ...baseInput, leanSource: 'by sorry' })).toBeUndefined();
      expect(domain.createDurableReceipt({ ...baseInput, sourceBytes: 'secret' })).toBeUndefined();
      expect(domain.createDurableReceipt({ ...baseInput, lifecycle: 'EXPIRED' })).toBeUndefined();
      expect(domain.createDurableReceipt({ ...baseInput, sourceLocked: false })).toBeUndefined();
    });

    it('B2G3-D04: treats reviewAt as a finite availability boundary, not an authority lifecycle state', async () => {
      const domain = await loadDomain();
      const receipt = domain.createDurableReceipt(baseInput);
      expect(receipt).toBeDefined();
      expect(domain.isReceiptExpired(receipt, '2027-01-30T23:59:59.999Z')).toBe(false);
      expect(domain.isReceiptExpired(receipt, '2027-01-31T00:00:00.000Z')).toBe(true);
      expect(domain.isReceiptExpired(receipt, '2027-02-01T00:00:00.000Z')).toBe(true);
    });

    it('B2G3-D05: supports only active/revoked/deleted receipt lifecycle values and no tombstone DTO', async () => {
      const domain = await loadDomain();
      expect(domain.receiptLifecycleValues).toEqual(['ACTIVE', 'REVOKED', 'DELETED']);
      expect('createTombstone' in domain).toBe(false);
      expect('renewReceipt' in domain).toBe(false);
    });
  }
});
