/**
 * ============================================================================
 * ОРКЕСТРАЦИЯ РЕШЕНИЯ ПРОБЛЕМЫ ДЛЯ УЗЛОВ КАРТЫ (RICIS-III)
 *
 * Канонический источник: `docs/00-governance/RICIS_PROOF_ORCHESTRATION_TEMPLATE.md`
 * (5 стадий: PARSING_AND_L1_CHECK → AXIOMATIC_REDUCTION → LEAN_CODEGEN →
 *  GATEWAY_DISPATCH → TRUST_VALIDATION) и `AGENTS.md` §10 + §12.
 *
 * ЗАЧЕМ ЭТО НУЖНО
 * ---------------
 * Узлы карты, добавленные авто-генерацией (`registry-100…registry-120`) и
 * декомпозицией открытых задач (`task-*`), были помечены `resolved`, а их LaTeX
 * озаглавлен «RICIS-III Proof: <открытая задача>» — при том что ядровой прогон
 * подтверждает только структурную редукцию в AST (F-05, E-03). Настоящий модуль
 * проводит КАЖДЫЙ такой узел через пять стадий оркестрации и записывает
 * честный ПРИМЕНИМЫЙ результат:
 *
 *   1. PARSING_AND_L1_CHECK — типирование утверждения узла (свободный AST);
 *   2. AXIOMATIC_REDUCTION — какой закон резолвера (A4/A5/A6/A7/A10/SP4/L1)
 *      действительно покрывает сингулярное ядро узла;
 *   3. LEAN_CODEGEN — какой существующий артефакт и какая его теорема несут
 *      эту редукцию (или: контракт/спецификация без ядрового носителя);
 *   4. GATEWAY_DISPATCH — фактический прогон ядра, в котором артефакт получил
 *      статус (номер прогона обязан быть записан в реестре);
 *   5. TRUST_VALIDATION — решение E-03: `resolved` только для утверждения,
 *      которое подтверждено применимым evidence; внешняя задача остаётся
 *      INFORMAL и НЕ выдаётся за решённую.
 *
 * ГРАНИЦА ПРАВ
 * ------------
 * Модуль НЕ переписывает математическое ядро и не вводит новых аксиом: он
 * только связывает формулировки узла с уже прогонёнными теоремами и снимает
 * переоценку. Формулировки внешних задач живут ТОЛЬКО в поле
 * `informalExternalClaim` с префиксом `INFORMAL:`.
 *
 * ДЕТЕРМИНИРОВАННОСТЬ
 * -------------------
 * `src/model/initialMap.ts` для управляемых узлов регенерируется скриптом
 * `scripts/applyNodeClaimOrchestration.ts`; расхождение дерева и плана —
 * exit 1 (`--check`), как у генераторов Lean-производных.
 */
import type { NodeState, ProblemNode, Proof, ProofStep } from './types';

/** Канонический DOI спецификации Lean 4 (совпадает с `LEAN_SPEC_URL` рисис-ядра). */
export const ORCHESTRATION_LEAN_SPEC_DOI = '10.5281/zenodo.21529989';

export type NodeClaimClass =
  /** Ядровой прогон подтверждает утверждение узла (структурная формулировка). */
  | 'KERNEL_BACKED_STRUCTURAL'
  /** Предмет узла — открытая внешняя задача; узел хранит только структурный фрагмент. */
  | 'OPEN_EXTERNAL_PROBLEM'
  /** Предмет узла — классический результат вне ядрового пути этого репозитория. */
  | 'CLASSICAL_RESULT_EXTERNAL'
  /** Узел — спецификация/контракт (что именно требуется), а не решение задачи. */
  | 'CONTRACT_SPECIFICATION'
  /** Утверждение проверяется прогоном модульных тестов репозитория, не ядром Lean. */
  | 'ENGINE_EVIDENCE';

export interface NodeClaimEvidence {
  readonly kind: 'KERNEL_RUN' | 'CONTRACT_ONLY' | 'REPO_TEST_RUN';
  /** Артефакт из `artifacts/proofs/core-checks/kernel-findings.json`. */
  readonly artifactId?: string;
  /** Квалифицированное имя теоремы, существующей в `#print axioms` этого артефакта. */
  readonly theorem?: string;
  /** Номер прогона, в котором артефакт получил статус (обязан быть в цепочке реестра). */
  readonly run?: number;
  /** Модуль прикладного кода для класса ENGINE_EVIDENCE. */
  readonly modulePath?: string;
  /** Тест модуля — фактический канал проверки для класса ENGINE_EVIDENCE. */
  readonly testPath?: string;
}

export interface NodeClaimPlanEntry {
  readonly nodeId: string;
  readonly claimClass: NodeClaimClass;
  /** Заголовок узла после оркестрации (снимает переоценку в самом имени). */
  readonly title: string;
  /** Первая строка описания: что именно открыто / что узел специфицирует. */
  readonly statusLine: string;
  /** Сингулярное ядро узла на языке RICIS (SP4-индекс). */
  readonly singularityClass: string;
  /** Тип AST, в котором живёт формулировка (конструкторы неинтерпретированы). */
  readonly astType: string;
  /** `targetFunction` после оркестрации: структурная формулировка, а не «Resolve()». */
  readonly structuralStatement: string;
  /** Тело закона резолвера (стадия AXIOMATIC_REDUCTION). */
  readonly lawStatement: string;
  /** Чем закон инвариантен (стадия AXIOMATIC_REDUCTION). */
  readonly invarianceStatement: string;
  /** Текст «ЧТО ФАКТИЧЕСКИ ПОДТВЕРЖДЕНО». */
  readonly verifiedText: string;
  /** Текст «ЧТО НЕ УТВЕРЖДАЕТСЯ» — обязательная граница заявления. */
  readonly boundaryText: string;
  /** Внешняя задача/предмет; для INFORMAL-поля. */
  readonly externalProblem?: string;
  readonly evidence: NodeClaimEvidence;
  readonly outcome: { readonly state: NodeState; readonly ricisSolvable: boolean };
  /** Решение владельца, разрешающее `resolved` вне правила класса (L9 и т. п.). */
  readonly ownerDecision?: { readonly ref: string; readonly date: string; readonly note: string };
}

const TEMPLATE = 'artifacts/proofs/ricis-universal-orchestration-template.lean';
/** Прогон, в котором универсальный шаблон принят ядром (цепочка реестра, priorCoreRun). */
const TEMPLATE_RUN = 34891262489;

const law = (theorem: string) => ({ kind: 'KERNEL_RUN' as const, artifactId: 'ricis-universal-orchestration-template', theorem, run: TEMPLATE_RUN });

/**
 * План оркестрации для узлов, добавленных/изменённых последними тактами
 * (авто-генерация registry-100…registry-120 и декомпозиция `task-*`).
 *
 * Узлы, уже отработанные тактом TASK-05 (`real-catalog-3`, `registry-117`,
 * `riemann-complex-pole-regularizer`), в этот список не входят: их записи
 * хранятся в дереве как эталон формата и проверяются отдельным стражем
 * (`REFERENCE_ORCHESTRATED_NODE_IDS`).
 */
