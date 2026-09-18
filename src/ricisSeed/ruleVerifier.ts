import {
  type FormNode,
  type CanonicalResult,
  canonicalizeForProof,
  renderForm,
  canonicalNode,
  equivalentAst,
  parseForm,
} from './canonicalForm';
import type { ProofRule, ProofStep } from './contracts';

export interface StepVerificationResult {
  readonly valid: boolean;
  readonly reason?: string;
  readonly ruleApplied?: ProofRule;
  readonly fromAst?: FormNode;
  readonly toAst?: FormNode;
}

export interface ChainVerificationResult {
  readonly valid: boolean;
  readonly failedStepIndex?: number;
  readonly reason?: string;
  readonly stepResults: readonly StepVerificationResult[];
}

function extractIndexedZero(node: FormNode): FormNode | null {
  if (node.kind === 'call' && (node.name === '0_' || node.name === '0')) {
    return node.arg;
  }
  if (node.kind === 'id') {
    if (node.name.startsWith('0_')) {
      const index = node.name.slice(2);
      return { kind: 'id', name: index };
    }
    if (node.name === '0') {
      return { kind: 'id', name: '0' };
    }
  }
  return null;
}

function extractIndexedInf(node: FormNode): FormNode | null {
  if (node.kind === 'call' && (node.name === 'inf_' || node.name === 'inf')) {
    return node.arg;
  }
  if (node.kind === 'id') {
    if (node.name.startsWith('inf_')) {
      const index = node.name.slice(4);
      return { kind: 'id', name: index };
    }
  }
  return null;
}

/**
 * Проверяет, можно ли получить toNode из fromNode путем применения правила rule
 * к корню выражения ИЛИ к любому подвыражению (контексту).
 */
function checkRuleApplication(rule: ProofRule, from: FormNode, to: FormNode): boolean {
  // 1. Пробуем применить в корне
  if (checkRootRule(rule, from, to)) return true;

  // 2. Если корни одинаковой структуры (bin, call, pow), проверяем рекурсивно замену в поддереве
  if (from.kind === 'bin' && to.kind === 'bin' && from.op === to.op) {
    // Вариант 1: левый изменился по правилу, правый остался эквивалентным
    if (checkRuleApplication(rule, from.left, to.left) && equivalentAst(from.right, to.right)) {
      return true;
    }
    // Вариант 2: правый изменился по правилу, левый остался эквивалентным
    if (equivalentAst(from.left, to.left) && checkRuleApplication(rule, from.right, to.right)) {
      return true;
    }
  }

  if (from.kind === 'call' && to.kind === 'call' && from.name === to.name) {
    if (checkRuleApplication(rule, from.arg, to.arg)) {
      return true;
    }
  }

  if (from.kind === 'pow' && to.kind === 'pow') {
    if (checkRuleApplication(rule, from.base, to.base) && equivalentAst(from.exponent, to.exponent)) {
      return true;
    }
    if (equivalentAst(from.base, to.base) && checkRuleApplication(rule, from.exponent, to.exponent)) {
      return true;
    }
  }

  return false;
}

