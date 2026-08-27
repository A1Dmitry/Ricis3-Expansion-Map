export type MapAssistantProviderId = string & {
  readonly __brand: 'MapAssistantProviderId';
};

export type MapAssistantModelId = string & {
  readonly __brand: 'MapAssistantModelId';
};

export type MapAssistantRequestId = string & {
  readonly __brand: 'MapAssistantRequestId';
};

export type MapAssistantCorrelationId = string & {
  readonly __brand: 'MapAssistantCorrelationId';
};

export type MapAssistantAdapterVersion = string & {
  readonly __brand: 'MapAssistantAdapterVersion';
};

export type MapAssistantResolvedModelId = string & {
  readonly __brand: 'MapAssistantResolvedModelId';
};

export type MapAssistantCapability =
  | 'read_only_node_explanation'
  | 'structured_explanation';

export interface MapNodeExplainerProviderDescriptor {
  readonly providerId: MapAssistantProviderId;
  readonly adapterVersion: MapAssistantAdapterVersion;
  readonly displayResourceKey: string;
  readonly configuredModelId: MapAssistantModelId;
  readonly serverRuntimeRequired: true;
  readonly defaultEnabled: false;
  readonly capabilities: readonly MapAssistantCapability[];
}

export type MapNodeExplainerAvailability =
  | { readonly kind: 'ready' }
  | { readonly kind: 'unconfigured' }
  | { readonly kind: 'disabled' }
  | { readonly kind: 'static_host_unavailable' }
  | { readonly kind: 'queue_saturated' }
  | { readonly kind: 'provider_capacity_exhausted' }
  | { readonly kind: 'quota_exhausted' }
  | { readonly kind: 'rate_limited'; readonly retryAfterSeconds?: number }
  | { readonly kind: 'payment_required' }
  | { readonly kind: 'timeout' }
  | { readonly kind: 'cancelled' }
  | { readonly kind: 'provider_unavailable'; readonly redactedReason: string }
  | { readonly kind: 'invalid_provider_output'; readonly redactedReason: string };

export interface MapNodeExplainerProvider {
  descriptor(): MapNodeExplainerProviderDescriptor;
  checkAvailability(): Promise<MapNodeExplainerAvailability>;
  explain(request: MapNodeExplanationProviderRequest): Promise<MapNodeExplainerProviderOutcome>;
}

export interface MapNodeExplainerProviderRegistry {
  find(providerId: MapAssistantProviderId): MapNodeExplainerProvider | null;
  listDescriptors(): readonly MapNodeExplainerProviderDescriptor[];
}

export interface ReadOnlyMapNodeSnapshot {
  readonly nodeId: string;
  readonly title: string;
  readonly description: string;
  readonly targetFunction?: string;
  readonly declaredType: string;
  readonly declaredState: string;
  readonly zoneLabels: readonly string[];
  readonly dependencyIds: readonly string[];
  readonly dependentIds: readonly string[];
}

export interface MapNodeExplanationCancellation {
  isCancellationRequested(): boolean;
  onCancellation(callback: () => void): MapNodeExplanationCancellationRegistration;
}

export interface MapNodeExplanationCancellationRegistration {
  dispose(): void;
}

export interface MapNodeExplanationCommand {
  readonly requestId: MapAssistantRequestId;
  readonly correlationId: MapAssistantCorrelationId;
  readonly locale: string;
  readonly nodeId: string;
  readonly cancellation: MapNodeExplanationCancellation;
}

export interface MapNodeExplanationProviderRequest {
  readonly requestId: MapAssistantRequestId;
  readonly correlationId: MapAssistantCorrelationId;
  readonly locale: string;
  readonly selectedNode: ReadOnlyMapNodeSnapshot;
  readonly deadlineEpochMilliseconds: number;
  readonly cancellation: MapNodeExplanationCancellation;
}

export interface ReadOnlyMapNodeExplanation {
  readonly text: string;
  readonly factsUsed: readonly ('title' | 'description' | 'targetFunction' | 'declaredType' | 'declaredState' | 'zones' | 'dependencies' | 'dependents')[];
  readonly limitations: readonly string[];
  readonly classification: 'external_ai_suggestion';
  readonly proofDisclaimer: 'not_a_proof_or_state_change';
}

