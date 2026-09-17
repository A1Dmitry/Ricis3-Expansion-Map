import { afterEach, describe, expect, it, vi } from 'vitest';
import { describeAiDegradation, postJson } from './apiClient';

describe('apiClient AI degradation contract (incident 2026-09-17 C2)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('describeAiDegradation returns a non-empty Russian label for every flag', () => {
    expect(describeAiDegradation('local_draft')).toMatch(/локальн/i);
    expect(describeAiDegradation('no_api_key')).toMatch(/GEMINI_API_KEY/i);
    expect(describeAiDegradation('ai_unavailable')).toMatch(/недоступ/i);
    expect(describeAiDegradation(undefined)).toBeNull();
  });

  it('propagates degraded: local_draft from a 200 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            proof: 'local draft body',
            model: 'canonical-ricis-engine',
            degraded: 'local_draft',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ),
    );

    const result = await postJson<{ proof: string }>('/api/generateProof', {
      id: 'n1',
      title: 't',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.degraded).toBe('local_draft');
      expect(result.data.proof).toContain('local draft');
    }
  });

  it('propagates degraded: no_api_key from a 503 response into the error string', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            tasks: [],
            error: 'GEMINI_API_KEY не настроен',
            degraded: 'no_api_key',
          }),
          { status: 503, headers: { 'content-type': 'application/json' } },
        ),
      ),
    );

    const result = await postJson('/api/expandLeaves', { leaves: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.degraded).toBe('no_api_key');
      expect(result.status).toBe(503);
      expect(result.error).toMatch(/GEMINI_API_KEY/i);
      expect(result.error).toMatch(/не настроен/i);
    }
  });
});
