import { describe, expect, it } from 'vitest';
import {
  BoundedProviderWorkerPoolImplementation,
  createBoundedProviderWorkerPoolPolicy,
} from './boundedProviderWorkerPool';
import type {
  MapAssistantCorrelationId,
  MapAssistantProviderId,
  MapAssistantRequestId,
  MapNodeExplanationCancellation,
  MapNodeExplanationCancellationRegistration,
  ProviderWorkerJob,
} from './mapNodeExplainerApplication';

const geminiProvider = 'gemini' as MapAssistantProviderId;
const openRouterProvider = 'openrouter' as MapAssistantProviderId;
const requestId = (suffix: string) => `request-${suffix}` as MapAssistantRequestId;
const correlationId = (suffix: string) => `correlation-${suffix}` as MapAssistantCorrelationId;

class ManualCancellation implements MapNodeExplanationCancellation {
  private cancelled = false;
  private readonly callbacks = new Set<() => void>();

  public isCancellationRequested(): boolean {
    return this.cancelled;
  }

  public onCancellation(callback: () => void): MapNodeExplanationCancellationRegistration {
    this.callbacks.add(callback);
    return { dispose: () => this.callbacks.delete(callback) };
  }

  public cancel(): void {
    if (this.cancelled) return;
    this.cancelled = true;
    for (const callback of this.callbacks) callback();
  }
}

class ManualClock {
  public constructor(private now = 100) {}

  public nowEpochMilliseconds(): number {
    return this.now;
  }

  public advance(milliseconds: number): void {
    this.now += milliseconds;
  }
}

class Deferred<T> {
  private resolvePromise: ((value: T) => void) | null = null;
  private rejectPromise: ((reason?: unknown) => void) | null = null;
  public readonly promise = new Promise<T>((resolve, reject) => {
    this.resolvePromise = resolve;
    this.rejectPromise = reject;
  });

  public resolve(value: T): void {
    if (this.resolvePromise === null) throw new Error('Deferred already settled.');
    this.resolvePromise(value);
    this.resolvePromise = null;
    this.rejectPromise = null;
  }

  public reject(reason: unknown): void {
    if (this.rejectPromise === null) throw new Error('Deferred already settled.');
    this.rejectPromise(reason);
    this.resolvePromise = null;
    this.rejectPromise = null;
  }
}

function job<T>(input: {
  providerId: MapAssistantProviderId;
  suffix: string;
  deadlineEpochMilliseconds?: number;
  cancellation?: ManualCancellation;
  execute: () => Promise<T>;
}): ProviderWorkerJob<T> {
  return {
    providerId: input.providerId,
    requestId: requestId(input.suffix),
    correlationId: correlationId(input.suffix),
    deadlineEpochMilliseconds: input.deadlineEpochMilliseconds ?? 1000,
    cancellation: input.cancellation ?? new ManualCancellation(),
    execute: input.execute,
  };
}

function pool(clock = new ManualClock()) {
  return {
    clock,
    sut: new BoundedProviderWorkerPoolImplementation(
      createBoundedProviderWorkerPoolPolicy({
        maximumActiveJobs: 2,
        maximumQueuedJobs: 2,
        maximumActiveJobsPerProvider: 1,
        maximumDeadlineMilliseconds: 500,
        maximumRetryCount: 1,
      }),
      { nowEpochMilliseconds: () => clock.nowEpochMilliseconds() },
    ),
  };
}