export const NODE_CLAIM_ORCHESTRATION_PLAN: readonly NodeClaimPlanEntry[] = [
  {
    nodeId: 'registry-100',
    claimClass: 'OPEN_EXTERNAL_PROBLEM',
    title: 'abc-гипотеза: структурная редукция отношения индексированных нулей (внешняя задача открыта)',
    statusLine: 'ВНЕШНЯЯ ЗАДАЧА ОТКРЫТА',
    singularityClass: 'индексированное отношение нулей 0_F / 0_G при критическом делительном балансе',
    astType: 'RExpr',
    structuralStatement: 'StructuralReduce(0_F / 0_G) = div F G in RExpr AST',
    lawStatement: 'resolveRICIS (RExpr.div (RExpr.zeroF F) (RExpr.zeroF G)) = RExpr.div F G',
    invarianceStatement: 'Редукция зависит только от порождающих индексов F, G и не зависит от полезной нагрузки',
    verifiedText:
      'ядровая теорема RICIS_Template.A4_indexed_zero_div (артефакт ricis-universal-orchestration-template, прогон 34891262489, exit 0, без sorryAx): класс неопределённости 0_F / 0_G разрешается в порождающих индексах.',
    boundaryText:
      'abc-гипотеза не доказана и не затрагивается: в RExpr нет ни радикала rad(abc), ни асимптотических оценок делимости; редукция — структурная, а не арифметическая.',
    externalProblem: 'abc-гипотеза (радикал rad(abc) и критические границы делимости)',
    evidence: law('RICIS_Template.A4_indexed_zero_div'),
    outcome: { state: 'partial', ricisSolvable: false },
  },
  {
    nodeId: 'registry-101',
    claimClass: 'OPEN_EXTERNAL_PROBLEM',
    title: 'Гипотеза Гольдбаха: структурная редукция аддитивного баланса (внешняя задача открыта)',
    statusLine: 'ВНЕШНЯЯ ЗАДАЧА ОТКРЫТА',
    singularityClass: 'аддитивный баланс как отношение индексированных нулей 0_sum / 0_primes',
    astType: 'RExpr',
    structuralStatement: 'StructuralReduce(0_sum / 0_primes) = div Sum Primes in RExpr AST',
    lawStatement: 'resolveRICIS (RExpr.div (RExpr.zeroF F) (RExpr.zeroF G)) = RExpr.div F G',
    invarianceStatement: 'Редукция не зависит от вложенности: индекс SP4 сохраняется на любом уровне дерева',
    verifiedText:
      'ядровая теорема RICIS_Template.A4_indexed_zero_div (артефакт ricis-universal-orchestration-template, прогон 34891262489, exit 0): отношение индексированных нулей разрешается в индексах.',
    boundaryText:
      'гипотеза Гольдбаха не доказана: узел не содержит ни решета простых, ни доказательства непустоты пересечения для всех чётных 2k > 2. Требуемый монолит порядка 2 остаётся спецификацией (task-goldbach-sieve-monolith), а сама задача зарегистрирована как UNRESOLVED_CHALLENGE в src/model/taskResolutionEngine.ts.',
    externalProblem: 'гипотеза Гольдбаха (разложение всех чётных 2k > 2 в сумму двух простых)',
    evidence: law('RICIS_Template.A4_indexed_zero_div'),
    outcome: { state: 'partial', ricisSolvable: false },
  },
  {
    nodeId: 'registry-102',
    claimClass: 'OPEN_EXTERNAL_PROBLEM',
    title: 'Гипотеза о простых близнецах: структурная редукция разностного оператора (внешняя задача открыта)',
    statusLine: 'ВНЕШНЯЯ ЗАДАЧА ОТКРЫТА',
    singularityClass: 'разность индексированных бесконечностей ∞_F − ∞_G дискретной плоскости',
    astType: 'RExpr',
    structuralStatement: 'StructuralReduce(∞_F − ∞_G) = infF (sub F G) in RExpr AST',
    lawStatement: 'resolveRICIS (RExpr.sub (RExpr.infF F) (RExpr.infF G)) = RExpr.infF (RExpr.sub F G)',
    invarianceStatement: 'Разностный оператор применяется к индексам, а не к «бесконечности» как значению',
    verifiedText:
      'ядровая теорема RICIS_Template.A7_inf_sub (артефакт ricis-universal-orchestration-template, прогон 34891262489, exit 0): разность индексированных бесконечностей остаётся индексированной.',
    boundaryText:
      'бесконечность множества пар близнецов не доказана: узел не содержит глобального аналитического функционала плотности; Δ_plane — оператор над индексами AST, а не мера множества простых.',
    externalProblem: 'гипотеза о бесконечности пар простых (p, p+2)',
    evidence: law('RICIS_Template.A7_inf_sub'),
    outcome: { state: 'partial', ricisSolvable: false },
  },
  {
    nodeId: 'registry-103',
    claimClass: 'OPEN_EXTERNAL_PROBLEM',
    title: 'Нечётные совершенные числа: структурная редукция делительного отношения (внешняя задача открыта)',
    statusLine: 'ВНЕШНЯЯ ЗАДАЧА ОТКРЫТА',
    singularityClass: 'отношение индексированных нулей σ(n) − 2n = 0_F относительно 0_G',
    astType: 'RExpr',
    structuralStatement: 'StructuralReduce(0_σ / 0_n) = div Sigma N in RExpr AST',
    lawStatement: 'resolveRICIS (RExpr.div (RExpr.zeroF F) (RExpr.zeroF G)) = RExpr.div F G',
    invarianceStatement: 'Редукция не зависит от конкретной арифметической функции, задающей индексы',
    verifiedText:
      'ядровая теорема RICIS_Template.A4_indexed_zero_div (артефакт ricis-universal-orchestration-template, прогон 34891262489, exit 0): делительное отношение разрешается в индексах.',
    boundaryText:
      'существование нечётного совершенного числа не опровергнуто и не доказано: σ(n) = 2n в RExpr не интерпретируется как арифметическая функция делителей.',
    externalProblem: 'существование нечётных совершенных чисел',
    evidence: law('RICIS_Template.A4_indexed_zero_div'),
    outcome: { state: 'partial', ricisSolvable: false },
  },
  {
    nodeId: 'registry-104',
    claimClass: 'OPEN_EXTERNAL_PROBLEM',
    title: 'Гипотеза Эрдёша о разрывах простых: структурная редукция нормированных разрывов (внешняя задача открыта)',
    statusLine: 'ВНЕШНЯЯ ЗАДАЧА ОТКРЫТА',
    singularityClass: 'отношение индексированных бесконечностей ∞_F / ∞_G в асимптотике разрывов',
    astType: 'RExpr',
    structuralStatement: 'StructuralReduce(∞_gap / ∞_log) = div Gap Log in RExpr AST',
    lawStatement: 'resolveRICIS (RExpr.div (RExpr.infF F) (RExpr.infF G)) = RExpr.div F G',
    invarianceStatement: 'Отношение применяется к нормирующим индексам, а не к предельным значениям',
    verifiedText:
      'ядровая теорема RICIS_Template.A5_inf_div (артефакт ricis-universal-orchestration-template, прогон 34891262489, exit 0): отношение индексированных бесконечностей разрешается в индексах.',
    boundaryText:
      'асимптотическое распределение нормированных разрывов не установлено: предельный переход в RICIS запрещён (P1), поэтому узел не может утверждать асимптотику.',
    externalProblem: 'гипотеза Эрдёша о распределении нормированных разрывов между простыми',
    evidence: law('RICIS_Template.A5_inf_div'),
    outcome: { state: 'partial', ricisSolvable: false },
  },
  {
    nodeId: 'registry-105',
    claimClass: 'CLASSICAL_RESULT_EXTERNAL',
    title: 'Теорема Грина — Тао: классический результат вне ядрового пути (структурная рамка)',
    statusLine: 'КЛАССИЧЕСКИЙ РЕЗУЛЬТАТ ВНЕ ЯДРОВОГО ПУТИ ЭТОГО РЕПОЗИТОРИЯ',
    singularityClass: 'класс расходимости прогрессий: ∞_progressions относительно ∞_primes',
    astType: 'RExpr',
    structuralStatement: 'StructuralReduce(∞_AP / ∞_primes) = div AP Primes in RExpr AST',
    lawStatement: 'resolveRICIS (RExpr.div (RExpr.infF F) (RExpr.infF G)) = RExpr.div F G',
    invarianceStatement: 'Рамка применима к индексам, но не заменяет комбинаторно-аналитическое доказательство',
    verifiedText:
      'ядровая теорема RICIS_Template.A5_inf_div (артефакт ricis-universal-orchestration-template, прогон 34891262489, exit 0) даёт символьную рамку класса.',
    boundaryText:
      'теорема Грина — Тао (2004) — классический результат, доказанный вне этого репозитория; узел его не проверяет и не воспроизводит. Ядровой путь репозитория подтверждает только символьную рамку, а не саму теорему.',
    externalProblem: 'теорема Грина — Тао о произвольно длинных арифметических прогрессиях из простых чисел',
    evidence: law('RICIS_Template.A5_inf_div'),
    outcome: { state: 'partial', ricisSolvable: false },
  },
  {
    nodeId: 'registry-106',
    claimClass: 'CLASSICAL_RESULT_EXTERNAL',
    title: 'Суммы квадратов: классический результат вне ядрового пути (структурная рамка)',
    statusLine: 'КЛАССИЧЕСКИЙ РЕЗУЛЬТАТ ВНЕ ЯДРОВОГО ПУТИ ЭТОГО РЕПОЗИТОРИЯ',
    singularityClass: 'отношение индексированных нулей 0_n / 0_squares при разложении',
    astType: 'RExpr',
    structuralStatement: 'StructuralReduce(0_n / 0_squares) = div N Squares in RExpr AST',
    lawStatement: 'resolveRICIS (RExpr.div (RExpr.zeroF F) (RExpr.zeroF G)) = RExpr.div F G',
    invarianceStatement: 'Редукция не зависит от выбора разложения на квадраты',
    verifiedText:
      'ядровая теорема RICIS_Template.A4_indexed_zero_div (артефакт ricis-universal-orchestration-template, прогон 34891262489, exit 0).',
    boundaryText:
      'теоремы Лагранжа и Лежандра о суммах квадратов — классические результаты, доказанные вне этого репозитория; узел не содержит их формального доказательства и не заявляет его.',
    externalProblem: 'теоремы Лагранжа (четыре квадрата) и Лежандра (три квадрата)',
    evidence: law('RICIS_Template.A4_indexed_zero_div'),
    outcome: { state: 'partial', ricisSolvable: false },
  },
  {
    nodeId: 'registry-107',
    claimClass: 'OPEN_EXTERNAL_PROBLEM',
    title: 'Гипотеза Коллатца: L0-инвариант редукции вместо решения динамической системы (внешняя задача открыта)',
    statusLine: 'ВНЕШНЯЯ ЗАДАЧА ОТКРЫТА',
    singularityClass: 'класс L0-непрерывности при устранении самоделения в итерационной траектории',
    astType: 'RExpr',
    structuralStatement: 'L0Continuity(StructuralReduce(divSelf E)) in RExpr AST',
    lawStatement: 'resolveRICIS (RExpr.divSelf e) = RExpr.one',
    invarianceStatement: 'L0: редукция не создаёт молчаливого разрыва — значение сохраняется при устранении самоделения',
    verifiedText:
      'ядровая теорема RICIS_Template.L0_continuity_divSelf (артефакт ricis-universal-orchestration-template, прогон 34891262489, exit 0): устранение самоделения L0-непрерывно.',
    boundaryText:
      'гипотеза Коллатца не доказана: ветвление дерева обратных предков, отсутствие нетривиальных циклов и ограниченность роста траекторий здесь не рассматриваются; монолит CollatzTreeMonolith остаётся спецификацией.',
    externalProblem: 'гипотеза Коллатца (3n + 1)',
    evidence: law('RICIS_Template.L0_continuity_divSelf'),
    outcome: { state: 'partial', ricisSolvable: false },
  },
  {
    nodeId: 'registry-108',
    claimClass: 'OPEN_EXTERNAL_PROBLEM',
    title: 'Конечновременной blow-up в NLS и NLW: структурный мост 0·∞ (внешняя задача открыта)',
    statusLine: 'ВНЕШНЯЯ ЗАДАЧА ОТКРЫТА',
    singularityClass: 'произведение индексированного нуля на индексированную бесконечность 0_smooth · ∞_collapse',
    astType: 'RExpr',
    structuralStatement: 'StructuralReduce(0_smooth · ∞_collapse) = mul Smooth Collapse in RExpr AST',
    lawStatement: 'resolveRICIS (RExpr.mul (RExpr.zeroF F) (RExpr.infF G)) = RExpr.mul F G',
    invarianceStatement: 'Мост A6 применим к индексам и не зависит от вложенности операторов',
    verifiedText:
      'ядровая теорема RICIS_Template.A6_geometric_realization (артефакт ricis-universal-orchestration-template, прогон 34891262489, exit 0): неопределённость 0_F · ∞_G разрешается геометрической мерой.',
    boundaryText:
      'конечновременной blow-up не доказан и не опровергнут: RExpr не интерпретируется как пространство функций, а t* не входит в формулировку.',
    externalProblem: 'образование сингулярностей за конечное время в NLS/NLW',
    evidence: law('RICIS_Template.A6_geometric_realization'),
    outcome: { state: 'partial', ricisSolvable: false },
  },
  {
    nodeId: 'registry-109',
    claimClass: 'CLASSICAL_RESULT_EXTERNAL',
    title: 'Сингулярности геометрических потоков: классический результат вне ядрового пути (структурный мост)',
    statusLine: 'КЛАССИЧЕСКИЙ РЕЗУЛЬТАТ ВНЕ ЯДРОВОГО ПУТИ ЭТОГО РЕПОЗИТОРИЯ',
    singularityClass: 'произведение нуля «шея» на бесконечность «щипок»: 0_neck · ∞_pinch',
    astType: 'RExpr',
    structuralStatement: 'StructuralReduce(0_neck · ∞_pinch) = mul Neck Pinch in RExpr AST',
    lawStatement: 'resolveRICIS (RExpr.mul (RExpr.zeroF F) (RExpr.infF G)) = RExpr.mul F G',
    invarianceStatement: 'Мост A6 применяется к индексам кривизны, а не к метрике многообразия',
    verifiedText:
      'ядровая теорема RICIS_Template.A6_geometric_realization (артефакт ricis-universal-orchestration-template, прогон 34891262489, exit 0).',
    boundaryText:
      'классификация сингулярностей потока Риччи и потока средней кривизны (результаты Гамильтона — Перельмана и последователей) — классические результаты вне этого репозитория; узел их не воспроизводит, метрика многообразия в RExpr отсутствует.',
    externalProblem: 'классификация сингулярностей потока Риччи и потока средней кривизны',
    evidence: law('RICIS_Template.A6_geometric_realization'),
    outcome: { state: 'partial', ricisSolvable: false },
  },
  {
    nodeId: 'registry-110',
    claimClass: 'OPEN_EXTERNAL_PROBLEM',
    title: 'Blow-up в 3D уравнениях Эйлера и MHD: структурный мост (внешняя задача открыта)',
    statusLine: 'ВНЕШНЯЯ ЗАДАЧА ОТКРЫТА',
    singularityClass: 'произведение вихревого нуля на бесконечность растяжения: 0_vortex · ∞_stretch',
    astType: 'RExpr',
    structuralStatement: 'StructuralReduce(0_vortex · ∞_stretch) = mul Vortex Stretch in RExpr AST',
    lawStatement: 'resolveRICIS (RExpr.mul (RExpr.zeroF F) (RExpr.infF G)) = RExpr.mul F G',
    invarianceStatement: 'Мост применяется к индексам поля, а не к значениям завихрённости',
    verifiedText:
      'ядровая теорема RICIS_Template.A6_geometric_realization (артефакт ricis-universal-orchestration-template, прогон 34891262489, exit 0).',
    boundaryText:
      'взрыв градиента скорости за конечное время в 3D Эйлере/MHD не доказан и не опровергнут: узел не содержит анализа завихрённости в функциональных пространствах.',
    externalProblem: 'blow-up решений 3D уравнений Эйлера и МГД',
    evidence: law('RICIS_Template.A6_geometric_realization'),
    outcome: { state: 'partial', ricisSolvable: false },
  },
  {
    nodeId: 'registry-111',
    claimClass: 'OPEN_EXTERNAL_PROBLEM',
    title: 'Вырожденные параболические уравнения: структурная редукция отношения нулей (внешняя задача открыта)',
    statusLine: 'ВНЕШНЯЯ ЗАДАЧА ОТКРЫТА',
    singularityClass: 'отношение индексированных нулей на фронте диффузии: 0_front / 0_diffusion',
    astType: 'RExpr',
    structuralStatement: 'StructuralReduce(0_front / 0_diffusion) = div Front Diffusion in RExpr AST',
    lawStatement: 'resolveRICIS (RExpr.div (RExpr.zeroF F) (RExpr.zeroF G)) = RExpr.div F G',
    invarianceStatement: 'Редукция не зависит от геометрии фронта — только от индексов',
    verifiedText:
      'ядровая теорема RICIS_Template.A4_indexed_zero_div (артефакт ricis-universal-orchestration-template, прогон 34891262489, exit 0).',
    boundaryText:
      'потеря регулярности на фронтах не доказана и не опровергнута: RExpr не содержит уравнений в частных производных и понятия обобщённого решения.',
    externalProblem: 'потеря регулярности на фронтах вырождающихся параболических уравнений',
    evidence: law('RICIS_Template.A4_indexed_zero_div'),
    outcome: { state: 'partial', ricisSolvable: false },
  },
  {
    nodeId: 'registry-112',
    claimClass: 'OPEN_EXTERNAL_PROBLEM',
    title: 'Гамильтоновы PDE и динамика вихрей: структурный мост (внешняя задача открыта)',
    statusLine: 'ВНЕШНЯЯ ЗАДАЧА ОТКРЫТА',
    singularityClass: 'произведение нуля фазового объёма на бесконечность вихревой плотности: 0_phase · ∞_vortex',
    astType: 'RExpr',
    structuralStatement: 'StructuralReduce(0_phase · ∞_vortex) = mul Phase Vortex in RExpr AST',
    lawStatement: 'resolveRICIS (RExpr.mul (RExpr.zeroF F) (RExpr.infF G)) = RExpr.mul F G',
    invarianceStatement: 'Мост применяется к индексам, симплектическая структура не моделируется',
    verifiedText:
      'ядровая теорема RICIS_Template.A6_geometric_realization (артефакт ricis-universal-orchestration-template, прогон 34891262489, exit 0).',
    boundaryText:
      'поведение сингулярностей фазового пространства (волны на воде, точечные вихри) не установлено: гамильтонова механика в RExpr не формализована.',
    externalProblem: 'сингулярности фазового пространства в гамильтоновых PDE и динамике точечных вихрей',
    evidence: law('RICIS_Template.A6_geometric_realization'),
    outcome: { state: 'partial', ricisSolvable: false },
  },
  {
    nodeId: 'registry-113',
    claimClass: 'CLASSICAL_RESULT_EXTERNAL',
    title: 'Полулинейные и квазилинейные волновые уравнения: классический результат вне ядрового пути',
    statusLine: 'КЛАССИЧЕСКИЙ РЕЗУЛЬТАТ ВНЕ ЯДРОВОГО ПУТИ ЭТОГО РЕПОЗИТОРИЯ',
    singularityClass: 'произведение нуля регулярности на бесконечность производного роста: 0_shock · ∞_derivative',
    astType: 'RExpr',
    structuralStatement: 'StructuralReduce(0_shock · ∞_derivative) = mul Shock Derivative in RExpr AST',
    lawStatement: 'resolveRICIS (RExpr.mul (RExpr.zeroF F) (RExpr.infF G)) = RExpr.mul F G',
    invarianceStatement: 'Мост применяется к индексам, а не к разрывным решениям',
    verifiedText:
      'ядровая теорема RICIS_Template.A6_geometric_realization (артефакт ricis-universal-orchestration-template, прогон 34891262489, exit 0).',
    boundaryText:
      'образование ударных волн и критический производный blow-up — классические результаты теории гиперболических уравнений, доказанные вне этого репозитория; узел их не воспроизводит.',
    externalProblem: 'образование ударных волн и критический производный blow-up',
    evidence: law('RICIS_Template.A6_geometric_realization'),
    outcome: { state: 'partial', ricisSolvable: false },
  },
  {
    nodeId: 'registry-114',
    claimClass: 'CLASSICAL_RESULT_EXTERNAL',
    title: 'Проблема остановки: классический результат теории вычислимости (структурная типизация)',
    statusLine: 'КЛАССИЧЕСКИЙ РЕЗУЛЬТАТ ВНЕ ЯДРОВОГО ПУТИ ЭТОГО РЕПОЗИТОРИЯ',
    singularityClass: 'мета-уровневое типирование: разделение уровня L0 и уровня L1 без коллапса',
    astType: 'RExpr',
    structuralStatement: 'L1Identity(TuringMetaMonolith) — типирование уровня без коллапса уровней (RExpr AST)',
    lawStatement: 'L1: e = e (тождество как проверка типа; уровни не смешиваются)',
    invarianceStatement: 'Типизация уровня не зависит от содержимого программы — только от её страты',
    verifiedText:
      'ядровая теорема RICIS_Template.L1_identity (артефакт ricis-universal-orchestration-template, прогон 34891262489, exit 0; не зависит от аксиом) даёт структурную проверку типизации уровня.',
    boundaryText:
      'неразрешимость проблемы остановки — классический результат Тьюринга (1936), доказанный вне этого репозитория; узел не содержит формализации машин Тьюринга и не воспроизводит диагональное доказательство.',
    externalProblem: 'неразрешимость проблемы остановки (Тьюринг, 1936)',
    evidence: law('RICIS_Template.L1_identity'),
    outcome: { state: 'partial', ricisSolvable: false },
  },
  {
    nodeId: 'registry-115',
    claimClass: 'CLASSICAL_RESULT_EXTERNAL',
    title: 'Континуум-гипотеза: независимость установлена классически (формула 2^ℵ0 = ℵ1 не утверждается)',
    statusLine: 'КЛАССИЧЕСКИЙ РЕЗУЛЬТАТ ВНЕ ЯДРОВОГО ПУТИ ЭТОГО РЕПОЗИТОРИЯ',
    singularityClass: 'индекс родителя как кардинальный индекс: сохранение семантического индекса SP4',
    astType: 'RExpr',
    structuralStatement: 'SP4PreservesParent(semanticIndex F) = zeroF F in RExpr AST',
    lawStatement: 'semanticIndex F = RExpr.zeroF F',
    invarianceStatement: 'Индекс родителя сохраняется при построении семантического индекса',
    verifiedText:
      'ядровая теорема RICIS_Template.SP4_preserves_parent (артефакт ricis-universal-orchestration-template, прогон 34891262489, exit 0; не зависит от аксиом) подтверждает SP4-инвариант.',
    boundaryText:
      'равенство 2^ℵ0 = ℵ1 не доказано и не опровергнуто в ZFC (независимость: Гёдель 1940, Коэн 1963) — классический результат вне этого репозитория. Узел не утверждает равенство кардиналов: прежняя формула узла снята как переоценка.',
    externalProblem: 'континуум-гипотеза (независимость в ZFC: Гёдель, Коэн)',
    evidence: law('RICIS_Template.SP4_preserves_parent'),
    outcome: { state: 'partial', ricisSolvable: false },
  },
  {
    nodeId: 'registry-116',
    claimClass: 'OPEN_EXTERNAL_PROBLEM',
    title: 'Турбулентность и энергетический каскад: структурный мост (внешняя задача открыта)',
    statusLine: 'ВНЕШНЯЯ ЗАДАЧА ОТКРЫТА',
    singularityClass: 'произведение нуля вязкого масштаба на бесконечность каскада: 0_viscous · ∞_cascade',
    astType: 'RExpr',
    structuralStatement: 'StructuralReduce(0_viscous · ∞_cascade) = mul Viscous Cascade in RExpr AST',
    lawStatement: 'resolveRICIS (RExpr.mul (RExpr.zeroF F) (RExpr.infF G)) = RExpr.mul F G',
    invarianceStatement: 'Мост применяется к индексам масштабов, а не к потоку энергии',
    verifiedText:
      'ядровая теорема RICIS_Template.A6_geometric_realization (артефакт ricis-universal-orchestration-template, прогон 34891262489, exit 0).',
    boundaryText:
      'диссипация энергии на подсеточных масштабах не выведена: каскад Колмогорова — физическая гипотеза, не следствие редукции AST.',
    externalProblem: 'энергетический каскад и диссипация на подсеточных масштабах',
    evidence: law('RICIS_Template.A6_geometric_realization'),
    outcome: { state: 'partial', ricisSolvable: false },
  },
  {
    nodeId: 'registry-118',
    claimClass: 'ENGINE_EVIDENCE',
    title: 'Стабилизация градиента LLM: инженерная проверка модуля (не ядровой прогон)',
    statusLine: 'ИНЖЕНЕРНАЯ ПРОВЕРКА: прогон модульных тестов, не ядровой прогон Lean',
    singularityClass: 'произведение нуля шага η на бесконечность нормы градиента: 0_η · ∞_∇L',
    astType: 'RExpr',
    structuralStatement: 'StructuralReduce(0_η · ∞_∇L) = mul Eta GradNorm (стабилизатор градиента)',
    lawStatement: 'RICIS A6-мост внутри Geometric Bridge Engine: 0_η · ∞_∇L = η · ‖∇L‖ без числовых выбросов',
    invarianceStatement: 'L1-идентичность компонент и SP4-индекс сохраняются на всей цепочке фаз -1…6',
    verifiedText:
      'прогон модульных тестов src/services/llmGradient/llmGradientStabilizer.test.ts: сингулярность 0_η · ∞_∇L нейтрализуется без числовых выбросов, вычисление делегируется Geometric Bridge Engine, цепочка TransformationLog непрерывна.',
    boundaryText:
      '«устранение Loss spikes в реальном обучении» не проверено и не утверждается: проверен модуль-стабилизатор и его инварианты, а не поведение конкретной модели на конкретном датасете. Это НЕ ядровое доказательство: ядровой прогон Lean здесь отсутствует, статус узла опирается на прогон тестов репозитория.',
    externalProblem: 'взрывы градиента и числовые выбросы при обучении глубоких сетей (инженерное утверждение)',
    evidence: {
      kind: 'REPO_TEST_RUN',
      modulePath: 'src/services/llmGradient/domain/ricisLlmGradientStabilizer.ts',
      testPath: 'src/services/llmGradient/llmGradientStabilizer.test.ts',
    },
    outcome: { state: 'resolved', ricisSolvable: true },
  },
  {
    nodeId: 'registry-119',
    claimClass: 'OPEN_EXTERNAL_PROBLEM',
    title: 'Рукопись Войнича: структурная редукция самоделения (дешифровка не выполнена)',
    statusLine: 'ВНЕШНЯЯ ЗАДАЧА ОТКРЫТА',
    singularityClass: 'энтропийное самоделение символического текста: divSelf(E)',
    astType: 'RExpr',
    structuralStatement: 'StructuralReduce(divSelf(E)) = one in RExpr AST (не дешифровка)',
    lawStatement: 'resolveRICIS (RExpr.divSelf e) = RExpr.one',
    invarianceStatement: 'Редукция не зависит от длины и алфавита символической последовательности',
    verifiedText:
      'ядровая теорема RICIS_Template.divSelf_one (артефакт ricis-universal-orchestration-template, прогон 34891262489, exit 0): устранение самоделения в AST.',
    boundaryText:
      'дешифровка рукописи Войнича не выполнена и не заявляется: RExpr — свободный символьный язык, семантика исторического текста в нём не представима. Работа по рукописи вне математического ядра (scope-note плана gap-closure).',
    externalProblem: 'дешифровка рукописи Войнича',
    evidence: law('RICIS_Template.divSelf_one'),
    outcome: { state: 'partial', ricisSolvable: false },
  },
  {
    nodeId: 'registry-120',
    claimClass: 'KERNEL_BACKED_STRUCTURAL',
    title: 'Гипотеза Якоби: исправленная структурная формулировка доказана ядром (внешняя гипотеза открыта)',
    statusLine: 'ВНЕШНЯЯ ГИПОТЕЗА ОТКРЫТА: узел несёт доказанное структурное утверждение, а не гипотезу',
    singularityClass: 'детерминантный узел: одношаговый детерминант не спускается в произведения',
    astType: 'RExpr',
    structuralStatement: 'ricisResolveDet (zeroF F) zero zero (infF G) = sub (mul F G) (zeroF zero)',
    lawStatement: 'ricisResolveDet с опуском разрешения в произведения: det-пара достигает A6-стадии и даёт F · G',
    invarianceStatement: 'L1-идентичность сохраняется; утверждение v1 формально опровергнуто для любых F, G',
    verifiedText:
      'ядровой прогон 35404189840 (job kernel-check): производная ricis-jacobian-conjecture-v2.core-check.lean принята — exit 0, без sorryAx, #print axioms чистый для 8 теорем (jacobian_v1_identity_refuted, det_expansion_single_pass, Jacobian_singularity_resolved и др.).',
    boundaryText:
      'гипотеза Якоби для полиномиальных отображений C^n → C^n не доказана и не заявляется: доказано тождество резолвера над AST. Классическое разложение определителя, степени и пределы не рассматриваются (P1). Отказ rfl в прогоне 34870620154 был признаком ложности утверждения v1, а не технической трудностью.',
    externalProblem: 'гипотеза Якоби о полиномиальных автоморфизмах',
    evidence: {
      kind: 'KERNEL_RUN',
      artifactId: 'ricis-jacobian-conjecture-v2',
      theorem: 'Jacobian_singularity_resolved',
      run: 35404189840,
    },
    ownerDecision: {
      ref: 'unblock-l9 / F-01 (owner decision 2026-09-14, узел-уровень 2026-09-18)',
      date: '2026-09-18',
      note: 'Состояние узла registry-120 остаётся resolved: узел означает «структурное утверждение узла доказано ядром», а не «гипотеза Якоби решена». Внешняя гипотеза вынесена в informalExternalClaim и не заявляется.',
    },
    outcome: { state: 'resolved', ricisSolvable: true },
  },
  {
    nodeId: 'task-elem-removable-zero',
    claimClass: 'KERNEL_BACKED_STRUCTURAL',
    title: 'Устранимая сингулярность (x²−4)/(x−2): ядровой закон устранения самоделения',
    statusLine: 'ЯДРОВОЙ ЗАКОН ПОДТВЕРЖДЁН; ЧИСЛОВОЙ ХВОСТ — АРИФМЕТИКА КОНКРЕТНОГО ПРИМЕРА',
    singularityClass: 'устранимая сингулярность как самоделение divSelf(x − 2) — числитель и знаменатель одного порождающего индекса',
    astType: 'RExpr',
    structuralStatement: 'StructuralReduce(divSelf(E)) = one (переход к несингулярному хвосту (x+2))',
    lawStatement: 'resolveRICIS (RExpr.divSelf e) = RExpr.one',
    invarianceStatement: 'Устранение самоделения не зависит от полезной нагрузки и порядка выражения',
    verifiedText:
      'ядровые теоремы RICIS_Template.divSelf_one и RICIS.selfDivision_eliminated (артефакты ricis-universal-orchestration-template и ricis-backend-exact-reduction, прогоны 34891262489, exit 0): самоделение устраняется точно, без предельного перехода.',
    boundaryText:
      'числовое значение 4 — арифметика конкретного примера (2 + 2) после устранения сингулярности, отдельной ядровой теоремы для него нет; предельный переход Коши не используется (P1).',
    evidence: law('RICIS_Template.divSelf_one'),
    outcome: { state: 'resolved', ricisSolvable: true },
  },
  {
    nodeId: 'task-elem-geometric-bridge-a6',
    claimClass: 'KERNEL_BACKED_STRUCTURAL',
    title: 'Геометрический мост A6: ядровой закон 0_F · ∞_G = F · G',
    statusLine: 'ЯДРОВОЙ ЗАКОН ПОДТВЕРЖДЁН; ЧИСЛОВОЙ ПРИМЕР — ПОДСТАНОВКА ИНДЕКСОВ',
    singularityClass: 'произведение индексированного нуля на индексированную бесконечность',
    astType: 'RExpr',
    structuralStatement: 'StructuralReduce(0_F · ∞_G) = mul F G (A6-геометрический мост)',
    lawStatement: 'resolveRICIS (RExpr.mul (RExpr.zeroF F) (RExpr.infF G)) = RExpr.mul F G',
    invarianceStatement: 'Мост не зависит от вложенности и от конкретных значений индексов',
    verifiedText:
      'ядровая теорема RICIS_Template.A6_geometric_realization (артефакт ricis-universal-orchestration-template, прогон 34891262489, exit 0): неопределённость 0_F · ∞_G разрешается геометрической мерой μ(rect F G) = F · G.',
    boundaryText:
      'число 15 для F = 5, G = 3 — арифметическая подстановка в доказанный закон, а не отдельная ядровая теорема; никакого утверждения о физическом измерении узел не несёт.',
    evidence: law('RICIS_Template.A6_geometric_realization'),
    outcome: { state: 'resolved', ricisSolvable: true },
  },
  {
    nodeId: 'task-goldbach-sieve-monolith',
    claimClass: 'CONTRACT_SPECIFICATION',
    title: 'Спецификация монолита решета Гольдбаха (порядок 2) — не доказательство гипотезы',
    statusLine: 'СПЕЦИФИКАЦИЯ (контракт): узел описывает, что именно требуется для решения, а не решение',
    singularityClass: 'требуемый дискретный мультипликативно-аддитивный монолит порядка 2',
    astType: 'RExpr',
    structuralStatement: 'Spec(SieveMonolith_2) = mul Primes Sum — требование монолита, не теорема',
    lawStatement: 'Монолит должен давать 0_sum → ∞_primes через A4-редукцию при сохранении SP4-индекса',
    invarianceStatement: 'Контракт фиксирует требование; доказательства для всех чётных 2k > 2 контракт не содержит',
    verifiedText:
      'контракт сформулирован как требование и согласован с записью движка решений: гипотеза Гольдбаха — UNRESOLVED_CHALLENGE (src/model/taskResolutionEngine.ts), внешняя задача отсутствует в ядровом пути репозитория.',
    boundaryText:
      'гипотеза Гольдбаха не доказана: этот узел специфицирует необходимый монолит и его SP4/A4-требования; никакого формального доказательства для бесконечного множества чётных чисел здесь нет.',
    externalProblem: 'гипотеза Гольдбаха (требуемый монолит порядка 2 над решетом простых)',
    evidence: { kind: 'CONTRACT_ONLY' },
    outcome: { state: 'partial', ricisSolvable: false },
  },
  {
    nodeId: 'task-twin-prime-plane-difference',
    claimClass: 'CONTRACT_SPECIFICATION',
    title: 'Спецификация разностного оператора плоскости для простых близнецов — не доказательство гипотезы',
    statusLine: 'СПЕЦИФИКАЦИЯ (контракт): узел описывает требуемый оператор, а не решение',
    singularityClass: 'требуемый дискретный разностный оператор Δ_plane над индексами простых',
    astType: 'RExpr',
    structuralStatement: 'Spec(DeltaPlane) = sub (infF P) (infF (add P two)) — требование оператора, не теорема',
    lawStatement: 'Оператор обязан сохранять индексацию ∞_F − ∞_G → ∞_(F−G) (закон A7)',
    invarianceStatement: 'Контракт фиксирует требование; бесконечность множества пар контракт не утверждает',
    verifiedText:
      'контракт согласован с ядровым законом A7 (ядерная теорема RICIS_Template.A7_inf_sub, прогон 34891262489) в части разностного оператора над индексами.',
    boundaryText:
      'гипотеза о бесконечности пар простых близнецов не доказана: узел специфицирует требуемый разностный оператор и его инвариант, а не глобальную меру множества пар.',
    externalProblem: 'гипотеза о простых близнецах (требуемый Δ_plane-монолит)',
    evidence: law('RICIS_Template.A7_inf_sub'),
    outcome: { state: 'partial', ricisSolvable: false },
  },
  {
    nodeId: 'task-collatz-ancestor-tree-invariant',
    claimClass: 'CONTRACT_SPECIFICATION',
    title: 'Спецификация L1-инварианта дерева предков Коллатца — не доказательство гипотезы',
    statusLine: 'СПЕЦИФИКАЦИЯ (контракт): узел описывает требуемый инвариант дерева, а не решение',
    singularityClass: 'требуемый инвариант обратного бинарного дерева предков',
    astType: 'RExpr',
    structuralStatement: 'Spec(CollatzTreeMonolith) = L1Preserve(ancestorTree n) — требование инварианта',
    lawStatement: 'Требуется L1-сохранение при редукции шага без предельных переходов (P1)',
    invarianceStatement: 'Контракт фиксирует требование; отсутствие циклов и ограниченность роста не утверждаются',
    verifiedText:
      'контракт согласован с L0-законом редукции (ядерная теорема RICIS_Template.L0_continuity_divSelf, прогон 34891262489) в части непрерывности устранения самоделения.',
    boundaryText:
      'гипотеза Коллатца не доказана: узел специфицирует требуемый инвариант дерева предков; анализ нетривиальных циклов и роста траекторий здесь отсутствует.',
    externalProblem: 'гипотеза Коллатца (требуемый инвариант дерева предков)',
    evidence: law('RICIS_Template.L0_continuity_divSelf'),
    outcome: { state: 'partial', ricisSolvable: false },
  },
  {
    nodeId: 'task-continuum-metric-hilbert',
    claimClass: 'CONTRACT_SPECIFICATION',
    title: 'Спецификация континуального метрико-гильбертова слоя — не объединение QM и GR',
    statusLine: 'СПЕЦИФИКАЦИЯ (контракт): узел описывает требуемый слой, а не его построение',
    singularityClass: 'требуемый континуальный слой: метрика ⊗ гильбертово пространство',
    astType: 'RExpr',
    structuralStatement: 'Spec(ContinuumLayer) = tensor metric Hilbert — требование слоя, не построение',
    lawStatement: 'Требуется A6-контракт пути при сохранении SP4-индекса в континуальном пределе',
    invarianceStatement: 'Контракт фиксирует требование; континуум как объект не построен',
    verifiedText:
      'контракт согласован со SP4-инвариантом (ядерная теорема RICIS_Template.SP4_preserves_parent, прогон 34891262489) на дискретном прокси-уровне.',
    boundaryText:
      'объединение квантовой механики и гравитации не построено и не доказано: узел phys-unified остаётся partial by design, континуальный метрико-гильбертов слой отсутствует, дискретный прокси A6 его не заменяет.',
    externalProblem: 'континуальное объединение квантовой механики и гравитации',
    evidence: law('RICIS_Template.SP4_preserves_parent'),
    outcome: { state: 'partial', ricisSolvable: false },
  },
  {
    nodeId: 'task-turing-meta-monolith',
    claimClass: 'CONTRACT_SPECIFICATION',
    title: 'Спецификация мета-монолита уровней для проблемы остановки — не её разрешение',
    statusLine: 'СПЕЦИФИКАЦИЯ (контракт): узел описывает требуемый мета-уровень, а не решение',
    singularityClass: 'требуемое разделение страт: мета-уровень L0 против уровня L1',
    astType: 'RExpr',
    structuralStatement: 'Spec(TuringMetaMonolith) = separate L0 L1 (типизация страт) — требование',
    lawStatement: 'Требуется L1-тождество уровня: страты не смешиваются, коллапс уровней запрещён',
    invarianceStatement: 'Контракт фиксирует требование; алгоритмическая неразрешимость не доказывается',
    verifiedText:
      'контракт согласован с L1-законом типизации (ядровая теорема RICIS_Template.L1_identity, прогон 34891262489, не зависит от аксиом).',
    boundaryText:
      'неразрешимость проблемы остановки — классический результат Тьюринга (1936), здесь не доказывается; узел специфицирует требуемый мета-монолит и не воспроизводит диагональное доказательство.',
    externalProblem: 'проблема остановки (требуемая иерархия мета-монолитов)',
    evidence: law('RICIS_Template.L1_identity'),
    outcome: { state: 'partial', ricisSolvable: false },
  },
];

