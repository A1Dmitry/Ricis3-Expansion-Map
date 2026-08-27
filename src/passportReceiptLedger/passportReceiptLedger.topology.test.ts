import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const domainPath = resolve(process.cwd(), 'src/passportReceiptLedger/passportReceiptLedger.domain.ts');
const applicationPath = resolve(process.cwd(), 'src/passportReceiptLedger/passportReceiptLedger.application.ts');
const topologyReady = existsSync(domainPath) && existsSync(applicationPath);

const prohibitedPatterns = [
  /from\s+['"][^.'"][^'"]*['"]/u,
  /localStorage|sessionStorage|indexedDB|CacheStorage/iu,
  /fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|axios|webhook/iu,
  /saveMapToDb|exportMapJson|importMapJson|updateProof|updateNode|submitExternalLeanProof|acceptVerifiedExternalLeanProof/iu,
  /AuthoritativeProofStatePolicy|externalLean|proofLatex|currentProof|sourceBytes|leanSource|kernelEvidence/iu,
  /lean\/|lake\b|elan\b|wasm|ricis resolver|calculateRicis/iu,
  /download|clipboard|window\.open|navigator\.sendBeacon|scheduler|setInterval/iu,
] as const;

describe('B2-A G3 — passport receipt ledger topology', () => {
  it('B2G3-T01: requires both separately gated local receipt ledger modules', () => {
    expect(topologyReady).toBe(true);
  });

  if (topologyReady) {
    it('B2G3-T02: permits only the sibling domain import in the application module', () => {
      const application = readFileSync(applicationPath, 'utf8');
      const imports = [...application.matchAll(/^import[\s\S]*?from\s+['"]([^'"]+)['"];?$/gmu)].map(match => match[1]);
      expect(imports).toEqual(['./passportReceiptLedger.domain']);
    });

    it('B2G3-T03: keeps the domain module dependency-free and both modules free of prohibited infrastructure or authority coupling', () => {
      const domain = readFileSync(domainPath, 'utf8');
      const application = readFileSync(applicationPath, 'utf8');
      expect(domain).not.toMatch(/^import\s/mu);
      for (const source of [domain, application]) {
        for (const pattern of prohibitedPatterns) expect(source).not.toMatch(pattern);
      }
    });

    it('B2G3-T04: exposes a local deterministic surface only, without provider, persistence, UI or delivery objects', async () => {
      const application = await import(`${applicationPath}?g3-topology`);
      expect(Object.keys(application).sort()).toEqual(['createPassportReceiptLedgerService']);
    });
  }
});
