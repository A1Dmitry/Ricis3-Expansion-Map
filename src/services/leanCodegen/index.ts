/**
 * src/services/leanCodegen/index.ts
 * Точка экспорта модуля генератора компилируемого Lean 4
 * Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
 */

import { LeanAstCodeGenerator } from './application/leanAstCodeGenerator';
import { LeanAstParser } from './application/leanAstParser';
import { LeanPreambleProvider } from './domain/leanPreambleProvider';
import { TraceDrivenLeanProofGenerator } from './application/traceDrivenLeanProofGenerator';
import { LeanTraceViewModelFactory } from './viewModel/leanTraceViewModelFactory';
import { LeanTraceDocumentTemplate } from './view/leanTraceDocumentTemplate';
import type { ILeanAstCodeGenerator } from './contracts/ILeanAstCodeGenerator';

export * from './contracts/leanAst.types';
export * from './contracts/ILeanAstCodeGenerator';
export * from './contracts/leanMvvm.contracts';
export { LeanPreambleProvider } from './domain/leanPreambleProvider';
export { LeanAstParser } from './application/leanAstParser';
export { LeanAstCodeGenerator } from './application/leanAstCodeGenerator';
export { LeanTraceViewModelFactory } from './viewModel/leanTraceViewModelFactory';
export { LeanTraceDocumentTemplate } from './view/leanTraceDocumentTemplate';
export { TraceDrivenLeanProofGenerator } from './application/traceDrivenLeanProofGenerator';

/** Фабричный метод создания экземпляра генератора с разрешением зависимостей */
export function createLeanAstCodeGenerator(): ILeanAstCodeGenerator {
  const preambleProvider = new LeanPreambleProvider();
  const astParser = new LeanAstParser();
  return new LeanAstCodeGenerator(preambleProvider, astParser);
}

/** Фабричный метод создания экземпляра MVVM генератора трассировки */
export function createTraceDrivenLeanProofGenerator(): TraceDrivenLeanProofGenerator {
  const preambleProvider = new LeanPreambleProvider();
  const vmFactory = new LeanTraceViewModelFactory();
  const template = new LeanTraceDocumentTemplate(preambleProvider);
  return new TraceDrivenLeanProofGenerator(vmFactory, template);
}
