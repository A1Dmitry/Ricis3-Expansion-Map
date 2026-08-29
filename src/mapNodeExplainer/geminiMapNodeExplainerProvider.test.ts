import { describe, expect, it, vi } from 'vitest';
import { GeminiMapNodeExplainerProvider } from './geminiMapNodeExplainerProvider';
import type {
  BoundedProviderWorkerPool,
  MapNodeExplanationProviderRequest,
  ProviderWorkerSubmission,
  ProviderWorkerJob,
} from './mapNodeExplainerApplication';

const descriptor = {
  providerId: 'gemini' as never,
  adapterVersion: 'gemini-map-explainer-v1' as never,
  displayResourceKey: 'provider.gemini.name',
  configuredModelId: 'gemini-2.5-flash' as never,
  serverRuntimeRequired: true as const,
  defaultEnabled: false as const,
  capabilities: ['read_only_node_explanation', 'structured_explanation'] as const,
};

function request(): MapNodeExplanationProviderRequest {
  return {
    requestId: 'request-1' as never,
    correlationId: 'correlation-1' as never,
    locale: 'en',
    selectedNode: {
      nodeId: 'node-1',
      title: 'Singularity',
      description: 'Read-only node context.',
      targetFunction: 'x/x',
      declaredType: 'core_singularity',
      declaredState: 'hypothesis',
      zoneLabels: ['math'],
      dependencyIds: [],
      dependentIds: [],
    },
    deadlineEpochMilliseconds: 4_000,
    cancellation: {
      isCancellationRequested: () => false,
      onCancellation: () => ({ dispose: vi.fn() }),
    },
  };
}

function pool(submission?: ProviderWorkerSubmission<unknown>): BoundedProviderWorkerPool {
  const submit = vi.fn(async <T>(job: ProviderWorkerJob<T>): Promise<ProviderWorkerSubmission<T>> => submission
    ? submission as ProviderWorkerSubmission<T>
    : { kind: 'completed', value: await job.execute() });
  return {
    submit: submit as unknown as BoundedProviderWorkerPool['submit'],
    snapshot: () => ({
      activeJobs: 0,
      queuedJobs: 0,
      activeJobsByProvider: {},
      configuredMaximumActiveJobs: 2,
      configuredMaximumQueuedJobs: 4,
      configuredMaximumActiveJobsPerProvider: 1,
    }),
  };
}

describe('GeminiMapNodeExplainerProvider', () => {
  it('is unavailable and never attempts transport when the server key is absent', async () => {
    const transport = vi.fn();
    const provider = new GeminiMapNodeExplainerProvider({
      apiKey: undefined,
      descriptor,
      pool: pool({ kind: 'execution_failed', redactedReason: 'must_not_run' }),
      clock: { nowEpochMilliseconds: () => 0 },
      policy: { maximumInputBytes: 8_000, maximumOutputBytes: 4_000, maximumDeadlineMilliseconds: 5_000, maximumRetryCount: 1 },
      transport,
    });

    await expect(provider.checkAvailability()).resolves.toEqual({ kind: 'unconfigured' });
    await expect(provider.explain(request())).resolves.toEqual({ kind: 'unavailable', availability: { kind: 'unconfigured' } });
    expect(transport).not.toHaveBeenCalled();
  });

  it('submits exactly one bounded job and maps a successful provider response to a non-proof explanation', async () => {
    const transport = vi.fn(async () => ({
      kind: 'success' as const,
      resolvedModelId: 'gemini-2.5-flash' as never,
      explanationText: 'A read-only explanation.',
      factsUsed: ['title' as const, 'declaredType' as const],
      limitations: ['External suggestion only.'],
    }));
    const boundedPool = pool();
    const provider = new GeminiMapNodeExplainerProvider({
      apiKey: 'test-key',
      descriptor,
      pool: boundedPool,
      clock: { nowEpochMilliseconds: () => 0 },
      policy: { maximumInputBytes: 8_000, maximumOutputBytes: 4_000, maximumDeadlineMilliseconds: 5_000, maximumRetryCount: 1 },
      transport,
    });

    const result = await provider.explain(request());

    expect(result).toMatchObject({
      kind: 'explained',
      explanation: {
        classification: 'external_ai_suggestion',
        proofDisclaimer: 'not_a_proof_or_state_change',
      },
    });
    expect(boundedPool.submit).toHaveBeenCalledTimes(1);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it('maps provider quota and malformed response outcomes without fallback or semantic mutation', async () => {
    const transport = vi.fn(async () => ({ kind: 'quota_exhausted' as const }));
    const provider = new GeminiMapNodeExplainerProvider({
      apiKey: 'test-key',
      descriptor,
      pool: pool(),
      clock: { nowEpochMilliseconds: () => 0 },
      policy: { maximumInputBytes: 8_000, maximumOutputBytes: 4_000, maximumDeadlineMilliseconds: 5_000, maximumRetryCount: 1 },
      transport,
    });

    await expect(provider.explain(request())).resolves.toEqual({ kind: 'unavailable', availability: { kind: 'quota_exhausted' } });
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it('does not expose the API key or full node prompt through the transport contract', async () => {
    const transport = vi.fn(async (input: { readonly prompt: string; readonly apiKey: string }) => {
      expect(input.apiKey).toBe('test-key');
      expect(input.prompt).toContain('Singularity');
      return { kind: 'provider_unavailable' as const, redactedReason: 'transport_unavailable' };
    });
    const provider = new GeminiMapNodeExplainerProvider({
      apiKey: 'test-key',
      descriptor,
      pool: pool(),
      clock: { nowEpochMilliseconds: () => 0 },
      policy: { maximumInputBytes: 8_000, maximumOutputBytes: 4_000, maximumDeadlineMilliseconds: 5_000, maximumRetryCount: 0 },
      transport,
    });

    await provider.explain(request());
    expect(transport).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(transport.mock.calls)).not.toContain('private_key');
    expect(JSON.stringify(transport.mock.calls)).not.toContain('proof');
  });
});