/**
 * Узлы, отработанные тактом TASK-05 (эталон формата): их записи уже в дереве и
 * регенерируются вручную, но страж обязан проверять те же инварианты.
 */
export const REFERENCE_ORCHESTRATED_NODE_IDS: readonly string[] = [
  'real-catalog-3',
  'registry-117',
  'riemann-complex-pole-regularizer',
];

export interface OrchestrationStage {
  readonly stage: 'PARSING_AND_L1_CHECK' | 'AXIOMATIC_REDUCTION' | 'LEAN_CODEGEN' | 'GATEWAY_DISPATCH' | 'TRUST_VALIDATION';
  readonly status: 'OK' | 'CONTRACT' | 'REPO_TEST_ONLY' | 'NO_KERNEL_EVIDENCE';
  readonly note: string;
}

function stageNote(entry: NodeClaimPlanEntry): readonly OrchestrationStage[] {
  const e = entry.evidence;
  const codegen =
    e.kind === 'KERNEL_RUN'
      ? `Носитель редукции: ${e.artifactId} · теорема ${e.theorem}`
      : e.kind === 'REPO_TEST_RUN'
        ? `Ядрового носителя нет: утверждение проверяется модулем ${e.modulePath}`
        : 'Ядрового носителя нет: узел — спецификация (контракт), а не теорема';
  const dispatch =
    e.kind === 'KERNEL_RUN'
      ? `Статус получен фактическим прогоном ядра ${e.run} (запись — kernel-findings.json)`
      : e.kind === 'REPO_TEST_RUN'
        ? `Кернел-прогона нет; фактический канал — прогон тестов ${e.testPath}`
        : 'Отправлять в ядро нечего: спецификация не является утверждением о внешнем объекте';
  return [
    { stage: 'PARSING_AND_L1_CHECK', status: 'OK', note: `Типирование: ${entry.astType}; внешние объекты — неинтерпретированные конструкторы` },
    { stage: 'AXIOMATIC_REDUCTION', status: 'OK', note: `Класс: ${entry.singularityClass}. Закон: ${entry.lawStatement}` },
    { stage: 'LEAN_CODEGEN', status: e.kind === 'CONTRACT_ONLY' ? 'CONTRACT' : 'OK', note: codegen },
    { stage: 'GATEWAY_DISPATCH', status: e.kind === 'KERNEL_RUN' ? 'OK' : e.kind === 'REPO_TEST_RUN' ? 'REPO_TEST_ONLY' : 'NO_KERNEL_EVIDENCE', note: dispatch },
    {
      stage: 'TRUST_VALIDATION',
      status: entry.claimClass === 'OPEN_EXTERNAL_PROBLEM' || entry.claimClass === 'CLASSICAL_RESULT_EXTERNAL' ? 'NO_KERNEL_EVIDENCE' : 'OK',
      note: `E-03: состояние ${entry.outcome.state}, ricisSolvable ${entry.outcome.ricisSolvable}${entry.externalProblem ? '; внешняя задача — только INFORMAL' : ''}`,
    },
  ];
}

