import { describe, expect, it } from 'vitest';
import { createDisabledProviderCatalog } from './disabledProviderCatalog';

const expectedProviderIds = [
  'gemini',
  'groq',
  'openrouter',
  'huggingface',
  'cloudflare-workers-ai',
] as const;

describe('Disabled Agent Provider Catalog regression tests', () => {
  it('registers every approved provider candidate as server-only and disabled by default', () => {
    const registry = createDisabledProviderCatalog();
    const descriptors = registry.listDescriptors();

    expect(descriptors.map((descriptor) => descriptor.providerId)).toEqual(expectedProviderIds);
    for (const descriptor of descriptors) {
      expect(descriptor.serverRuntimeRequired).toBe(true);
      expect(descriptor.defaultEnabled).toBe(false);
      expect(JSON.stringify(descriptor)).not.toMatch(/api[_-]?key|access[_-]?token|client[_-]?secret|private[_-]?key/i);
    }
  });

  it('returns an unconfigured state and makes no live call for every catalog adapter', async () => {
    const registry = createDisabledProviderCatalog();
    for (const providerId of expectedProviderIds) {
      const provider = registry.findProvider(providerId);
      expect(provider).not.toBeNull();
      if (provider === null) throw new Error(`Missing ${providerId}.`);

      await expect(provider.checkAvailability()).resolves.toEqual({ kind: 'unconfigured' });
      await expect(provider.completeStructured({
        requestId: 'request-a',
        modelId: 'model-a',
        renderedInstruction: 'external-template-resource',
        responseSchema: {
          schemaId: 'schema-a',
          version: 'v1',
          canonicalSchemaJson: '{}',
          canonicalSchemaHash: 'schema-hash-a',
          maximumJsonBytes: 1024,
          maximumDepth: 8,
          maximumArrayItems: 8,
        },
        toolPolicy: { kind: 'none' },
        maxInputBytes: 1024,
        maxOutputBytes: 1024,
        correlationId: 'correlation-a',
      })).resolves.toEqual({ kind: 'provider_unavailable', redactedReason: 'adapter_unconfigured' });
    }
  });

  it('keeps Gemini model identifiers as a projection of the existing public model catalog', async () => {
    const gemini = createDisabledProviderCatalog().findProvider('gemini');
    if (gemini === null) throw new Error('Gemini candidate must exist.');

    const modelIds = (await gemini.listModels()).map((model) => model.modelId);
    expect(modelIds).toContain('gemini-3.7-flash');
    expect(modelIds).toContain('gemini-2.5-pro');
  });
});
