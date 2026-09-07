/**
 * src/services/leanCodegen/index.ts
 * Точка экспорта модуля генератора компилируемого Lean 4
 * Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
 */

import { LeanAstCodeGenerator } from './application/leanAstCodeGenerator';
import { LeanAstParser } from './application/leanAstParser';
import { LeanPreambleProvider } from './domain/leanPreambleProvider';
import type { ILeanAstCodeGenerator } from './contracts/ILeanAstCodeGenerator';

export * from './contracts/leanAst.types';
export * from './contracts/ILeanAstCodeGenerator';
export { LeanPreambleProvider } from './domain/leanPreambleProvider';
export { LeanAstParser } from './application/leanAstParser';
export { LeanAstCodeGenerator } from './application/leanAstCodeGenerator';

/** Фабричный метод создания экземпляра генератора с разрешением зависимостей */
export function createLeanAstCodeGenerator(): ILeanAstCodeGenerator {
  const preambleProvider = new LeanPreambleProvider();
  const astParser = new LeanAstParser();
  return new LeanAstCodeGenerator(preambleProvider, astParser);
}