/** Прогон пяти стадий оркестрации для записи плана (детерминированно, без имитации evidence). */
export function orchestrateNodeClaim(entry: NodeClaimPlanEntry): {
  readonly nodeId: string;
  readonly claimClass: NodeClaimClass;
  readonly stages: readonly OrchestrationStage[];
  readonly outcome: { readonly state: NodeState; readonly ricisSolvable: boolean };
} {
  return { nodeId: entry.nodeId, claimClass: entry.claimClass, stages: stageNote(entry), outcome: entry.outcome };
}

const EXTERNAL_PREFIX = 'INFORMAL:';

/** Поле `informalExternalClaim` — единственное место для ссылки на внешнюю задачу. */
export function buildInformalExternalClaim(entry: NodeClaimPlanEntry): string | undefined {
  if (!entry.externalProblem) return undefined;
  return (
    `${EXTERNAL_PREFIX} ${entry.externalProblem} — ${
      entry.claimClass === 'CLASSICAL_RESULT_EXTERNAL' ? 'классический результат' : 'внешняя задача'
    } вне ядрового пути этого репозитория; узел не содержит и не может содержать её решения. Связь — неформальная мотивация, а не проверенный результат.`
  );
}

/** Описание узла: открытое/специфицируемое — подтверждённое — НЕ утверждаемое. */
export function buildNodeDescription(entry: NodeClaimPlanEntry): string {
  return [
    `${entry.statusLine}: ${entry.externalProblem ?? entry.title}`,
    `ЧТО ФАКТИЧЕСКИ ПОДТВЕРЖДЕНО: ${entry.verifiedText}`,
    `ЧТО НЕ УТВЕРЖДАЕТСЯ: ${entry.boundaryText}`,
  ].join('\n\n');
}

