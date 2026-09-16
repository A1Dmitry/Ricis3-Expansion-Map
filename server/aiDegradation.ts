// ============================================================================
// AI DEGRADATION CONTRACT (BUG-06)
// Single classification for every AI-dependent endpoint degradation, so the
// frontend can always tell WHY it got an empty/local result:
//   - HTTP 503 + { degraded: 'no_api_key' | 'ai_unavailable', error } — no
//     local draft exists, the request genuinely failed;
//   - HTTP 200 + { degraded: 'local_draft', ... } — a documented canonical
//     local template was returned instead of AI output.
// ============================================================================

export type AiDegradationReason = 'no_api_key' | 'ai_unavailable';

export const LOCAL_DRAFT_DEGRADATION = 'local_draft' as const;

/**
 * Classifies an AI-call failure into the machine-readable degradation reason.
 * The GEMINI_API_KEY marker mirrors the exact error thrown by
 * callAIWithFallback when the key is missing or a placeholder.
 */
export function classifyAiDegradation(errorMessage: string): AiDegradationReason {
  return errorMessage.includes('GEMINI_API_KEY') ? 'no_api_key' : 'ai_unavailable';
}

export interface ExpandLeavesDegradedResponse {
  readonly status: 503;
  readonly body: {
    readonly tasks: never[];
    readonly error: string;
    readonly degraded: AiDegradationReason;
  };
}

/**
 * Uniform failure response for /api/expandLeaves: previously this endpoint
 * answered HTTP 200 with { tasks: [], error } and the UI silently showed
 * "0 новых задач" without the reason.
 */
export function expandLeavesDegradedResponse(errorMessage: string): ExpandLeavesDegradedResponse {
  return {
    status: 503,
    body: {
      tasks: [],
      error: errorMessage,
      degraded: classifyAiDegradation(errorMessage),
    },
  };
}
