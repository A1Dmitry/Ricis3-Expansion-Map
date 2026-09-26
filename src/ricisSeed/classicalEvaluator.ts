import { FormNode } from './canonicalForm';

const SEED_DOUBLE_EPSILON = Number.EPSILON;

function isSeedMachineZero(value: number, tol = SEED_DOUBLE_EPSILON * 1e4): boolean {
  return Math.abs(value) <= tol;
}

const MATH_FUNCTIONS: Record<string, (x: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  exp: Math.exp,
  log: Math.log,
  sqrt: Math.sqrt,
  abs: Math.abs,
};

/**
 * Deterministic numerical equivalence checker for classical algebraic steps.
 * Assigns deterministic test values derived from symbol hashes to evaluate both sides.
 */
export function verifyClassicalEquivalence(from: FormNode, to: FormNode): boolean {
  const symbols = new Set<string>();
  collectSymbols(from, symbols);
  collectSymbols(to, symbols);

  // Perform multiple trials with deterministic pseudo-random values to avoid collisions
  for (let trial = 0; trial < 5; trial++) {
    const vars: Record<string, number> = {};
    for (const sym of symbols) {
      let hash = 0;
      for (let i = 0; i < sym.length; i++) {
        hash = (hash * 31 + sym.charCodeAt(i)) & 0xffff;
      }
      vars[sym] = 2.718 + ((hash + trial * 17) % 97) / 10 + trial * 1.618;
    }

    const valFrom = evaluateNumerical(from, vars);
    const valTo = evaluateNumerical(to, vars);

    if (valFrom === undefined || valTo === undefined) return false;
    
    // Check for machine epsilon relative match
    const diff = Math.abs(valFrom - valTo);
    const scale = Math.max(Math.abs(valFrom), Math.abs(valTo), 1.0);
    if (!isSeedMachineZero(diff / scale, SEED_DOUBLE_EPSILON * 1e4)) return false;
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
      if (node.name === 'inf_' || node.name === 'inf') return (1 / SEED_DOUBLE_EPSILON) * arg;
      if (node.name === '0_' || node.name === '0') return SEED_DOUBLE_EPSILON * arg;
      
      // Standard math functions
      const fn = MATH_FUNCTIONS[node.name];
      if (fn) return fn(arg);
      
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
