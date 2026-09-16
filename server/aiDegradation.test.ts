import { describe, expect, it } from 'vitest';
import {
  LOCAL_DRAFT_DEGRADATION,
  classifyAiDegradation,
  expandLeavesDegradedResponse,
} from './aiDegradation';

describe('AI degradation contract (BUG-06)', () => {
  it('classifies a missing GEMINI_API_KEY as no_api_key', () => {
    expect(
      classifyAiDegradation('GEMINI_API_KEY не настроен или содержит некорректное значение (about:blank).'),
    ).toBe('no_api_key');
  });

  it('classifies any other AI failure as ai_unavailable', () => {
    expect(classifyAiDegradation('All models failed: 429 RESOURCE_EXHAUSTED')).toBe('ai_unavailable');
    expect(classifyAiDegradation('network timeout')).toBe('ai_unavailable');
  });

  it('expandLeaves degradation is HTTP 503 with an empty task list and a reason', () => {
    const response = expandLeavesDegradedResponse('GEMINI_API_KEY не настроен');
    expect(response.status).toBe(503);
    expect(response.body.tasks).toEqual([]);
    expect(response.body.degraded).toBe('no_api_key');
    expect(response.body.error).toContain('GEMINI_API_KEY');
  });

  it('local drafts are marked with the stable local_draft marker', () => {
    expect(LOCAL_DRAFT_DEGRADATION).toBe('local_draft');
  });
});
