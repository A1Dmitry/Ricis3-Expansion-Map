/**
 * @file graphStructuralEquality.test.ts
 * Независимые тесты графового изоморфизма и структурного сравнения (Anti-Tukhta / L1 / SP4).
 * Проверяют устранение мусорных дубликатов за счет чисто графового сопоставления AST.
 */
import { describe, it, expect } from 'vitest';
import { StructuralEqualityService } from './oopDomainServices';
import type {
  StructuralExpression,
  StructuralBinaryExpression,
  StructuralIndexedZero,
  StructuralIndexedInfinity,
  StructuralSourceReference,
} from './contracts';
import {
  structuralToSymbolicAst,
  computeSymbolicAstFingerprint,
  areSymbolicAstsIsomorphic,
  parseCanonicalStringToAst,
} from './a15SeriesEngine';

function createDummySource(canonical: string): StructuralSourceReference {
  return Object.freeze({
    sourceHash: `hash_${canonical}`,
    sourceCanonical: canonical,
    sourceSpan: { start: 0, endExclusive: canonical.length },
    origin: 'ANALYZER_AST' as const,
  });
}

function makeId(name: string): StructuralExpression {
  return Object.freeze({
    kind: 'IDENTIFIER' as const,
    name,
    identity: Object.freeze({
      structuralHash: `id:${name}`,
      canonical: name,
      typeTag: 'scalar' as const,
      source: createDummySource(name),
    }),
    semanticKeys: Object.freeze([]),
  });
}

function makeLit(val: number | string): StructuralExpression {
  const str = String(val);
  return Object.freeze({
    kind: 'FINITE_LITERAL' as const,
    lexeme: str,
    identity: Object.freeze({
      structuralHash: `lit:${str}`,
      canonical: str,
      typeTag: 'scalar' as const,
      source: createDummySource(str),
    }),
    semanticKeys: Object.freeze([]),
  });
}

function makeBinary(
  operator: 'ADD' | 'SUBTRACT' | 'MULTIPLY' | 'DIVIDE',
  left: StructuralExpression,
  right: StructuralExpression
): StructuralBinaryExpression {
  const opSymbol = operator === 'ADD' ? '+' : operator === 'SUBTRACT' ? '-' : operator === 'MULTIPLY' ? '*' : '/';
  const canonical = `(${left.identity.canonical} ${opSymbol} ${right.identity.canonical})`;
  return Object.freeze({
    kind: 'BINARY' as const,
    operator,
    left,
    right,
    identity: Object.freeze({
      structuralHash: `bin:${operator}(${left.identity.structuralHash},${right.identity.structuralHash})`,
      canonical,
      typeTag: 'scalar' as const,
      source: createDummySource(canonical),
    }),
    semanticKeys: Object.freeze([]),
  });
}

function makeIndexedZero(payload: StructuralExpression): StructuralIndexedZero {
  return Object.freeze({
    kind: 'INDEXED_ZERO' as const,
    payload,
    index: Object.freeze({
      basis: 'SP4_SOURCE_EXPRESSION' as const,
      payloadHash: payload.identity.structuralHash,
      payloadCanonical: payload.identity.canonical,
      payloadTypeTag: payload.identity.typeTag,
      sourceHash: payload.identity.source.sourceHash,
      semanticKeys: payload.semanticKeys,
    }),
    identity: Object.freeze({
      structuralHash: `zero:${payload.identity.structuralHash}`,
      canonical: `0_{${payload.identity.canonical}}`,
      typeTag: 'scalar' as const,
      source: createDummySource(`0_{${payload.identity.canonical}}`),
    }),
    semanticKeys: Object.freeze([]),
  });
}

