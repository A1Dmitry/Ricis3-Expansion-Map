import { describe, expect, it } from 'vitest';

import { canonicalizeForm, identityExpectation, indexSymbolsOf, normalizeMatchKey, substituteSymbol } from './canonicalForm';
import { identityCoherenceViolation } from './ricisSeed.domain';

describe('RICIS SEED — каноническая форма и тождество L1', () => {
  it('сворачивает тождество: E - E -> 0 и E / E -> 1', () => {
    expect(canonicalizeForm('inf_F-inf_F')).toBe('0');
    expect(canonicalizeForm('0_F/0_F')).toBe('1');
    expect(canonicalizeForm('X-X')).toBe('0');
    expect(canonicalizeForm('X/X')).toBe('1');
    expect(identityExpectation('inf_F-inf_F')).toBe('0');
    expect(identityExpectation('0_F/0_F')).toBe('1');
  });

  it('не сворачивает различие индексов и не теряет структуру скобок', () => {
    expect(canonicalizeForm('inf_F-inf_G')).toBe('inf_F-inf_G');
    expect(identityExpectation('inf_F-inf_G')).toBeNull();
    expect(canonicalizeForm('F*(G-H)')).toBe('F*(G-H)');
    expect(canonicalizeForm('(F*K)/(G*H)')).toBe('F*K/(G*H)');
  });

  it('учитывает коммутативность произведения при сравнении форм', () => {
    expect(canonicalizeForm('(F*G)/(G*F)')).toBe('1');
  });

  it('не маскирует неподдерживаемый синтаксис «успешной» нормализацией', () => {
    expect(canonicalizeForm('(0_F)^(inf_G)')).toBe('0_F^inf_G');
    expect(identityExpectation('(0_F)^(inf_G)')).toBeNull();
  });

  it('находит индексные символы и подставляет их целиком по токену', () => {
    expect(indexSymbolsOf('inf_F-inf_F')).toEqual(['F']);
    expect(indexSymbolsOf('0_F*(inf_G-inf_H)')).toEqual(['F', 'G', 'H']);
    expect(indexSymbolsOf('(F*K)/(G*H)')).toEqual(['F', 'G', 'H', 'K']);
    expect(substituteSymbol('0_F*(inf_G-inf_H)', 'G', 'H')).toBe('0_F*(inf_H-inf_H)');
    expect(substituteSymbol('inf_F/inf_G', 'F', 'G')).toBe('inf_G/inf_G');
  });

  it('помечает нарушение тождества: inf_F - inf_F = 1 вместо 0', () => {
    const violation = identityCoherenceViolation([{ inputForm: 'inf_F-inf_F', outputForm: '1' }]);
    expect(violation).not.toBeNull();
    expect(violation).toContain('X - X = 0');
    expect(violation).toContain('до A4/A5/A7');
  });

  it('пропускает корректное тождество: inf_F - inf_F = 0', () => {
    expect(identityCoherenceViolation([{ inputForm: 'inf_F-inf_F', outputForm: '0' }])).toBeNull();
    expect(identityCoherenceViolation([{ inputForm: '0_F/0_F', outputForm: '1' }])).toBeNull();
  });

  it('проверяет отождествление индексов: A12 при H=F, K=G обязана дать 1', () => {
    const consistent = identityCoherenceViolation([
      { inputForm: '(0_F/0_G)/(0_H/0_K)', outputForm: '(F*K)/(G*H)' },
    ]);
    expect(consistent).toBeNull();

    const inconsistent = identityCoherenceViolation([
      { inputForm: '(0_F/0_G)/(0_H/0_K)', outputForm: '(F*H)/(G*K)' },
    ]);
    expect(inconsistent).not.toBeNull();
  });

  it('не создаёт ложных срабатываний там, где верхний оператор не задаёт тождества', () => {
    // 0_F*(inf_G-inf_H): верхний оператор '*' — тождество верхнего уровня не применимо,
    // даже когда внутренние индексы совпадают (G = H).
    expect(identityCoherenceViolation([{ inputForm: '0_F*(inf_G-inf_H)', outputForm: 'F*(G-H)' }])).toBeNull();
    expect(identityCoherenceViolation([{ inputForm: 'F*0', outputForm: '0_F' }])).toBeNull();
  });
});

