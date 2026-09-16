// ============================================================================
// BUG-06 REGRESSION: unified degradation contract for all AI-dependent
// server endpoints (FULL_AUDIT_REPORT §3 BUG-06).
//
// Contract: HTTP 200 + `degraded: "ai_unavailable"` + human-readable `error`
// whenever the AI backend failed and a local fallback (or empty result) was
// returned. The UI must surface the reason to the user.
// ============================================================================

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AI_DEGRADED_REASON, aiDegradedBody } from './aiDegradation';

describe('BUG-06 contract: aiDegradedBody()', () => {
  it('maps an Error to {degraded, error} with the original message', () => {
    const error = new Error('GEMINI_API_KEY не настроен');
    expect(aiDegradedBody(error)).toEqual({
      degraded: AI_DEGRADED_REASON,
      error: 'GEMINI_API_KEY не настроен',
    });
  });

  it('passes a plain string reason through unchanged', () => {
    expect(aiDegradedBody('fetch failed: timeout')).toEqual({
      degraded: 'ai_unavailable',
      error: 'fetch failed: timeout',
    });
  });

  it('never throws on arbitrary values', () => {
    expect(() => aiDegradedBody({ code: 42 })).not.toThrow();
    expect(aiDegradedBody(null).degraded).toBe('ai_unavailable');
  });
});

describe('BUG-06 contract topology: server.ts', () => {
  const serverSource = readFileSync(resolve(import.meta.dirname, '..', 'server.ts'), 'utf8');

  it('imports the shared helper exactly once', () => {
    expect(serverSource).toContain('import { aiDegradedBody } from "./server/aiDegradation";');
  });

  it('spreads the unified contract in all 6 AI fallback branches', () => {
    const occurrences = serverSource.split('...aiDegradedBody(e)').length - 1;
    // generateProof, discoverTasks, aiAssistantNode, expandLeaves,
    // fillNodeParams, searchDerivatives
    expect(occurrences).toBe(6);
  });

  it('expandLeaves no longer returns a bare {tasks: [], error} without the marker', () => {
    expect(serverSource).not.toContain('res.json({ tasks: [], error: e?.message || e })');
  });
});
