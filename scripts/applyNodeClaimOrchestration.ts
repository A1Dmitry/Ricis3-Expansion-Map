/**
 * Генератор управляемых узлов карты и их доказательств: `src/model/initialMap.ts`
 * регенерируется из плана `src/model/nodeClaimOrchestration.ts`.
 *
 * ЗАЧЕМ
 * -----
 * План оркестрации — источник истины для узлов, добавленных авто-генерацией и декомпозицией
 * (registry-100…120, task-*). Если править `initialMap.ts` руками, дерево и план расходятся, и
 * «понижение» узла живёт до первой перезаписи файла. Поэтому управляемые блоки помечены
 * маркерами (`// >>> NODE-CLAIM-ORCHESTRATION:<id>` … `// <<< NODE-CLAIM-ORCHESTRATION:<id>`,
 * для записей доказательств — префикс `…-PROOF:`) и генерируются детерминированно: повторный
 * запуск обязан дать побайтово тот же текст.
 *
 * ПОЧЕМУ МАРКЕРЫ РАЗНЫЕ
 * ---------------------
 * Узел и его запись доказательства нумеруются ОДНИМ id, поэтому одинаковый текст маркера делал
 * поиск региона неоднозначным: проход по доказательствам находил маркер узла и затирал сам узел.
 * Записи доказательств помечены префиксом `NODE-CLAIM-ORCHESTRATION-PROOF:`, узлы — без него.
 *
 * КАК УСТРОЕНА ЗАМЕНА
 * -------------------
 * Каждый регион заменяется ровно по ПАРЕ индексов `[start, end]`, вычисленной в том же проходе
 * (`renderNodeRegion` / `renderProofRegion`): повторный поиск якоря по тексту неоднозначен —
 * в литерале узла встречаются ключи вида `"registry-101": {`, и однажды это уже затёрло чужой
 * блок. Перед проходом маркеры снимаются (`stripMarkers`), поэтому результат — неподвижная
 * точка: `renderInitialMap(renderInitialMap(x)) === renderInitialMap(x)`.
 *
 * РЕЖИМЫ
 * ------
 *   tsx scripts/applyNodeClaimOrchestration.ts           — записать дерево из плана;
 *   tsx scripts/applyNodeClaimOrchestration.ts --check   — дрейф: exit 1, файл не меняется.
 *
 * `npm run tps:nodes:check` — то же, что `--check`: расхождение плана и дерева рвёт поток.
 *
 * ГРАНИЦЫ
 * -------
 * Скрипт не трогает ничего, кроме управляемых узлов и их записей доказательств: зоны, связи,
 * экономика, тексты ненулевых узлов и ядро RICIS остаются как есть. Новых утверждений скрипт
 * не создаёт — он записывает ровно то, что заявлено планом и подтверждено прогоном в реестре.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ProblemNode } from '../src/model/types';
import {
  NODE_CLAIM_ORCHESTRATION_PLAN,
  REFERENCE_ORCHESTRATED_NODE_IDS,
  buildNodeClaimPatch,
  buildOrchestratedProof,
  type NodeClaimPlanEntry,
} from '../src/model/nodeClaimOrchestration';

export const INITIAL_MAP_PATH = 'src/model/initialMap.ts';

/** Маркеры регионов узлов. */
export const MARKER_OPEN = '// >>> NODE-CLAIM-ORCHESTRATION:';
export const MARKER_CLOSE = '// <<< NODE-CLAIM-ORCHESTRATION:';
/** Маркеры регионов записей доказательств (отдельный префикс — см. заголовок файла). */
export const PROOF_MARKER_OPEN = '// >>> NODE-CLAIM-ORCHESTRATION-PROOF:';
export const PROOF_MARKER_CLOSE = '// <<< NODE-CLAIM-ORCHESTRATION-PROOF:';

const MARKER_LINE = /^[ \t]*\/\/ (?:>>>|<<<) NODE-CLAIM-ORCHESTRATION(?:-PROOF)?:/u;