describe('RICIS SEED — нормализация математической записи («глазами одно и то же — в коде одно и то же»)', () => {
  it('коммутативность: F*G == G*F, F+G == G+F (перестановка множителей/слагаемых)', () => {
    expect(normalizeMatchKey('G*F')).toBe('F*G');
    expect(normalizeMatchKey('G+F')).toBe('F+G');
    expect(normalizeMatchKey('G*F')).toBe(normalizeMatchKey('F*G'));
    expect(normalizeMatchKey('inf_G*0_F')).toBe(normalizeMatchKey('0_F*inf_G'));
    expect(canonicalizeForm('G * F')).toBe('F*G');
  });

  it('пробельные символы (\\n, \\r, NBSP), а не только пробел и таб, не создают новую форму', () => {
    expect(canonicalizeForm('F\n*\r\nG')).toBe('F*G');
    expect(canonicalizeForm('F\u00a0*\u00a0G')).toBe('F*G');
    expect(normalizeMatchKey(' 0_F  /  0_G ')).toBe('0_F/0_G');
    expect(normalizeMatchKey('0_F\u3000/\u00a00_G')).toBe('0_F/0_G');
  });

  it('невидимые символы (zero-width, BOM, bidi-override) отбрасываются до разбора', () => {
    expect(canonicalizeForm('F\u200b*G')).toBe('F*G');
    expect(canonicalizeForm('\ufeffF*G')).toBe('F*G');
    expect(normalizeMatchKey('0_F\u200d*\u2060inf_G')).toBe('0_F*inf_G');
    // невидимый символ не «прячет» индексный символ
    expect(indexSymbolsOf('inf\u200b_F')).toEqual(['F']);
  });

  it('ключ сопоставления НЕ сворачивает тождества: шаблон 0_F/0_F остаётся шаблоном', () => {
    expect(normalizeMatchKey('0_F / 0_F')).toBe('0_F/0_F');
    expect(normalizeMatchKey('0_F/0_F')).not.toBe('1');
    // а канал тождества по-прежнему сворачивает (L1)
    expect(canonicalizeForm('0_F/0_F')).toBe('1');
  });

  it('порядок операндов детерминирован: кодпоинты, а не localeCompare', () => {
    // 'B' (0x42) < 'a' (0x61) по кодпоинтам; localeCompare в ряде локалей даёт обратный порядок
    expect(canonicalizeForm('a*B')).toBe('B*a');
    expect(canonicalizeForm('b*a+a*b')).toBe('a*b+a*b');
    expect(normalizeMatchKey('b*a+a*b')).toBe('a*b+a*b');
  });

  it('рендер восстанавливает скобки, отсутствие которых меняет дерево: (F*K)/(G*H) идемпотентен', () => {
    const once = canonicalizeForm('(F*K)/(G*H)');
    expect(once).toBe('F*K/(G*H)');
    // повторная канонизация не меняет результат (раньше правый операнд терял скобки)
    expect(canonicalizeForm(once)).toBe(once);
    expect(normalizeMatchKey('F*(G/H)')).toBe('F*(G/H)');
    expect(canonicalizeForm('A-(B+C)')).toBe('A-(B+C)');
  });

  it('непарсируемый синтаксис в ключе не маскируется: fallback = прежняя политика preSolver', () => {
    // '=' не является оператором грамматики — форма непарсируема, ключ строится по fallback-политике
    expect(normalizeMatchKey('X = X  ')).toBe('X=X');
    expect(normalizeMatchKey('a\u200b =  b')).toBe('a=b');
  });
});
