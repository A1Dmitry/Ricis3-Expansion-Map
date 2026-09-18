/**
 * RICIS SEED — верификатор шагов доказательства (RuleVerifier).
 *
 * Граница доверия (No Self-Certification):
 *  - верификатор проверяет СЕМАНТИКУ перехода `from -> to` под меткой правила;
 *  - принадлежность правила поколению R(n) проверяют ворота `RULE_SET_CLOSED`
 *    в `ricisSeed.domain.ts` — это два разных вопроса, и они не подменяют друг друга;
 *  - успешная проверка здесь — это уровень `STRUCTURALLY_VALIDATED`, а НЕ
 *    `FORMALLY_VERIFIED` (для него нужен внешний kernel run: toolchain + compiler
 *    output + `#print axioms` + отсутствие `sorryAx`).
 *
 * Fail-safe правило (класс андона A-0013):
 *  метка правила БЕЗ структурного верификатора не может обосновать переход.
 *  Прежняя реализация завершала разбор `default: return true`, из-за чего любой
 *  переход проходил под меткой протокола (SP1/SP2/SP4/SP5), закона (L0, L1C1–L1C3),
 *  запрета (P1), мета-аксиомы (A11), снятой аксиомы (A3) или непроверенного
 *  производного правила (A12+). Фактически это допускало в ядро математически
 *  ложную аксиому: кандидат `0_F*(inf_G-inf_H) = F*(G+H)` с единственным шагом
 *  под меткой `SP2` проходил ворота `SEMANTIC_RULE_VERIFIED` и коммитился в R(n+1).
 *  Теперь неизвестная/нереализованная метка — явный отказ с типизированной причиной.
 */

import {
  type FormNode,
  canonicalizeForProof,
  renderForm,
  canonicalNode,
  equivalentAst,
  parseForm,
  indexSymbolsOf,
  substituteAllSymbols,
} from './canonicalForm';
import { DEPRECATED_AXIOM_IDS, type ProofRule, type ProofStep, type RicisAxiom } from './contracts';

export interface StepVerificationResult {
  readonly valid: boolean;
  readonly reason?: string;
  readonly ruleApplied?: ProofRule;
  readonly fromAst?: FormNode;
  readonly toAst?: FormNode;
  /** Типизированная причина отказа ( machine-readable, для стражей и разбора отказов). */
  readonly failure?: RuleVerificationFailure;
  /**
   * `true`, когда шаг принят НЕ структурной проверкой RICIS, а явно внешним слоем
   * (классическая алгебра / ядро Lean). Такой шаг не повышает доверие до
   * `STRUCTURALLY_VALIDATED` по правилам RICIS: его основание живёт вне верификатора.
   */
  readonly external?: boolean;
}

export interface ChainVerificationResult {
  readonly valid: boolean;
  readonly failedStepIndex?: number;
  readonly reason?: string;
  readonly stepResults: readonly StepVerificationResult[];
}

/**
 * Классы меток правил. Категория отвечает на вопрос «может ли эта метка в принципе
 * обосновать переход `from -> to`», до проверки конкретного перехода.
 */
export type RuleCategory =
  /** Реализованный структурный верификатор (законы/аксиомы singularity-слоя). */
  | 'STRUCTURAL_AXIOM'
  /** Протокол, который сам является законом переписывания (SP3: 0_F/0_G = F/G). */
  | 'PROTOCOL_REWRITE'
  /** Протокол/закон/запрет/мета-аксиома: порядок применения, а не преобразование формы. */
  | 'NON_REWRITE'
  /** Снятая аксиома: историческая запись, не входит в активное зерно R0. */
  | 'DEPRECATED'
  /** Производное правило расширения (A12+): проверяется по реестру R(n). */
  | 'EXPANSION'
  /** Явно внешний слой: классическая алгебра или ядро Lean. */
  | 'EXTERNAL'
  /** Метка не распознана: fail-safe отказ. */
  | 'UNRECOGNIZED';

/** Типизированные причины отказа верификатора. */
export type RuleVerificationFailure =
  | 'RULE_CATEGORY_NOT_A_REWRITE'
  | 'RULE_DEPRECATED'
  | 'RULE_NOT_IN_REGISTRY'
  | 'RULE_SCHEMA_MISMATCH'
  | 'RULE_VERIFIER_NOT_IMPLEMENTED'
  | 'RULE_PATTERN_MISMATCH';

/**
 * Метки, которые НЕ являются правилами переписывания: они задают порядок применения,
 * границы типов и запреты. Шаг доказательства под такой меткой — категориальная ошибка:
 * «обосновать переход» ими нельзя (в том числе `x -> x+1` под меткой запрета P1).
 */
