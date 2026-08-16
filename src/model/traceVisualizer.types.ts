import type { RicisPhaseTraceStep } from '../services/ricisCore/IRicisCoreEngine';

/** 
 * Строгая типизация фаз алгоритма RICIS-III (от -1 до 6).
 */
export type TransformationPhase = -1 | 0 | 0.5 | 1 | 2 | 3 | 4 | 5 | 6;

/** 
 * UI-контракт шага трейса.
 * Расширяет базовый лог ядра специфичными для рендеринга метаданными.
 */
export interface ITraceStepDTO extends Omit<RicisPhaseTraceStep, 'phase'> {
  readonly phaseIdentifier: TransformationPhase; 
  readonly phaseBadgeLabel: string;
  readonly isAxiomApplied: boolean;
  readonly requiresL1Verification: boolean;
}

/** 
 * DTO агрегированного лога трансформации сингулярности в конечный инвариант.
 * Хранит историю (L0/L1) без мутаций (readonly).
 */
export interface ITransformationLogDTO {
  readonly evaluationId: string;
  readonly targetExpression: string;
  readonly finalInvariant: string;
  readonly isSingular: boolean;
  readonly semanticIndex?: string;
  readonly steps: readonly ITraceStepDTO[];
}

/** 
 * Контракт DI для UI-компонента просмотра трейса.
 */
export interface IExecutionTraceViewerProps {
  readonly nodeId: string;
  readonly logData: ITransformationLogDTO | null;
  readonly isLoading: boolean;
  readonly onRerunTrace?: () => void;
  readonly className?: string;
}

/** 
 * Протокол структурной согласованности (TCP).
 * Проверяет L1_IDENTITY (X = X) на фронтенде без утечки логики в UI.
 */
export interface ITypeConsistencyProtocol {
  verifyL1Identity(originalExpression: string, reducedInvariant: string): boolean;
  assertSemanticIndexPreserved(originalIndex: string, trace: ITransformationLogDTO): boolean;
}