function checkRootRule(rule: ProofRule, fromNode: FormNode, toNode: FormNode): boolean {
  switch (rule) {
    case 'L1':
    case 'LOCAL_STRUCTURAL_REDUCTION': {
      // E - E -> 0, E / E -> 1 или каноническое тождество
      const canonFrom = canonicalNode(fromNode);
      const canonTo = canonicalNode(toNode);
      if (equivalentAst(canonFrom, canonTo)) return true;
      if (fromNode.kind === 'bin') {
        if (fromNode.op === '-' && equivalentAst(canonicalNode(fromNode.left), canonicalNode(fromNode.right))) {
          if (toNode.kind === 'id' && toNode.name === '0') return true;
          if (toNode.kind === 'id' && toNode.name === 'inf_0') return true;
        }
        if (fromNode.op === '/' && equivalentAst(canonicalNode(fromNode.left), canonicalNode(fromNode.right))) {
          if (toNode.kind === 'id' && toNode.name === '1') return true;
        }
      }
      return false;
    }

    case 'A1':
    case 'A10': {
      if (fromNode.kind === 'bin' && fromNode.op === '/') {
        const isDivByZero = (fromNode.right.kind === 'id' && fromNode.right.name === '0');
        if (isDivByZero) {
          const expectedTarget: FormNode = { kind: 'call', name: 'inf_', arg: fromNode.left };
          return equivalentAst(toNode, expectedTarget) || renderForm(toNode) === `inf_${renderForm(fromNode.left)}`;
        }
      }
      return false;
    }

    case 'A2': {
      const infZero = extractIndexedInf(fromNode);
      if (infZero && (infZero.kind === 'id' && infZero.name === '0')) {
        return (toNode.kind === 'id' && toNode.name === '1');
      }
      return false;
    }

    case 'A4': {
      if (fromNode.kind === 'bin' && fromNode.op === '/') {
        const numZero = extractIndexedZero(fromNode.left);
        const denZero = extractIndexedZero(fromNode.right);
        if (numZero && denZero) {
          const expectedTo: FormNode = { kind: 'bin', op: '/', left: numZero, right: denZero };
          return equivalentAst(canonicalNode(toNode), canonicalNode(expectedTo));
        }
      }
      return false;
    }

    case 'A5': {
      if (fromNode.kind === 'bin' && fromNode.op === '/') {
        const numInf = extractIndexedInf(fromNode.left);
        const denInf = extractIndexedInf(fromNode.right);
        if (numInf && denInf) {
          const expectedTo: FormNode = { kind: 'bin', op: '/', left: numInf, right: denInf };
          return equivalentAst(canonicalNode(toNode), canonicalNode(expectedTo));
        }
      }
      return false;
    }

    case 'A6': {
      if (fromNode.kind === 'bin' && fromNode.op === '*') {
        let fArg = extractIndexedZero(fromNode.left);
        let gArg = extractIndexedInf(fromNode.right);
        if (!fArg || !gArg) {
          fArg = extractIndexedZero(fromNode.right);
          gArg = extractIndexedInf(fromNode.left);
        }
        if (fArg && gArg) {
          const expectedTo: FormNode = { kind: 'bin', op: '*', left: fArg, right: gArg };
          return equivalentAst(canonicalNode(toNode), canonicalNode(expectedTo));
        }
      }
      return false;
    }

    case 'A7': {
      if (fromNode.kind === 'bin' && fromNode.op === '-') {
        const fInf = extractIndexedInf(fromNode.left);
        const gInf = extractIndexedInf(fromNode.right);
        if (fInf && gInf) {
          const diffArg: FormNode = { kind: 'bin', op: '-', left: fInf, right: gInf };
          const expectedTo: FormNode = { kind: 'call', name: 'inf_', arg: diffArg };
          return equivalentAst(canonicalNode(toNode), canonicalNode(expectedTo)) ||
            renderForm(toNode) === `inf_(${renderForm(diffArg)})`;
        }
      }
      return false;
    }

    case 'A8': {
      if (fromNode.kind === 'bin' && fromNode.op === '-') {
        const fZero = extractIndexedZero(fromNode.left);
        const gZero = extractIndexedZero(fromNode.right);
        if (fZero && gZero) {
          const diffArg: FormNode = { kind: 'bin', op: '-', left: fZero, right: gZero };
          const expectedTo: FormNode = { kind: 'call', name: '0_', arg: diffArg };
          return equivalentAst(canonicalNode(toNode), canonicalNode(expectedTo)) ||
            renderForm(toNode) === `0_(${renderForm(diffArg)})`;
        }
      }
      return false;
    }

    case 'A9': {
      if (fromNode.kind === 'bin' && fromNode.op === '*') {
        const isRightZero = (fromNode.right.kind === 'id' && fromNode.right.name === '0');
        const isLeftZero = (fromNode.left.kind === 'id' && fromNode.left.name === '0');
        const factor = isRightZero ? fromNode.left : (isLeftZero ? fromNode.right : null);
        if (factor) {
          const expectedTo: FormNode = { kind: 'call', name: '0_', arg: factor };
          return equivalentAst(toNode, expectedTo) || renderForm(toNode) === `0_${renderForm(factor)}`;
        }
      }
      return false;
    }

    case 'A14': {
      // A14 (расширение R3, поколение U-INF-SELF-DIFF): inf_F - inf_F = 0 —
      // ТОЖДЕСТВО (SP2 first: тождество применяется до сингулярных расширений),
      // а не сингулярная ветка A7. Требования:
      //   1) оба операнда — индексированные бесконечности inf_F и inf_G;
      //   2) индексы структурно ИДЕНТИЧНЫ (F ≡ G, иначе территория A7);
      //   3) результат — ровно '0' (не '1' исторической ветки A17 и не inf_0).
      if (fromNode.kind === 'bin' && fromNode.op === '-') {
        const leftIndex = extractIndexedInf(fromNode.left);
        const rightIndex = extractIndexedInf(fromNode.right);
        if (leftIndex && rightIndex && equivalentAst(leftIndex, rightIndex)) {
          return toNode.kind === 'id' && toNode.name === '0';
        }
      }
      return false;
    }

    case 'CLASSICAL':
    case 'LEAN_KERNEL':
      return true;

    default:
      return true;
  }
}