export interface MapNodeExplanationProvenance {
  readonly providerId: MapAssistantProviderId;
  readonly configuredModelId: MapAssistantModelId;
  readonly resolvedModelId: MapAssistantResolvedModelId;
  readonly adapterVersion: MapAssistantAdapterVersion;
  readonly requestId: MapAssistantRequestId;
  readonly correlationId: MapAssistantCorrelationId;
}

export type MapNodeExplainerProviderOutcome =
  | {
      readonly kind: 'explained';
      readonly explanation: ReadOnlyMapNodeExplanation;
      readonly provenance: MapNodeExplanationProvenance;
    }
  | { readonly kind: 'unavailable'; readonly availability: MapNodeExplainerAvailability };

export interface MapNodeExplanationRequestDto {
  readonly nodeId: string;
  readonly locale: string;
}

export type ProviderTransportReply =
  | {
      readonly kind: 'success';
      readonly resolvedModelId: MapAssistantResolvedModelId;
      readonly explanationText: string;
      readonly factsUsed: readonly ReadOnlyMapNodeExplanation['factsUsed'][number][];
      readonly limitations: readonly string[];
    }
  | { readonly kind: 'quota_exhausted' }
  | { readonly kind: 'rate_limited'; readonly retryAfterSeconds?: number }
  | { readonly kind: 'payment_required' }
  | { readonly kind: 'timeout' }
  | { readonly kind: 'cancelled' }
  | { readonly kind: 'provider_unavailable'; readonly redactedReason: string }
  | { readonly kind: 'invalid_provider_output'; readonly redactedReason: string };

export interface ProviderWorkerJob<T> {
  readonly providerId: MapAssistantProviderId;
  readonly requestId: MapAssistantRequestId;
  readonly correlationId: MapAssistantCorrelationId;
  readonly deadlineEpochMilliseconds: number;
  readonly cancellation: MapNodeExplanationCancellation;
  execute(): Promise<T>;
}

export type ProviderWorkerSubmission<T> =
  | { readonly kind: 'completed'; readonly value: T }
  | { readonly kind: 'queue_saturated' }
  | { readonly kind: 'provider_capacity_exhausted' }
  | { readonly kind: 'deadline_elapsed' }
  | { readonly kind: 'cancelled_before_dispatch' }
  | { readonly kind: 'scheduler_unavailable' }
  | { readonly kind: 'execution_failed'; readonly redactedReason: string };

export interface BoundedProviderWorkerPool {
  submit<T>(job: ProviderWorkerJob<T>): Promise<ProviderWorkerSubmission<T>>;
  snapshot(): Readonly<BoundedProviderWorkerPoolSnapshot>;
}

export interface BoundedProviderWorkerPoolSnapshot {
  readonly activeJobs: number;
  readonly queuedJobs: number;
  readonly activeJobsByProvider: Readonly<Record<string, number>>;
  readonly configuredMaximumActiveJobs: number;
  readonly configuredMaximumQueuedJobs: number;
  readonly configuredMaximumActiveJobsPerProvider: number;
}

export interface MapNodeExplainerBasePolicy {
  readonly maximumInputBytes: number;
  readonly maximumOutputBytes: number;
  readonly maximumDeadlineMilliseconds: number;
  readonly maximumRetryCount: number;
}

export interface AbstractMapNodeExplainerProviderDependencies {
  readonly descriptor: MapNodeExplainerProviderDescriptor;
  readonly pool: BoundedProviderWorkerPool;
  readonly clock: {
    nowEpochMilliseconds(): number;
  };
  readonly policy: MapNodeExplainerBasePolicy;
}

const allowedFactsUsed = new Set<ReadOnlyMapNodeExplanation['factsUsed'][number]>([
  'title',
  'description',
  'targetFunction',
  'declaredType',
  'declaredState',
  'zones',
  'dependencies',
  'dependents',
]);

export abstract class AbstractMapNodeExplainerProvider implements MapNodeExplainerProvider {
  public constructor(private readonly dependencies: AbstractMapNodeExplainerProviderDependencies) {}

  public descriptor(): MapNodeExplainerProviderDescriptor {
    return this.dependencies.descriptor;
  }

  public abstract checkAvailability(): Promise<MapNodeExplainerAvailability>;