export const NON_REWRITE_RULE_IDS: readonly ProofRule[] = Object.freeze([
  'L0',
  'L1C1',
  'L1C2',
  'L1C3',
  'SP1',
  'SP2',
  'SP4',
  'SP5',
  'P1',
  'A11',
]);

/** Метки с реализованным структурным верификатором. */
export const STRUCTURAL_RULE_IDS: readonly ProofRule[] = Object.freeze([
  'L1',
  'LOCAL_STRUCTURAL_REDUCTION',
  'A1',
  'A2',
  'A4',
  'A5',
  'A6',
  'A7',
  'A8',
  'A9',
  'A10',
  'A14',
]);

/** Протоколы, которые сами являются законом переписывания. */
export const PROTOCOL_REWRITE_RULE_IDS: readonly ProofRule[] = Object.freeze(['SP3']);

/** Явно внешние слои (не структурная проверка RICIS). */
export const EXTERNAL_RULE_IDS: readonly ProofRule[] = Object.freeze(['CLASSICAL', 'LEAN_KERNEL']);

/** Схема производного правила: то, что правило реально утверждает (из таблицы следствий R(n)). */
export interface ExpansionRuleSchema {
  readonly id: string;
  readonly from: string;
  readonly to: string;
}

/** Контекст верификации: реестр производных правил текущего поколения. */
export interface RuleVerificationContext {
  readonly expansionRules?: readonly ExpansionRuleSchema[];
}

/**
 * Схемы производных правил поколения: каждое выращенное правило утверждает ровно свои
 * следствия (inputForm -> outputForm). Это единственный честный источник семантики A12+:
 * верификатор не «угадывает» производное правило, а сверяет шаг с зарегистрированной схемой.
 */
export function expansionRuleSchemasOf(axioms: readonly RicisAxiom[]): readonly ExpansionRuleSchema[] {
  const schemas: ExpansionRuleSchema[] = [];
  for (const axiom of axioms) {
    if (axiom.origin !== 'EXPANSION') continue;
    for (const consequence of axiom.consequences) {
      schemas.push({ id: axiom.id, from: consequence.inputForm, to: consequence.outputForm });
    }
  }
  return Object.freeze(schemas);
}

/** Категория метки правила (до проверки конкретного перехода). */
export function classifyRule(rule: ProofRule): RuleCategory {
  if (EXTERNAL_RULE_IDS.includes(rule)) return 'EXTERNAL';
  if (DEPRECATED_AXIOM_IDS.includes(rule)) return 'DEPRECATED';
  if (STRUCTURAL_RULE_IDS.includes(rule)) return 'STRUCTURAL_AXIOM';
  if (PROTOCOL_REWRITE_RULE_IDS.includes(rule)) return 'PROTOCOL_REWRITE';
  if (NON_REWRITE_RULE_IDS.includes(rule)) return 'NON_REWRITE';
  if (/^A\d+$/.test(rule) && Number(rule.slice(1)) >= 12) return 'EXPANSION';
  return 'UNRECOGNIZED';
}

const CATEGORY_LABEL: Readonly<Record<RuleCategory, string>> = Object.freeze({
  STRUCTURAL_AXIOM: 'структурная аксиома RICIS',
  PROTOCOL_REWRITE: 'протокол-преобразование',
  NON_REWRITE: 'протокол/закон/запрет порядка применения',
  DEPRECATED: 'снятая аксиома',
  EXPANSION: 'производное правило расширения',
  EXTERNAL: 'внешний слой',
  UNRECOGNIZED: 'нераспознанная метка',
});

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
 * Сопоставление схемы правила с фактическим переходом.
 *
 * Индексные символы схемы (F, G, H, K …) — переменные: они связываются один раз и
 * согласованно во всём переходе, поэтому схема A12
 * `(0_F/0_G)/(0_H/0_K) -> (F*K)/(G*H)` применяма к `(0_X/0_Y)/(0_Z/0_W)`,
 * но не к форме с другим расположением индексов.
 */
/**
 * Сопоставление имён-идентификаторов. Имя может ЦЕЛИКОМ быть переменной (`F`)
 * либо содержать индексный символ внутри (`0_F`, `inf_G`): во втором случае имя
 * разбирается как шаблон «литералы + переменные», поэтому схема `0_F/0_G`
 * сопоставляется с `0_X/0_Y` и связывает F -> X, G -> Y.
 */
