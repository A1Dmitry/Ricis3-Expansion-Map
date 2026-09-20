/**
 * RICIS-III v7.7 Unified Progress Bar Protocol (IProgressBar)
 * Архитектурный контракт прогресс-бара для длительных асинхронных задач (> 2 секунд).
 * Соответствует принципам Clean Architecture, SOLID, DRY и RCVAP.
 */

export type ProgressTaskStatus = 'idle' | 'running' | 'completed' | 'error' | 'cancelled';

export interface ProgressState {
  readonly id: string;
  readonly title: string;
  readonly current: number;
  readonly total: number;
  readonly percentage: number; // 0..100
  readonly message?: string;
  readonly status: ProgressTaskStatus;
  readonly isRunning: boolean;
  readonly isIndeterminate: boolean;
  readonly startTime: number;
  readonly endTime?: number;
  readonly elapsedMs: number;
  readonly estimatedRemainingMs?: number;
  readonly error?: string;
  readonly cancellable: boolean;
}

export type ProgressCallback = (current: number, total: number, message?: string) => void;

export interface IProgressBar {
  /**
   * Запускает отслеживание длительной задачи.
   * @param id Уникальный идентификатор задачи (e.g. 'auto-prover', 'db-migration')
   * @param title Отображаемое название задачи (e.g. 'RICIS Auto Prover')
   * @param total Общее количество элементов (0 для неопределённой длительности)
   * @param onCancel Опциональный колбэк отмены задачи пользователем
   */
  startTask: (id: string, title: string, total?: number, onCancel?: () => void) => void;

  /**
   * Обновляет текущий прогресс выполнения.
   * @param current Текущий обработанный элемент
   * @param total Общее количество элементов
   * @param message Дополнительный контекст/сообщение шага
   */
  updateProgress: (current: number, total: number, message?: string) => void;

  /**
   * Задаёт точный процент выполнения (0..100).
   * @param percentage Число от 0 до 100
   * @param message Опциональное пояснение
   */
  setProgress: (percentage: number, message?: string) => void;

  /**
   * Обновляет только текстовое сообщение без изменения прогресса.
   */
  setMessage: (message: string) => void;

  /**
   * Успешно завершает задачу с фиксацией 100%.
   */
  finishTask: (message?: string) => void;

  /**
   * Отменяет задачу пользователем или системой.
   */
  cancelTask: (message?: string) => void;

  /**
   * Фиксирует ошибку выполнения задачи.
   */
  failTask: (error: string | Error) => void;

  /**
   * Возвращает текущее состояние прогресса.
   */
  getState: () => ProgressState;

  /**
   * Подписка на изменения состояния.
   */
  subscribe: (listener: (state: ProgressState) => void) => () => void;

  /**
   * Вызов зарегистрированного обработчика отмены.
   */
  requestCancel: () => void;
}