  public async explain(request: MapNodeExplanationProviderRequest): Promise<MapNodeExplainerProviderOutcome> {
    const availability = await this.checkAvailability();
    if (availability.kind !== 'ready') return { kind: 'unavailable', availability };

    const invalidReason = this.validateRequest(request);
    if (invalidReason !== null) return this.invalidOutput(invalidReason);
    if (request.cancellation.isCancellationRequested()) return this.unavailable('cancelled');
    if (request.deadlineEpochMilliseconds <= this.dependencies.clock.nowEpochMilliseconds()) return this.unavailable('timeout');

    const submission = await this.dependencies.pool.submit({
      providerId: this.descriptor().providerId,
      requestId: request.requestId,
      correlationId: request.correlationId,
      deadlineEpochMilliseconds: request.deadlineEpochMilliseconds,
      cancellation: request.cancellation,
      execute: () => this.executeWithBoundedRetry(request),
    });

    return this.normalizeSubmission(submission, request);
  }

  protected abstract executeProviderTransport(
    request: MapNodeExplanationProviderRequest,
  ): Promise<ProviderTransportReply>;

  protected abstract resolveConfiguredModelId(): MapAssistantModelId;

  private async executeWithBoundedRetry(request: MapNodeExplanationProviderRequest): Promise<ProviderTransportReply> {
    for (let attempt = 0; attempt <= this.dependencies.policy.maximumRetryCount; attempt += 1) {
      if (request.cancellation.isCancellationRequested()) return { kind: 'cancelled' };
      if (request.deadlineEpochMilliseconds <= this.dependencies.clock.nowEpochMilliseconds()) return { kind: 'timeout' };

      const reply = await this.executeProviderTransport(request);
      if (reply.kind !== 'provider_unavailable' || attempt === this.dependencies.policy.maximumRetryCount) return reply;
    }
    return { kind: 'provider_unavailable', redactedReason: 'retry_budget_exhausted' };
  }

  private normalizeSubmission(
    submission: ProviderWorkerSubmission<ProviderTransportReply>,
    request: MapNodeExplanationProviderRequest,
  ): MapNodeExplainerProviderOutcome {
    switch (submission.kind) {
      case 'completed':
        return this.normalizeTransportReply(submission.value, request);
      case 'queue_saturated':
        return this.unavailable('queue_saturated');
      case 'provider_capacity_exhausted':
        return this.unavailable('provider_capacity_exhausted');
      case 'deadline_elapsed':
        return this.unavailable('timeout');
      case 'cancelled_before_dispatch':
        return this.unavailable('cancelled');
      case 'scheduler_unavailable':
        return this.unavailable('provider_unavailable', 'scheduler_unavailable');
      case 'execution_failed':
        return this.unavailable('provider_unavailable', submission.redactedReason);
    }
  }

  private normalizeTransportReply(
    reply: ProviderTransportReply,
    request: MapNodeExplanationProviderRequest,
  ): MapNodeExplainerProviderOutcome {
    switch (reply.kind) {
      case 'success':
        return this.createExplainedOutcome(reply, request);
      case 'quota_exhausted':
        return this.unavailable('quota_exhausted');
      case 'rate_limited':
        return this.unavailable('rate_limited', undefined, reply.retryAfterSeconds);
      case 'payment_required':
        return this.unavailable('payment_required');
      case 'timeout':
        return this.unavailable('timeout');
      case 'cancelled':
        return this.unavailable('cancelled');
      case 'provider_unavailable':
        return this.unavailable('provider_unavailable', reply.redactedReason);
      case 'invalid_provider_output':
        return this.unavailable('invalid_provider_output', reply.redactedReason);
    }
  }

  private createExplainedOutcome(
    reply: Extract<ProviderTransportReply, { readonly kind: 'success' }>,
    request: MapNodeExplanationProviderRequest,
  ): MapNodeExplainerProviderOutcome {
    const invalidReason = this.validateSuccessReply(reply);
    if (invalidReason !== null) return this.invalidOutput(invalidReason);

    return {
      kind: 'explained',
      explanation: {
        text: reply.explanationText.trim(),
        factsUsed: [...reply.factsUsed],
        limitations: [...reply.limitations],
        classification: 'external_ai_suggestion',
        proofDisclaimer: 'not_a_proof_or_state_change',
      },
      provenance: {
        providerId: this.descriptor().providerId,
        configuredModelId: this.resolveConfiguredModelId(),
        resolvedModelId: reply.resolvedModelId,
        adapterVersion: this.descriptor().adapterVersion,
        requestId: request.requestId,
        correlationId: request.correlationId,
      },
    };
  }