function matchIdName(
  patternName: string,
  targetName: string,
  variables: ReadonlySet<string>,
  bindings: Map<string, FormNode>,
): boolean {
  if (variables.has(patternName)) {
    const bound = bindings.get(patternName);
    const target: FormNode = { kind: 'id', name: targetName };
    if (bound) return equivalentAst(bound, target);
    bindings.set(patternName, target);
    return true;
  }

  const embedded = indexSymbolsOf(patternName).filter(symbol => variables.has(symbol));
  if (embedded.length === 0) return patternName === targetName;

  let expression = '^';
  let cursor = 0;
  for (const symbol of embedded) {
    const position = patternName.indexOf(symbol, cursor);
    if (position < 0) return false;
    expression += patternName.slice(cursor, position).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    expression += '([A-Za-z0-9_]+)';
    cursor = position + symbol.length;
  }
  expression += `${patternName.slice(cursor).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`;

  const match = new RegExp(expression, 'u').exec(targetName);
  if (!match) return false;

  for (const [offset, symbol] of embedded.entries()) {
    const captured = match[offset + 1];
    if (captured === undefined) return false;
    const bound = bindings.get(symbol);
    const target: FormNode = { kind: 'id', name: captured };
    if (bound) {
      if (!equivalentAst(bound, target)) return false;
    } else {
      bindings.set(symbol, target);
    }
  }
  return true;
}

function matchSchemaPattern(
  pattern: FormNode,
  target: FormNode,
  variables: ReadonlySet<string>,
  bindings: Map<string, FormNode>,
): boolean {
  if (pattern.kind === 'id' && variables.has(pattern.name)) {
    const bound = bindings.get(pattern.name);
    if (bound) return equivalentAst(bound, target);
    bindings.set(pattern.name, target);
    return true;
  }
  if (pattern.kind !== target.kind) return false;
  if (pattern.kind === 'id' && target.kind === 'id') {
    return matchIdName(pattern.name, target.name, variables, bindings);
  }
  if (pattern.kind === 'call' && target.kind === 'call') {
    return pattern.name === target.name && matchSchemaPattern(pattern.arg, target.arg, variables, bindings);
  }
  if (pattern.kind === 'pow' && target.kind === 'pow') {
    return (
      matchSchemaPattern(pattern.base, target.base, variables, bindings) &&
      matchSchemaPattern(pattern.exponent, target.exponent, variables, bindings)
    );
  }
  if (pattern.kind === 'bin' && target.kind === 'bin') {
    return (
      pattern.op === target.op &&
      matchSchemaPattern(pattern.left, target.left, variables, bindings) &&
      matchSchemaPattern(pattern.right, target.right, variables, bindings)
    );
  }
  return false;
}

function instantiate(node: FormNode, bindings: ReadonlyMap<string, FormNode>): FormNode {
  if (node.kind === 'id') {
    const direct = bindings.get(node.name);
    if (direct) return direct;
    // Индексный символ может жить внутри имени (0_F, inf_G): подстановка выполняется
    // только для связанных имён-идентификаторов. Связка на сложное выражение внутрь
    // имени не подставляется — такая форма не является корректным идентификатором,
    // и шаг честно не пройдёт проверку вместо «приблизительного» совпадения.
    const embedded = indexSymbolsOf(node.name).filter(symbol => bindings.has(symbol));
    if (embedded.length === 0) return node;
    const substitution: Record<string, string> = {};
    for (const symbol of embedded) {
      const bound = bindings.get(symbol);
      if (!bound || bound.kind !== 'id') return node;
      substitution[symbol] = bound.name;
    }
    return { kind: 'id', name: substituteAllSymbols(node.name, substitution) };
  }
  if (node.kind === 'call') {
    return { kind: 'call', name: node.name, arg: instantiate(node.arg, bindings) };
  }
  if (node.kind === 'pow') {
    return {
      kind: 'pow',
      base: instantiate(node.base, bindings),
      exponent: instantiate(node.exponent, bindings),
    };
  }
  return {
    kind: 'bin',
    op: node.op,
    left: instantiate(node.left, bindings),
    right: instantiate(node.right, bindings),
  };
}

interface ExpansionMatch {
  readonly kind: 'MATCH' | 'NOT_IN_REGISTRY' | 'SCHEMA_MISMATCH';
}

