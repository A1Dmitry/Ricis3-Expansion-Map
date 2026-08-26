import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface LegacyProofDiagnosticModule { createLegacyProofDiagnostic(input: unknown): Promise<unknown>; }
const CONTRACT_PATH = './legacyProofDiagnostic';
const future = () => import(/* @vite-ignore */ CONTRACT_PATH) as Promise<LegacyProofDiagnosticModule>;
async function domainSource(): Promise<string> { await future(); return readFileSync('src/model/legacyProofDiagnostic.ts', 'utf8'); }
async function logicSource(): Promise<string> { await future(); return readFileSync('src/model/logic.ts', 'utf8'); }

describe('OIR-02 — dependency topology and release separation', () => {
  it('OIR02-QA-37: has only a type-only import from existing model types', async () => {
    const text = await domainSource();
    expect(text.match(/^import .* from /gm) ?? []).toHaveLength(1);
    expect(text).toMatch(/^import type \{[\s\S]*\} from ['"]\.\/types['"];$/m);
  });

  it('OIR02-QA-38: has no Core, Lean, consent, Passport, agent, provider, model or gateway dependency', async () => {
    const text = await domainSource();
    expect(text).not.toMatch(/^import.*(RicisCore|Wasm|lean|Consent|Passport|agent|provider|model|Gateway|authoritativeProofStatePolicy)/im);
  });

  it('OIR02-QA-39: has no browser, network, server, API or transport behavior', async () => {
    const text = await domainSource();
    expect(text).not.toMatch(/^import.*(apiClient|server|browser|react|http|network)/im);
    expect(text).not.toMatch(/\b(fetch|XMLHttpRequest|WebSocket|window\.open|postJson|\/api\/)\b/);
  });

  it('OIR02-QA-40: has no UI, store, persistence, migration, catalog or graph behavior', async () => {
    const text = await domainSource();
    expect(text).not.toMatch(/^import.*(store|persist|migration|catalog|graph|Map3D|component)/im);
    expect(text).not.toMatch(/\b(localStorage|sessionStorage|indexedDB)\b/);
  });

  it('OIR02-QA-41: leaves authoritative proof policy, Core bridge and API client source bytes unchanged', async () => {
    await future();
    const baseline = 'ce3aacbdeba5ecd31b462484a82c5bccfe28cad1';
    const files = ['src/model/authoritativeProofStatePolicy.ts', 'src/services/ricisCore/RicisWasmBridge.ts', 'src/model/apiClient.ts'];
    for (const path of files) {
      const current = readFileSync(path, 'utf8');
      const { execFileSync } = await import('node:child_process');
      const published = execFileSync('git', ['show', `${baseline}:${path}`], { encoding: 'utf8' });
      expect(current).toBe(published);
    }
  });

  it('OIR02-QA-42: makes exactly one narrow logic import and no other logic behavior change surface', async () => {
    const text = await logicSource();
    expect(text).toMatch(/^import \{ createLegacyProofDiagnostic \} from ['"]\.\/legacyProofDiagnostic['"];$/m);
    expect(text.match(/createLegacyProofDiagnostic\(/g) ?? []).toHaveLength(1);
  });

  it('OIR02-QA-43: contains no version, commit, tag, push, publish or release behavior', async () => {
    const text = await domainSource();
    expect(text).not.toMatch(/\b(npm version|git commit|git push|publish|release:check|APP_VERSION)\b/i);
  });

  it('OIR02-QA-44: exposes no external action and does not claim proof, Core or Lean verification', async () => {
    const module = await future();
    expect(Object.keys(module)).toEqual(['createLegacyProofDiagnostic']);
    const text = await domainSource();
    expect(text).not.toMatch(/LeanVerified|CoreVerified|authoritative|certified|verified proof/i);
  });
});
