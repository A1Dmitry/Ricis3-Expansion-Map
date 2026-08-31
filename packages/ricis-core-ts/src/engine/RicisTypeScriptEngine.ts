import { Expression, AST, BinaryExpression, SingularityExpression, FunctionExpression, DerivativeExpression } from '../ast/ExpressionTypes';
import { IRicisReductionEngine } from './IRicisReductionEngine';
import { RicisReductionResult, TransformationLogEntry } from './RicisEngineContracts';
import { SymbolicDifferentiator } from './SymbolicDifferentiator';

export class RicisTypeScriptEngine implements IRicisReductionEngine {
  
  areEqual(a: Expression, b: Expression): boolean {
    if (a.nodeType !== b.nodeType) {
      // Check Power vs Function('pow')
      if (a.nodeType === 'Power' && b.nodeType === 'Function' && (b as FunctionExpression).name.toLowerCase() === 'pow') {
        const powA = a as BinaryExpression;
        const fnB = b as FunctionExpression;
        return this.areEqual(powA.left, fnB.args[0]!) && this.areEqual(powA.right, fnB.args[1]!);
      }
      if (b.nodeType === 'Power' && a.nodeType === 'Function' && (a as FunctionExpression).name.toLowerCase() === 'pow') {
        const powB = b as BinaryExpression;
        const fnA = a as FunctionExpression;
        return this.areEqual(fnA.args[0]!, powB.left) && this.areEqual(fnA.args[1]!, powB.right);
      }
      return false;
    }
    
    switch (a.nodeType) {
      case 'Constant':
        return (a as any).value === (b as any).value;
      case 'Parameter':
        return (a as any).name === (b as any).name;
      case 'Add':
      case 'Subtract':
      case 'Multiply':
      case 'Divide':
      case 'Power':
        const binA = a as BinaryExpression;
        const binB = b as BinaryExpression;
        return this.areEqual(binA.left, binB.left) && this.areEqual(binA.right, binB.right);
      case 'Function':
        const fnA = a as FunctionExpression;
        const fnB = b as FunctionExpression;
        if (fnA.name.toLowerCase() !== fnB.name.toLowerCase() || fnA.args.length !== fnB.args.length) return false;
        return fnA.args.every((arg, idx) => this.areEqual(arg, fnB.args[idx]!));
      case 'SingularityZero':
      case 'SingularityInfinity':
        const singA = a as SingularityExpression;
        const singB = b as SingularityExpression;
        return this.areEqual(singA.basis, singB.basis);
      case 'Derivative':
        const d_A = a as DerivativeExpression;
        const d_B = b as DerivativeExpression;
        return d_A.variable === d_B.variable && this.areEqual(d_A.expression, d_B.expression);
      default:
        return false;
    }
  }

  reduce(expression: Expression): RicisReductionResult {
    const trace: TransformationLogEntry[] = [];
    const reduced = this.reduceNode(expression, trace);
    
    return {
      original: expression,
      reduced,
      trace,
      isFullyResolved: !this.hasUnresolvedDivisionByZero(reduced)
    };
  }

