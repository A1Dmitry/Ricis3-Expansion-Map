/**
 * Тесты реестра правил RICIS (сборка 0.4.209):
 *   1. A14 — idempotency ∞_F − ∞_F = 0: строгий верификатор в RuleVerifier
 *      (SP2 first: тождество до сингулярных расширений; результат ровно '0').
 *   2. BOUND_PAREN_RULE — связанные скобки: правые потомки сохраняют скобки
 *      при различии операторов / некоммутативном родителе; повторный разбор
 *      идемпотентен на 100%.
 */

import { describe, expect, it } from 'vitest';

import {
  BOUND_PAREN_RULE_CORPUS,
  BOUND_PAREN_RULE_ID,
  requiresParentheses,
  verifyBoundParenRule,
} from './boundParenRule';
import { parseForm, renderForm } from './canonicalForm';
import { verifyProofChain, verifyProofStep } from './ruleVerifier';
import { SEED_AXIOM_TABLE } from './seedTable';

describe('A14: inf_F - inf_F = 0 (строгий верификатор правила)', () => {
  it('подтверждает тождество: inf_F - inf_F -> 0 под правилом A14', () => {
    const result = verifyProofStep({ rule: 'A14', from: 'inf_F-inf_F', to: '0' });
    expect(result.valid).toBe(true);
    expect(result.ruleApplied).toBe('A14');
  });

  it('отклоняет историческую ошибочную ветку A17: inf_F - inf_F -> 1 (IDENTITY_COHERENCE)', () => {
    expect(verifyProofStep({ rule: 'A14', from: 'inf_F-inf_F', to: '1' }).valid).toBe(false);
  });

  it('отклоняет сингулярный результат inf_0: тождество даёт 0, а не индексированную бесконечность', () => {
    expect(verifyProofStep({ rule: 'A14', from: 'inf_F-inf_F', to: 'inf_0' }).valid).toBe(false);
  });

  it('не поглощает территорию A7: разные индексы inf_F - inf_G под A14 недопустимы', () => {
    expect(verifyProofStep({ rule: 'A14', from: 'inf_F-inf_G', to: '0' }).valid).toBe(false);
    expect(verifyProofStep({ rule: 'A14', from: 'inf_F-inf_G', to: 'inf_(F-G)' }).valid).toBe(false);
    // A7 по-прежнему верифицирует эту ветку
    expect(verifyProofStep({ rule: 'A7', from: 'inf_F-inf_G', to: 'inf_(F-G)' }).valid).toBe(true);
  });

  it('SP2-first: переход x-x -> 0 проходит через правило-независимые ворота тождества, но A14 не подтверждает нетождественные формы', () => {
    // x-x -> 0 — истинное тождество: canonicalizeForProof сворачивает его по L1 ещё
    // до проверки метки правила (SP2 first), поэтому ворота эквивалентности пропускают
    // переход при любой метке. Это свойство ворот тождества, а не сила A14.
    expect(verifyProofStep({ rule: 'A14', from: 'x-x', to: '0' }).valid).toBe(true);
    // A14 ничего не подтверждает вне своего паттерна inf_F - inf_F:
    expect(verifyProofStep({ rule: 'A14', from: 'x-y', to: '0' }).valid).toBe(false);
    expect(verifyProofStep({ rule: 'A14', from: 'x-x', to: '1' }).valid).toBe(false);
  });

  it('применяет A14 во вложенном контексте: 0_F*(inf_F-inf_F) -> 0_F*0', () => {
    expect(verifyProofStep({ rule: 'A14', from: '0_F*(inf_F-inf_F)', to: '0_F*0' }).valid).toBe(true);
    expect(verifyProofStep({ rule: 'A14', from: '0_F*(inf_F-inf_G)', to: '0_F*0' }).valid).toBe(false);
  });

  it('проверяет цепочку доказательства с A14 и отклоняет её разрыв', () => {
    const ok = verifyProofChain([{ rule: 'A14', from: 'inf_F-inf_F', to: '0' }]);
    expect(ok.valid).toBe(true);

    const broken = verifyProofChain([{ rule: 'A14', from: 'inf_F-inf_F', to: 'inf_(F-F)' }]);
    expect(broken.valid).toBe(false);
    expect(broken.failedStepIndex).toBe(0);
  });

  it('ранее A14 проходил через default-ветку верификатора: теперь строго — любой переход, кроме 0, отвергнут', () => {
    // Контроль регрессии: до 0.4.209 case 'A14' отсутствовал и срабатывал default: return true.
    for (const to of ['1', 'inf_0', 'inf_(F-F)', '0_F']) {
      expect(verifyProofStep({ rule: 'A14', from: 'inf_F-inf_F', to }).valid).toBe(false);
    }
  });
});

