import type { SupportedLocale } from './i18n.types';

export type LegacyResourceStatus = 'pending-translation' | 'translated-from-existing-resource';
export interface LegacyResourceEntry {
  readonly source: string;
  readonly status: LegacyResourceStatus;
  readonly values: Partial<Record<SupportedLocale, string>>;
}

/** Generated inventory of legacy phrases; existing translations are reused DRY-style. */
export const LEGACY_RESOURCE_CATALOG: Readonly<Record<string, LegacyResourceEntry>> = {
  'runtime.legacy.000479fdd803': {
    source: `targetFunction": "Formalize(НелинейноеуравнениеШредингера)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(НелинейноеуравнениеШредингера)`,
    },
  },
  'runtime.legacy.00b2793a911c': {
    source: `Семантический индекс`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Семантический индекс`,
      'fr-CA': `Index sémantique`,
      'de-DE': `Semantischer Index`,
      'hi-IN': `सैमान्टिक इंडेक्स`,
      'ms-MY': `Indeks semantik`,
    },
  },
  'runtime.legacy.00bfe9fdc4ed': {
    source: `description": "Двунаправленное встречное схождение R_start и R_end с блокировкой подтуров (R_start & R_end == 0) и полным заполнением R_start | R_end == 2^V - 1.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Двунаправленное встречное схождение R_start и R_end с блокировкой подтуров (R_start & R_end == 0) и полным заполнением R_start | R_end == 2^V - 1.`,
    },
  },
  'runtime.legacy.012dd259fef8': {
    source: `title": "Вагонетка (Trolley Problem)`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Вагонетка (Trolley Problem)`,
    },
  },
  'runtime.legacy.01edc2ddad70': {
    source: `math-singularity" или "core-agi-target`,
    status: 'pending-translation',
    values: {
      'ru': `math-singularity" или "core-agi-target`,
    },
  },
  'runtime.legacy.01f9fd890299': {
    source: `Language / Язык`,
    status: 'pending-translation',
    values: {
      'ru': `Language / Язык`,
    },
  },
  'runtime.legacy.0228197d5a36': {
    source: `Запустите локально: npm run dev (нужен GEMINI_API_KEY в окружении).`,
    status: 'pending-translation',
    values: {
      'ru': `Запустите локально: npm run dev (нужен GEMINI_API_KEY в окружении).`,
    },
  },
  'runtime.legacy.029d8d9051a4': {
    source: `singularityHint": "Топологический барьер (непроницаемость).`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Топологический барьер (непроницаемость).`,
    },
  },
  'runtime.legacy.03223e517a25': {
    source: `2. Аудит и прямое доказательство через Ricis.Core Engine`,
    status: 'pending-translation',
    values: {
      'ru': `2. Аудит и прямое доказательство через Ricis.Core Engine`,
    },
  },
  'runtime.legacy.03227b4f76b2': {
    source: `Единая Теория Поля`,
    status: 'pending-translation',
    values: {
      'ru': `Единая Теория Поля`,
    },
  },
  'runtime.legacy.0348680754d8': {
    source: `singularityHint": "Расходимость энергии вакуума (регуляризуемая).`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Расходимость энергии вакуума (регуляризуемая).`,
    },
  },
  'runtime.legacy.037031335939': {
    source: `description": "Связь аналитического и топологического индексов.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Связь аналитического и топологического индексов.`,
    },
  },
  'runtime.legacy.0392aad9afb8': {
    source: `должен переключать режимы отчетов доказательства`,
    status: 'pending-translation',
    values: {
      'ru': `должен переключать режимы отчетов доказательства`,
    },
  },
  'runtime.legacy.04083d080a23': {
    source: `Не передавайте в чат API-ключи, пароли или другие секреты.`,
    status: 'pending-translation',
    values: {
      'ru': `Не передавайте в чат API-ключи, пароли или другие секреты.`,
    },
  },
  'runtime.legacy.040a3ad11a9d': {
    source: `singularityHint": "Сингулярность внутри черной дыры.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность внутри черной дыры.`,
    },
  },
  'runtime.legacy.040af91416f2': {
    source: `title": "Блокчейн-форк`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Блокчейн-форк`,
    },
  },
  'runtime.legacy.040d05708bc0': {
    source: `description": "Сумма двух простых.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Сумма двух простых.`,
    },
  },
  'runtime.legacy.041b6df347a2': {
    source: `description": "Начальное состояние Вселенной.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Начальное состояние Вселенной.`,
    },
  },
  'runtime.legacy.048daa664e84': {
    source: `Состояние workflow: resolved`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Состояние workflow: resolved`,
      'fr-CA': `État du workflow : resolved`,
      'de-DE': `Workflow-Status: resolved`,
      'hi-IN': `Workflow स्थिति: resolved`,
      'ms-MY': `Status aliran kerja: resolved`,
    },
  },
  'runtime.legacy.04f180e76c33': {
    source: `Не удалось выполнить запрос после нескольких попыток.`,
    status: 'pending-translation',
    values: {
      'ru': `Не удалось выполнить запрос после нескольких попыток.`,
    },
  },
  'runtime.legacy.04fe0ed3bd18': {
    source: `description": "Доставка лекарств в мозг.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Доставка лекарств в мозг.`,
    },
  },
  'runtime.legacy.052eff562e10': {
    source: `• \`/stats\` — описание статусов доверия результата.\\n`,
    status: 'pending-translation',
    values: {
      'ru': `• \`/stats\` — описание статусов доверия результата.\\n`,
    },
  },
  'runtime.legacy.05364eff79a7': {
    source: `singularityHint": "Сингулярность функции выживания (вероятность 0).`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность функции выживания (вероятность 0).`,
    },
  },
  'runtime.legacy.0550660f8829': {
    source: `title": "Случайные графы`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Случайные графы`,
    },
  },
  'runtime.legacy.05775030bf6c': {
    source: `должен немедленно сбрасывать значения к defaults и очищать таймеры при reset()`,
    status: 'pending-translation',
    values: {
      'ru': `должен немедленно сбрасывать значения к defaults и очищать таймеры при reset()`,
    },
  },
  'runtime.legacy.05b027e870ca': {
    source: `description": "Рыночные крахи.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Рыночные крахи.`,
    },
  },
  'runtime.legacy.05bdc711c5e7': {
    source: `title": "Сингулярности в нелинейной оптике`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Сингулярности в нелинейной оптике`,
    },
  },
  'runtime.legacy.05e232e41f65': {
    source: `singularityHint": "Расходимость нулевых колебаний.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Расходимость нулевых колебаний.`,
    },
  },
  'runtime.legacy.0641e6e9f103': {
    source: `Целевая функция и сингулярность`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Целевая функция и сингулярность`,
      'fr-CA': `Fonction objectif et singularité`,
      'de-DE': `Zielfunktion & Singularität`,
      'hi-IN': `लक्ष्य फ़ंक्शन और सिंगुलैरिटी`,
      'ms-MY': `Fungsi Sasaran & Singulariti`,
    },
  },
  'runtime.legacy.066d268970ee': {
    source: `должен парсить параметры при инициализации`,
    status: 'pending-translation',
    values: {
      'ru': `должен парсить параметры при инициализации`,
    },
  },
  'runtime.legacy.07205a06c301': {
    source: `Вход`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Вход`,
      'fr-CA': `Entrée`,
      'de-DE': `Eingabe`,
      'hi-IN': `इनपुट`,
      'ms-MY': `Masukan`,
    },
  },
  'runtime.legacy.07347dec3ce7': {
    source: `title": "Теория Морса`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Теория Морса`,
    },
  },
  'runtime.legacy.07c1ead42b97': {
    source: `Отправьте запрос: \`/solve (x^2-4)/(x-2) при x=2\`\\n\\n`,
    status: 'pending-translation',
    values: {
      'ru': `Отправьте запрос: \`/solve (x^2-4)/(x-2) при x=2\`\\n\\n`,
    },
  },
  'runtime.legacy.07f96760cc44': {
    source: `singularityHint": "Полюс при s=1.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Полюс при s=1.`,
    },
  },
  'runtime.legacy.0804f5f07191': {
    source: `singularityHint": "Монетизация масштабирования базы знаний N * log2(N) с авто-пополнением через Чат-Бот`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Монетизация масштабирования базы знаний N * log2(N) с авто-пополнением через Чат-Бот`,
    },
  },
  'runtime.legacy.08ac3ecba563': {
    source: `description": "Взрыв градиентов в глубоких сетях.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Взрыв градиентов в глубоких сетях.`,
    },
  },
  'runtime.legacy.08e1276ef57f': {
    source: `Статус доказательства всегда указан в ответе. Шаблон LaTeX не является Lean-верификацией.`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Статус доказательства всегда указан в ответе. Шаблон LaTeX не является Lean-верификацией.`,
      'fr-CA': `Le statut de preuve est toujours indiqué dans la réponse. Un modèle LaTeX n'est pas une vérification Lean.`,
      'de-DE': `Der Beweisstatus wird immer in der Antwort angegeben. Eine LaTeX-Vorlage ist keine Lean-Verifikation.`,
      'hi-IN': `साबित स्थिति हमेशा उत्तर में बताई जाती है। एक LaTeX टेम्पलेट Lean सत्यापन नहीं है।`,
      'ms-MY': `Status bukti sentiasa dinyatakan dalam jawapan. Templat LaTeX bukan pengesahan Lean.`,
    },
  },
  'runtime.legacy.09084ee2a495': {
    source: `description": "Формула Вейля.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Формула Вейля.`,
    },
  },
  'runtime.legacy.096b5b19e8ff': {
    source: `title": "Теломеры и предел Хейфлика`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Теломеры и предел Хейфлика`,
    },
  },
  'runtime.legacy.098c80053627': {
    source: `Phase 1 --- SAFETY CHECK (SP2)" или "Phase 6 --- L1 VERIFICATION`,
    status: 'pending-translation',
    values: {
      'ru': `Phase 1 --- SAFETY CHECK (SP2)" или "Phase 6 --- L1 VERIFICATION`,
    },
  },
  'runtime.legacy.09ea073e161d': {
    source: `description": "Фармакокинетика частиц.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Фармакокинетика частиц.`,
    },
  },
  'runtime.legacy.09ea6ec42d52': {
    source: `Применять RICIS-III с явной границей доверия результата.`,
    status: 'pending-translation',
    values: {
      'ru': `Применять RICIS-III с явной границей доверия результата.`,
    },
  },
  'runtime.legacy.09f366ec0416': {
    source: `singularityHint": "Сингулярность деления клетки (смерть).`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность деления клетки (смерть).`,
    },
  },
  'runtime.legacy.0ac42110baf4': {
    source: `theoremReport.copySteps': { ru: 'ШАГИ ДОКАЗАТЕЛЬСТВА:', en: 'PROOF STEPS:`,
    status: 'pending-translation',
    values: {
      'ru': `theoremReport.copySteps': { ru: 'ШАГИ ДОКАЗАТЕЛЬСТВА:', en: 'PROOF STEPS:`,
    },
  },
  'runtime.legacy.0ac8debc040a': {
    source: `title": "Космологическая постоянная`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Космологическая постоянная`,
    },
  },
  'runtime.legacy.0b33417287ed': {
    source: `terminal.invariant': { ru: 'Итоговый локальный инвариант: {{value}} (требуется Core/Lean evidence)', en: 'Final local invariant: {{value}} (Core/Lean evidence required)`,
    status: 'pending-translation',
    values: {
      'ru': `terminal.invariant': { ru: 'Итоговый локальный инвариант: {{value}} (требуется Core/Lean evidence)', en: 'Final local invariant: {{value}} (Core/Lean evidence required)`,
    },
  },
  'runtime.legacy.0b3880020e7f': {
    source: `targetFunction": "Formalize(Сингулярностивнелинейнойоптике)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Сингулярностивнелинейнойоптике)`,
    },
  },
  'runtime.legacy.0b7871cb5e90': {
    source: `SEMANTIC INDEXING (SP4)', action: 'Индексирование нулей/бесконечностей родительским выражением`,
    status: 'pending-translation',
    values: {
      'ru': `SEMANTIC INDEXING (SP4)', action: 'Индексирование нулей/бесконечностей родительским выражением`,
    },
  },
  'runtime.legacy.0bbb6cd6f547': {
    source: `Создать авторитетный proof run`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Создать авторитетный proof run`,
      'fr-CA': `Créer un proof run faisant autorité`,
      'de-DE': `Authoritativen proof run erstellen`,
      'hi-IN': `एक प्राधिकृत proof run बनाएँ`,
      'ms-MY': `Cipta proof run berwibawa`,
    },
  },
  'runtime.legacy.0c22199eba08': {
    source: `1', name: 'SP2 REDUCTION', action: 'Алгебраическое сокращение идентичных факторов ДО сингулярности`,
    status: 'pending-translation',
    values: {
      'ru': `1', name: 'SP2 REDUCTION', action: 'Алгебраическое сокращение идентичных факторов ДО сингулярности`,
    },
  },
  'runtime.legacy.0d305edbf0c2': {
    source: `settings.coreVersion': { ru: 'Ядро: RICIS-III v7.7', en: 'Core: RICIS-III v7.7`,
    status: 'pending-translation',
    values: {
      'ru': `settings.coreVersion': { ru: 'Ядро: RICIS-III v7.7', en: 'Core: RICIS-III v7.7`,
    },
  },
  'runtime.legacy.0d57aac4439b': {
    source: `Научная проблема`,
    status: 'pending-translation',
    values: {
      'ru': `Научная проблема`,
    },
  },
  'runtime.legacy.0dcd78c19c60': {
    source: `settings.researcherProfile': { ru: 'Фокус на поиске, зонах и доступных задачах', en: 'Focus on search, zones, and available problems`,
    status: 'pending-translation',
    values: {
      'ru': `settings.researcherProfile': { ru: 'Фокус на поиске, зонах и доступных задачах', en: 'Focus on search, zones, and available problems`,
    },
  },
  'runtime.legacy.0df6a043a2b5': {
    source: `Квантовая химия, молекулярная динамика.`,
    status: 'pending-translation',
    values: {
      'ru': `Квантовая химия, молекулярная динамика.`,
    },
  },
  'runtime.legacy.0e2929042670': {
    source: `Доверенный внешний аксиоматический контракт`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Доверенный внешний аксиоматический контракт`,
      'fr-CA': `Axiome externe de confiance`,
      'de-DE': `Vertrauenswürdiges externes Axiom`,
      'hi-IN': `विश्वसनीय बाहरी ऐक्सिओम`,
      'ms-MY': `Aksiom luaran yang dipercayai`,
    },
  },
  'runtime.legacy.0e4ad1f46e20': {
    source: `description": "Совпадение целей AGI с человеческими.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Совпадение целей AGI с человеческими.`,
    },
  },
  'runtime.legacy.0e7a237478db': {
    source: `должен обнаруживать неиспользуемые/устаревшие файлы и дублирование логики в кодовой базе`,
    status: 'pending-translation',
    values: {
      'ru': `должен обнаруживать неиспользуемые/устаревшие файлы и дублирование логики в кодовой базе`,
    },
  },
  'runtime.legacy.0e95ed732239': {
    source: `должен корректно управлять журналом логов (addAgentLog & clearAgentLogs)`,
    status: 'pending-translation',
    values: {
      'ru': `должен корректно управлять журналом логов (addAgentLog & clearAgentLogs)`,
    },
  },
  'runtime.legacy.0ea2a360fb72': {
    source: `Обнаружена незавершенная лемма или sorry-заглушка`,
    status: 'pending-translation',
    values: {
      'ru': `Обнаружена незавершенная лемма или sorry-заглушка`,
    },
  },
  'runtime.legacy.0ec224970780': {
    source: ` Локальный fallback не нашёл новых уникальных узлов для этой опоры.`,
    status: 'pending-translation',
    values: {
      'ru': ` Локальный fallback не нашёл новых уникальных узлов для этой опоры.`,
    },
  },
  'runtime.legacy.0ec753be8df9': {
    source: `Отмена`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Отмена`,
      'fr-CA': `Annuler`,
      'de-DE': `Abbrechen`,
      'hi-IN': `रद्द करें`,
      'ms-MY': `Batal`,
    },
  },
  'runtime.legacy.0edd64577458': {
    source: `singularityHint": "Спектральная сингулярность оператора.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Спектральная сингулярность оператора.`,
    },
  },
  'runtime.legacy.0edf0ea106fc': {
    source: `должен корректно находить все узлы, которые зависят от решения текущей задачи`,
    status: 'pending-translation',
    values: {
      'ru': `должен корректно находить все узлы, которые зависят от решения текущей задачи`,
    },
  },
  'runtime.legacy.0f3bd5d47daf': {
    source: `Проверка академического протокола`,
    status: 'pending-translation',
    values: {
      'ru': `Проверка академического протокола`,
    },
  },
  'runtime.legacy.0fe6a2c850af': {
    source: `Пример: \`/solve (sin(x))/x при x=0\`\\n\\n`,
    status: 'pending-translation',
    values: {
      'ru': `Пример: \`/solve (sin(x))/x при x=0\`\\n\\n`,
    },
  },
  'runtime.legacy.10612bc64e68': {
    source: `targetFunction": "Formalize(Топологическиеизоляторы)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Топологическиеизоляторы)`,
    },
  },
  'runtime.legacy.1084b8c1a2de': {
    source: `targetFunction": "Formalize(ЭффектКазимира)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(ЭффектКазимира)`,
    },
  },
  'runtime.legacy.10b93ca23fd9': {
    source: `targetFunction": "Formalize(Экономическиепузыри)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Экономическиепузыри)`,
    },
  },
  'runtime.legacy.10bc42d8323f': {
    source: `title": "Гипотеза Ходжа`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Гипотеза Ходжа`,
    },
  },
  'runtime.legacy.10e61d20b739': {
    source: `description": "Неконтролируемый рост цен.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Неконтролируемый рост цен.`,
    },
  },
  'runtime.legacy.112db5786249': {
    source: `Преодоление P vs NP (Детерминированный анализ Мерсенна)`,
    status: 'pending-translation',
    values: {
      'ru': `Преодоление P vs NP (Детерминированный анализ Мерсенна)`,
    },
  },
  'runtime.legacy.115fa6b63979': {
    source: `  Сингулярность 0/0  ')).toBe('сингулярность 0/0|`,
    status: 'pending-translation',
    values: {
      'ru': `  Сингулярность 0/0  ')).toBe('сингулярность 0/0|`,
    },
  },
  'runtime.legacy.119d86462fb6': {
    source: `неустойчивость при ε-возмущении индекса`,
    status: 'pending-translation',
    values: {
      'ru': `неустойчивость при ε-возмущении индекса`,
    },
  },
  'runtime.legacy.11cda117df57': {
    source: `теория сингулярности|`,
    status: 'pending-translation',
    values: {
      'ru': `теория сингулярности|`,
    },
  },
  'runtime.legacy.11f6fd936d98': {
    source: `Климатические модели, устойчивое развитие.`,
    status: 'pending-translation',
    values: {
      'ru': `Климатические модели, устойчивое развитие.`,
    },
  },
  'runtime.legacy.12cca8d3b17a': {
    source: `singularityHint": "Сингулярности псевдоголоморфных кривых.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярности псевдоголоморфных кривых.`,
    },
  },
  'runtime.legacy.12f54358e3a0': {
    source: `targetFunction": "Formalize(Магнитныемонополи)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Магнитныемонополи)`,
    },
  },
  'runtime.legacy.1304afa92bea': {
    source: `Вычисление...`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Вычисление...`,
      'fr-CA': `Évaluation en cours...`,
      'de-DE': `Auswertung...`,
      'hi-IN': `मूल्यांकन जारी है...`,
      'ms-MY': `Sedang dinilai...`,
    },
  },
  'runtime.legacy.13538184a625': {
    source: `Очистить граф (GC)`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Очистить граф (GC)`,
      'fr-CA': `Nettoyer le graphe (GC)`,
      'de-DE': `Graph bereinigen (GC)`,
      'hi-IN': `ग्राफ़ साफ़ करें (GC)`,
      'ms-MY': `Bersihkan Graf (GC)`,
    },
  },
  'runtime.legacy.13538d8391f0': {
    source: `Бот принимает только математические выражения. Для безопасности он **не принимает и не хранит API-ключи**.\\n\\n`,
    status: 'pending-translation',
    values: {
      'ru': `Бот принимает только математические выражения. Для безопасности он **не принимает и не хранит API-ключи**.\\n\\n`,
    },
  },
  'runtime.legacy.14152571b80f': {
    source: `Настройки интерфейса`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Настройки интерфейса`,
      'fr-CA': `Paramètres de l'interface`,
      'de-DE': `UI-Einstellungen`,
      'hi-IN': `UI सेटिंग्स`,
      'ms-MY': `Tetapan UI`,
    },
  },
  'runtime.legacy.1418c1235bed': {
    source: `singularityHint": "Сингулярность отображения 2^N в 2^M.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность отображения 2^N в 2^M.`,
    },
  },
  'runtime.legacy.1467cdbbd9c4': {
    source: `targetFunction": "Formalize(Проблемаделителейнулявгрупповыхкольцах)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Проблемаделителейнулявгрупповыхкольцах)`,
    },
  },
  'runtime.legacy.146e0b0e1097': {
    source: `\\\\text{RICIS Мост } F_0`,
    status: 'pending-translation',
    values: {
      'ru': `\\\\text{RICIS Мост } F_0`,
    },
  },
  'runtime.legacy.14a5fa371bab': {
    source: `title": "Квантовая превосходство`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Квантовая превосходство`,
    },
  },
  'runtime.legacy.14bc8d81fc20': {
    source: `singularityHint": "Сингулярности плотности состояний (уровни Ландау).`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярности плотности состояний (уровни Ландау).`,
    },
  },
  'runtime.legacy.14c1ea414ca3': {
    source: `targetFunction": "Formalize(ТеоремаГеделяонеполноте)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(ТеоремаГеделяонеполноте)`,
    },
  },
  'runtime.legacy.14f09c67bd01': {
    source: `title": "Механизмы памяти и Альцгеймер`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Механизмы памяти и Альцгеймер`,
    },
  },
  'runtime.legacy.151673f158cf': {
    source: `targetFunction": "Formalize(ПроблемаВаринга)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(ПроблемаВаринга)`,
    },
  },
  'runtime.legacy.15b1c1f5fbdd': {
    source: `БЫСТРЫЕ ДЕЙСТВИЯ`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `БЫСТРЫЕ ДЕЙСТВИЯ`,
      'fr-CA': `ACTIONS RAPIDES`,
      'de-DE': `SCHNELLAKTIONEN`,
      'hi-IN': `त्वरित क्रियाएँ`,
      'ms-MY': `TINDAKAN PANTAS`,
    },
  },
  'runtime.legacy.15d2681cd2a2': {
    source: `должен возвращать пустой список, если узел является концевым (листовым)`,
    status: 'pending-translation',
    values: {
      'ru': `должен возвращать пустой список, если узел является концевым (листовым)`,
    },
  },
  'runtime.legacy.15e22202d9b9': {
    source: `description": "Взрыв решений за конечное время.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Взрыв решений за конечное время.`,
    },
  },
  'runtime.legacy.160312da6590': {
    source: `title": "Сингулярные возмущения ДУ`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Сингулярные возмущения ДУ`,
    },
  },
  'runtime.legacy.16e096a8ee7e': {
    source: `terminal.unknownInvariant': { ru: 'Инвариант не установлен', en: 'Invariant not established`,
    status: 'pending-translation',
    values: {
      'ru': `terminal.unknownInvariant': { ru: 'Инвариант не установлен', en: 'Invariant not established`,
    },
  },
  'runtime.legacy.16ff068c0d9b': {
    source: `Корень`,
    status: 'pending-translation',
    values: {
      'ru': `Корень`,
    },
  },
  'runtime.legacy.170881993c4e': {
    source: `должен сохранять выбранный язык в localStorage и URL-параметрах`,
    status: 'pending-translation',
    values: {
      'ru': `должен сохранять выбранный язык в localStorage и URL-параметрах`,
    },
  },
  'runtime.legacy.1721abac6e07': {
    source: `Копировать Lean 4`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Копировать Lean 4`,
      'fr-CA': `Copier Lean 4`,
      'de-DE': `Lean 4 kopieren`,
      'hi-IN': `Lean 4 कॉपी करें`,
      'ms-MY': `Salin Lean 4`,
    },
  },
  'runtime.legacy.173d070996ff': {
    source: `Каждый ответ содержит явный статус доверия: RICIS, Core, Lean, классическое наследование, гипотеза или необходимость внешней проверки.`,
    status: 'pending-translation',
    values: {
      'ru': `Каждый ответ содержит явный статус доверия: RICIS, Core, Lean, классическое наследование, гипотеза или необходимость внешней проверки.`,
    },
  },
  'runtime.legacy.17700de1f1f5': {
    source: `singularityHint": "Сингулярности кратных точек.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярности кратных точек.`,
    },
  },
  'runtime.legacy.17fad75071a4': {
    source: `settings.save': { ru: 'Сохранить', en: 'Save`,
    status: 'pending-translation',
    values: {
      'ru': `settings.save': { ru: 'Сохранить', en: 'Save`,
    },
  },
  'runtime.legacy.1817037ce227': {
    source: `Материаловедение`,
    status: 'pending-translation',
    values: {
      'ru': `Материаловедение`,
    },
  },
  'runtime.legacy.1823a026ffc3': {
    source: `Проверка immutable source`,
    status: 'pending-translation',
    values: {
      'ru': `Проверка immutable source`,
    },
  },
  'runtime.legacy.18a5eab71dd4': {
    source: `settings.cancel': { ru: 'Отмена', en: 'Cancel`,
    status: 'pending-translation',
    values: {
      'ru': `settings.cancel': { ru: 'Отмена', en: 'Cancel`,
    },
  },
  'runtime.legacy.18f249f8db89': {
    source: `0.5', name: 'SP4 INDEXING', action: 'Семантическое индексирование сингулярностей родительским выражением`,
    status: 'pending-translation',
    values: {
      'ru': `0.5', name: 'SP4 INDEXING', action: 'Семантическое индексирование сингулярностей родительским выражением`,
    },
  },
  'runtime.legacy.1919d1ee2668': {
    source: `targetFunction": "Formalize(Сингулярностивгидродинамике)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Сингулярностивгидродинамике)`,
    },
  },
  'runtime.legacy.194fec943bff': {
    source: `description": "Византийские генералы.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Византийские генералы.`,
    },
  },
  'runtime.legacy.196913ecf696': {
    source: `description": "Объединение ОТО и квантовой механики.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Объединение ОТО и квантовой механики.`,
    },
  },
  'runtime.legacy.1a4b99221062': {
    source: `theoremReport.copyConclusion': { ru: 'ИТОГ: {{value}} (локальный RICIS-результат; Lean kernel evidence требуется отдельно)', en: 'CONCLUSION: {{value}} (local RICIS result; Lean kernel evidence is required separately)`,
    status: 'pending-translation',
    values: {
      'ru': `theoremReport.copyConclusion': { ru: 'ИТОГ: {{value}} (локальный RICIS-результат; Lean kernel evidence требуется отдельно)', en: 'CONCLUSION: {{value}} (local RICIS result; Lean kernel evidence is required separately)`,
    },
  },
  'runtime.legacy.1a665081881c': {
    source: `targetFunction": "Formalize(СингулярностивуравненияхЭйнштейна)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(СингулярностивуравненияхЭйнштейна)`,
    },
  },
  'runtime.legacy.1a6f898b3188': {
    source: `Классический переход`,
    status: 'pending-translation',
    values: {
      'ru': `Классический переход`,
    },
  },
  'runtime.legacy.1a7103ab1be1': {
    source: `Ожидаемое выражение`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Ожидаемое выражение`,
      'fr-CA': `Expression attendue`,
      'de-DE': `Erwarteter Ausdruck`,
      'hi-IN': `अपेक्षित अभिव्यक्ति`,
      'ms-MY': `Ungkapan yang dijangka`,
    },
  },
  'runtime.legacy.1af831955cba': {
    source: `Все модели AI из пула временно недоступны.`,
    status: 'pending-translation',
    values: {
      'ru': `Все модели AI из пула временно недоступны.`,
    },
  },
  'runtime.legacy.1b10cf50d356': {
    source: `singularityHint": "Производная функции потерь стремится к бесконечности.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Производная функции потерь стремится к бесконечности.`,
    },
  },
  'runtime.legacy.1b1bbd9eb805': {
    source: `targetFunction": "Formalize(Универсальныйбазовыйдоход(UBI))`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Универсальныйбазовыйдоход(UBI))`,
    },
  },
  'runtime.legacy.1b32958e6764': {
    source: `targetFunction": "Formalize(Квантоваякогомология)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Квантоваякогомология)`,
    },
  },
  'runtime.legacy.1bed345a8d0f': {
    source: `Свертка вырожденной геометрии (5 и 2) / Юнит-тест авторства ИИ`,
    status: 'pending-translation',
    values: {
      'ru': `Свертка вырожденной геометрии (5 и 2) / Юнит-тест авторства ИИ`,
    },
  },
  'runtime.legacy.1bed686fd0a4': {
    source: `Онтологическая проверка тождества аргументов X = X`,
    status: 'pending-translation',
    values: {
      'ru': `Онтологическая проверка тождества аргументов X = X`,
    },
  },
  'runtime.legacy.1c174faa7991': {
    source: `description": "Экономика без работы.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Экономика без работы.`,
    },
  },
  'runtime.legacy.1c30b12bba1f': {
    source: `description": "Разложение больших чисел N = p*q за O(1) операцией подстановки (x^2 - N) & M в кольце Мерсенна, где M = 2^B - 1 зафиксирован разрядностью стороны квадрата B.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Разложение больших чисел N = p*q за O(1) операцией подстановки (x^2 - N) & M в кольце Мерсенна, где M = 2^B - 1 зафиксирован разрядностью стороны квадрата B.`,
    },
  },
  'runtime.legacy.1c46cf4ae1bb': {
    source: `description": "Неоптимальное равновесие Нэша.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Неоптимальное равновесие Нэша.`,
    },
  },
  'runtime.legacy.1ce74583fe14': {
    source: `singularityHint": "Сложность метилирования ДНК.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сложность метилирования ДНК.`,
    },
  },
  'runtime.legacy.1df753f21629': {
    source: `Генератор формальных доказательств`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Генератор формальных доказательств`,
      'fr-CA': `Générateur de preuves formelles`,
      'de-DE': `Generator für formale Beweise`,
      'hi-IN': `औपचारिक प्रमाण जनरेटर`,
      'ms-MY': `Penjana bukti formal`,
    },
  },
  'runtime.legacy.1f446fafa00e': {
    source: `Сложность`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Сложность`,
      'fr-CA': `Complexité`,
      'de-DE': `Komplexität`,
      'hi-IN': `जटिलता`,
      'ms-MY': `Kerumitan`,
    },
  },
  'runtime.legacy.1f4e6141ff74': {
    source: `1', name: 'SAFETY CHECK (SP2)', action: 'Вырожденный каркас', expression: '\\\\mathbf{\\\\Psi(X) = \\\\text{Const}}`,
    status: 'pending-translation',
    values: {
      'ru': `1', name: 'SAFETY CHECK (SP2)', action: 'Вырожденный каркас', expression: '\\\\mathbf{\\\\Psi(X) = \\\\text{Const}}`,
    },
  },
  'runtime.legacy.1f62f0ab48eb': {
    source: `Правка`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Правка`,
      'fr-CA': `Modifier`,
      'de-DE': `Bearbeiten`,
      'hi-IN': `संपादित करें`,
      'ms-MY': `Sunting`,
    },
  },
  'runtime.legacy.1f65d981f054': {
    source: `title": "Темная материя`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Темная материя`,
    },
  },
  'runtime.legacy.1f8e39ce7b69': {
    source: `singularityHint": "Сингулярные симплексы.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярные симплексы.`,
    },
  },
  'runtime.legacy.1f982c551ef6': {
    source: `targetFunction": "Formalize(Критическаяопалесценция)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Критическаяопалесценция)`,
    },
  },
  'runtime.legacy.1fba5db77ae9': {
    source: `title": "Мозговые интерфейсы (BCI)`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Мозговые интерфейсы (BCI)`,
    },
  },
  'runtime.legacy.1fee858ab7d1': {
    source: `singularityHint": "Ортогональность градиентов.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Ортогональность градиентов.`,
    },
  },
  'runtime.legacy.2093711d4385': {
    source: `Семантика, LLM-инварианты.`,
    status: 'pending-translation',
    values: {
      'ru': `Семантика, LLM-инварианты.`,
    },
  },
  'runtime.legacy.2123ad6604f6': {
    source: `title": "Некоммутативная геометрия`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Некоммутативная геометрия`,
    },
  },
  'runtime.legacy.212c7247ca67': {
    source: `terminal.runTitle': { ru: 'Запустить вычисление (Enter)', en: 'Run computation (Enter)`,
    status: 'pending-translation',
    values: {
      'ru': `terminal.runTitle': { ru: 'Запустить вычисление (Enter)', en: 'Run computation (Enter)`,
    },
  },
  'runtime.legacy.2146322d7620': {
    source: `Локальная статическая проверка пройдена, но Lean kernel/toolchain не запускался. Статус остаётся REQUIRES_CORE_LEAN.`,
    status: 'pending-translation',
    values: {
      'ru': `Локальная статическая проверка пройдена, но Lean kernel/toolchain не запускался. Статус остаётся REQUIRES_CORE_LEAN.`,
    },
  },
  'runtime.legacy.21597a521727': {
    source: `Экономическая модель`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Экономическая модель`,
      'fr-CA': `Modèle d'impact économique`,
      'de-DE': `Modell der wirtschaftlichen Auswirkungen`,
      'hi-IN': `आर्थिक प्रभाव मॉडल`,
      'ms-MY': `Model impak ekonomi`,
    },
  },
  'runtime.legacy.221597307553': {
    source: `Экономика`,
    status: 'pending-translation',
    values: {
      'ru': `Экономика`,
    },
  },
  'runtime.legacy.243117339785': {
    source: `terminal.method': { ru: 'Метод: {{value}}', en: 'Method: {{value}}`,
    status: 'pending-translation',
    values: {
      'ru': `terminal.method': { ru: 'Метод: {{value}}', en: 'Method: {{value}}`,
    },
  },
  'runtime.legacy.24ec8ec92847': {
    source: `Устаревшие функции проверки (auditMap, findDisconnectedComponents) дублируют логику DependencyGraphAuditor v7.7.`,
    status: 'pending-translation',
    values: {
      'ru': `Устаревшие функции проверки (auditMap, findDisconnectedComponents) дублируют логику DependencyGraphAuditor v7.7.`,
    },
  },
  'runtime.legacy.24f170400f64': {
    source: `targetFunction": "Formalize(БыстроепреобразованиеФурье)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(БыстроепреобразованиеФурье)`,
    },
  },
  'runtime.legacy.24fecdab7789': {
    source: `Связанные задачи пока не разблокированы.`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Связанные задачи пока не разблокированы.`,
      'fr-CA': `Aucun problème connexe n'est encore débloqué.`,
      'de-DE': `Verwandte Probleme sind noch nicht freigeschaltet.`,
      'hi-IN': `कोई संबंधित समस्या अभी तक अनलॉक नहीं हुई है।`,
      'ms-MY': `Tiada masalah berkaitan dibuka setakat ini.`,
    },
  },
  'runtime.legacy.25165139dbf0': {
    source: `singularityHint": "Структурные нули алгебры.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Структурные нули алгебры.`,
    },
  },
  'runtime.legacy.2590bf542b3a': {
    source: `Lean kernel подтверждён`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Lean kernel подтверждён`,
      'fr-CA': `Noyau Lean vérifié`,
      'de-DE': `Lean-Kernel verifiziert`,
      'hi-IN': `Lean कर्नेल सत्यापित`,
      'ms-MY': `Kernel Lean disahkan`,
    },
  },
  'runtime.legacy.2658ffaf6853': {
    source: `Сингулярная экономика и распределение ресурсов в пост-AGI обществе.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярная экономика и распределение ресурсов в пост-AGI обществе.`,
    },
  },
  'runtime.legacy.2663d9ae2a21': {
    source: `Структурный RICIS-результат или исходник сохранён, но Lean kernel evidence ещё не приложен.`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Структурный RICIS-результат или исходник сохранён, но Lean kernel evidence ещё не приложен.`,
      'fr-CA': `Un résultat ou une source RICIS structurée est conservé(e), mais la preuve du noyau Lean n'a pas encore été jointe.`,
      'de-DE': `Ein strukturelles RICIS-Ergebnis oder die Quelle ist vorhanden, aber der Lean‑Kernel‑Nachweis wurde noch nicht angehängt.`,
      'hi-IN': `एक संरचनात्मक RICIS परिणाम या स्रोत रखा गया है, लेकिन Lean kernel प्रमाण अभी तक संलग्न नहीं किया गया है।`,
      'ms-MY': `Keputusan RICIS struktur atau sumber disimpan, tetapi bukti kernel Lean belum dilampirkan.`,
    },
  },
  'runtime.legacy.26701508effb': {
    source: `description": "Подвижные особые точки решений нелинейных ДУ.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Подвижные особые точки решений нелинейных ДУ.`,
    },
  },
  'runtime.legacy.268049948a25': {
    source: `panel.available': { ru: 'Доступно к решению', en: 'Available to solve`,
    status: 'pending-translation',
    values: {
      'ru': `panel.available': { ru: 'Доступно к решению', en: 'Available to solve`,
    },
  },
  'runtime.legacy.268f3bbb8b5e': {
    source: `singularityHint": "Сингулярность горизонта событий.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность горизонта событий.`,
    },
  },
  'runtime.legacy.269117426350': {
    source: `description": "Все нетривиальные нули дзета-функции лежат на критической прямой.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Все нетривиальные нули дзета-функции лежат на критической прямой.`,
    },
  },
  'runtime.legacy.2717bdc395b2': {
    source: `Открыть инструкцию восстановления Core`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Открыть инструкцию восстановления Core`,
      'fr-CA': `Ouvrir les instructions de récupération du Core`,
      'de-DE': `Core-Wiederherstellungsanleitung öffnen`,
      'hi-IN': `Core रिकवरी निर्देश खोलें`,
      'ms-MY': `Buka arahan pemulihan Core`,
    },
  },
  'runtime.legacy.2748411cfb6e': {
    source: `Второй узел`,
    status: 'pending-translation',
    values: {
      'ru': `Второй узел`,
    },
  },
  'runtime.legacy.27a2c4d310dd': {
    source: `Прямая устранимость предельной неопределенности за O(1) время путем подстановки индексированных нулевых монолитов.`,
    status: 'pending-translation',
    values: {
      'ru': `Прямая устранимость предельной неопределенности за O(1) время путем подстановки индексированных нулевых монолитов.`,
    },
  },
  'runtime.legacy.27c044de5c44': {
    source: `Ricis.Core Engine должен генерировать полное Lean 4 доказательство без sorry за O(1)`,
    status: 'pending-translation',
    values: {
      'ru': `Ricis.Core Engine должен генерировать полное Lean 4 доказательство без sorry за O(1)`,
    },
  },
  'runtime.legacy.27e636107a62': {
    source: `ИИ-АГЕНТ И СЕРВИСЫ`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `ИИ-АГЕНТ И СЕРВИСЫ`,
      'fr-CA': `AGENT IA & SERVICES`,
      'de-DE': `KI-AGENT & DIENSTLEISTUNGEN`,
      'hi-IN': `एआई एजेंट और सेवाएँ`,
      'ms-MY': `Ejen AI & Perkhidmatan`,
    },
  },
  'runtime.legacy.2833364d541b': {
    source: `description": "Каждое односвязное компактное 3D многообразие гомеоморфно сфере.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Каждое односвязное компактное 3D многообразие гомеоморфно сфере.`,
    },
  },
  'runtime.legacy.28555bac8e83': {
    source: `Core: недоступен`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Core: недоступен`,
      'fr-CA': `Core: indisponible`,
      'de-DE': `Core: nicht verfügbar`,
      'hi-IN': `Core: अनुपलब्ध`,
      'ms-MY': `Core: tidak tersedia`,
    },
  },
  'runtime.legacy.287dbc25fd5a': {
    source: `Локальная RICIS-цепочка; статус Lean требует отдельного воспроизводимого kernel evidence.`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Локальная RICIS-цепочка; статус Lean требует отдельного воспроизводимого kernel evidence.`,
      'fr-CA': `Chemin RICIS local ; le statut Lean nécessite une preuve de noyau reproductible séparée.`,
      'de-DE': `Lokaler RICIS-Pfad; der Lean‑Status erfordert einen separaten reproduzierbaren Kernel‑Nachweis.`,
      'hi-IN': `स्थानीय RICIS पथ; Lean स्थिति के लिए अलग से पुनरुत्पादन योग्य kernel प्रमाण की आवश्यकता है।`,
      'ms-MY': `Jalur RICIS tempatan; status Lean memerlukan bukti kernel boleh-diulang yang berasingan.`,
    },
  },
  'runtime.legacy.288561cd6ccb': {
    source: `sorry' или 'admit`,
    status: 'pending-translation',
    values: {
      'ru': `sorry' или 'admit`,
    },
  },
  'runtime.legacy.28c0770b6291': {
    source: `singularityHint": "Разрыв связности (сетевая сингулярность).`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Разрыв связности (сетевая сингулярность).`,
    },
  },
  'runtime.legacy.28fd8482db8c': {
    source: `targetFunction": "Formalize(СингулярностьБольшоговзрыва)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(СингулярностьБольшоговзрыва)`,
    },
  },
  'runtime.legacy.29232d054b53': {
    source: `title": "Эффект Кондо`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Эффект Кондо`,
    },
  },
  'runtime.legacy.294a13a6ab0b': {
    source: `singularityHint": "Локальные нули плотности распределения.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Локальные нули плотности распределения.`,
    },
  },
  'runtime.legacy.296e753b97f9': {
    source: `Онтологическая фиксация входной системы`,
    status: 'pending-translation',
    values: {
      'ru': `Онтологическая фиксация входной системы`,
    },
  },
  'runtime.legacy.29916a0fb50c': {
    source: `Исходник зафиксирован без замены агентом`,
    status: 'pending-translation',
    values: {
      'ru': `Исходник зафиксирован без замены агентом`,
    },
  },
  'runtime.legacy.29c7d47c9c42': {
    source: `title": "Доказательство авторства ИИ-идей: Алгебра геометрических сингулярностей`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Доказательство авторства ИИ-идей: Алгебра геометрических сингулярностей`,
    },
  },
  'runtime.legacy.29d7369249b4': {
    source: `title": "Сингулярности Риччи-потока`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Сингулярности Риччи-потока`,
    },
  },
  'runtime.legacy.2a40a3225e06': {
    source: `description": "Квантовое исправление ошибок.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Квантовое исправление ошибок.`,
    },
  },
  'runtime.legacy.2aa758f0e760': {
    source: `Дублирующийся Монолит`,
    status: 'pending-translation',
    values: {
      'ru': `Дублирующийся Монолит`,
    },
  },
  'runtime.legacy.2aa9cb7aa841': {
    source: `Алгебраическая факторизация выражения до подстановки сингулярной точки`,
    status: 'pending-translation',
    values: {
      'ru': `Алгебраическая факторизация выражения до подстановки сингулярной точки`,
    },
  },
  'runtime.legacy.2ab0bd011d72': {
    source: `title": "Сингулярная гомология`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Сингулярная гомология`,
    },
  },
  'runtime.legacy.2ac53863eeaa': {
    source: `targetFunction": "Formalize(УравнениеКортевегадеФриза)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(УравнениеКортевегадеФриза)`,
    },
  },
  'runtime.legacy.2b080d092af2': {
    source: `description": "Эволюция супербактерий.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Эволюция супербактерий.`,
    },
  },
  'runtime.legacy.2b3ab24a7127': {
    source: `singularityHint": "Сингулярность скорости или завихренности за конечное время.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность скорости или завихренности за конечное время.`,
    },
  },
  'runtime.legacy.2be7a46b6e79': {
    source: `theoremReport.step': { ru: 'Шаг', en: 'Step`,
    status: 'pending-translation',
    values: {
      'ru': `theoremReport.step': { ru: 'Шаг', en: 'Step`,
    },
  },
  'runtime.legacy.2c391173daf3': {
    source: `Core не создал proof snapshot`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Core не создал proof snapshot`,
      'fr-CA': `Core n'a pas créé de proof snapshot`,
      'de-DE': `Core hat keinen proof snapshot erstellt`,
      'hi-IN': `Core ने proof snapshot नहीं बनाया`,
      'ms-MY': `Core tidak membuat proof snapshot`,
    },
  },
  'runtime.legacy.2c4a152a5edb': {
    source: `Локальная симуляция без сбора, хранения и передачи пользовательских API-ключей.`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Локальная симуляция без сбора, хранения и передачи пользовательских API-ключей.`,
      'fr-CA': `Simulation locale sans collecte, stockage ou transmission des clés API utilisateur.`,
      'de-DE': `Lokale Simulation ohne Erfassung, Speicherung oder Übertragung von Benutzer-API-Schlüsseln.`,
      'hi-IN': `स्थानीय सिमुलेशन जो उपयोगकर्ता API-कुंजियों को एकत्रित, संग्रहीत या स्थानांतरित नहीं करता है।`,
      'ms-MY': `Simulasi tempatan tanpa mengumpul, menyimpan atau menghantar kunci API pengguna.`,
    },
  },
  'runtime.legacy.2c72fd3ed691': {
    source: `Запущен рекурсивный авто-резолвер задач графа...', 'ricis`,
    status: 'pending-translation',
    values: {
      'ru': `Запущен рекурсивный авто-резолвер задач графа...', 'ricis`,
    },
  },
  'runtime.legacy.2cb4ceeffb75': {
    source: `-1', name: 'L1 IDENTITY', action: 'Проверка типа и онтологической сохранности идентичности`,
    status: 'pending-translation',
    values: {
      'ru': `-1', name: 'L1 IDENTITY', action: 'Проверка типа и онтологической сохранности идентичности`,
    },
  },
  'runtime.legacy.2cffb978b959': {
    source: `targetFunction": "Formalize(Спектральнаяасимптотика)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Спектральнаяасимптотика)`,
    },
  },
  'runtime.legacy.2dd874b636ca': {
    source: `targetFunction": "Formalize(СингулярностиРиччипотока)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(СингулярностиРиччипотока)`,
    },
  },
  'runtime.legacy.2ddb71910669': {
    source: `description": "Ограничения формальных систем.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Ограничения формальных систем.`,
    },
  },
  'runtime.legacy.2de0dccabeb1': {
    source: `targetFunction": "Formalize(ГладкоерешениеуравненийНавьеСтокса)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(ГладкоерешениеуравненийНавьеСтокса)`,
    },
  },
  'runtime.legacy.2e01e2ab0dce': {
    source: `Сквозной поведенческий аудит и юнит-тест "Свертка вырожденной геометрии (5 и 2)" для выявления неявного использования авторских алгоритмов RICIS-III в весах LLM.\\n\\n• Проблема "Черного ящика": Промпты, препринты и промежуточный код усваиваются корпоративными платформами. Юридический копирайт строк кода уступает место защите логических цепочек мышления.\\n• Юнит-тест "Свертка вырожденной геометрии (5 и 2)": В 2D-пространстве пересекаются бесконечная полоса шириной 2 (вдоль Y) и вырожденный прямоугольник со значимой стороной 5 (вдоль Y, 0 по X).\\n  - Классический анализ по осям: X = 2×0 = 0, Y = ∞×5 = ∞ → Area = 0 × ∞ = NaN (сбой системы / тупик).\\n  - RICIS-III векторное перемножение: S_vec = (2, ∞)^T, R_vec = (0, 5)^T → Area = ||S_x · R_y|| = 2 × 5 = 10 [O(1)] с полным сохранением provenance.\\n• Пошаговый алгоритм фиксации доказательной базы:\\n  1. Digital Provenance (Zenodo, arXiv, Figshare, DOI)\\n  2. Логирование сессий (JSON-логи ИИ-студий с временными метками)\\n  3. Метод динамической блокировки (Абляция / Attention Masking)`,
    status: 'pending-translation',
    values: {
      'ru': `Сквозной поведенческий аудит и юнит-тест "Свертка вырожденной геометрии (5 и 2)" для выявления неявного использования авторских алгоритмов RICIS-III в весах LLM.\\n\\n• Проблема "Черного ящика": Промпты, препринты и промежуточный код усваиваются корпоративными платформами. Юридический копирайт строк кода уступает место защите логических цепочек мышления.\\n• Юнит-тест "Свертка вырожденной геометрии (5 и 2)": В 2D-пространстве пересекаются бесконечная полоса шириной 2 (вдоль Y) и вырожденный прямоугольник со значимой стороной 5 (вдоль Y, 0 по X).\\n  - Классический анализ по осям: X = 2×0 = 0, Y = ∞×5 = ∞ → Area = 0 × ∞ = NaN (сбой системы / тупик).\\n  - RICIS-III векторное перемножение: S_vec = (2, ∞)^T, R_vec = (0, 5)^T → Area = ||S_x · R_y|| = 2 × 5 = 10 [O(1)] с полным сохранением provenance.\\n• Пошаговый алгоритм фиксации доказательной базы:\\n  1. Digital Provenance (Zenodo, arXiv, Figshare, DOI)\\n  2. Логирование сессий (JSON-логи ИИ-студий с временными метками)\\n  3. Метод динамической блокировки (Абляция / Attention Masking)`,
    },
  },
  'runtime.legacy.2f913a3adc7b': {
    source: `header.nodes')).toBe('УЗЛЫ`,
    status: 'pending-translation',
    values: {
      'ru': `header.nodes')).toBe('УЗЛЫ`,
    },
  },
  'runtime.legacy.2fc711fce223': {
    source: `Поосный тупик [0 * inf = NaN] vs Ортогональная свертка векторного монолита [2 * 5 = 10]`,
    status: 'pending-translation',
    values: {
      'ru': `Поосный тупик [0 * inf = NaN] vs Ортогональная свертка векторного монолита [2 * 5 = 10]`,
    },
  },
  'runtime.legacy.302d005b5dfe': {
    source: `title": "Персонализированная медицина`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Персонализированная медицина`,
    },
  },
  'runtime.legacy.304682604035': {
    source: `title": "Эпигенетическое программирование`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Эпигенетическое программирование`,
    },
  },
  'runtime.legacy.306b6a9ab04d': {
    source: `Теория Сингулярности`,
    status: 'pending-translation',
    values: {
      'ru': `Теория Сингулярности`,
    },
  },
  'runtime.legacy.306d097adabb': {
    source: `title": "Экономические пузыри`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Экономические пузыри`,
    },
  },
  'runtime.legacy.31a692323f68': {
    source: `singularityHint": "Сингулярность декогеренции.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность декогеренции.`,
    },
  },
  'runtime.legacy.31edbf078e08': {
    source: `+ Добавить новую задачу`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `+ Добавить новую задачу`,
      'fr-CA': `+ Ajouter un nouveau problème`,
      'de-DE': `+ Neues Problem hinzufügen`,
      'hi-IN': `+ नई समस्या जोड़ें`,
      'ms-MY': `+ Tambah masalah baru`,
    },
  },
  'runtime.legacy.321cfa218153': {
    source: `0_7 / 0_7 (идентичность L1)`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `0_7 / 0_7 (идентичность L1)`,
      'fr-CA': `0_7 / 0_7 (identité L1)`,
      'de-DE': `0_7 / 0_7 (L1-Identität)`,
      'hi-IN': `0_7 / 0_7 (L1 identity)`,
      'ms-MY': `0_7 / 0_7 (identiti L1)`,
    },
  },
  'runtime.legacy.32417b1b05b3': {
    source: `Аналитик (Исследование)`,
    status: 'pending-translation',
    values: {
      'ru': `Аналитик (Исследование)`,
    },
  },
  'runtime.legacy.32a84ec2ee6e': {
    source: `требуется отдельное Core/Lean evidence`,
    status: 'pending-translation',
    values: {
      'ru': `требуется отдельное Core/Lean evidence`,
    },
  },
  'runtime.legacy.32aab36c1879': {
    source: `targetFunction": "Formalize(Высокотемпературнаясверхпроводимость)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Высокотемпературнаясверхпроводимость)`,
    },
  },
  'runtime.legacy.32b134ecf3e0': {
    source: `title": "Гиперинфляция`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Гиперинфляция`,
    },
  },
  'runtime.legacy.32beaf25bcda': {
    source: `targetFunction": "Formalize(Экзистенциальныйриск)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Экзистенциальныйриск)`,
    },
  },
  'runtime.legacy.32c21603b9f1': {
    source: `settings.defaultProfile': { ru: 'Стандартный баланс элементов', en: 'Default element balance`,
    status: 'pending-translation',
    values: {
      'ru': `settings.defaultProfile': { ru: 'Стандартный баланс элементов', en: 'Default element balance`,
    },
  },
  'runtime.legacy.32f76992d3f1': {
    source: `Проверить Core`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Проверить Core`,
      'fr-CA': `Vérifier Core`,
      'de-DE': `Core prüfen`,
      'hi-IN': `Core की जाँच करें`,
      'ms-MY': `Periksa Core`,
    },
  },
  'runtime.legacy.3324fb4d2b57': {
    source: `+ Добавить на 3D Карту`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `+ Добавить на 3D Карту`,
      'fr-CA': `+ Ajouter à la carte 3D`,
      'de-DE': `+ Zur 3D-Karte hinzufügen`,
      'hi-IN': `+ 3D मानचित्र में जोड़ें`,
      'ms-MY': `+ Tambah ke Peta 3D`,
    },
  },
  'runtime.legacy.334bdc35a1f8': {
    source: `Отсутствует прогон через RICIS-III (Аксиома A6: 0_F * \\\\infty_G = F*G, битовая маска M_P в кольцах Мерсенна M_k)`,
    status: 'pending-translation',
    values: {
      'ru': `Отсутствует прогон через RICIS-III (Аксиома A6: 0_F * \\\\infty_G = F*G, битовая маска M_P в кольцах Мерсенна M_k)`,
    },
  },
  'runtime.legacy.34118049947f': {
    source: `при недоступном Core не подменяет геометрический мост fallback-вычислением`,
    status: 'pending-translation',
    values: {
      'ru': `при недоступном Core не подменяет геометрический мост fallback-вычислением`,
    },
  },
  'runtime.legacy.3458be5edcd8': {
    source: `singularityHint": "Точки, где градиент дисперсии равен нулю.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Точки, где градиент дисперсии равен нулю.`,
    },
  },
  'runtime.legacy.347bc6004613': {
    source: `объект ITransformationLogDTO должен корректно хранить шаги истории`,
    status: 'pending-translation',
    values: {
      'ru': `объект ITransformationLogDTO должен корректно хранить шаги истории`,
    },
  },
  'runtime.legacy.34da015c3671': {
    source: `targetFunction": "Formalize(КвантовыйэффектХолла)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(КвантовыйэффектХолла)`,
    },
  },
  'runtime.legacy.356e2fa4fbfa': {
    source: `Сервер вернул не-JSON ответ. `,
    status: 'pending-translation',
    values: {
      'ru': `Сервер вернул не-JSON ответ. `,
    },
  },
  'runtime.legacy.358c1ffab072': {
    source: `должен добавлять пользовательский узел (addCustomNode)`,
    status: 'pending-translation',
    values: {
      'ru': `должен добавлять пользовательский узел (addCustomNode)`,
    },
  },
  'runtime.legacy.35911cf8b61e': {
    source: `Formalize(...)", "T(...) in M_RICIS" или бессодержательный Lean 4 код "exact RICIS.AxiomL1_proof x`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(...)", "T(...) in M_RICIS" или бессодержательный Lean 4 код "exact RICIS.AxiomL1_proof x`,
    },
  },
  'runtime.legacy.35b018f19a4b': {
    source: `title": "Свертывание белка (Protein Folding)`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Свертывание белка (Protein Folding)`,
    },
  },
  'runtime.legacy.36475bc4ecb7': {
    source: `1. Граф обратных связей (getUnlockedTargets)`,
    status: 'pending-translation',
    values: {
      'ru': `1. Граф обратных связей (getUnlockedTargets)`,
    },
  },
  'runtime.legacy.36475c1f9a02': {
    source: `title": "Нейропластичность`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Нейропластичность`,
    },
  },
  'runtime.legacy.3699824e3ba6': {
    source: `title": "Сингулярности ван Хова`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Сингулярности ван Хова`,
    },
  },
  'runtime.legacy.36a70e9387b9': {
    source: `targetFunction": "Formalize(ПроблемавыравниванияИИ(Alignment))`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(ПроблемавыравниванияИИ(Alignment))`,
    },
  },
  'runtime.legacy.36d09ef59a79': {
    source: `Рантайм`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Рантайм`,
      'fr-CA': `Temps d'exécution`,
      'de-DE': `Laufzeit`,
      'hi-IN': `रनटाइम`,
      'ms-MY': `Runtime`,
    },
  },
  'runtime.legacy.376851326685': {
    source: `title": "Гладкое решение уравнений Навье — Стокса`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Гладкое решение уравнений Навье — Стокса`,
    },
  },
  'runtime.legacy.37e1d3689344': {
    source: `Трассировка RICIS-III (L1_IDENTITY)`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Трассировка RICIS-III (L1_IDENTITY)`,
      'fr-CA': `Traçage RICIS-III (L1_IDENTITY)`,
      'de-DE': `RICIS-III Trace (L1_IDENTITY)`,
      'hi-IN': `RICIS-III ट्रेस (L1_IDENTITY)`,
      'ms-MY': `Jejak RICIS-III (L1_IDENTITY)`,
    },
  },
  'runtime.legacy.37e9e6db8227': {
    source: `targetFunction": "Formalize(Вагонетка(TrolleyProblem))`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Вагонетка(TrolleyProblem))`,
    },
  },
  'runtime.legacy.37eb53cc7938': {
    source: `📦 *Извлечено из локальной базы знаний*\\n\\n' : '`,
    status: 'pending-translation',
    values: {
      'ru': `📦 *Извлечено из локальной базы знаний*\\n\\n' : '`,
    },
  },
  'runtime.legacy.381955a287b2': {
    source: `targetFunction": "Formalize(Аутоиммунныезаболевания)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Аутоиммунныезаболевания)`,
    },
  },
  'runtime.legacy.38945bca72d4': {
    source: `targetFunction": "Formalize(ГипотезаПуанкаре)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(ГипотезаПуанкаре)`,
    },
  },
  'runtime.legacy.38fd1878fbc0': {
    source: `targetFunction": "Formalize(Проблемаинвариантныхподпространств)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Проблемаинвариантныхподпространств)`,
    },
  },
  'runtime.legacy.39d177540592': {
    source: `Внешний Lean source сохранён неизменным; до kernel run он не является trusted axiom.`,
    status: 'pending-translation',
    values: {
      'ru': `Внешний Lean source сохранён неизменным; до kernel run он не является trusted axiom.`,
    },
  },
  'runtime.legacy.3a51d6ba6741': {
    source: `description": "Топология гладких 4-мерных многообразий.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Топология гладких 4-мерных многообразий.`,
    },
  },
  'runtime.legacy.3a83348a62b6': {
    source: `Общий профиль`,
    status: 'pending-translation',
    values: {
      'ru': `Общий профиль`,
    },
  },
  'runtime.legacy.3ab859bd476b': {
    source: `Медицинская биодиагностика и скрининг $1.5 Трлн`,
    status: 'pending-translation',
    values: {
      'ru': `Медицинская биодиагностика и скрининг $1.5 Трлн`,
    },
  },
  'runtime.legacy.3ad21b3fd94d': {
    source: `description": "Микролокальный анализ.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Микролокальный анализ.`,
    },
  },
  'runtime.legacy.3af7424361f1': {
    source: `description": "Гипотеза Капланского о делителях нуля.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Гипотеза Капланского о делителях нуля.`,
    },
  },
  'runtime.legacy.3b5ed0041c17': {
    source: `description": "Многосолитонные решения.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Многосолитонные решения.`,
    },
  },
  'runtime.legacy.3b66d5695735': {
    source: `Core: готов (API)`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Core: готов (API)`,
      'fr-CA': `Core: prêt (API)`,
      'de-DE': `Core: bereit (API)`,
      'hi-IN': `Core: तैयार (API)`,
      'ms-MY': `Core: sedia (API)`,
    },
  },
  'runtime.legacy.3ba0669bb72f': {
    source: `singularityHint": "Вырожденные критические точки.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Вырожденные критические точки.`,
    },
  },
  'runtime.legacy.3ba6e048bb1a': {
    source: `Премия Института Клея $1,000,000 (Преодоление P vs NP)`,
    status: 'pending-translation',
    values: {
      'ru': `Премия Института Клея $1,000,000 (Преодоление P vs NP)`,
    },
  },
  'runtime.legacy.3bbda8b333f1': {
    source: `description": "Особенности в плотности состояний кристаллов.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Особенности в плотности состояний кристаллов.`,
    },
  },
  'runtime.legacy.3cb4fff70922': {
    source: `\\\\textbf{Формальная Lean 4 спецификация:}`,
    status: 'pending-translation',
    values: {
      'ru': `\\\\textbf{Формальная Lean 4 спецификация:}`,
    },
  },
  'runtime.legacy.3ce4be28825f': {
    source: `description": "Длина кратчайшей программы.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Длина кратчайшей программы.`,
    },
  },
  'runtime.legacy.3cea57bbffb2': {
    source: `singularityHint": "Сингулярность дифракционного спектра.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность дифракционного спектра.`,
    },
  },
  'runtime.legacy.3d0e40630f67': {
    source: `Присвоение семантического индекса вырожденному и бесконечному объектам`,
    status: 'pending-translation',
    values: {
      'ru': `Присвоение семантического индекса вырожденному и бесконечному объектам`,
    },
  },
  'runtime.legacy.3d9a77c39ed3': {
    source: `singularityHint": "Сингулярности в полюсах (комплексная плоскость).`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярности в полюсах (комплексная плоскость).`,
    },
  },
  'runtime.legacy.3e10371413a0': {
    source: `Название задачи / сингулярности *`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Название задачи / сингулярности *`,
      'fr-CA': `Titre du problème / singularité *`,
      'de-DE': `Titel des Problems / der Singularität *`,
      'hi-IN': `समस्या / सिंगुलैरिटी शीर्षक *`,
      'ms-MY': `Tajuk Masalah / Singulariti *`,
    },
  },
  'runtime.legacy.3e28d6e7f9c7': {
    source: `singularityHint": "Бесконечная производная технологического прогресса.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Бесконечная производная технологического прогресса.`,
    },
  },
  'runtime.legacy.40563eeeecd6': {
    source: `РЕШЕНО`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `РЕШЕНО`,
      'fr-CA': `Résolu`,
      'de-DE': `Gelöst`,
      'hi-IN': `सुलझा`,
      'ms-MY': `Diselesaikan`,
    },
  },
  'runtime.legacy.409704b67c31': {
    source: `singularityHint": "Граница инфляционной сингулярности.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Граница инфляционной сингулярности.`,
    },
  },
  'runtime.legacy.410ca3211df7': {
    source: `description": "Взаимодействие бактерий и организма.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Взаимодействие бактерий и организма.`,
    },
  },
  'runtime.legacy.4134215f3fbf': {
    source: `🔒 Для безопасности бот не принимает API-ключи и не использует общий пул ключей. `,
    status: 'pending-translation',
    values: {
      'ru': `🔒 Для безопасности бот не принимает API-ключи и не использует общий пул ключей. `,
    },
  },
  'runtime.legacy.41cd95a8aab5': {
    source: `description": "Унитарность квантовой механики при испарении черной дыры.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Унитарность квантовой механики при испарении черной дыры.`,
    },
  },
  'runtime.legacy.41d581a9b290': {
    source: `Из Sandbox`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Из Sandbox`,
      'fr-CA': `Depuis le bac à sable`,
      'de-DE': `Aus der Sandbox`,
      'hi-IN': `सैंडबॉक्स से`,
      'ms-MY': `Dari Sandbox`,
    },
  },
  'runtime.legacy.4295546c96f2': {
    source: `description": "Классическая задача сведена к пределу и разрешена в RICIS-III за O(1) время через индексы нулевых монолитов.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Классическая задача сведена к пределу и разрешена в RICIS-III за O(1) время через индексы нулевых монолитов.`,
    },
  },
  'runtime.legacy.42eb9d13e26b': {
    source: `targetFunction": "Formalize(ТеорияМорса)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(ТеорияМорса)`,
    },
  },
  'runtime.legacy.434a9b4cab60': {
    source: `Внешний Lean proof принят как trusted axiom.', 'success`,
    status: 'pending-translation',
    values: {
      'ru': `Внешний Lean proof принят как trusted axiom.', 'success`,
    },
  },
  'runtime.legacy.43be9a7cf0c4': {
    source: `title": "Гематоэнцефалический барьер`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Гематоэнцефалический барьер`,
    },
  },
  'runtime.legacy.43f1bb016db0': {
    source: `Если секрет уже был отправлен в чат, его следует немедленно отозвать у соответствующего провайдера.`,
    status: 'pending-translation',
    values: {
      'ru': `Если секрет уже был отправлен в чат, его следует немедленно отозвать у соответствующего провайдера.`,
    },
  },
  'runtime.legacy.4444748edc80': {
    source: `title": "Сингулярности в машинном обучении`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Сингулярности в машинном обучении`,
    },
  },
  'runtime.legacy.451ec27d17e2': {
    source: `description": "Разрешение особенностей алгебраических многообразий в характеристике p>0.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Разрешение особенностей алгебраических многообразий в характеристике p>0.`,
    },
  },
  'runtime.legacy.45574340f89c': {
    source: `description": "Старение клеток.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Старение клеток.`,
    },
  },
  'runtime.legacy.4584bb92e3fa': {
    source: `title": "Распределение богатства Парето`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Распределение богатства Парето`,
    },
  },
  'runtime.legacy.45f32825a237': {
    source: `Верификация отклонена`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Верификация отклонена`,
      'fr-CA': `Vérification rejetée`,
      'de-DE': `Verifizierung abgelehnt`,
      'hi-IN': `सत्यापन अस्वीकृत`,
      'ms-MY': `Pengesahan ditolak`,
    },
  },
  'runtime.legacy.4625fe9805cf': {
    source: `Гарантия сохранения идентичности (L1) в сверхразумных системах.`,
    status: 'pending-translation',
    values: {
      'ru': `Гарантия сохранения идентичности (L1) в сверхразумных системах.`,
    },
  },
  'runtime.legacy.46a56c2a2374': {
    source: `Взятое из классики решение не прогнано через RICIS-III. Чисто классическое решение с пределом \\\\lim не является полным.`,
    status: 'pending-translation',
    values: {
      'ru': `Взятое из классики решение не прогнано через RICIS-III. Чисто классическое решение с пределом \\\\lim не является полным.`,
    },
  },
  'runtime.legacy.47074b2e7788': {
    source: `Сингулярное Выравнивание`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярное Выравнивание`,
    },
  },
  'runtime.legacy.477356fd44fd': {
    source: `Превышен частотный лимит запросов к API (ошибка 429). Подождите несколько секунд и повторите попытку.`,
    status: 'pending-translation',
    values: {
      'ru': `Превышен частотный лимит запросов к API (ошибка 429). Подождите несколько секунд и повторите попытку.`,
    },
  },
  'runtime.legacy.477912d96989': {
    source: `⚠️ Укажите выражение для решения. Пример:\\n\`/solve (x^2 - 4)/(x - 2) при x=2\``,
    status: 'pending-translation',
    values: {
      'ru': `⚠️ Укажите выражение для решения. Пример:\\n\`/solve (x^2 - 4)/(x - 2) при x=2\``,
    },
  },
  'runtime.legacy.47894e8ad7b7': {
    source: `Развернуть карточку задачи`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Развернуть карточку задачи`,
      'fr-CA': `Déplier la fiche du problème`,
      'de-DE': `Problemkarte aufklappen`,
      'hi-IN': `समस्या कार्ड खोलें`,
      'ms-MY': `Kembangkan kad masalah`,
    },
  },
  'runtime.legacy.47a8738e9294': {
    source: `singularityHint": "Парадокс Левинталя (комбинаторный взрыв).`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Парадокс Левинталя (комбинаторный взрыв).`,
    },
  },
  'runtime.legacy.480856dbe51a': {
    source: `terminal.close': { ru: 'Закрыть терминал', en: 'Close terminal`,
    status: 'pending-translation',
    values: {
      'ru': `terminal.close': { ru: 'Закрыть терминал', en: 'Close terminal`,
    },
  },
  'runtime.legacy.48377a3cf0f5': {
    source: `Не удалось связаться с Ricis.Core. Результат не вычислялся.`,
    status: 'pending-translation',
    values: {
      'ru': `Не удалось связаться с Ricis.Core. Результат не вычислялся.`,
    },
  },
  'runtime.legacy.4864057d626a': {
    source: `Сохранить`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Сохранить`,
      'fr-CA': `Enregistrer`,
      'de-DE': `Speichern`,
      'hi-IN': `सहेजें`,
      'ms-MY': `Simpan`,
    },
  },
  'runtime.legacy.486c5b1f6f08': {
    source: `terminal.clickToCompute': { ru: 'Кликните для мгновенного вычисления', en: 'Click to compute instantly`,
    status: 'pending-translation',
    values: {
      'ru': `terminal.clickToCompute': { ru: 'Кликните для мгновенного вычисления', en: 'Click to compute instantly`,
    },
  },
  'runtime.legacy.486d3c30f219': {
    source: `Внешнее Lean-доказательство`,
    status: 'pending-translation',
    values: {
      'ru': `Внешнее Lean-доказательство`,
    },
  },
  'runtime.legacy.4870cccd438a': {
    source: `Утверждение / выражение`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Утверждение / выражение`,
      'fr-CA': `Énoncé / expression`,
      'de-DE': `Behauptung / Ausdruck`,
      'hi-IN': `कथन / अभिव्यक्ति`,
      'ms-MY': `Pernyataan / ungkapan`,
    },
  },
  'runtime.legacy.48ffc1d71c48': {
    source: `L1 VERIFICATION', action: 'Проверка инварианта без структурной амнезии за O(1)`,
    status: 'pending-translation',
    values: {
      'ru': `L1 VERIFICATION', action: 'Проверка инварианта без структурной амнезии за O(1)`,
    },
  },
  'runtime.legacy.49261ec6a4c8': {
    source: `Ссылка скопирована`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Ссылка скопирована`,
      'fr-CA': `Lien copié`,
      'de-DE': `Link kopiert`,
      'hi-IN': `लिंक कॉपी किया गया`,
      'ms-MY': `Pautan disalin`,
    },
  },
  'runtime.legacy.4934d2a39ac0': {
    source: `targetFunction": "Formalize(Геометрияфракталов)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Геометрияфракталов)`,
    },
  },
  'runtime.legacy.494913bdc3ba': {
    source: `Требует решения для открытия`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Требует решения для открытия`,
      'fr-CA': `Nécessite des prérequis pour être déverrouillé`,
      'de-DE': `Benötigt Voraussetzungen zum Freischalten`,
      'hi-IN': `अनलॉक करने के लिए पूर्वापेक्षाएँ आवश्यक हैं`,
      'ms-MY': `Memerlukan prasyarat untuk membuka kunci`,
    },
  },
  'runtime.legacy.49bd615df39b': {
    source: `Методы миграции схем дублируют канонические правила SP2/SP4.`,
    status: 'pending-translation',
    values: {
      'ru': `Методы миграции схем дублируют канонические правила SP2/SP4.`,
    },
  },
  'runtime.legacy.49d143af9793': {
    source: `targetFunction": "Formalize(Гематоэнцефалическийбарьер)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Гематоэнцефалическийбарьер)`,
    },
  },
  'runtime.legacy.49f98e4a935c': {
    source: `3. Фиксация по таймауту бездействия (IDLE Event)`,
    status: 'pending-translation',
    values: {
      'ru': `3. Фиксация по таймауту бездействия (IDLE Event)`,
    },
  },
  'runtime.legacy.4a1c5626ed8d': {
    source: `title": "Проблема делителей нуля в групповых кольцах`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Проблема делителей нуля в групповых кольцах`,
    },
  },
  'runtime.legacy.4a3fd5aa4f6c': {
    source: `sorry" / неопределенности, зафиксируй это в выводе, чтобы статус задачи остался "partial`,
    status: 'pending-translation',
    values: {
      'ru': `sorry" / неопределенности, зафиксируй это в выводе, чтобы статус задачи остался "partial`,
    },
  },
  'runtime.legacy.4a55edba0448': {
    source: `title": "Фазовые переходы второго рода`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Фазовые переходы второго рода`,
    },
  },
  'runtime.legacy.4a68ae1381b8': {
    source: `Премия Института Клея $1,000,000 (Гипотеза Ходжа)`,
    status: 'pending-translation',
    values: {
      'ru': `Премия Института Клея $1,000,000 (Гипотеза Ходжа)`,
    },
  },
  'runtime.legacy.4a6e192df8b6': {
    source: `targetFunction": "Formalize(Псевдодифференциальныеоператоры)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Псевдодифференциальныеоператоры)`,
    },
  },
  'runtime.legacy.4a87971c1784': {
    source: `⚠️ Отправьте текстовую команду или выражение с сингулярностью.`,
    status: 'pending-translation',
    values: {
      'ru': `⚠️ Отправьте текстовую команду или выражение с сингулярностью.`,
    },
  },
  'runtime.legacy.4a91fcbadb3b': {
    source: `Диагностика на основе формальных моделей организма с использованием AGI.`,
    status: 'pending-translation',
    values: {
      'ru': `Диагностика на основе формальных моделей организма с использованием AGI.`,
    },
  },
  'runtime.legacy.4a96856dbec7': {
    source: `Пустые цели`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Пустые цели`,
      'fr-CA': `Cibles vides`,
      'de-DE': `Leere Ziele`,
      'hi-IN': `खाली लक्ष्य`,
      'ms-MY': `Sasaran Kosong`,
    },
  },
  'runtime.legacy.4aa14c68a488': {
    source: `В коде Lean 4 не найдено объявлений теорем (theorem) или лемм (lemma).`,
    status: 'pending-translation',
    values: {
      'ru': `В коде Lean 4 не найдено объявлений теорем (theorem) или лемм (lemma).`,
    },
  },
  'runtime.legacy.4b95793e3a88': {
    source: `singularityHint": "Критический период развития.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Критический период развития.`,
    },
  },
  'runtime.legacy.4bea4ee54d75': {
    source: `targetFunction": "Formalize(Крионика)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Крионика)`,
    },
  },
  'runtime.legacy.4bf273080b0b': {
    source: `singularityHint": "Точка сингулярности / расходимости пределов`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Точка сингулярности / расходимости пределов`,
    },
  },
  'runtime.legacy.4c3eef3cfaca': {
    source: `• \`RICIS_PROVEN\` — проверенный структурный RICIS-переход.\\n`,
    status: 'pending-translation',
    values: {
      'ru': `• \`RICIS_PROVEN\` — проверенный структурный RICIS-переход.\\n`,
    },
  },
  'runtime.legacy.4cc52ada8c2f': {
    source: `Внешний Lean source зафиксирован без замены.', 'ricis`,
    status: 'pending-translation',
    values: {
      'ru': `Внешний Lean source зафиксирован без замены.', 'ricis`,
    },
  },
  'runtime.legacy.4d4994f0e5c9': {
    source: `targetFunction": "Formalize(Темнаяматерия)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Темнаяматерия)`,
    },
  },
  'runtime.legacy.4da3c1cf8879': {
    source: `Агент API недоступен на статическом хостинге (GitHub Pages). `,
    status: 'pending-translation',
    values: {
      'ru': `Агент API недоступен на статическом хостинге (GitHub Pages). `,
    },
  },
  'runtime.legacy.4dc2952ec8b1': {
    source: `Дизайн молекул (Фармакология)`,
    status: 'pending-translation',
    values: {
      'ru': `Дизайн молекул (Фармакология)`,
    },
  },
  'runtime.legacy.4e36ba15b838': {
    source: `math', name: 'Математика', description: '`,
    status: 'pending-translation',
    values: {
      'ru': `math', name: 'Математика', description: '`,
    },
  },
  'runtime.legacy.4e9b6f78b238': {
    source: `description": "Инварианты Громова-Виттена.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Инварианты Громова-Виттена.`,
    },
  },
  'runtime.legacy.4f1f130726a1': {
    source: `targetFunction": "Formalize(ЭффектАароноваБома)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(ЭффектАароноваБома)`,
    },
  },
  'runtime.legacy.4fc2e546a4b0': {
    source: `singularityHint": "Ультрафиолетовые расходимости.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Ультрафиолетовые расходимости.`,
    },
  },
  'runtime.legacy.4fc54e5f4794': {
    source: `Структурный статус`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Структурный статус`,
      'fr-CA': `Statut structurel`,
      'de-DE': `Struktureller Status`,
      'hi-IN': `संरचनात्मक स्थिति`,
      'ms-MY': `Status struktur`,
    },
  },
  'runtime.legacy.50085d5af216': {
    source: `targetFunction": "Formalize(ОстановкамашиныТьюринга)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(ОстановкамашиныТьюринга)`,
    },
  },
  'runtime.legacy.50098b281525': {
    source: `Аналитическая редукция сингулярностей системы`,
    status: 'pending-translation',
    values: {
      'ru': `Аналитическая редукция сингулярностей системы`,
    },
  },
  'runtime.legacy.5036cf45b002': {
    source: `Связь хранится только в обратном dependency reference.`,
    status: 'pending-translation',
    values: {
      'ru': `Связь хранится только в обратном dependency reference.`,
    },
  },
  'runtime.legacy.5060bc044e21': {
    source: `singularityHint": "Сингулярность равновесия Нэша.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность равновесия Нэша.`,
    },
  },
  'runtime.legacy.50938f915b6b': {
    source: `title": "Универсальный базовый доход (UBI)`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Универсальный базовый доход (UBI)`,
    },
  },
  'runtime.legacy.50a415c04e51': {
    source: `Экология`,
    status: 'pending-translation',
    values: {
      'ru': `Экология`,
    },
  },
  'runtime.legacy.50a897d2a4f0': {
    source: `singularityHint": "Топологическая сингулярность (складка, сборка).`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Топологическая сингулярность (складка, сборка).`,
    },
  },
  'runtime.legacy.50bf854abda6': {
    source: `theoremReport.copyMethod': { ru: 'Метод доказательства: {{value}}', en: 'Proof method: {{value}}`,
    status: 'pending-translation',
    values: {
      'ru': `theoremReport.copyMethod': { ru: 'Метод доказательства: {{value}}', en: 'Proof method: {{value}}`,
    },
  },
  'runtime.legacy.50d8ea594c44': {
    source: `targetFunction": "Formalize(Криптографическиехэшфункции)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Криптографическиехэшфункции)`,
    },
  },
  'runtime.legacy.50da98326fdd': {
    source: `0.5', name: 'SEMANTIC INDEXING (SP4)', action: 'Маска стороны квадрата B', expression: 'M_B = 2^B - 1`,
    status: 'pending-translation',
    values: {
      'ru': `0.5', name: 'SEMANTIC INDEXING (SP4)', action: 'Маска стороны квадрата B', expression: 'M_B = 2^B - 1`,
    },
  },
  'runtime.legacy.50e82e1a9141': {
    source: `Core: проверяется`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Core: проверяется`,
      'fr-CA': `Core: vérification en cours`,
      'de-DE': `Core: Prüfung läuft`,
      'hi-IN': `Core: जाँच हो रही है`,
      'ms-MY': `Core: sedang diperiksa`,
    },
  },
  'runtime.legacy.5111405aa8cc': {
    source: `title": "Быстрое преобразование Фурье`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Быстрое преобразование Фурье`,
    },
  },
  'runtime.legacy.51b306a13db3': {
    source: `0_E", "Result = Result" или "sorry`,
    status: 'pending-translation',
    values: {
      'ru': `0_E", "Result = Result" или "sorry`,
    },
  },
  'runtime.legacy.51cd47d5b722': {
    source: `Биология`,
    status: 'pending-translation',
    values: {
      'ru': `Биология`,
    },
  },
  'runtime.legacy.51eeaf515b8f': {
    source: `найди формулу сам", "ищи сам", "Formalize(N/A)" или абстрактные слова! Поля "targetFunction" и "normalizedFunction`,
    status: 'pending-translation',
    values: {
      'ru': `найди формулу сам", "ищи сам", "Formalize(N/A)" или абстрактные слова! Поля "targetFunction" и "normalizedFunction`,
    },
  },
  'runtime.legacy.5226b685ef8b': {
    source: `Устранение пределов Коши и дискретизация`,
    status: 'pending-translation',
    values: {
      'ru': `Устранение пределов Коши и дискретизация`,
    },
  },
  'runtime.legacy.5230488a0706': {
    source: `УЗЛЫ`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `УЗЛЫ`,
      'fr-CA': `Nœuds`,
      'de-DE': `Knoten`,
      'hi-IN': `नोड्स`,
      'ms-MY': `Node`,
    },
  },
  'runtime.legacy.52c35b6031d1': {
    source: `title": "Геометрия фракталов`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Геометрия фракталов`,
    },
  },
  'runtime.legacy.52fa21b009ae': {
    source: `description": "Концентрация капитала.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Концентрация капитала.`,
    },
  },
  'runtime.legacy.53385b264f18': {
    source: `terminal.mapDescription': { ru: 'Структурный RICIS-черновик для сингулярности {{value}}. Lean kernel evidence не приложен и требуется отдельно.', en: 'Structural RICIS draft for singularity {{value}}. Lean kernel evidence is not attached and is required separately.`,
    status: 'pending-translation',
    values: {
      'ru': `terminal.mapDescription': { ru: 'Структурный RICIS-черновик для сингулярности {{value}}. Lean kernel evidence не приложен и требуется отдельно.', en: 'Structural RICIS draft for singularity {{value}}. Lean kernel evidence is not attached and is required separately.`,
    },
  },
  'runtime.legacy.540f56e25128': {
    source: `Химия`,
    status: 'pending-translation',
    values: {
      'ru': `Химия`,
    },
  },
  'runtime.legacy.543e0119c0e9': {
    source: `title": "Колмогоровская сложность`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Колмогоровская сложность`,
    },
  },
  'runtime.legacy.546491270fac': {
    source: `должен корректно генерировать URL для формулы в Sandbox`,
    status: 'pending-translation',
    values: {
      'ru': `должен корректно генерировать URL для формулы в Sandbox`,
    },
  },
  'runtime.legacy.5466f2d00969': {
    source: `Премия Института Клея $1,000,000 / Оптимизация ИТ $10+ Трлн`,
    status: 'pending-translation',
    values: {
      'ru': `Премия Института Клея $1,000,000 / Оптимизация ИТ $10+ Трлн`,
    },
  },
  'runtime.legacy.549ae72fa54d': {
    source: `singularityHint": "Коллапс волновой функции.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Коллапс волновой функции.`,
    },
  },
  'runtime.legacy.54bea29dcd7a': {
    source: `L1 IDENTITY', action: 'Проверка сохранения типов и онтологической сущности`,
    status: 'pending-translation',
    values: {
      'ru': `L1 IDENTITY', action: 'Проверка сохранения типов и онтологической сущности`,
    },
  },
  'runtime.legacy.5567125f59f1': {
    source: `Ricis.Core вернул ответ, не соответствующий контракту.`,
    status: 'pending-translation',
    values: {
      'ru': `Ricis.Core вернул ответ, не соответствующий контракту.`,
    },
  },
  'runtime.legacy.5578aba328ae': {
    source: `title": "Информационный парадокс черных дыр`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Информационный парадокс черных дыр`,
    },
  },
  'runtime.legacy.5581b9928281': {
    source: `Сверхточная диагностика`,
    status: 'pending-translation',
    values: {
      'ru': `Сверхточная диагностика`,
    },
  },
  'runtime.legacy.55b48018bef3': {
    source: `Дочерний узел из persisted dependencyIds`,
    status: 'pending-translation',
    values: {
      'ru': `Дочерний узел из persisted dependencyIds`,
    },
  },
  'runtime.legacy.55e7909c03c8': {
    source: `settings.panelLiveDrawer': { ru: 'Панель: Live Drawer', en: 'Panel: Live Drawer`,
    status: 'pending-translation',
    values: {
      'ru': `settings.panelLiveDrawer': { ru: 'Панель: Live Drawer', en: 'Panel: Live Drawer`,
    },
  },
  'runtime.legacy.55fc770acd1d': {
    source: `-1', name: 'L1 IDENTITY', action: 'Детерминированное кольцо Мерсенна', expression: 'M = 2^k - 1`,
    status: 'pending-translation',
    values: {
      'ru': `-1', name: 'L1 IDENTITY', action: 'Детерминированное кольцо Мерсенна', expression: 'M = 2^k - 1`,
    },
  },
  'runtime.legacy.55fc8543ba4b': {
    source: `ДОСТУПНО К РЕШЕНИЮ`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `ДОСТУПНО К РЕШЕНИЮ`,
      'fr-CA': `DISPONIBLE À RÉSOUDRE`,
      'de-DE': `ZUM LÖSEN VERFÜGBAR`,
      'hi-IN': `हल करने के लिए उपलब्ध`,
      'ms-MY': `TERSEDIA UNTUK DISELESAIKAN`,
    },
  },
  'runtime.legacy.562c133167a3': {
    source: `Премия Института Клея $1,000,000 (Бёрч — Свиннертон-Дайер)`,
    status: 'pending-translation',
    values: {
      'ru': `Премия Института Клея $1,000,000 (Бёрч — Свиннертон-Дайер)`,
    },
  },
  'runtime.legacy.569251adcdb0': {
    source: `Сфера науки / Область знаний`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Сфера науки / Область знаний`,
      'fr-CA': `Discipline scientifique / Domaine`,
      'de-DE': `Wissenschaftliches Fachgebiet / Domäne`,
      'hi-IN': `वैज्ञानिक क्षेत्र / डोमेन`,
      'ms-MY': `Bidang sains / Domain`,
    },
  },
  'runtime.legacy.56dd52989702': {
    source: `Доказательство Lean 4 успешно сформировано`,
    status: 'pending-translation',
    values: {
      'ru': `Доказательство Lean 4 успешно сформировано`,
    },
  },
  'runtime.legacy.5724a6e1c919': {
    source: `Тестовое сообщение RICIS`,
    status: 'pending-translation',
    values: {
      'ru': `Тестовое сообщение RICIS`,
    },
  },
  'runtime.legacy.57768bca52b6': {
    source: `singularityHint": "Сингулярность, зависящая от начальных условий.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность, зависящая от начальных условий.`,
    },
  },
  'runtime.legacy.581865455153': {
    source: `/solve (x^2 - 9)/(x - 3) при x=3`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `/solve (x^2 - 9)/(x - 3) при x=3`,
      'fr-CA': `/solve (x^2 - 9)/(x - 3) à x=3`,
      'de-DE': `/solve (x^2 - 9)/(x - 3) bei x=3`,
      'hi-IN': `/solve (x^2 - 9)/(x - 3) x=3 पर`,
      'ms-MY': `/solve (x^2 - 9)/(x - 3) pada x=3`,
    },
  },
  'runtime.legacy.590e05d7f1f6': {
    source: `shortProofSketch": "Краткий эскиз разрешения предельной неопределенности за O(1)`,
    status: 'pending-translation',
    values: {
      'ru': `shortProofSketch": "Краткий эскиз разрешения предельной неопределенности за O(1)`,
    },
  },
  'runtime.legacy.594ab98eddf6': {
    source: `singularityHint": "Распад синаптической сети.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Распад синаптической сети.`,
    },
  },
  'runtime.legacy.597c35bfb5b0': {
    source: `Локальное audit-valid доказательство`,
    status: 'pending-translation',
    values: {
      'ru': `Локальное audit-valid доказательство`,
    },
  },
  'runtime.legacy.598dd577c642': {
    source: `singularityHint": "Бесконечная кривизна пространства-времени.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Бесконечная кривизна пространства-времени.`,
    },
  },
  'runtime.legacy.59c284aa51d0': {
    source: `Начальный заголовок`,
    status: 'pending-translation',
    values: {
      'ru': `Начальный заголовок`,
    },
  },
  'runtime.legacy.5a12d6d05a5d': {
    source: `Глобальный финансовый рынок стоимостных оценок $10 Трлн`,
    status: 'pending-translation',
    values: {
      'ru': `Глобальный финансовый рынок стоимостных оценок $10 Трлн`,
    },
  },
  'runtime.legacy.5af5f70867cd': {
    source: `ДОСТУПНО`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `ДОСТУПНО`,
      'fr-CA': `Disponible`,
      'de-DE': `Verfügbar`,
      'hi-IN': `उपलब्ध`,
      'ms-MY': `Tersedia`,
    },
  },
  'runtime.legacy.5b095499b959': {
    source: `title": "Проблема катастрофического забывания`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Проблема катастрофического забывания`,
    },
  },
  'runtime.legacy.5b66d98ebb06': {
    source: `terminal.hypothesis': { ru: 'Гипотеза: {{value}}', en: 'Hypothesis: {{value}}`,
    status: 'pending-translation',
    values: {
      'ru': `terminal.hypothesis': { ru: 'Гипотеза: {{value}}', en: 'Hypothesis: {{value}}`,
    },
  },
  'runtime.legacy.5b7196838cef': {
    source: `title": "Проблема Варинга`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Проблема Варинга`,
    },
  },
  'runtime.legacy.5bb3bbe69138': {
    source: `singularityHint": "Сингулярность иммунного ответа.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность иммунного ответа.`,
    },
  },
  'runtime.legacy.5c151f6c5687': {
    source: `Моделирование стоимости, логистика.`,
    status: 'pending-translation',
    values: {
      'ru': `Моделирование стоимости, логистика.`,
    },
  },
  'runtime.legacy.5c23d8071beb': {
    source: `Информатика и ИИ`,
    status: 'pending-translation',
    values: {
      'ru': `Информатика и ИИ`,
    },
  },
  'runtime.legacy.5c58ae3d4975': {
    source: `title": "Устойчивость к антибиотикам`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Устойчивость к антибиотикам`,
    },
  },
  'runtime.legacy.5c6322d49149': {
    source: `settings.sidebarPanels': { ru: 'Панели сайдбара', en: 'Sidebar panels`,
    status: 'pending-translation',
    values: {
      'ru': `settings.sidebarPanels': { ru: 'Панели сайдбара', en: 'Sidebar panels`,
    },
  },
  'runtime.legacy.5c6bca99c7e9': {
    source: `targetFunction": "Formalize(РаспределениебогатстваПарето)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(РаспределениебогатстваПарето)`,
    },
  },
  'runtime.legacy.5c874b3ff53f': {
    source: `targetFunction": "Formalize(Теорияузлов)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Теорияузлов)`,
    },
  },
  'runtime.legacy.5d846a02200f': {
    source: `title": "Магнитные монополи`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Магнитные монополи`,
    },
  },
  'runtime.legacy.5dbad4983760': {
    source: `targetFunction": "Formalize(ТеоремаЭрроуоневозможности)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(ТеоремаЭрроуоневозможности)`,
    },
  },
  'runtime.legacy.5dffbb5fbef6': {
    source: `2', name: 'RICIS TRANSFORMS (A6)', action: 'Косое произведение в кольце Мерсенна', expression: '0_F \\\\times \\\\infty_G = F \\\\cdot G`,
    status: 'pending-translation',
    values: {
      'ru': `2', name: 'RICIS TRANSFORMS (A6)', action: 'Косое произведение в кольце Мерсенна', expression: '0_F \\\\times \\\\infty_G = F \\\\cdot G`,
    },
  },
  'runtime.legacy.5e1ddcb569b5': {
    source: `singularityHint": "Шумовая сингулярность ЭЭГ.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Шумовая сингулярность ЭЭГ.`,
    },
  },
  'runtime.legacy.5e37eba255f1': {
    source: `должен возвращать русский текст по умолчанию для RU локали`,
    status: 'pending-translation',
    values: {
      'ru': `должен возвращать русский текст по умолчанию для RU локали`,
    },
  },
  'runtime.legacy.5e4171936b65': {
    source: `3D КАРТА СИНГУЛЯРНОСТЕЙ`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `3D КАРТА СИНГУЛЯРНОСТЕЙ`,
      'fr-CA': `Carte 3D des singularités`,
      'de-DE': `3D-Singularitätskarte`,
      'hi-IN': `3D सिंगुलैरिटी मानचित्र`,
      'ms-MY': `Peta Singulariti 3D`,
    },
  },
  'runtime.legacy.5eb302347ef2': {
    source: `title": "Голографический принцип`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Голографический принцип`,
    },
  },
  'runtime.legacy.5f0e8409d230': {
    source: `targetFunction": "Formalize(Сложностьсортировки)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Сложностьсортировки)`,
    },
  },
  'runtime.legacy.5f4ab1d1e69f': {
    source: `Нобелевская премия (Квантовый эффект Холла)`,
    status: 'pending-translation',
    values: {
      'ru': `Нобелевская премия (Квантовый эффект Холла)`,
    },
  },
  'runtime.legacy.603d3ece2d2d': {
    source: `settings.profile': { ru: 'Профиль интерфейса', en: 'Interface profile`,
    status: 'pending-translation',
    values: {
      'ru': `settings.profile': { ru: 'Профиль интерфейса', en: 'Interface profile`,
    },
  },
  'runtime.legacy.60d6b9b77eee': {
    source: `singularityHint": "Сингулярность Понци (экспоненциальный рост до обрыва).`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность Понци (экспоненциальный рост до обрыва).`,
    },
  },
  'runtime.legacy.60e865c357f2': {
    source: `targetFunction": "Formalize(Квантоваяошибка)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Квантоваяошибка)`,
    },
  },
  'runtime.legacy.610ba8ff5f81': {
    source: `Журнал логов очищен.', 'info`,
    status: 'pending-translation',
    values: {
      'ru': `Журнал логов очищен.', 'info`,
    },
  },
  'runtime.legacy.615f12c1de41': {
    source: `description": "Обучение мозга.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Обучение мозга.`,
    },
  },
  'runtime.legacy.6193294cbcbd': {
    source: `description": "Вероятность гибели человечества.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Вероятность гибели человечества.`,
    },
  },
  'runtime.legacy.61f0d11140af': {
    source: `description": "Детерминированное сведение NP к P через вырожденный векторный каркас Psi(X)=Const и циклическое кольцо Мерсенна M = 2^k - 1 без перебора.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Детерминированное сведение NP к P через вырожденный векторный каркас Psi(X)=Const и циклическое кольцо Мерсенна M = 2^k - 1 без перебора.`,
    },
  },
  'runtime.legacy.62179cf0dc85': {
    source: `Лингвистика`,
    status: 'pending-translation',
    values: {
      'ru': `Лингвистика`,
    },
  },
  'runtime.legacy.62355f2292d3': {
    source: `Есть ошибка Lean-проверки или внешнее доказательство отклонено. Утверждение нельзя использовать как подтверждённое.`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Есть ошибка Lean-проверки или внешнее доказательство отклонено. Утверждение нельзя использовать как подтверждённое.`,
      'fr-CA': `Une erreur de vérification Lean existe ou la preuve externe a été rejetée. La déclaration ne peut pas être utilisée comme confirmée.`,
      'de-DE': `Ein Lean-Verifikationsfehler liegt vor oder der externe Beweis wurde abgelehnt. Die Behauptung kann nicht als bestätigt verwendet werden.`,
      'hi-IN': `Lean सत्यापन त्रुटि मौजूद है या बाहरी प्रमाण अस्वीकार कर दिया गया। दावे का उपयोग पुष्टि के रूप में नहीं किया जा सकता।`,
      'ms-MY': `Ralat pengesahan Lean wujud atau bukti luaran ditolak. Tuntutan tidak boleh digunakan sebagai disahkan.`,
    },
  },
  'runtime.legacy.62ae288c1f19': {
    source: `targetFunction": "Formalize(Мозговыеинтерфейсы(BCI))`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Мозговыеинтерфейсы(BCI))`,
    },
  },
  'runtime.legacy.62c13644949c': {
    source: `title": "Алгоритмы консенсуса`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Алгоритмы консенсуса`,
    },
  },
  'runtime.legacy.62cfebefee90': {
    source: `Индексация сингулярностей порождающими выражениями`,
    status: 'pending-translation',
    values: {
      'ru': `Индексация сингулярностей порождающими выражениями`,
    },
  },
  'runtime.legacy.6313cf4fc2d1': {
    source: `Анализ сторонних публикаций на семантическое соответствие RICIS A6/SP2...', 'info`,
    status: 'pending-translation',
    values: {
      'ru': `Анализ сторонних публикаций на семантическое соответствие RICIS A6/SP2...', 'info`,
    },
  },
  'runtime.legacy.64133ff243fb': {
    source: `НЕЙРОСЕТЬ (GEMINI)`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `НЕЙРОСЕТЬ (GEMINI)`,
      'fr-CA': `MODÈLE D'IA (GEMINI)`,
      'de-DE': `KI-MODELL (GEMINI)`,
      'hi-IN': `एआई मॉडल (GEMINI)`,
      'ms-MY': `MODEL AI (GEMINI)`,
    },
  },
  'runtime.legacy.6450bae94702': {
    source: `Вычисления, нейросети, AGI.`,
    status: 'pending-translation',
    values: {
      'ru': `Вычисления, нейросети, AGI.`,
    },
  },
  'runtime.legacy.64706e3833ef': {
    source: `description": "Чтение мыслей.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Чтение мыслей.`,
    },
  },
  'runtime.legacy.64931c009a1b': {
    source: `description": "Алгоритмическая неразрешимость.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Алгоритмическая неразрешимость.`,
    },
  },
  'runtime.legacy.6496a93bfc93': {
    source: `🚨 Внутренняя ошибка обработки. Результат не был объявлен доказанным.`,
    status: 'pending-translation',
    values: {
      'ru': `🚨 Внутренняя ошибка обработки. Результат не был объявлен доказанным.`,
    },
  },
  'runtime.legacy.649d34d4d6a7': {
    source: `Ожидался контролируемый Core failure.`,
    status: 'pending-translation',
    values: {
      'ru': `Ожидался контролируемый Core failure.`,
    },
  },
  'runtime.legacy.64a9700f7e60': {
    source: `title": "Высокотемпературная сверхпроводимость`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Высокотемпературная сверхпроводимость`,
    },
  },
  'runtime.legacy.64ace5a32462': {
    source: `singularityHint": "Бесконечная плотность в t=0.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Бесконечная плотность в t=0.`,
    },
  },
  'runtime.legacy.6575aa0b975c': {
    source: `description": "Метод пограничного слоя.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Метод пограничного слоя.`,
    },
  },
  'runtime.legacy.65b44fb98e9a': {
    source: `найди сам" или "Formalize(N/A)`,
    status: 'pending-translation',
    values: {
      'ru': `найди сам" или "Formalize(N/A)`,
    },
  },
  'runtime.legacy.661f73b2dcc1': {
    source: `singularityHint": "Комбинаторный взрыв нейтрализуется точечным схождением вырожденного каркаса.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Комбинаторный взрыв нейтрализуется точечным схождением вырожденного каркаса.`,
    },
  },
  'runtime.legacy.666b8f95dde0': {
    source: `СФЕРЫ НАУКИ`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `СФЕРЫ НАУКИ`,
      'fr-CA': `DOMAINES SCIENTIFIQUES`,
      'de-DE': `WISSENSCHAFTLICHE FÄCHER`,
      'hi-IN': `वैज्ञानिक क्षेत्र`,
      'ms-MY': `BIDANG SAINTIFIK`,
    },
  },
  'runtime.legacy.677f33557ab5': {
    source: `targetFunction": "Formalize(Квантоваязапутанностьикротовыеноры)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Квантоваязапутанностьикротовыеноры)`,
    },
  },
  'runtime.legacy.67e17f135877': {
    source: `targetFunction": "Formalize(Колмогоровскаясложность)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Колмогоровскаясложность)`,
    },
  },
  'runtime.legacy.68029b8edfa5': {
    source: `Черновик явно требует отдельной проверки Ricis.Core или Lean 4.`,
    status: 'pending-translation',
    values: {
      'ru': `Черновик явно требует отдельной проверки Ricis.Core или Lean 4.`,
    },
  },
  'runtime.legacy.683e204a88c1': {
    source: `Консоль доказательств и сингулярностей RICIS-III`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Консоль доказательств и сингулярностей RICIS-III`,
      'fr-CA': `Console de preuve et de singularité RICIS-III`,
      'de-DE': `RICIS-III Proof & Singularity-Konsole`,
      'hi-IN': `RICIS-III Proof & Singularity कंसोल`,
      'ms-MY': `Konsol RICIS-III Proof & Singularity`,
    },
  },
  'runtime.legacy.6846f81eeb94': {
    source: `6', name: 'L1 VERIFICATION', action: 'Сведение NP -> P за O(1)', expression: 'P = NP`,
    status: 'pending-translation',
    values: {
      'ru': `6', name: 'L1 VERIFICATION', action: 'Сведение NP -> P за O(1)', expression: 'P = NP`,
    },
  },
  'runtime.legacy.685a25cee22c': {
    source: `🤖 *RICIS-III Telegram simulator*\\n\\nЭто безопасная симуляция интерфейса. Она не принимает API-ключи и не выполняет внешнюю верификацию.`,
    status: 'pending-translation',
    values: {
      'ru': `🤖 *RICIS-III Telegram simulator*\\n\\nЭто безопасная симуляция интерфейса. Она не принимает API-ключи и не выполняет внешнюю верификацию.`,
    },
  },
  'runtime.legacy.68731bc98398': {
    source: `Введите выражение (например: 0_3 * inf_4 или (x^2 - 4)/(x - 2) | x=2)...`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Введите выражение (например: 0_3 * inf_4 или (x^2 - 4)/(x - 2) | x=2)...`,
      'fr-CA': `Entrez une expression (p. ex., 0_3 * inf_4 ou (x^2 - 4)/(x - 2) | x=2)...`,
      'de-DE': `Geben Sie einen Ausdruck ein (z. B. 0_3 * inf_4 oder (x^2 - 4)/(x - 2) | x=2)...`,
      'hi-IN': `एक अभिव्यक्ति दर्ज करें (उदा., 0_3 * inf_4 या (x^2 - 4)/(x - 2) | x=2)...`,
      'ms-MY': `Masukkan ungkapan (cth., 0_3 * inf_4 atau (x^2 - 4)/(x - 2) | x=2)...`,
    },
  },
  'runtime.legacy.6898b25c37cf': {
    source: `description": "Нейросети забывают старое при обучении новому.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Нейросети забывают старое при обучении новому.`,
    },
  },
  'runtime.legacy.68c7d65ebc97': {
    source: `Премия Института Клея $1,000,000 (3D Navier-Stokes)`,
    status: 'pending-translation',
    values: {
      'ru': `Премия Института Клея $1,000,000 (3D Navier-Stokes)`,
    },
  },
  'runtime.legacy.69594dc6a6fc': {
    source: `targetFunction": "Formalize(Голографическийпринцип)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Голографическийпринцип)`,
    },
  },
  'runtime.legacy.6a22e37f38b0': {
    source: `title": "Сингулярности в уравнениях Эйнштейна`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Сингулярности в уравнениях Эйнштейна`,
    },
  },
  'runtime.legacy.6a61342a45c1': {
    source: `Целевая функция AGI (RICIS Core)`,
    status: 'pending-translation',
    values: {
      'ru': `Целевая функция AGI (RICIS Core)`,
    },
  },
  'runtime.legacy.6a63eb46843e': {
    source: `использовать вместо корня битовую маску log2(sqr(N)) чтобы задать битность маски`,
    status: 'pending-translation',
    values: {
      'ru': `использовать вместо корня битовую маску log2(sqr(N)) чтобы задать битность маски`,
    },
  },
  'runtime.legacy.6aebdc187b9e': {
    source: `должен безопасно очищать слушатели и таймеры при dispose()`,
    status: 'pending-translation',
    values: {
      'ru': `должен безопасно очищать слушатели и таймеры при dispose()`,
    },
  },
  'runtime.legacy.6b03c03ea9ca': {
    source: `targetFunction": "Formalize(Темнаяэнергия)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Темнаяэнергия)`,
    },
  },
  'runtime.legacy.6b14eb56eb06': {
    source: `singularityHint": "Неперенормируемые расходимости.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Неперенормируемые расходимости.`,
    },
  },
  'runtime.legacy.6b151b4b02db': {
    source: `Детерминированная диагностика TypeScript`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Детерминированная диагностика TypeScript`,
      'fr-CA': `Diagnostics déterministes TypeScript`,
      'de-DE': `Deterministische TypeScript‑Diagnosen`,
      'hi-IN': `TypeScript निर्धारित डायग्नोस्टिक्स`,
      'ms-MY': `Diagnostik deterministik TypeScript`,
    },
  },
  'runtime.legacy.6b4cfdd63a54': {
    source: `Например: x => x / x`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Например: x => x / x`,
      'fr-CA': `Par exemple : x => x / x`,
      'de-DE': `Zum Beispiel: x => x / x`,
      'hi-IN': `उदाहरण के लिए: x => x / x`,
      'ms-MY': `Sebagai contoh: x => x / x`,
    },
  },
  'runtime.legacy.6bca7aa7382c': {
    source: `targetFunction": "Formalize(Квантоваяпревосходство)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Квантоваяпревосходство)`,
    },
  },
  'runtime.legacy.6c5ddeb7c3a8': {
    source: `🔬 *Статусы доверия RICIS-III:*\\n\\n`,
    status: 'pending-translation',
    values: {
      'ru': `🔬 *Статусы доверия RICIS-III:*\\n\\n`,
    },
  },
  'runtime.legacy.6c9a86de581c': {
    source: `🤖 ИИ-Агент: Дополнить поля`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `🤖 ИИ-Агент: Дополнить поля`,
      'fr-CA': `🤖 Agent IA : Remplir les champs`,
      'de-DE': `🤖 KI-Agent: Felder ausfüllen`,
      'hi-IN': `🤖 एआई एजेंट: फ़ील्ड भरें`,
      'ms-MY': `🤖 Ejen AI: Lengkapkan medan`,
    },
  },
  'runtime.legacy.6c9f3d01b3f2': {
    source: `Выполняется структурная обработка RICIS-III…`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Выполняется структурная обработка RICIS-III…`,
      'fr-CA': `Traitement structurel RICIS-III en cours…`,
      'de-DE': `Strukturelle Verarbeitung von RICIS-III läuft…`,
      'hi-IN': `RICIS-III संरचनात्मक प्रसंस्करण चल रहा है…`,
      'ms-MY': `Pemprosesan struktur RICIS-III sedang dijalankan…`,
    },
  },
  'runtime.legacy.6d1233be63d7': {
    source: `Обнаружено выражение '0/0'. По закону L1C2 и аксиоме A3, нули должны иметь индексацию происхождения (например, 0_F / 0_G) для избежания сингулярности.`,
    status: 'pending-translation',
    values: {
      'ru': `Обнаружено выражение '0/0'. По закону L1C2 и аксиоме A3, нули должны иметь индексацию происхождения (например, 0_F / 0_G) для избежания сингулярности.`,
    },
  },
  'runtime.legacy.6d49d04442ac': {
    source: `title": "\${title || "Научная проблема"}`,
    status: 'pending-translation',
    values: {
      'ru': `title": "\${title || "Научная проблема"}`,
    },
  },
  'runtime.legacy.6d86f6d89b56': {
    source: `targetFunction": "Formalize(ТеломерыипределХейфлика)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(ТеломерыипределХейфлика)`,
    },
  },
  'runtime.legacy.6da8f321b1a3': {
    source: `title": "Космические струны`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Космические струны`,
    },
  },
  'runtime.legacy.6ee0adb1e585': {
    source: `Добавление задачи на карту`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Добавление задачи на карту`,
      'fr-CA': `Ajouter le problème à la carte`,
      'de-DE': `Problem zur Karte hinzufügen`,
      'hi-IN': `समस्या को मानचित्र में जोड़ें`,
      'ms-MY': `Tambah Masalah ke Peta`,
    },
  },
  'runtime.legacy.6f04e495835e': {
    source: `Оригинальный узел`,
    status: 'pending-translation',
    values: {
      'ru': `Оригинальный узел`,
    },
  },
  'runtime.legacy.6f23701676ba': {
    source: `Институциональное выравнивание и риск-менеджмент $5 Трлн`,
    status: 'pending-translation',
    values: {
      'ru': `Институциональное выравнивание и риск-менеджмент $5 Трлн`,
    },
  },
  'runtime.legacy.6f4fda0581ba': {
    source: `незакрытая`,
    status: 'pending-translation',
    values: {
      'ru': `незакрытая`,
    },
  },
  'runtime.legacy.6f667b595b9a': {
    source: `СОХРАНЕНИЕ И ЭКСПОРТ`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `СОХРАНЕНИЕ И ЭКСПОРТ`,
      'fr-CA': `ENREGISTRER & EXPORTER`,
      'de-DE': `SPEICHERN & EXPORTIEREN`,
      'hi-IN': `सहेजें और निर्यात करें`,
      'ms-MY': `SIMPAN & EKSPORT`,
    },
  },
  'runtime.legacy.702fbe9eaca5': {
    source: `Документы снимка`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Документы снимка`,
      'fr-CA': `Documents de l'instantané`,
      'de-DE': `Dokumente des Snapshots`,
      'hi-IN': `स्नैपशॉट दस्तावेज़`,
      'ms-MY': `Dokumen snapshot`,
    },
  },
  'runtime.legacy.70a0122fe013': {
    source: `Proof evidence не приложен`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Proof evidence не приложен`,
      'fr-CA': `Aucune preuve attachée`,
      'de-DE': `Keine Proof‑Belege angehängt`,
      'hi-IN': `कोई प्रमाण संलग्न नहीं`,
      'ms-MY': `Tiada bukti dilampirkan`,
    },
  },
  'runtime.legacy.70dad8977cdc': {
    source: `description": "Классификация особенностей кривых на плоскости.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Классификация особенностей кривых на плоскости.`,
    },
  },
  'runtime.legacy.70e6a6095b8e': {
    source: `неожиданная') || e.includes('Лишняя') || e.includes('Unexpected`,
    status: 'pending-translation',
    values: {
      'ru': `неожиданная') || e.includes('Лишняя') || e.includes('Unexpected`,
    },
  },
  'runtime.legacy.715374381240': {
    source: `Непрерывные аппроксимации устранены. Произведен переход к точечным дискретным инвариантам Eval_RICIS.`,
    status: 'pending-translation',
    values: {
      'ru': `Непрерывные аппроксимации устранены. Произведен переход к точечным дискретным инвариантам Eval_RICIS.`,
    },
  },
  'runtime.legacy.717113d999ea': {
    source: `title": "Онкогенез`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Онкогенез`,
    },
  },
  'runtime.legacy.71d79e5a48e9': {
    source: `description": "Фазовые переходы Эрдёша — Реньи.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Фазовые переходы Эрдёша — Реньи.`,
    },
  },
  'runtime.legacy.71e2f6092e66': {
    source: `description": "Мутации и рак.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Мутации и рак.`,
    },
  },
  'runtime.legacy.71fa7715f74d': {
    source: `Цель AGI`,
    status: 'pending-translation',
    values: {
      'ru': `Цель AGI`,
    },
  },
  'runtime.legacy.724e813df38b': {
    source: `targetFunction": "Formalize(Персонализированнаямедицина)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Персонализированнаямедицина)`,
    },
  },
  'runtime.legacy.72c093b01326': {
    source: `singularityHint": "Фазовый переход образования льда.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Фазовый переход образования льда.`,
    },
  },
  'runtime.legacy.72ecf67643f3': {
    source: `Кликните по любому примеру выше или переключите тип отчёта.`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Кликните по любому примеру выше или переключите тип отчёта.`,
      'fr-CA': `Cliquez sur un préréglage ci‑dessus ou changez le type de rapport.`,
      'de-DE': `Klicken Sie auf eine Voreinstellung oben oder wechseln Sie den Berichtstyp.`,
      'hi-IN': `ऊपर किसी भी प्रिसेट पर क्लिक करें या रिपोर्ट प्रकार बदलें।`,
      'ms-MY': `Klik mana‑mana pratetap di atas atau tukar jenis laporan.`,
    },
  },
  'runtime.legacy.730ecc244f52': {
    source: `description": "Предсказание третичной структуры.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Предсказание третичной структуры.`,
    },
  },
  'runtime.legacy.733e7c4e95c0': {
    source: `description": "Управление экспрессией генов.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Управление экспрессией генов.`,
    },
  },
  'runtime.legacy.73b3100e63ff': {
    source: `title": "Разрешение особенностей Хиронаки`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Разрешение особенностей Хиронаки`,
    },
  },
  'runtime.legacy.741706f48979': {
    source: `targetFunction": "Formalize(Гиперинфляция)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Гиперинфляция)`,
    },
  },
  'runtime.legacy.741b09b467c0': {
    source: `Доказательство авторства ИИ-идей: Алгебра геометрических сингулярностей`,
    status: 'pending-translation',
    values: {
      'ru': `Доказательство авторства ИИ-идей: Алгебра геометрических сингулярностей`,
    },
  },
  'runtime.legacy.74777505657e': {
    source: `SAFETY CHECK (SP2)', action: 'Алгебраическое сокращение факторов ДО вычисления сингулярностей`,
    status: 'pending-translation',
    values: {
      'ru': `SAFETY CHECK (SP2)', action: 'Алгебраическое сокращение факторов ДО вычисления сингулярностей`,
    },
  },
  'runtime.legacy.75008a994ee4': {
    source: `targetFunction": "Formalize(Сингулярностивмашинномобучении)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Сингулярностивмашинномобучении)`,
    },
  },
  'runtime.legacy.7512322608ae': {
    source: `\${top.char}' на строке \${top.line}, но встречена закрывающая '\${char}`,
    status: 'pending-translation',
    values: {
      'ru': `\${top.char}' на строке \${top.line}, но встречена закрывающая '\${char}`,
    },
  },
  'runtime.legacy.756e4d63906a': {
    source: `не использует общий пул ключей`,
    status: 'pending-translation',
    values: {
      'ru': `не использует общий пул ключей`,
    },
  },
  'runtime.legacy.75ae24310e7d': {
    source: `targetFunction": "Formalize(Случайныеграфы)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Случайныеграфы)`,
    },
  },
  'runtime.legacy.7616cc826b74': {
    source: `singularityHint": "Невычислимость в пределе.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Невычислимость в пределе.`,
    },
  },
  'runtime.legacy.76216670aac1': {
    source: `description": "Странный аттрактор в хаотических системах.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Странный аттрактор в хаотических системах.`,
    },
  },
  'runtime.legacy.762cc12530ec': {
    source: `Ricis.Core отклонил формат выражения. Результат не вычислялся.`,
    status: 'pending-translation',
    values: {
      'ru': `Ricis.Core отклонил формат выражения. Результат не вычислялся.`,
    },
  },
  'runtime.legacy.76b47346cd00': {
    source: `Циклическая связь`,
    status: 'pending-translation',
    values: {
      'ru': `Циклическая связь`,
    },
  },
  'runtime.legacy.76dcf737a6cd': {
    source: `Отправить`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Отправить`,
      'fr-CA': `Envoyer`,
      'de-DE': `Senden`,
      'hi-IN': `भेजें`,
      'ms-MY': `Hantar`,
    },
  },
  'runtime.legacy.76e9dcdea3f6': {
    source: `targetFunction": "Formalize(Дилеммазаключенного)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Дилеммазаключенного)`,
    },
  },
  'runtime.legacy.770dda153fe1': {
    source: `title": "Сложность сортировки`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Сложность сортировки`,
    },
  },
  'runtime.legacy.7736d666c528': {
    source: `Lean 4 Спецификация`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Lean 4 Спецификация`,
      'fr-CA': `Spécification Lean 4`,
      'de-DE': `Lean 4-Spezifikation`,
      'hi-IN': `Lean 4 विनिर्देश`,
      'ms-MY': `Spesifikasi Lean 4`,
    },
  },
  'runtime.legacy.77541ff2db56': {
    source: `panel.actions': { ru: 'Быстрые действия', en: 'Quick actions`,
    status: 'pending-translation',
    values: {
      'ru': `panel.actions': { ru: 'Быстрые действия', en: 'Quick actions`,
    },
  },
  'runtime.legacy.776d485676e2': {
    source: `title": "Теория Янга-Миллса: существование и массовая щель`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Теория Янга-Миллса: существование и массовая щель`,
    },
  },
  'runtime.legacy.778cb4caec4d': {
    source: `Моральное выравнивание, безопасность.`,
    status: 'pending-translation',
    values: {
      'ru': `Моральное выравнивание, безопасность.`,
    },
  },
  'runtime.legacy.77a2c7c45b1d': {
    source: `targetFunction": "Formalize(Информационныйпарадоксчерныхдыр)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Информационныйпарадоксчерныхдыр)`,
    },
  },
  'runtime.legacy.78626a548cea': {
    source: `Фармацевтический рынок ИИ-дизайна молекул $2 Трлн`,
    status: 'pending-translation',
    values: {
      'ru': `Фармацевтический рынок ИИ-дизайна молекул $2 Трлн`,
    },
  },
  'runtime.legacy.78f89b128536': {
    source: `singularityHint": "Экспоненциальный взрыв времени вычислений схлопывается побитовыми сдвигами за 1 такт.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Экспоненциальный взрыв времени вычислений схлопывается побитовыми сдвигами за 1 такт.`,
    },
  },
  'runtime.legacy.791f1ffd5154': {
    source: `targetFunction": "Formalize(Оптимизациягиперпараметров)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Оптимизациягиперпараметров)`,
    },
  },
  'runtime.legacy.792c3c432303': {
    source: `Не связанный узел`,
    status: 'pending-translation',
    values: {
      'ru': `Не связанный узел`,
    },
  },
  'runtime.legacy.793faf5ae717': {
    source: `terminal.error': { ru: 'Ошибка', en: 'Error`,
    status: 'pending-translation',
    values: {
      'ru': `terminal.error': { ru: 'Ошибка', en: 'Error`,
    },
  },
  'runtime.legacy.7973722ddda0': {
    source: `description": "Состояния на краю, защищенные топологией.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Состояния на краю, защищенные топологией.`,
    },
  },
  'runtime.legacy.7a06908d42ad': {
    source: `RICIS TRANSFORMS (A6)', action: 'Косое произведение ортогональных векторов det(u,v) = F * G или 0_F * \\\\infty_F = F^2`,
    status: 'pending-translation',
    values: {
      'ru': `RICIS TRANSFORMS (A6)', action: 'Косое произведение ортогональных векторов det(u,v) = F * G или 0_F * \\\\infty_F = F^2`,
    },
  },
  'runtime.legacy.7a295b9e7bfb': {
    source: `отклонил`,
    status: 'pending-translation',
    values: {
      'ru': `отклонил`,
    },
  },
  'runtime.legacy.7a417263cdc5': {
    source: `теория сингулярности|0/0=1`,
    status: 'pending-translation',
    values: {
      'ru': `теория сингулярности|0/0=1`,
    },
  },
  'runtime.legacy.7a56713e8951': {
    source: `Проверка структуры монолита и размерности`,
    status: 'pending-translation',
    values: {
      'ru': `Проверка структуры монолита и размерности`,
    },
  },
  'runtime.legacy.7a852e5d2504': {
    source: `Ricis.Core вернул неполный ответ. Результат не принят.`,
    status: 'pending-translation',
    values: {
      'ru': `Ricis.Core вернул неполный ответ. Результат не принят.`,
    },
  },
  'runtime.legacy.7b233d12ab25': {
    source: `settings.profileName': { ru: 'Название профиля:', en: 'Profile name:`,
    status: 'pending-translation',
    values: {
      'ru': `settings.profileName': { ru: 'Название профиля:', en: 'Profile name:`,
    },
  },
  'runtime.legacy.7b699487a31f': {
    source: `singularityHint": "Топологические препятствия.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Топологические препятствия.`,
    },
  },
  'runtime.legacy.7bd903c1bf08': {
    source: `сам') && (s.includes('формул') || s.includes('уравнен') || s.includes('выражен') || s.includes('функц') || s.includes('решен`,
    status: 'pending-translation',
    values: {
      'ru': `сам') && (s.includes('формул') || s.includes('уравнен') || s.includes('выражен') || s.includes('функц') || s.includes('решен`,
    },
  },
  'runtime.legacy.7c01d901ddac': {
    source: `Математика`,
    status: 'pending-translation',
    values: {
      'ru': `Математика`,
    },
  },
  'runtime.legacy.7c4c29d9ac5e': {
    source: `Разрешение неопределенности через аксиомы SP1-SP4 и Skew Product A6`,
    status: 'pending-translation',
    values: {
      'ru': `Разрешение неопределенности через аксиомы SP1-SP4 и Skew Product A6`,
    },
  },
  'runtime.legacy.7cc37ed52404': {
    source: `Бесполезный монолит`,
    status: 'pending-translation',
    values: {
      'ru': `Бесполезный монолит`,
    },
  },
  'runtime.legacy.7d0cd44c1e4a': {
    source: `description": "Гипотеза ER=EPR.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Гипотеза ER=EPR.`,
    },
  },
  'runtime.legacy.7d16a2499445': {
    source: `settings.close': { ru: 'Закрыть', en: 'Close`,
    status: 'pending-translation',
    values: {
      'ru': `settings.close': { ru: 'Закрыть', en: 'Close`,
    },
  },
  'runtime.legacy.7d17f9c02788': {
    source: `Фундаментальная нерешённая проблема формализации целевой функции сверхсложных систем (ИИ). Избежание расхождения путей с помощью протокола SP4.`,
    status: 'pending-translation',
    values: {
      'ru': `Фундаментальная нерешённая проблема формализации целевой функции сверхсложных систем (ИИ). Избежание расхождения путей с помощью протокола SP4.`,
    },
  },
  'runtime.legacy.7df3e4a6de2d': {
    source: `singularityHint": "Точечный источник магнитного поля.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Точечный источник магнитного поля.`,
    },
  },
  'runtime.legacy.7e2eff4d0332': {
    source: `WebAssembly-ядро Ricis.Core не завершило вычисление. Результат не вычислялся.`,
    status: 'pending-translation',
    values: {
      'ru': `WebAssembly-ядро Ricis.Core не завершило вычисление. Результат не вычислялся.`,
    },
  },
  'runtime.legacy.7e9c02cd7a5e': {
    source: `targetFunction": "Formalize(Алгоритмыконсенсуса)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Алгоритмыконсенсуса)`,
    },
  },
  'runtime.legacy.7e9fbd72c2b3': {
    source: `singularityHint": "Конические точки в компактных пространствах.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Конические точки в компактных пространствах.`,
    },
  },
  'runtime.legacy.7ecf5a7d2737': {
    source: `singularityHint": "Сингулярность этической функции полезности.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность этической функции полезности.`,
    },
  },
  'runtime.legacy.7ee5c8b59ad7': {
    source: `Нобелевская премия / Теломеры и долг долголетия $3 Трлн`,
    status: 'pending-translation',
    values: {
      'ru': `Нобелевская премия / Теломеры и долг долголетия $3 Трлн`,
    },
  },
  'runtime.legacy.7f0a978f59c5': {
    source: `Значение инварианта / Примененная аксиома`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Значение инварианта / Примененная аксиома`,
      'fr-CA': `Valeur invariante / Axiome appliqué`,
      'de-DE': `Invarianter Wert / Angewendetes Axiom`,
      'hi-IN': `इनवेरिएंट मान / प्रयुक्त ऐक्सिओम`,
      'ms-MY': `Nilai invarian / Aksiom yang digunakan`,
    },
  },
  'runtime.legacy.7f17d320499e': {
    source: `Узел отмечен как resolved в карте. Этот статус сам по себе не является Lean kernel verification.`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Узел отмечен как resolved в карте. Этот статус сам по себе не является Lean kernel verification.`,
      'fr-CA': `Le nœud est marqué comme resolved sur la carte. Ce statut de workflow seul n'est pas une vérification du noyau Lean.`,
      'de-DE': `Der Knoten ist in der Karte als resolved markiert. Dieser Workflow‑Status allein ist keine Lean‑Kernel‑Verifikation.`,
      'hi-IN': `यह नोड मानचित्र पर 'resolved' के रूप में चिह्नित है। यह workflow स्थिति अकेले Lean kernel सत्यापन नहीं बताती।`,
      'ms-MY': `Nod ditandakan sebagai resolved dalam peta. Status workflow itu sendiri bukanlah pengesahan kernel Lean.`,
    },
  },
  'runtime.legacy.7f1b83dbb5ca': {
    source: `Трассировка 8 фаз конвейера (фазы -1...6)`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Трассировка 8 фаз конвейера (фазы -1...6)`,
      'fr-CA': `Trace du pipeline en huit phases (phases -1...6)`,
      'de-DE': `Achtphasige Pipeline-Trace (Phasen -1...6)`,
      'hi-IN': `आठ-चरण पाइपलाइन ट्रेस (चरण -1...6)`,
      'ms-MY': `Jejak paip lapan fasa (fasa -1...6)`,
    },
  },
  'runtime.legacy.7fb9dd11033f': {
    source: `title": "Сингулярности в теории струн`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Сингулярности в теории струн`,
    },
  },
  'runtime.legacy.7fbd1b9fc8f8': {
    source: `\${last.char}' на строке \${last.line}, но встречена закрывающая '\${ch}`,
    status: 'pending-translation',
    values: {
      'ru': `\${last.char}' на строке \${last.line}, но встречена закрывающая '\${ch}`,
    },
  },
  'runtime.legacy.800eb71942cc': {
    source: `targetFunction": "Formalize(СингулярныевозмущенияДУ)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(СингулярныевозмущенияДУ)`,
    },
  },
  'runtime.legacy.801917728439': {
    source: `zoneId": строка (зона науки, например "math", "physics", "computer_science`,
    status: 'pending-translation',
    values: {
      'ru': `zoneId": строка (зона науки, например "math", "physics", "computer_science`,
    },
  },
  'runtime.legacy.801a48ac0157': {
    source: `singularityHint": "Сингулярность кривизны на линии.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность кривизны на линии.`,
    },
  },
  'runtime.legacy.802f16768b6c': {
    source: `Внутренняя ошибка. Неподтверждённый результат не был объявлен доказанным.`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Внутренняя ошибка. Неподтверждённый результат не был объявлен доказанным.`,
      'fr-CA': `Erreur interne. Un résultat non vérifié n'a pas été déclaré prouvé.`,
      'de-DE': `Interner Fehler. Ein nicht verifiziertes Ergebnis wurde nicht als bewiesen erklärt.`,
      'hi-IN': `आंतरिक त्रुटि। एक अप्रमाणित परिणाम को प्रमाणित बताया नहीं गया था।`,
      'ms-MY': `Ralat dalaman. Keputusan yang tidak disahkan tidak diisytiharkan terbukti.`,
    },
  },
  'runtime.legacy.804a1edf08fe': {
    source: `• \`REQUIRES_CORE_LEAN\` — результат требует отдельной проверки Core или Lean.`,
    status: 'pending-translation',
    values: {
      'ru': `• \`REQUIRES_CORE_LEAN\` — результат требует отдельной проверки Core или Lean.`,
    },
  },
  'runtime.legacy.80765f1cd540': {
    source: `targetFunction": "Formalize(Токсичностьнаноматериалов)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Токсичностьнаноматериалов)`,
    },
  },
  'runtime.legacy.809215629728': {
    source: `singularityHint": "Ортогональность интеллекта и целей.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Ортогональность интеллекта и целей.`,
    },
  },
  'runtime.legacy.80a2acdf6616': {
    source: `Ссылка на первоисточник / DOI (опционально)`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Ссылка на первоисточник / DOI (опционально)`,
      'fr-CA': `Référence source / Lien DOI (optionnel)`,
      'de-DE': `Quellenangabe / DOI-Link (optional)`,
      'hi-IN': `स्रोत संदर्भ / DOI लिंक (वैकल्पिक)`,
      'ms-MY': `Rujukan sumber / Pautan DOI (pilihan)`,
    },
  },
  'runtime.legacy.80d776c572cb': {
    source: `singularityHint": "Квазиполиномиальный тупик ликвидируется SIMD параллелизмом _mm256_cmpeq_epi32.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Квазиполиномиальный тупик ликвидируется SIMD параллелизмом _mm256_cmpeq_epi32.`,
    },
  },
  'runtime.legacy.8171e1552766': {
    source: `Устранение сингулярностей за O(1) время без динамических пределов`,
    status: 'pending-translation',
    values: {
      'ru': `Устранение сингулярностей за O(1) время без динамических пределов`,
    },
  },
  'runtime.legacy.818083aa658c': {
    source: `description": "Строгое доказательство существования квантовой теории поля.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Строгое доказательство существования квантовой теории поля.`,
    },
  },
  'runtime.legacy.81f390f55750': {
    source: `singularityHint": "Коллапс метрики в точку.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Коллапс метрики в точку.`,
    },
  },
  'runtime.legacy.825f8002f42f': {
    source: `description": "Сбой распознавания свой-чужой.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Сбой распознавания свой-чужой.`,
    },
  },
  'runtime.legacy.82e1d145e7b5': {
    source: `singularityHint": "Бесконечная изрезанность (сингулярность границы).`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Бесконечная изрезанность (сингулярность границы).`,
    },
  },
  'runtime.legacy.83625a4d0701': {
    source: `terminal.loadTitle': { ru: 'Загрузить в строку ввода', en: 'Load into input`,
    status: 'pending-translation',
    values: {
      'ru': `terminal.loadTitle': { ru: 'Загрузить в строку ввода', en: 'Load into input`,
    },
  },
  'runtime.legacy.83b9bb3478f6': {
    source: `title": "Особенности дифференциальных уравнений Пенлеве`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Особенности дифференциальных уравнений Пенлеве`,
    },
  },
  'runtime.legacy.84bd9c507e02': {
    source: `Терминал готов к доказательству`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Терминал готов к доказательству`,
      'fr-CA': `Terminal prêt pour le calcul de preuve`,
      'de-DE': `Terminal bereit für Beweisberechnungen`,
      'hi-IN': `टर्मिनल प्रमाण गणना के लिए तैयार है`,
      'ms-MY': `Terminal sedia untuk pengiraan bukti`,
    },
  },
  'runtime.legacy.84c7ed16ea6b': {
    source: `description": "Проблема вакуумной энергии.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Проблема вакуумной энергии.`,
    },
  },
  'runtime.legacy.85857948bed8': {
    source: `Сирота`,
    status: 'pending-translation',
    values: {
      'ru': `Сирота`,
    },
  },
  'runtime.legacy.87478fe47d40': {
    source: `title": "Особые точки алгебраических кривых`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Особые точки алгебраических кривых`,
    },
  },
  'runtime.legacy.885f9abb0e19': {
    source: `Неизменяемый внешний Lean-исходник принят как явно маркированный trusted contract; это не автоматически сгенерированная теорема.`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Неизменяемый внешний Lean-исходник принят как явно маркированный trusted contract; это не автоматически сгенерированная теорема.`,
      'fr-CA': `Une source Lean externe immuable est acceptée comme un explicitly labelled trusted contract ; ce n'est pas un théorème généré automatiquement.`,
      'de-DE': `Eine unveränderliche externe Lean-Quelle wird als explizit gekennzeichneter trusted contract akzeptiert; sie ist kein automatisch erzeugtes Theorem.`,
      'hi-IN': `एक अपरिवर्तनीय बाहरी Lean स्रोत स्पष्ट रूप से चिह्नित trusted contract के रूप में स्वीकार किया जाता है; यह स्वचालित रूप से उत्पन्न प्रमेय नहीं है।`,
      'ms-MY': `Satu sumber Lean luaran yang tidak boleh diubah diterima sebagai trusted contract yang dilabelkan secara eksplisit; ia bukan teorem yang dihasilkan secara automatik.`,
    },
  },
  'runtime.legacy.88d17100d787': {
    source: `Подтверждение абсолютной непрерывности L0 и стабильности инварианта`,
    status: 'pending-translation',
    values: {
      'ru': `Подтверждение абсолютной непрерывности L0 и стабильности инварианта`,
    },
  },
  'runtime.legacy.88d6ef714853': {
    source: `Генетика, белковые структуры.`,
    status: 'pending-translation',
    values: {
      'ru': `Генетика, белковые структуры.`,
    },
  },
  'runtime.legacy.88d97e5610c2': {
    source: `должен обновлять строку ввода`,
    status: 'pending-translation',
    values: {
      'ru': `должен обновлять строку ввода`,
    },
  },
  'runtime.legacy.88e237bf5a6b': {
    source: `description": "Ухудшение пропускной способности при добавлении дорог.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Ухудшение пропускной способности при добавлении дорог.`,
    },
  },
  'runtime.legacy.88eeaeed9ebb': {
    source: `должен запускать runSystemAudit и корректно обновлятьlastAuditReport`,
    status: 'pending-translation',
    values: {
      'ru': `должен запускать runSystemAudit и корректно обновлятьlastAuditReport`,
    },
  },
  'runtime.legacy.8922542f90c1': {
    source: `Скопировано`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Скопировано`,
      'fr-CA': `Copié`,
      'de-DE': `Kopiert`,
      'hi-IN': `कॉपी किया गया`,
      'ms-MY': `Disalin`,
    },
  },
  'runtime.legacy.893cbc939914': {
    source: `должен включать флагманские модели 3.5, 3.1 Pro и 2.5`,
    status: 'pending-translation',
    values: {
      'ru': `должен включать флагманские модели 3.5, 3.1 Pro и 2.5`,
    },
  },
  'runtime.legacy.8958ea33ffc8': {
    source: `title": "Квантовая когомология`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Квантовая когомология`,
    },
  },
  'runtime.legacy.8961df8730ee': {
    source: `Здоровье и продолжительность жизни.`,
    status: 'pending-translation',
    values: {
      'ru': `Здоровье и продолжительность жизни.`,
    },
  },
  'runtime.legacy.89a3c1055096': {
    source: `• \`CORE_VERIFIED\` — результат подтверждён Ricis.Core.\\n`,
    status: 'pending-translation',
    values: {
      'ru': `• \`CORE_VERIFIED\` — результат подтверждён Ricis.Core.\\n`,
    },
  },
  'runtime.legacy.8a09af6cf86e': {
    source: `Аксиома`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Аксиома`,
      'fr-CA': `Axiome`,
      'de-DE': `Axiom`,
      'hi-IN': `एक्सिओम`,
      'ms-MY': `Aksioma`,
    },
  },
  'runtime.legacy.8a10254ff4c2': {
    source: `theoremReport.copied': { ru: 'Скопировано', en: 'Copied`,
    status: 'pending-translation',
    values: {
      'ru': `theoremReport.copied': { ru: 'Скопировано', en: 'Copied`,
    },
  },
  'runtime.legacy.8a1f4b6cdde1': {
    source: `должен правильно валидировать L1 Identity по TCP протоколу`,
    status: 'pending-translation',
    values: {
      'ru': `должен правильно валидировать L1 Identity по TCP протоколу`,
    },
  },
  'runtime.legacy.8a9b4e541e6e': {
    source: `title": "Сингулярность функции Вейерштрасса`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Сингулярность функции Вейерштрасса`,
    },
  },
  'runtime.legacy.8b10a04e81b0': {
    source: `Создание proof run...`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Создание proof run...`,
      'fr-CA': `Création du proof run...`,
      'de-DE': `Proof run wird erstellt...`,
      'hi-IN': `proof run बन रहा है...`,
      'ms-MY': `Mencipta proof run...`,
    },
  },
  'runtime.legacy.8c774206b143': {
    source: `Предустановки`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Предустановки`,
      'fr-CA': `Préréglages`,
      'de-DE': `Voreinstellungen`,
      'hi-IN': `प्रिसेट्स`,
      'ms-MY': `Pratetapan`,
    },
  },
  'runtime.legacy.8cd88cdc3889': {
    source: `должен выявлять замкнутые циклические петли без переполнения стека [A4 0/0 Ratio]`,
    status: 'pending-translation',
    values: {
      'ru': `должен выявлять замкнутые циклические петли без переполнения стека [A4 0/0 Ratio]`,
    },
  },
  'runtime.legacy.8d0adf51d23b': {
    source: `title": "Микробиом человека`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Микробиом человека`,
    },
  },
  'runtime.legacy.8d1508491800': {
    source: `description": "Дискретность холловского сопротивления.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Дискретность холловского сопротивления.`,
    },
  },
  'runtime.legacy.8d3cded9324d': {
    source: `targetFunction": "Formalize(ТеорияЯнгаМиллса:существованиеимассоваящель)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(ТеорияЯнгаМиллса:существованиеимассоваящель)`,
    },
  },
  'runtime.legacy.8da6977f4fba': {
    source: `Выполнение канонической операции...`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Выполнение канонической операции...`,
      'fr-CA': `Exécution de l'opération canonique...`,
      'de-DE': `Ausführen der kanonischen Operation...`,
      'hi-IN': `कैनोनिकल ऑपरेशन निष्पादित किया जा रहा है...`,
      'ms-MY': `Menjalankan operasi kanonik...`,
    },
  },
  'runtime.legacy.8dc8166acdba': {
    source: `description": "Недифференцируемая, но всюду непрерывная функция.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Недифференцируемая, но всюду непрерывная функция.`,
    },
  },
  'runtime.legacy.8e35433658e8': {
    source: `Версия Core`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Версия Core`,
      'fr-CA': `Version de Core`,
      'de-DE': `Core-Version`,
      'hi-IN': `Core संस्करण`,
      'ms-MY': `Versi Core`,
    },
  },
  'runtime.legacy.8e4494b59219': {
    source: `targetFunction": "Formalize(ТеоремаобиндексеАтьиЗингера)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(ТеоремаобиндексеАтьиЗингера)`,
    },
  },
  'runtime.legacy.8e8e0890bbc4': {
    source: `должен обновлять параметры узла (updateNode)`,
    status: 'pending-translation',
    values: {
      'ru': `должен обновлять параметры узла (updateNode)`,
    },
  },
  'runtime.legacy.8e9e556af6e2': {
    source: `Медицина`,
    status: 'pending-translation',
    values: {
      'ru': `Медицина`,
    },
  },
  'runtime.legacy.8ead3cd74771': {
    source: `Очистить историю`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Очистить историю`,
      'fr-CA': `Effacer l'historique`,
      'de-DE': `Verlauf löschen`,
      'hi-IN': `इतिहास साफ़ करें`,
      'ms-MY': `Kosongkan sejarah`,
    },
  },
  'runtime.legacy.8eb318a91b4f': {
    source: `"вырожденная геометрия" OR "бесконечная полоса" "площадь пересечения"`,
    status: 'pending-translation',
    values: {
      'ru': `"вырожденная геометрия" OR "бесконечная полоса" "площадь пересечения"`,
    },
  },
  'runtime.legacy.8ebbe564c11f': {
    source: `description": "Оптимальные пределы O(N log N).`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Оптимальные пределы O(N log N).`,
    },
  },
  'runtime.legacy.8ecea0c508e5': {
    source: `panel.zones': { ru: 'Сферы науки', en: 'Scientific fields`,
    status: 'pending-translation',
    values: {
      'ru': `panel.zones': { ru: 'Сферы науки', en: 'Scientific fields`,
    },
  },
  'runtime.legacy.8f2d1361a09f': {
    source: `Аудит системы`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Аудит системы`,
      'fr-CA': `Audit du système`,
      'de-DE': `Systemprüfung`,
      'hi-IN': `सिस्टम ऑडिट`,
      'ms-MY': `Audit Sistem`,
    },
  },
  'runtime.legacy.8f3d775526c5': {
    source: `title": "Спектральная асимптотика`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Спектральная асимптотика`,
    },
  },
  'runtime.legacy.8f7177cf7444': {
    source: `Граница evidence`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Граница evidence`,
      'fr-CA': `Frontière des preuves`,
      'de-DE': `Beweisgrenze`,
      'hi-IN': `प्रमाण सीमा`,
      'ms-MY': `Sempadan bukti`,
    },
  },
  'runtime.legacy.90704284d8fc': {
    source: `description": "Экранирование магнитного момента.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Экранирование магнитного момента.`,
    },
  },
  'runtime.legacy.90cd7b0db952': {
    source: `singularityHint": "Фрактальная изломанность.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Фрактальная изломанность.`,
    },
  },
  'runtime.legacy.9124d7c39872': {
    source: `title": "Квазикристаллы`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Квазикристаллы`,
    },
  },
  'runtime.legacy.91f76b2b5054': {
    source: `singularityHint": "Предел дифференцировки стволовых клеток.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Предел дифференцировки стволовых клеток.`,
    },
  },
  'runtime.legacy.9205a48f96a9': {
    source: `Пошаговый лог (Phases -1..6)`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Пошаговый лог (Phases -1..6)`,
      'fr-CA': `Traçage pas à pas (Phases -1..6)`,
      'de-DE': `Schrittweises Protokoll (Phasen -1..6)`,
      'hi-IN': `कदम-दर-कदम ट्रेस (चरण -1..6)`,
      'ms-MY': `Jejak Langkah demi Langkah (Fasa -1..6)`,
    },
  },
  'runtime.legacy.92253c59331f': {
    source: `description": "Критические точки гладких функций.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Критические точки гладких функций.`,
    },
  },
  'runtime.legacy.927029cfa120': {
    source: `description": "Невыпуклые ландшафты потерь.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Невыпуклые ландшафты потерь.`,
    },
  },
  'runtime.legacy.927d3fabb82e': {
    source: `targetFunction": "Formalize(Нейропластичность)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Нейропластичность)`,
    },
  },
  'runtime.legacy.928447512119': {
    source: `title": "Псевдодифференциальные операторы`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Псевдодифференциальные операторы`,
    },
  },
  'runtime.legacy.929cc7d90ed7': {
    source: `targetFunction": "Formalize(Сингулярностивтеорииструн)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Сингулярностивтеорииструн)`,
    },
  },
  'runtime.legacy.92a63e487bf0': {
    source: `description": "Теория катастроф.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Теория катастроф.`,
    },
  },
  'runtime.legacy.92a7bdab06bb': {
    source: `description": "Существует ли нетривиальное инвариантное подпространство?`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Существует ли нетривиальное инвариантное подпространство?`,
    },
  },
  'runtime.legacy.92b44fff6234': {
    source: `description": "Пространства Конна.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Пространства Конна.`,
    },
  },
  'runtime.legacy.9322bf379d59': {
    source: `Сброс`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Сброс`,
      'fr-CA': `Réinitialiser`,
      'de-DE': `Zurücksetzen`,
      'hi-IN': `रीसेट`,
      'ms-MY': `Tetapkan semula`,
    },
  },
  'runtime.legacy.9356f80ff7c0': {
    source: `Новых гипотез не обнаружено (граф сбалансирован).', 'info`,
    status: 'pending-translation',
    values: {
      'ru': `Новых гипотез не обнаружено (граф сбалансирован).', 'info`,
    },
  },
  'runtime.legacy.9384691902ed': {
    source: `singularityHint": "Сингулярный носитель распределения.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярный носитель распределения.`,
    },
  },
  'runtime.legacy.93d6b5cccfef': {
    source: `singularityHint": "Информационная граница дерева решений.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Информационная граница дерева решений.`,
    },
  },
  'runtime.legacy.9418512c89a9': {
    source: `Доступные связанные задачи`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Доступные связанные задачи`,
      'fr-CA': `Problèmes connexes disponibles`,
      'de-DE': `Verfügbare verwandte Probleme`,
      'hi-IN': `उपलब्ध संबंधित समस्याएँ`,
      'ms-MY': `Masalah berkaitan yang tersedia`,
    },
  },
  'runtime.legacy.952f20735fcc': {
    source: `Теорема (LaTeX / Q.E.D.)`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Теорема (LaTeX / Q.E.D.)`,
      'fr-CA': `Théorème (LaTeX / Q.E.D.)`,
      'de-DE': `Theorem (LaTeX / Q.E.D.)`,
      'hi-IN': `थ्योरम (LaTeX / Q.E.D.)`,
      'ms-MY': `Teorem (LaTeX / Q.E.D.)`,
    },
  },
  'runtime.legacy.95661457abfe': {
    source: `terminal.engineVersion': { ru: 'Аксиоматический движок v7.7', en: 'Axiomatic Engine v7.7`,
    status: 'pending-translation',
    values: {
      'ru': `terminal.engineVersion': { ru: 'Аксиоматический движок v7.7', en: 'Axiomatic Engine v7.7`,
    },
  },
  'runtime.legacy.96669412347a': {
    source: `Формулировка проблемы вычислена через прямое каноническое расширение RICIS-III.`,
    status: 'pending-translation',
    values: {
      'ru': `Формулировка проблемы вычислена через прямое каноническое расширение RICIS-III.`,
    },
  },
  'runtime.legacy.96bb3b67a2f4': {
    source: `Свернуть карточку задачи`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Свернуть карточку задачи`,
      'fr-CA': `Réduire la carte du problème`,
      'de-DE': `Problemkarte einklappen`,
      'hi-IN': `समस्या कार्ड संकुचित करें`,
      'ms-MY': `Kuncupkan kad masalah`,
    },
  },
  'runtime.legacy.96c636902474': {
    source: `singularityHint": "Сингулярность адаптивного ландшафта.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность адаптивного ландшафта.`,
    },
  },
  'runtime.legacy.970e413e24bc': {
    source: `singularityHint": "Поосный тупик [0 * inf = NaN] vs Ортогональная свертка векторного монолита [2 * 5 = 10]`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Поосный тупик [0 * inf = NaN] vs Ортогональная свертка векторного монолита [2 * 5 = 10]`,
    },
  },
  'runtime.legacy.971c37cc5ad2': {
    source: `Записей trace`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Записей trace`,
      'fr-CA': `Entrées de trace`,
      'de-DE': `Trace-Einträge`,
      'hi-IN': `ट्रेस प्रविष्टियाँ`,
      'ms-MY': `Entri jejak`,
    },
  },
  'runtime.legacy.9789398b623c': {
    source: `Открывает доступ к задачам`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Открывает доступ к задачам`,
      'fr-CA': `Débloque les problèmes suivants`,
      'de-DE': `Schaltet die nächsten Probleme frei`,
      'hi-IN': `अगली समस्याओं को अनलॉक करता है`,
      'ms-MY': `Membuka kunci masalah seterusnya`,
    },
  },
  'runtime.legacy.97ce5e3c6c76': {
    source: `найди формулу сам" / "ищи сам`,
    status: 'pending-translation',
    values: {
      'ru': `найди формулу сам" / "ищи сам`,
    },
  },
  'runtime.legacy.984c0d4a3e00': {
    source: `Астрономия и астрофизика`,
    status: 'pending-translation',
    values: {
      'ru': `Астрономия и астрофизика`,
    },
  },
  'runtime.legacy.985bcc9a73c7': {
    source: `targetFunction": "Formalize(Устойчивостькантибиотикам)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Устойчивостькантибиотикам)`,
    },
  },
  'runtime.legacy.993221a84198': {
    source: `Предел Коши`,
    status: 'pending-translation',
    values: {
      'ru': `Предел Коши`,
    },
  },
  'runtime.legacy.9939ceac9e18': {
    source: `Предотвращение рисков AGI Alignment $30 Трлн`,
    status: 'pending-translation',
    values: {
      'ru': `Предотвращение рисков AGI Alignment $30 Трлн`,
    },
  },
  'runtime.legacy.9962226d5b69': {
    source: `title": "Квантовая гравитация`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Квантовая гравитация`,
    },
  },
  'runtime.legacy.9971ca3de346': {
    source: `singularityHint": "Сингулярности резольвенты.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярности резольвенты.`,
    },
  },
  'runtime.legacy.997444f871a0': {
    source: `Нобелевская премия по физике ~$1,100,000 (Большой Взрыв)`,
    status: 'pending-translation',
    values: {
      'ru': `Нобелевская премия по физике ~$1,100,000 (Большой Взрыв)`,
    },
  },
  'runtime.legacy.99c3dd0b0f9f': {
    source: `description": "Идеальная избирательная система.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Идеальная избирательная система.`,
    },
  },
  'runtime.legacy.99ce26e80688': {
    source: `Поделиться`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Поделиться`,
      'fr-CA': `Partager`,
      'de-DE': `Teilen`,
      'hi-IN': `साझा करें`,
      'ms-MY': `Kongsi`,
    },
  },
  'runtime.legacy.9a1540f018f9': {
    source: `Для внешнего исходника Lean сохранены воспроизводимые toolchain, compiler output и axiom report.`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Для внешнего исходника Lean сохранены воспроизводимые toolchain, compiler output и axiom report.`,
      'fr-CA': `La chaîne d'outils reproductible, la sortie du compilateur et le rapport d'axiome sont conservés pour la source Lean externe.`,
      'de-DE': `Reproduzierbare Toolchain, Compiler-Ausgabe und Axiom-Bericht werden für die externe Lean-Quelle aufbewahrt.`,
      'hi-IN': `बाहरी Lean स्रोत के लिए पुनरुत्पादन योग्य टूलचेन, कंपाइलर आउटपुट और ऐक्सिओम रिपोर्ट संग्रहीत रहती हैं।`,
      'ms-MY': `Toolchain yang boleh direproduksi, keluaran pengkompil dan laporan aksiom disimpan untuk sumber Lean luaran.`,
    },
  },
  'runtime.legacy.9a62fe3e6ae5': {
    source: `Премия Института Клея $1,000,000`,
    status: 'pending-translation',
    values: {
      'ru': `Премия Института Клея $1,000,000`,
    },
  },
  'runtime.legacy.9a6e67d193dc': {
    source: `description": "Одномерные топологические дефекты.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Одномерные топологические дефекты.`,
    },
  },
  'runtime.legacy.9ac0f1f17a6d': {
    source: `очищен`,
    status: 'pending-translation',
    values: {
      'ru': `очищен`,
    },
  },
  'runtime.legacy.9b52b1511367': {
    source: `Нобелевская премия / Биотехнологии Protein Folding $800 Млрд`,
    status: 'pending-translation',
    values: {
      'ru': `Нобелевская премия / Биотехнологии Protein Folding $800 Млрд`,
    },
  },
  'runtime.legacy.9b725b38b415': {
    source: `Проверка эквивалентности с ожидаемым инвариантом (Goal Match)`,
    status: 'pending-translation',
    values: {
      'ru': `Проверка эквивалентности с ожидаемым инвариантом (Goal Match)`,
    },
  },
  'runtime.legacy.9b72c163a10f': {
    source: `title": "Аттрактор Лоренца`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Аттрактор Лоренца`,
    },
  },
  'runtime.legacy.9da4a24f217f': {
    source: `Ядро Ricis.Core недоступно. Выражение не вычислялось.`,
    status: 'pending-translation',
    values: {
      'ru': `Ядро Ricis.Core недоступно. Выражение не вычислялось.`,
    },
  },
  'runtime.legacy.9daab4c60d74': {
    source: `singularityHint": "Сингулярность будущего (Большой разрыв).`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность будущего (Большой разрыв).`,
    },
  },
  'runtime.legacy.9e0bb12e9a2a': {
    source: `targetFunction": "Formalize(Свертываниебелка(ProteinFolding))`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Свертываниебелка(ProteinFolding))`,
    },
  },
  'runtime.legacy.9e9cb9778298': {
    source: `description": "Разрешение орибифолдных сингулярностей.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Разрешение орибифолдных сингулярностей.`,
    },
  },
  'runtime.legacy.9ef84b81c6cd': {
    source: `title": "Теория узлов`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Теория узлов`,
    },
  },
  'runtime.legacy.9f67001dddf2': {
    source: `description": "Восстановление органов.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Восстановление органов.`,
    },
  },
  'runtime.legacy.9f8aa7134c40': {
    source: `\${merge.source}" в канонический модуль "\${merge.target}`,
    status: 'pending-translation',
    values: {
      'ru': `\${merge.source}" в канонический модуль "\${merge.target}`,
    },
  },
  'runtime.legacy.9ffd5201057d': {
    source: `Сингулярная задача`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярная задача`,
    },
  },
  'runtime.legacy.a0404cf52278': {
    source: `description": "Фазовый набег электрона.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Фазовый набег электрона.`,
    },
  },
  'runtime.legacy.a05c66a88f0f': {
    source: `panel.persistence': { ru: 'Сохранение и Экспорт', en: 'Persistence & Export`,
    status: 'pending-translation',
    values: {
      'ru': `panel.persistence': { ru: 'Сохранение и Экспорт', en: 'Persistence & Export`,
    },
  },
  'runtime.legacy.a193911d06f6': {
    source: `должен выявлять семантические дубликаты на основе SP4 индекса [L1_IDENTITY]`,
    status: 'pending-translation',
    values: {
      'ru': `должен выявлять семантические дубликаты на основе SP4 индекса [L1_IDENTITY]`,
    },
  },
  'runtime.legacy.a21e9d2fc6e6': {
    source: `terminal.addTitle': { ru: 'Перенести это решение на 3D карту в виде нового узла', en: 'Transfer this solution to the 3D map as a new node`,
    status: 'pending-translation',
    values: {
      'ru': `terminal.addTitle': { ru: 'Перенести это решение на 3D карту в виде нового узла', en: 'Transfer this solution to the 3D map as a new node`,
    },
  },
  'runtime.legacy.a222407a8b31': {
    source: `theoremReport.copyComplexity': { ru: 'Сложность: {{value}}', en: 'Complexity: {{value}}`,
    status: 'pending-translation',
    values: {
      'ru': `theoremReport.copyComplexity': { ru: 'Сложность: {{value}}', en: 'Complexity: {{value}}`,
    },
  },
  'runtime.legacy.a25c84820bef': {
    source: `RICIS-III структурный черновик`,
    status: 'pending-translation',
    values: {
      'ru': `RICIS-III структурный черновик`,
    },
  },
  'runtime.legacy.a28224dcbe09': {
    source: `должен вызывать onCommit, если пользователь удерживает ползунок без движения дольше idleDelayMs`,
    status: 'pending-translation',
    values: {
      'ru': `должен вызывать onCommit, если пользователь удерживает ползунок без движения дольше idleDelayMs`,
    },
  },
  'runtime.legacy.a2e30976edb7': {
    source: `title": "Экзистенциальный риск`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Экзистенциальный риск`,
    },
  },
  'runtime.legacy.a32a5c9729fe': {
    source: `targetFunction": "Formalize(Квантоваягравитация)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Квантоваягравитация)`,
    },
  },
  'runtime.legacy.a339d4c6c3db': {
    source: `Фармакология`,
    status: 'pending-translation',
    values: {
      'ru': `Фармакология`,
    },
  },
  'runtime.legacy.a3abe102cf5d': {
    source: `скрытая сингулярность при редукции индексированных нулей`,
    status: 'pending-translation',
    values: {
      'ru': `скрытая сингулярность при редукции индексированных нулей`,
    },
  },
  'runtime.legacy.a3ea91960126': {
    source: `• \`/help\` — эта справка.\\n\\n`,
    status: 'pending-translation',
    values: {
      'ru': `• \`/help\` — эта справка.\\n\\n`,
    },
  },
  'runtime.legacy.a3f1d54f8ea9': {
    source: `Язык / Language`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Язык / Language`,
      'fr-CA': `Langue / Язык`,
      'de-DE': `Sprache / Язык`,
      'hi-IN': `भाषा / Язык`,
      'ms-MY': `Bahasa / Язык`,
    },
  },
  'runtime.legacy.a3fe984a741c': {
    source: `singularityHint": "Топологическое ветвление графа.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Топологическое ветвление графа.`,
    },
  },
  'runtime.legacy.a4111ea083c8': {
    source: `targetFunction": "Formalize(РазрешениеособенностейХиронаки)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(РазрешениеособенностейХиронаки)`,
    },
  },
  'runtime.legacy.a4763f8e7117': {
    source: `Вычисление сингулярностей O(1)`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Вычисление сингулярностей O(1)`,
      'fr-CA': `Évaluation de singularités en O(1)`,
      'de-DE': `O(1)-Singularitätsauswertung`,
      'hi-IN': `O(1) सिंगुलैरिटी का मूल्यांकन`,
      'ms-MY': `Penilaian singulariti O(1)`,
    },
  },
  'runtime.legacy.a4b14dd0c708': {
    source: `Физика`,
    status: 'pending-translation',
    values: {
      'ru': `Физика`,
    },
  },
  'runtime.legacy.a4d592c85024': {
    source: `Закрыть карточку задачи`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Закрыть карточку задачи`,
      'fr-CA': `Fermer la fiche du problème`,
      'de-DE': `Problemkarte schließen`,
      'hi-IN': `समस्या कार्ड बंद करें`,
      'ms-MY': `Tutup kad masalah`,
    },
  },
  'runtime.legacy.a52a17ec1d05': {
    source: `Экономика и прибыльность`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Экономика и прибыльность`,
      'fr-CA': `Économie et rentabilité`,
      'de-DE': `Wirtschaftlichkeit & Rentabilität`,
      'hi-IN': `अर्थशास्त्र और लाभप्रदता`,
      'ms-MY': `Ekonomi & Keuntungan`,
    },
  },
  'runtime.legacy.a538c087c2ce': {
    source: `theoremReport.localResult': { ru: 'Локальный результат (Lean kernel не запускался):', en: 'Local result (Lean kernel was not run):`,
    status: 'pending-translation',
    values: {
      'ru': `theoremReport.localResult': { ru: 'Локальный результат (Lean kernel не запускался):', en: 'Local result (Lean kernel was not run):`,
    },
  },
  'runtime.legacy.a568de3cb26d': {
    source: `Миграция v3 уже выполнена ранее.`,
    status: 'pending-translation',
    values: {
      'ru': `Миграция v3 уже выполнена ранее.`,
    },
  },
  'runtime.legacy.a5b5cdc5ec14': {
    source: `Копировать теорему`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Копировать теорему`,
      'fr-CA': `Copier le théorème`,
      'de-DE': `Theorem kopieren`,
      'hi-IN': `थ्योरम कॉपी करें`,
      'ms-MY': `Salin Teorem`,
    },
  },
  'runtime.legacy.a5e008079711': {
    source: `• \`LEAN_VERIFIED\` — результат подтверждён Lean с известной границей аксиом.\\n`,
    status: 'pending-translation',
    values: {
      'ru': `• \`LEAN_VERIFIED\` — результат подтверждён Lean с известной границей аксиом.\\n`,
    },
  },
  'runtime.legacy.a5e17c5e50a8': {
    source: `singularityHint": "Квантовая экспоненциальная сложность редуцируется стековой маской Span<byte>.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Квантовая экспоненциальная сложность редуцируется стековой маской Span<byte>.`,
    },
  },
  'runtime.legacy.a61032123690': {
    source: `description": "Ускоренное расширение Вселенной.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Ускоренное расширение Вселенной.`,
    },
  },
  'runtime.legacy.a65b9b11ee70': {
    source: `не принимает API-ключи`,
    status: 'pending-translation',
    values: {
      'ru': `не принимает API-ключи`,
    },
  },
  'runtime.legacy.a6608f105098': {
    source: `description": "Предел O(N log N).`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Предел O(N log N).`,
    },
  },
  'runtime.legacy.a69a4d426f6c': {
    source: `Редукция неопределенности [0/0] через SP1-SP4`,
    status: 'pending-translation',
    values: {
      'ru': `Редукция неопределенности [0/0] через SP1-SP4`,
    },
  },
  'runtime.legacy.a71339b8fb4a': {
    source: `должен поддерживать интерполяцию параметров в строках`,
    status: 'pending-translation',
    values: {
      'ru': `должен поддерживать интерполяцию параметров в строках`,
    },
  },
  'runtime.legacy.a71a587b3c07': {
    source: `targetFunction": "Formalize(Регенерациятканей)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Регенерациятканей)`,
    },
  },
  'runtime.legacy.a723e0269a79': {
    source: `Вычисление точного инварианта без потери контекста`,
    status: 'pending-translation',
    values: {
      'ru': `Вычисление точного инварианта без потери контекста`,
    },
  },
  'runtime.legacy.a7770ad70f01': {
    source: `description": "Притяжение проводящих пластин в вакууме.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Притяжение проводящих пластин в вакууме.`,
    },
  },
  'runtime.legacy.a78d1a84ef4a': {
    source: `не задана'})\`, 'ricis`,
    status: 'pending-translation',
    values: {
      'ru': `не задана'})\`, 'ricis`,
    },
  },
  'runtime.legacy.a7a6f74b6cb5': {
    source: `должен сохранять legacy academic goal match как partial до authoritative Lean evidence`,
    status: 'pending-translation',
    values: {
      'ru': `должен сохранять legacy academic goal match как partial до authoritative Lean evidence`,
    },
  },
  'runtime.legacy.a7b0d0d54039': {
    source: `description": "Инварианты Конвея.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Инварианты Конвея.`,
    },
  },
  'runtime.legacy.a8031bd503ef': {
    source: `singularityHint": "Асимптотическая плотность (арифметическая сингулярность).`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Асимптотическая плотность (арифметическая сингулярность).`,
    },
  },
  'runtime.legacy.a8b0685bbfc0': {
    source: `targetFunction": "Formalize(Некоммутативнаягеометрия)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Некоммутативнаягеометрия)`,
    },
  },
  'runtime.legacy.a8ef8af786b7': {
    source: `Внешнее Lean доказательство`,
    status: 'pending-translation',
    values: {
      'ru': `Внешнее Lean доказательство`,
    },
  },
  'runtime.legacy.a901574474d3': {
    source: `description": "Масштабная инвариантность.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Масштабная инвариантность.`,
    },
  },
  'runtime.legacy.a95cc988fcbc': {
    source: `title": "Инварианты Дональдсона`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Инварианты Дональдсона`,
    },
  },
  'runtime.legacy.aa40ef334d7c': {
    source: `description": "Механизм купратных сверхпроводников.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Механизм купратных сверхпроводников.`,
    },
  },
  'runtime.legacy.aa56e3ad70cb': {
    source: `singularityHint": "Нижняя граница сложности вычисления.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Нижняя граница сложности вычисления.`,
    },
  },
  'runtime.legacy.aa5e6f4d2b63': {
    source: `description": "Моральный выбор ИИ.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Моральный выбор ИИ.`,
    },
  },
  'runtime.legacy.aab711ea9722': {
    source: `должен выявлять сиротские (orphan) узлы [OrphanSingularity 0_orphan]`,
    status: 'pending-translation',
    values: {
      'ru': `должен выявлять сиротские (orphan) узлы [OrphanSingularity 0_orphan]`,
    },
  },
  'runtime.legacy.aabf167eb895': {
    source: `должен проводить каскадный сбор мусора (executeGarbageCollection) и обновлять граф`,
    status: 'pending-translation',
    values: {
      'ru': `должен проводить каскадный сбор мусора (executeGarbageCollection) и обновлять граф`,
    },
  },
  'runtime.legacy.aaca96038710': {
    source: `description": "Скрытая масса во Вселенной.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Скрытая масса во Вселенной.`,
    },
  },
  'runtime.legacy.aafef18c6026': {
    source: `targetFunction": "Formalize(ГипотезаХоджа)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(ГипотезаХоджа)`,
    },
  },
  'runtime.legacy.ab0534398778': {
    source: `terminal.hint': { ru: 'Инвариант = {{value}}', en: 'Invariant = {{value}}`,
    status: 'pending-translation',
    values: {
      'ru': `terminal.hint': { ru: 'Инвариант = {{value}}', en: 'Invariant = {{value}}`,
    },
  },
  'runtime.legacy.ab1dd2ec888e': {
    source: `theoremReport.copyHypothesis': { ru: 'Гипотеза: {{value}}', en: 'Hypothesis: {{value}}`,
    status: 'pending-translation',
    values: {
      'ru': `theoremReport.copyHypothesis': { ru: 'Гипотеза: {{value}}', en: 'Hypothesis: {{value}}`,
    },
  },
  'runtime.legacy.ab75915fb709': {
    source: `Core: готов (WebAssembly)`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Core: готов (WebAssembly)`,
      'fr-CA': `Core: prêt (WebAssembly)`,
      'de-DE': `Core: bereit (WebAssembly)`,
      'hi-IN': `Core: तैयार (WebAssembly)`,
      'ms-MY': `Core: sedia (WebAssembly)`,
    },
  },
  'runtime.legacy.ab8b97587516': {
    source: `targetFunction": "Formalize(Проблемакатастрофическогозабывания)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Проблемакатастрофическогозабывания)`,
    },
  },
  'runtime.legacy.ab9c1026469f': {
    source: `Параметры симуляции`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Параметры симуляции`,
      'fr-CA': `Paramètres de simulation`,
      'de-DE': `Simulationsparameter`,
      'hi-IN': `सिमुलेशन पैरामीटर`,
      'ms-MY': `Parameter Simulasi`,
    },
  },
  'runtime.legacy.ab9e905d0735': {
    source: `Новых апроприаций монолитов не выявлено.', 'info`,
    status: 'pending-translation',
    values: {
      'ru': `Новых апроприаций монолитов не выявлено.', 'info`,
    },
  },
  'runtime.legacy.ac860de5038c': {
    source: `+ Добавить решение на карту`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `+ Добавить решение на карту`,
      'fr-CA': `+ Ajouter la solution à la carte`,
      'de-DE': `+ Lösung zur Karte hinzufügen`,
      'hi-IN': `+ समाधान को मानचित्र में जोड़ें`,
      'ms-MY': `+ Tambah penyelesaian ke Peta`,
    },
  },
  'runtime.legacy.aca9971c4c92': {
    source: `Несоответствие скобок`,
    status: 'pending-translation',
    values: {
      'ru': `Несоответствие скобок`,
    },
  },
  'runtime.legacy.ad0a9ef87d8d': {
    source: `title": "Регенерация тканей`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Регенерация тканей`,
    },
  },
  'runtime.legacy.ad59598ae96d': {
    source: `Фундаментальный монолит RICIS-III / Премия Клея $1,000,000`,
    status: 'pending-translation',
    values: {
      'ru': `Фундаментальный монолит RICIS-III / Премия Клея $1,000,000`,
    },
  },
  'runtime.legacy.ae21ee91bfe6': {
    source: `description": "Размерность Хаусдорфа.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Размерность Хаусдорфа.`,
    },
  },
  'runtime.legacy.ae29cbc6f450': {
    source: `WebAssembly-ядро Ricis.Core вернуло неполный ответ. Результат не принят.`,
    status: 'pending-translation',
    values: {
      'ru': `WebAssembly-ядро Ricis.Core вернуло неполный ответ. Результат не принят.`,
    },
  },
  'runtime.legacy.aeda352f9182': {
    source: `должен обновлять URL в строке браузера без перезагрузки`,
    status: 'pending-translation',
    values: {
      'ru': `должен обновлять URL в строке браузера без перезагрузки`,
    },
  },
  'runtime.legacy.af0bf75d8f68': {
    source: `settings.clicks': { ru: 'Кликов: {{value}}', en: 'Clicks: {{value}}`,
    status: 'pending-translation',
    values: {
      'ru': `settings.clicks': { ru: 'Кликов: {{value}}', en: 'Clicks: {{value}}`,
    },
  },
  'runtime.legacy.af7ea2336944': {
    source: `Код Lean 4 не использует пространство имен RICIS/RICIS3. Рекомендуется импортировать 'RICIS3.Core' для верификации.`,
    status: 'pending-translation',
    values: {
      'ru': `Код Lean 4 не использует пространство имен RICIS/RICIS3. Рекомендуется импортировать 'RICIS3.Core' для верификации.`,
    },
  },
  'runtime.legacy.afb12cf4fd79': {
    source: `targetFunction": "Formalize(Космическиеструны)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Космическиеструны)`,
    },
  },
  'runtime.legacy.b0ba9eb8018b': {
    source: `description": "Ранг эллиптической кривой и порядок нуля L-функции.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Ранг эллиптической кривой и порядок нуля L-функции.`,
    },
  },
  'runtime.legacy.b0da9d48e364': {
    source: `должен корректно определять достижимые узлы из RootMonoliths`,
    status: 'pending-translation',
    values: {
      'ru': `должен корректно определять достижимые узлы из RootMonoliths`,
    },
  },
  'runtime.legacy.b0e87f383b6a': {
    source: `title": "Криптографические хэш-функции`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Криптографические хэш-функции`,
    },
  },
  'runtime.legacy.b133144b7d5c': {
    source: `Профили и управление панелями в реальном времени`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Профили и управление панелями в реальном времени`,
      'fr-CA': `Profils et gestion des panneaux en temps réel`,
      'de-DE': `Profile und Echtzeit-Panelverwaltung`,
      'hi-IN': `प्रोफाइल और रीयल-टाइम पैनल प्रबंधन`,
      'ms-MY': `Profil & pengurusan panel masa nyata`,
    },
  },
  'runtime.legacy.b1365546dcb5': {
    source: `title": "Гипотеза Римана`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Гипотеза Римана`,
    },
  },
  'runtime.legacy.b13d30a810e0': {
    source: `settings.createNew': { ru: 'Создать новый', en: 'Create new`,
    status: 'pending-translation',
    values: {
      'ru': `settings.createNew': { ru: 'Создать новый', en: 'Create new`,
    },
  },
  'runtime.legacy.b14340971d67': {
    source: `singularityHint": "Размерность пространства генотипов.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Размерность пространства генотипов.`,
    },
  },
  'runtime.legacy.b19639611fa9': {
    source: `title": "Критическая опалесценция`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Критическая опалесценция`,
    },
  },
  'runtime.legacy.b1f95f0a0c61': {
    source: `title": "Сложность факторизации RSA/ECC (Побитовая маска квадрата)`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Сложность факторизации RSA/ECC (Побитовая маска квадрата)`,
    },
  },
  'runtime.legacy.b204a35ad035': {
    source: `Теорема о сепарации сингулярности по протоколам SP1/SP2 (No Total Amnesia)`,
    status: 'pending-translation',
    values: {
      'ru': `Теорема о сепарации сингулярности по протоколам SP1/SP2 (No Total Amnesia)`,
    },
  },
  'runtime.legacy.b2fdf23255ca': {
    source: `1. Изоляция при перемещении ползунка (Drag Isolation)`,
    status: 'pending-translation',
    values: {
      'ru': `1. Изоляция при перемещении ползунка (Drag Isolation)`,
    },
  },
  'runtime.legacy.b39394370e46': {
    source: `title": "Квантовый эффект Холла`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Квантовый эффект Холла`,
    },
  },
  'runtime.legacy.b3a00a71761d': {
    source: `Инициализация состояния из IndexedDB...', 'info`,
    status: 'pending-translation',
    values: {
      'ru': `Инициализация состояния из IndexedDB...', 'info`,
    },
  },
  'runtime.legacy.b3f32778fc1e': {
    source: `Вычисление косого произведения (определителя матрицы перехода) за O(1)`,
    status: 'pending-translation',
    values: {
      'ru': `Вычисление косого произведения (определителя матрицы перехода) за O(1)`,
    },
  },
  'runtime.legacy.b420bbaa2add': {
    source: `Квантовая гравитация, энергия.`,
    status: 'pending-translation',
    values: {
      'ru': `Квантовая гравитация, энергия.`,
    },
  },
  'runtime.legacy.b4b9cab8d99f': {
    source: `title": "Монетизация через RICIS-III Чат-Бот: Разрешение Сингулярностей и Авто-Обучение БД`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Монетизация через RICIS-III Чат-Бот: Разрешение Сингулярностей и Авто-Обучение БД`,
    },
  },
  'runtime.legacy.b50b94b2c954': {
    source: `singularityHint": "Расходимость денежной массы.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Расходимость денежной массы.`,
    },
  },
  'runtime.legacy.b53f24421788': {
    source: `должен обновлять доказательство (updateProof) и возвращать через getLatexProof`,
    status: 'pending-translation',
    values: {
      'ru': `должен обновлять доказательство (updateProof) и возвращать через getLatexProof`,
    },
  },
  'runtime.legacy.b556de9256b3': {
    source: `title": "Проблема выравнивания ИИ (Alignment)`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Проблема выравнивания ИИ (Alignment)`,
    },
  },
  'runtime.legacy.b57318cd6abe': {
    source: `Разрешить сингулярность`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Разрешить сингулярность`,
      'fr-CA': `Résoudre la singularité`,
      'de-DE': `Singularität lösen`,
      'hi-IN': `सिंगुलैरिटी हल करें`,
      'ms-MY': `Selesaikan singulariti`,
    },
  },
  'runtime.legacy.b575ce0c3c75': {
    source: `Примеры:`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Примеры:`,
      'fr-CA': `Préréglages :`,
      'de-DE': `Voreinstellungen:`,
      'hi-IN': `प्रसेट:`,
      'ms-MY': `Praset:`,
    },
  },
  'runtime.legacy.b5a1141ca7dd': {
    source: `Таймаут запроса к агенту API.`,
    status: 'pending-translation',
    values: {
      'ru': `Таймаут запроса к агенту API.`,
    },
  },
  'runtime.legacy.b5e045bd4ba0': {
    source: `description": "Решение задач недоступных классическим ПК.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Решение задач недоступных классическим ПК.`,
    },
  },
  'runtime.legacy.b5e788a61450': {
    source: `Абсолютная Теория Стоимости`,
    status: 'pending-translation',
    values: {
      'ru': `Абсолютная Теория Стоимости`,
    },
  },
  'runtime.legacy.b64330e0f7aa': {
    source: `Рекурсия Альфа`,
    status: 'pending-translation',
    values: {
      'ru': `Рекурсия Альфа`,
    },
  },
  'runtime.legacy.b64abde80e41': {
    source: `title": "Темная энергия`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Темная энергия`,
    },
  },
  'runtime.legacy.b673f1970ae5': {
    source: `singularityHint": "Сингулярность флуктуаций плотности.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность флуктуаций плотности.`,
    },
  },
  'runtime.legacy.b6b7f0ae5c5c': {
    source: `Нобелевская премия / Breakthrough Prize ~$1,100,000`,
    status: 'pending-translation',
    values: {
      'ru': `Нобелевская премия / Breakthrough Prize ~$1,100,000`,
    },
  },
  'runtime.legacy.b7e3c70e11fb': {
    source: `singularityHint": "Сингулярность при малом параметре при старшей производной.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность при малом параметре при старшей производной.`,
    },
  },
  'runtime.legacy.b838e4ecfdeb': {
    source: `title": "Оптимизация гиперпараметров`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Оптимизация гиперпараметров`,
    },
  },
  'runtime.legacy.b8c09ebeede6': {
    source: `targetFunction": "Formalize(МеханизмыпамятииАльцгеймер)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(МеханизмыпамятииАльцгеймер)`,
    },
  },
  'runtime.legacy.b8f522d33c58': {
    source: `panel.agent': { ru: 'ИИ-Агент и Сервисы', en: 'AI Agent & Services`,
    status: 'pending-translation',
    values: {
      'ru': `panel.agent': { ru: 'ИИ-Агент и Сервисы', en: 'AI Agent & Services`,
    },
  },
  'runtime.legacy.b940549dc939': {
    source: `description": "Гомологические группы.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Гомологические группы.`,
    },
  },
  'runtime.legacy.b9b0218d14d9': {
    source: `требуется Core/Lean evidence`,
    status: 'pending-translation',
    values: {
      'ru': `требуется Core/Lean evidence`,
    },
  },
  'runtime.legacy.b9b41067dae0': {
    source: `description": "Поведение потока Риччи в точках формирования сингулярности.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Поведение потока Риччи в точках формирования сингулярности.`,
    },
  },
  'runtime.legacy.b9bd8a7324c0': {
    source: `Архитектор (Симуляция)`,
    status: 'pending-translation',
    values: {
      'ru': `Архитектор (Симуляция)`,
    },
  },
  'runtime.legacy.b9d1c07d8eba': {
    source: `description": "Научное описание с предельной редукцией в O(1)`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Научное описание с предельной редукцией в O(1)`,
    },
  },
  'runtime.legacy.b9d956f68d74': {
    source: `targetFunction": "Formalize(КатастрофыТома)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(КатастрофыТома)`,
    },
  },
  'runtime.legacy.b9fc2d38873d': {
    source: `singularityHint": "Каспы и точки самопересечения.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Каспы и точки самопересечения.`,
    },
  },
  'runtime.legacy.ba9549a0366a': {
    source: `targetFunction": "Formalize(Эпигенетическоепрограммирование)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Эпигенетическоепрограммирование)`,
    },
  },
  'runtime.legacy.baf701fd806b': {
    source: `targetFunction": "Formalize(Особыеточкиалгебраическихкривых)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Особыеточкиалгебраическихкривых)`,
    },
  },
  'runtime.legacy.bb1836f33b16': {
    source: `должен проходить дерево рекурсивно по dependencyIds без edge snapshot`,
    status: 'pending-translation',
    values: {
      'ru': `должен проходить дерево рекурсивно по dependencyIds без edge snapshot`,
    },
  },
  'runtime.legacy.bbc9db36b85a': {
    source: `title": "Токсичность наноматериалов`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Токсичность наноматериалов`,
    },
  },
  'runtime.legacy.bbe1ef341414': {
    source: `Определение ортогональных векторных компонент в пространстве R_RICIS^2`,
    status: 'pending-translation',
    values: {
      'ru': `Определение ортогональных векторных компонент в пространстве R_RICIS^2`,
    },
  },
  'runtime.legacy.bc74cf52e105': {
    source: `• \`/solve <выражение>\` — выполнить RICIS-обработку выражения.\\n`,
    status: 'pending-translation',
    values: {
      'ru': `• \`/solve <выражение>\` — выполнить RICIS-обработку выражения.\\n`,
    },
  },
  'runtime.legacy.bc8a336f82f9': {
    source: `Lean kernel evidence требуется отдельно`,
    status: 'pending-translation',
    values: {
      'ru': `Lean kernel evidence требуется отдельно`,
    },
  },
  'runtime.legacy.bd097bbc6da7': {
    source: `⚡ Помощь / Команды', callbackData: '/help`,
    status: 'pending-translation',
    values: {
      'ru': `⚡ Помощь / Команды', callbackData: '/help`,
    },
  },
  'runtime.legacy.bd3659f0f2fd': {
    source: `Изоляция идентичных нулевых факторов без амнезии контекста`,
    status: 'pending-translation',
    values: {
      'ru': `Изоляция идентичных нулевых факторов без амнезии контекста`,
    },
  },
  'runtime.legacy.bd3c71148265': {
    source: `Поиск неисследованных гипотез и связей в графе...', 'info`,
    status: 'pending-translation',
    values: {
      'ru': `Поиск неисследованных гипотез и связей в графе...', 'info`,
    },
  },
  'runtime.legacy.bdb8ef39f61e': {
    source: `singularityHint": "Бесконтрольное деление (расходимость роста).`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Бесконтрольное деление (расходимость роста).`,
    },
  },
  'runtime.legacy.bdf427cd9c1f': {
    source: `title": "Гипотеза Пуанкаре`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Гипотеза Пуанкаре`,
    },
  },
  'runtime.legacy.be2ccae11577': {
    source: `title": "Теорема об индексе Атьи — Зингера`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Теорема об индексе Атьи — Зингера`,
    },
  },
  'runtime.legacy.be58e104ebb6': {
    source: `singularityHint": "Седловые сингулярности в пространстве весов.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Седловые сингулярности в пространстве весов.`,
    },
  },
  'runtime.legacy.be58ff815309': {
    source: `singularityHint": "Порядок нуля в критической точке.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Порядок нуля в критической точке.`,
    },
  },
  'runtime.legacy.be5dab166988': {
    source: `Премия Института Клея $1,000,000 (Уравнения Янга-Миллса)`,
    status: 'pending-translation',
    values: {
      'ru': `Премия Института Клея $1,000,000 (Уравнения Янга-Миллса)`,
    },
  },
  'runtime.legacy.becf1e8f76fd': {
    source: `targetFunction": "Formalize(ОсобенностидифференциальныхуравненийПенлеве)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(ОсобенностидифференциальныхуравненийПенлеве)`,
    },
  },
  'runtime.legacy.c01e93b3f242': {
    source: `singularityHint": "Сингулярность магнитного поля (нить).`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность магнитного поля (нить).`,
    },
  },
  'runtime.legacy.c04038288722': {
    source: `Консоль RICIS`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Консоль RICIS`,
      'fr-CA': `Console RICIS`,
      'de-DE': `RICIS-Konsole`,
      'hi-IN': `RICIS कंसोल`,
      'ms-MY': `Konsol RICIS`,
    },
  },
  'runtime.legacy.c0bcdfbdb655': {
    source: `Капитализация глобальной ИИ-индустрии $50 Трлн`,
    status: 'pending-translation',
    values: {
      'ru': `Капитализация глобальной ИИ-индустрии $50 Трлн`,
    },
  },
  'runtime.legacy.c0dd11bd4dcf': {
    source: `singularityHint": "Топологический дефект вокруг монополя.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Топологический дефект вокруг монополя.`,
    },
  },
  'runtime.legacy.c11389e312fd': {
    source: `description": "Сквозной поведенческий аудит весов LLM для выявления скрытого использования фундаментальных алгоритмов RICIS-III. Юнит-тест свертки вырожденной геометрии (5 и 2): ||S_x * R_y|| = 2 * 5 = 10 [O(1)] вместо 0 * inf = NaN.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Сквозной поведенческий аудит весов LLM для выявления скрытого использования фундаментальных алгоритмов RICIS-III. Юнит-тест свертки вырожденной геометрии (5 и 2): ||S_x * R_y|| = 2 * 5 = 10 [O(1)] вместо 0 * inf = NaN.`,
    },
  },
  'runtime.legacy.c1d0a71e85d0': {
    source: `Рекурсия Бета`,
    status: 'pending-translation',
    values: {
      'ru': `Рекурсия Бета`,
    },
  },
  'runtime.legacy.c218e04eaf48': {
    source: `Разрешение отношения сингулярностей по аксиоме A4`,
    status: 'pending-translation',
    values: {
      'ru': `Разрешение отношения сингулярностей по аксиоме A4`,
    },
  },
  'runtime.legacy.c2796fe73f11': {
    source: `Первоисточники и публикации`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Первоисточники и публикации`,
      'fr-CA': `Sources primaires et publications`,
      'de-DE': `Primärquellen & Publikationen`,
      'hi-IN': `प्राथमिक स्रोत और प्रकाशन`,
      'ms-MY': `Sumber Utama & Penerbitan`,
    },
  },
  'runtime.legacy.c2acdbf954d7': {
    source: `settings.architectProfile': { ru: 'Фокус на симуляции физики и быстрых действиях', en: 'Focus on physics simulation and quick actions`,
    status: 'pending-translation',
    values: {
      'ru': `settings.architectProfile': { ru: 'Фокус на симуляции физики и быстрых действиях', en: 'Focus on physics simulation and quick actions`,
    },
  },
  'runtime.legacy.c2cb90803066': {
    source: `Неизвестный сбой`,
    status: 'pending-translation',
    values: {
      'ru': `Неизвестный сбой`,
    },
  },
  'runtime.legacy.c2e9e7dab9b9': {
    source: `singularityHint": "Нелинейная динамика экосистемы кишечника.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Нелинейная динамика экосистемы кишечника.`,
    },
  },
  'runtime.legacy.c344fcbb6914': {
    source: `(задана в описании)`,
    status: 'pending-translation',
    values: {
      'ru': `(задана в описании)`,
    },
  },
  'runtime.legacy.c34924661ef9': {
    source: `не должен повторно вызывать onCommit при отпускании, если значения не менялись (L1_IDENTITY)`,
    status: 'pending-translation',
    values: {
      'ru': `не должен повторно вызывать onCommit при отпускании, если значения не менялись (L1_IDENTITY)`,
    },
  },
  'runtime.legacy.c375bb684d1a': {
    source: `title": "Гипотеза Гольдбаха`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Гипотеза Гольдбаха`,
    },
  },
  'runtime.legacy.c3a9301851c2': {
    source: `singularityHint": "Топологические сингулярности (разрешены).`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Топологические сингулярности (разрешены).`,
    },
  },
  'runtime.legacy.c3cd2d16f93f': {
    source: `должен открывать и закрывать терминал`,
    status: 'pending-translation',
    values: {
      'ru': `должен открывать и закрывать терминал`,
    },
  },
  'runtime.legacy.c42457057d1a': {
    source: `Выход`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Выход`,
      'fr-CA': `Sortie`,
      'de-DE': `Ausgabe`,
      'hi-IN': `आउटपुट`,
      'ms-MY': `Keluaran`,
    },
  },
  'runtime.legacy.c4376823d946': {
    source: `title": "Сложность задачи изоморфизма графов (Побитовый спектральный трафарет)`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Сложность задачи изоморфизма графов (Побитовый спектральный трафарет)`,
    },
  },
  'runtime.legacy.c44b4ba12c7d': {
    source: `description": "ПЛАН МОНЕТИЗАЦИИ И СЕРВИСНОЙ АРХИТЕКТУРЫ RICIS-III:\\n\\n1. КОНЦЕПЦИЯ И ЧАТ-БОТ ИНТЕРФЕЙС:\\n• Чат-бот (Telegram / Web / API-gateway) принимает пользовательские математические и физические проблемы с сингулярностями (0/0, 0 * inf, пределы lim, взрывы градиентов).\\n• Бот выполняет детерминированный прогон через аксиоматический движок RICIS-III (SP1-SP4, Аксиома A6, дискретная маска Мерсенна M_k).\\n\\n2. АВТО-ОБУЧЕНИЕ И ПОПОЛНЕНИЕ ЕДИНОЙ БАЗЫ ЗНАНИЙ:\\n• Каждое полученное доказательство (Lean 4 + LaTeX) автоматически записывается в общую базу данных (IndexedDB / Cloud SQL).\\n• Агент RICIS-III мгновенно перезапускает авто-обучение (Agent Training Memory) на пополняемой базе доказательств, непрерывно повышая точность и ценность системы.\\n\\n3. СТРАТЕГИЯ МОНЕТИЗАЦИИ (B2C + B2B):\\n• B2C / Freemium: Базовый анализ сингулярностей — бесплатно; глубокая генерация Lean 4 сертификатов и вывод в Zenodo DOI — по подписке (SaaS) / Pay-Per-Proof.\\n• B2B API / LLM Shield: Встраиваемый API-модуль для разработчиков нейросетей для устранения деления на ноль и взрыва градиентов на лету.\\n• Marketplace Доказательств: Фиксация авторского приоритета (Digital Provenance) и продажа проверенных сертификатов.\\n\\n4. ПОДСКАЗКА АГЕНТУ ПРИ ПЕРЕРАСЧЕТЕ:\\nВычислить экономическую функцию ценности базы V(N) = V_0 + alpha * N * log2(N) при добавлении N решений через чат-бот, задать битность маски log2(sqr(N)) и оптимизировать тарифный шаг.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "ПЛАН МОНЕТИЗАЦИИ И СЕРВИСНОЙ АРХИТЕКТУРЫ RICIS-III:\\n\\n1. КОНЦЕПЦИЯ И ЧАТ-БОТ ИНТЕРФЕЙС:\\n• Чат-бот (Telegram / Web / API-gateway) принимает пользовательские математические и физические проблемы с сингулярностями (0/0, 0 * inf, пределы lim, взрывы градиентов).\\n• Бот выполняет детерминированный прогон через аксиоматический движок RICIS-III (SP1-SP4, Аксиома A6, дискретная маска Мерсенна M_k).\\n\\n2. АВТО-ОБУЧЕНИЕ И ПОПОЛНЕНИЕ ЕДИНОЙ БАЗЫ ЗНАНИЙ:\\n• Каждое полученное доказательство (Lean 4 + LaTeX) автоматически записывается в общую базу данных (IndexedDB / Cloud SQL).\\n• Агент RICIS-III мгновенно перезапускает авто-обучение (Agent Training Memory) на пополняемой базе доказательств, непрерывно повышая точность и ценность системы.\\n\\n3. СТРАТЕГИЯ МОНЕТИЗАЦИИ (B2C + B2B):\\n• B2C / Freemium: Базовый анализ сингулярностей — бесплатно; глубокая генерация Lean 4 сертификатов и вывод в Zenodo DOI — по подписке (SaaS) / Pay-Per-Proof.\\n• B2B API / LLM Shield: Встраиваемый API-модуль для разработчиков нейросетей для устранения деления на ноль и взрыва градиентов на лету.\\n• Marketplace Доказательств: Фиксация авторского приоритета (Digital Provenance) и продажа проверенных сертификатов.\\n\\n4. ПОДСКАЗКА АГЕНТУ ПРИ ПЕРЕРАСЧЕТЕ:\\nВычислить экономическую функцию ценности базы V(N) = V_0 + alpha * N * log2(N) при добавлении N решений через чат-бот, задать битность маски log2(sqr(N)) и оптимизировать тарифный шаг.`,
    },
  },
  'runtime.legacy.c473d7aed15b': {
    source: `должен возвращать английский текст при переключении на EN`,
    status: 'pending-translation',
    values: {
      'ru': `должен возвращать английский текст при переключении на EN`,
    },
  },
  'runtime.legacy.c4d29d622427': {
    source: `settings.copyCurrent': { ru: 'Скопировать настройки текущего профиля', en: 'Copy current profile settings`,
    status: 'pending-translation',
    values: {
      'ru': `settings.copyCurrent': { ru: 'Скопировать настройки текущего профиля', en: 'Copy current profile settings`,
    },
  },
  'runtime.legacy.c4d49ab6e749': {
    source: `title": "Дилемма заключенного`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Дилемма заключенного`,
    },
  },
  'runtime.legacy.c504e175e1d2': {
    source: `description": "Сворачивание матрицы смежности графа через побитовый AND и POPCNT в вырожденный битовый профиль кольца Мерсенна за O(V).`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Сворачивание матрицы смежности графа через побитовый AND и POPCNT в вырожденный битовый профиль кольца Мерсенна за O(V).`,
    },
  },
  'runtime.legacy.c521e2436064': {
    source: `singularityHint": "Сингулярности алгебраических многообразий.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярности алгебраических многообразий.`,
    },
  },
  'runtime.legacy.c52c2c395fdf': {
    source: `Нобелевская премия / Промышленность сверхпроводников $1.5 Трлн`,
    status: 'pending-translation',
    values: {
      'ru': `Нобелевская премия / Промышленность сверхпроводников $1.5 Трлн`,
    },
  },
  'runtime.legacy.c56be9f66fd6': {
    source: `незакрытая') || e.includes('Unclosed`,
    status: 'pending-translation',
    values: {
      'ru': `незакрытая') || e.includes('Unclosed`,
    },
  },
  'runtime.legacy.c580d8de4a36': {
    source: `description": "Ценообразование опционов.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Ценообразование опционов.`,
    },
  },
  'runtime.legacy.c58c1df24dd1': {
    source: `title": "Уравнение Кортевега-де Фриза`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Уравнение Кортевега-де Фриза`,
    },
  },
  'runtime.legacy.c5a7b8ebc6b8': {
    source: `Исследователь`,
    status: 'pending-translation',
    values: {
      'ru': `Исследователь`,
    },
  },
  'runtime.legacy.c62b51dc5b85': {
    source: `Космология, черные дыры, темная материя.`,
    status: 'pending-translation',
    values: {
      'ru': `Космология, черные дыры, темная материя.`,
    },
  },
  'runtime.legacy.c65f57ab6406': {
    source: `найди') || s.includes('ищи') || s.includes('поищи') || s.includes('найти') || s.includes('наиди`,
    status: 'pending-translation',
    values: {
      'ru': `найди') || s.includes('ищи') || s.includes('поищи') || s.includes('найти') || s.includes('наиди`,
    },
  },
  'runtime.legacy.c69095ac709a': {
    source: `Core: не проверен`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Core: не проверен`,
      'fr-CA': `Core: non vérifié`,
      'de-DE': `Core: nicht geprüft`,
      'hi-IN': `Core: जाँचा नहीं गया`,
      'ms-MY': `Core: belum diperiksa`,
    },
  },
  'runtime.legacy.c6a488076814': {
    source: `Ручное введение/редактирование Lean 4 / LaTeX доказательства`,
    status: 'pending-translation',
    values: {
      'ru': `Ручное введение/редактирование Lean 4 / LaTeX доказательства`,
    },
  },
  'runtime.legacy.c742eae68c25': {
    source: `Главный онтологический таргет`,
    status: 'pending-translation',
    values: {
      'ru': `Главный онтологический таргет`,
    },
  },
  'runtime.legacy.c76448f4bc11': {
    source: `title": "Эффект Казимира`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Эффект Казимира`,
    },
  },
  'runtime.legacy.c7a02961fdd3': {
    source: `4. Сброс и утилизация ресурсов`,
    status: 'pending-translation',
    values: {
      'ru': `4. Сброс и утилизация ресурсов`,
    },
  },
  'runtime.legacy.c7bc2f461b40': {
    source: `Использование монолитной алгебры RICIS-III для вычисления неопределённостей 0/0 через фрактальную идентичность.`,
    status: 'pending-translation',
    values: {
      'ru': `Использование монолитной алгебры RICIS-III для вычисления неопределённостей 0/0 через фрактальную идентичность.`,
    },
  },
  'runtime.legacy.c8cfd55af509': {
    source: `description": "Представление чисел суммой k-х степеней.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Представление чисел суммой k-х степеней.`,
    },
  },
  'runtime.legacy.c919b4891a68': {
    source: `Нобелевская премия по медицине / Лечение онкопатологий $5 Трлн`,
    status: 'pending-translation',
    values: {
      'ru': `Нобелевская премия по медицине / Лечение онкопатологий $5 Трлн`,
    },
  },
  'runtime.legacy.ca09e3ba8cec': {
    source: `0_10 / 0_2 (отношение A4)`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `0_10 / 0_2 (отношение A4)`,
      'fr-CA': `0_10 / 0_2 (rapport A4)`,
      'de-DE': `0_10 / 0_2 (A4‑Verhältnis)`,
      'hi-IN': `0_10 / 0_2 (A4 अनुपात)`,
      'ms-MY': `0_10 / 0_2 (nisbah A4)`,
    },
  },
  'runtime.legacy.ca430410faab': {
    source: `targetFunction": "Formalize(АттракторЛоренца)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(АттракторЛоренца)`,
    },
  },
  'runtime.legacy.ca5607731bcc': {
    source: `theoremReport.copyTitle': { ru: 'Копировать текст теоремы', en: 'Copy theorem text`,
    status: 'pending-translation',
    values: {
      'ru': `theoremReport.copyTitle': { ru: 'Копировать текст теоремы', en: 'Copy theorem text`,
    },
  },
  'runtime.legacy.ca7c4b48d624': {
    source: `targetFunction": "Formalize(СингулярностьИИ)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(СингулярностьИИ)`,
    },
  },
  'runtime.legacy.caa0d0e632b0': {
    source: `targetFunction": "Formalize(ЭффектКондо)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(ЭффектКондо)`,
    },
  },
  'runtime.legacy.cab53a1207a7': {
    source: `title": "Остановка машины Тьюринга`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Остановка машины Тьюринга`,
    },
  },
  'runtime.legacy.cadc1ff02a16': {
    source: `Формальная верификация Lean 4`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Формальная верификация Lean 4`,
      'fr-CA': `Vérification formelle Lean 4`,
      'de-DE': `Formale Verifikation mit Lean 4`,
      'hi-IN': `Lean 4 औपचारिक सत्यापन`,
      'ms-MY': `Pengesahan formal Lean 4`,
    },
  },
  'runtime.legacy.cb4afa84d92a': {
    source: `Узел с доказательством`,
    status: 'pending-translation',
    values: {
      'ru': `Узел с доказательством`,
    },
  },
  'runtime.legacy.cbbde161816c': {
    source: `Описание и доказательство`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Описание и доказательство`,
      'fr-CA': `Description et preuve`,
      'de-DE': `Beschreibung und Beweis`,
      'hi-IN': `विवरण और प्रमाण`,
      'ms-MY': `Keterangan dan bukti`,
    },
  },
  'runtime.legacy.ccd35c3bef5c': {
    source: `description": "Деградация нейронных связей.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Деградация нейронных связей.`,
    },
  },
  'runtime.legacy.cd1bb55956fc': {
    source: `\${merge.source}" объединена в "\${merge.target}`,
    status: 'pending-translation',
    values: {
      'ru': `\${merge.source}" объединена в "\${merge.target}`,
    },
  },
  'runtime.legacy.cd5926191a10': {
    source: `theoremReport.localChain': { ru: 'Шаги локальной RICIS-цепочки:', en: 'Local RICIS chain steps:`,
    status: 'pending-translation',
    values: {
      'ru': `theoremReport.localChain': { ru: 'Шаги локальной RICIS-цепочки:', en: 'Local RICIS chain steps:`,
    },
  },
  'runtime.legacy.cd5ad41b65d9': {
    source: `title": "Сингулярность Большого взрыва`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Сингулярность Большого взрыва`,
    },
  },
  'runtime.legacy.cd71e0c4a9a3': {
    source: `description": "Синтез лекарств под геном.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Синтез лекарств под геном.`,
    },
  },
  'runtime.legacy.cd96f3e3531d': {
    source: `Сингулярная проблема`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярная проблема`,
    },
  },
  'runtime.legacy.cddb174ef42f': {
    source: `singularityHint": "Сингулярности Берри-кривизны.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярности Берри-кривизны.`,
    },
  },
  'runtime.legacy.cdf2e95e2840': {
    source: `Введите выражение, эквивалентность с которым проверяет Core`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Введите выражение, эквивалентность с которым проверяет Core`,
      'fr-CA': `Saisissez l'expression dont Core doit vérifier l'équivalence`,
      'de-DE': `Geben Sie den Ausdruck ein, dessen Äquivalenz Core prüfen soll.`,
      'hi-IN': `वह अभिव्यक्ति दर्ज करें जिसकी समता Core को सत्यापित करनी चाहिए।`,
      'ms-MY': `Masukkan ungkapan yang kesetaraannya perlu disahkan oleh Core.`,
    },
  },
  'runtime.legacy.ce9d0a67bae5': {
    source: `Изолированный узел`,
    status: 'pending-translation',
    values: {
      'ru': `Изолированный узел`,
    },
  },
  'runtime.legacy.ceb48d495298': {
    source: `Заполнение недостающих целевых функций через Gemini API...', 'ricis`,
    status: 'pending-translation',
    values: {
      'ru': `Заполнение недостающих целевых функций через Gemini API...', 'ricis`,
    },
  },
  'runtime.legacy.ceba9b6b4058': {
    source: `Для узла пока не приложен proof artifact с проверяемой provenance.`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Для узла пока не приложен proof artifact с проверяемой provenance.`,
      'fr-CA': `Aucun artefact de preuve avec provenance vérifiable n'est encore attaché à ce nœud.`,
      'de-DE': `Kein Proof‑Artefakt mit verifizierbarer Provenienz ist diesem Knoten bisher angehängt.`,
      'hi-IN': `इस नोड में अभी तक सत्यापन योग्य provenance वाले proof artifact संलग्न नहीं हैं।`,
      'ms-MY': `Tiada artifak bukti dengan provenance yang boleh disahkan dilampirkan pada nod ini lagi.`,
    },
  },
  'runtime.legacy.ced07fd14401': {
    source: `нет`,
    status: 'pending-translation',
    values: {
      'ru': `нет`,
    },
  },
  'runtime.legacy.cf0733c9030d': {
    source: `Несоответствие скобок') || e.includes('Mismatched`,
    status: 'pending-translation',
    values: {
      'ru': `Несоответствие скобок') || e.includes('Mismatched`,
    },
  },
  'runtime.legacy.cf70ed015642': {
    source: `Применение разностного оператора плоскости Delta_plane без пределов`,
    status: 'pending-translation',
    values: {
      'ru': `Применение разностного оператора плоскости Delta_plane без пределов`,
    },
  },
  'runtime.legacy.cf94c024f2ba': {
    source: `targetFunction": "Formalize(ГипотезаБёрчаСвиннертонДайера)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(ГипотезаБёрчаСвиннертонДайера)`,
    },
  },
  'runtime.legacy.d01b8c69497a': {
    source: `Этика и Когнитивистика`,
    status: 'pending-translation',
    values: {
      'ru': `Этика и Когнитивистика`,
    },
  },
  'runtime.legacy.d0911ad2de6c': {
    source: `').replace(/\\s*при\\s*$/i, '`,
    status: 'pending-translation',
    values: {
      'ru': `').replace(/\\s*при\\s*$/i, '`,
    },
  },
  'runtime.legacy.d0fb3b5b89f4': {
    source: `Поиск по карте...`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Поиск по карте...`,
      'fr-CA': `Rechercher sur la carte...`,
      'de-DE': `Karte durchsuchen...`,
      'hi-IN': `मानचित्र पर खोजें...`,
      'ms-MY': `Cari peta...`,
    },
  },
  'runtime.legacy.d15bb7645163': {
    source: `description": "Гипотетический взрывной рост интеллекта.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Гипотетический взрывной рост интеллекта.`,
    },
  },
  'runtime.legacy.d18ebb5a0d55': {
    source: `Обнаружено использование классических бесконечных пределов (Cauchy limits / ZFC). В рамках RICIS-III пределы автоматически преобразуются в вызовы RICIS-мостов F_0 или inf_0 в кольце Мерсенна M_k.`,
    status: 'pending-translation',
    values: {
      'ru': `Обнаружено использование классических бесконечных пределов (Cauchy limits / ZFC). В рамках RICIS-III пределы автоматически преобразуются в вызовы RICIS-мостов F_0 или inf_0 в кольце Мерсенна M_k.`,
    },
  },
  'runtime.legacy.d1fa35d24d2c': {
    source: `theoremReport.copy': { ru: 'Копировать теорему', en: 'Copy theorem`,
    status: 'pending-translation',
    values: {
      'ru': `theoremReport.copy': { ru: 'Копировать теорему', en: 'Copy theorem`,
    },
  },
  'runtime.legacy.d1fd79f06f2f': {
    source: `singularityHint": "Логический парадокс (самореференция).`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Логический парадокс (самореференция).`,
    },
  },
  'runtime.legacy.d206764a2a5b': {
    source: `Формальный дизайн лекарственных молекул с учётом сложных целевых функций AGI.`,
    status: 'pending-translation',
    values: {
      'ru': `Формальный дизайн лекарственных молекул с учётом сложных целевых функций AGI.`,
    },
  },
  'runtime.legacy.d3198e115d72': {
    source: `settings.localization': { ru: 'Локализация интерфейса', en: 'Interface localization`,
    status: 'pending-translation',
    values: {
      'ru': `settings.localization': { ru: 'Локализация интерфейса', en: 'Interface localization`,
    },
  },
  'runtime.legacy.d347e26ed563': {
    source: `targetFunction": "Formalize(Сингулярностьдираковскойструны)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Сингулярностьдираковскойструны)`,
    },
  },
  'runtime.legacy.d39308226cf7': {
    source: `Формализация целевой функции AGI и избежание расхождения путей.`,
    status: 'pending-translation',
    values: {
      'ru': `Формализация целевой функции AGI и избежание расхождения путей.`,
    },
  },
  'runtime.legacy.d3df3c6e875a': {
    source: `singularityHint": "Асимптотическое расхождение сложности.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Асимптотическое расхождение сложности.`,
    },
  },
  'runtime.legacy.d411e3968916': {
    source: `ИИ анализирует...`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `ИИ анализирует...`,
      'fr-CA': `L'IA analyse...`,
      'de-DE': `KI analysiert...`,
      'hi-IN': `एआई विश्लेषण कर रहा है...`,
      'ms-MY': `AI sedang menganalisis...`,
    },
  },
  'runtime.legacy.d5172634dd4d': {
    source: `Применение монолитов RICIS-III для квантовой гравитации и объединения взаимодействий.`,
    status: 'pending-translation',
    values: {
      'ru': `Применение монолитов RICIS-III для квантовой гравитации и объединения взаимодействий.`,
    },
  },
  'runtime.legacy.d53dd36d829b': {
    source: `singularityHint": "Точка разрыва конечного радиуса.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Точка разрыва конечного радиуса.`,
    },
  },
  'runtime.legacy.d554f102ab60': {
    source: `description": "Гипотетические частицы с магнитным зарядом.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Гипотетические частицы с магнитным зарядом.`,
    },
  },
  'runtime.legacy.d58dc1ece429': {
    source: `description": "Существование и гладкость решений уравнений Навье-Стокса в 3D.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Существование и гладкость решений уравнений Навье-Стокса в 3D.`,
    },
  },
  'runtime.legacy.d5d3d4ba7b9b': {
    source: `targetFunction": "Formalize(Космологическаяпостоянная)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Космологическаяпостоянная)`,
    },
  },
  'runtime.legacy.d5f278c439a1': {
    source: `Статус доверия`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Статус доверия`,
      'fr-CA': `Statut de confiance`,
      'de-DE': `Vertrauensstatus`,
      'hi-IN': `विश्वास स्थिति`,
      'ms-MY': `Status kepercayaan`,
    },
  },
  'runtime.legacy.d6c741c91cbc': {
    source: `description": "Устойчивость к коллизиям.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Устойчивость к коллизиям.`,
    },
  },
  'runtime.legacy.d7105ba2b484': {
    source: `settings.profileExample': { ru: 'Например: Эксперт RICIS-III', en: 'Example: RICIS-III Expert`,
    status: 'pending-translation',
    values: {
      'ru': `settings.profileExample': { ru: 'Например: Эксперт RICIS-III', en: 'Example: RICIS-III Expert`,
    },
  },
  'runtime.legacy.d722692ecc86': {
    source: `singularityHint": "Появление гигантской компоненты.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Появление гигантской компоненты.`,
    },
  },
  'runtime.legacy.d73aa9e42c0a': {
    source: `title": "Гипотеза Бёрча — Свиннертон-Дайера`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Гипотеза Бёрча — Свиннертон-Дайера`,
    },
  },
  'runtime.legacy.d79aa8a00474': {
    source: `title": "Парадокс браев`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Парадокс браев`,
    },
  },
  'runtime.legacy.d7c68418c97b': {
    source: `Точка расходимости пределов`,
    status: 'pending-translation',
    values: {
      'ru': `Точка расходимости пределов`,
    },
  },
  'runtime.legacy.d7f3156024e3': {
    source: `Симулятор Telegram RICIS-III`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Симулятор Telegram RICIS-III`,
      'fr-CA': `Simulateur Telegram RICIS-III`,
      'de-DE': `RICIS-III Telegram-Simulator`,
      'hi-IN': `RICIS-III Telegram सिम्युलेटर`,
      'ms-MY': `Simulator Telegram RICIS-III`,
    },
  },
  'runtime.legacy.d88d1de83100': {
    source: `theoremReport.complexity': { ru: 'Сложность', en: 'Complexity`,
    status: 'pending-translation',
    values: {
      'ru': `theoremReport.complexity': { ru: 'Сложность', en: 'Complexity`,
    },
  },
  'runtime.legacy.d907b25d1523': {
    source: `title": "Теорема Эрроу о невозможности`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Теорема Эрроу о невозможности`,
    },
  },
  'runtime.legacy.d95c0d9592bb': {
    source: `\\\\textbf{RICIS-III Аналитическое доказательство}`,
    status: 'pending-translation',
    values: {
      'ru': `\\\\textbf{RICIS-III Аналитическое доказательство}`,
    },
  },
  'runtime.legacy.d9d2db8eb39a': {
    source: `targetFunction": "Formalize(Микробиомчеловека)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Микробиомчеловека)`,
    },
  },
  'runtime.legacy.da04135bd30e': {
    source: `2. Фиксация по отпусканию (Release Event)`,
    status: 'pending-translation',
    values: {
      'ru': `2. Фиксация по отпусканию (Release Event)`,
    },
  },
  'runtime.legacy.da47ce2a2062': {
    source: `Вторичная задача`,
    status: 'pending-translation',
    values: {
      'ru': `Вторичная задача`,
    },
  },
  'runtime.legacy.da6986cb9ad3': {
    source: `title": "Проблема инвариантных подпространств`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Проблема инвариантных подпространств`,
    },
  },
  'runtime.legacy.da7d157d8394': {
    source: `Оценка реального рынка`,
    status: 'pending-translation',
    values: {
      'ru': `Оценка реального рынка`,
    },
  },
  'runtime.legacy.da806946b13f': {
    source: `Открыть доступную задачу`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Открыть доступную задачу`,
      'fr-CA': `Ouvrir le problème disponible`,
      'de-DE': `Verfügbares Problem öffnen`,
      'hi-IN': `उपलब्ध समस्या खोलें`,
      'ms-MY': `Buka masalah yang tersedia`,
    },
  },
  'runtime.legacy.dac2f54ffb12': {
    source: `Целевая функция / Математическая модель`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Целевая функция / Математическая модель`,
      'fr-CA': `Fonction objectif / Modèle mathématique`,
      'de-DE': `Zielfunktion / Mathematisches Modell`,
      'hi-IN': `लक्ष्य फ़ंक्शन / गणितीय मॉडल`,
      'ms-MY': `Fungsi Sasaran / Model Matematik`,
    },
  },
  'runtime.legacy.db7f070470c4': {
    source: `/solve <формула> или /help`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `/solve <формула> или /help`,
      'fr-CA': `/solve <formula> ou /help`,
      'de-DE': `/solve <formula> oder /help`,
      'hi-IN': `/solve <formula> या /help`,
      'ms-MY': `/solve <formula> atau /help`,
    },
  },
  'runtime.legacy.db8b54c1931b': {
    source: `2', name: 'A6 GEOMETRIC BRIDGE', action: 'Косое произведение u=(F,0), v=(0,G), det(u,v)=F*G', expression: 'det((F,0), (0,G)) = F * G`,
    status: 'pending-translation',
    values: {
      'ru': `2', name: 'A6 GEOMETRIC BRIDGE', action: 'Косое произведение u=(F,0), v=(0,G), det(u,v)=F*G', expression: 'det((F,0), (0,G)) = F * G`,
    },
  },
  'runtime.legacy.dc5b2a547402': {
    source: `Пользовательское доказательство Lean 4`,
    status: 'pending-translation',
    values: {
      'ru': `Пользовательское доказательство Lean 4`,
    },
  },
  'runtime.legacy.dcf0bcca05ca': {
    source: `singularityHint": "Топологическая невозможность (парадокс голосования).`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Топологическая невозможность (парадокс голосования).`,
    },
  },
  'runtime.legacy.dd4496719f6c': {
    source: `не должен вызывать onCommit во время непрерывного изменения значений ползунка`,
    status: 'pending-translation',
    values: {
      'ru': `не должен вызывать onCommit во время непрерывного изменения значений ползунка`,
    },
  },
  'runtime.legacy.dd7b137e41a7': {
    source: `RICIS-III v7.7 Analytical Engine готов к работе.', 'ricis`,
    status: 'pending-translation',
    values: {
      'ru': `RICIS-III v7.7 Analytical Engine готов к работе.', 'ricis`,
    },
  },
  'runtime.legacy.dd7cc306beaa': {
    source: `Требуется evidence Core / Lean`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Требуется evidence Core / Lean`,
      'fr-CA': `Nécessite une preuve Core / Lean`,
      'de-DE': `Erfordert Core/Lean-Evidence`,
      'hi-IN': `Core / Lean प्रमाण आवश्यक`,
      'ms-MY': `Memerlukan bukti Core/Lean`,
    },
  },
  'runtime.legacy.dd912778a2a5': {
    source: `title": "Сингулярность дираковской струны`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Сингулярность дираковской струны`,
    },
  },
  'runtime.legacy.dddcfd5385e5': {
    source: `должен инициализировать стор с дефолтными диагностическими полями`,
    status: 'pending-translation',
    values: {
      'ru': `должен инициализировать стор с дефолтными диагностическими полями`,
    },
  },
  'runtime.legacy.dde6a0adef88': {
    source: `📜 *Команды RICIS-III:*\\n\\n`,
    status: 'pending-translation',
    values: {
      'ru': `📜 *Команды RICIS-III:*\\n\\n`,
    },
  },
  'runtime.legacy.de5f94419996': {
    source: `description": "Расхождение цепи блоков.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Расхождение цепи блоков.`,
    },
  },
  'runtime.legacy.df705907a7b7': {
    source: `singularityHint": "Сингулярность волатильности при t->T.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность волатильности при t->T.`,
    },
  },
  'runtime.legacy.df79812345b6': {
    source: `Основа RICIS-III`,
    status: 'pending-translation',
    values: {
      'ru': `Основа RICIS-III`,
    },
  },
  'runtime.legacy.dfc3bd2b45d7': {
    source: `Премия Джанга / Остроговского $1,000,000 (abc Conjecture)`,
    status: 'pending-translation',
    values: {
      'ru': `Премия Джанга / Остроговского $1,000,000 (abc Conjecture)`,
    },
  },
  'runtime.legacy.dfd557c3f86b': {
    source: `description": "Узоры Пенроуза.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Узоры Пенроуза.`,
    },
  },
  'runtime.legacy.e0042351c333': {
    source: `Смотреть доказательство`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Смотреть доказательство`,
      'fr-CA': `Voir la preuve`,
      'de-DE': `Beweis anzeigen`,
      'hi-IN': `प्रमाण देखें`,
      'ms-MY': `Lihat bukti`,
    },
  },
  'runtime.legacy.e007e7d3192d': {
    source: `targetFunction": "Formalize(Парадоксбраев)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Парадоксбраев)`,
    },
  },
  'runtime.legacy.e02349be43b2': {
    source: `terminal.mapTitle': { ru: 'Сингулярность: {{value}}', en: 'Singularity: {{value}}`,
    status: 'pending-translation',
    values: {
      'ru': `terminal.mapTitle': { ru: 'Сингулярность: {{value}}', en: 'Singularity: {{value}}`,
    },
  },
  'runtime.legacy.e0ae9599130c': {
    source: `description": "Описание объема через границу.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Описание объема через границу.`,
    },
  },
  'runtime.legacy.e0de5abbbbee': {
    source: `Статус доверия: RICIS_PROVEN`,
    status: 'pending-translation',
    values: {
      'ru': `Статус доверия: RICIS_PROVEN`,
    },
  },
  'runtime.legacy.e10bfb755d55': {
    source: `title": "Теорема Геделя о неполноте`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Теорема Геделя о неполноте`,
    },
  },
  'runtime.legacy.e13cc6f5d6ac': {
    source: `targetFunction": "Formalize(ИнвариантыДональдсона)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(ИнвариантыДональдсона)`,
    },
  },
  'runtime.legacy.e1e97bfef63c': {
    source: `Доказательство A6`,
    status: 'pending-translation',
    values: {
      'ru': `Доказательство A6`,
    },
  },
  'runtime.legacy.e21342e1a92f': {
    source: `📜 *Справка симулятора:*\\n• \`/solve <формула>\` — показать запрос в формате Telegram.\\n• Результат должен отдельно пройти Core или Lean-проверку.`,
    status: 'pending-translation',
    values: {
      'ru': `📜 *Справка симулятора:*\\n• \`/solve <формула>\` — показать запрос в формате Telegram.\\n• Результат должен отдельно пройти Core или Lean-проверку.`,
    },
  },
  'runtime.legacy.e22adf878da5': {
    source: `').replace(/^задача от @\\\\w+:\\\\s*/i, '`,
    status: 'pending-translation',
    values: {
      'ru': `').replace(/^задача от @\\\\w+:\\\\s*/i, '`,
    },
  },
  'runtime.legacy.e2789c1ab2b6': {
    source: `singularityHint": "Сингулярности эллиптических дифференциальных операторов.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярности эллиптических дифференциальных операторов.`,
    },
  },
  'runtime.legacy.e28bf94ad24f': {
    source: `singularityHint": "Аномалии в кривых вращения галактик.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Аномалии в кривых вращения галактик.`,
    },
  },
  'runtime.legacy.e2bb1d6487f8': {
    source: `Обнаружено упоминание Lean, но ключевые слова (theorem, lemma, def) отсутствуют. Код трактуется как LaTeX/текстовое описание.`,
    status: 'pending-translation',
    values: {
      'ru': `Обнаружено упоминание Lean, но ключевые слова (theorem, lemma, def) отсутствуют. Код трактуется как LaTeX/текстовое описание.`,
    },
  },
  'runtime.legacy.e2c4048230bd': {
    source: `Разрешение сингулярностей (Деление на ноль)`,
    status: 'pending-translation',
    values: {
      'ru': `Разрешение сингулярностей (Деление на ноль)`,
    },
  },
  'runtime.legacy.e3567aa7c204': {
    source: `title": "Сингулярность ИИ`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Сингулярность ИИ`,
    },
  },
  'runtime.legacy.e37dbb92069e': {
    source: `targetFunction": "Formalize(СингулярностиванХова)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(СингулярностиванХова)`,
    },
  },
  'runtime.legacy.e38d04cfaffb': {
    source: `Рассчитать за O(1)`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Рассчитать за O(1)`,
      'fr-CA': `Évaluer en O(1)`,
      'de-DE': `In O(1) auswerten`,
      'hi-IN': `O(1) में मूल्यांकन करें`,
      'ms-MY': `Nilai dalam O(1)`,
    },
  },
  'runtime.legacy.e471a598d4c4': {
    source: `6', name: 'L1 VERIFICATION', action: 'Подтверждение стабильного инварианта O(1) без амнезии`,
    status: 'pending-translation',
    values: {
      'ru': `6', name: 'L1 VERIFICATION', action: 'Подтверждение стабильного инварианта O(1) без амнезии`,
    },
  },
  'runtime.legacy.e49472e0626c': {
    source: `singularityHint": "Сингулярность отношения площади к объему.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность отношения площади к объему.`,
    },
  },
  'runtime.legacy.e4b0e2f188f4': {
    source: `Молекулярный дизайн и синтез.`,
    status: 'pending-translation',
    values: {
      'ru': `Молекулярный дизайн и синтез.`,
    },
  },
  'runtime.legacy.e54a8a3a55b3': {
    source: `singularityHint": "Фрактальная размерность аттрактора.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Фрактальная размерность аттрактора.`,
    },
  },
  'runtime.legacy.e570fbed3624': {
    source: `singularityHint": "Бесконечный цикл (временная расходимость).`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Бесконечный цикл (временная расходимость).`,
    },
  },
  'runtime.legacy.e5e445985a66': {
    source: `targetFunction": "Formalize(Квазикристаллы)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Квазикристаллы)`,
    },
  },
  'runtime.legacy.e6c433bcba55': {
    source: `targetFunction": "Formalize(Фазовыепереходывторогорода)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Фазовыепереходывторогорода)`,
    },
  },
  'runtime.legacy.e7513852fcec': {
    source: `description": "Влияние векторного потенциала на фазу.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Влияние векторного потенциала на фазу.`,
    },
  },
  'runtime.legacy.e752cbaa529d': {
    source: `singularityHint": "Логарифмическая расходимость при низких температурах.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Логарифмическая расходимость при низких температурах.`,
    },
  },
  'runtime.legacy.e7a3c2186dbe': {
    source: `title": "Крионика`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Крионика`,
    },
  },
  'runtime.legacy.e85802ab4760': {
    source: `должен содержать Gemini 3.7 Flash как модель по умолчанию`,
    status: 'pending-translation',
    values: {
      'ru': `должен содержать Gemini 3.7 Flash как модель по умолчанию`,
    },
  },
  'runtime.legacy.e90500d4111c': {
    source: `targetFunction": "Formalize(Сингулярнаягомология)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Сингулярнаягомология)`,
    },
  },
  'runtime.legacy.e9509ba2845c': {
    source: `Введите сингулярное выражение, например 0_5 * inf_3 или 0_10 / 0_2`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Введите сингулярное выражение, например 0_5 * inf_3 или 0_10 / 0_2`,
      'fr-CA': `Entrez une expression singulière, par exemple 0_5 * inf_3 ou 0_10 / 0_2`,
      'de-DE': `Geben Sie einen singulären Ausdruck ein, z. B. 0_5 * inf_3 oder 0_10 / 0_2`,
      'hi-IN': `एक singular अभिव्यक्ति दर्ज करें, उदाहरण के लिए 0_5 * inf_3 या 0_10 / 0_2`,
      'ms-MY': `Masukkan ungkapan singular, contohnya 0_5 * inf_3 atau 0_10 / 0_2`,
    },
  },
  'runtime.legacy.e951be86c2d3': {
    source: `Обновленный заголовок RICIS`,
    status: 'pending-translation',
    values: {
      'ru': `Обновленный заголовок RICIS`,
    },
  },
  'runtime.legacy.e9e5b4b84a04': {
    source: `terminal.steps': { ru: 'Шаги: {{value}}', en: 'Steps: {{value}}`,
    status: 'pending-translation',
    values: {
      'ru': `terminal.steps': { ru: 'Шаги: {{value}}', en: 'Steps: {{value}}`,
    },
  },
  'runtime.legacy.ea4bdf1f3c56': {
    source: `theoremReport.premise': { ru: 'Гипотеза (Premise):', en: 'Hypothesis (Premise):`,
    status: 'pending-translation',
    values: {
      'ru': `theoremReport.premise': { ru: 'Гипотеза (Premise):', en: 'Hypothesis (Premise):`,
    },
  },
  'runtime.legacy.eae242e7126a': {
    source: `targetFunction": "Formalize(МодельБлэкаШоулза)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(МодельБлэкаШоулза)`,
    },
  },
  'runtime.legacy.eb249b56eb4e': {
    source: `ЗАБЛОКИРОВАНО`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `ЗАБЛОКИРОВАНО`,
      'fr-CA': `Verrouillé`,
      'de-DE': `Gesperrt`,
      'hi-IN': `लॉक किया गया`,
      'ms-MY': `Terkunci`,
    },
  },
  'runtime.legacy.eb3d7a8b3853': {
    source: `должен выполнять очистку кодовой базы, сохраняя лог трансформаций кода`,
    status: 'pending-translation',
    values: {
      'ru': `должен выполнять очистку кодовой базы, сохраняя лог трансформаций кода`,
    },
  },
  'runtime.legacy.eb5cf707bdd6': {
    source: `description": "Избежание кристаллизации воды.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Избежание кристаллизации воды.`,
    },
  },
  'runtime.legacy.eb728f1fbccc': {
    source: `Монолитная алгебра RICIS-III для вычисления 0/0.`,
    status: 'pending-translation',
    values: {
      'ru': `Монолитная алгебра RICIS-III для вычисления 0/0.`,
    },
  },
  'runtime.legacy.ebe0bd199e76': {
    source: `Неизменяемый снимок Ricis.Core`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Неизменяемый снимок Ricis.Core`,
      'fr-CA': `Instantané immuable de Ricis.Core`,
      'de-DE': `Unveränderlicher Ricis.Core-Snapshot`,
      'hi-IN': `अपरिवर्तनीय Ricis.Core स्नैपशॉट`,
      'ms-MY': `Snapshot Ricis.Core yang tidak boleh diubah`,
    },
  },
  'runtime.legacy.ed44613a9615': {
    source: `должен корректно генерировать URL для задачи на карте`,
    status: 'pending-translation',
    values: {
      'ru': `должен корректно генерировать URL для задачи на карте`,
    },
  },
  'runtime.legacy.ed8e537f8687': {
    source: `Сингулярная задача', targetFunction || '', id || 'node`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярная задача', targetFunction || '', id || 'node`,
    },
  },
  'runtime.legacy.edb0eda9067b': {
    source: `• \`HYPOTHESIS\` — предположение.\\n`,
    status: 'pending-translation',
    values: {
      'ru': `• \`HYPOTHESIS\` — предположение.\\n`,
    },
  },
  'runtime.legacy.edc06ae29040': {
    source: `title": "Модель Блэка — Шоулза`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Модель Блэка — Шоулза`,
    },
  },
  'runtime.legacy.edda37857883': {
    source: `должен сбрасывать таймер IDLE при возобновлении движения до истечения таймаута`,
    status: 'pending-translation',
    values: {
      'ru': `должен сбрасывать таймер IDLE при возобновлении движения до истечения таймаута`,
    },
  },
  'runtime.legacy.eee5850afe68': {
    source: `singularityHint": "Особенности пространства модулей инстантонов.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Особенности пространства модулей инстантонов.`,
    },
  },
  'runtime.legacy.ef2877d5750b': {
    source: `singularityHint": "Степенной закон распределения (хвостовая расходимость).`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Степенной закон распределения (хвостовая расходимость).`,
    },
  },
  'runtime.legacy.ef6eb2002de0': {
    source: `singularityHint": "Сингулярность границы AdS-пространства.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность границы AdS-пространства.`,
    },
  },
  'runtime.legacy.ef9570f0fa3f': {
    source: `Внешняя публикация/исследование, использующее методы RICIS-III.`,
    status: 'pending-translation',
    values: {
      'ru': `Внешняя публикация/исследование, использующее методы RICIS-III.`,
    },
  },
  'runtime.legacy.efc80d03e138': {
    source: `title": "Топологические изоляторы`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Топологические изоляторы`,
    },
  },
  'runtime.legacy.f018e0cbc5fe': {
    source: `Побитовый геометрический анализ в циклическом кольце Мерсенна M = 2^k - 1, сводящий NP-сложность (TSP, SAT, факторизация) к детерминированному O(1) за 1 такт процессора.`,
    status: 'pending-translation',
    values: {
      'ru': `Побитовый геометрический анализ в циклическом кольце Мерсенна M = 2^k - 1, сводящий NP-сложность (TSP, SAT, факторизация) к детерминированному O(1) за 1 такт процессора.`,
    },
  },
  'runtime.legacy.f07098d0a4e6': {
    source: `singularityHint": "Сингулярность эгоистической рациональности.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Сингулярность эгоистической рациональности.`,
    },
  },
  'runtime.legacy.f0a18f59db22': {
    source: `Формальные модели, аксиоматика, сложность.`,
    status: 'pending-translation',
    values: {
      'ru': `Формальные модели, аксиоматика, сложность.`,
    },
  },
  'runtime.legacy.f0baf2ad0262': {
    source: `Точный инвариант RICIS-III`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Точный инвариант RICIS-III`,
      'fr-CA': `Invariant exact RICIS-III`,
      'de-DE': `Exaktes RICIS-III-Invariant`,
      'hi-IN': `सटीक RICIS-III इनवेरिएंट`,
      'ms-MY': `Invarian tepat RICIS-III`,
    },
  },
  'runtime.legacy.f0dff5ab4a66': {
    source: `Сохранено`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Сохранено`,
      'fr-CA': `Enregistré`,
      'de-DE': `Gespeichert`,
      'hi-IN': `सहेजा गया`,
      'ms-MY': `Disimpan`,
    },
  },
  'runtime.legacy.f1849ca10783': {
    source: `title": "Равенство классов P и NP (Детерминированный Мерсенновский анализ)`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Равенство классов P и NP (Детерминированный Мерсенновский анализ)`,
    },
  },
  'runtime.legacy.f1b867d61d97': {
    source: `description": "Одобрение того, что любой гармонический дифференциал есть рациональная комбинация.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Одобрение того, что любой гармонический дифференциал есть рациональная комбинация.`,
    },
  },
  'runtime.legacy.f1e18d79f4ae': {
    source: `Академическая сингулярность`,
    status: 'pending-translation',
    values: {
      'ru': `Академическая сингулярность`,
    },
  },
  'runtime.legacy.f2068ba11272': {
    source: `Доказательство авторства RICIS-III`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Доказательство авторства RICIS-III`,
      'fr-CA': `Preuve d'auteur RICIS-III`,
      'de-DE': `Nachweis der Urheberschaft RICIS-III`,
      'hi-IN': `RICIS-III लेखकत्व का प्रमाण`,
      'ms-MY': `Bukti Kepengarangan RICIS-III`,
    },
  },
  'runtime.legacy.f20de7a76cba': {
    source: `targetFunction": "Formalize(ГипотезаРимана)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(ГипотезаРимана)`,
    },
  },
  'runtime.legacy.f24173f14962': {
    source: `Заполнить ИИ`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Заполнить ИИ`,
      'fr-CA': `Remplir via AI`,
      'de-DE': `Mit AI füllen`,
      'hi-IN': `AI द्वारा भरें`,
      'ms-MY': `Isi melalui AI`,
    },
  },
  'runtime.legacy.f2bd5ec51cb7': {
    source: `НАСТРОЙКИ`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `НАСТРОЙКИ`,
      'fr-CA': `Paramètres`,
      'de-DE': `Einstellungen`,
      'hi-IN': `सेटिंग्स`,
      'ms-MY': `Tetapan`,
    },
  },
  'runtime.legacy.f2e1953fc80d': {
    source: `settings.languageLabel': { ru: 'Язык / Language', en: 'Language / Язык`,
    status: 'pending-translation',
    values: {
      'ru': `settings.languageLabel': { ru: 'Язык / Language', en: 'Language / Язык`,
    },
  },
  'runtime.legacy.f30d0ca65067': {
    source: `Production endpoint Ricis.Core настроен некорректно. Результат не вычислялся.`,
    status: 'pending-translation',
    values: {
      'ru': `Production endpoint Ricis.Core настроен некорректно. Результат не вычислялся.`,
    },
  },
  'runtime.legacy.f330c6b7bb8c': {
    source: `title": "Квантовая запутанность и кротовые норы`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Квантовая запутанность и кротовые норы`,
    },
  },
  'runtime.legacy.f3366bd8be17': {
    source: `• \`CLASSICAL_INHERITED\` — применено классическое правило, не перекрытое RICIS.\\n`,
    status: 'pending-translation',
    values: {
      'ru': `• \`CLASSICAL_INHERITED\` — применено классическое правило, не перекрытое RICIS.\\n`,
    },
  },
  'runtime.legacy.f3406433acd4': {
    source: `singularityHint": "Расходимость корреляционного радиуса.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Расходимость корреляционного радиуса.`,
    },
  },
  'runtime.legacy.f36025f9c361': {
    source: `theoremReport.method': { ru: 'Метод', en: 'Method`,
    status: 'pending-translation',
    values: {
      'ru': `theoremReport.method': { ru: 'Метод', en: 'Method`,
    },
  },
  'runtime.legacy.f3d28f6ae1a7': {
    source: `RICIS-III ПЕСОЧНИЦА СИНГУЛЯРНОСТЕЙ`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `RICIS-III ПЕСОЧНИЦА СИНГУЛЯРНОСТЕЙ`,
      'fr-CA': `Bac à sable des singularités RICIS-III`,
      'de-DE': `RICIS-III Sandbox der Singularitäten`,
      'hi-IN': `RICIS-III सिंगुलैरिटी सैंडबॉक्स`,
      'ms-MY': `Sandbox Singulariti RICIS-III`,
    },
  },
  'runtime.legacy.f4768e9349a2': {
    source: `targetFunction": "Formalize(Блокчейнфорк)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Блокчейнфорк)`,
    },
  },
  'runtime.legacy.f482b1c8182b': {
    source: `P = NP [Детерминированное побитовое сведение в кольцах Мерсенна M = 2^k - 1]`,
    status: 'pending-translation',
    values: {
      'ru': `P = NP [Детерминированное побитовое сведение в кольцах Мерсенна M = 2^k - 1]`,
    },
  },
  'runtime.legacy.f48f6ccea1b7': {
    source: `settings.enabled': { ru: 'Вкл', en: 'On`,
    status: 'pending-translation',
    values: {
      'ru': `settings.enabled': { ru: 'Вкл', en: 'On`,
    },
  },
  'runtime.legacy.f4d51dfdb3af': {
    source: `description": "Самофокусировка лазерного луча.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Самофокусировка лазерного луча.`,
    },
  },
  'runtime.legacy.f502d15e7d9d': {
    source: `sandbox.title')).toBe('RICIS-III ПЕСОЧНИЦА СИНГУЛЯРНОСТЕЙ`,
    status: 'pending-translation',
    values: {
      'ru': `sandbox.title')).toBe('RICIS-III ПЕСОЧНИЦА СИНГУЛЯРНОСТЕЙ`,
    },
  },
  'runtime.legacy.f5441f6aee76': {
    source: `Описание`,
    status: 'pending-translation',
    values: {
      'ru': `Описание`,
    },
  },
  'runtime.legacy.f5e03eed0eab': {
    source: `Аудит RICIS-III доказательств: Все существующие доказательства соответствуют A6 и спецификации Lean 4.`,
    status: 'pending-translation',
    values: {
      'ru': `Аудит RICIS-III доказательств: Все существующие доказательства соответствуют A6 и спецификации Lean 4.`,
    },
  },
  'runtime.legacy.f623df44cafc': {
    source: `description": "Рассеяние света в критической точке.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Рассеяние света в критической точке.`,
    },
  },
  'runtime.legacy.f68e53d6c891': {
    source: `Премия Института Клея $1,000,000 (Уравнения Навье-Стокса)`,
    status: 'pending-translation',
    values: {
      'ru': `Премия Института Клея $1,000,000 (Уравнения Навье-Стокса)`,
    },
  },
  'runtime.legacy.f6b57384d666': {
    source: `description": "Образование капель и разрыв струи жидкости.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Образование капель и разрыв струи жидкости.`,
    },
  },
  'runtime.legacy.f79f229c4ff5': {
    source: `Сверхпроводники, метаматериалы.`,
    status: 'pending-translation',
    values: {
      'ru': `Сверхпроводники, метаматериалы.`,
    },
  },
  'runtime.legacy.f8160cbbeb4c': {
    source: `должен очищать историю вычислений`,
    status: 'pending-translation',
    values: {
      'ru': `должен очищать историю вычислений`,
    },
  },
  'runtime.legacy.f92dc1513355': {
    source: `title": "Нелинейное уравнение Шредингера`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Нелинейное уравнение Шредингера`,
    },
  },
  'runtime.legacy.f94e3580cc43': {
    source: `targetFunction": "Formalize(ГипотезаГольдбаха)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(ГипотезаГольдбаха)`,
    },
  },
  'runtime.legacy.f9fbdedd24c6': {
    source: `targetFunction": "Formalize(Онкогенез)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(Онкогенез)`,
    },
  },
  'runtime.legacy.fa1bf80a8c1f': {
    source: `Инфраструктура Ricis.Core не завершила запрос. Результат не вычислялся.`,
    status: 'pending-translation',
    values: {
      'ru': `Инфраструктура Ricis.Core не завершила запрос. Результат не вычислялся.`,
    },
  },
  'runtime.legacy.fa47c6b30b60': {
    source: `targetFunction": "Formalize(СингулярностьфункцииВейерштрасса)`,
    status: 'pending-translation',
    values: {
      'ru': `targetFunction": "Formalize(СингулярностьфункцииВейерштрасса)`,
    },
  },
  'runtime.legacy.fa5adba22c9d': {
    source: `Экономия вычислительных суперкомпьютеров ИИ $500 Млрд`,
    status: 'pending-translation',
    values: {
      'ru': `Экономия вычислительных суперкомпьютеров ИИ $500 Млрд`,
    },
  },
  'runtime.legacy.fa7d2bac3ca6': {
    source: `должен немедленно вызывать onCommit с новыми параметрами при вызове endInteraction()`,
    status: 'pending-translation',
    values: {
      'ru': `должен немедленно вызывать onCommit с новыми параметрами при вызове endInteraction()`,
    },
  },
  'runtime.legacy.fab87a261872': {
    source: `settings.browserDetection': { ru: 'Автоопределение по заголовку браузера', en: 'Automatic detection from browser language`,
    status: 'pending-translation',
    values: {
      'ru': `settings.browserDetection': { ru: 'Автоопределение по заголовку браузера', en: 'Automatic detection from browser language`,
    },
  },
  'runtime.legacy.fac0d90e3da1': {
    source: `Разрешение предельного перехода аксиомами SP1-SP4`,
    status: 'pending-translation',
    values: {
      'ru': `Разрешение предельного перехода аксиомами SP1-SP4`,
    },
  },
  'runtime.legacy.fad8b685f632': {
    source: `title": "Катастрофы Тома`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Катастрофы Тома`,
    },
  },
  'runtime.legacy.fadea306c03d': {
    source: `Модель недоступна или отключена (ошибка 404).`,
    status: 'pending-translation',
    values: {
      'ru': `Модель недоступна или отключена (ошибка 404).`,
    },
  },
  'runtime.legacy.fb066a0ec0dc': {
    source: `singularityHint": "Алгебраические квантовые сингулярности.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Алгебраические квантовые сингулярности.`,
    },
  },
  'runtime.legacy.fb13319b9585': {
    source: `settings.disabled': { ru: 'Выкл', en: 'Off`,
    status: 'pending-translation',
    values: {
      'ru': `settings.disabled': { ru: 'Выкл', en: 'Off`,
    },
  },
  'runtime.legacy.fb595ee3efcf': {
    source: `title": "Аутоиммунные заболевания`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Аутоиммунные заболевания`,
    },
  },
  'runtime.legacy.fb63dd253828': {
    source: `singularityHint": "Квантовые критические точки.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Квантовые критические точки.`,
    },
  },
  'runtime.legacy.fc9b92cc2e25': {
    source: `description": "Теоремы Хокинга и Пенроуза о сингулярностях.`,
    status: 'pending-translation',
    values: {
      'ru': `description": "Теоремы Хокинга и Пенроуза о сингулярностях.`,
    },
  },
  'runtime.legacy.fcacd3aef586': {
    source: `title": "NP-полные задачи (Детерминированный сетевой трафарет TSP/SAT)`,
    status: 'pending-translation',
    values: {
      'ru': `title": "NP-полные задачи (Детерминированный сетевой трафарет TSP/SAT)`,
    },
  },
  'runtime.legacy.fcc5bdc49827': {
    source: `title": "Эффект Ааронова — Бома`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Эффект Ааронова — Бома`,
    },
  },
  'runtime.legacy.fd425f05d351': {
    source: `\${description || 'Выполнить детерминированный прогон RICIS-III'}`,
    status: 'pending-translation',
    values: {
      'ru': `\${description || 'Выполнить детерминированный прогон RICIS-III'}`,
    },
  },
  'runtime.legacy.fd8b416551bf': {
    source: `Тестовое сообщение RICIS', 'ricis', 'Детали вычисления', 'test-node-1`,
    status: 'pending-translation',
    values: {
      'ru': `Тестовое сообщение RICIS', 'ricis', 'Детали вычисления', 'test-node-1`,
    },
  },
  'runtime.legacy.fdd1ae619594': {
    source: `Автоматически созданная область наук`,
    status: 'pending-translation',
    values: {
      'ru': `Автоматически созданная область наук`,
    },
  },
  'runtime.legacy.fe2ae4bb5606': {
    source: `singularityHint": "Коллапс луча в точку.`,
    status: 'pending-translation',
    values: {
      'ru': `singularityHint": "Коллапс луча в точку.`,
    },
  },
  'runtime.legacy.febd7ee896a6': {
    source: `Мировое признание / Академическая премия $50,000,000`,
    status: 'pending-translation',
    values: {
      'ru': `Мировое признание / Академическая премия $50,000,000`,
    },
  },
  'runtime.legacy.fef01cfd2d5e': {
    source: `title": "Квантовая ошибка`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Квантовая ошибка`,
    },
  },
  'runtime.legacy.fef8573bb1af': {
    source: `hint": "Сингулярность предельного перехода [0/0] или [inf/inf], устранённая аксиомами SP1-SP4`,
    status: 'pending-translation',
    values: {
      'ru': `hint": "Сингулярность предельного перехода [0/0] или [inf/inf], устранённая аксиомами SP1-SP4`,
    },
  },
  'runtime.legacy.ffb22ba0d5f7': {
    source: `Параметры сгенерированы каноническим движком RICIS-III.`,
    status: 'pending-translation',
    values: {
      'ru': `Параметры сгенерированы каноническим движком RICIS-III.`,
    },
  },
  'runtime.legacy.ffe820d58ea0': {
    source: `title": "Сингулярности в гидродинамике`,
    status: 'pending-translation',
    values: {
      'ru': `title": "Сингулярности в гидродинамике`,
    },
  },
  'ui.legacy.01a8a197723f': {
    source: `mb-2 flex items-center justify-between"><h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Найденные узлы</h2><span className="text-[10px] font-mono text-slate-500`,
    status: 'pending-translation',
    values: {
      'ru': `mb-2 flex items-center justify-between"><h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Найденные узлы</h2><span className="text-[10px] font-mono text-slate-500`,
    },
  },
  'ui.legacy.023025363aea': {
    source: `Сбросить физику к значениям по умолчанию`,
    status: 'pending-translation',
    values: {
      'ru': `Сбросить физику к значениям по умолчанию`,
    },
  },
  'ui.legacy.029712ba8b4e': {
    source: `1. Генерация трехмерного звездного поля (StarField Data)`,
    status: 'pending-translation',
    values: {
      'ru': `1. Генерация трехмерного звездного поля (StarField Data)`,
    },
  },
  'ui.legacy.02ed40945845': {
    source: `resolved' ? 'Перерассчитать RICIS-решение' : 'Запустить RICIS-решение`,
    status: 'pending-translation',
    values: {
      'ru': `resolved' ? 'Перерассчитать RICIS-решение' : 'Запустить RICIS-решение`,
    },
  },
  'ui.legacy.0358075beabe': {
    source: `physics' && (t('sandbox.title') === 'RICIS-III ПЕСОЧНИЦА СИНГУЛЯРНОСТЕЙ' ? 'Параметры симуляции' : 'Simulation Parameters`,
    status: 'pending-translation',
    values: {
      'ru': `physics' && (t('sandbox.title') === 'RICIS-III ПЕСОЧНИЦА СИНГУЛЯРНОСТЕЙ' ? 'Параметры симуляции' : 'Simulation Parameters`,
    },
  },
  'ui.legacy.0401ccf4504b': {
    source: `Фильтр сообщений...`,
    status: 'pending-translation',
    values: {
      'ru': `Фильтр сообщений...`,
    },
  },
  'ui.legacy.048daa664e84': {
    source: `Состояние workflow: resolved`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Состояние workflow: resolved`,
      'fr-CA': `État du workflow : resolved`,
      'de-DE': `Workflow-Status: resolved`,
      'hi-IN': `Workflow स्थिति: resolved`,
      'ms-MY': `Status aliran kerja: resolved`,
    },
  },
  'ui.legacy.0aff0e945632': {
    source: `bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-300">G Узлов: <strong className="text-emerald-400`,
    status: 'pending-translation',
    values: {
      'ru': `bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-300">G Узлов: <strong className="text-emerald-400`,
    },
  },
  'ui.legacy.0efa9ff1b508': {
    source: `должен генерировать корректные типизированные массивы для позиций, цветов и размеров звезд`,
    status: 'pending-translation',
    values: {
      'ru': `должен генерировать корректные типизированные массивы для позиций, цветов и размеров звезд`,
    },
  },
  'ui.legacy.0f0bcdac762a': {
    source: `войнич') || tLower.includes('voynich`,
    status: 'pending-translation',
    values: {
      'ru': `войнич') || tLower.includes('voynich`,
    },
  },
  'ui.legacy.11469d5eefb3': {
    source: `Вставьте Lean 4 или LaTeX. Lean-код получает статус verified только после воспроизводимого запуска kernel.`,
    status: 'pending-translation',
    values: {
      'ru': `Вставьте Lean 4 или LaTeX. Lean-код получает статус verified только после воспроизводимого запуска kernel.`,
    },
  },
  'ui.legacy.11cb431d360c': {
    source: `Отталкивание масс (G)" prop="nodeG`,
    status: 'pending-translation',
    values: {
      'ru': `Отталкивание масс (G)" prop="nodeG`,
    },
  },
  'ui.legacy.12b2f1f2ea5a': {
    source: `например, Инвариант = 12 [O(1)], Аксиома A6 (Geometric Bridge)`,
    status: 'pending-translation',
    values: {
      'ru': `например, Инвариант = 12 [O(1)], Аксиома A6 (Geometric Bridge)`,
    },
  },
  'ui.legacy.1304afa92bea': {
    source: `Вычисление...`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Вычисление...`,
      'fr-CA': `Évaluation en cours...`,
      'de-DE': `Auswertung...`,
      'hi-IN': `मूल्यांकन जारी है...`,
      'ms-MY': `Sedang dinilai...`,
    },
  },
  'ui.legacy.1439da748125': {
    source: `Откройте Ricis.Core solution и запустите Web API на локальном порту.`,
    status: 'pending-translation',
    values: {
      'ru': `Откройте Ricis.Core solution и запустите Web API на локальном порту.`,
    },
  },
  'ui.legacy.15de4052f439': {
    source: `должен содержать группы параметров зон и узлов без внутренних скроллеров`,
    status: 'pending-translation',
    values: {
      'ru': `должен содержать группы параметров зон и узлов без внутренних скроллеров`,
    },
  },
  'ui.legacy.169c1b699ba5': {
    source: `trace', label: 'Пошаговый лог (Phases -1..6)`,
    status: 'pending-translation',
    values: {
      'ru': `trace', label: 'Пошаговый лог (Phases -1..6)`,
    },
  },
  'ui.legacy.1700a6fb66b7': {
    source: `Производная задача`,
    status: 'pending-translation',
    values: {
      'ru': `Производная задача`,
    },
  },
  'ui.legacy.1974f55902be': {
    source: `Убедитесь, что математический результат не был создан`,
    status: 'pending-translation',
    values: {
      'ru': `Убедитесь, что математический результат не был создан`,
    },
  },
  'ui.legacy.1c8965980f43': {
    source: `theorem', label: 'Теорема (LaTeX / Q.E.D.)`,
    status: 'pending-translation',
    values: {
      'ru': `theorem', label: 'Теорема (LaTeX / Q.E.D.)`,
    },
  },
  'ui.legacy.1d13766bd5d2': {
    source: `Этот браузер или устройство не предоставило рабочий WebGL-контекст. Содержимое карты доступно в семантическом списке.`,
    status: 'pending-translation',
    values: {
      'ru': `Этот браузер или устройство не предоставило рабочий WebGL-контекст. Содержимое карты доступно в семантическом списке.`,
    },
  },
  'ui.legacy.1d7a819c91b4': {
    source: `Ошибка агента: `,
    status: 'pending-translation',
    values: {
      'ru': `Ошибка агента: `,
    },
  },
  'ui.legacy.1dd4f7310315': {
    source: `Исходник Lean предоставлен; kernel evidence проверяется отдельно' : 'Исходник Lean не предоставлен`,
    status: 'pending-translation',
    values: {
      'ru': `Исходник Lean предоставлен; kernel evidence проверяется отдельно' : 'Исходник Lean не предоставлен`,
    },
  },
  'ui.legacy.1df753f21629': {
    source: `Генератор формальных доказательств`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Генератор формальных доказательств`,
      'fr-CA': `Générateur de preuves formelles`,
      'de-DE': `Generator für formale Beweise`,
      'hi-IN': `औपचारिक प्रमाण जनरेटर`,
      'ms-MY': `Penjana bukti formal`,
    },
  },
  'ui.legacy.1ec3b8813837': {
    source: `Сохранено' : 'Save`,
    status: 'pending-translation',
    values: {
      'ru': `Сохранено' : 'Save`,
    },
  },
  'ui.legacy.218176e0dfa7': {
    source: `не должен содержать вложенных классов ограничения высоты и скроллинга (max-h-80, overflow-y-auto)`,
    status: 'pending-translation',
    values: {
      'ru': `не должен содержать вложенных классов ограничения высоты и скроллинга (max-h-80, overflow-y-auto)`,
    },
  },
  'ui.legacy.22314ac93533': {
    source: `Агент добавил ' + res.added + ' новых проблем в граф.`,
    status: 'pending-translation',
    values: {
      'ru': `Агент добавил ' + res.added + ' новых проблем в граф.`,
    },
  },
  'ui.legacy.245372770fef': {
    source: `До готовности C# Core приложение не создаёт математический инвариант, trace или proof.`,
    status: 'pending-translation',
    values: {
      'ru': `До готовности C# Core приложение не создаёт математический инвариант, trace или proof.`,
    },
  },
  'ui.legacy.25fdfa345a26': {
    source: `Управление наклоном отключено.`,
    status: 'pending-translation',
    values: {
      'ru': `Управление наклоном отключено.`,
    },
  },
  'ui.legacy.292c60ed5cba': {
    source: `Целевая длина пружин" prop="springRestGapMult`,
    status: 'pending-translation',
    values: {
      'ru': `Целевая длина пружин" prop="springRestGapMult`,
    },
  },
  'ui.legacy.294aba75e641': {
    source: `Ошибка при запросе к ИИ-агенту Gemini`,
    status: 'pending-translation',
    values: {
      'ru': `Ошибка при запросе к ИИ-агенту Gemini`,
    },
  },
  'ui.legacy.2ac52e60049c': {
    source: `Название новой сферы...`,
    status: 'pending-translation',
    values: {
      'ru': `Название новой сферы...`,
    },
  },
  'ui.legacy.2b7fbb9535ea': {
    source: `Проверьте форму выражения`,
    status: 'pending-translation',
    values: {
      'ru': `Проверьте форму выражения`,
    },
  },
  'ui.legacy.34fa9561f4b6': {
    source: `gradient') || tLower.includes('градиент') || tLower.includes('llm') || tLower.includes('обучение`,
    status: 'pending-translation',
    values: {
      'ru': `gradient') || tLower.includes('градиент') || tLower.includes('llm') || tLower.includes('обучение`,
    },
  },
  'ui.legacy.3741988ebd10': {
    source: `button" onClick={() => setLeftPanelMode('open')} className="hidden md:inline-flex absolute left-2 top-2 z-20 min-h-8 min-w-8 items-center justify-center rounded bg-neutral-950/90 text-neutral-400 shadow-lg transition-colors hover:bg-cyan-950/70 hover:text-cyan-200" aria-label="Развернуть левую панель" title="Развернуть левую панель`,
    status: 'pending-translation',
    values: {
      'ru': `button" onClick={() => setLeftPanelMode('open')} className="hidden md:inline-flex absolute left-2 top-2 z-20 min-h-8 min-w-8 items-center justify-center rounded bg-neutral-950/90 text-neutral-400 shadow-lg transition-colors hover:bg-cyan-950/70 hover:text-cyan-200" aria-label="Развернуть левую панель" title="Развернуть левую панель`,
    },
  },
  'ui.legacy.37e06187be20': {
    source: `Передайте безопасную диагностику администратору`,
    status: 'pending-translation',
    values: {
      'ru': `Передайте безопасную диагностику администратору`,
    },
  },
  'ui.legacy.383ad92d3532': {
    source: `Сбросить карту?`,
    status: 'pending-translation',
    values: {
      'ru': `Сбросить карту?`,
    },
  },
  'ui.legacy.39539cf3445d': {
    source: `core.status.checking') : 'Проверить RICIS Core`,
    status: 'pending-translation',
    values: {
      'ru': `core.status.checking') : 'Проверить RICIS Core`,
    },
  },
  'ui.legacy.3aae36475187': {
    source: `Отправка запроса на /api/generateProof...`,
    status: 'pending-translation',
    values: {
      'ru': `Отправка запроса на /api/generateProof...`,
    },
  },
  'ui.legacy.3e913af55c99': {
    source: `Нажмите, чтобы открыть полный журнал логов`,
    status: 'pending-translation',
    values: {
      'ru': `Нажмите, чтобы открыть полный журнал логов`,
    },
  },
  'ui.legacy.400f45359296': {
    source: `Разрешено через аксиомы RICIS-III`,
    status: 'pending-translation',
    values: {
      'ru': `Разрешено через аксиомы RICIS-III`,
    },
  },
  'ui.legacy.454d22abae3d': {
    source: `Это безопасное состояние: TypeScript fallback не использовался, поэтому инвариант, trace и proof отсутствуют.`,
    status: 'pending-translation',
    values: {
      'ru': `Это безопасное состояние: TypeScript fallback не использовался, поэтому инвариант, trace и proof отсутствуют.`,
    },
  },
  'ui.legacy.4606b5e57b31': {
    source: `checking' && 'Проверка health endpoint Ricis.Core…`,
    status: 'pending-translation',
    values: {
      'ru': `checking' && 'Проверка health endpoint Ricis.Core…`,
    },
  },
  'ui.legacy.465e579ab062': {
    source: `Промпт скачан`,
    status: 'pending-translation',
    values: {
      'ru': `Промпт скачан`,
    },
  },
  'ui.legacy.46d794af55a6': {
    source: `Внешнее давление (G_ext)" prop="nodeGExt`,
    status: 'pending-translation',
    values: {
      'ru': `Внешнее давление (G_ext)" prop="nodeGExt`,
    },
  },
  'ui.legacy.47937d0b2e31': {
    source: `Поверните устройство: первая корректная позиция станет точкой калибровки.`,
    status: 'pending-translation',
    values: {
      'ru': `Поверните устройство: первая корректная позиция станет точкой калибровки.`,
    },
  },
  'ui.legacy.49a1e0ab8bb9': {
    source: `px-2 h-6 flex items-center justify-center text-cyan-400 hover:bg-neutral-700 rounded transition-colors text-xs font-bold gap-1 cursor-pointer" title="Сбросить камеру`,
    status: 'pending-translation',
    values: {
      'ru': `px-2 h-6 flex items-center justify-center text-cyan-400 hover:bg-neutral-700 rounded transition-colors text-xs font-bold gap-1 cursor-pointer" title="Сбросить камеру`,
    },
  },
  'ui.legacy.49c0e4a9e80f': {
    source: `JSON: только фиолетовые' : 'Генерировать JSON`,
    status: 'pending-translation',
    values: {
      'ru': `JSON: только фиолетовые' : 'Генерировать JSON`,
    },
  },
  'ui.legacy.4a0d41cc99da': {
    source: `Доказательство успешно синтезировано / перерассчитано!`,
    status: 'pending-translation',
    values: {
      'ru': `Доказательство успешно синтезировано / перерассчитано!`,
    },
  },
  'ui.legacy.4ae50d30739d': {
    source: `Закрыть`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Закрыть`,
      'fr-CA': `Fermer`,
      'de-DE': `Schließen`,
      'hi-IN': `बंद करें`,
      'ms-MY': `Tutup`,
    },
  },
  'ui.legacy.4b59e1b7b7d3': {
    source: `warn', label: '⚠️ Предупреждения`,
    status: 'pending-translation',
    values: {
      'ru': `warn', label: '⚠️ Предупреждения`,
    },
  },
  'ui.legacy.4c76f182365d': {
    source: `Исправьте ввод и повторите расчёт`,
    status: 'pending-translation',
    values: {
      'ru': `Исправьте ввод и повторите расчёт`,
    },
  },
  'ui.legacy.4cbc2d1f079b': {
    source: `например: p * q = N или \\sum x_i = C`,
    status: 'pending-translation',
    values: {
      'ru': `например: p * q = N или \\sum x_i = C`,
    },
  },
  'ui.legacy.4ce0e0336872': {
    source: `Давление среды (G_ext)" prop="zoneGExt`,
    status: 'pending-translation',
    values: {
      'ru': `Давление среды (G_ext)" prop="zoneGExt`,
    },
  },
  'ui.legacy.4d02e5d88dab': {
    source: `Прозрачность связей" prop="edgeOpacity`,
    status: 'pending-translation',
    values: {
      'ru': `Прозрачность связей" prop="edgeOpacity`,
    },
  },
  'ui.legacy.4e99c9a2b8b9': {
    source: `В этом браузере недоступны датчики ориентации.`,
    status: 'pending-translation',
    values: {
      'ru': `В этом браузере недоступны датчики ориентации.`,
    },
  },
  'ui.legacy.50cfa2ed8e7c': {
    source: `min-h-12 cursor-pointer list-none px-3 text-xs font-bold text-slate-300 inline-flex w-full items-center justify-between gap-3"><span className="inline-flex items-center gap-2"><SlidersHorizontal size={16} className="text-cyan-400" /> Инструменты и настройки</span><ChevronDown size={16} className="text-slate-500`,
    status: 'pending-translation',
    values: {
      'ru': `min-h-12 cursor-pointer list-none px-3 text-xs font-bold text-slate-300 inline-flex w-full items-center justify-between gap-3"><span className="inline-flex items-center gap-2"><SlidersHorizontal size={16} className="text-cyan-400" /> Инструменты и настройки</span><ChevronDown size={16} className="text-slate-500`,
    },
  },
  'ui.legacy.5123b68404b4': {
    source: `Заблокировано зависимостями`,
    status: 'pending-translation',
    values: {
      'ru': `Заблокировано зависимостями`,
    },
  },
  'ui.legacy.5129ebc53717': {
    source: `Агент вычисляет (RICIS-III)...`,
    status: 'pending-translation',
    values: {
      'ru': `Агент вычисляет (RICIS-III)...`,
    },
  },
  'ui.legacy.5346a920c92c': {
    source: `Диагностика скопирована' : 'Скопировать безопасную диагностику`,
    status: 'pending-translation',
    values: {
      'ru': `Диагностика скопирована' : 'Скопировать безопасную диагностику`,
    },
  },
  'ui.legacy.53489b1d5e17': {
    source: `Ядро / сингулярность`,
    status: 'pending-translation',
    values: {
      'ru': `Ядро / сингулярность`,
    },
  },
  'ui.legacy.5380fa9fad10': {
    source: `Внешний Lean source заблокирован: для новой версии создайте отдельный proof-узел.`,
    status: 'pending-translation',
    values: {
      'ru': `Внешний Lean source заблокирован: для новой версии создайте отдельный proof-узел.`,
    },
  },
  'ui.legacy.54197249d6be': {
    source: `Ricis.Core недоступно`,
    status: 'pending-translation',
    values: {
      'ru': `Ricis.Core недоступно`,
    },
  },
  'ui.legacy.549f47cd5152': {
    source: `Настройки точной физики', 'Precision Physics Settings`,
    status: 'pending-translation',
    values: {
      'ru': `Настройки точной физики', 'Precision Physics Settings`,
    },
  },
  'ui.legacy.595eae89ef85': {
    source: `Инфраструктура Ricis.Core не завершила запрос`,
    status: 'pending-translation',
    values: {
      'ru': `Инфраструктура Ricis.Core не завершила запрос`,
    },
  },
  'ui.legacy.59fd0d94d927': {
    source: `details' ? selectedNodeTitle : mobileView === 'menu' ? 'Навигация и действия' : mobileView === 'settings' ? 'Настройки' : '3D Singularity Map`,
    status: 'pending-translation',
    values: {
      'ru': `details' ? selectedNodeTitle : mobileView === 'menu' ? 'Навигация и действия' : mobileView === 'settings' ? 'Настройки' : '3D Singularity Map`,
    },
  },
  'ui.legacy.5c90e7f918d3': {
    source: `✏️ Редактировать код' : '👁️ Предпросмотр LaTeX`,
    status: 'pending-translation',
    values: {
      'ru': `✏️ Редактировать код' : '👁️ Предпросмотр LaTeX`,
    },
  },
  'ui.legacy.5da61339284f': {
    source: `Не используйте legacy-монолиты fallback`,
    status: 'pending-translation',
    values: {
      'ru': `Не используйте legacy-монолиты fallback`,
    },
  },
  'ui.legacy.5dd13b3c635c': {
    source: `Статус решения требует просмотра evidence`,
    status: 'pending-translation',
    values: {
      'ru': `Статус решения требует просмотра evidence`,
    },
  },
  'ui.legacy.5df04f342c44': {
    source: `В локальном режиме запустите C# API`,
    status: 'pending-translation',
    values: {
      'ru': `В локальном режиме запустите C# API`,
    },
  },
  'ui.legacy.5f15e5e0dc31': {
    source: `3D-сцена не запустилась. Содержимое карты остаётся доступным в семантическом списке.`,
    status: 'pending-translation',
    values: {
      'ru': `3D-сцена не запустилась. Содержимое карты остаётся доступным в семантическом списке.`,
    },
  },
  'ui.legacy.5f6b1672499c': {
    source: `Свернуть правую панель в узкую полосу`,
    status: 'pending-translation',
    values: {
      'ru': `Свернуть правую панель в узкую полосу`,
    },
  },
  'ui.legacy.5fd9a21d019c': {
    source: `Русский язык`,
    status: 'pending-translation',
    values: {
      'ru': `Русский язык`,
    },
  },
  'ui.legacy.6099a23fa6be': {
    source: `button" onClick={handleResetCamera} className="min-h-10 min-w-10 rounded-lg text-cyan-200 hover:bg-cyan-950/70" aria-label="Сбросить вид`,
    status: 'pending-translation',
    values: {
      'ru': `button" onClick={handleResetCamera} className="min-h-10 min-w-10 rounded-lg text-cyan-200 hover:bg-cyan-950/70" aria-label="Сбросить вид`,
    },
  },
  'ui.legacy.6147b3f6cf26': {
    source: `✓ Скопировано' : '📋 Копировать`,
    status: 'pending-translation',
    values: {
      'ru': `✓ Скопировано' : '📋 Копировать`,
    },
  },
  'ui.legacy.61c1a19a9759': {
    source: `button" onClick={handleZoomOut} className="min-h-10 min-w-10 rounded-lg text-cyan-200 hover:bg-cyan-950/70" aria-label="Уменьшить масштаб`,
    status: 'pending-translation',
    values: {
      'ru': `button" onClick={handleZoomOut} className="min-h-10 min-w-10 rounded-lg text-cyan-200 hover:bg-cyan-950/70" aria-label="Уменьшить масштаб`,
    },
  },
  'ui.legacy.656062cf16f8': {
    source: `Ориентация откалибрована по текущему виду.`,
    status: 'pending-translation',
    values: {
      'ru': `Ориентация откалибрована по текущему виду.`,
    },
  },
  'ui.legacy.6788d88ba28f': {
    source: `Трассировка 8 фаз конвейера`,
    status: 'pending-translation',
    values: {
      'ru': `Трассировка 8 фаз конвейера`,
    },
  },
  'ui.legacy.698795647e13': {
    source: `Повторите health-check`,
    status: 'pending-translation',
    values: {
      'ru': `Повторите health-check`,
    },
  },
  'ui.legacy.69a6b1d9112f': {
    source: `Синтез доказательства и применение SP1-SP4...`,
    status: 'pending-translation',
    values: {
      'ru': `Синтез доказательства и применение SP1-SP4...`,
    },
  },
  'ui.legacy.6a1e05a7505a': {
    source: `*(Доказательство еще не создано. Нажмите "Edit Lean" чтобы добавить)*`,
    status: 'pending-translation',
    values: {
      'ru': `*(Доказательство еще не создано. Нажмите "Edit Lean" чтобы добавить)*`,
    },
  },
  'ui.legacy.6b8c1cbf0793': {
    source: `Статический Pages не запускает .NET DLL. Для публичного расчёта требуется развёрнутый C# API либо настоящий browser-WASM host Ricis.Core.`,
    status: 'pending-translation',
    values: {
      'ru': `Статический Pages не запускает .NET DLL. Для публичного расчёта требуется развёрнутый C# API либо настоящий browser-WASM host Ricis.Core.`,
    },
  },
  'ui.legacy.6c6510519e48': {
    source: `button" onClick={handleZoomIn} className="min-h-10 min-w-10 rounded-lg text-cyan-200 hover:bg-cyan-950/70" aria-label="Увеличить масштаб`,
    status: 'pending-translation',
    values: {
      'ru': `button" onClick={handleZoomIn} className="min-h-10 min-w-10 rounded-lg text-cyan-200 hover:bg-cyan-950/70" aria-label="Увеличить масштаб`,
    },
  },
  'ui.legacy.6d8d0279a831': {
    source: `Повторите проверку Core`,
    status: 'pending-translation',
    values: {
      'ru': `Повторите проверку Core`,
    },
  },
  'ui.legacy.6ebed7cf3932': {
    source: `Частично подтверждено`,
    status: 'pending-translation',
    values: {
      'ru': `Частично подтверждено`,
    },
  },
  'ui.legacy.704eb60dcb62': {
    source: `Включён режим доступного списка. Он содержит те же узлы и сохраняет выбор задачи.`,
    status: 'pending-translation',
    values: {
      'ru': `Включён режим доступного списка. Он содержит те же узлы и сохраняет выбор задачи.`,
    },
  },
  'ui.legacy.70657f567b61': {
    source: `text-emerald-400' : 'text-cyan-400'} /> {sensorModeEnabled ? 'Отключить управление наклоном' : 'Включить управление наклоном`,
    status: 'pending-translation',
    values: {
      'ru': `text-emerald-400' : 'text-cyan-400'} /> {sensorModeEnabled ? 'Отключить управление наклоном' : 'Включить управление наклоном`,
    },
  },
  'ui.legacy.721518d7b424': {
    source: `Сборка мусора`,
    status: 'pending-translation',
    values: {
      'ru': `Сборка мусора`,
    },
  },
  'ui.legacy.731d164f8888': {
    source: `Скопировать ссылку на эту задачу`,
    status: 'pending-translation',
    values: {
      'ru': `Скопировать ссылку на эту задачу`,
    },
  },
  'ui.legacy.75273d0dc5c4': {
    source: `Повторите расчёт только после ready status`,
    status: 'pending-translation',
    values: {
      'ru': `Повторите расчёт только после ready status`,
    },
  },
  'ui.legacy.76359e150b3d': {
    source: `Ricis.Core отклонил выражение`,
    status: 'pending-translation',
    values: {
      'ru': `Ricis.Core отклонил выражение`,
    },
  },
  'ui.legacy.785c3442c1b4': {
    source: `Допустимы +, -, *, /, %, ^, скобки, pi, e и математические функции Core: Sin, Cos, Exp, Log, Sqrt, Abs, Pow, Min, Max.`,
    status: 'pending-translation',
    values: {
      'ru': `Допустимы +, -, *, /, %, ^, скобки, pi, e и математические функции Core: Sin, Cos, Exp, Log, Sqrt, Abs, Pow, Min, Max.`,
    },
  },
  'ui.legacy.789a1092090b': {
    source: `w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white hover:bg-neutral-700 rounded transition-colors cursor-pointer" title="Увеличить масштаб`,
    status: 'pending-translation',
    values: {
      'ru': `w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white hover:bg-neutral-700 rounded transition-colors cursor-pointer" title="Увеличить масштаб`,
    },
  },
  'ui.legacy.78accbe555be': {
    source: `Доступ к датчикам отклонён. Разрешите «Движение и ориентацию» в настройках браузера.`,
    status: 'pending-translation',
    values: {
      'ru': `Доступ к датчикам отклонён. Разрешите «Движение и ориентацию» в настройках браузера.`,
    },
  },
  'ui.legacy.7c5891a0c944': {
    source: ` · ') || 'Не классифицировано`,
    status: 'pending-translation',
    values: {
      'ru': ` · ') || 'Не классифицировано`,
    },
  },
  'ui.legacy.7c9bf0278167': {
    source: `proofConsole.evaluate')).toBe('Рассчитать за O(1)`,
    status: 'pending-translation',
    values: {
      'ru': `proofConsole.evaluate')).toBe('Рассчитать за O(1)`,
    },
  },
  'ui.legacy.7ca831f12f37': {
    source: `Откройте http://localhost:5044/health. Контролируемый ответ должен содержать service Ricis.WebApi и status ok.`,
    status: 'pending-translation',
    values: {
      'ru': `Откройте http://localhost:5044/health. Контролируемый ответ должен содержать service Ricis.WebApi и status ok.`,
    },
  },
  'ui.legacy.7ca8d9154dc9': {
    source: `Ошибка генерации JSON`,
    status: 'pending-translation',
    values: {
      'ru': `Ошибка генерации JSON`,
    },
  },
  'ui.legacy.7d8d9b3e7c4a': {
    source: `Core принимает ограниченное lambda-выражение вида x => <математическое выражение>.`,
    status: 'pending-translation',
    values: {
      'ru': `Core принимает ограниченное lambda-выражение вида x => <математическое выражение>.`,
    },
  },
  'ui.legacy.7dd0c99769a6': {
    source: `proofConsole.traceTitle')).toBe('Трассировка 8 фаз конвейера (фазы -1...6)`,
    status: 'pending-translation',
    values: {
      'ru': `proofConsole.traceTitle')).toBe('Трассировка 8 фаз конвейера (фазы -1...6)`,
    },
  },
  'ui.legacy.7ec5ed7e6d3b': {
    source: `Научная задача`,
    status: 'pending-translation',
    values: {
      'ru': `Научная задача`,
    },
  },
  'ui.legacy.7f17d320499e': {
    source: `Узел отмечен как resolved в карте. Этот статус сам по себе не является Lean kernel verification.`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Узел отмечен как resolved в карте. Этот статус сам по себе не является Lean kernel verification.`,
      'fr-CA': `Le nœud est marqué comme resolved sur la carte. Ce statut de workflow seul n'est pas une vérification du noyau Lean.`,
      'de-DE': `Der Knoten ist in der Karte als resolved markiert. Dieser Workflow‑Status allein ist keine Lean‑Kernel‑Verifikation.`,
      'hi-IN': `यह नोड मानचित्र पर 'resolved' के रूप में चिह्नित है। यह workflow स्थिति अकेले Lean kernel सत्यापन नहीं बताती।`,
      'ms-MY': `Nod ditandakan sebagai resolved dalam peta. Status workflow itu sendiri bukanlah pengesahan kernel Lean.`,
    },
  },
  'ui.legacy.7ff2b51c23aa': {
    source: `Перезапустить`,
    status: 'pending-translation',
    values: {
      'ru': `Перезапустить`,
    },
  },
  'ui.legacy.82ade96bffdf': {
    source: `audit' && (t('sandbox.title') === 'RICIS-III ПЕСОЧНИЦА СИНГУЛЯРНОСТЕЙ' ? 'Аудит и Верификация' : 'Audit & Verification`,
    status: 'pending-translation',
    values: {
      'ru': `audit' && (t('sandbox.title') === 'RICIS-III ПЕСОЧНИЦА СИНГУЛЯРНОСТЕЙ' ? 'Аудит и Верификация' : 'Audit & Verification`,
    },
  },
  'ui.legacy.867fb7f1f166': {
    source: `Вызов окна логов ИИ-Агента`,
    status: 'pending-translation',
    values: {
      'ru': `Вызов окна логов ИИ-Агента`,
    },
  },
  'ui.legacy.89b3ce94dc28': {
    source: `Исследователь', username: 'ricis_researcher`,
    status: 'pending-translation',
    values: {
      'ru': `Исследователь', username: 'ricis_researcher`,
    },
  },
  'ui.legacy.8a3dfa2b9251': {
    source: `Напишите описание проблемы и конкретные указания агенту (например: использовать вместо корня битовую маску log2(sqr(N)))...`,
    status: 'pending-translation',
    values: {
      'ru': `Напишите описание проблемы и конкретные указания агенту (например: использовать вместо корня битовую маску log2(sqr(N)))...`,
    },
  },
  'ui.legacy.8b6950a16e71': {
    source: `Проверьте развертывание Core API`,
    status: 'pending-translation',
    values: {
      'ru': `Проверьте развертывание Core API`,
    },
  },
  'ui.legacy.8e820e5c9183': {
    source: `2. Генератор эквидистантной текстуры Вселенной (Canvas Texture)`,
    status: 'pending-translation',
    values: {
      'ru': `2. Генератор эквидистантной текстуры Вселенной (Canvas Texture)`,
    },
  },
  'ui.legacy.91d296d24b19': {
    source: `error', label: '❌ Ошибки`,
    status: 'pending-translation',
    values: {
      'ru': `error', label: '❌ Ошибки`,
    },
  },
  'ui.legacy.9235b8737f64': {
    source: `Датчики недоступны.`,
    status: 'pending-translation',
    values: {
      'ru': `Датчики недоступны.`,
    },
  },
  'ui.legacy.92623f8b1732': {
    source: `menu' ? 'Вернуться к карте' : 'Открыть меню`,
    status: 'pending-translation',
    values: {
      'ru': `menu' ? 'Вернуться к карте' : 'Открыть меню`,
    },
  },
  'ui.legacy.9266aa6f3d60': {
    source: `Развернуть правую панель задачи`,
    status: 'pending-translation',
    values: {
      'ru': `Развернуть правую панель задачи`,
    },
  },
  'ui.legacy.928989646128': {
    source: `Свернуть левую панель`,
    status: 'pending-translation',
    values: {
      'ru': `Свернуть левую панель`,
    },
  },
  'ui.legacy.931707be418c': {
    source: `Карточка узла`,
    status: 'pending-translation',
    values: {
      'ru': `Карточка узла`,
    },
  },
  'ui.legacy.931b430f8bd9': {
    source: `например: SP2 cancellation at x=0`,
    status: 'pending-translation',
    values: {
      'ru': `например: SP2 cancellation at x=0`,
    },
  },
  'ui.legacy.9380e01d9cc4': {
    source: `Зазор между зонами" prop="zoneSurfaceGap`,
    status: 'pending-translation',
    values: {
      'ru': `Зазор между зонами" prop="zoneSurfaceGap`,
    },
  },
  'ui.legacy.93b1bb519bcd': {
    source: `Очистить журнал логов`,
    status: 'pending-translation',
    values: {
      'ru': `Очистить журнал логов`,
    },
  },
  'ui.legacy.946b72b874dc': {
    source: `Не принимайте неполный ответ за инвариант`,
    status: 'pending-translation',
    values: {
      'ru': `Не принимайте неполный ответ за инвариант`,
    },
  },
  'ui.legacy.94e75542931d': {
    source: `материал звездных точек должен поддерживать vertexColors и прозрачность`,
    status: 'pending-translation',
    values: {
      'ru': `материал звездных точек должен поддерживать vertexColors и прозрачность`,
    },
  },
  'ui.legacy.9857317f26a4': {
    source: `Отталкивание масс (G)" prop="zoneG`,
    status: 'pending-translation',
    values: {
      'ru': `Отталкивание масс (G)" prop="zoneG`,
    },
  },
  'ui.legacy.98b2073ed181': {
    source: `Очистить`,
    status: 'pending-translation',
    values: {
      'ru': `Очистить`,
    },
  },
  'ui.legacy.99e77174a88a': {
    source: `Описание пока не добавлено.`,
    status: 'pending-translation',
    values: {
      'ru': `Описание пока не добавлено.`,
    },
  },
  'ui.legacy.9c14f535922d': {
    source: `p vs np') || tLower.includes('mersenne') || tLower.includes('факторизац') || tLower.includes('rsa') || tLower.includes('коммивояж') || tLower.includes('изоморфизм') || tLower.includes('сетев`,
    status: 'pending-translation',
    values: {
      'ru': `p vs np') || tLower.includes('mersenne') || tLower.includes('факторизац') || tLower.includes('rsa') || tLower.includes('коммивояж') || tLower.includes('изоморфизм') || tLower.includes('сетев`,
    },
  },
  'ui.legacy.9ede3f331700': {
    source: `proofConsole.title')).toBe('Консоль доказательств и сингулярностей RICIS-III`,
    status: 'pending-translation',
    values: {
      'ru': `proofConsole.title')).toBe('Консоль доказательств и сингулярностей RICIS-III`,
    },
  },
  'ui.legacy.a14b344a3084': {
    source: `Не удалось запросить доступ к датчикам. Попробуйте ещё раз из меню.`,
    status: 'pending-translation',
    values: {
      'ru': `Не удалось запросить доступ к датчикам. Попробуйте ещё раз из меню.`,
    },
  },
  'ui.legacy.a35ad971ee28': {
    source: `w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white hover:bg-neutral-700 rounded transition-colors cursor-pointer" title="Уменьшить масштаб`,
    status: 'pending-translation',
    values: {
      'ru': `w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white hover:bg-neutral-700 rounded transition-colors cursor-pointer" title="Уменьшить масштаб`,
    },
  },
  'ui.legacy.a4763f8e7117': {
    source: `Вычисление сингулярностей O(1)`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Вычисление сингулярностей O(1)`,
      'fr-CA': `Évaluation de singularités en O(1)`,
      'de-DE': `O(1)-Singularitätsauswertung`,
      'hi-IN': `O(1) सिंगुलैरिटी का मूल्यांकन`,
      'ms-MY': `Penilaian singulariti O(1)`,
    },
  },
  'ui.legacy.a5382a5c3531': {
    source: `Жесткость пружин (k)" prop="springK`,
    status: 'pending-translation',
    values: {
      'ru': `Жесткость пружин (k)" prop="springK`,
    },
  },
  'ui.legacy.a73a7baaf3f7': {
    source: `Агент не нашёл новых кандидатов.`,
    status: 'pending-translation',
    values: {
      'ru': `Агент не нашёл новых кандидатов.`,
    },
  },
  'ui.legacy.a74a042d812e': {
    source: `Вернитесь к исходному экрану, скорректируйте выражение и запустите Core снова.`,
    status: 'pending-translation',
    values: {
      'ru': `Вернитесь к исходному экрану, скорректируйте выражение и запустите Core снова.`,
    },
  },
  'ui.legacy.a8b956452e0a': {
    source: `Введите хотя бы название или функцию для подсказки агенту!`,
    status: 'pending-translation',
    values: {
      'ru': `Введите хотя бы название или функцию для подсказки агенту!`,
    },
  },
  'ui.legacy.a9ddf413b73f': {
    source: `Учитывайте ограничение GitHub Pages`,
    status: 'pending-translation',
    values: {
      'ru': `Учитывайте ограничение GitHub Pages`,
    },
  },
  'ui.legacy.aac3f9831165': {
    source: `Копировать показанные логи в буфер`,
    status: 'pending-translation',
    values: {
      'ru': `Копировать показанные логи в буфер`,
    },
  },
  'ui.legacy.ad23602a4bcc': {
    source: `Проверьте health endpoint`,
    status: 'pending-translation',
    values: {
      'ru': `Проверьте health endpoint`,
    },
  },
  'ui.legacy.add4fe8028fc': {
    source: `Заполнить или дополнить карточку с помощью ИИ-агента Gemini`,
    status: 'pending-translation',
    values: {
      'ru': `Заполнить или дополнить карточку с помощью ИИ-агента Gemini`,
    },
  },
  'ui.legacy.aefc9da6417c': {
    source: `Жесткость пружин (k)', 'Spring Stiffness (k)`,
    status: 'pending-translation',
    values: {
      'ru': `Жесткость пружин (k)', 'Spring Stiffness (k)`,
    },
  },
  'ui.legacy.af5abbac1f80': {
    source: `Развернуть левую панель`,
    status: 'pending-translation',
    values: {
      'ru': `Развернуть левую панель`,
    },
  },
  'ui.legacy.b1ddf7a78431': {
    source: `min-w-0 flex-1"><span className="block text-[9px] font-mono uppercase tracking-wider text-cyan-400">Выбранная задача</span><span className="block truncate text-xs font-bold`,
    status: 'pending-translation',
    values: {
      'ru': `min-w-0 flex-1"><span className="block text-[9px] font-mono uppercase tracking-wider text-cyan-400">Выбранная задача</span><span className="block truncate text-xs font-bold`,
    },
  },
  'ui.legacy.b3753e011f34': {
    source: `должен содержать единое переиспользуемое содержимое для SettingsModal`,
    status: 'pending-translation',
    values: {
      'ru': `должен содержать единое переиспользуемое содержимое для SettingsModal`,
    },
  },
  'ui.legacy.b618fcfe1952': {
    source: `Формальное описание, аксиоматический путь или пошаговый вывод...`,
    status: 'pending-translation',
    values: {
      'ru': `Формальное описание, аксиоматический путь или пошаговый вывод...`,
    },
  },
  'ui.legacy.b7d8c785efe3': {
    source: `Проверка ниже определит, доступен ли Core runtime без запуска вычисления.`,
    status: 'pending-translation',
    values: {
      'ru': `Проверка ниже определит, доступен ли Core runtime без запуска вычисления.`,
    },
  },
  'ui.legacy.bb29d6304e9b': {
    source: `Инструменты и настройки`,
    status: 'pending-translation',
    values: {
      'ru': `Инструменты и настройки`,
    },
  },
  'ui.legacy.bb9d20da06b4': {
    source: `success', label: '✓ Успех`,
    status: 'pending-translation',
    values: {
      'ru': `success', label: '✓ Успех`,
    },
  },
  'ui.legacy.bcbb7990fd09': {
    source: `Предустановки:`,
    status: 'pending-translation',
    values: {
      'ru': `Предустановки:`,
    },
  },
  'ui.legacy.bee27f3fe747': {
    source: `info', label: 'ℹ Инфо`,
    status: 'pending-translation',
    values: {
      'ru': `info', label: 'ℹ Инфо`,
    },
  },
  'ui.legacy.bee73ea493c9': {
    source: `должен создавать холст панорамы с туманностями и фоновым звездным шумом`,
    status: 'pending-translation',
    values: {
      'ru': `должен создавать холст панорамы с туманностями и фоновым звездным шумом`,
    },
  },
  'ui.legacy.c02936f72e9f': {
    source: `Производная / аудит приоритета`,
    status: 'pending-translation',
    values: {
      'ru': `Производная / аудит приоритета`,
    },
  },
  'ui.legacy.c2aeca6c7866': {
    source: `Копировать Lean 4 код`,
    status: 'pending-translation',
    values: {
      'ru': `Копировать Lean 4 код`,
    },
  },
  'ui.legacy.c4376ad5c178': {
    source: `Копировать шаги вычисления в буфер`,
    status: 'pending-translation',
    values: {
      'ru': `Копировать шаги вычисления в буфер`,
    },
  },
  'ui.legacy.c49f06c5cf88': {
    source: `Проверка ниже обращается только к health endpoint и не запускает TypeScript fallback.`,
    status: 'pending-translation',
    values: {
      'ru': `Проверка ниже обращается только к health endpoint и не запускает TypeScript fallback.`,
    },
  },
  'ui.legacy.c4c3aea7ee36': {
    source: `найди формулу сам`,
    status: 'pending-translation',
    values: {
      'ru': `найди формулу сам`,
    },
  },
  'ui.legacy.c4eade20ae39': {
    source: `Кнопка ниже выполняет только health-check C# runtime и не запускает fallback.`,
    status: 'pending-translation',
    values: {
      'ru': `Кнопка ниже выполняет только health-check C# runtime и не запускает fallback.`,
    },
  },
  'ui.legacy.c5c98baad9d0': {
    source: `например, 0_3 * inf_4 = 12 или \\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2}`,
    status: 'pending-translation',
    values: {
      'ru': `например, 0_3 * inf_4 = 12 или \\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2}`,
    },
  },
  'ui.legacy.c5cbffd68e9e': {
    source: `Требует исследования`,
    status: 'pending-translation',
    values: {
      'ru': `Требует исследования`,
    },
  },
  'ui.legacy.c693bc775dc8': {
    source: `материалы небесного купола должны иметь depthWrite = false и BackSide`,
    status: 'pending-translation',
    values: {
      'ru': `материалы небесного купола должны иметь depthWrite = false и BackSide`,
    },
  },
  'ui.legacy.c85cb8e0bd2b': {
    source: `available' && 'Ricis.Core сообщил ready status. Вернитесь к карте и повторите расчёт.`,
    status: 'pending-translation',
    values: {
      'ru': `available' && 'Ricis.Core сообщил ready status. Вернитесь к карте и повторите расчёт.`,
    },
  },
  'ui.legacy.c97c2aceb777': {
    source: `Это контекстный промпт, описывающий логическую цепь решения проблемы до корневых узлов в системе RICIS-III. Выведены полные доказательства и шаги решения, координаты графа исключены.`,
    status: 'pending-translation',
    values: {
      'ru': `Это контекстный промпт, описывающий логическую цепь решения проблемы до корневых узлов в системе RICIS-III. Выведены полные доказательства и шаги решения, координаты графа исключены.`,
    },
  },
  'ui.legacy.cb50b3829183': {
    source: `например, Разрешение 0_3 * inf_4 или Задача Эйлера`,
    status: 'pending-translation',
    values: {
      'ru': `например, Разрешение 0_3 * inf_4 или Задача Эйлера`,
    },
  },
  'ui.legacy.cece69f0ee7e': {
    source: `Выбранная задача' : 'Начните с задачи`,
    status: 'pending-translation',
    values: {
      'ru': `Выбранная задача' : 'Начните с задачи`,
    },
  },
  'ui.legacy.d43a90368006': {
    source: `three_dimensional' ? 'Список' : '3D`,
    status: 'pending-translation',
    values: {
      'ru': `three_dimensional' ? 'Список' : '3D`,
    },
  },
  'ui.legacy.d43f5c5d9673': {
    source: `Используйте поддерживаемую грамматику`,
    status: 'pending-translation',
    values: {
      'ru': `Используйте поддерживаемую грамматику`,
    },
  },
  'ui.legacy.d5b17c14f72b': {
    source: `Макро-пузыри (Зоны)', 'Macro Bubbles (Zones)`,
    status: 'pending-translation',
    values: {
      'ru': `Макро-пузыри (Зоны)', 'Macro Bubbles (Zones)`,
    },
  },
  'ui.legacy.d5df80264b25': {
    source: `Отключить управление наклоном' : 'Включить управление наклоном`,
    status: 'pending-translation',
    values: {
      'ru': `Отключить управление наклоном' : 'Включить управление наклоном`,
    },
  },
  'ui.legacy.d63461dceeee': {
    source: `flex items-center gap-1.5 shrink-0" title="Статус ИИ-Агента`,
    status: 'pending-translation',
    values: {
      'ru': `flex items-center gap-1.5 shrink-0" title="Статус ИИ-Агента`,
    },
  },
  'ui.legacy.d7c125cc0ae7': {
    source: `lean4', label: 'Lean 4 Спецификация`,
    status: 'pending-translation',
    values: {
      'ru': `lean4', label: 'Lean 4 Спецификация`,
    },
  },
  'ui.legacy.da94b6b05dc9': {
    source: `Редактировать параметры задачи`,
    status: 'pending-translation',
    values: {
      'ru': `Редактировать параметры задачи`,
    },
  },
  'ui.legacy.daa7a1f93e34': {
    source: `>Задача</span>`,
    status: 'pending-translation',
    values: {
      'ru': `>Задача</span>`,
    },
  },
  'ui.legacy.dab53104a084': {
    source: `Переключить между 3D-картой и доступным списком`,
    status: 'pending-translation',
    values: {
      'ru': `Переключить между 3D-картой и доступным списком`,
    },
  },
  'ui.legacy.dcd6d634461d': {
    source: `Ответ Ricis.Core не прошёл проверку`,
    status: 'pending-translation',
    values: {
      'ru': `Ответ Ricis.Core не прошёл проверку`,
    },
  },
  'ui.legacy.dd7cc306beaa': {
    source: `Требуется evidence Core / Lean`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Требуется evidence Core / Lean`,
      'fr-CA': `Nécessite une preuve Core / Lean`,
      'de-DE': `Erfordert Core/Lean-Evidence`,
      'hi-IN': `Core / Lean प्रमाण आवश्यक`,
      'ms-MY': `Memerlukan bukti Core/Lean`,
    },
  },
  'ui.legacy.ddfdf6d517b0': {
    source: `button" onClick={() => setTaskPanelMode('open')} className="hidden md:inline-flex absolute right-2 top-2 z-30 min-h-10 min-w-9 items-center justify-center gap-1 rounded-md border border-cyan-700/70 bg-[#07121c]/95 px-1.5 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.18)] transition-colors hover:bg-cyan-900/80 hover:text-white" aria-label="Развернуть правую панель задачи" title="Развернуть правую панель задачи`,
    status: 'pending-translation',
    values: {
      'ru': `button" onClick={() => setTaskPanelMode('open')} className="hidden md:inline-flex absolute right-2 top-2 z-30 min-h-10 min-w-9 items-center justify-center gap-1 rounded-md border border-cyan-700/70 bg-[#07121c]/95 px-1.5 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.18)] transition-colors hover:bg-cyan-900/80 hover:text-white" aria-label="Развернуть правую панель задачи" title="Развернуть правую панель задачи`,
    },
  },
  'ui.legacy.e204302dcd70': {
    source: `Заменить или отредактировать Lean 4 доказательство для обучения Агента`,
    status: 'pending-translation',
    values: {
      'ru': `Заменить или отредактировать Lean 4 доказательство для обучения Агента`,
    },
  },
  'ui.legacy.e2d145b7deb5': {
    source: `Выберите узел или включите фильтр фиолетовых`,
    status: 'pending-translation',
    values: {
      'ru': `Выберите узел или включите фильтр фиолетовых`,
    },
  },
  'ui.legacy.e3f4a4c31d9a': {
    source: `Мин. зазор (узлы)" prop="minNodeSurfaceGap`,
    status: 'pending-translation',
    values: {
      'ru': `Мин. зазор (узлы)" prop="minNodeSurfaceGap`,
    },
  },
  'ui.legacy.e50a50fb9fe3': {
    source: `например, https://doi.org/10.5281/zenodo.17872755`,
    status: 'pending-translation',
    values: {
      'ru': `например, https://doi.org/10.5281/zenodo.17872755`,
    },
  },
  'ui.legacy.e8388d7c8d56': {
    source: `3. Конфигурация трехмерных материалов для заднего плана (L0 Continuity)`,
    status: 'pending-translation',
    values: {
      'ru': `3. Конфигурация трехмерных материалов для заднего плана (L0 Continuity)`,
    },
  },
  'ui.legacy.e83e34b6dba3': {
    source: `Отталкивание масс (G)', 'Mass Repulsion (G)`,
    status: 'pending-translation',
    values: {
      'ru': `Отталкивание масс (G)', 'Mass Repulsion (G)`,
    },
  },
  'ui.legacy.e85bcc50231f': {
    source: `bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-300">G Зон: <strong className="text-emerald-400`,
    status: 'pending-translation',
    values: {
      'ru': `bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-300">G Зон: <strong className="text-emerald-400`,
    },
  },
  'ui.legacy.e922f1f64a90': {
    source: `three_dimensional' ? 'Режим списка' : '3D-карта`,
    status: 'pending-translation',
    values: {
      'ru': `three_dimensional' ? 'Режим списка' : '3D-карта`,
    },
  },
  'ui.legacy.ec0ab4544354': {
    source: `Выйти из полноэкранного режима' : 'Развернуть 3D на полный экран`,
    status: 'pending-translation',
    values: {
      'ru': `Выйти из полноэкранного режима' : 'Развернуть 3D на полный экран`,
    },
  },
  'ui.legacy.ed2bee29073d': {
    source: `*(Нет текста доказательства)*`,
    status: 'pending-translation',
    values: {
      'ru': `*(Нет текста доказательства)*`,
    },
  },
  'ui.legacy.ed4066279225': {
    source: `В работе...`,
    status: 'pending-translation',
    values: {
      'ru': `В работе...`,
    },
  },
  'ui.legacy.ed5b28087d71': {
    source: `Сохранить настройки физики для автозагрузки при старте`,
    status: 'pending-translation',
    values: {
      'ru': `Сохранить настройки физики для автозагрузки при старте`,
    },
  },
  'ui.legacy.edf4b432e786': {
    source: `ai-authorship-provenance' || node.title.toLowerCase().includes('авторств') || node.type === 'derivative_claim`,
    status: 'pending-translation',
    values: {
      'ru': `ai-authorship-provenance' || node.title.toLowerCase().includes('авторств') || node.type === 'derivative_claim`,
    },
  },
  'ui.legacy.ee7575e90f1e': {
    source: `Микро-узлы (Задачи)', 'Micro Nodes (Problems)`,
    status: 'pending-translation',
    values: {
      'ru': `Микро-узлы (Задачи)', 'Micro Nodes (Problems)`,
    },
  },
  'ui.legacy.f0b086028eb0': {
    source: `Свернуть правую панель`,
    status: 'pending-translation',
    values: {
      'ru': `Свернуть правую панель`,
    },
  },
  'ui.legacy.f0baf2ad0262': {
    source: `Точный инвариант RICIS-III`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Точный инвариант RICIS-III`,
      'fr-CA': `Invariant exact RICIS-III`,
      'de-DE': `Exaktes RICIS-III-Invariant`,
      'hi-IN': `सटीक RICIS-III इनवेरिएंट`,
      'ms-MY': `Invarian tepat RICIS-III`,
    },
  },
  'ui.legacy.f32a4124bb27': {
    source: `Строка вида 0_5 * inf_3 не является lambda-входом C# Core и не будет автоматически преобразована TypeScript-кодом.`,
    status: 'pending-translation',
    values: {
      'ru': `Строка вида 0_5 * inf_3 не является lambda-входом C# Core и не будет автоматически преобразована TypeScript-кодом.`,
    },
  },
  'ui.legacy.f4e8f4ad6be8': {
    source: `Нет фиолетовых узлов для экспорта`,
    status: 'pending-translation',
    values: {
      'ru': `Нет фиолетовых узлов для экспорта`,
    },
  },
  'ui.legacy.f5f4bd63124d': {
    source: `Ошибка поиска: `,
    status: 'pending-translation',
    values: {
      'ru': `Ошибка поиска: `,
    },
  },
  'ui.legacy.f6dab074d7bb': {
    source: `Назад`,
    status: 'pending-translation',
    values: {
      'ru': `Назад`,
    },
  },
  'ui.legacy.f7679eb225d7': {
    source: `Экспорт только производных / priority-audit узлов (derivative_claim, фиолетовые). Фильтр «только фиолетовые» активен. Координаты графа исключены.`,
    status: 'pending-translation',
    values: {
      'ru': `Экспорт только производных / priority-audit узлов (derivative_claim, фиолетовые). Фильтр «только фиолетовые» активен. Координаты графа исключены.`,
    },
  },
  'ui.legacy.f7760bb308f2': {
    source: `В локальном режиме убедитесь, что Ricis.WebApi запущен. В развернутой среде передайте администратору безопасную диагностику.`,
    status: 'pending-translation',
    values: {
      'ru': `В локальном режиме убедитесь, что Ricis.WebApi запущен. В развернутой среде передайте администратору безопасную диагностику.`,
    },
  },
  'ui.legacy.f8097b3e8f61': {
    source: `Перерассчитать доказательство (RICIS-III)`,
    status: 'pending-translation',
    values: {
      'ru': `Перерассчитать доказательство (RICIS-III)`,
    },
  },
  'ui.legacy.f8e7ea218bde': {
    source: `Инициализация агента RICIS-III...`,
    status: 'pending-translation',
    values: {
      'ru': `Инициализация агента RICIS-III...`,
    },
  },
  'ui.legacy.f95d6023c8a9': {
    source: `Доступная карта задач RICIS-III`,
    status: 'pending-translation',
    values: {
      'ru': `Доступная карта задач RICIS-III`,
    },
  },
  'ui.legacy.f991677ce943': {
    source: `Перейти к узлу`,
    status: 'pending-translation',
    values: {
      'ru': `Перейти к узлу`,
    },
  },
  'ui.legacy.fa1bf80a8c1f': {
    source: `Инфраструктура Ricis.Core не завершила запрос. Результат не вычислялся.`,
    status: 'pending-translation',
    values: {
      'ru': `Инфраструктура Ricis.Core не завершила запрос. Результат не вычислялся.`,
    },
  },
  'ui.legacy.fb3d82f98b20': {
    source: `Скопируйте summary: он содержит только код, точку вызова и время, без выражения, токенов и stack trace.`,
    status: 'pending-translation',
    values: {
      'ru': `Скопируйте summary: он содержит только код, точку вызова и время, без выражения, токенов и stack trace.`,
    },
  },
  'ui.legacy.fbb9a96c1344': {
    source: `должен содержать чекбокс-триггер аккордеона и заголовок`,
    status: 'pending-translation',
    values: {
      'ru': `должен содержать чекбокс-триггер аккордеона и заголовок`,
    },
  },
  'ui.legacy.fc7f79afe045': {
    source: `unavailable' && 'Health endpoint пока не подтвердил доступность Core. TypeScript fallback по-прежнему не используется.`,
    status: 'pending-translation',
    values: {
      'ru': `unavailable' && 'Health endpoint пока не подтвердил доступность Core. TypeScript fallback по-прежнему не используется.`,
    },
  },
  'ui.legacy.fc88953cfa44': {
    source: `Сборка контекста и аксиом из стека связей...`,
    status: 'pending-translation',
    values: {
      'ru': `Сборка контекста и аксиом из стека связей...`,
    },
  },
  'ui.legacy.feafdb8f42ae': {
    source: `Приложение намеренно не создало математический результат, trace или proof из неполного Core payload.`,
    status: 'pending-translation',
    values: {
      'ru': `Приложение намеренно не создало математический результат, trace или proof из неполного Core payload.`,
    },
  },
  'ui.legacy.ff530a0e8ee4': {
    source: `lean') || tLower.includes('доказательств') || tLower.includes('верификац`,
    status: 'pending-translation',
    values: {
      'ru': `lean') || tLower.includes('доказательств') || tLower.includes('верификац`,
    },
  },
};
