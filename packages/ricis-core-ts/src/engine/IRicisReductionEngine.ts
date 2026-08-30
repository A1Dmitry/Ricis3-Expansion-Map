import { Expression } from '../ast/ExpressionTypes';
import { RicisReductionResult } from './RicisEngineContracts';

export interface IRicisReductionEngine {
  reduce(expression: Expression): RicisReductionResult;
  areEqual(a: Expression, b: Expression): boolean;
}
