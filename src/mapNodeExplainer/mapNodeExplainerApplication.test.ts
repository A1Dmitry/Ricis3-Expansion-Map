import { describe, expect, it } from 'vitest';
import {
  AbstractMapNodeExplainerProvider,
  InMemoryMapNodeExplainerProviderRegistry,
  MapNodeExplainerApplicationService,
  type MapAssistantAdapterVersion,
  type MapAssistantCorrelationId,
  type MapAssistantModelId,
  type MapAssistantProviderId,
  type MapAssistantRequestId,
  type MapAssistantResolvedModelId,
  type MapNodeExplanationCancellation,
  type MapNodeExplanationCancellationRegistration,
  type MapNodeExplainerProviderOutcome,
  type MapNodeExplanationProviderRequest,
  type MapNodeExplainerAvailability,
  type MapNodeExplainerProviderDescriptor,
  type ProviderTransportReply,
  type ReadOnlyMapNodeSnapshot,
  type BoundedProviderWorkerPool,
  type BoundedProviderWorkerPoolSnapshot,
  type ProviderWorkerJob,
  type ProviderWorkerSubmission,
} from './mapNodeExplainerApplication';

const ids = {
  geminiProvider: 'gemini' as MapAssistantProviderId,
  openRouterProvider: 'openrouter' as MapAssistantProviderId,
  geminiModel: 'gemini-test-model' as MapAssistantModelId,
  openRouterModel: 'openrouter/free' as MapAssistantModelId,
  resolvedGeminiModel: 'gemini-test-model@revision-a' as MapAssistantResolvedModelId,
  resolvedOpenRouterModel: 'provider-routed-free-model@revision-b' as MapAssistantResolvedModelId,
  adapterVersion: 'test-adapter-v1' as MapAssistantAdapterVersion,
  requestId: 'request-01' as MapAssistantRequestId,
  correlationId: 'correlation-01' as MapAssistantCorrelationId,
} as const;

const selectedNode: ReadOnlyMapNodeSnapshot = Object.freeze({
  nodeId: 'real-catalog-98',
  title: 'Selected catalog task',
  description: 'Reader-visible description only.',
  targetFunction: 'TypedTarget(real-catalog-98)',
  declaredType: 'scientific_task',
  declaredState: 'unresolved',
  zoneLabels: Object.freeze(['Mathematics']),
  dependencyIds: Object.freeze(['core-agi-target']),
  dependentIds: Object.freeze([]),
});

class ManualCancellation implements MapNodeExplanationCancellation {
  private cancelled = false;
  private readonly callbacks = new Set<() => void>();

  public isCancellationRequested(): boolean {
    return this.cancelled;
  }

  public onCancellation(callback: () => void): MapNodeExplanationCancellationRegistration {
    this.callbacks.add(callback);
    return {
      dispose: () => {
        this.callbacks.delete(callback);
      },
    };
  }

  public cancel(): void {
    if (this.cancelled) return;
    this.cancelled = true;
    for (const callback of this.callbacks) callback();
  }
}

class ImmediateWorkerPool implements BoundedProviderWorkerPool {
  public submissionCount = 0;

  public async submit<T>(job: ProviderWorkerJob<T>): Promise<ProviderWorkerSubmission<T>> {
    this.submissionCount += 1;
    if (job.cancellation.isCancellationRequested()) return { kind: 'cancelled_before_dispatch' };
    if (job.deadlineEpochMilliseconds <= 1000) return { kind: 'deadline_elapsed' };
    return { kind: 'completed', value: await job.execute() };
  }

  public snapshot(): Readonly<BoundedProviderWorkerPoolSnapshot> {
    return {
      activeJobs: 0,
      queuedJobs: 0,
      activeJobsByProvider: {},
      configuredMaximumActiveJobs: 1,
      configuredMaximumQueuedJobs: 1,
      configuredMaximumActiveJobsPerProvider: 1,
    };
  }
}

class FakeMapNodeExplainerProvider extends AbstractMapNodeExplainerProvider {
  public transportCalls = 0;

