import { FormNode } from './canonicalForm';

/**
 * Heuristic numerical equivalence checker for classical algebraic steps.
 * Assigns random values to symbols and evaluates both sides.
 */
export function verifyClassicalEquivalence(from: FormNode, to: FormNode): boolean {
  const symbols = new Set<string>();
  collectSymbols(from, symbols);
  collectSymbols(to, symbols);

  // Perform multiple trials with different random values to reduce collision probability
  for (let trial = 0; trial < 5; trial++) {
    const vars: Record<string, number> = {};
    for (const sym of symbols) {
      // Use primes or non-trivial floats to avoid accidental integer coincidences
      vars[sym] = 2.718 + Math.random() * 10 + (trial * 1.618);
    }

    const valFrom = evaluateNumerical(from, vars);
    const valTo = evaluateNumerical(to, vars);

    if (valFrom === undefined || valTo === undefined) return false;
    
    // Check for absolute or relative epsilon match
    const diff = Math.abs(valFrom - valTo);
    const scale = Math.max(Math.abs(valFrom), Math.abs(valTo), 1.0);
    if (diff > scale * 1e-10) return false;
  }

  return true;
}

function collectSymbols(node: FormNode, symbols: Set<string>): void {
  switch (node.kind) {
    case 'id':
      symbols.add(node.name);
      break;
    case 'call':
      symbols.add(node.name);
      collectSymbols(node.arg, symbols);
      break;
    case 'pow':
      collectSymbols(node.base, symbols);
      collectSymbols(node.exponent, symbols);
      break;
    case 'bin':
      collectSymbols(node.left, symbols);
      collectSymbols(node.right, symbols);
      break;
  }
}

function evaluateNumerical(node: FormNode, vars: Record<string, number>): number | undefined {
  switch (node.kind) {
    case 'id':
      // Treat numeric strings as numbers
      if (/^-?\d+(\.\d+)?$/.test(node.name)) return parseFloat(node.name);
      return vars[node.name];
    case 'call': {
      const arg = evaluateNumerical(node.arg, vars);
      if (arg === undefined) return undefined;
      // Handle special RICIS tokens as large/small values for numerical check
      if (node.name === 'inf_' || node.name === 'inf') return 1e15 * arg;
      if (node.name === '0_' || node.name === '0') return 1e-15 * arg;
      
      // Standard math functions
      const fn = (Math as any)[node.name];
      if (typeof fn === 'function') return fn(arg);
      
      return undefined;
    }
    case 'pow': {
      const base = evaluateNumerical(node.base, vars);
      const exp = evaluateNumerical(node.exponent, vars);
      if (base === undefined || exp === undefined) return undefined;
      return Math.pow(base, exp);
    }
    case 'bin': {
      const left = evaluateNumerical(node.left, vars);
      const right = evaluateNumerical(node.right, vars);
      if (left === undefined || right === undefined) return undefined;
      switch (node.op) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return right === 0 ? undefined : left / right;
      }
    }
  }
  return undefined;
}
