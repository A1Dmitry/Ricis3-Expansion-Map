/**
 * RICIS SEED — таблица исходного зерна (поколение R0).
 *
 * Источник формулировок: `AXIOMS_AND_TEST_FAILURES.md` (законы L0/L1/L1C1/L1C2,
 * протоколы SP1–SP4, аксиомы A1–A10) плюс мета-аксиома расширяемости A11.
 *
 * Таблица содержит ТОЛЬКО данные: идентичность аксиомы (отпечаток) вычисляется
 * детерминированно в `ricisSeed.domain.ts`, поэтому таблица остаётся проверяемой
 * человеком и не может «подменить» аксиому перестановкой полей.
 */

import type { AxiomId, AxiomLayer, SingularityClass } from './contracts';

export interface SeedAxiomDefinition {
  readonly id: AxiomId;
  readonly layer: AxiomLayer;
  /** Снята в v7.7/v7.9: сохраняется как историческая запись, но не входит в активное зерно R0. */
  readonly deprecated?: boolean;
  /** Каноническая ASCII-форма утверждения — используется для отпечатка. */
  readonly statement: string;
  /** Отображение для человека (LaTeX, KaTeX). */
  readonly latex: string;
  /**
   * Ограничение применимости по тождеству (L1/SP2).
   * Тождество X - X = 0 и X / X = 1 применяется ДО аксиом сингулярностей,
   * поэтому A4/A5/A7 не применяются к структурно идентичным индексам.
   */
  readonly guard?: string;
  readonly description: string;
  readonly covers: readonly SingularityClass[];
  readonly consequences: readonly { readonly inputForm: string; readonly outputForm: string }[];
}

