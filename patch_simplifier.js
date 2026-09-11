const fs = require('fs');
const file = 'packages/ricis-core-ts/src/engine/AlgebraicSimplifier.ts';
let code = fs.readFileSync(file, 'utf8');

const foldConstantsMethod = `

  /**
   * Evaluates constant expressions purely symbolically.
   */
  static foldConstants(node: Expression): Expression {
    if (node.nodeType === 'Function') {
      const fnNode = node as FunctionExpression;
      const args = fnNode.args.map(a => this.foldConstants(a));
      
      // Known exact identities
      if (fnNode.name === 'sin' && args[0].nodeType === 'Constant' && (args[0] as any).value === 0) {
        return AST.Const(0);
      }
      if (fnNode.name === 'cos' && args[0].nodeType === 'Constant' && (args[0] as any).value === 0) {
        return AST.Const(1);
      }
      if (fnNode.name === 'tan' && args[0].nodeType === 'Constant' && (args[0] as any).value === 0) {
        return AST.Const(0);
      }
      if (fnNode.name === 'exp' && args[0].nodeType === 'Constant' && (args[0] as any).value === 0) {
        return AST.Const(1);
      }
      if (fnNode.name === 'log' && args[0].nodeType === 'Constant' && (args[0] as any).value === 1) {
        return AST.Const(0);
      }
      if (fnNode.name === 'ln' && args[0].nodeType === 'Constant' && (args[0] as any).value === 1) {
        return AST.Const(0);
      }

      // If all args are constants, we could evaluate numerically, but ONLY for exact integer results
      if (args.every(a => a.nodeType === 'Constant')) {
         // Not doing float math here to strictly avoid heuristic leakage,
         // except for integer powers, maybe.
      }
      return { nodeType: 'Function', name: fnNode.name, args } as FunctionExpression;
    }
    
    if ('left' in node && 'right' in node) {
      const binNode = node as BinaryExpression;
      const left = this.foldConstants(binNode.left);
      const right = this.foldConstants(binNode.right);

      if (left.nodeType === 'Constant' && right.nodeType === 'Constant') {
        const l = (left as any).value;
        const r = (right as any).value;
        let res = NaN;
        switch (node.nodeType) {
          case 'Add': res = l + r; break;
          case 'Subtract': res = l - r; break;
          case 'Multiply': res = l * r; break;
          case 'Divide': res = l / r; break;
          case 'Power': res = Math.pow(l, r); break;
        }
        // Only fold if the result is a safe integer to avoid float inaccuracies
        if (Number.isSafeInteger(l) && Number.isSafeInteger(r) && Number.isSafeInteger(res)) {
           return AST.Const(res);
        }
        // If they are floats but EXACTLY zero (e.g. 5.5 - 5.5)
        if (res === 0) {
           return AST.Const(0);
        }
      }

      // Symbolic reductions for 0 and 1
      if (node.nodeType === 'Multiply') {
         if (left.nodeType === 'Constant' && (left as any).value === 0) return AST.Const(0);
         if (right.nodeType === 'Constant' && (right as any).value === 0) return AST.Const(0);
         if (left.nodeType === 'Constant' && (left as any).value === 1) return right;
         if (right.nodeType === 'Constant' && (right as any).value === 1) return left;
      }
      if (node.nodeType === 'Add') {
         if (left.nodeType === 'Constant' && (left as any).value === 0) return right;
         if (right.nodeType === 'Constant' && (right as any).value === 0) return left;
      }
      if (node.nodeType === 'Subtract') {
         if (right.nodeType === 'Constant' && (right as any).value === 0) return left;
         // X - X = 0
         if (this.areEqual(left, right)) return AST.Const(0);
      }
      if (node.nodeType === 'Divide') {
         if (left.nodeType === 'Constant' && (left as any).value === 0 && (right.nodeType !== 'Constant' || (right as any).value !== 0)) return AST.Const(0);
         if (right.nodeType === 'Constant' && (right as any).value === 1) return left;
         // X / X = 1
         if (this.areEqual(left, right)) return AST.Const(1);
      }
      if (node.nodeType === 'Power') {
         if (right.nodeType === 'Constant' && (right as any).value === 0) return AST.Const(1);
         if (right.nodeType === 'Constant' && (right as any).value === 1) return left;
      }

      return { ...binNode, left, right } as Expression;
    }

    if (node.nodeType === 'SingularityZero' || node.nodeType === 'SingularityInfinity') {
      const sing = node as SingularityExpression;
      return { ...sing, basis: this.foldConstants(sing.basis) } as Expression;
    }

    return node;
  }
`;

code = code.replace(/static simplify\(node: Expression\): Expression \{/, foldConstantsMethod + '\n  static simplify(node: Expression): Expression {');
fs.writeFileSync(file, code);
