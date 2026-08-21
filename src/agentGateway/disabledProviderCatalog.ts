import { AVAILABLE_GEMINI_MODELS } from '../model/modelPool.types';
import {
  StaticAgentProviderRegistry,
  type AgentModelDescriptor,
  type AgentProvider,
  type AgentProviderAvailability,
  type AgentProviderDescriptor,
  type ProviderInvocationFailure,
  type ProviderStructuredRequest,
  type ProviderStructuredResponse,
} from './agentGatewayApplication';

interface DisabledProviderDefinition {
  readonly providerId: 'gemini' | 'groq' | 'openrouter' | 'huggingface' | 'cloudflare-workers-ai';
  readonly adapterVersion: string;
  readonly endpointFamily: AgentProviderDescriptor['endpointFamily'];
  readonly displayResourceKey: string;
  readonly supportedCapabilities: AgentProviderDescriptor['supportedCapabilities'];
  readonly models: readonly AgentModelDescriptor[];
}

class DisabledAgentProvider implements AgentProvider {
  public constructor(private readonly definition: DisabledProviderDefinition) {}

  public descriptor(): AgentProviderDescriptor {
    return Object.freeze({
      providerId: this.definition.providerId,
      displayResourceKey: this.definition.displayResourceKey,
      adapterVersion: this.definition.adapterVersion,
      endpointFamily: this.definition.endpointFamily,
      serverRuntimeRequired: true,
      supportedCapabilities: Object.freeze([...this.definition.supportedCapabilities]),
      requiresExternalProcessingConsent: true,
      maximumRequestBytes: 0,
      maximumResponseBytes: 0,
      defaultEnabled: false,
    });
  }

  public async listModels(): Promise<readonly AgentModelDescriptor[]> {
    return Object.freeze(this.definition.models.map((model) => Object.freeze({
      ...model,
      capabilities: Object.freeze([...model.capabilities]),
    })));
  }

  public async checkAvailability(): Promise<AgentProviderAvailability> {
    return { kind: 'unconfigured' };
  }

  public async completeStructured(_input: ProviderStructuredRequest): Promise<ProviderStructuredResponse | ProviderInvocationFailure> {
    return { kind: 'provider_unavailable', redactedReason: 'adapter_unconfigured' };
  }
}

function model(
  providerId: DisabledProviderDefinition['providerId'],
  modelId: string,
  displayResourceKey: string,
  capabilities: AgentModelDescriptor['capabilities'],
  category: AgentModelDescriptor['category'] = 'other',
  isFast = false,
): AgentModelDescriptor {
  return {
    providerId,
    modelId,
    displayResourceKey,
    capabilities,
    category,
    isFast,
    isDefaultCandidate: false,
  };
}

const GEMINI_MODELS: readonly AgentModelDescriptor[] = AVAILABLE_GEMINI_MODELS.map((item) => ({
  providerId: 'gemini',
  modelId: item.id,
  displayResourceKey: `provider.gemini.${item.id}`,
  capabilities: ['text_completion', 'structured_json'],
  category: item.category,
  isFast: item.isFast === true,
  isDefaultCandidate: item.isDefault === true,
}));

const DISABLED_PROVIDER_DEFINITIONS: readonly DisabledProviderDefinition[] = [
  {
    providerId: 'gemini',
    adapterVersion: 'catalog-v1',
    endpointFamily: 'gemini_developer_api',
    displayResourceKey: 'provider.gemini',
    supportedCapabilities: ['text_completion', 'structured_json', 'model_catalog'],
    models: GEMINI_MODELS,
  },
  {
    providerId: 'groq',
    adapterVersion: 'catalog-v1',
    endpointFamily: 'openai_compatible',
    displayResourceKey: 'provider.groq',
    supportedCapabilities: ['text_completion', 'structured_json', 'model_catalog'],
    models: [model('groq', 'groq-unconfigured', 'provider.groq.unconfigured', ['text_completion', 'structured_json'])],
  },
  {
    providerId: 'openrouter',
    adapterVersion: 'catalog-v1',
    endpointFamily: 'openai_compatible',
    displayResourceKey: 'provider.openrouter',
    supportedCapabilities: ['text_completion', 'structured_json', 'model_catalog', 'web_search_with_citations', 'tool_usage_observability'],
    models: [model('openrouter', 'openrouter-unconfigured', 'provider.openrouter.unconfigured', ['text_completion', 'structured_json'])],
  },
  {
    providerId: 'huggingface',
    adapterVersion: 'catalog-v1',
    endpointFamily: 'huggingface_router',
    displayResourceKey: 'provider.huggingface',
    supportedCapabilities: ['text_completion', 'structured_json', 'model_catalog'],
    models: [model('huggingface', 'huggingface-unconfigured', 'provider.huggingface.unconfigured', ['text_completion', 'structured_json'])],
  },
  {
    providerId: 'cloudflare-workers-ai',
    adapterVersion: 'catalog-v1',
    endpointFamily: 'cloudflare_workers_ai',
    displayResourceKey: 'provider.cloudflare_workers_ai',
    supportedCapabilities: ['text_completion', 'structured_json', 'model_catalog'],
    models: [model('cloudflare-workers-ai', 'cloudflare-workers-ai-unconfigured', 'provider.cloudflare_workers_ai.unconfigured', ['text_completion', 'structured_json'])],
  },
];

/**
 * Returns only inert provider descriptors. Concrete provider adapters remain
 * intentionally absent until credentials, paid/free-tier policy and a separate
 * production activation gate are explicitly approved.
 */
export function createDisabledProviderCatalog(): StaticAgentProviderRegistry {
  return new StaticAgentProviderRegistry(DISABLED_PROVIDER_DEFINITIONS.map((definition) => new DisabledAgentProvider(definition)));
}