  public constructor(
    descriptor: MapNodeExplainerProviderDescriptor,
    pool: BoundedProviderWorkerPool,
    private readonly availability: MapNodeExplainerAvailability,
    private readonly reply: ProviderTransportReply,
  ) {
    super({
      descriptor,
      pool,
      clock: { nowEpochMilliseconds: () => 1000 },
      policy: {
        maximumInputBytes: 4096,
        maximumOutputBytes: 4096,
        maximumDeadlineMilliseconds: 1000,
        maximumRetryCount: 1,
      },
    });
  }

  public async checkAvailability(): Promise<MapNodeExplainerAvailability> {
    return this.availability;
  }

  protected resolveConfiguredModelId(): MapAssistantModelId {
    return super.descriptor().configuredModelId;
  }

  protected async executeProviderTransport(_request: MapNodeExplanationProviderRequest): Promise<ProviderTransportReply> {
    this.transportCalls += 1;
    return this.reply;
  }
}

class RetryingFakeMapNodeExplainerProvider extends AbstractMapNodeExplainerProvider {
  public transportCalls = 0;

  public constructor(
    pool: BoundedProviderWorkerPool,
    private readonly replies: ProviderTransportReply[],
  ) {
    super({
      descriptor: descriptor(ids.geminiProvider, ids.geminiModel),
      pool,
      clock: { nowEpochMilliseconds: () => 1000 },
      policy: {
        maximumInputBytes: 4096,
        maximumOutputBytes: 4096,
        maximumDeadlineMilliseconds: 1000,
        maximumRetryCount: 1,
      },
    });
  }

  public async checkAvailability(): Promise<MapNodeExplainerAvailability> {
    return { kind: 'ready' };
  }

  protected resolveConfiguredModelId(): MapAssistantModelId {
    return ids.geminiModel;
  }

  protected async executeProviderTransport(_request: MapNodeExplanationProviderRequest): Promise<ProviderTransportReply> {
    this.transportCalls += 1;
    return this.replies.shift() ?? { kind: 'provider_unavailable', redactedReason: 'unexpected_retry' };
  }
}

function descriptor(providerId: MapAssistantProviderId, configuredModelId: MapAssistantModelId): MapNodeExplainerProviderDescriptor {
  return {
    providerId,
    adapterVersion: ids.adapterVersion,
    displayResourceKey: `provider.${providerId}`,
    configuredModelId,
    serverRuntimeRequired: true,
    defaultEnabled: false,
    capabilities: ['read_only_node_explanation', 'structured_explanation'],
  };
}

function successfulReply(resolvedModelId: MapAssistantResolvedModelId): ProviderTransportReply {
  return {
    kind: 'success',
    resolvedModelId,
    explanationText: 'This is a bounded reader explanation.',
    factsUsed: ['title', 'description', 'declaredType', 'declaredState'],
    limitations: ['External AI suggestion only.'],
  };
}

function explanationRequest(cancellation = new ManualCancellation()): MapNodeExplanationProviderRequest {
  return {
    requestId: ids.requestId,
    correlationId: ids.correlationId,
    locale: 'en',
    selectedNode,
    deadlineEpochMilliseconds: 2000,
    cancellation,
  };
}

type TestOnlyMapNodeExplainerProvider = {
  explain(request: MapNodeExplanationProviderRequest): Promise<MapNodeExplainerProviderOutcome>;
};

function asCommonProvider(value: unknown): TestOnlyMapNodeExplainerProvider {
  return value as TestOnlyMapNodeExplainerProvider;
}

function unavailableKind(outcome: MapNodeExplainerProviderOutcome): MapNodeExplainerAvailability['kind'] {
  if (outcome.kind !== 'unavailable') throw new Error('Expected a typed unavailable outcome.');
  return outcome.availability.kind;
}

