import { Expression, AST } from '../ast/ExpressionTypes';

export class LambdaParser {
  static parse(input: string): { parameterName: string, body: Expression } {
    // Basic parser for "x => ..." format
    const parts = input.split('=>').map(s => s.trim());
    if (parts.length !== 2) throw new Error("Invalid lambda format");
    const parameterName = parts[0]!;
    const bodyStr = parts[1]!;
    
    // Very naive ad-hoc parser for standard RICIS test strings
    const tokens = this.tokenize(bodyStr);
    let pos = 0;

    function parseExpression(): Expression {
      return parseAddSub();
    }

    function parseAddSub(): Expression {
      let left = parseMulDiv();
      while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
        const op = tokens[pos++];
        const right = parseMulDiv();
        left = op === '+' ? AST.Add(left, right) : AST.Sub(left, right);
      }
      return left;
    }

    function parseMulDiv(): Expression {
      let left = parsePower();
      while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/')) {
        const op = tokens[pos++];
        const right = parsePower();
        left = op === '*' ? AST.Mul(left, right) : AST.Div(left, right);
      }
      return left;
    }

    function parsePower(): Expression {
      let left = parsePrimary();
      while (pos < tokens.length && tokens[pos] === '^') {
        pos++;
        const right = parsePrimary();
        left = AST.Pow(left, right);
      }
      return left;
    }

    function parsePrimary(): Expression {
      if (pos >= tokens.length) throw new Error("Unexpected end of input");
      const token = tokens[pos++]!;
      
      if (token === '-') {
        const next = parsePrimary();
        return AST.Mul(AST.Const(-1), next);
      }

      if (token === '+') {
        return parsePrimary();
      }

      if (token === '(') {
        const expr = parseExpression();
        if (tokens[pos++] !== ')') throw new Error("Expected ')'");
        return expr;
      }
      
      if (!isNaN(parseFloat(token))) {
        return AST.Const(parseFloat(token));
      }
      
      if (token === parameterName || token === 'pi') {
        if (token === 'pi') return AST.Fn('pi', []); // or Const(Math.PI)
        return AST.Var(token);
      }

      // Check if it's a function call
      if (pos < tokens.length && tokens[pos] === '(') {
        const fnName = token;
        pos++; // skip '('
        const args: Expression[] = [];
        if (tokens[pos] !== ')') {
          args.push(parseExpression());
          while (tokens[pos] === ',') {
            pos++; // skip ','
            args.push(parseExpression());
          }
        }
        if (tokens[pos++] !== ')') throw new Error(`Expected ')' after function ${fnName} args`);
        return AST.Fn(fnName, args);
      }

      throw new Error(`Unexpected token: ${token}`);
    }

    return { parameterName, body: parseExpression() };
  }

  private static tokenize(input: string): string[] {
    const regex = /\s*([A-Za-z_][A-Za-z0-9_]*|[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?|\S)\s*/g;
    const tokens: string[] = [];
    let match;
    while ((match = regex.exec(input)) !== null) {
      tokens.push(match[1]!);
    }
    return tokens;
  }
}