  private reduceNode(node: Expression, trace: TransformationLogEntry[]): Expression {
    // Символьное дифференцирование
    if (node.nodeType === 'Derivative') {
      const deriv = node as DerivativeExpression;
      const dExpr = SymbolicDifferentiator.diff(deriv.expression, deriv.variable);
      trace.push({
        phase: 2,
        ruleFamily: 'Derivative',
        description: `Symbolic differentiation d(${deriv.variable})`,
        before: node,
        after: dExpr
      });
      return this.reduceNode(dExpr, trace);
    }

    // Рекурсивный спуск (Post-order traversal)
    if (node.nodeType === 'Function') {
      const fnNode = node as FunctionExpression;
      if (fnNode.name === 'pi') {
        return AST.Const(Math.PI);
      }
      const reducedArgs = fnNode.args.map(arg => this.reduceNode(arg, trace));
      return { nodeType: 'Function', name: fnNode.name, args: reducedArgs } as FunctionExpression;
    }

    if ('left' in node && 'right' in node) {
      const binNode = node as BinaryExpression;
      const left = this.reduceNode(binNode.left, trace);
      const right = this.reduceNode(binNode.right, trace);

      // --- RICIS Phase 2: A4 (0_F / 0_G = F / G) ---
      if (node.nodeType === 'Divide' && left.nodeType === 'SingularityZero' && right.nodeType === 'SingularityZero') {
        const szLeft = left as SingularityExpression;
        const szRight = right as SingularityExpression;
        
        const result = AST.Div(szLeft.basis, szRight.basis);
        trace.push({
          phase: 2,
          ruleFamily: 'A4',
          description: 'Zero Ratio Axiom (0_F / 0_G = F / G)',
          before: { ...binNode, left, right } as Expression,
          after: result
        });
        // Рекурсивно редуцируем результат (например, F/F сожмется по L1)
        return this.reduceNode(result, trace);
      }

      // --- RICIS Phase 1: O(1) L1_IDENTITY Reduction (A / A = 1) ---
      if (node.nodeType === 'Divide' && this.areEqual(left, right)) {
        trace.push({
          phase: 1,
          ruleFamily: 'L1',
          description: 'Structural Identity Cancellation F/F=1 (O(1))',
          before: { ...binNode, left, right } as Expression,
          after: AST.Const(1)
        });
        return AST.Const(1);
      }

      // (c * X) / X => c
      if (node.nodeType === 'Divide' && left.nodeType === 'Multiply') {
        const lMul = left as BinaryExpression;
        if (this.areEqual(lMul.right, right)) {
          trace.push({
            phase: 3,
            ruleFamily: 'Algebraic Cleanup',
            description: '(c * X) / X -> c',
            before: { ...binNode, left, right } as Expression,
            after: lMul.left
          });
          return this.reduceNode(lMul.left, trace);
        }
        if (this.areEqual(lMul.left, right)) {
          trace.push({
            phase: 3,
            ruleFamily: 'Algebraic Cleanup',
            description: '(X * c) / X -> c',
            before: { ...binNode, left, right } as Expression,
            after: lMul.right
          });
          return this.reduceNode(lMul.right, trace);
        }
      }

      // X / (c * X) => 1 / c
      if (node.nodeType === 'Divide' && right.nodeType === 'Multiply') {
        const rMul = right as BinaryExpression;
        if (this.areEqual(rMul.right, left)) {
          const after = AST.Div(AST.Const(1), rMul.left);
          trace.push({
            phase: 3,
            ruleFamily: 'Algebraic Cleanup',
            description: 'X / (c * X) -> 1 / c',
            before: { ...binNode, left, right } as Expression,
            after
          });
          return this.reduceNode(after, trace);
        }
        if (this.areEqual(rMul.left, left)) {
          const after = AST.Div(AST.Const(1), rMul.right);
          trace.push({
            phase: 3,
            ruleFamily: 'Algebraic Cleanup',
            description: 'X / (X * c) -> 1 / c',
            before: { ...binNode, left, right } as Expression,
            after
          });
          return this.reduceNode(after, trace);
        }
      }

      // (A / B) / C
      if (node.nodeType === 'Divide' && left.nodeType === 'Divide') {
          const lDiv = left as BinaryExpression;
          if (this.areEqual(lDiv.left, right)) {
             const after = AST.Div(AST.Const(1), lDiv.right);
             trace.push({
                phase: 3,
                ruleFamily: 'Algebraic Cleanup',
                description: '(A/B)/A -> 1/B',
                before: { ...binNode, left, right } as Expression,
                after
             });
             return this.reduceNode(after, trace);
          }
      }

      // Constant folding
      if (left.nodeType === 'Constant' && right.nodeType === 'Constant') {
          const lVal = (left as any).value;
          const rVal = (right as any).value;
          let val = 0;
          switch (node.nodeType) {
              case 'Add': val = lVal + rVal; break;
              case 'Subtract': val = lVal - rVal; break;
              case 'Multiply': val = lVal * rVal; break;
              case 'Divide': val = lVal / rVal; break;
              case 'Power': val = Math.pow(lVal, rVal); break;
          }
          return AST.Const(val);
      }

      // --- RICIS Phase 2: A6 (0_F * infty_G = F * G) ---
      if (node.nodeType === 'Multiply') {
        let z: SingularityExpression | null = null;
        let inf: SingularityExpression | null = null;

        if (left.nodeType === 'SingularityZero' && right.nodeType === 'SingularityInfinity') {
          z = left as SingularityExpression; inf = right as SingularityExpression;
        } else if (right.nodeType === 'SingularityZero' && left.nodeType === 'SingularityInfinity') {
          z = right as SingularityExpression; inf = left as SingularityExpression;
        }

        if (z && inf) {
          const result = AST.Mul(z.basis, inf.basis);
          trace.push({
            phase: 2,
            ruleFamily: 'A6',
            description: 'General Product Axiom (0_F * infty_G = F * G)',
            before: { ...binNode, left, right } as Expression,
            after: result
          });
          return this.reduceNode(result, trace);
        }
      }

      // --- Prevent Division By Zero Exception (Scalar / 0_F -> infty_F) ---
      if (node.nodeType === 'Divide' && right.nodeType === 'SingularityZero') {
         const infBasis = (right as SingularityExpression).basis;
         const result = AST.Mul(left, AST.Inf(infBasis));
         trace.push({
           phase: 2,
           ruleFamily: 'A10',
           description: 'Scalar Division Axiom (F / 0_G = F * infty_G)',
           before: { ...binNode, left, right } as Expression,
           after: result
         });
         return result;
      }

      return { ...binNode, left, right } as Expression;
    }

    return node;
  }

  private hasUnresolvedDivisionByZero(node: Expression): boolean {
    if (node.nodeType === 'Divide') {
      const div = node as BinaryExpression;
      // Если справа остался Сингулярный Ноль, значит мы его не разрешили
      if (div.right.nodeType === 'SingularityZero') return true;
    }
    if (node.nodeType === 'Function') {
      return (node as import('../ast/ExpressionTypes').FunctionExpression).args.some(arg => this.hasUnresolvedDivisionByZero(arg));
    }
    if ('left' in node && 'right' in node) {
      return this.hasUnresolvedDivisionByZero((node as BinaryExpression).left) || 
             this.hasUnresolvedDivisionByZero((node as BinaryExpression).right);
    }
    return false;
  }
}
