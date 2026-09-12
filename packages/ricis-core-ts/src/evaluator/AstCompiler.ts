import {
  Expression,
  FunctionExpression,
  ConstantExpression,
  ParameterExpression,
  BinaryExpression
} from '../ast/ExpressionTypes';

export class AstCompiler {
  /**
   * Compiles an AST Expression ONCE into a zero-overhead single-parameter executable delegate: (x: number) => number
   * Runtime calls to the returned delegate do NOT perform any AST traversal or switch dispatching.
   */
  static compileSingleParam(parameterName: string, expr: Expression): (x: number) => number {
    const jsExpr = this.toJavaScriptExpr(expr, (param) => {
      if (param === parameterName) return 'x';
      throw new Error(`Unknown parameter: ${param}`);
    });
    
    // Compile once into native V8 function
    const compiledFn = new Function('x', `return (${jsExpr});`) as (x: number) => number;
    
    return (x: number) => {
      const res = compiledFn(x);
      return typeof res === 'number' && !Number.isNaN(res) ? res : (Number.isNaN(res) ? 0 : res);
    };
  }

  /**
   * Compiles an AST Expression ONCE into a multi-parameter executable delegate: (params: Record<string, number>) => number
   * Runtime calls to the returned delegate execute directly in JS without AST traversal.
   */
  static compileDictionary(expr: Expression): (params: Record<string, number>) => number {
    const jsExpr = this.toJavaScriptExpr(expr, (param) => `(params['${param}'] ?? 0)`);
    const compiledFn = new Function('params', `return (${jsExpr});`) as (params: Record<string, number>) => number;
    
    return (params: Record<string, number>) => {
      const res = compiledFn(params);
      return typeof res === 'number' && !Number.isNaN(res) ? res : (Number.isNaN(res) ? 0 : res);
    };
  }

  /**
   * Converts an AST expression tree into an equivalent JS expression string.
   */
  private static toJavaScriptExpr(node: Expression, paramResolver: (name: string) => string): string {
    switch (node.nodeType) {
      case 'Constant':
        return String((node as ConstantExpression).value);
      case 'Parameter':
        return paramResolver((node as ParameterExpression).name);
      case 'Add': {
        const bin = node as BinaryExpression;
        return `(${this.toJavaScriptExpr(bin.left, paramResolver)} + ${this.toJavaScriptExpr(bin.right, paramResolver)})`;
      }
      case 'Subtract': {
        const bin = node as BinaryExpression;
        return `(${this.toJavaScriptExpr(bin.left, paramResolver)} - ${this.toJavaScriptExpr(bin.right, paramResolver)})`;
      }
      case 'Multiply': {
        const bin = node as BinaryExpression;
        return `(${this.toJavaScriptExpr(bin.left, paramResolver)} * ${this.toJavaScriptExpr(bin.right, paramResolver)})`;
      }
      case 'Divide': {
        const bin = node as BinaryExpression;
        return `(${this.toJavaScriptExpr(bin.left, paramResolver)} / ${this.toJavaScriptExpr(bin.right, paramResolver)})`;
      }
      case 'Power': {
        const bin = node as BinaryExpression;
        return `Math.pow(${this.toJavaScriptExpr(bin.left, paramResolver)}, ${this.toJavaScriptExpr(bin.right, paramResolver)})`;
      }
      case 'Function': {
        const fnNode = node as FunctionExpression;
        const args = fnNode.args.map(arg => this.toJavaScriptExpr(arg, paramResolver));
        switch (fnNode.name) {
          case 'sin': return `Math.sin(${args[0]})`;
          case 'cos': return `Math.cos(${args[0]})`;
          case 'tan': return `Math.tan(${args[0]})`;
          case 'sinh': return `Math.sinh(${args[0]})`;
          case 'cosh': return `Math.cosh(${args[0]})`;
          case 'tanh': return `Math.tanh(${args[0]})`;
          case 'exp': return `Math.exp(${args[0]})`;
          case 'log': return `Math.log(${args[0]})`;
          case 'log10': return `Math.log10(${args[0]})`;
          case 'sqrt': return `Math.sqrt(${args[0]})`;
          case 'abs': return `Math.abs(${args[0]})`;
          case 'sign': return `Math.sign(${args[0]})`;
          case 'pow': return `Math.pow(${args[0]}, ${args[1]})`;
          case 'min': return `Math.min(${args.join(', ')})`;
          case 'max': return `Math.max(${args.join(', ')})`;
          case 'mod': return `(${args[0]} % ${args[1]})`;
          case 'clamp': return `Math.min(Math.max(${args[0]}, ${args[1]}), ${args[2]})`;
          case 'positivePart': return `Math.max(${args[0]}, 0)`;
          case 'negativePart': return `Math.max(-(${args[0]}), 0)`;
          case 'distance': return `Math.abs(${args[0]} - ${args[1]})`;
          case 'sum': return `(${args[0]} + ${args[1]})`;
          case 'compoundInterest': return `(${args[0]} * Math.pow(1 + ${args[1]} / 100, ${args[2]}))`;
          case 'pi': return 'Math.PI';
          case 'integral': return '0';
          case 'derivative': return '0';
          default:
            return '0';
        }
      }
      case 'SingularityZero':
        return '0';
      case 'SingularityInfinity':
        return 'Infinity';
      default:
        return '0';
    }
  }
}