/** Заменяемый участок текста. */
interface Region {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

/**
 * Маска «это не код»: строковые литералы и комментарии. Сканеры фигурных скобок работают по
 * маске, поэтому скобки внутри latex-строк и в комментариях не сбивают сопоставление — запись
 * доказательства начинается не с отдельной строки `{`, и без маски её границы находились неверно.
 */
function codeMask(text: string): Uint8Array {
  const mask = new Uint8Array(text.length);
  let index = 0;
  while (index < text.length) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '/' && next === '/') {
      let end = text.indexOf('\n', index);
      if (end === -1) end = text.length;
      for (let cursor = index; cursor < end; cursor += 1) mask[cursor] = 1;
      index = end;
      continue;
    }
    if (char === '/' && next === '*') {
      const found = text.indexOf('*/', index + 2);
      const end = found === -1 ? text.length : found + 2;
      for (let cursor = index; cursor < end; cursor += 1) mask[cursor] = 1;
      index = end;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      let end = index + 1;
      while (end < text.length) {
        if (text[end] === '\\') {
          end += 2;
          continue;
        }
        if (text[end] === char) break;
        end += 1;
      }
      end = Math.min(end + 1, text.length);
      for (let cursor = index; cursor < end; cursor += 1) mask[cursor] = 1;
      index = end;
      continue;
    }
    index += 1;
  }
  return mask;
}

