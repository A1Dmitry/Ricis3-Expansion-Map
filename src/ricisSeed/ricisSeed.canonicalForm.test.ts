import { describe, expect, it } from 'vitest';

import { canonicalizeForm, identityExpectation, indexSymbolsOf, substituteSymbol } from './canonicalForm';
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
    expect(canonicalizeForm('(0_F)^(inf_G)')).toBe('(0_F)^(inf_G)');
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
