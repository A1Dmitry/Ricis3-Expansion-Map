/**
 * Конфигурация доступных моделей ИИ-агента Gemini
 * Спецификация обновлена согласно Google AI Studio 2026
 */

export interface IAiModelOption {
  readonly id: string;
  readonly name: string;
  readonly category: 'flash' | 'pro' | 'experimental';
  readonly isDefault?: boolean;
  readonly isFast?: boolean;
}

export const AVAILABLE_GEMINI_MODELS: readonly IAiModelOption[] = [
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash (Default)', category: 'flash', isDefault: true, isFast: true },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', category: 'flash', isFast: true },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite', category: 'flash', isFast: true },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview (Deep Reasoning)', category: 'pro' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', category: 'flash', isFast: true },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', category: 'flash', isFast: true },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Math Verified)', category: 'pro' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', category: 'flash', isFast: true },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Fallback)', category: 'flash', isFast: true },
];

export const DEFAULT_AI_MODEL_ID = 'gemini-3.7-flash';
