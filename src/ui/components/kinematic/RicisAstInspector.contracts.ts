import type {
  IRicisAstInverseSolution,
  ISymbolicJacobianMatrix3D,
  RicisAstExpr,
} from '../../../model/ricisSymbolicJacobian.contracts';
import type { JointState3D } from '../../../model/kinematicEngine.contracts';

export interface IRicisAstInspectorProps {
  /** Текущее решение обращения якобиана (лог редукции, статус сингулярности) */
  readonly solution: IRicisAstInverseSolution | null;
  /** Символическая матрица AST Якобиана 3x3 */
  readonly jacobianMatrix: ISymbolicJacobianMatrix3D | null;
  /** Текущие углы звеньев */
  readonly joints: JointState3D;
  /** Длины звеньев [L0, L1, L2] */
  readonly linkLengths: readonly [number, number, number];
  /** Компактный режим для встраивания во вкладку */
  readonly isCompact?: boolean;
}

/**
 * Вспомогательный DTO для строкового представления AST-узлов в UI.
 */
export interface IAstNodeDisplay {
  readonly formula: string;
  readonly evaluatedValue: number;
  readonly isSingular: boolean;
  readonly badgeLabel?: string;
}
