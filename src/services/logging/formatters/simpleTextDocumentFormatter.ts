/**
 * RICIS-III Simple Text Document Formatter
 * Formats structured ILogRecord entries into a readable text document/audit log.
 */

import type { IDocumentFormatter, ILogRecord } from '../contracts/ricisLog.contracts';

export class SimpleTextDocumentFormatter<T = unknown>
  implements IDocumentFormatter<T, string>
{
  public format(
    entries: readonly ILogRecord<T>[],
    metadata?: Readonly<Record<string, unknown>>
  ): string {
    const title = (metadata?.title as string) || 'RICIS Execution Audit Log';
    const lines: string[] = [
      `=== ${title} ===`,
      `Generated at: ${new Date().toISOString()}`,
      `Total records: ${entries.length}`,
      '----------------------------------------',
    ];

    for (const entry of entries) {
      const msg = entry.message ?? (entry.data ? JSON.stringify(entry.data) : '');
      lines.push(`[${entry.severity}] [${entry.category}] ${msg}`);
      if (entry.error) {
        lines.push(`  Error: ${entry.error.message}`);
      }
    }

    lines.push('----------------------------------------');
    return lines.join('\n');
  }
}
