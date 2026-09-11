/**
 * RICIS-III Logging & Document Formatting Subsystem
 * Master Registry DOI: 10.5281/zenodo.21517353
 */

export * from './contracts/ricisLog.contracts';
export * from './domain/ricisLogger';
export * from './formatters/simpleTextDocumentFormatter';
export * from './formatters/jsonDocumentFormatter';
export * from './formatters/latexProofDocumentFormatter';
export * from './formatters/leanProofDocumentFormatter';

import { RicisLogger } from './domain/ricisLogger';
import type { ILog } from './contracts/ricisLog.contracts';

/**
 * Factory for creating typed ILog instances (C# style ILog<T>)
 */
export function createRicisLogger<TCategory = string, TEntry = unknown>(
  category: string
): ILog<TCategory, TEntry> {
  return new RicisLogger<TCategory, TEntry>(category);
}
