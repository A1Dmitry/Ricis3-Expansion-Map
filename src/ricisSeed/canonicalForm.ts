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
 * Никакой арифметики чисел, никаких пределов, никаких приближений: только структура.
 */

type Node =
  | { readonly kind: 'id'; readonly name: string }
  | { readonly kind: 'call'; readonly name: string; readonly arg: Node }
  | { readonly kind: 'bin'; readonly op: '+' | '-' | '*' | '/'; readonly left: Node; readonly right: Node };

const OPERATORS = new Set(['+', '-', '*', '/']);

function tokenize(form: string): string[] {
  const tokens: string[] = [];
  let index = 0;
  while (index < form.length) {
    const char = form[index]!;
    if (char === ' ' || char === '\t') {
      index += 1;
      continue;
    }
    if (char === '(' || char === ')' || OPERATORS.has(char)) {
      tokens.push(char);
      index += 1;
      continue;
    }
    let end = index;
    while (end < form.length) {
      const next = form[end]!;
      if (next === '(' || next === ')' || OPERATORS.has(next) || next === ' ' || next === '\t') break;
      end += 1;
    }
    tokens.push(form.slice(index, end));
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

  const parseTerm = (): Node => {
    let left = parseFactor();
    while (peek() === '*' || peek() === '/') {
      const op = tokens[position] as '*' | '/';
      position += 1;
      const right = parseFactor();
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

function precedence(op: '+' | '-' | '*' | '/'): number {
  return op === '*' || op === '/' ? 2 : 1;
}

function render(node: Node): string {
  switch (node.kind) {
    case 'id':
      return node.name;
    case 'call':
      return `${node.name}(${render(node.arg)})`;
    case 'bin': {
      const own = precedence(node.op);
      const renderChild = (child: Node, side: 'left' | 'right'): string => {
        const text = render(child);
        if (child.kind !== 'bin') return text;
        const childPrecedence = precedence(child.op);
        const needsParens =
          childPrecedence < own ||
          (childPrecedence === own && side === 'right' && (node.op === '-' || node.op === '/'));
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

function canonicalNode(node: Node): Node {
  if (node.kind === 'id') return node;
  if (node.kind === 'call') return { kind: 'call', name: node.name, arg: canonicalNode(node.arg) };

  const left = canonicalNode(node.left);
  const right = canonicalNode(node.right);

  // ТОЖДЕСТВО (L1): E - E = 0 и E / E = 1 применяется до аксиом сингулярностей.
  if ((node.op === '-' || node.op === '/') && render(left) === render(right)) {
    return { kind: 'id', name: node.op === '-' ? '0' : '1' };
  }

  if (node.op === '*' || node.op === '+') {
    const operands = [...flatten(left, node.op), ...flatten(right, node.op)]
      .map(canonicalNode)
      .sort((a, b) => render(a).localeCompare(render(b)));
    const chained = operands.reduce<Node | null>((accumulator, operand) => {
      if (!accumulator) return operand;
      return { kind: 'bin', op: node.op, left: accumulator, right: operand };
    }, null);
    if (chained) return chained;
  }

  return { kind: 'bin', op: node.op, left, right };
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
  for (const match of form.matchAll(/(?<![A-Za-z0-9])[A-Z](?![A-Za-z0-9_])/gu)) {
    found.add(match[0]);
  }
  return Object.freeze([...found].sort());
}

/** Подстановка индексных символов целиком по токену (не по подстроке). */
export function substituteSymbol(form: string, from: string, to: string): string {
  return form.replace(new RegExp(`(?<![A-Za-z0-9])${from}(?![A-Za-z0-9_])`, 'gu'), to);
}
