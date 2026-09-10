/**
 * RICIS-III Master System: Generic Logger and Document Formatter Contracts (C#-style ILog<T>)
 * Master Registry DOI: 10.5281/zenodo.21517353
 *
 * Separation of Concerns (SRP / ISP):
 * - ILog<TCategory, TEntry>: ONLY logging, invariant assertion and trace-recording.
 * - IDocumentFormatter<TEntry, TOutput>: formatting log entries into documents (JSON, LaTeX, Lean, Text).
 */

import type { ProofStep } from '../../../model/types';

/**
 * Обобщенный уровень важности записи
 */
export type LogSeverity = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

/**
 * Структурированная запись в журнале
 */
export interface ILogRecord<T> {
  readonly id: string;
  readonly timestamp: string;
  readonly severity: LogSeverity;
  readonly category: string;
  readonly data?: T;
  readonly message?: string;
  readonly error?: Error;
}

/**
 * Исключение нарушения утверждения логгера ("throw лучше чем игнор, и пишем его в трэйс")
 */
export class RicisLogAssertionError extends Error {
  public readonly code: string = 'RICIS_LOG_ASSERTION_ERROR';

  constructor(
    message: string,
    public readonly record: ILogRecord<unknown>,
    public readonly originalCause?: unknown
  ) {
    super(`[ILog<${record.category}> Assertion Failed] ${message}`);
    this.name = 'RicisLogAssertionError';
    Object.setPrototypeOf(this, RicisLogAssertionError.prototype);
  }
}

/**
 * Чистый контракт типизированного логгера (по аналогии с C# ILogger<T> / ILog<T>)
 * Зона ответственности: ТОЛЬКО приём записей, assert и throw-to-trace.
 */
export interface ILog<TCategory = string, TEntry = unknown> {
  /** Имя категории или типа контекста */
  readonly category: string;

  /** Зафиксировать запись */
  log(data?: TEntry, severity?: LogSeverity, message?: string): ILogRecord<TEntry>;

  /** Информационная запись */
  info(message: string, data?: TEntry): ILogRecord<TEntry>;

  /** Предупреждение */
  warn(message: string, data?: TEntry): ILogRecord<TEntry>;

  /** Записать ошибку в трэйс */
  error(error: Error | string, data?: TEntry): ILogRecord<TEntry>;

  /**
   * Проверить инвариант: если ложно, зафиксировать сбой с уровнем FATAL в трэйс
   * и ВЫБРОСИТЬ RicisLogAssertionError!
   */
  assert(
    condition: boolean,
    violationMessage: string,
    data?: TEntry,
    cause?: unknown
  ): asserts condition;

  /**
   * Записать ошибку в трэйс и гарантированно выбросить исключение (never)
   */
  throwAndLog(error: Error | string, data?: TEntry): never;

  /** Получить текущие накопленные записи лога (read-only snapshot) */
  getEntries(): readonly ILogRecord<TEntry>[];

  /** Очистить лог */
  clear(): void;
}

/**
 * Отдельный контракт для форматирования / генерации документов из накопленного лога (SRP)
 * Зона ответственности: ТОЛЬКО трансляция данных лога в целевое представление.
 */
export interface IDocumentFormatter<
  TEntry,
  TOutput = string,
  TMetadata = Readonly<Record<string, unknown>>
> {
  /** Форматировать последовательность записей в итоговый документ */
  format(entries: readonly ILogRecord<TEntry>[], metadata?: TMetadata): TOutput;
}

/** Метаданные формируемого математического документа */
export interface IProofDocumentMetadata {
  readonly title?: string;
  readonly author?: string;
  readonly orcid?: string;
  readonly doi?: string;
  readonly targetFunction?: string;
  readonly initialExpression?: string;
  readonly finalInvariant?: string;
  readonly theoremName?: string;
  readonly taskId?: string;
  readonly taskTitle?: string;
  readonly [key: string]: unknown;
}