function makeIndexedInfinity(payload: StructuralExpression): StructuralIndexedInfinity {
  return Object.freeze({
    kind: 'INDEXED_INFINITY' as const,
    payload,
    index: Object.freeze({
      basis: 'SP4_SOURCE_EXPRESSION' as const,
      payloadHash: payload.identity.structuralHash,
      payloadCanonical: payload.identity.canonical,
      payloadTypeTag: payload.identity.typeTag,
      sourceHash: payload.identity.source.sourceHash,
      semanticKeys: payload.semanticKeys,
    }),
    identity: Object.freeze({
      structuralHash: `inf:${payload.identity.structuralHash}`,
      canonical: `inf_{${payload.identity.canonical}}`,
      typeTag: 'scalar' as const,
      source: createDummySource(`inf_{${payload.identity.canonical}}`),
    }),
    semanticKeys: Object.freeze([]),
  });
}

describe('RCVAP: Графовое сравнение вычислительных структур (Anti-Garbage Duplicates)', () => {
  const equality = new StructuralEqualityService();

  describe('Сценарий 1: Коммутативный изоморфизм графов AST (L1 Identity)', () => {
    it('должен признавать изоморфными графы x + y и y + x', () => {
      const x = makeId('x');
      const y = makeId('y');

      const sum1 = makeBinary('ADD', x, y); // (x + y)
      const sum2 = makeBinary('ADD', y, x); // (y + x)

      // Текстовые канонические строки различаются: "(x + y)" !== "(y + x)"
      expect(sum1.identity.canonical).not.toBe(sum2.identity.canonical);
      expect(sum1.identity.structuralHash).not.toBe(sum2.identity.structuralHash);

      // Но графовое сравнение подтверждает истинный изоморфизм!
      expect(equality.areStructurallyEqual(sum1, sum2)).toBe(true);
      expect(equality.areGraphIsomorphic(sum1, sum2)).toBe(true);
    });

    it('должен генерировать идентичный отпечаток графа для x + y и y + x', () => {
      const x = makeId('x');
      const y = makeId('y');

      const sum1 = makeBinary('ADD', x, y);
      const sum2 = makeBinary('ADD', y, x);

      const fp1 = equality.getGraphFingerprint(sum1);
      const fp2 = equality.getGraphFingerprint(sum2);

      expect(fp1).toBe(fp2);
    });

    it('должен признавать изоморфными вложенные графы с коммутативными операциями: (x + 1) * (y + 2) == (2 + y) * (1 + x)', () => {
      const x = makeId('x');
      const y = makeId('y');
      const one = makeLit(1);
      const two = makeLit(2);

      const exprA = makeBinary('MULTIPLY', makeBinary('ADD', x, one), makeBinary('ADD', y, two));
      const exprB = makeBinary('MULTIPLY', makeBinary('ADD', two, y), makeBinary('ADD', one, x));

      expect(equality.areStructurallyEqual(exprA, exprB)).toBe(true);
      expect(equality.getGraphFingerprint(exprA)).toBe(equality.getGraphFingerprint(exprB));
    });

    it('должен строго отвергать некоммутативные перестановки: (x - y) !== (y - x)', () => {
      const x = makeId('x');
      const y = makeId('y');

      const sub1 = makeBinary('SUBTRACT', x, y);
      const sub2 = makeBinary('SUBTRACT', y, x);

      expect(equality.areStructurallyEqual(sub1, sub2)).toBe(false);
      expect(equality.getGraphFingerprint(sub1)).not.toBe(equality.getGraphFingerprint(sub2));
    });

    it('должен строго отвергать некоммутативное деление: (x / y) !== (y / x)', () => {
      const x = makeId('x');
      const y = makeId('y');

      const div1 = makeBinary('DIVIDE', x, y);
      const div2 = makeBinary('DIVIDE', y, x);

      expect(equality.areStructurallyEqual(div1, div2)).toBe(false);
    });
  });

  describe('Сценарий 2: Устранение мусорных дубликатов (Garbage Duplicates Elimination)', () => {
    it('должен дедуплицировать множество выражений по графовому отпечатку без появления мусорных дубликатов', () => {
      const x = makeId('x');
      const y = makeId('y');

      // Создаем несколько выражений с разным текстовым форматированием/порядком операндов
      const variants = [
        makeBinary('ADD', x, y),
        makeBinary('ADD', y, x),
        makeBinary('ADD', x, y),
        makeBinary('MULTIPLY', x, y),
        makeBinary('MULTIPLY', y, x),
      ];

      // Текстовая дедупликация (по canonical) дала бы 4 элемента (мусорные дубликаты из-за порядка операндов)
      const textSet = new Set(variants.map(v => v.identity.canonical));
      expect(textSet.size).toBe(4);

      // Графовая дедупликация (по getGraphFingerprint) дает ровно 2 уникальных семантических графа!
      const graphSet = new Set(variants.map(v => equality.getGraphFingerprint(v)));
      expect(graphSet.size).toBe(2);
    });

    it('должен распознавать сингулярности 0_{x + y} и 0_{y + x} как изоморфные узлы SP4', () => {
      const x = makeId('x');
      const y = makeId('y');

      const z1 = makeIndexedZero(makeBinary('ADD', x, y));
      const z2 = makeIndexedZero(makeBinary('ADD', y, x));

      expect(equality.areStructurallyEqual(z1, z2)).toBe(true);
      expect(equality.haveEqualSemanticIndices(z1.index, z2.index, z1.payload, z2.payload)).toBe(true);
      expect(equality.getGraphFingerprint(z1)).toBe(equality.getGraphFingerprint(z2));
    });

    it('должен различать сингулярности 0_{x^2 - 4} и 0_{x - 2} с разным порождающим происхождением (SP4)', () => {
      const litExpr1 = Object.freeze({
        kind: 'FINITE_LITERAL' as const,
        lexeme: '0',
        identity: Object.freeze({
          structuralHash: 'h_expr1',
          canonical: 'x^2 - 4',
          typeTag: 'scalar' as const,
          source: createDummySource('x^2 - 4'),
        }),
        semanticKeys: Object.freeze([]),
      });

      const litExpr2 = Object.freeze({
        kind: 'FINITE_LITERAL' as const,
        lexeme: '0',
        identity: Object.freeze({
          structuralHash: 'h_expr2',
          canonical: 'x - 2',
          typeTag: 'scalar' as const,
          source: createDummySource('x - 2'),
        }),
        semanticKeys: Object.freeze([]),
      });

      const z1 = makeIndexedZero(litExpr1);
      const z2 = makeIndexedZero(litExpr2);

      // Одинаковые численные значения (0), но разный порождающий граф -> строго false
      expect(equality.areStructurallyEqual(z1, z2)).toBe(false);
      expect(equality.haveEqualSemanticIndices(z1.index, z2.index)).toBe(false);
      expect(equality.getGraphFingerprint(z1)).not.toBe(equality.getGraphFingerprint(z2));
    });
  });

  describe('Сценарий 3: Чистые функции графового изоморфизма (Symbolic AST)', () => {
    it('areSymbolicAstsIsomorphic должен корректно сравнивать парсированные деревья', () => {
      const ast1 = parseCanonicalStringToAst('x + y * 2');
      const ast2 = parseCanonicalStringToAst('2 * y + x');
      expect(ast1).toBeDefined();
      expect(ast2).toBeDefined();
      expect(areSymbolicAstsIsomorphic(ast1!, ast2!)).toBe(true);
    });

    it('computeSymbolicAstFingerprint должен быть детерминированным и коммутативно-инвариантным', () => {
      const ast1 = parseCanonicalStringToAst('a + b + c');
      const ast2 = parseCanonicalStringToAst('c + b + a');
      expect(ast1).toBeDefined();
      expect(ast2).toBeDefined();

      const fp1 = computeSymbolicAstFingerprint(ast1!);
      const fp2 = computeSymbolicAstFingerprint(ast2!);
      expect(fp1).toBe(fp2);
    });
  });
});
