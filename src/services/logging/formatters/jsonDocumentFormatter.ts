/**
 * RICIS-III JSON Document Formatter
 * Serializes ILogRecord stream into formatted, validated JSON documents.
 */

import type { IDocumentFormatter, ILogRecord } from '../contracts/ricisLog.contracts';

export class JsonDocumentFormatter<T = unknown>
  implements IDocumentFormatter<T, string>
{
  public format(
    entries: readonly ILogRecord<T>[],
    metadata?: Readonly<Record<string, unknown>>
  ): string {
    const category = entries.length > 0 ? entries[0]?.category : 'RICIS';
    const payload = {
      category,
      generatedAt: new Date().toISOString(),
      metadata: metadata ?? {},
      totalEntries: entries.length,
      entries: entries.map((e) => ({
        id: e.id,
        timestamp: e.timestamp,
        severity: e.severity,
        category: e.category,
        message: e.message,
        data: e.data,
        error: e.error ? { message: e.error.message, stack: e.error.stack } : undefined,
      })),
    };

    return JSON.stringify(payload, null, 2);
  }
}
