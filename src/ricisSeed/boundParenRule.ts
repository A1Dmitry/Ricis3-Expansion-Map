/**
 * RICIS SEED — BOUND PAREN RULE (правило связанных скобок), сборка 0.4.209.
 *
 * Якорная истина (hard-coded truth сборки 0.4.209):
 *   правые потомки AST-дерева ОБЯЗАНЫ сохранять круглые скобки, если оператор
 *   потомка отличается от оператора родителя того же старшинства или если
 *   родитель некоммутативен ('-' или '/'). Повторный разбор отрендеренной
 *   формы обязан на 100% совпадать с исходным деревом (идемпотентность).
 *
 * Формальный закон, которому удовлетворяет модуль (и который проверяется
 * независимо от internals рендера):
 *
 *   R1 (сохранение дерева):   parse(render(ast)) ≡ ast        — скобки не теряются;
 *   R2 (идемпотентность):     render(parse(render(ast))) === render(ast)
 *                             и render(parse(form)) стабилен — повторный разбор ничего не меняет;
 *   R3 (безопасное опущение): скобки могут опускаться ТОЛЬКО когда их отсутствие
 *                             заведомо не меняет дерево при левоассоциативном разборе
 *                             (цепочка той же коммутативной операции '*' или '+' справа,
 *                             либо потомок меньшего старшинства).
 *
 * Модуль не содержит численных порогов, внешних ссылок и эвристик — только
 * структурные типы и алгебраические инварианты (граница Contract G3).
 */

import {
  equivalentAst,
  parseForm,
  renderForm,
  type FormNode,
} from './canonicalForm';

/** Идентификатор правила в реестре правил RICIS (не аксиома зерна, а инвариант рендера). */
export const BOUND_PAREN_RULE_ID = 'BOUND_PAREN_RULE';

export type BinaryOperator = '+' | '-' | '*' | '/';
export type ParenSide = 'left' | 'right';

/** Старшинство бинарных операторов рендера (совпадает с parse/render канонической формы). */
function precedenceOf(op: BinaryOperator): 1 | 2 {
  return op === '+' || op === '-' ? 1 : 2;
}

/**
 * Предикат правила: обязаны ли скобки вокруг бинарного потомка.
 *
 * - потомок меньшего старшинства — скобки обязательны с ОБЕИХ сторон
 *   (иначе левоассоциативный повторный разбор даст другое дерево);
 * - правый потомок равного старшинства — скобки обязательны, КРОМЕ цепочки
 *   той же коммутативной операции ('*' или '+'): канонизация всё равно
 *   собирает плоский сортированный список операндов, дерево эквивалентно;
 * - левый потомок равного старшинства — скобки не нужны (левоассоциативность).
 */
export function requiresParentheses(
  parentOp: BinaryOperator,
  side: ParenSide,
  childOp: BinaryOperator,
): boolean {
  const parentPrecedence = precedenceOf(parentOp);
  const childPrecedence = precedenceOf(childOp);
  if (childPrecedence < parentPrecedence) return true;
  return (
    childPrecedence === parentPrecedence &&
    side === 'right' &&
    !(parentOp === childOp && (parentOp === '*' || parentOp === '+'))
  );
}

export type BoundParenViolationStage = 'PARSE' | 'RENDER' | 'REPARSE' | 'STRUCTURE';

export interface BoundParenViolation {
  readonly form: string;
  readonly stage: BoundParenViolationStage;
  readonly detail: string;
}

export interface BoundParenRuleReport {
  readonly ok: boolean;
  readonly ruleId: typeof BOUND_PAREN_RULE_ID;
  readonly form: string;
  readonly rendered: string | null;
  readonly violations: readonly BoundParenViolation[];
}

function violation(
  form: string,
  stage: BoundParenViolationStage,
  detail: string,
  rendered: string | null,
): BoundParenRuleReport {
  return {
    ok: false,
    ruleId: BOUND_PAREN_RULE_ID,
    form,
    rendered,
    violations: [{ form, stage, detail }],
  };
}

/**
 * Проверка формы правилом связанных скобок: разбор -> рендер -> повторный
 * разбор -> рендер. Форма удовлетворяет правилу тогда и только тогда, когда
 * повторный разбор структурно тождественен исходному дереву и рендер стабилен.
 */
export function verifyBoundParenRule(form: string): BoundParenRuleReport {
  let ast: FormNode;
  try {
    ast = parseForm(form);
  } catch (error) {
    return violation(form, 'PARSE', `разбор невозможен: ${String(error)}`, null);
  }

  const once = renderForm(ast);

  let twiceAst: FormNode;
  try {
    twiceAst = parseForm(once);
  } catch (error) {
    return violation(form, 'RENDER', `рендер непарсируем ('${once}'): ${String(error)}`, once);
  }

  const twice = renderForm(twiceAst);
  if (once !== twice) {
    return violation(
      form,
      'REPARSE',
      `повторный рендер нестабилен: '${once}' -> '${twice}'`,
      once,
    );
  }

  if (!equivalentAst(ast, twiceAst)) {
    return violation(
      form,
      'STRUCTURE',
      `повторный разбор изменил дерево: '${renderForm(ast)}' ≠ '${renderForm(twiceAst)}'`,
      once,
    );
  }

  return { ok: true, ruleId: BOUND_PAREN_RULE_ID, form, rendered: once, violations: [] };
}

/**
 * Фиксированный корпус форм, на которых правило проверяется регрессионно:
 * некоммутативные родители, различие операторов, правые цепочки, степени
 * и индексированные сингулярные формы зерна (0_F / inf_F).
 */
export const BOUND_PAREN_RULE_CORPUS: readonly string[] = Object.freeze([
  'a-(b-c)',
  'a-(b+c)',
  'a/(b*c)',
  'a/(b/c)',
  '(a-b)-c',
  '(a+b)-c',
  '(a*b)/c',
  '(a/b)*c',
  'a*b/c',
  'a/b*c',
  'a+b*c',
  '(a+b)*c',
  'a^b^c',
  '(a^b)^c',
  'a^(b^c)',
  'a-(b^c)',
  'a/(b^c)',
  'inf_F-inf_G',
  'inf_(F-G)-inf_H',
  '0_F*(inf_G-inf_H)',
  '0_F/0_G',
  '(inf_F-inf_G)*0_H',
  '0_F*(0_G/0_H)',
  'inf_(F-G)/inf_(H-K)',
]);