  private validateRequest(request: MapNodeExplanationProviderRequest): string | null {
    if (!isFinitePositiveInteger(this.dependencies.policy.maximumInputBytes)) return 'invalid_input_limit';
    if (!isFinitePositiveInteger(this.dependencies.policy.maximumOutputBytes)) return 'invalid_output_limit';
    if (!isFinitePositiveInteger(this.dependencies.policy.maximumDeadlineMilliseconds)) return 'invalid_deadline_limit';
    if (!isFiniteNonNegativeInteger(this.dependencies.policy.maximumRetryCount)) return 'invalid_retry_limit';
    if (!isFinitePositiveInteger(request.deadlineEpochMilliseconds)) return 'invalid_deadline';
    if (request.deadlineEpochMilliseconds - this.dependencies.clock.nowEpochMilliseconds() > this.dependencies.policy.maximumDeadlineMilliseconds) {
      return 'deadline_exceeds_policy';
    }
    if (new TextEncoder().encode(JSON.stringify(request.selectedNode)).byteLength > this.dependencies.policy.maximumInputBytes) {
      return 'input_too_large';
    }
    if (request.locale.trim().length === 0 || request.selectedNode.nodeId.trim().length === 0) return 'invalid_read_only_snapshot';
    return null;
  }

  private validateSuccessReply(reply: Extract<ProviderTransportReply, { readonly kind: 'success' }>): string | null {
    if (reply.explanationText.trim().length === 0) return 'empty_explanation';
    if (reply.limitations.length === 0 || reply.limitations.some((limitation) => limitation.trim().length === 0)) return 'missing_limitations';
    if (reply.factsUsed.length === 0 || reply.factsUsed.some((fact) => !allowedFactsUsed.has(fact))) return 'invalid_facts_used';
    if (new TextEncoder().encode(reply.explanationText).byteLength > this.dependencies.policy.maximumOutputBytes) return 'output_too_large';
    return null;
  }

  private invalidOutput(redactedReason: string): MapNodeExplainerProviderOutcome {
    return this.unavailable('invalid_provider_output', redactedReason);
  }

  private unavailable(
    kind: Exclude<MapNodeExplainerAvailability['kind'], 'ready' | 'rate_limited' | 'provider_unavailable' | 'invalid_provider_output'>,
  ): MapNodeExplainerProviderOutcome;
  private unavailable(
    kind: 'rate_limited',
    redactedReason?: undefined,
    retryAfterSeconds?: number,
  ): MapNodeExplainerProviderOutcome;
  private unavailable(
    kind: 'provider_unavailable' | 'invalid_provider_output',
    redactedReason: string,
  ): MapNodeExplainerProviderOutcome;
  private unavailable(
    kind: MapNodeExplainerAvailability['kind'],
    redactedReason?: string,
    retryAfterSeconds?: number,
  ): MapNodeExplainerProviderOutcome {
    if (kind === 'rate_limited') {
      return {
        kind: 'unavailable',
        availability: retryAfterSeconds === undefined ? { kind } : { kind, retryAfterSeconds },
      };
    }
    if (kind === 'provider_unavailable' || kind === 'invalid_provider_output') {
      return { kind: 'unavailable', availability: { kind, redactedReason: redactedReason ?? 'redacted' } };
    }
    return { kind: 'unavailable', availability: { kind } };
  }
}

export interface MapNodeExplainerSelectionPolicy {
  selectForReadOnlyExplanation(): Readonly<{
    providerId: MapAssistantProviderId;
    modelId: MapAssistantModelId;
  }> | null;
}

export interface MapNodeExplanationRuntime {
  serverRuntimeAvailable(): boolean;
  nowEpochMilliseconds(): number;
}