/** Поля узла, которые заменяет оркестрация (остальные поля карты не трогаются). */
export function buildNodeClaimPatch(entry: NodeClaimPlanEntry): Partial<ProblemNode> {
  const informal = buildInformalExternalClaim(entry);
  const patch: Partial<ProblemNode> = {
    title: entry.title,
    description: buildNodeDescription(entry),
    state: entry.outcome.state,
    // Тип узла следует классу заявления: открытая/классическая внешняя задача — производная
    // задача (derived_problem), а ядровой структурный результат, спецификация и инженерная
    // проверка остаются рабочими узлами (scientific_task).
    type:
      entry.claimClass === 'OPEN_EXTERNAL_PROBLEM' || entry.claimClass === 'CLASSICAL_RESULT_EXTERNAL'
        ? 'derived_problem'
        : 'scientific_task',
    targetFunction: entry.structuralStatement,
    ricisSolvable: entry.outcome.ricisSolvable,
  };
  if (informal) patch.informalExternalClaim = informal;
  return patch;
}

function phaseSteps(entry: NodeClaimPlanEntry): ProofStep[] {
  const e = entry.evidence;
  return [
    {
      phase: -1,
      name: 'L1_IDENTITY (типирование)',
      action: `Типирование утверждения узла: внешние объекты — неинтерпретированные конструкторы ${entry.astType}`,
      expression: `T = ${entry.astType}`,
    },
    {
      phase: 0.5,
      name: 'SP4 semantic indexing',
      action: 'Индексация сингулярности по порождающему выражению; индекс родителя сохраняется',
      expression: entry.singularityClass,
    },
    {
      phase: 2,
      name: 'AXIOMATIC_REDUCTION (A4/A6/A7/A10/L0)',
      action: `Применён закон резолвера: ${entry.lawStatement}. ${entry.invarianceStatement}`,
      expression: entry.lawStatement,
    },
    {
      phase: 4,
      name: 'LEAN_CODEGEN → GATEWAY_DISPATCH',
      action:
        e.kind === 'KERNEL_RUN'
          ? 'Кодогенерация по универсальному шаблону и отправка в ядровой прогон; статус получен фактическим прогоном'
          : e.kind === 'REPO_TEST_RUN'
            ? 'Кодогенерация не требуется: утверждение проверяется прогоном модульных тестов репозитория'
            : 'Ядровой носитель отсутствует: контракт не отправляется в ядро (сравнивать нечего)',
      expression:
        e.kind === 'KERNEL_RUN'
          ? `artifact ${e.artifactId} · theorem ${e.theorem} · run ${e.run}`
          : e.kind === 'REPO_TEST_RUN'
            ? `module ${e.modulePath} · test ${e.testPath}`
            : 'contract-only (ядрового evidence нет)',
    },
    {
      phase: 6,
      name: 'TRUST_VALIDATION (E-03)',
      action: 'Проверка границы доверия: состояние узла определяется только применимым evidence, внешняя задача остаётся INFORMAL',
      expression: `state = ${entry.outcome.state}; ricisSolvable = ${entry.outcome.ricisSolvable}`,
    },
  ];
}