/** Проверка шага под производное правило расширения по реестру поколения. */
function matchExpansionRule(
  rule: ProofRule,
  fromNode: FormNode,
  toNode: FormNode,
  context: RuleVerificationContext | undefined,
): ExpansionMatch {
  const schemas = (context?.expansionRules ?? []).filter(schema => schema.id === rule);
  if (schemas.length === 0) return { kind: 'NOT_IN_REGISTRY' };
  for (const schema of schemas) {
    let patternFrom: FormNode;
    let patternTo: FormNode;
    try {
      patternFrom = parseForm(schema.from);
      patternTo = parseForm(schema.to);
    } catch {
      continue; // нечитаемая схема не может обосновать переход
    }
    const variables = new Set<string>([...indexSymbolsOf(schema.from), ...indexSymbolsOf(schema.to)]);
    const bindings = new Map<string, FormNode>();
    if (!matchSchemaPattern(patternFrom, fromNode, variables, bindings)) continue;
    const expected = instantiate(patternTo, bindings);
    if (equivalentAst(canonicalNode(expected), canonicalNode(toNode))) {
      return { kind: 'MATCH' };
    }
  }
  return { kind: 'SCHEMA_MISMATCH' };
}

/**
 * Проверяет, можно ли получить toNode из fromNode путем применения правила rule
 * к корню выражения ИЛИ к любому подвыражению (контексту).
 */
function checkRuleApplication(
  rule: ProofRule,
  from: FormNode,
  to: FormNode,
  context: RuleVerificationContext | undefined,
): boolean {
  // 1. Пробуем применить в корне
  if (checkRootRule(rule, from, to, context)) return true;

  // 2. Если корни одинаковой структуры (bin, call, pow), проверяем рекурсивно замену в поддереве
  if (from.kind === 'bin' && to.kind === 'bin' && from.op === to.op) {
    // Вариант 1: левый изменился по правилу, правый остался эквивалентным
    if (checkRuleApplication(rule, from.left, to.left, context) && equivalentAst(from.right, to.right)) {
      return true;
    }
    // Вариант 2: правый изменился по правилу, левый остался эквивалентным
    if (equivalentAst(from.left, to.left) && checkRuleApplication(rule, from.right, to.right, context)) {
      return true;
    }
  }

  if (from.kind === 'call' && to.kind === 'call' && from.name === to.name) {
    if (checkRuleApplication(rule, from.arg, to.arg, context)) {
      return true;
    }
  }

  if (from.kind === 'pow' && to.kind === 'pow') {
    if (checkRuleApplication(rule, from.base, to.base, context) && equivalentAst(from.exponent, to.exponent)) {
      return true;
    }
    if (equivalentAst(from.base, to.base) && checkRuleApplication(rule, from.exponent, to.exponent, context)) {
      return true;
    }
  }

  return false;
}

function checkRootRule(
  rule: ProofRule,
  fromNode: FormNode,
  toNode: FormNode,
  context: RuleVerificationContext | undefined,
): boolean {
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

    case 'A4':
    case 'SP3': {
      // A4 и SP3 — один и тот же закон индексов (Weight of Zero) на разных слоях:
      // 0_F / 0_G = F / G. SP3 заявлен как протокол, но утверждает преобразование формы,
      // поэтому он обязан проверяться структурно, а не «по умолчанию».
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

    // Явно внешние слои: классическая алгебра и ядро Lean. Это НЕ структурная
    // проверка RICIS — основание шага живёт вне верификатора (для LEAN_KERNEL
    // ворота NO_FORBIDDEN_SEMANTICS требуют фактический kernel run).
    case 'CLASSICAL':
    case 'LEAN_KERNEL':
      return true;

    default: {
      // Fail-safe (A-0013): метка без структурного верификатора переход не обосновает.
      // Производные правила расширения проверяются по реестру R(n), всё остальное — отказ.
      if (classifyRule(rule) === 'EXPANSION') {
        return matchExpansionRule(rule, fromNode, toNode, context).kind === 'MATCH';
      }
      return false;
    }
  }
}

