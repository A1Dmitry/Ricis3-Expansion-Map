/**
 * RICIS-III Master System: Generic Logger Implementation (C#-style ILog<TCategory, TEntry>)
 * Master Registry DOI: 10.5281/zenodo.21517353
 *
 * Core Rule: "throw лучше чем игнор, и пишем его в трэйс"
 */

import {
  RicisLogAssertionError,
  type ILog,
  type ILogRecord,
  type LogSeverity,
} from '../contracts/ricisLog.contracts';

export class RicisLogger<TCategory = string, TEntry = unknown>
  implements ILog<TCategory, TEntry>
{
  private entries: ILogRecord<TEntry>[] = [];
  private sequenceCounter = 0;

  constructor(public readonly category: string) {}

  public log(
    data?: TEntry,
    severity: LogSeverity = 'INFO',
    message?: string
  ): ILogRecord<TEntry> {
    this.sequenceCounter += 1;
    const record: ILogRecord<TEntry> = {
      id: `${this.category}-${Date.now()}-${this.sequenceCounter}`,
      timestamp: new Date().toISOString(),
      severity,
      category: this.category,
      data,
      message,
    };
    this.entries.push(record);
    return record;
  }

  public info(message: string, data?: TEntry): ILogRecord<TEntry> {
    return this.log(data, 'INFO', message);
  }

  public warn(message: string, data?: TEntry): ILogRecord<TEntry> {
    return this.log(data, 'WARN', message);
  }

  public error(error: Error | string, data?: TEntry): ILogRecord<TEntry> {
    this.sequenceCounter += 1;
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const record: ILogRecord<TEntry> = {
      id: `${this.category}-${Date.now()}-${this.sequenceCounter}`,
      timestamp: new Date().toISOString(),
      severity: 'ERROR',
      category: this.category,
      data,
      message: errorObj.message,
      error: errorObj,
    };
    this.entries.push(record);
    return record;
  }

  /**
   * "throw лучше чем игнор, и пишем его в трэйс":
   * Если условие не выполнено, СНАЧАЛА записывает критический сбой в трэйс,
   * а затем немедленно выбрасывает исключение RicisLogAssertionError.
   */
  public assert(
    condition: boolean,
    violationMessage: string,
    data?: TEntry,
    cause?: unknown
  ): asserts condition {
    if (!condition) {
      this.sequenceCounter += 1;
      const record: ILogRecord<TEntry> = {
        id: `${this.category}-${Date.now()}-${this.sequenceCounter}`,
        timestamp: new Date().toISOString(),
        severity: 'FATAL',
        category: this.category,
        data,
        message: violationMessage,
        error: cause instanceof Error ? cause : new Error(violationMessage),
      };
      this.entries.push(record);

      throw new RicisLogAssertionError(violationMessage, record, cause);
    }
  }

  /**
   * Записать ошибку в трэйс и гарантированно выбросить ее наружу
   */
  public throwAndLog(error: Error | string, data?: TEntry): never {
    const errorRecord = this.error(error, data);
    if (errorRecord.error) {
      throw errorRecord.error;
    }
    throw new Error(errorRecord.message ?? 'Unknown logged error');
  }

  public getEntries(): readonly ILogRecord<TEntry>[] {
    return Object.freeze([...this.entries]);
  }

  public clear(): void {
    this.entries = [];
    this.sequenceCounter = 0;
  }
}