function finalResultText(entry: NodeClaimPlanEntry): string {
  const e = entry.evidence;
  const tail = entry.externalProblem
    ? ` Внешний предмет («${entry.externalProblem}») не решён и не заявляется.`
    : '';
  if (e.kind === 'KERNEL_RUN') {
    return `Структурный фрагмент подтверждён ядром: ${e.artifactId} · ${e.theorem} · прогон ${e.run} (exit 0, без sorryAx).${tail}`;
  }
  if (e.kind === 'REPO_TEST_RUN') {
    return `Утверждение узла проверено прогоном модульных тестов (${e.testPath}) — это НЕ ядровое доказательство.${tail}`;
  }
  return `Узел — спецификация (контракт), а не решение: формального доказательства внешней задачи здесь нет.${tail}`;
}

/**
 * Заголовок документа. Канонический маркер «RICIS-III Proof» сохраняется (стражи
 * документов), но НЕ называет внешнюю задачу: прежние заголовки вида
 * «RICIS-III Proof: <открытая задача>» читались как доказательство этой задачи.
 */
function latexTitle(entry: NodeClaimPlanEntry): string {
  if (entry.claimClass === 'CONTRACT_SPECIFICATION') return 'RICIS-III Proof: Specification (contract; external problem open)';
  if (entry.claimClass === 'ENGINE_EVIDENCE') return 'RICIS-III Proof: Engineering verification (module test run, not a kernel proof)';
  if (entry.claimClass === 'KERNEL_BACKED_STRUCTURAL') return 'RICIS-III Proof: Structural (kernel-verified; external conjecture open)';
  return 'RICIS-III Proof: Structural fragment (external problem open)';
}