export interface MapNodeExplainerApplicationDependencies {
  readonly providers: MapNodeExplainerProviderRegistry;
  readonly selection: MapNodeExplainerSelectionPolicy;
  readonly runtime: MapNodeExplanationRuntime;
  readonly snapshots: {
    resolveSelectedNode(nodeId: string): Promise<ReadOnlyMapNodeSnapshot | null>;
  };
  readonly maximumDeadlineMilliseconds: number;
}

export class MapNodeExplainerApplicationService {
  public constructor(private readonly dependencies: MapNodeExplainerApplicationDependencies) {}

  public async explain(command: MapNodeExplanationCommand): Promise<MapNodeExplainerProviderOutcome> {
    if (!this.dependencies.runtime.serverRuntimeAvailable()) return unavailableAvailability('static_host_unavailable');
    if (!isFinitePositiveInteger(this.dependencies.maximumDeadlineMilliseconds)) return unavailableAvailability('provider_unavailable', 'invalid_application_deadline');
    if (command.cancellation.isCancellationRequested()) return unavailableAvailability('cancelled');

    const selection = this.dependencies.selection.selectForReadOnlyExplanation();
    if (selection === null) return unavailableAvailability('unconfigured');

    const selectedNode = await this.dependencies.snapshots.resolveSelectedNode(command.nodeId);
    if (selectedNode === null || selectedNode.nodeId !== command.nodeId) return unavailableAvailability('provider_unavailable', 'selected_node_unavailable');

    const provider = this.dependencies.providers.find(selection.providerId);
    if (provider === null) return unavailableAvailability('unconfigured');
    if (provider.descriptor().configuredModelId !== selection.modelId) return unavailableAvailability('unconfigured');

    return provider.explain({
      requestId: command.requestId,
      correlationId: command.correlationId,
      locale: command.locale,
      selectedNode,
      deadlineEpochMilliseconds: this.dependencies.runtime.nowEpochMilliseconds() + this.dependencies.maximumDeadlineMilliseconds,
      cancellation: command.cancellation,
    });
  }
}

export class InMemoryMapNodeExplainerProviderRegistry implements MapNodeExplainerProviderRegistry {
  private readonly byId = new Map<MapAssistantProviderId, MapNodeExplainerProvider>();
  private readonly descriptors: readonly MapNodeExplainerProviderDescriptor[];

  public constructor(providers: readonly MapNodeExplainerProvider[]) {
    const descriptors: MapNodeExplainerProviderDescriptor[] = [];
    for (const provider of providers) {
      const descriptor = provider.descriptor();
      if (this.byId.has(descriptor.providerId)) throw new Error(`Duplicate provider ID: ${descriptor.providerId}`);
      this.byId.set(descriptor.providerId, provider);
      descriptors.push(Object.freeze({ ...descriptor, capabilities: Object.freeze([...descriptor.capabilities]) }));
    }
    this.descriptors = Object.freeze(descriptors);
  }

  public find(providerId: MapAssistantProviderId): MapNodeExplainerProvider | null {
    return this.byId.get(providerId) ?? null;
  }

  public listDescriptors(): readonly MapNodeExplainerProviderDescriptor[] {
    return this.descriptors;
  }
}

function unavailableAvailability(
  kind: Exclude<MapNodeExplainerAvailability['kind'], 'ready' | 'provider_unavailable' | 'invalid_provider_output' | 'rate_limited'>,
): MapNodeExplainerProviderOutcome;
function unavailableAvailability(
  kind: 'provider_unavailable' | 'invalid_provider_output',
  redactedReason: string,
): MapNodeExplainerProviderOutcome;
function unavailableAvailability(
  kind: MapNodeExplainerAvailability['kind'],
  redactedReason?: string,
): MapNodeExplainerProviderOutcome {
  if (kind === 'provider_unavailable' || kind === 'invalid_provider_output') {
    return { kind: 'unavailable', availability: { kind, redactedReason: redactedReason ?? 'redacted' } };
  }
  return { kind: 'unavailable', availability: { kind: kind as Exclude<MapNodeExplainerAvailability['kind'], 'ready' | 'provider_unavailable' | 'invalid_provider_output' | 'rate_limited'> } };
}

function isFinitePositiveInteger(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value) && value > 0;
}

function isFiniteNonNegativeInteger(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value) && value >= 0;
}