describe('BOUND_PAREN_RULE: связанные скобки и идемпотентность повторного разбора', () => {
  it('весь корпус форм идемпотентен: parse∘render∘parse структурно тождественен', () => {
    for (const form of BOUND_PAREN_RULE_CORPUS) {
      const report = verifyBoundParenRule(form);
      expect(report.ok, `${form}: ${report.violations.map(v => v.detail).join('; ')}`).toBe(true);
      expect(report.ruleId).toBe(BOUND_PAREN_RULE_ID);
    }
  });

  it('правый потомок при некоммутативном родителе сохраняет скобки', () => {
    expect(renderForm(parseForm('a-(b-c)'))).toBe('a-(b-c)');
    expect(renderForm(parseForm('a-(b+c)'))).toBe('a-(b+c)');
    expect(renderForm(parseForm('a/(b*c)'))).toBe('a/(b*c)');
    expect(renderForm(parseForm('a/(b/c)'))).toBe('a/(b/c)');
  });

  it('скобки не опускаются, когда их отсутствие меняет дерево, и не размножаются, когда опускание безопасно', () => {
    // безопасное опущение (R3): дерево не меняется, лишних скобок нет
    expect(renderForm(parseForm('a+b*c'))).toBe('a+b*c');
    expect(renderForm(parseForm('a-b+c'))).toBe('a-b+c');
    expect(renderForm(parseForm('(a-b)+c'))).toBe('a-b+c');
    expect(renderForm(parseForm('a^b^c'))).toBe('a^b^c');
  });

  it('таблица истинности предиката requiresParentheses', () => {
    // некоммутативный родитель '-' справа: скобки обязательны при любом равном старшинстве
    expect(requiresParentheses('-', 'right', '-')).toBe(true);
    expect(requiresParentheses('-', 'right', '+')).toBe(true);
    // некоммутативный родитель '/' справа: скобки обязательны
    expect(requiresParentheses('/', 'right', '*')).toBe(true);
    expect(requiresParentheses('/', 'right', '/')).toBe(true);
    // цепочка той же коммутативной операции: скобки не нужны
    expect(requiresParentheses('*', 'right', '*')).toBe(false);
    expect(requiresParentheses('+', 'right', '+')).toBe(false);
    expect(requiresParentheses('+', 'right', '-')).toBe(true);
    // потомок меньшего старшинства: скобки с обеих сторон
    expect(requiresParentheses('*', 'left', '+')).toBe(true);
    expect(requiresParentheses('/', 'right', '+')).toBe(true);
    // левый потомок равного старшинства: левоассоциативность защищает дерево
    expect(requiresParentheses('-', 'left', '+')).toBe(false);
    expect(requiresParentheses('*', 'left', '/')).toBe(false);
  });

  it('все следствия аксиом зерна R0 удовлетворяют правилу связанных скобок', () => {
    for (const axiom of SEED_AXIOM_TABLE) {
      for (const consequence of axiom.consequences) {
        for (const form of [consequence.inputForm, consequence.outputForm]) {
          const report = verifyBoundParenRule(form);
          expect(
            report.ok,
            `${axiom.id} '${form}': ${report.violations.map(v => v.detail).join('; ')}`,
          ).toBe(true);
        }
      }
    }
  });
});