export const SEED_AXIOM_TABLE: readonly SeedAxiomDefinition[] = Object.freeze([
  {
    id: 'L0',
    layer: 'LAW',
    statement: 'Identity(X) != empty',
    latex: '\\forall \\mathrm{Op},\\ \\mathrm{Identity}(X) \\neq \\emptyset',
    description: 'Абсолютная непрерывность: ни одна операция и ни один уровень рекурсии не разрушает идентичность.',
    covers: [],
    consequences: [],
  },
  {
    id: 'L1',
    layer: 'LAW',
    statement: 'X / X = 1',
    latex: '\\frac{X}{X} = 1',
    description:
      'Принцип тождества. Онтологический корень X = X: X/X = 1 и X-X = 0. ' +
      'Тождество применяется ДО аксиом сингулярностей (SP2): структурно идентичные ' +
      'операнды сворачиваются по L1, а не по A4/A5/A7.',
    covers: ['ZERO_OVER_ZERO'],
    consequences: [
      { inputForm: 'X/X', outputForm: '1' },
      { inputForm: 'X-X', outputForm: '0' },
    ],
  },
  {
    id: 'L1C1',
    layer: 'LAW',
    statement: 'Structure(X) preserved under any algebraic map',
    latex: 'T(X)\\ \\text{сохраняется при отображениях}',
    description: 'Сохранение структуры: структурная информация не теряется при алгебраических отображениях.',
    covers: [],
    consequences: [],
  },
  {
    id: 'L1C2',
    layer: 'LAW',
    statement: 'type(X) determines the ontological bound of X',
    latex: 'T(X)\\ \\text{задаёт онтологическую границу}',
    description: 'Тип как идентичность: смешивание несовместимых типов порождает составной монолит.',
    covers: [],
    consequences: [],
  },
  {
    id: 'L1C3',
    layer: 'LAW',
    statement: 'structural equality is decided before evaluation',
    latex: 'A \\equiv B \\text{ решается до вычисления}',
    description: 'Структурное равенство устанавливается до численного оценивания (L1C3 из v7.9).',
    covers: [],
    consequences: [],
  },
  {
    id: 'SP1',
    layer: 'PROTOCOL',
    statement: 'cancel only identical zero factors',
    latex: '\\text{No Total Amnesia: сокращаются только идентичные нули}',
    description: 'Локальность: при раскрытии 0/0 сокращаются только идентичные нулевые факторы, хвост выражения активен.',
    covers: ['ZERO_OVER_ZERO'],
    consequences: [],
  },
  {
    id: 'SP2',
    layer: 'PROTOCOL',
    statement: 'classical reduction before RICIS axioms',
    latex: '\\text{Clean First: редукция до аксиом сингулярностей}',
    description: 'Приоритет редукции: классические упрощения выполняются ДО аксиом RICIS.',
    covers: [],
    consequences: [],
  },
  {
    id: 'SP3',
    layer: 'PROTOCOL',
    statement: '0_F / 0_G = F / G',
    latex: '\\frac{0_F}{0_G} = \\frac{F}{G}',
    description: 'Закон индексов (Weight of Zero): отношение нулей есть отношение порождающих индексов.',
    covers: ['ZERO_OVER_ZERO'],
    consequences: [{ inputForm: '0_F/0_G', outputForm: 'F/G' }],
  },
  {
    id: 'SP4',
    layer: 'PROTOCOL',
    statement: 'singularity indexed by parent expression E(x)|x=a',
    latex: 'SP4(E, a) = E(x)\\mid_{x=a}',
    description: 'Семантический индекс: индексирование по самому выражению, а не по скалярному значению 0.',
    covers: [],
    consequences: [],
  },
  {
    id: 'SP5',
    layer: 'PROTOCOL',
    statement: 'a*cos(theta)+b*sin(theta) -> r*cos(theta-phi)',
    latex: 'a\\cos\\theta + b\\sin\\theta \\to r\\cos(\\theta-\\phi),\ r=\\sqrt{a^2+b^2}',
    description:
      'Тригонометрическая полярная пре-нормализация (SP5): приводится ДО SP4-индексирования, ' +
      'чтобы родительское выражение было каноническим.',
    covers: [],
    consequences: [],
  },
  {
    id: 'P1',
    layer: 'PROTOCOL',
    statement: 'Limit, NumericalApproximation, LHopital notin Resolve_RICIS',
    latex: '\\lim,\\ \\text{NumericalApproximation},\\ \\text{LHopital} \\notin \\mathrm{Resolve\\_RICIS}',
    description:
      'Прямое структурное разрешение (P1): внутри Resolve_RICIS запрещены аналитические пределы, ' +
      'численные приближения и правило Лопиталя, включая рекурсивные случаи.',
    covers: [],
    consequences: [],
  },
  {
    id: 'A1',
    layer: 'AXIOM',
    statement: 'F / 0 -> inf_F',
    latex: '\\frac{F}{0} \\to \\infty_F',
    description: 'Информационное сохранение числителя в индексе бесконечности (F != 0).',
    covers: ['SCALAR_OVER_ZERO'],
    consequences: [{ inputForm: 'F/0', outputForm: 'inf_F' }],
  },
  {
    id: 'A2',
    layer: 'AXIOM',
    statement: 'inf_0 == 1',
    latex: '\\infty_0 \\equiv 1',
    description: 'Бесконечность с нулевым индексом тождественно равна единице.',
    covers: [],
    consequences: [{ inputForm: 'inf_0', outputForm: '1' }],
  },
  {
    id: 'A3',
    layer: 'AXIOM',
    deprecated: true,
    statement: '0_F != 0_G',
    latex: '0_F \\neq 0_G',
    description:
      'Различные порождающие выражения дают неэквивалентные нули при F != G. ' +
      'СНЯТА в v7.7/v7.9 (см. AXIOMS.deprecated единого документа): сохраняется как историческая запись, ' +
      'но не входит в активное зерно R0.',
    covers: [],
    consequences: [],
  },
  {
    id: 'A4',
    layer: 'AXIOM',
    statement: '0_F / 0_G = F / G',
    latex: '\\frac{0_F}{0_G} = \\frac{F}{G}',
    description: 'Раскрытие отношения индексированных нулей (после SP2 и SP4).',
    guard: 'Применяется, только если NF(F) != NF(G): при NF(F) = NF(G) работает тождество L1 (X/X = 1).',
    covers: ['ZERO_OVER_ZERO'],
    consequences: [{ inputForm: '0_F/0_G', outputForm: 'F/G' }],
  },
  {
    id: 'A5',
    layer: 'AXIOM',
    statement: 'inf_F / inf_G = F / G',
    latex: '\\frac{\\infty_F}{\\infty_G} = \\frac{F}{G}',
    description: 'Раскрытие отношения индексированных бесконечностей.',
    guard: 'Применяется, только если NF(F) != NF(G): при NF(F) = NF(G) работает тождество L1 (X/X = 1).',
    covers: ['INF_OVER_INF'],
    consequences: [{ inputForm: 'inf_F/inf_G', outputForm: 'F/G' }],
  },
  {
    id: 'A6',
    layer: 'AXIOM',
    statement: '0_F * inf_G = F * G',
    latex: '0_F \\times \\infty_G = F \\cdot G',
    description: 'Геометрический мост: косое произведение ортогональных векторов в R^2_RICIS, O(1).',
    covers: ['ZERO_TIMES_INF'],
    consequences: [{ inputForm: '0_F*inf_G', outputForm: 'F*G' }],
  },
  {
    id: 'A7',
    layer: 'AXIOM',
    statement: 'inf_F - inf_G = inf_(F - G)',
    latex: '\\infty_F - \\infty_G = \\infty_{F - G}',
    description: 'Вычитание индексированных бесконечностей.',
    guard:
      'Применяется, только если NF(F) != NF(G): при NF(F) = NF(G) работает тождество L1 ' +
      '(inf_F - inf_F = 0), а не цепочка A7 -> inf_0 -> A2 -> 1.',
    covers: ['INF_MINUS_INF'],
    consequences: [{ inputForm: 'inf_F-inf_G', outputForm: 'inf_(F-G)' }],
  },
  {
    id: 'A8',
    layer: 'AXIOM',
    statement: '0_F - 0_G = 0_(F - G)',
    latex: '0_F - 0_G = 0_{F - G}',
    description: 'Вычитание индексированных нулей.',
    covers: ['ZERO_MINUS_ZERO'],
    consequences: [{ inputForm: '0_F-0_G', outputForm: '0_(F-G)' }],
  },
  {
    id: 'A9',
    layer: 'AXIOM',
    statement: 'F * 0 = 0_F',
    latex: 'F \\cdot 0 = 0_F',
    description: 'Умножение скаляра на чистый ноль порождает индексированный ноль.',
    covers: ['SCALAR_TIMES_ZERO'],
    consequences: [{ inputForm: 'F*0', outputForm: '0_F' }],
  },
  {
    id: 'A10',
    layer: 'AXIOM',
    statement: 'F / 0 = inf_F',
    latex: '\\frac{F}{0} = \\infty_F',
    description: 'Деление скаляра на ноль порождает индексированную бесконечность.',
    covers: ['SCALAR_OVER_ZERO'],
    consequences: [{ inputForm: 'F/0', outputForm: 'inf_F' }],
  },
  {
    id: 'A11',
    layer: 'META_AXIOM',
    statement: 'RICIS_(n+1) = Ric.ExpandTo(RICIS_n, Resolve(U_n))',
    latex: 'R_{n+1} = \\operatorname{Ric.ExpandTo}\\!\\left(R_n,\\; \\operatorname{Resolve}(U_n)\\right)',
    description:
      'МЕТА-АКСИОМА РАСШИРЯЕМОСТИ. Разрешает системе порождать новые доказанные правила: ' +
      'если U неразрешимо в R(n), а Resolve(U) дал ДОКАЗАННОЕ разрешение, то ExpandTo допускает его в R(n+1). ' +
      'A11 — это правило над системой правил, а не одиннадцатая формула рядом с A1…A10.',
    covers: [],
    consequences: [],
  },
]);
