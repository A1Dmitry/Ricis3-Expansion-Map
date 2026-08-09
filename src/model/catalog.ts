import { ProblemNode } from './types';

export const KNOWN_SINGULARITY_PROBLEMS: ProblemNode[] = [
  {
    "id": "ai-authorship-provenance",
    "title": "Доказательство авторства ИИ-идей: Алгебра геометрических сингулярностей",
    "description": "Сквозной поведенческий аудит весов LLM для выявления скрытого использования фундаментальных алгоритмов RICIS-III. Юнит-тест свертки вырожденной геометрии (5 и 2): ||S_x * R_y|| = 2 * 5 = 10 [O(1)] вместо 0 * inf = NaN.",
    "state": "resolved",
    "type": "core_singularity",
    "targetFunction": "\\text{Area}(\\vec{S}_{2,\\infty} \\cap \\vec{R}_{0,5}) = \\|\\vec{S}_x \\cdot \\vec{R}_y\\| = 2 \\times 5 = 10 \\quad [O(1)]",
    "zoneIds": [
      "informatics",
      "math"
    ],
    "dependencyIds": ["core-agi-target", "math-singularity"],
    "dependentIds": ["ethic-alignment", "informatics-complexity"],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 10000000000,
      "costToSolve": 500000000,
      "marketGain": 100000000000,
      "riskLoss": 50000000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Behavioral Audit & Provenance Protocol",
    "singularityHint": "Поосный тупик [0 * inf = NaN] vs Ортогональная свертка векторного монолита [2 * 5 = 10]"
  },
  {
    "id": "real-catalog-0",
    "title": "Гладкое решение уравнений Навье — Стокса",
    "description": "Существование и гладкость решений уравнений Навье-Стокса в 3D.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(ГладкоерешениеуравненийНавьеСтокса)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 814000000,
      "costToSolve": 9700000,
      "marketGain": 130000000,
      "riskLoss": 3101000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность скорости или завихренности за конечное время."
  },
  {
    "id": "real-catalog-1",
    "title": "Гипотеза Ходжа",
    "description": "Одобрение того, что любой гармонический дифференциал есть рациональная комбинация.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(ГипотезаХоджа)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [],
    "dependentIds": [
      "real-catalog-2"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 832000000,
      "costToSolve": 1300000,
      "marketGain": 1817000000,
      "riskLoss": 843000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярности алгебраических многообразий."
  },
  {
    "id": "real-catalog-2",
    "title": "Сингулярности Риччи-потока",
    "description": "Поведение потока Риччи в точках формирования сингулярности.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(СингулярностиРиччипотока)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [
      "real-catalog-1"
    ],
    "dependentIds": [
      "real-catalog-3"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 248000000,
      "costToSolve": 200000,
      "marketGain": 486000000,
      "riskLoss": 2855000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Коллапс метрики в точку."
  },
  {
    "id": "real-catalog-3",
    "title": "Гипотеза Римана",
    "description": "Все нетривиальные нули дзета-функции лежат на критической прямой.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(ГипотезаРимана)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [
      "real-catalog-2"
    ],
    "dependentIds": [
      "real-catalog-4"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 597000000,
      "costToSolve": 9100000,
      "marketGain": 1507000000,
      "riskLoss": 2428000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Полюс при s=1."
  },
  {
    "id": "real-catalog-4",
    "title": "Разрешение особенностей Хиронаки",
    "description": "Разрешение особенностей алгебраических многообразий в характеристике p>0.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(РазрешениеособенностейХиронаки)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [
      "real-catalog-3"
    ],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 91000000,
      "costToSolve": 4500000,
      "marketGain": 886000000,
      "riskLoss": 4462000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярности кратных точек."
  },
  {
    "id": "real-catalog-5",
    "title": "Проблема делителей нуля в групповых кольцах",
    "description": "Гипотеза Капланского о делителях нуля.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Проблемаделителейнулявгрупповыхкольцах)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 918000000,
      "costToSolve": 5000000,
      "marketGain": 1204000000,
      "riskLoss": 3209000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Структурные нули алгебры."
  },
  {
    "id": "real-catalog-6",
    "title": "Сингулярность функции Вейерштрасса",
    "description": "Недифференцируемая, но всюду непрерывная функция.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(СингулярностьфункцииВейерштрасса)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 127000000,
      "costToSolve": 3100000,
      "marketGain": 452000000,
      "riskLoss": 49000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Фрактальная изломанность."
  },
  {
    "id": "real-catalog-7",
    "title": "Особенности дифференциальных уравнений Пенлеве",
    "description": "Подвижные особые точки решений нелинейных ДУ.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(ОсобенностидифференциальныхуравненийПенлеве)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 649000000,
      "costToSolve": 2200000,
      "marketGain": 480000000,
      "riskLoss": 3493000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность, зависящая от начальных условий."
  },
  {
    "id": "real-catalog-8",
    "title": "Особые точки алгебраических кривых",
    "description": "Классификация особенностей кривых на плоскости.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Особыеточкиалгебраическихкривых)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 735000000,
      "costToSolve": 2200000,
      "marketGain": 1214000000,
      "riskLoss": 2644000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Каспы и точки самопересечения."
  },
  {
    "id": "real-catalog-9",
    "title": "Инварианты Дональдсона",
    "description": "Топология гладких 4-мерных многообразий.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(ИнвариантыДональдсона)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 303000000,
      "costToSolve": 3900000,
      "marketGain": 1659000000,
      "riskLoss": 4350000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Особенности пространства модулей инстантонов."
  },
  {
    "id": "real-catalog-10",
    "title": "Теорема об индексе Атьи — Зингера",
    "description": "Связь аналитического и топологического индексов.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(ТеоремаобиндексеАтьиЗингера)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [],
    "dependentIds": [
      "real-catalog-11"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 930000000,
      "costToSolve": 5600000,
      "marketGain": 1461000000,
      "riskLoss": 2058000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярности эллиптических дифференциальных операторов."
  },
  {
    "id": "real-catalog-11",
    "title": "Гипотеза Пуанкаре",
    "description": "Каждое односвязное компактное 3D многообразие гомеоморфно сфере.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(ГипотезаПуанкаре)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [
      "real-catalog-10"
    ],
    "dependentIds": [
      "real-catalog-12"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 923000000,
      "costToSolve": 8500000,
      "marketGain": 1965000000,
      "riskLoss": 4150000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Топологические сингулярности (разрешены)."
  },
  {
    "id": "real-catalog-12",
    "title": "Проблема Варинга",
    "description": "Представление чисел суммой k-х степеней.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(ПроблемаВаринга)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [
      "real-catalog-11"
    ],
    "dependentIds": [
      "real-catalog-13"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 612000000,
      "costToSolve": 6800000,
      "marketGain": 1635000000,
      "riskLoss": 2501000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Асимптотическая плотность (арифметическая сингулярность)."
  },
  {
    "id": "real-catalog-13",
    "title": "Гипотеза Гольдбаха",
    "description": "Сумма двух простых.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(ГипотезаГольдбаха)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [
      "real-catalog-12"
    ],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 353000000,
      "costToSolve": 1300000,
      "marketGain": 1018000000,
      "riskLoss": 4099000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Локальные нули плотности распределения."
  },
  {
    "id": "real-catalog-14",
    "title": "Гипотеза Бёрча — Свиннертон-Дайера",
    "description": "Ранг эллиптической кривой и порядок нуля L-функции.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(ГипотезаБёрчаСвиннертонДайера)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [],
    "dependentIds": [
      "real-catalog-15"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 550000000,
      "costToSolve": 1900000,
      "marketGain": 576000000,
      "riskLoss": 1661000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Порядок нуля в критической точке."
  },
  {
    "id": "real-catalog-15",
    "title": "Квантовая когомология",
    "description": "Инварианты Громова-Виттена.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Квантоваякогомология)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [
      "real-catalog-14"
    ],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 939000000,
      "costToSolve": 7100000,
      "marketGain": 1880000000,
      "riskLoss": 1934000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярности псевдоголоморфных кривых."
  },
  {
    "id": "real-catalog-16",
    "title": "Проблема инвариантных подпространств",
    "description": "Существует ли нетривиальное инвариантное подпространство?",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Проблемаинвариантныхподпространств)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 242000000,
      "costToSolve": 1500000,
      "marketGain": 14000000,
      "riskLoss": 1726000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Спектральная сингулярность оператора."
  },
  {
    "id": "real-catalog-17",
    "title": "Геометрия фракталов",
    "description": "Размерность Хаусдорфа.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Геометрияфракталов)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [],
    "dependentIds": [
      "real-catalog-18"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 131000000,
      "costToSolve": 8900000,
      "marketGain": 345000000,
      "riskLoss": 4510000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Бесконечная изрезанность (сингулярность границы)."
  },
  {
    "id": "real-catalog-18",
    "title": "Нелинейное уравнение Шредингера",
    "description": "Взрыв решений за конечное время.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(НелинейноеуравнениеШредингера)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [
      "real-catalog-17"
    ],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 30000000,
      "costToSolve": 6000000,
      "marketGain": 986000000,
      "riskLoss": 573000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Коллапс волновой функции."
  },
  {
    "id": "real-catalog-19",
    "title": "Аттрактор Лоренца",
    "description": "Странный аттрактор в хаотических системах.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(АттракторЛоренца)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 405000000,
      "costToSolve": 2000000,
      "marketGain": 915000000,
      "riskLoss": 2659000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Фрактальная размерность аттрактора."
  },
  {
    "id": "real-catalog-20",
    "title": "Сингулярные возмущения ДУ",
    "description": "Метод пограничного слоя.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(СингулярныевозмущенияДУ)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 884000000,
      "costToSolve": 1700000,
      "marketGain": 1415000000,
      "riskLoss": 1649000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность при малом параметре при старшей производной."
  },
  {
    "id": "real-catalog-21",
    "title": "Катастрофы Тома",
    "description": "Теория катастроф.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(КатастрофыТома)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 83000000,
      "costToSolve": 900000,
      "marketGain": 360000000,
      "riskLoss": 861000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Топологическая сингулярность (складка, сборка)."
  },
  {
    "id": "real-catalog-22",
    "title": "Псевдодифференциальные операторы",
    "description": "Микролокальный анализ.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Псевдодифференциальныеоператоры)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 402000000,
      "costToSolve": 7200000,
      "marketGain": 1127000000,
      "riskLoss": 769000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярный носитель распределения."
  },
  {
    "id": "real-catalog-23",
    "title": "Теория Морса",
    "description": "Критические точки гладких функций.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(ТеорияМорса)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [],
    "dependentIds": [
      "real-catalog-24"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 814000000,
      "costToSolve": 6800000,
      "marketGain": 1761000000,
      "riskLoss": 189000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Вырожденные критические точки."
  },
  {
    "id": "real-catalog-24",
    "title": "Сингулярная гомология",
    "description": "Гомологические группы.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Сингулярнаягомология)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [
      "real-catalog-23"
    ],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 676000000,
      "costToSolve": 8300000,
      "marketGain": 21000000,
      "riskLoss": 1931000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярные симплексы."
  },
  {
    "id": "real-catalog-25",
    "title": "Теория узлов",
    "description": "Инварианты Конвея.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Теорияузлов)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 286000000,
      "costToSolve": 8100000,
      "marketGain": 1668000000,
      "riskLoss": 2265000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Топологические препятствия."
  },
  {
    "id": "real-catalog-26",
    "title": "Спектральная асимптотика",
    "description": "Формула Вейля.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Спектральнаяасимптотика)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 636000000,
      "costToSolve": 800000,
      "marketGain": 823000000,
      "riskLoss": 1825000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярности резольвенты."
  },
  {
    "id": "real-catalog-27",
    "title": "Квазикристаллы",
    "description": "Узоры Пенроуза.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Квазикристаллы)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 441000000,
      "costToSolve": 3500000,
      "marketGain": 984000000,
      "riskLoss": 1352000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность дифракционного спектра."
  },
  {
    "id": "real-catalog-28",
    "title": "Уравнение Кортевега-де Фриза",
    "description": "Многосолитонные решения.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(УравнениеКортевегадеФриза)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [],
    "dependentIds": [
      "real-catalog-29"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 797000000,
      "costToSolve": 300000,
      "marketGain": 1946000000,
      "riskLoss": 406000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярности в полюсах (комплексная плоскость)."
  },
  {
    "id": "real-catalog-29",
    "title": "Некоммутативная геометрия",
    "description": "Пространства Конна.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Некоммутативнаягеометрия)",
    "zoneIds": [
      "math"
    ],
    "dependencyIds": [
      "real-catalog-28"
    ],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 931000000,
      "costToSolve": 4600000,
      "marketGain": 1713000000,
      "riskLoss": 787000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Алгебраические квантовые сингулярности."
  },
  {
    "id": "real-catalog-30",
    "title": "Сингулярности в уравнениях Эйнштейна",
    "description": "Теоремы Хокинга и Пенроуза о сингулярностях.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(СингулярностивуравненияхЭйнштейна)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 541000000,
      "costToSolve": 5800000,
      "marketGain": 49000000,
      "riskLoss": 1509000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Бесконечная кривизна пространства-времени."
  },
  {
    "id": "real-catalog-31",
    "title": "Сингулярности в теории струн",
    "description": "Разрешение орибифолдных сингулярностей.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Сингулярностивтеорииструн)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [],
    "dependentIds": [
      "real-catalog-32"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 489000000,
      "costToSolve": 5200000,
      "marketGain": 151000000,
      "riskLoss": 1237000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Конические точки в компактных пространствах."
  },
  {
    "id": "real-catalog-32",
    "title": "Квантовая запутанность и кротовые норы",
    "description": "Гипотеза ER=EPR.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Квантоваязапутанностьикротовыеноры)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [
      "real-catalog-31"
    ],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 678000000,
      "costToSolve": 4300000,
      "marketGain": 837000000,
      "riskLoss": 1304000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность внутри черной дыры."
  },
  {
    "id": "real-catalog-33",
    "title": "Информационный парадокс черных дыр",
    "description": "Унитарность квантовой механики при испарении черной дыры.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Информационныйпарадоксчерныхдыр)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 386000000,
      "costToSolve": 2100000,
      "marketGain": 1771000000,
      "riskLoss": 4925000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность горизонта событий."
  },
  {
    "id": "real-catalog-34",
    "title": "Теория Янга-Миллса: существование и массовая щель",
    "description": "Строгое доказательство существования квантовой теории поля.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(ТеорияЯнгаМиллса:существованиеимассоваящель)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 423000000,
      "costToSolve": 5200000,
      "marketGain": 172000000,
      "riskLoss": 3794000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Ультрафиолетовые расходимости."
  },
  {
    "id": "real-catalog-35",
    "title": "Сингулярность Большого взрыва",
    "description": "Начальное состояние Вселенной.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(СингулярностьБольшоговзрыва)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 173000000,
      "costToSolve": 7100000,
      "marketGain": 1887000000,
      "riskLoss": 4472000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Бесконечная плотность в t=0."
  },
  {
    "id": "real-catalog-36",
    "title": "Космологическая постоянная",
    "description": "Проблема вакуумной энергии.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Космологическаяпостоянная)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [],
    "dependentIds": [
      "real-catalog-37"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 899000000,
      "costToSolve": 5200000,
      "marketGain": 474000000,
      "riskLoss": 3784000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Расходимость нулевых колебаний."
  },
  {
    "id": "real-catalog-37",
    "title": "Квантовая гравитация",
    "description": "Объединение ОТО и квантовой механики.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Квантоваягравитация)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [
      "real-catalog-36"
    ],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 544000000,
      "costToSolve": 500000,
      "marketGain": 746000000,
      "riskLoss": 386000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Неперенормируемые расходимости."
  },
  {
    "id": "real-catalog-38",
    "title": "Сингулярности в гидродинамике",
    "description": "Образование капель и разрыв струи жидкости.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Сингулярностивгидродинамике)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [],
    "dependentIds": [
      "real-catalog-39"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 37000000,
      "costToSolve": 6500000,
      "marketGain": 671000000,
      "riskLoss": 361000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Точка разрыва конечного радиуса."
  },
  {
    "id": "real-catalog-39",
    "title": "Эффект Казимира",
    "description": "Притяжение проводящих пластин в вакууме.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(ЭффектКазимира)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [
      "real-catalog-38"
    ],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 136000000,
      "costToSolve": 7200000,
      "marketGain": 1242000000,
      "riskLoss": 1121000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Расходимость энергии вакуума (регуляризуемая)."
  },
  {
    "id": "real-catalog-40",
    "title": "Квантовый эффект Холла",
    "description": "Дискретность холловского сопротивления.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(КвантовыйэффектХолла)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 766000000,
      "costToSolve": 6300000,
      "marketGain": 1498000000,
      "riskLoss": 3346000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярности плотности состояний (уровни Ландау)."
  },
  {
    "id": "real-catalog-41",
    "title": "Высокотемпературная сверхпроводимость",
    "description": "Механизм купратных сверхпроводников.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Высокотемпературнаясверхпроводимость)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [],
    "dependentIds": [
      "real-catalog-42"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 957000000,
      "costToSolve": 8300000,
      "marketGain": 1327000000,
      "riskLoss": 1034000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Квантовые критические точки."
  },
  {
    "id": "real-catalog-42",
    "title": "Фазовые переходы второго рода",
    "description": "Масштабная инвариантность.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Фазовыепереходывторогорода)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [
      "real-catalog-41"
    ],
    "dependentIds": [
      "real-catalog-43"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 910000000,
      "costToSolve": 900000,
      "marketGain": 1822000000,
      "riskLoss": 2775000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Расходимость корреляционного радиуса."
  },
  {
    "id": "real-catalog-43",
    "title": "Критическая опалесценция",
    "description": "Рассеяние света в критической точке.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Критическаяопалесценция)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [
      "real-catalog-42"
    ],
    "dependentIds": [
      "real-catalog-44"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 727000000,
      "costToSolve": 5300000,
      "marketGain": 1605000000,
      "riskLoss": 2821000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность флуктуаций плотности."
  },
  {
    "id": "real-catalog-44",
    "title": "Сингулярности в нелинейной оптике",
    "description": "Самофокусировка лазерного луча.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Сингулярностивнелинейнойоптике)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [
      "real-catalog-43"
    ],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 828000000,
      "costToSolve": 9300000,
      "marketGain": 807000000,
      "riskLoss": 4889000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Коллапс луча в точку."
  },
  {
    "id": "real-catalog-45",
    "title": "Эффект Кондо",
    "description": "Экранирование магнитного момента.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(ЭффектКондо)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 594000000,
      "costToSolve": 9800000,
      "marketGain": 1837000000,
      "riskLoss": 4832000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Логарифмическая расходимость при низких температурах."
  },
  {
    "id": "real-catalog-46",
    "title": "Сингулярности ван Хова",
    "description": "Особенности в плотности состояний кристаллов.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(СингулярностиванХова)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [],
    "dependentIds": [
      "real-catalog-47"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 990000000,
      "costToSolve": 3600000,
      "marketGain": 1144000000,
      "riskLoss": 3887000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Точки, где градиент дисперсии равен нулю."
  },
  {
    "id": "real-catalog-47",
    "title": "Топологические изоляторы",
    "description": "Состояния на краю, защищенные топологией.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Топологическиеизоляторы)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [
      "real-catalog-46"
    ],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 734000000,
      "costToSolve": 8200000,
      "marketGain": 1161000000,
      "riskLoss": 2810000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярности Берри-кривизны."
  },
  {
    "id": "real-catalog-48",
    "title": "Магнитные монополи",
    "description": "Гипотетические частицы с магнитным зарядом.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Магнитныемонополи)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 824000000,
      "costToSolve": 2500000,
      "marketGain": 1114000000,
      "riskLoss": 3398000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Точечный источник магнитного поля."
  },
  {
    "id": "real-catalog-49",
    "title": "Сингулярность дираковской струны",
    "description": "Фазовый набег электрона.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Сингулярностьдираковскойструны)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 443000000,
      "costToSolve": 4700000,
      "marketGain": 1090000000,
      "riskLoss": 1958000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Топологический дефект вокруг монополя."
  },
  {
    "id": "real-catalog-50",
    "title": "Эффект Ааронова — Бома",
    "description": "Влияние векторного потенциала на фазу.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(ЭффектАароноваБома)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [],
    "dependentIds": [
      "real-catalog-51"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 851000000,
      "costToSolve": 2400000,
      "marketGain": 695000000,
      "riskLoss": 2105000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность магнитного поля (нить)."
  },
  {
    "id": "real-catalog-51",
    "title": "Темная материя",
    "description": "Скрытая масса во Вселенной.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Темнаяматерия)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [
      "real-catalog-50"
    ],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 276000000,
      "costToSolve": 900000,
      "marketGain": 113000000,
      "riskLoss": 4722000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Аномалии в кривых вращения галактик."
  },
  {
    "id": "real-catalog-52",
    "title": "Темная энергия",
    "description": "Ускоренное расширение Вселенной.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Темнаяэнергия)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 703000000,
      "costToSolve": 7200000,
      "marketGain": 599000000,
      "riskLoss": 3687000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность будущего (Большой разрыв)."
  },
  {
    "id": "real-catalog-53",
    "title": "Космические струны",
    "description": "Одномерные топологические дефекты.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Космическиеструны)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 645000000,
      "costToSolve": 4300000,
      "marketGain": 891000000,
      "riskLoss": 619000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность кривизны на линии."
  },
  {
    "id": "real-catalog-54",
    "title": "Голографический принцип",
    "description": "Описание объема через границу.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Голографическийпринцип)",
    "zoneIds": [
      "physics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 589000000,
      "costToSolve": 7500000,
      "marketGain": 1576000000,
      "riskLoss": 4263000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность границы AdS-пространства."
  },
  {
    "id": "real-catalog-55",
    "title": "Равенство классов P и NP (Детерминированный Мерсенновский анализ)",
    "description": "Детерминированное сведение NP к P через вырожденный векторный каркас Psi(X)=Const и циклическое кольцо Мерсенна M = 2^k - 1 без перебора.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "MersenneRingReduction(P, NP)",
    "zoneIds": [
      "informatics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 197000000,
      "costToSolve": 4700000,
      "marketGain": 1849000000,
      "riskLoss": 1501000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Экспоненциальный взрыв времени вычислений схлопывается побитовыми сдвигами за 1 такт."
  },
  {
    "id": "real-catalog-56",
    "title": "Остановка машины Тьюринга",
    "description": "Алгоритмическая неразрешимость.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(ОстановкамашиныТьюринга)",
    "zoneIds": [
      "informatics"
    ],
    "dependencyIds": [],
    "dependentIds": [
      "real-catalog-57"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 762000000,
      "costToSolve": 8100000,
      "marketGain": 140000000,
      "riskLoss": 618000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Бесконечный цикл (временная расходимость)."
  },
  {
    "id": "real-catalog-57",
    "title": "Сингулярность ИИ",
    "description": "Гипотетический взрывной рост интеллекта.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(СингулярностьИИ)",
    "zoneIds": [
      "informatics"
    ],
    "dependencyIds": [
      "real-catalog-56"
    ],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 525000000,
      "costToSolve": 5500000,
      "marketGain": 1286000000,
      "riskLoss": 3847000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Бесконечная производная технологического прогресса."
  },
  {
    "id": "real-catalog-58",
    "title": "Теорема Геделя о неполноте",
    "description": "Ограничения формальных систем.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(ТеоремаГеделяонеполноте)",
    "zoneIds": [
      "informatics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 413000000,
      "costToSolve": 8100000,
      "marketGain": 1417000000,
      "riskLoss": 1557000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Логический парадокс (самореференция)."
  },
  {
    "id": "real-catalog-59",
    "title": "Сложность факторизации RSA/ECC (Побитовая маска квадрата)",
    "description": "Разложение больших чисел N = p*q за O(1) операцией подстановки (x^2 - N) & M в кольце Мерсенна, где M = 2^B - 1 зафиксирован разрядностью стороны квадрата B.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "FactorizeMersenneMask(N, B)",
    "zoneIds": [
      "informatics"
    ],
    "dependencyIds": [],
    "dependentIds": [
      "real-catalog-60"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 682000000,
      "costToSolve": 9300000,
      "marketGain": 1676000000,
      "riskLoss": 1216000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Квантовая экспоненциальная сложность редуцируется стековой маской Span<byte>."
  },
  {
    "id": "real-catalog-60",
    "title": "Колмогоровская сложность",
    "description": "Длина кратчайшей программы.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Колмогоровскаясложность)",
    "zoneIds": [
      "informatics"
    ],
    "dependencyIds": [
      "real-catalog-59"
    ],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 898000000,
      "costToSolve": 7200000,
      "marketGain": 1066000000,
      "riskLoss": 136000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Невычислимость в пределе."
  },
  {
    "id": "real-catalog-61",
    "title": "Парадокс браев",
    "description": "Ухудшение пропускной способности при добавлении дорог.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Парадоксбраев)",
    "zoneIds": [
      "informatics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 854000000,
      "costToSolve": 200000,
      "marketGain": 707000000,
      "riskLoss": 3529000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность равновесия Нэша."
  },
  {
    "id": "real-catalog-62",
    "title": "Квантовая превосходство",
    "description": "Решение задач недоступных классическим ПК.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Квантоваяпревосходство)",
    "zoneIds": [
      "informatics"
    ],
    "dependencyIds": [],
    "dependentIds": [
      "real-catalog-63"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 801000000,
      "costToSolve": 8800000,
      "marketGain": 663000000,
      "riskLoss": 3562000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Асимптотическое расхождение сложности."
  },
  {
    "id": "real-catalog-63",
    "title": "Сингулярности в машинном обучении",
    "description": "Взрыв градиентов в глубоких сетях.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Сингулярностивмашинномобучении)",
    "zoneIds": [
      "informatics"
    ],
    "dependencyIds": [
      "real-catalog-62"
    ],
    "dependentIds": [
      "real-catalog-64"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 166000000,
      "costToSolve": 6700000,
      "marketGain": 364000000,
      "riskLoss": 1613000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Производная функции потерь стремится к бесконечности."
  },
  {
    "id": "real-catalog-64",
    "title": "Проблема катастрофического забывания",
    "description": "Нейросети забывают старое при обучении новому.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Проблемакатастрофическогозабывания)",
    "zoneIds": [
      "informatics"
    ],
    "dependencyIds": [
      "real-catalog-63"
    ],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 177000000,
      "costToSolve": 1700000,
      "marketGain": 1572000000,
      "riskLoss": 3538000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Ортогональность градиентов."
  },
  {
    "id": "real-catalog-65",
    "title": "Оптимизация гиперпараметров",
    "description": "Невыпуклые ландшафты потерь.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Оптимизациягиперпараметров)",
    "zoneIds": [
      "informatics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 906000000,
      "costToSolve": 5700000,
      "marketGain": 514000000,
      "riskLoss": 995000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Седловые сингулярности в пространстве весов."
  },
  {
    "id": "real-catalog-66",
    "title": "Сложность задачи изоморфизма графов (Побитовый спектральный трафарет)",
    "description": "Сворачивание матрицы смежности графа через побитовый AND и POPCNT в вырожденный битовый профиль кольца Мерсенна за O(V).",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "GraphIsomorphismMersenne(G1, G2)",
    "zoneIds": [
      "informatics"
    ],
    "dependencyIds": [],
    "dependentIds": [
      "real-catalog-67"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 681000000,
      "costToSolve": 5800000,
      "marketGain": 397000000,
      "riskLoss": 792000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Квазиполиномиальный тупик ликвидируется SIMD параллелизмом _mm256_cmpeq_epi32."
  },
  {
    "id": "real-catalog-67",
    "title": "NP-полные задачи (Детерминированный сетевой трафарет TSP/SAT)",
    "description": "Двунаправленное встречное схождение R_start и R_end с блокировкой подтуров (R_start & R_end == 0) и полным заполнением R_start | R_end == 2^V - 1.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "ResolveNPCompleteNetwork(TSP, SAT)",
    "zoneIds": [
      "informatics"
    ],
    "dependencyIds": [
      "real-catalog-66"
    ],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 977000000,
      "costToSolve": 1000000,
      "marketGain": 122000000,
      "riskLoss": 4364000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Комбинаторный взрыв нейтрализуется точечным схождением вырожденного каркаса."
  },
  {
    "id": "real-catalog-68",
    "title": "Быстрое преобразование Фурье",
    "description": "Оптимальные пределы O(N log N).",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(БыстроепреобразованиеФурье)",
    "zoneIds": [
      "informatics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 412000000,
      "costToSolve": 5300000,
      "marketGain": 632000000,
      "riskLoss": 3977000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Нижняя граница сложности вычисления."
  },
  {
    "id": "real-catalog-69",
    "title": "Алгоритмы консенсуса",
    "description": "Византийские генералы.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Алгоритмыконсенсуса)",
    "zoneIds": [
      "informatics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 295000000,
      "costToSolve": 3300000,
      "marketGain": 50000000,
      "riskLoss": 1218000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Разрыв связности (сетевая сингулярность)."
  },
  {
    "id": "real-catalog-70",
    "title": "Криптографические хэш-функции",
    "description": "Устойчивость к коллизиям.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Криптографическиехэшфункции)",
    "zoneIds": [
      "informatics"
    ],
    "dependencyIds": [],
    "dependentIds": [
      "real-catalog-71"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 863000000,
      "costToSolve": 9700000,
      "marketGain": 1053000000,
      "riskLoss": 32000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность отображения 2^N в 2^M."
  },
  {
    "id": "real-catalog-71",
    "title": "Сложность сортировки",
    "description": "Предел O(N log N).",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Сложностьсортировки)",
    "zoneIds": [
      "informatics"
    ],
    "dependencyIds": [
      "real-catalog-70"
    ],
    "dependentIds": [
      "real-catalog-72"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 725000000,
      "costToSolve": 4600000,
      "marketGain": 1324000000,
      "riskLoss": 4408000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Информационная граница дерева решений."
  },
  {
    "id": "real-catalog-72",
    "title": "Квантовая ошибка",
    "description": "Квантовое исправление ошибок.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Квантоваяошибка)",
    "zoneIds": [
      "informatics"
    ],
    "dependencyIds": [
      "real-catalog-71"
    ],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 862000000,
      "costToSolve": 1600000,
      "marketGain": 193000000,
      "riskLoss": 3617000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность декогеренции."
  },
  {
    "id": "real-catalog-73",
    "title": "Случайные графы",
    "description": "Фазовые переходы Эрдёша — Реньи.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Случайныеграфы)",
    "zoneIds": [
      "informatics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 253000000,
      "costToSolve": 1200000,
      "marketGain": 47000000,
      "riskLoss": 1489000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Появление гигантской компоненты."
  },
  {
    "id": "real-catalog-74",
    "title": "Блокчейн-форк",
    "description": "Расхождение цепи блоков.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Блокчейнфорк)",
    "zoneIds": [
      "informatics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 867000000,
      "costToSolve": 8000000,
      "marketGain": 138000000,
      "riskLoss": 1456000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Топологическое ветвление графа."
  },
  {
    "id": "real-catalog-75",
    "title": "Свертывание белка (Protein Folding)",
    "description": "Предсказание третичной структуры.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Свертываниебелка(ProteinFolding))",
    "zoneIds": [
      "medicine"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 933000000,
      "costToSolve": 2300000,
      "marketGain": 569000000,
      "riskLoss": 3862000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Парадокс Левинталя (комбинаторный взрыв)."
  },
  {
    "id": "real-catalog-76",
    "title": "Теломеры и предел Хейфлика",
    "description": "Старение клеток.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(ТеломерыипределХейфлика)",
    "zoneIds": [
      "medicine"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 689000000,
      "costToSolve": 4200000,
      "marketGain": 423000000,
      "riskLoss": 3742000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность деления клетки (смерть)."
  },
  {
    "id": "real-catalog-77",
    "title": "Онкогенез",
    "description": "Мутации и рак.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Онкогенез)",
    "zoneIds": [
      "medicine"
    ],
    "dependencyIds": [],
    "dependentIds": [
      "real-catalog-78"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 763000000,
      "costToSolve": 2700000,
      "marketGain": 1284000000,
      "riskLoss": 1873000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Бесконтрольное деление (расходимость роста)."
  },
  {
    "id": "real-catalog-78",
    "title": "Устойчивость к антибиотикам",
    "description": "Эволюция супербактерий.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Устойчивостькантибиотикам)",
    "zoneIds": [
      "medicine"
    ],
    "dependencyIds": [
      "real-catalog-77"
    ],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 445000000,
      "costToSolve": 3200000,
      "marketGain": 404000000,
      "riskLoss": 3567000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность адаптивного ландшафта."
  },
  {
    "id": "real-catalog-79",
    "title": "Гематоэнцефалический барьер",
    "description": "Доставка лекарств в мозг.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Гематоэнцефалическийбарьер)",
    "zoneIds": [
      "medicine"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 501000000,
      "costToSolve": 5700000,
      "marketGain": 503000000,
      "riskLoss": 1374000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Топологический барьер (непроницаемость)."
  },
  {
    "id": "real-catalog-80",
    "title": "Механизмы памяти и Альцгеймер",
    "description": "Деградация нейронных связей.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(МеханизмыпамятииАльцгеймер)",
    "zoneIds": [
      "medicine"
    ],
    "dependencyIds": [],
    "dependentIds": [
      "real-catalog-81"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 348000000,
      "costToSolve": 2900000,
      "marketGain": 1695000000,
      "riskLoss": 3931000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Распад синаптической сети."
  },
  {
    "id": "real-catalog-81",
    "title": "Аутоиммунные заболевания",
    "description": "Сбой распознавания свой-чужой.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Аутоиммунныезаболевания)",
    "zoneIds": [
      "medicine"
    ],
    "dependencyIds": [
      "real-catalog-80"
    ],
    "dependentIds": [
      "real-catalog-82"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 265000000,
      "costToSolve": 1200000,
      "marketGain": 1808000000,
      "riskLoss": 3517000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность иммунного ответа."
  },
  {
    "id": "real-catalog-82",
    "title": "Эпигенетическое программирование",
    "description": "Управление экспрессией генов.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Эпигенетическоепрограммирование)",
    "zoneIds": [
      "medicine"
    ],
    "dependencyIds": [
      "real-catalog-81"
    ],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 318000000,
      "costToSolve": 3900000,
      "marketGain": 272000000,
      "riskLoss": 1467000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сложность метилирования ДНК."
  },
  {
    "id": "real-catalog-83",
    "title": "Регенерация тканей",
    "description": "Восстановление органов.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Регенерациятканей)",
    "zoneIds": [
      "medicine"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 310000000,
      "costToSolve": 4100000,
      "marketGain": 1836000000,
      "riskLoss": 457000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Предел дифференцировки стволовых клеток."
  },
  {
    "id": "real-catalog-84",
    "title": "Микробиом человека",
    "description": "Взаимодействие бактерий и организма.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Микробиомчеловека)",
    "zoneIds": [
      "medicine"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 333000000,
      "costToSolve": 5100000,
      "marketGain": 556000000,
      "riskLoss": 1974000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Нелинейная динамика экосистемы кишечника."
  },
  {
    "id": "real-catalog-85",
    "title": "Токсичность наноматериалов",
    "description": "Фармакокинетика частиц.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Токсичностьнаноматериалов)",
    "zoneIds": [
      "medicine"
    ],
    "dependencyIds": [],
    "dependentIds": [
      "real-catalog-86"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 388000000,
      "costToSolve": 4700000,
      "marketGain": 611000000,
      "riskLoss": 4045000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность отношения площади к объему."
  },
  {
    "id": "real-catalog-86",
    "title": "Персонализированная медицина",
    "description": "Синтез лекарств под геном.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Персонализированнаямедицина)",
    "zoneIds": [
      "medicine"
    ],
    "dependencyIds": [
      "real-catalog-85"
    ],
    "dependentIds": [
      "real-catalog-87"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 753000000,
      "costToSolve": 8600000,
      "marketGain": 316000000,
      "riskLoss": 612000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Размерность пространства генотипов."
  },
  {
    "id": "real-catalog-87",
    "title": "Мозговые интерфейсы (BCI)",
    "description": "Чтение мыслей.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Мозговыеинтерфейсы(BCI))",
    "zoneIds": [
      "medicine"
    ],
    "dependencyIds": [
      "real-catalog-86"
    ],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 251000000,
      "costToSolve": 8700000,
      "marketGain": 593000000,
      "riskLoss": 3943000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Шумовая сингулярность ЭЭГ."
  },
  {
    "id": "real-catalog-88",
    "title": "Крионика",
    "description": "Избежание кристаллизации воды.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Крионика)",
    "zoneIds": [
      "medicine"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 453000000,
      "costToSolve": 7700000,
      "marketGain": 1456000000,
      "riskLoss": 4547000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Фазовый переход образования льда."
  },
  {
    "id": "real-catalog-89",
    "title": "Нейропластичность",
    "description": "Обучение мозга.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Нейропластичность)",
    "zoneIds": [
      "medicine"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 828000000,
      "costToSolve": 9900000,
      "marketGain": 841000000,
      "riskLoss": 2464000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Критический период развития."
  },
  {
    "id": "real-catalog-90",
    "title": "Экономические пузыри",
    "description": "Рыночные крахи.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Экономическиепузыри)",
    "zoneIds": [
      "economics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 806000000,
      "costToSolve": 6100000,
      "marketGain": 1401000000,
      "riskLoss": 2639000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность Понци (экспоненциальный рост до обрыва)."
  },
  {
    "id": "real-catalog-91",
    "title": "Теорема Эрроу о невозможности",
    "description": "Идеальная избирательная система.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(ТеоремаЭрроуоневозможности)",
    "zoneIds": [
      "ethics"
    ],
    "dependencyIds": [],
    "dependentIds": [
      "real-catalog-93"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 633000000,
      "costToSolve": 1600000,
      "marketGain": 469000000,
      "riskLoss": 884000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Топологическая невозможность (парадокс голосования)."
  },
  {
    "id": "real-catalog-92",
    "title": "Дилемма заключенного",
    "description": "Неоптимальное равновесие Нэша.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Дилеммазаключенного)",
    "zoneIds": [
      "economics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 199000000,
      "costToSolve": 2700000,
      "marketGain": 1587000000,
      "riskLoss": 4251000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность эгоистической рациональности."
  },
  {
    "id": "real-catalog-93",
    "title": "Модель Блэка — Шоулза",
    "description": "Ценообразование опционов.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(МодельБлэкаШоулза)",
    "zoneIds": [
      "ethics"
    ],
    "dependencyIds": [
      "real-catalog-91"
    ],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 668000000,
      "costToSolve": 100000,
      "marketGain": 272000000,
      "riskLoss": 384000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность волатильности при t->T."
  },
  {
    "id": "real-catalog-94",
    "title": "Гиперинфляция",
    "description": "Неконтролируемый рост цен.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Гиперинфляция)",
    "zoneIds": [
      "economics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 428000000,
      "costToSolve": 1000000,
      "marketGain": 440000000,
      "riskLoss": 1840000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Расходимость денежной массы."
  },
  {
    "id": "real-catalog-95",
    "title": "Проблема выравнивания ИИ (Alignment)",
    "description": "Совпадение целей AGI с человеческими.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(ПроблемавыравниванияИИ(Alignment))",
    "zoneIds": [
      "ethics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 227000000,
      "costToSolve": 2100000,
      "marketGain": 148000000,
      "riskLoss": 1877000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Ортогональность интеллекта и целей."
  },
  {
    "id": "real-catalog-96",
    "title": "Универсальный базовый доход (UBI)",
    "description": "Экономика без работы.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Универсальныйбазовыйдоход(UBI))",
    "zoneIds": [
      "economics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 430000000,
      "costToSolve": 9700000,
      "marketGain": 1313000000,
      "riskLoss": 2418000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Граница инфляционной сингулярности."
  },
  {
    "id": "real-catalog-97",
    "title": "Вагонетка (Trolley Problem)",
    "description": "Моральный выбор ИИ.",
    "state": "unresolved",
    "type": "scientific_task",
    "targetFunction": "Formalize(Вагонетка(TrolleyProblem))",
    "zoneIds": [
      "ethics"
    ],
    "dependencyIds": [],
    "dependentIds": [
      "real-catalog-99"
    ],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 478000000,
      "costToSolve": 1900000,
      "marketGain": 1656000000,
      "riskLoss": 958000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность этической функции полезности."
  },
  {
    "id": "real-catalog-98",
    "title": "Распределение богатства Парето",
    "description": "Концентрация капитала.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(РаспределениебогатстваПарето)",
    "zoneIds": [
      "economics"
    ],
    "dependencyIds": [],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 482000000,
      "costToSolve": 4900000,
      "marketGain": 510000000,
      "riskLoss": 353000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Степенной закон распределения (хвостовая расходимость)."
  },
  {
    "id": "real-catalog-99",
    "title": "Экзистенциальный риск",
    "description": "Вероятность гибели человечества.",
    "state": "unresolved",
    "type": "core_singularity",
    "targetFunction": "Formalize(Экзистенциальныйриск)",
    "zoneIds": [
      "ethics"
    ],
    "dependencyIds": [
      "real-catalog-97"
    ],
    "dependentIds": [],
    "fractalDepth": 1,
    "economic": {
      "costUnresolved": 977000000,
      "costToSolve": 200000,
      "marketGain": 543000000,
      "riskLoss": 374000000
    },
    "rewardClass": "reputation",
    "prizeNote": "Catalog discovery",
    "singularityHint": "Сингулярность функции выживания (вероятность 0)."
  }
];
