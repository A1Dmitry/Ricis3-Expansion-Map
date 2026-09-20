import type {
  IProgressBar,
  ProgressCallback,
  ProgressState,
  ProgressTaskStatus,
} from './progressBar.types';

const INITIAL_STATE: ProgressState = {
  id: '',
  title: '',
  current: 0,
  total: 0,
  percentage: 0,
  message: '',
  status: 'idle',
  isRunning: false,
  isIndeterminate: false,
  startTime: 0,
  elapsedMs: 0,
  cancellable: false,
};

export class ProgressBarService implements IProgressBar {
  private state: ProgressState = { ...INITIAL_STATE };
  private readonly listeners = new Set<(state: ProgressState) => void>();
  private onCancelCallback?: () => void;
  private autoHideTimeoutId: ReturnType<typeof setTimeout> | null = null;

  public startTask(
    id: string,
    title: string,
    total: number = 0,
    onCancel?: () => void
  ): void {
    this.clearAutoHide();
    this.onCancelCallback = onCancel;
    const now = Date.now();
    const isIndeterminate = total <= 0;

    this.state = {
      id,
      title,
      current: 0,
      total: Math.max(0, total),
      percentage: 0,
      message: 'Запуск задачи...',
      status: 'running',
      isRunning: true,
      isIndeterminate,
      startTime: now,
      elapsedMs: 0,
      estimatedRemainingMs: undefined,
      error: undefined,
      cancellable: typeof onCancel === 'function',
    };

    this.notify();
  }

  public updateProgress(current: number, total: number, message?: string): void {
    if (!this.state.isRunning && this.state.status !== 'running') {
      return;
    }

    const now = Date.now();
    const elapsed = Math.max(0, now - this.state.startTime);
    const validTotal = Math.max(1, total);
    const safeCurrent = Math.max(0, Math.min(current, validTotal));
    const rawPct = Math.round((safeCurrent / validTotal) * 100);
    const percentage = Math.min(100, Math.max(0, rawPct));

    let estimatedRemainingMs: number | undefined;
    if (safeCurrent > 0 && elapsed > 300) {
      const msPerUnit = elapsed / safeCurrent;
      const remainingUnits = validTotal - safeCurrent;
      estimatedRemainingMs = Math.round(msPerUnit * remainingUnits);
    }

    this.state = {
      ...this.state,
      current: safeCurrent,
      total: validTotal,
      percentage,
      message: message !== undefined ? message : this.state.message,
      isIndeterminate: total <= 0,
      elapsedMs: elapsed,
      estimatedRemainingMs,
    };

    this.notify();
  }

  public setProgress(percentage: number, message?: string): void {
    if (!this.state.isRunning && this.state.status !== 'running') {
      return;
    }

    const clampedPct = Math.min(100, Math.max(0, Math.round(percentage)));
    const now = Date.now();
    const elapsed = Math.max(0, now - this.state.startTime);

    this.state = {
      ...this.state,
      percentage: clampedPct,
      message: message !== undefined ? message : this.state.message,
      isIndeterminate: false,
      elapsedMs: elapsed,
    };

    this.notify();
  }

  public setMessage(message: string): void {
    if (!this.state.isRunning && this.state.status !== 'running') {
      return;
    }

    const now = Date.now();
    this.state = {
      ...this.state,
      message,
      elapsedMs: Math.max(0, now - this.state.startTime),
    };

    this.notify();
  }

  public finishTask(message: string = 'Завершено (100%)'): void {
    if (this.state.status === 'idle') return;

    const now = Date.now();
    this.state = {
      ...this.state,
      current: this.state.total || 1,
      total: this.state.total || 1,
      percentage: 100,
      message,
      status: 'completed',
      isRunning: false,
      isIndeterminate: false,
      endTime: now,
      elapsedMs: Math.max(0, now - this.state.startTime),
      estimatedRemainingMs: 0,
    };

    this.notify();
    this.scheduleAutoHide(2500);
  }

  public cancelTask(message: string = 'Задача отменена'): void {
    const now = Date.now();
    this.state = {
      ...this.state,
      message,
      status: 'cancelled',
      isRunning: false,
      endTime: now,
      elapsedMs: Math.max(0, now - this.state.startTime),
      estimatedRemainingMs: undefined,
    };

    this.notify();
    this.scheduleAutoHide(2000);
  }

  public failTask(error: string | Error): void {
    const errorMsg = typeof error === 'string' ? error : error.message || 'Ошибка выполнения';
    const now = Date.now();

    this.state = {
      ...this.state,
      message: `Ошибка: ${errorMsg}`,
      error: errorMsg,
      status: 'error',
      isRunning: false,
      endTime: now,
      elapsedMs: Math.max(0, now - this.state.startTime),
      estimatedRemainingMs: undefined,
    };

    this.notify();
    this.scheduleAutoHide(4000);
  }

  public requestCancel(): void {
    if (this.onCancelCallback) {
      try {
        this.onCancelCallback();
      } catch (err) {
        console.error('Error during progress cancellation callback:', err);
      }
    }
    this.cancelTask();
  }

  public getState(): ProgressState {
    return { ...this.state };
  }

  public subscribe(listener: (state: ProgressState) => void): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snapshot = { ...this.state };
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('Error notifying progress listener:', err);
      }
    }
  }

  private clearAutoHide(): void {
    if (this.autoHideTimeoutId !== null) {
      clearTimeout(this.autoHideTimeoutId);
      this.autoHideTimeoutId = null;
    }
  }

  private scheduleAutoHide(delayMs: number): void {
    this.clearAutoHide();
    this.autoHideTimeoutId = setTimeout(() => {
      this.state = { ...INITIAL_STATE };
      this.onCancelCallback = undefined;
      this.notify();
      this.autoHideTimeoutId = null;
    }, delayMs);
  }
}

// Global singleton instance for app-wide cross-module communication
export const globalProgressBar: IProgressBar = new ProgressBarService();

/**
 * Возвращает глобальный сервис IProgressBar
 */
export function getProgressBar(): IProgressBar {
  return globalProgressBar;
}

/**
 * Обертка для выполнения длительной задачи (> 2 сек) с автоматической интеграцией IProgressBar
 */
export async function withProgressBar<T>(
  taskId: string,
  title: string,
  total: number,
  taskFn: (reporter: ProgressCallback, signal?: AbortSignal) => Promise<T>,
  onCancel?: () => void
): Promise<T> {
  const bar = getProgressBar();
  bar.startTask(taskId, title, total, onCancel);

  const reporter: ProgressCallback = (current, totalSteps, msg) => {
    bar.updateProgress(current, totalSteps, msg);
  };

  try {
    const result = await taskFn(reporter);
    bar.finishTask();
    return result;
  } catch (err: unknown) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    bar.failTask(errorObj);
    throw err;
  }
}
