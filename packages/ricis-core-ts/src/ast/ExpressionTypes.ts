export type ExpressionNodeType = 
  | 'Constant' 
  | 'Parameter' 
  | 'Add' 
  | 'Subtract' 
  | 'Multiply' 
  | 'Divide'
  | 'Power'
  | 'Function'
  | 'SingularityZero'
  | 'SingularityInfinity'
  | 'Derivative';

export interface Expression {
  readonly nodeType: ExpressionNodeType;
}

export interface ConstantExpression extends Expression {
  readonly nodeType: 'Constant';
  readonly value: number;
}

export interface ParameterExpression extends Expression {
  readonly nodeType: 'Parameter';
  readonly name: string;
}

export interface BinaryExpression extends Expression {
  readonly nodeType: 'Add' | 'Subtract' | 'Multiply' | 'Divide' | 'Power';
  readonly left: Expression;
  readonly right: Expression;
}

export interface FunctionExpression extends Expression {
  readonly nodeType: 'Function';
  readonly name: string;
  readonly args: Expression[];
}

export interface SingularityExpression extends Expression {
  readonly nodeType: 'SingularityZero' | 'SingularityInfinity';
  readonly basis: Expression;
}

export interface DerivativeExpression extends Expression {
  readonly nodeType: 'Derivative';
  readonly expression: Expression;
  readonly variable: string;
}

// Утилиты-фабрики для быстрого создания AST в тестах и коде
export const AST = {
  Const: (value: number): ConstantExpression => ({ nodeType: 'Constant', value }),
  Var: (name: string): ParameterExpression => ({ nodeType: 'Parameter', name }),
  Add: (left: Expression, right: Expression): BinaryExpression => ({ nodeType: 'Add', left, right }),
  Sub: (left: Expression, right: Expression): BinaryExpression => ({ nodeType: 'Subtract', left, right }),
  Mul: (left: Expression, right: Expression): BinaryExpression => ({ nodeType: 'Multiply', left, right }),
  Div: (left: Expression, right: Expression): BinaryExpression => ({ nodeType: 'Divide', left, right }),
  Pow: (left: Expression, right: Expression): BinaryExpression => ({ nodeType: 'Power', left, right }),
  Fn: (name: string, args: Expression[]): FunctionExpression => ({ nodeType: 'Function', name, args }),
  Zero: (basis: Expression): SingularityExpression => ({ nodeType: 'SingularityZero', basis }),
  Inf: (basis: Expression): SingularityExpression => ({ nodeType: 'SingularityInfinity', basis }),
  Diff: (expression: Expression, variable: string): DerivativeExpression => ({ nodeType: 'Derivative', expression, variable })
};
