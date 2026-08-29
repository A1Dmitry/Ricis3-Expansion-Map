import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Revised G3 topology contract for the future one-file runtime boundary.
 * It stays green while the sanctioned production module is intentionally absent
 * and enforces the same topology once a separately approved G4 creates it.
 */

const target = 'src/agentGateway/agentGatewayRuntimeBoundary.ts';

function sourceIfImplemented(): string | null {
  return existsSync(target) ? readFileSync(target, 'utf8') : null;
}

function whenImplemented(assertion: (source: string) => void): void {
  const source = sourceIfImplemented();
  if (source !== null) assertion(source);
}

describe('Agent Gateway runtime boundary — revised G3 topology contract', () => {
  it('AGRCR-G3-T01: reserves the future wrapper to the single approved sibling module path', () => {
    expect(target).toBe('src/agentGateway/agentGatewayRuntimeBoundary.ts');
  });

  it('AGRCR-G3-T02: permits only the sibling agentGatewayApplication import when the module exists', () => {
    whenImplemented((source) => {
      const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
      expect(imports).toEqual(['./agentGatewayApplication']);
    });
  });

  it('AGRCR-G3-T03: forbids composition, server, BFF, route, provider and network dependencies when the module exists', () => {
    whenImplemented((source) => {
      expect(source).not.toMatch(/\b(server|express|route|router|bff|provider|gemini|openai|fetch|axios|http|https|websocket|XMLHttpRequest)\b/i);
    });
  });

  it('AGRCR-G3-T04: forbids browser, storage, persistence, worker and scheduler dependencies when the module exists', () => {
    whenImplemented((source) => {
      expect(source).not.toMatch(/\b(window|document|localStorage|sessionStorage|indexedDB|cookie|database|storage|persist|migration|worker|schedule|cron|setTimeout|setInterval)\b/i);
    });
  });

  it('AGRCR-G3-T05: forbids Lean/Core/source/proof/trust/state/authority dependencies and authority claims when the module exists', () => {
    whenImplemented((source) => {
      expect(source).not.toMatch(/\b(lean|lake|elan|RicisCore|Wasm|source|proof|trust|state|authority|LEAN_VERIFIED|TRUSTED_AXIOM)\b/i);
      expect(source).not.toMatch(/\b(state|status)\s*:\s*['"]resolved['"]/i);
    });
  });

  it('AGRCR-G3-T06: forbids fallback and retry mechanism tokens when the module exists', () => {
    whenImplemented((source) => {
      expect(source).not.toMatch(/\b(fallback|retry|attempt|legacy|generateProof)\b/i);
    });
  });
});
