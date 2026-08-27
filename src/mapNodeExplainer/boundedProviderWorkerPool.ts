import type {
  BoundedProviderWorkerPool,
  BoundedProviderWorkerPoolSnapshot,
  MapAssistantProviderId,
  ProviderWorkerJob,
  ProviderWorkerSubmission,
} from './mapNodeExplainerApplication';

export interface BoundedProviderWorkerPoolPolicy {
  readonly maximumActiveJobs: number;
  readonly maximumQueuedJobs: number;
  readonly maximumActiveJobsPerProvider: number;
  readonly maximumDeadlineMilliseconds: number;
  readonly maximumRetryCount: number;
}

export interface BoundedProviderWorkerPoolClock {
  nowEpochMilliseconds(): number;
}

interface QueueEntry<T> {
  readonly job: ProviderWorkerJob<T>;
  readonly complete: (outcome: ProviderWorkerSubmission<T>) => void;
  readonly cancellationRegistration: { dispose(): void };
  terminal: boolean;
  active: boolean;
}

export function createBoundedProviderWorkerPoolPolicy(
  policy: BoundedProviderWorkerPoolPolicy,
): Readonly<BoundedProviderWorkerPoolPolicy> {
  if (!isFinitePositiveInteger(policy.maximumActiveJobs)) throw new Error('maximumActiveJobs must be a finite positive integer.');
  if (!isFinitePositiveInteger(policy.maximumQueuedJobs)) throw new Error('maximumQueuedJobs must be a finite positive integer.');
  if (!isFinitePositiveInteger(policy.maximumActiveJobsPerProvider)) throw new Error('maximumActiveJobsPerProvider must be a finite positive integer.');
  if (policy.maximumActiveJobsPerProvider > policy.maximumActiveJobs) {
    throw new Error('maximumActiveJobsPerProvider cannot exceed maximumActiveJobs.');
  }
  if (!isFinitePositiveInteger(policy.maximumDeadlineMilliseconds)) throw new Error('maximumDeadlineMilliseconds must be a finite positive integer.');
  if (!isFiniteNonNegativeInteger(policy.maximumRetryCount)) throw new Error('maximumRetryCount must be a finite non-negative integer.');

  return Object.freeze({ ...policy });
}

export class BoundedProviderWorkerPoolImplementation implements BoundedProviderWorkerPool {
  private readonly pending: QueueEntry<unknown>[] = [];
  private readonly active = new Set<QueueEntry<unknown>>();
  private readonly activeByProvider = new Map<MapAssistantProviderId, number>();

  public constructor(
    private readonly policy: Readonly<BoundedProviderWorkerPoolPolicy>,
    private readonly clock: BoundedProviderWorkerPoolClock,
  ) {}

  public async submit<T>(job: ProviderWorkerJob<T>): Promise<ProviderWorkerSubmission<T>> {
    if (job.cancellation.isCancellationRequested()) return { kind: 'cancelled_before_dispatch' };
    if (job.deadlineEpochMilliseconds <= this.clock.nowEpochMilliseconds()) return { kind: 'deadline_elapsed' };
    if (this.pending.length >= this.policy.maximumQueuedJobs && !this.canStart(job.providerId)) return { kind: 'queue_saturated' };

    return new Promise<ProviderWorkerSubmission<T>>((complete) => {
      let entry: QueueEntry<T>;
      const cancellationRegistration = job.cancellation.onCancellation(() => {
        this.cancelEntry(entry as QueueEntry<unknown>);
      });
      entry = {
        job,
        complete,
        cancellationRegistration,
        terminal: false,
        active: false,
      };
      this.pending.push(entry as QueueEntry<unknown>);
      this.dispatch();
    });
  }

  public processDeadlines(): void {
    const now = this.clock.nowEpochMilliseconds();
    for (const entry of [...this.pending]) {
      if (entry.job.deadlineEpochMilliseconds <= now) this.completeQueued(entry, { kind: 'deadline_elapsed' });
    }
    for (const entry of [...this.active]) {
      if (entry.job.deadlineEpochMilliseconds <= now) this.completeActive(entry, { kind: 'deadline_elapsed' });
    }
    this.dispatch();
  }

