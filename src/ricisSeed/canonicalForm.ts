/**
 * Каноническая форма выражений RICIS для проверки ТОЖДЕСТВА (L1).
 *
 * Зачем это нужно: таблица следствий сравнивает формы как строки, поэтому
 * `inf_F-inf_F` и `inf_F-inf_G` для неё — разные ключи. Но по L1 (X = X)
 * выражение вида `E - E` обязано дать `0`, а `E / E` — `1`, ДО применения
 * аксиом сингулярностей (SP2: сначала чистка и тождество, потом A4/A5/A7).
 *
 * Модуль делает ровно три вещи и ничего сверх:
 *   1. разбирает каноническую форму в дерево (операторы + - * / , скобки, вызовы вида inf_(...));
 *   2. сворачивает тождества: E - E -> 0, E / E -> 1;
 *   3. упорядочивает операнды коммутативных цепочек (* и +), чтобы `F*G` и `G*F` были одной формой.
 *
 * Нормализация записи (принцип «глазами одно и то же — в коде одно и то же»):
 *   - невидимые символы (zero-width, bidi-override, BOM) отбрасываются ДО разбора;
 *   - любые юникодные пробельные символы (\\s, включая \\n, \\r, NBSP) игнорируются токенайзером;
 *   - сортировка коммутируемых цепочек — по КОДПОЙНТАМ (localeCompare зависит от локали/ICU
 *     рантайма и нарушает требование №1 fingerprint.ts: одинаковость в Node, в браузере и между запусками);
 *   - рендер восстанавливает скобки там, где их отсутствие меняет дерево при повторном разборе.
 *
 * Никакой арифметики чисел, никаких пределов, никаких приближений: только структура.
 */

export type FormNode =
  | { readonly kind: 'id'; readonly name: string }
  | { readonly kind: 'call'; readonly name: string; readonly arg: FormNode }
  | { readonly kind: 'pow'; readonly base: FormNode; readonly exponent: FormNode }
  | { readonly kind: 'bin'; readonly op: '+' | '-' | '*' | '/'; readonly left: FormNode; readonly right: FormNode };

type Node = FormNode;

const OPERATORS = new Set(['+', '-', '*', '/', '^']);

/**
 * Невидимые символы: soft hyphen, zero-width (U+200B–U+200F), bidi-override (U+202A–U+202E),
 * invisible operators/разделители (U+2060–U+2064, U+2066–U+2069), BOM (U+FEFF).
 * Отбрасываются ДО разбора: то, чего глаз не видит, не должно создавать «другую» форму.
 * Явный blacklist — видимые символы не трогаются, «нечитаемое» не выбрасывается молча:
 * синтаксически некорректная запись по-прежнему даёт явную ошибку разбора (P2).
 */
const INVISIBLE_CHARS = /[\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/g;

/** Удаление невидимых символов (см. INVISIBLE_CHARS). */
export function stripInvisible(form: string): string {
  return form.replace(INVISIBLE_CHARS, '');
}

/** Пробельный символ (юникодный класс \s: пробел, таб, \\n, \\r, NBSP и др.). */
const WS_CHAR = /\s/;

/**
 * Детерминированное сравнение строк по кодпоинтам.
 * `localeCompare` зависит от локали/ICU рантайма (например, порядок 'a' vs 'B'
 * различен между окружениями) и потому непригоден для канонической формы.
 */
function compareCodepoints(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function tokenize(form: string): string[] {
  const source = stripInvisible(form);
  const tokens: string[] = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index]!;
    if (WS_CHAR.test(char)) {
      index += 1;
      continue;
    }
    if (char === '(' || char === ')' || OPERATORS.has(char)) {
      tokens.push(char);
      index += 1;
      continue;
    }
    let end = index;
    while (end < source.length) {
      const next = source[end]!;
      if (next === '(' || next === ')' || OPERATORS.has(next) || WS_CHAR.test(next)) break;
      end += 1;
    }
    tokens.push(source.slice(index, end));
    index = end;
  }
  return tokens;
}

function parse(tokens: readonly string[]): Node {
  let position = 0;

  const peek = (): string | undefined => tokens[position];

  const parseFactor = (): Node => {
    const token = peek();
    if (token === undefined) throw new Error('unexpected end of form');
    if (token === '(') {
      position += 1;
      const inner = parseExpression();
      if (peek() !== ')') throw new Error('missing closing parenthesis');
      position += 1;
      return inner;
    }
    if (token === ')' || OPERATORS.has(token)) throw new Error(`unexpected token: ${token}`);
    position += 1;
    if (peek() === '(') {
      // Вызов вида inf_(F-G) или 0_(F-G): имя индексированного объекта с аргументом.
      position += 1;
      const arg = parseExpression();
      if (peek() !== ')') throw new Error('missing closing parenthesis in call');
      position += 1;
      return { kind: 'call', name: token, arg };
    }
    return { kind: 'id', name: token };
  };

  const parsePower = (): Node => {
    const left = parseFactor();
    if (peek() === '^') {
      position += 1;
      const right = parsePower();
      return { kind: 'pow', base: left, exponent: right };
    }
    return left;
  };

  const parseTerm = (): Node => {
    let left = parsePower();
    while (peek() === '*' || peek() === '/') {
      const op = tokens[position] as '*' | '/';
      position += 1;
      const right = parsePower();
      left = { kind: 'bin', op, left, right };
    }
    return left;
  };

  function parseExpression(): Node {
    let left = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = tokens[position] as '+' | '-';
      position += 1;
      const right = parseTerm();
      left = { kind: 'bin', op, left, right };
    }
    return left;
  }

  const root = parseExpression();
  if (position !== tokens.length) throw new Error(`unparsed tail: ${tokens.slice(position).join(' ')}`);
  return root;
}