function buildLatex(entry: NodeClaimPlanEntry): string {
  const e = entry.evidence;
  const verification =
    e.kind === 'KERNEL_RUN'
      ? `\\textbf{Artifact:} \\texttt{${e.artifactId}}\\n\\textbf{Theorem:} \\texttt{${e.theorem}}\\n\\textbf{Kernel run:} ${e.run} — exit 0, no \\texttt{sorryAx}`
      : e.kind === 'REPO_TEST_RUN'
        ? `\\textbf{Module:} \\texttt{${e.modulePath}}\\n\\textbf{Test run:} \\texttt{${e.testPath}} (прогон тестов репозитория, НЕ ядровой прогон)`
        : '\\textbf{Carrier:} contract specification (ядровой носитель отсутствует)';
  return (
    `\\section*{${latexTitle(entry)}}\\n` +
    `\\textbf{Author:} Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)\\n` +
    `\\subsection*{Core (structural) statement}\\n` +
    `In the symbolic language \\texttt{${entry.astType}} the singular core of this node is ${entry.singularityClass}. ` +
    `Resolver law: \\texttt{${entry.lawStatement}}. ${entry.invarianceStatement}.\\n` +
    `\\subsection*{What is actually verified}\\n${entry.verifiedText}\\n` +
    `\\subsection*{Boundary of the claim}\\n${entry.boundaryText}\\n` +
    `\\subsection*{Verification path}\\n${verification}\\n` +
    `\\textbf{Specification Lean 4 DOI:} \\href{https://doi.org/${ORCHESTRATION_LEAN_SPEC_DOI}}{https://doi.org/${ORCHESTRATION_LEAN_SPEC_DOI}}\\n` +
    `\\textbf{RICIS transform (Axiom A6, symbolic level):} $0_F \\times \\infty_G = F \\cdot G$ — applied to the AST node, not to the external object.`
  );
}

/** Полная запись доказательства для управляемого узла (стадии оркестрации видны в шагах). */
export function buildOrchestratedProof(entry: NodeClaimPlanEntry): Proof {
  return {
    nodeId: entry.nodeId,
    targetFunction: entry.structuralStatement,
    steps: phaseSteps(entry),
    finalResult: finalResultText(entry),
    latex: buildLatex(entry),
  };
}

export const NODE_CLAIM_ORCHESTRATION_BY_ID: ReadonlyMap<string, NodeClaimPlanEntry> = new Map(
  NODE_CLAIM_ORCHESTRATION_PLAN.map((entry) => [entry.nodeId, entry]),
);