/** Причина отказа и человекочитаемая формулировка для шага, который не прошёл проверку. */
function describeFailure(
  rule: ProofRule,
  fromNode: FormNode,
  toNode: FormNode,
  context: RuleVerificationContext | undefined,
): { readonly failure: RuleVerificationFailure; readonly reason: string } {
  const transition = `'${renderForm(fromNode)}' -> '${renderForm(toNode)}'`;
  const category = classifyRule(rule);
  switch (category) {
    case 'NON_REWRITE':
      return {
        failure: 'RULE_CATEGORY_NOT_A_REWRITE',
        reason:
          `Правило ${rule} — ${CATEGORY_LABEL.NON_REWRITE}, а не правило переписывания: ` +
          `оно задаёт порядок применения/границу, поэтому не может обосновать переход ${transition}`,
      };
    case 'DEPRECATED':
      return {
        failure: 'RULE_DEPRECATED',
        reason:
          `Правило ${rule} снято (v7.7/v7.9) и не входит в активное зерно R0: ` +
          `переход ${transition} не может быть им обоснован`,
      };
    case 'EXPANSION': {
      const match = matchExpansionRule(rule, fromNode, toNode, context);
      if (match.kind === 'NOT_IN_REGISTRY') {
        return {
          failure: 'RULE_NOT_IN_REGISTRY',
          reason:
            `Правило ${rule} — ${CATEGORY_LABEL.EXPANSION}: верификатору не предоставлен реестр R(n), ` +
            `поэтому переход ${transition} не проверяем (fail-safe отказ, а не пропуск по умолчанию)`,
        };
      }
      return {
        failure: 'RULE_SCHEMA_MISMATCH',
        reason:
          `Правило ${rule} неприменимо для перехода: ${transition} ` +
          '(переход не соответствует зарегистрированной схеме производного правила)',
      };
    }
    case 'UNRECOGNIZED':
      return {
        failure: 'RULE_VERIFIER_NOT_IMPLEMENTED',
        reason:
          `Правило ${rule} не распознано верификатором (${CATEGORY_LABEL.UNRECOGNIZED}): ` +
          `структурного верификатора нет, поэтому переход ${transition} отклонён (fail-safe)`,
      };
    default:
      return {
        failure: 'RULE_PATTERN_MISMATCH',
        reason: `Правило ${rule} неприменимо для перехода: ${transition}`,
      };
  }
}

/**
 * Проверяет допустимость семантического преобразования from -> to под действием правила rule.
 *
 * `context.expansionRules` — реестр производных правил поколения R(n)
 * (см. `expansionRuleSchemasOf`). Без него шаги под метками A12+ отклоняются:
 * отсутствие реестра — это отсутствие основания, а не разрешение.
 */
export function verifyProofStep(
  step: ProofStep,
  context?: RuleVerificationContext,
): StepVerificationResult {
  const fromRes = canonicalizeForProof(step.from);
  if (fromRes.kind === 'ERR') {
    return {
      valid: false,
      reason: `Синтаксическая ошибка во входной форме '${step.from}': ${fromRes.error}`,
      ruleApplied: step.rule,
      failure: 'RULE_PATTERN_MISMATCH',
    };
  }

  const toRes = canonicalizeForProof(step.to);
  if (toRes.kind === 'ERR') {
    return {
      valid: false,
      reason: `Синтаксическая ошибка в выходной форме '${step.to}': ${toRes.error}`,
      ruleApplied: step.rule,
      failure: 'RULE_PATTERN_MISMATCH',
    };
  }

  const fromNode = fromRes.ast;
  const toNode = toRes.ast;
  const external = classifyRule(step.rule) === 'EXTERNAL';

  if (equivalentAst(fromNode, toNode)) {
    return {
      valid: true,
      ruleApplied: step.rule,
      fromAst: fromNode,
      toAst: toNode,
      external,
    };
  }

  // Сначала проверяем применение правила на исходном нескладом/сыром AST (без L1 свертки E-E -> 0).
  // Это критично для правил типа A7 (inf_G - inf_G -> inf_(G-G)), чтобы они могли видеть структуру минуса,
  // а не готовую свертку '0'.
  try {
    const rawFrom = parseForm(step.from);
    const rawTo = parseForm(step.to);
    if (checkRuleApplication(step.rule, rawFrom, rawTo, context)) {
      return {
        valid: true,
        ruleApplied: step.rule,
        fromAst: fromNode,
        toAst: toNode,
        external,
      };
    }
  } catch {
    // игнорируем сырые ошибки и пробуем каноничные
  }

  const isApplied = checkRuleApplication(step.rule, fromNode, toNode, context);
  if (isApplied) {
    return {
      valid: true,
      ruleApplied: step.rule,
      fromAst: fromNode,
      toAst: toNode,
      external,
    };
  }

  const failure = describeFailure(step.rule, fromNode, toNode, context);
  return {
    valid: false,
    reason: failure.reason,
    ruleApplied: step.rule,
    failure: failure.failure,
  };
}

/**
 * Проверяет полную цепочку шагов доказательства (ProofCertificate steps).
 */
export function verifyProofChain(
  steps: readonly ProofStep[],
  context?: RuleVerificationContext,
): ChainVerificationResult {
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
    const stepRes = verifyProofStep(step, context);
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