function precedence(op: '+' | '-' | '*' | '/' | '^'): number {
  switch (op) {
    case '^':
      return 3;
    case '*':
    case '/':
      return 2;
    case '+':
    case '-':
      return 1;
    default:
      return 0;
  }
}

function render(node: Node): string {
  switch (node.kind) {
    case 'id':
      return node.name;
    case 'call':
      return `${node.name}(${render(node.arg)})`;
    case 'pow': {
      const baseText = render(node.base);
      const expText = render(node.exponent);
      const baseNeedsParens = node.base.kind === 'bin' || node.base.kind === 'pow';
      const expNeedsParens = node.exponent.kind === 'bin';
      const safeBase = baseNeedsParens ? `(${baseText})` : baseText;
      const safeExp = expNeedsParens ? `(${expText})` : expText;
      return `${safeBase}^${safeExp}`;
    }
    case 'bin': {
      const own = precedence(node.op);
      const renderChild = (child: Node, side: 'left' | 'right'): string => {
        const text = render(child);
        if (child.kind !== 'bin') return text;
        const childPrecedence = precedence(child.op);
        // Скобки обязательны, если их отсутствие меняет дерево при повторном разборе
        // (left-associative разбор): правый операнд равного старшинства требует скобок,
        // КРОМЕ случая «та же коммутативная операция» (* или +) — цепочка всё равно
        // канонизируется в один и тот же отсортированный список операндов.
        const needsParens =
          childPrecedence < own ||
          (childPrecedence === own &&
            side === 'right' &&
            !(node.op === child.op && (node.op === '*' || node.op === '+')));
        return needsParens ? `(${text})` : text;
      };
      return `${renderChild(node.left, 'left')}${node.op}${renderChild(node.right, 'right')}`;
    }
    default:
      return '';
  }
}

/** Коммутативная цепочка: собирает операнды одного уровня для `*` или `+`. */
function flatten(node: Node, op: '*' | '+'): Node[] {
  if (node.kind === 'bin' && node.op === op) {
    return [...flatten(node.left, op), ...flatten(node.right, op)];
  }
  return [node];
}

/**
 * Канонизация узла. `foldIdentities = false` отключает свёртку E - E -> 0 / E / E -> 1:
 * это нужно для КЛЮЧЕЙ сопоставления (normalizeMatchKey), где `0_F/0_F` обязан оставаться
 * шаблоном, а не превращаться в `1` (иначе пре-солвер не сможет опознать задачу тождества).
 */
function canonicalNode(node: Node, foldIdentities = true): Node {
  if (node.kind === 'id') return node;
  if (node.kind === 'call') {
    return { kind: 'call', name: node.name, arg: canonicalNode(node.arg, foldIdentities) };
  }
  if (node.kind === 'pow') {
    return {
      kind: 'pow',
      base: canonicalNode(node.base, foldIdentities),
      exponent: canonicalNode(node.exponent, foldIdentities),
    };
  }

  const left = canonicalNode(node.left, foldIdentities);
  const right = canonicalNode(node.right, foldIdentities);

  // ТОЖДЕСТВО (L1): E - E = 0 и E / E = 1 применяется до аксиом сингулярностей.
  if (foldIdentities && (node.op === '-' || node.op === '/') && render(left) === render(right)) {
    return { kind: 'id', name: node.op === '-' ? '0' : '1' };
  }

  if (node.op === '*' || node.op === '+') {
    const operands = [...flatten(left, node.op), ...flatten(right, node.op)]
      .map(operand => canonicalNode(operand, foldIdentities))
      .sort((a, b) => compareCodepoints(render(a), render(b)));
    const chained = operands.reduce<Node | null>((accumulator, operand) => {
      if (!accumulator) return operand;
      return { kind: 'bin', op: node.op, left: accumulator, right: operand };
    }, null);
    if (chained) return chained;
  }

  return { kind: 'bin', op: node.op, left, right };
}

/** Результат канонизации для строгой верификации доказательств (P2). */
export type CanonicalResult =
  | { readonly kind: 'OK'; readonly form: string; readonly ast: FormNode }
  | { readonly kind: 'ERR'; readonly error: string };

