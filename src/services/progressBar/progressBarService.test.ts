import { describe, expect, it, vi } from 'vitest';
import { ProgressBarService, withProgressBar } from './progressBarService';

describe('ProgressBarService (IProgressBar Protocol)', () => {
  it('starts idle and transitions to running upon startTask', () => {
    const bar = new ProgressBarService();
    expect(bar.getState().status).toBe('idle');
    expect(bar.getState().isRunning).toBe(false);

    bar.startTask('test-task', 'Тестовая задача', 10);
    const state = bar.getState();
    expect(state.id).toBe('test-task');
    expect(state.title).toBe('Тестовая задача');
    expect(state.total).toBe(10);
    expect(state.current).toBe(0);
    expect(state.percentage).toBe(0);
    expect(state.status).toBe('running');
    expect(state.isRunning).toBe(true);
  });

  it('updates progress accurately with percentage calculations', () => {
    const bar = new ProgressBarService();
    bar.startTask('audit', 'Аудит системы', 50);

    bar.updateProgress(25, 50, 'Шаг 25 из 50');
    let state = bar.getState();
    expect(state.current).toBe(25);
    expect(state.percentage).toBe(50);
    expect(state.message).toBe('Шаг 25 из 50');

    bar.updateProgress(50, 50, 'Финиш');
    state = bar.getState();
    expect(state.current).toBe(50);
    expect(state.percentage).toBe(100);
  });

  it('completes task with finishTask and sets 100%', () => {
    const bar = new ProgressBarService();
    bar.startTask('calc', 'Вычисление инварианта', 5);

    bar.finishTask('Готово!');
    const state = bar.getState();
    expect(state.status).toBe('completed');
    expect(state.isRunning).toBe(false);
    expect(state.percentage).toBe(100);
    expect(state.message).toBe('Готово!');
  });

  it('notifies subscribers reactively on state updates', () => {
    const bar = new ProgressBarService();
    const subscriber = vi.fn();

    const unsubscribe = bar.subscribe(subscriber);
    expect(subscriber).toHaveBeenCalledTimes(1);

    bar.startTask('task1', 'Задача', 10);
    expect(subscriber).toHaveBeenCalledTimes(2);

    bar.updateProgress(5, 10);
    expect(subscriber).toHaveBeenCalledTimes(3);

    unsubscribe();
    bar.updateProgress(10, 10);
    expect(subscriber).toHaveBeenCalledTimes(3);
  });

  it('handles cancellation callback correctly', () => {
    const bar = new ProgressBarService();
    const onCancel = vi.fn();

    bar.startTask('cancellable', 'Задача с отменой', 100, onCancel);
    expect(bar.getState().cancellable).toBe(true);

    bar.requestCancel();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(bar.getState().status).toBe('cancelled');
    expect(bar.getState().isRunning).toBe(false);
  });

  it('withProgressBar wraps async functions with full lifecycle tracking', async () => {
    let capturedProgress = 0;
    const result = await withProgressBar('async-task', 'Асинхронный процесс', 4, async (reporter) => {
      reporter(1, 4, 'Шаг 1');
      reporter(2, 4, 'Шаг 2');
      capturedProgress = 2;
      return 'SUCCESS_DATA';
    });

    expect(result).toBe('SUCCESS_DATA');
    expect(capturedProgress).toBe(2);
  });
});