  public snapshot(): Readonly<BoundedProviderWorkerPoolSnapshot> {
    const activeJobsByProvider: Record<string, number> = {};
    for (const [providerId, count] of this.activeByProvider.entries()) activeJobsByProvider[providerId] = count;
    return Object.freeze({
      activeJobs: this.active.size,
      queuedJobs: this.pending.length,
      activeJobsByProvider: Object.freeze(activeJobsByProvider),
      configuredMaximumActiveJobs: this.policy.maximumActiveJobs,
      configuredMaximumQueuedJobs: this.policy.maximumQueuedJobs,
      configuredMaximumActiveJobsPerProvider: this.policy.maximumActiveJobsPerProvider,
    });
  }

  private dispatch(): void {
    this.processQueuedCancellationsAndDeadlines();
    while (this.active.size < this.policy.maximumActiveJobs) {
      const nextIndex = this.findNextEligibleQueueIndex();
      if (nextIndex === -1) return;
      const next = this.pending.splice(nextIndex, 1)[0];
      if (next === undefined || next.terminal) continue;
      this.start(next);
    }
  }

  private processQueuedCancellationsAndDeadlines(): void {
    const now = this.clock.nowEpochMilliseconds();
    for (const entry of [...this.pending]) {
      if (entry.job.cancellation.isCancellationRequested()) {
        this.completeQueued(entry, { kind: 'cancelled_before_dispatch' });
      } else if (entry.job.deadlineEpochMilliseconds <= now) {
        this.completeQueued(entry, { kind: 'deadline_elapsed' });
      }
    }
  }

  private findNextEligibleQueueIndex(): number {
    for (let index = 0; index < this.pending.length; index += 1) {
      const entry = this.pending[index];
      if (entry !== undefined && !entry.terminal && this.canStart(entry.job.providerId)) return index;
    }
    return -1;
  }

  private canStart(providerId: MapAssistantProviderId): boolean {
    return this.active.size < this.policy.maximumActiveJobs && (this.activeByProvider.get(providerId) ?? 0) < this.policy.maximumActiveJobsPerProvider;
  }

  private start(entry: QueueEntry<unknown>): void {
    if (entry.terminal || entry.job.cancellation.isCancellationRequested()) {
      this.completeQueued(entry, { kind: 'cancelled_before_dispatch' });
      return;
    }
    if (entry.job.deadlineEpochMilliseconds <= this.clock.nowEpochMilliseconds()) {
      this.completeQueued(entry, { kind: 'deadline_elapsed' });
      return;
    }

    entry.active = true;
    this.active.add(entry);
    this.activeByProvider.set(entry.job.providerId, (this.activeByProvider.get(entry.job.providerId) ?? 0) + 1);

    void entry.job.execute().then(
      (value) => this.completeActive(entry, { kind: 'completed', value }),
      () => this.completeActive(entry, { kind: 'execution_failed', redactedReason: 'provider_execution_failed' }),
    );
  }

  private cancelEntry(entry: QueueEntry<unknown>): void {
    if (entry.terminal) return;
    if (entry.active) {
      this.completeActive(entry, { kind: 'cancelled_before_dispatch' });
      return;
    }
    this.completeQueued(entry, { kind: 'cancelled_before_dispatch' });
  }

  private completeQueued(entry: QueueEntry<unknown>, outcome: ProviderWorkerSubmission<unknown>): void {
    if (entry.terminal) return;
    entry.terminal = true;
    const index = this.pending.indexOf(entry);
    if (index >= 0) this.pending.splice(index, 1);
    entry.cancellationRegistration.dispose();
    entry.complete(outcome);
  }

  private completeActive(entry: QueueEntry<unknown>, outcome: ProviderWorkerSubmission<unknown>): void {
    if (entry.terminal) return;
    entry.terminal = true;
    entry.cancellationRegistration.dispose();
    if (this.active.delete(entry)) {
      const current = this.activeByProvider.get(entry.job.providerId) ?? 0;
      if (current <= 1) {
        this.activeByProvider.delete(entry.job.providerId);
      } else {
        this.activeByProvider.set(entry.job.providerId, current - 1);
      }
    }
    entry.complete(outcome);
    this.dispatch();
  }
}

function isFinitePositiveInteger(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value) && value > 0;
}

function isFiniteNonNegativeInteger(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value) && value >= 0;
}