/**
 * Строгая канонизация для proof-path: не маскирует синтаксические ошибки,
 * возвращая либо валидный AST и строковую форму, либо явную ошибку (P2).
 */
export function canonicalizeForProof(form: string): CanonicalResult {
  try {
    const parsed = parse(tokenize(form));
    const canon = canonicalNode(parsed);
    return { kind: 'OK', form: render(canon), ast: canon };
  } catch (error) {
    return { kind: 'ERR', error: String(error) };
  }
}

/** Рендеринг AST обратно в строковую форму. */
export function renderForm(node: FormNode): string {
  return render(node);
}

/** Экспорт внутренней функции канонизации узлов */
export { canonicalNode };

/** Структурная эквивалентность двух AST узлов. */
export function equivalentAst(a: FormNode, b: FormNode): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'id' && b.kind === 'id') return a.name === b.name;
  if (a.kind === 'call' && b.kind === 'call') {
    return a.name === b.name && equivalentAst(a.arg, b.arg);
  }
  if (a.kind === 'pow' && b.kind === 'pow') {
    return equivalentAst(a.base, b.base) && equivalentAst(a.exponent, b.exponent);
  }
  if (a.kind === 'bin' && b.kind === 'bin') {
    return a.op === b.op && equivalentAst(a.left, b.left) && equivalentAst(a.right, b.right);
  }
  return false;
}

/** Разбор строки формы в AST-дерево. Бросает ошибку при некорректном синтаксисе. */
export function parseForm(form: string): FormNode {
  return parse(tokenize(form));
}

/**
 * Каноническая строка формы. Если разбор невозможен (например, степень `^`
 * пока не поддерживается), возвращается исходная строка без изменений:
 * неподдерживаемый синтаксис не должен маскироваться «успешной» нормализацией.
 */
export function canonicalizeForm(form: string): string {
  try {
    const parsed = parse(tokenize(form));
    return render(canonicalNode(parsed));
  } catch {
    return form;
  }
}

/**
 * Ключ сопоставления «глазами одно и то же — в коде одно и то же»:
 * разбор -> нормализация записи (пробельные/невидимые символы, перестановка
 * множителей/слагаемых) -> рендер, БЕЗ свёртки тождеств (0_F/0_F остаётся шаблоном).
 * Если разбор невозможен — прежняя политика пре-солвера: убрать невидимые символы
 * и свернуть \s+ (непарсируемый синтаксис не маскируется «успешной» нормализацией).
 */
export function normalizeMatchKey(form: string): string {
  const cleaned = stripInvisible(form);
  try {
    return render(canonicalNode(parse(tokenize(cleaned)), false));
  } catch {
    return cleaned.replace(/\s+/g, '');
  }
}

/**
 * Ожидание тождества для формы верхнего уровня:
 *   E - E -> '0', E / E -> '1', иначе null (ограничений нет).
 */
export function identityExpectation(form: string): '0' | '1' | null {
  try {
    const parsed = parse(tokenize(form));
    if (parsed.kind !== 'bin') return null;
    if (parsed.op !== '-' && parsed.op !== '/') return null;
    if (render(canonicalNode(parsed.left)) !== render(canonicalNode(parsed.right))) return null;
    return parsed.op === '-' ? '0' : '1';
  } catch {
    return null;
  }
}

/** Индексные символы формы (одиночные заглавные буквы): F, G, H, K ... */
export function indexSymbolsOf(form: string): readonly string[] {
  const found = new Set<string>();
  // Символ индекса — одиночная заглавная буква; `_` слева разрешён (inf_F, 0_G),
  // а буквы/цифры слева — нет (иначе это часть более длинного идентификатора).
  // Невидимые символы отбрасываются: они не должны «прятать» индекс.
  for (const match of stripInvisible(form).matchAll(/(?<![A-Za-z0-9])[A-Z](?![A-Za-z0-9_])/gu)) {
    found.add(match[0]);
  }
  return Object.freeze([...found].sort());
}

/** Подстановка индексных символов целиком по токену (не по подстроке). */
export function substituteSymbol(form: string, from: string, to: string): string {
  return form.replace(new RegExp(`(?<![A-Za-z0-9])${from}(?![A-Za-z0-9_])`, 'gu'), to);
}

/**
 * Одновременная подстановка словаря символов (P2), исключающая каскадное F -> G -> H.
 */
export function substituteAllSymbols(form: string, substitution: Readonly<Record<string, string>>): string {
  const keys = Object.keys(substitution).filter(k => k.length > 0 && substitution[k] !== undefined);
  if (keys.length === 0) return form;
  const pattern = new RegExp(`(?<![A-Za-z0-9])(${keys.join('|')})(?![A-Za-z0-9_])`, 'gu');
  return form.replace(pattern, (_, match: string) => substitution[match] ?? match);
}