/**
 * Проверяет допустимость семантического преобразования from -> to под действием правила rule.
 */
export function verifyProofStep(step: ProofStep): StepVerificationResult {
  const fromRes = canonicalizeForProof(step.from);
  if (fromRes.kind === 'ERR') {
    return {
      valid: false,
      reason: `Синтаксическая ошибка во входной форме '${step.from}': ${fromRes.error}`,
      ruleApplied: step.rule,
    };
  }

  const toRes = canonicalizeForProof(step.to);
  if (toRes.kind === 'ERR') {
    return {
      valid: false,
      reason: `Синтаксическая ошибка в выходной форме '${step.to}': ${toRes.error}`,
      ruleApplied: step.rule,
    };
  }

  const fromNode = fromRes.ast;
  const toNode = toRes.ast;

  if (equivalentAst(fromNode, toNode)) {
    return {
      valid: true,
      ruleApplied: step.rule,
      fromAst: fromNode,
      toAst: toNode,
    };
  }

  // Сначала проверяем применение правила на исходном нескладом/сыром AST (без L1 свертки E-E -> 0).
  // Это критично для правил типа A7 (inf_G - inf_G -> inf_(G-G)), чтобы они могли видеть структуру минуса,
  // а не готовую свертку '0'.
  try {
    const rawFrom = parseForm(step.from);
    const rawTo = parseForm(step.to);
    if (checkRuleApplication(step.rule, rawFrom, rawTo)) {
      return {
        valid: true,
        ruleApplied: step.rule,
        fromAst: fromNode,
        toAst: toNode,
      };
    }
  } catch {
    // игнорируем сырые ошибки и пробуем каноничные
  }

  const isApplied = checkRuleApplication(step.rule, fromNode, toNode);
  if (isApplied) {
    return {
      valid: true,
      ruleApplied: step.rule,
      fromAst: fromNode,
      toAst: toNode,
    };
  }

  return {
    valid: false,
    reason: `Правило ${step.rule} неприменимо для перехода: '${renderForm(fromNode)}' -> '${renderForm(toNode)}'`,
    ruleApplied: step.rule,
  };
}

/**
 * Проверяет полную цепочку шагов доказательства (ProofCertificate steps).
 */
export function verifyProofChain(steps: readonly ProofStep[]): ChainVerificationResult {
  if (steps.length === 0) {
    return {
      valid: false,
      reason: 'Цепочка доказательства пуста',
      stepResults: [],
    };
  }

  const stepResults: StepVerificationResult[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    const stepRes = verifyProofStep(step);
    stepResults.push(stepRes);

    if (!stepRes.valid) {
      return {
        valid: false,
        failedStepIndex: i,
        reason: `Ошибка на шаге ${i + 1} (${step.rule}): ${stepRes.reason}`,
        stepResults,
      };
    }

    if (i > 0) {
      const prevStepRes = stepResults[i - 1]!;
      if (prevStepRes.toAst && stepRes.fromAst) {
        if (!equivalentAst(canonicalNode(prevStepRes.toAst), canonicalNode(stepRes.fromAst))) {
          return {
            valid: false,
            failedStepIndex: i,
            reason: `Разрыв цепочки между шагами ${i} и ${i + 1}: результат '${renderForm(prevStepRes.toAst)}' не эквивалентен входу '${renderForm(stepRes.fromAst)}'`,
            stepResults,
          };
        }
      }
    }
  }

  return {
    valid: true,
    stepResults,
  };
}
