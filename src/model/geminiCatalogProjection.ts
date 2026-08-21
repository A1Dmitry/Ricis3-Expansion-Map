import { AVAILABLE_GEMINI_MODELS } from './modelPool.types';

/**
 * Single DRY projection for server-side Gemini retry ordering.
 *
 * This is a compatibility seam only: it does not expose credentials, select an
 * external provider, make a request, or change the existing UI model contract.
 */
export const SERVER_GEMINI_MODEL_POOL: readonly string[] = Object.freeze(
  AVAILABLE_GEMINI_MODELS.map((model) => model.id),
);