/** Индекс парной `}` для `{` по индексу `from` (по маске кода). */
export function findMatchingBrace(text: string, from: number): number {
  if (text[from] !== '{') throw new Error(`сканер: ожидалась '{' по индексу ${from}`);
  const mask = codeMask(text);
  let depth = 0;
  for (let index = from; index < text.length; index += 1) {
    if (mask[index]) continue;
    if (text[index] === '{') depth += 1;
    else if (text[index] === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error('сканер: несбалансированные скобки');
}

/** Индекс `{`, открывающего объект, внутри которого лежит `from` (по маске кода). */
export function findEnclosingBrace(text: string, from: number): number {
  const mask = codeMask(text);
  let depth = 0;
  for (let index = from; index >= 0; index -= 1) {
    if (mask[index]) continue;
    const char = text[index];
    if (char === '}') depth += 1;
    else if (char === '{') {
      if (depth === 0) return index;
      depth -= 1;
    }
  }
  throw new Error('сканер: не найдена открывающая скобка объекта');
}

/** Блок `{ … }`, внутри которого встречается `anchor`. */
export function findBlockByAnchor(text: string, anchor: string): { start: number; end: number } {
  const anchorIndex = text.indexOf(anchor);
  if (anchorIndex === -1) throw new Error(`не найден якорь: ${anchor}`);
  const start = findEnclosingBrace(text, anchorIndex);
  return { start, end: findMatchingBrace(text, start) + 1 };
}

export function indent(text: string, base: string): string {
  return text
    .split('\n')
    .map((line) => (line.trim().length === 0 ? line : `${base}${line}`))
    .join('\n');
}

export function baseIndentOf(text: string, index: number): string {
  const lineStart = text.lastIndexOf('\n', index) + 1;
  const match = /^[ \t]*/u.exec(text.slice(lineStart, index));
  return match ? match[0] : '';
}

/**
 * Мини-парсер подмножества литералов карты (объекты, массивы, строки, числа, boolean, null).
 * Нужен потому, что часть управляемых блоков записана TS-литералами, а часть — JSON-литералами;
 * канонический выход у обоих один (детерминированный JSON-текст с 4-пробельным отступом).
 */
export function parseLiteral(text: string): unknown {
  let index = 0;
  const whitespace = () => {
    while (index < text.length && /\s/u.test(text[index] as string)) index += 1;
  };
  const parseValue = (): unknown => {
    whitespace();
    const char = text[index];
    if (char === '{') return parseObject();
    if (char === '[') return parseArray();
    if (char === "'" || char === '"') return parseString(char);
    if (text.startsWith('true', index)) {
      index += 4;
      return true;
    }
    if (text.startsWith('false', index)) {
      index += 5;
      return false;
    }
    if (text.startsWith('null', index)) {
      index += 4;
      return null;
    }
    const match = /^[+-]?[0-9][0-9_]*(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/u.exec(text.slice(index));
    if (!match) throw new Error(`парсер: неожидаемый токен «${text.slice(index, index + 20)}»`);
    index += match[0].length;
    return Number(match[0].replace(/_/gu, ''));
  };
  const parseString = (quote: string): string => {
    index += 1;
    let out = '';
    while (index < text.length) {
      const char = text[index];
      if (char === '\\') {
        const escaped = text[index + 1];
        const map: Record<string, string> = { n: '\n', t: '\t', r: '\r', '\\': '\\', "'": "'", '"': '"', '`': '`' };
        out += map[escaped] ?? escaped;
        index += 2;
        continue;
      }
      if (char === quote) {
        index += 1;
        return out;
      }
      out += char;
      index += 1;
    }
    throw new Error('парсер: незакрытая строка');
  };
  const parseObject = (): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    index += 1;
    whitespace();
    while (text[index] !== '}') {
      whitespace();
      const char = text[index];
      let key: string;
      if (char === "'" || char === '"') key = parseString(char);
      else {
        const match = /^[A-Za-z_$][A-Za-z0-9_$]*/u.exec(text.slice(index));
        if (!match) throw new Error(`парсер: неожидаемый ключ «${text.slice(index, index + 20)}»`);
        key = match[0];
        index += match[0].length;
      }
      whitespace();
      if (text[index] !== ':') throw new Error(`парсер: ожидалось ':' после ключа ${key}`);
      index += 1;
      result[key] = parseValue();
      whitespace();
      if (text[index] === ',') {
        index += 1;
        whitespace();
      }
    }
    index += 1;
    return result;
  };
  const parseArray = (): unknown[] => {
    const result: unknown[] = [];
    index += 1;
    whitespace();
    while (text[index] !== ']') {
      result.push(parseValue());
      whitespace();
      if (text[index] === ',') {
        index += 1;
        whitespace();
      }
    }
    index += 1;
    return result;
  };
  const value = parseValue();
  whitespace();
  if (index !== text.length) throw new Error(`парсер: хвост литерала «${text.slice(index, index + 30)}»`);
  return value;
}

/** Снимает строки маркеров: дальше файл обрабатывается как немаркированный (неподвижная точка). */
export function stripMarkers(source: string): string {
  const lines = source.split('\n');
  const kept = lines.filter((line) => !MARKER_LINE.test(line));
  return kept.join('\n');
}

/** Неуправляемые поля узла сохраняются как есть; управляемые — из плана. */
export function orchestrateNodeLiteral(literal: string, entry: NodeClaimPlanEntry): string {
  const parsed = parseLiteral(literal.trim()) as Record<string, unknown>;
  const patch = buildNodeClaimPatch(entry) as Partial<ProblemNode> & { informalExternalClaim?: string };
  const merged: Record<string, unknown> = { ...parsed };
  for (const [key, value] of Object.entries(patch)) merged[key] = value;
  if (!patch.informalExternalClaim) delete merged.informalExternalClaim;
  return JSON.stringify(merged, null, 4);
}

/** Запись доказательства: поля плана перекрывают прежние, прочие (например `externalLean`) целы. */
export function orchestrateProofLiteral(literal: string, entry: NodeClaimPlanEntry): string {
  const parsed = parseLiteral(literal.trim()) as Record<string, unknown>;
  const proof = buildOrchestratedProof(entry) as unknown as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...parsed };
  for (const [key, value] of Object.entries(proof)) merged[key] = value;
  return JSON.stringify(merged, null, 4);
}

/**
 * Разделитель `,` между элементами массива/объекта обязан остаться ВНЕ маркеров: строчный
 * комментарий съел бы его, и файл перестал бы компилироваться.
 */
function trailingSeparator(source: string, end: number): { separator: string; end: number } {
  const match = /^[ \t]*,/u.exec(source.slice(end));
  return match ? { separator: ',', end: end + match[0].length } : { separator: '', end };
}

/** Готовый маркированный блок узла вместе с границами замены. */
export function renderNodeRegion(source: string, entry: NodeClaimPlanEntry): Region {
  const tsAnchor = `id: '${entry.nodeId}'`;
  const jsonAnchor = `"id": "${entry.nodeId}"`;
  const anchor = source.includes(jsonAnchor) ? jsonAnchor : tsAnchor;
  const span = findBlockByAnchor(source, anchor);
  const base = baseIndentOf(source, span.start);
  const literal = orchestrateNodeLiteral(source.slice(span.start, span.end), entry);
  const tail = trailingSeparator(source, span.end);
  const text =
    `${base}${MARKER_OPEN}${entry.nodeId}\n${indent(literal, base)}${tail.separator}\n` +
    `${base}${MARKER_CLOSE}${entry.nodeId}`;
  return { text, start: source.lastIndexOf('\n', span.start) + 1, end: tail.end };
}

/** Готовый маркированный блок записи доказательства вместе с границами замены. */
export function renderProofRegion(source: string, entry: NodeClaimPlanEntry): Region {
  const anchor = `"nodeId": "${entry.nodeId}"`;
  const anchorIndex = source.indexOf(anchor);
  if (anchorIndex === -1) throw new Error(`не найден якорь записи доказательства: ${anchor}`);
  const braceIndex = findEnclosingBrace(source, anchorIndex);
  const span = { start: braceIndex, end: findMatchingBrace(source, braceIndex) + 1 };
  const base = baseIndentOf(source, span.start);
  const literal = orchestrateProofLiteral(source.slice(span.start, span.end), entry);
  const tail = trailingSeparator(source, span.end);
  const lines = indent(literal, base).split('\n');
  const head = `${base}"${entry.nodeId}": ${(lines[0] as string).trim()}`;
  const body = [head, ...lines.slice(1)].join('\n');
  const text =
    `${base}${PROOF_MARKER_OPEN}${entry.nodeId}\n${body}${tail.separator}\n` +
    `${base}${PROOF_MARKER_CLOSE}${entry.nodeId}`;
  // Ключ записи — на предыдущей строке относительно `{`; регион начинается с него.
  const keyLineStart = source.lastIndexOf(`"${entry.nodeId}"`, span.start);
  const keyLine = keyLineStart === -1 ? span.start : keyLineStart;
  return { text, start: source.lastIndexOf('\n', keyLine) + 1, end: tail.end };
}

/** Замена региона ровно по вычисленным границам. */
export function replaceRegion(source: string, region: Region): string {
  return source.slice(0, region.start) + region.text + source.slice(region.end);
}

/** Текст `initialMap.ts`, полностью выведенный из плана. */
export function renderInitialMap(source: string): string {
  let text = stripMarkers(source);
  for (const entry of NODE_CLAIM_ORCHESTRATION_PLAN) {
    text = replaceRegion(text, renderNodeRegion(text, entry));
    text = replaceRegion(text, renderProofRegion(text, entry));
  }
  return text;
}

/** Маркеры эталонных узлов: их записи уже в дереве, но страж обязан их видеть. */
export function referenceMarkerReport(source: string): readonly string[] {
  return REFERENCE_ORCHESTRATED_NODE_IDS.filter((id) => !source.includes(`${PROOF_MARKER_OPEN}${id}`));
}

const invokedDirectly = Boolean(process.argv[1]) && process.argv[1].includes('applyNodeClaimOrchestration');

if (invokedDirectly) {
  const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const target = join(repositoryRoot, INITIAL_MAP_PATH);
  const current = readFileSync(target, 'utf8');
  const rendered = renderInitialMap(current);
  const stable = stripMarkers(rendered);
  const rerendered = renderInitialMap(stable);
  if (renderInitialMap(rerendered) !== rerendered) {
    throw new Error('генератор нестабилен: повторный прогон даёт другой текст');
  }
  if (process.argv.includes('--check')) {
    if (current !== rendered) {
      console.error(
        `ANDON: дрейф оркестрации — ${INITIAL_MAP_PATH} не совпадает с планом ` +
          'src/model/nodeClaimOrchestration.ts. Выполните npm run tps:nodes.',
      );
      process.exit(1);
    }
    console.log(`оркестрация узлов синхронна с планом: ${INITIAL_MAP_PATH}`);
  } else {
    writeFileSync(target, rendered, 'utf8');
    console.log(`дерево узлов перегенерировано из плана: ${INITIAL_MAP_PATH}`);
  }
}