describe('P1 Map Node Explainer shared provider contract', () => {
  it('MNE-QA-01: substitutes Gemini and OpenRouter fakes solely through one provider-neutral registry interface', async () => {
    const pool = new ImmediateWorkerPool();
    const gemini = new FakeMapNodeExplainerProvider(
      descriptor(ids.geminiProvider, ids.geminiModel),
      pool,
      { kind: 'ready' },
      successfulReply(ids.resolvedGeminiModel),
    );
    const openRouter = new FakeMapNodeExplainerProvider(
      descriptor(ids.openRouterProvider, ids.openRouterModel),
      pool,
      { kind: 'ready' },
      successfulReply(ids.resolvedOpenRouterModel),
    );
    const registry = new InMemoryMapNodeExplainerProviderRegistry([gemini, openRouter]);

    const first = registry.find(ids.geminiProvider);
    const second = registry.find(ids.openRouterProvider);
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    if (first === null || second === null) throw new Error('Expected both common-interface providers.');

    expect((await asCommonProvider(first).explain(explanationRequest())).kind).toBe('explained');
    expect((await asCommonProvider(second).explain(explanationRequest())).kind).toBe('explained');
    expect(registry.find('unknown-provider' as MapAssistantProviderId)).toBeNull();
    expect(gemini.transportCalls).toBe(1);
    expect(openRouter.transportCalls).toBe(1);
  });

  it('MNE-QA-02/MNE-QA-03: common base normalizes valid transport output with complete transient provenance', async () => {
    const provider = new FakeMapNodeExplainerProvider(
      descriptor(ids.openRouterProvider, ids.openRouterModel),
      new ImmediateWorkerPool(),
      { kind: 'ready' },
      successfulReply(ids.resolvedOpenRouterModel),
    );

    const outcome = await asCommonProvider(provider).explain(explanationRequest());
    expect(outcome).toMatchObject({
      kind: 'explained',
      explanation: {
        classification: 'external_ai_suggestion',
        proofDisclaimer: 'not_a_proof_or_state_change',
        text: 'This is a bounded reader explanation.',
        factsUsed: ['title', 'description', 'declaredType', 'declaredState'],
      },
      provenance: {
        providerId: ids.openRouterProvider,
        configuredModelId: ids.openRouterModel,
        resolvedModelId: ids.resolvedOpenRouterModel,
        adapterVersion: ids.adapterVersion,
        requestId: ids.requestId,
        correlationId: ids.correlationId,
      },
    });
  });

  it('MNE-QA-04: application service obtains only its server-selected provider and read-only selected snapshot', async () => {
    const pool = new ImmediateWorkerPool();
    const provider = new FakeMapNodeExplainerProvider(
      descriptor(ids.geminiProvider, ids.geminiModel),
      pool,
      { kind: 'ready' },
      successfulReply(ids.resolvedGeminiModel),
    );
    const service = new MapNodeExplainerApplicationService({
      providers: new InMemoryMapNodeExplainerProviderRegistry([provider]),
      selection: {
        selectForReadOnlyExplanation: () => ({ providerId: ids.geminiProvider, modelId: ids.geminiModel }),
      },
      runtime: {
        serverRuntimeAvailable: () => true,
        nowEpochMilliseconds: () => 1000,
      },
      snapshots: {
        resolveSelectedNode: async (nodeId: string) => nodeId === selectedNode.nodeId ? selectedNode : null,
      },
      maximumDeadlineMilliseconds: 1000,
    });

    const outcome = await service.explain({
      requestId: ids.requestId,
      correlationId: ids.correlationId,
      locale: 'en',
      nodeId: selectedNode.nodeId,
      cancellation: new ManualCancellation(),
    });

    expect(outcome.kind).toBe('explained');
    expect(pool.submissionCount).toBe(1);
    expect(provider.transportCalls).toBe(1);
  });

  it('MNE-QA-05: malformed provider output becomes typed invalid_provider_output and never exposes proof/state fields', async () => {
    const malformed: ProviderTransportReply = {
      kind: 'success',
      resolvedModelId: ids.resolvedGeminiModel,
      explanationText: '',
      factsUsed: ['title'],
      limitations: [],
    };
    const provider = new FakeMapNodeExplainerProvider(
      descriptor(ids.geminiProvider, ids.geminiModel),
      new ImmediateWorkerPool(),
      { kind: 'ready' },
      malformed,
    );

    const outcome = await asCommonProvider(provider).explain(explanationRequest());
    expect(unavailableKind(outcome)).toBe('invalid_provider_output');
    expect(outcome).not.toHaveProperty('proof');
    expect(outcome).not.toHaveProperty('resolved');
    expect(outcome).not.toHaveProperty('edge');
    expect(outcome).not.toHaveProperty('zone');
  });

  it('MNE-QA-06: disabled or unconfigured provider state invokes neither queue nor implicit fallback', async () => {
    const pool = new ImmediateWorkerPool();
    const provider = new FakeMapNodeExplainerProvider(
      descriptor(ids.openRouterProvider, ids.openRouterModel),
      pool,
      { kind: 'disabled' },
      successfulReply(ids.resolvedOpenRouterModel),
    );

    const outcome = await asCommonProvider(provider).explain(explanationRequest());
    expect(unavailableKind(outcome)).toBe('disabled');
    expect(pool.submissionCount).toBe(0);
    expect(provider.transportCalls).toBe(0);
  });

  it('MNE-QA-16: common base retries only a transient provider_unavailable reply within its finite policy', async () => {
    const provider = new RetryingFakeMapNodeExplainerProvider(new ImmediateWorkerPool(), [
      { kind: 'provider_unavailable', redactedReason: 'transient_failure' },
      successfulReply(ids.resolvedGeminiModel),
    ]);

    const outcome = await asCommonProvider(provider).explain(explanationRequest());
    expect(outcome.kind).toBe('explained');
    expect(provider.transportCalls).toBe(2);
  });

  it('MNE-QA-07: static hosting denies before registry lookup, pool admission or transport', async () => {
    const pool = new ImmediateWorkerPool();
    const provider = new FakeMapNodeExplainerProvider(
      descriptor(ids.geminiProvider, ids.geminiModel),
      pool,
      { kind: 'ready' },
      successfulReply(ids.resolvedGeminiModel),
    );
    const service = new MapNodeExplainerApplicationService({
      providers: {
        find: () => {
          throw new Error('Static host must not look up a provider.');
        },
        listDescriptors: () => [descriptor(ids.geminiProvider, ids.geminiModel)],
      },
      selection: {
        selectForReadOnlyExplanation: () => ({ providerId: ids.geminiProvider, modelId: ids.geminiModel }),
      },
      runtime: {
        serverRuntimeAvailable: () => false,
        nowEpochMilliseconds: () => 1000,
      },
      snapshots: {
        resolveSelectedNode: async () => selectedNode,
      },
      maximumDeadlineMilliseconds: 1000,
    });

    const outcome = await service.explain({
      requestId: ids.requestId,
      correlationId: ids.correlationId,
      locale: 'en',
      nodeId: selectedNode.nodeId,
      cancellation: new ManualCancellation(),
    });
    expect(unavailableKind(outcome)).toBe('static_host_unavailable');
    expect(pool.submissionCount).toBe(0);
    expect(provider.transportCalls).toBe(0);
  });

  it('MNE-QA-08: explanation path has no mutation command and preserves frozen selected-node identity data', async () => {
    const before = JSON.stringify(selectedNode);
    const provider = new FakeMapNodeExplainerProvider(
      descriptor(ids.geminiProvider, ids.geminiModel),
      new ImmediateWorkerPool(),
      { kind: 'ready' },
      successfulReply(ids.resolvedGeminiModel),
    );

    await asCommonProvider(provider).explain(explanationRequest());
    expect(JSON.stringify(selectedNode)).toBe(before);
    expect(Object.keys(selectedNode).sort()).toEqual([
      'declaredState',
      'declaredType',
      'dependencyIds',
      'dependentIds',
      'description',
      'nodeId',
      'targetFunction',
      'title',
      'zoneLabels',
    ]);
  });
});
