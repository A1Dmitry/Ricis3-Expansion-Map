import { Expression } from '../ast/ExpressionTypes';

export interface TransformationLogEntry {
  readonly phase: number;
  readonly ruleFamily: string;
  readonly description: string;
  readonly before: Expression;
  readonly after: Expression;
}

export interface RicisReductionResult {
  readonly original: Expression;
  readonly reduced: Expression;
  readonly trace: TransformationLogEntry[];
  readonly isFullyResolved: boolean;
}