describe('P1 Map Node Explainer bounded provider worker pool', () => {
  it('MNE-QA-09: rejects non-finite and inconsistent pool policy values before any work is admitted', () => {
    for (const invalid of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => createBoundedProviderWorkerPoolPolicy({
        maximumActiveJobs: invalid,
        maximumQueuedJobs: 1,
        maximumActiveJobsPerProvider: 1,
        maximumDeadlineMilliseconds: 500,
        maximumRetryCount: 1,
      })).toThrow();
    }

    expect(() => createBoundedProviderWorkerPoolPolicy({
      maximumActiveJobs: 1,
      maximumQueuedJobs: 1,
      maximumActiveJobsPerProvider: 2,
      maximumDeadlineMilliseconds: 500,
      maximumRetryCount: 1,
    })).toThrow();
  });

  it('MNE-QA-10: queues finite work and returns queue_saturated without transport invocation when the queue is full', async () => {
    const { sut } = pool();
    const first = new Deferred<string>();
    const second = new Deferred<string>();
    let thirdExecutions = 0;
    let fourthExecutions = 0;

    const one = sut.submit(job({ providerId: geminiProvider, suffix: 'one', execute: () => first.promise }));
    const two = sut.submit(job({ providerId: openRouterProvider, suffix: 'two', execute: () => second.promise }));
    const three = sut.submit(job({ providerId: geminiProvider, suffix: 'three', execute: async () => { thirdExecutions += 1; return 'three'; } }));
    const four = sut.submit(job({ providerId: openRouterProvider, suffix: 'four', execute: async () => { fourthExecutions += 1; return 'four'; } }));
    const five = await sut.submit(job({ providerId: geminiProvider, suffix: 'five', execute: async () => 'five' }));

    expect(sut.snapshot()).toMatchObject({ activeJobs: 2, queuedJobs: 2 });
    expect(five).toEqual({ kind: 'queue_saturated' });
    expect(thirdExecutions).toBe(0);
    expect(fourthExecutions).toBe(0);

    first.resolve('one');
    second.resolve('two');
    await expect(one).resolves.toEqual({ kind: 'completed', value: 'one' });
    await expect(two).resolves.toEqual({ kind: 'completed', value: 'two' });
    await expect(three).resolves.toEqual({ kind: 'completed', value: 'three' });
    await expect(four).resolves.toEqual({ kind: 'completed', value: 'four' });
    expect(thirdExecutions).toBe(1);
    expect(fourthExecutions).toBe(1);
  });

  it('MNE-QA-11/MNE-QA-12: enforces provider capacity while starting another eligible provider fairly', async () => {
    const { sut } = pool();
    const firstGemini = new Deferred<string>();
    const secondGemini = new Deferred<string>();
    const openRouter = new Deferred<string>();
    let secondGeminiExecutions = 0;
    let openRouterExecutions = 0;

    const first = sut.submit(job({ providerId: geminiProvider, suffix: 'gemini-one', execute: () => firstGemini.promise }));
    const queuedSameProvider = sut.submit(job({
      providerId: geminiProvider,
      suffix: 'gemini-two',
      execute: async () => { secondGeminiExecutions += 1; return secondGemini.promise; },
    }));
    const eligibleOtherProvider = sut.submit(job({
      providerId: openRouterProvider,
      suffix: 'router-one',
      execute: async () => { openRouterExecutions += 1; return openRouter.promise; },
    }));

    expect(sut.snapshot()).toMatchObject({
      activeJobs: 2,
      queuedJobs: 1,
      activeJobsByProvider: { gemini: 1, openrouter: 1 },
    });
    expect(secondGeminiExecutions).toBe(0);
    expect(openRouterExecutions).toBe(1);

    firstGemini.resolve('first');
    openRouter.resolve('other');
    secondGemini.resolve('second');
    await expect(first).resolves.toEqual({ kind: 'completed', value: 'first' });
    await expect(eligibleOtherProvider).resolves.toEqual({ kind: 'completed', value: 'other' });
    await expect(queuedSameProvider).resolves.toEqual({ kind: 'completed', value: 'second' });
    expect(secondGeminiExecutions).toBe(1);
  });

  it('MNE-QA-13: terminal success and rejection release exactly one lease and dispatch the next eligible job once', async () => {
    const { sut } = pool();
    const first = new Deferred<string>();
    const second = new Deferred<string>();
    let queuedRuns = 0;

    const activeGemini = sut.submit(job({ providerId: geminiProvider, suffix: 'release-one', execute: () => first.promise }));
    const activeRouter = sut.submit(job({ providerId: openRouterProvider, suffix: 'release-two', execute: () => second.promise }));
    const queuedGemini = sut.submit(job({
      providerId: geminiProvider,
      suffix: 'release-three',
      execute: async () => { queuedRuns += 1; return 'queued'; },
    }));

    first.resolve('done');
    second.reject(new Error('provider transport failed'));
    await expect(activeGemini).resolves.toEqual({ kind: 'completed', value: 'done' });
    await expect(activeRouter).resolves.toMatchObject({ kind: 'execution_failed', redactedReason: expect.any(String) });
    await expect(queuedGemini).resolves.toEqual({ kind: 'completed', value: 'queued' });
    expect(queuedRuns).toBe(1);
    expect(sut.snapshot()).toMatchObject({ activeJobs: 0, queuedJobs: 0 });
  });

  it('MNE-QA-14: cancellation before dispatch removes work and never calls its transport', async () => {
    const { sut } = pool();
    const first = new Deferred<string>();
    const second = new Deferred<string>();
    const cancellation = new ManualCancellation();
    let cancelledJobExecutions = 0;

    const one = sut.submit(job({ providerId: geminiProvider, suffix: 'cancel-one', execute: () => first.promise }));
    const two = sut.submit(job({ providerId: openRouterProvider, suffix: 'cancel-two', execute: () => second.promise }));
    const cancelled = sut.submit(job({
      providerId: geminiProvider,
      suffix: 'cancel-three',
      cancellation,
      execute: async () => { cancelledJobExecutions += 1; return 'cancelled'; },
    }));
    cancellation.cancel();

    first.resolve('one');
    second.resolve('two');
    await expect(one).resolves.toEqual({ kind: 'completed', value: 'one' });
    await expect(two).resolves.toEqual({ kind: 'completed', value: 'two' });
    await expect(cancelled).resolves.toEqual({ kind: 'cancelled_before_dispatch' });
    expect(cancelledJobExecutions).toBe(0);
    expect(sut.snapshot()).toMatchObject({ activeJobs: 0, queuedJobs: 0 });
  });

  it('MNE-QA-15: deadline expiry settles once and releases capacity despite late transport success', async () => {
    const { sut, clock } = pool();
    const late = new Deferred<string>();
    const running = sut.submit(job({
      providerId: geminiProvider,
      suffix: 'deadline-one',
      deadlineEpochMilliseconds: 200,
      execute: () => late.promise,
    }));

    clock.advance(101);
    sut.processDeadlines();
    late.resolve('late success');

    await expect(running).resolves.toEqual({ kind: 'deadline_elapsed' });
    expect(sut.snapshot()).toMatchObject({ activeJobs: 0, queuedJobs: 0 });
  });

  it('MNE-QA-17: scheduler snapshot retains capacity metadata only, never raw node or credential content', async () => {
    const { sut } = pool();
    const sensitiveMarker = 'OPENROUTER_API_KEY=must-not-appear';
    await sut.submit(job({
      providerId: geminiProvider,
      suffix: 'snapshot-one',
      execute: async () => sensitiveMarker,
    }));

    const serialized = JSON.stringify(sut.snapshot());
    expect(serialized).not.toContain(sensitiveMarker);
    expect(serialized).not.toMatch(/targetFunction|description|credential|api[_-]?key/i);
  });
});
