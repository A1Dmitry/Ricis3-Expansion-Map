import type { ITransformationLogDTO } from './traceVisualizer.types';
import type { RicisFormalProof, RicisAcademicProofResult } from '../services/ricisCore/IRicisCoreEngine';

/**
 * Режимы отчетов доказательной базы в песочнице
 */
export type ProofReportMode = 'trace' | 'theorem' | 'lean4' | 'academic';

/**
 * Расширенная запись истории вычислений в терминале (Sandbox).
 */
export interface ITerminalHistoryEntry {
  readonly id: string;
  readonly timestamp: number;
  readonly expression: string;
  readonly result: ITransformationLogDTO | null;
  readonly formalProof?: RicisFormalProof | null;
  readonly academicProof?: RicisAcademicProofResult | null;
  readonly error: string | null;
}

/**
 * Состояние глобального аналитического терминала RICIS-III.
 */
export interface ITerminalState {
  readonly isOpen: boolean;
  readonly activeReportMode: ProofReportMode;
  readonly currentInput: string;
  readonly isEvaluating: boolean;
  readonly history: readonly ITerminalHistoryEntry[];
}

/**
 * Действия (Actions) для управления терминалом.
 * Строгий DI-контракт для стора (Zustand).
 */
export interface ITerminalActions {
  /** Открыть/закрыть терминал */
  readonly toggleTerminal: (force?: boolean) => void;
  /** Переключить режим отображения отчета */
  readonly setReportMode: (mode: ProofReportMode) => void;
  /** Обновить строку ввода */
  readonly setInput: (expression: string) => void;
  /** Запустить вычисление текущего выражения через RicisCoreEngine */
  readonly evaluateExpression: () => Promise<void>;
  /** Очистить историю сессии */
  readonly clearHistory: () => void;
  /** Повторить вычисление из истории */
  readonly loadFromHistory: (expression: string) => void;
}

/**
 * Полный контракт глобального стора терминала.
 */
export interface ITerminalStore extends ITerminalState, ITerminalActions {}
