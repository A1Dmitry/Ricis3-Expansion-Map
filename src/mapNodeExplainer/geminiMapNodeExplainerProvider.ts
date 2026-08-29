import { GoogleGenAI } from '@google/genai';
import {
  AbstractMapNodeExplainerProvider,
  type AbstractMapNodeExplainerProviderDependencies,
  type MapNodeExplanationProviderRequest,
  type MapAssistantModelId,
  type MapAssistantResolvedModelId,
  type ProviderTransportReply,
  type ReadOnlyMapNodeExplanation,
} from './mapNodeExplainerApplication';

export interface GeminiTransportInput {
  readonly apiKey: string;
  readonly modelId: MapAssistantModelId;
  readonly prompt: string;
}

export type GeminiTransport = (input: GeminiTransportInput) => Promise<ProviderTransportReply>;

export interface GeminiMapNodeExplainerProviderDependencies extends AbstractMapNodeExplainerProviderDependencies {
  readonly apiKey?: string;
  readonly transport?: GeminiTransport;
}

const allowedFacts = new Set<ReadOnlyMapNodeExplanation['factsUsed'][number]>([
  'title',
  'description',
  'targetFunction',
  'declaredType',
  'declaredState',
  'zones',
  'dependencies',
  'dependents',
]);

function buildPrompt(request: MapNodeExplanationProviderRequest): string {
  return [
    'Return JSON only with fields explanationText, factsUsed, limitations.',
    'This is a read-only external explanation. Do not claim verification, authority, state mutation, or semantic resolution.',
    `Locale: ${request.locale}`,
    `Node snapshot: ${JSON.stringify(request.selectedNode)}`,
  ].join('\n');
}

function parseProviderJson(text: string, modelId: MapAssistantModelId): ProviderTransportReply {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { kind: 'invalid_provider_output', redactedReason: 'response_not_object' };
    }
    const record = parsed as Record<string, unknown>;
    if (typeof record.explanationText !== 'string' || !Array.isArray(record.factsUsed) || !Array.isArray(record.limitations)) {
      return { kind: 'invalid_provider_output', redactedReason: 'response_schema_mismatch' };
    }
    if (!record.factsUsed.every((fact) => typeof fact === 'string' && allowedFacts.has(fact as ReadOnlyMapNodeExplanation['factsUsed'][number]))) {
      return { kind: 'invalid_provider_output', redactedReason: 'response_fact_out_of_scope' };
    }
    if (!record.limitations.every((limitation) => typeof limitation === 'string')) {
      return { kind: 'invalid_provider_output', redactedReason: 'response_limitation_invalid' };
    }
    return {
      kind: 'success',
      resolvedModelId: modelId as unknown as MapAssistantResolvedModelId,
      explanationText: record.explanationText,
      factsUsed: record.factsUsed as ReadOnlyMapNodeExplanation['factsUsed'],
      limitations: record.limitations as readonly string[],
    };
  } catch {
    return { kind: 'invalid_provider_output', redactedReason: 'response_not_json' };
  }
}

function mapTransportError(error: unknown): ProviderTransportReply {
  const message = error instanceof Error ? error.message : String(error);
  if (/429|quota|resource_exhausted/i.test(message)) return { kind: 'quota_exhausted' };
  if (/402|payment required|billing/i.test(message)) return { kind: 'payment_required' };
  if (/timeout|deadline|aborted/i.test(message)) return { kind: 'timeout' };
  return { kind: 'provider_unavailable', redactedReason: 'gemini_transport_unavailable' };
}

async function defaultGeminiTransport(input: GeminiTransportInput): Promise<ProviderTransportReply> {
  try {
    const ai = new GoogleGenAI({ apiKey: input.apiKey });
    const response = await ai.models.generateContent({
      model: input.modelId,
      contents: input.prompt,
      config: { responseMimeType: 'application/json' },
    });
    return parseProviderJson(response.text ?? '', input.modelId);
  } catch (error) {
    return mapTransportError(error);
  }
}

export class GeminiMapNodeExplainerProvider extends AbstractMapNodeExplainerProvider {
  private readonly apiKey: string | undefined;
  private readonly transport: GeminiTransport;
  private readonly providerDependencies: GeminiMapNodeExplainerProviderDependencies;

  public constructor(dependencies: GeminiMapNodeExplainerProviderDependencies) {
    super(dependencies);
    this.providerDependencies = dependencies;
    this.apiKey = dependencies.apiKey?.trim() || undefined;
    this.transport = dependencies.transport ?? defaultGeminiTransport;
  }

  public async checkAvailability() {
    return this.apiKey === undefined ? { kind: 'unconfigured' as const } : { kind: 'ready' as const };
  }

  protected async executeProviderTransport(request: MapNodeExplanationProviderRequest): Promise<ProviderTransportReply> {
    if (this.apiKey === undefined) return { kind: 'provider_unavailable', redactedReason: 'provider_not_configured' };
    return this.transport({
      apiKey: this.apiKey,
      modelId: this.resolveConfiguredModelId(),
      prompt: buildPrompt(request),
    });
  }

  protected resolveConfiguredModelId(): MapAssistantModelId {
    return this.providerDependencies.descriptor.configuredModelId;
  }
}
