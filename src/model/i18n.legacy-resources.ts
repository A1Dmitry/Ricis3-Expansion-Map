import type { SupportedLocale } from './i18n.types';

export type LegacyResourceStatus = 'pending-translation' | 'translated-from-existing-resource';
export interface LegacyResourceEntry {
  readonly source: string;
  readonly status: LegacyResourceStatus;
  readonly values: Partial<Record<SupportedLocale, string>>;
}

/** Generated inventory of legacy phrases; existing translations are reused DRY-style. */
export const LEGACY_RESOURCE_CATALOG: Readonly<Record<string, LegacyResourceEntry>> = {
  'runtime.legacy.008a00a71f6c': {
    source: `Темная материя`,
    status: 'pending-translation',
    values: {
      'ru': `Темная материя`,
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
  'runtime.legacy.00b2941fafc1': {
    source: `не задана`,
    status: 'pending-translation',
    values: {
      'ru': `не задана`,
    },
  },
  'runtime.legacy.00eb787fb0bc': {
    source: `Сингулярность предельного перехода [0/0] или [inf/inf], устранённая аксиомами SP1-SP4`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность предельного перехода [0/0] или [inf/inf], устранённая аксиомами SP1-SP4`,
    },
  },
  'runtime.legacy.012369fdf9c1': {
    source: `Formalize(Фазовыепереходывторогорода)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Фазовыепереходывторогорода)`,
    },
  },
  'runtime.legacy.014e90d8d4b3': {
    source: `Сингулярность Понци (экспоненциальный рост до обрыва).`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность Понци (экспоненциальный рост до обрыва).`,
    },
  },
  'runtime.legacy.016caaecb720': {
    source: `Фазовые переходы Эрдёша — Реньи.`,
    status: 'pending-translation',
    values: {
      'ru': `Фазовые переходы Эрдёша — Реньи.`,
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
  'runtime.legacy.027ecdd6c017': {
    source: `Гипотеза Бёрча — Свиннертон-Дайера`,
    status: 'pending-translation',
    values: {
      'ru': `Гипотеза Бёрча — Свиннертон-Дайера`,
    },
  },
  'runtime.legacy.029e45c11103': {
    source: `Каждое односвязное компактное 3D многообразие гомеоморфно сфере.`,
    status: 'pending-translation',
    values: {
      'ru': `Каждое односвязное компактное 3D многообразие гомеоморфно сфере.`,
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
  'runtime.legacy.034572d0cf58': {
    source: `Голографический принцип`,
    status: 'pending-translation',
    values: {
      'ru': `Голографический принцип`,
    },
  },
  'runtime.legacy.036fe4a1fe01': {
    source: `Бесконечная кривизна пространства-времени.`,
    status: 'pending-translation',
    values: {
      'ru': `Бесконечная кривизна пространства-времени.`,
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
  'runtime.legacy.04f6f47a4f68': {
    source: `Взаимодействие бактерий и организма.`,
    status: 'pending-translation',
    values: {
      'ru': `Взаимодействие бактерий и организма.`,
    },
  },
  'runtime.legacy.052eff562e10': {
    source: `• \`/stats\` — описание статусов доверия результата.\\n`,
    status: 'pending-translation',
    values: {
      'ru': `• \`/stats\` — описание статусов доверия результата.\\n`,
    },
  },
  'runtime.legacy.05775030bf6c': {
    source: `должен немедленно сбрасывать значения к defaults и очищать таймеры при reset()`,
    status: 'pending-translation',
    values: {
      'ru': `должен немедленно сбрасывать значения к defaults и очищать таймеры при reset()`,
    },
  },
  'runtime.legacy.05a842c01672': {
    source: `Экзистенциальный риск`,
    status: 'pending-translation',
    values: {
      'ru': `Экзистенциальный риск`,
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
  'runtime.legacy.070f2413bd8f': {
    source: `Formalize(Сингулярностивнелинейнойоптике)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Сингулярностивнелинейнойоптике)`,
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
  'runtime.legacy.07c1ead42b97': {
    source: `Отправьте запрос: \`/solve (x^2-4)/(x-2) при x=2\`\\n\\n`,
    status: 'pending-translation',
    values: {
      'ru': `Отправьте запрос: \`/solve (x^2-4)/(x-2) при x=2\`\\n\\n`,
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
  'runtime.legacy.09ea6ec42d52': {
    source: `Применять RICIS-III с явной границей доверия результата.`,
    status: 'pending-translation',
    values: {
      'ru': `Применять RICIS-III с явной границей доверия результата.`,
    },
  },
  'runtime.legacy.0b2b4e5f0a98': {
    source: `Сворачивание матрицы смежности графа через побитовый AND и POPCNT в вырожденный битовый профиль кольца Мерсенна за O(V).`,
    status: 'pending-translation',
    values: {
      'ru': `Сворачивание матрицы смежности графа через побитовый AND и POPCNT в вырожденный битовый профиль кольца Мерсенна за O(V).`,
    },
  },
  'runtime.legacy.0b2faf8173bc': {
    source: `Фрактальная изломанность.`,
    status: 'pending-translation',
    values: {
      'ru': `Фрактальная изломанность.`,
    },
  },
  'runtime.legacy.0b3147b26728': {
    source: `Внешний Lean source зафиксирован без замены.`,
    status: 'pending-translation',
    values: {
      'ru': `Внешний Lean source зафиксирован без замены.`,
    },
  },
  'runtime.legacy.0b9636cab58f': {
    source: `Точки, где градиент дисперсии равен нулю.`,
    status: 'pending-translation',
    values: {
      'ru': `Точки, где градиент дисперсии равен нулю.`,
    },
  },
  'runtime.legacy.0baa3378b913': {
    source: `Formalize(СингулярностьИИ)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(СингулярностьИИ)`,
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
  'runtime.legacy.0bbe8106af67': {
    source: `Сингулярность: {{value}}`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Сингулярность: {{value}}`,
      'fr-CA': `Singularité : {{value}}`,
      'de-DE': `Singularität: {{value}}`,
      'hi-IN': `सिंगुलैरिटी: {{value}}`,
      'ms-MY': `Singulariti: {{value}}`,
    },
  },
  'runtime.legacy.0c5155bd1c44': {
    source: `Остановка машины Тьюринга`,
    status: 'pending-translation',
    values: {
      'ru': `Остановка машины Тьюринга`,
    },
  },
  'runtime.legacy.0c5f736cd656': {
    source: `Formalize(АттракторЛоренца)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(АттракторЛоренца)`,
    },
  },
  'runtime.legacy.0d050ce523c8': {
    source: `Бесконечный цикл (временная расходимость).`,
    status: 'pending-translation',
    values: {
      'ru': `Бесконечный цикл (временная расходимость).`,
    },
  },
  'runtime.legacy.0d4a7c5d90ed': {
    source: `Formalize(Геометрияфракталов)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Геометрияфракталов)`,
    },
  },
  'runtime.legacy.0d5411684f19': {
    source: `Новых апроприаций монолитов не выявлено.`,
    status: 'pending-translation',
    values: {
      'ru': `Новых апроприаций монолитов не выявлено.`,
    },
  },
  'runtime.legacy.0d57aac4439b': {
    source: `Научная проблема`,
    status: 'pending-translation',
    values: {
      'ru': `Научная проблема`,
    },
  },
  'runtime.legacy.0d7eb86243ff': {
    source: `Сингулярности плотности состояний (уровни Ландау).`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярности плотности состояний (уровни Ландау).`,
    },
  },
  'runtime.legacy.0d8e411a83b8': {
    source: `Formalize(Микробиомчеловека)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Микробиомчеловека)`,
    },
  },
  'runtime.legacy.0df6a043a2b5': {
    source: `Квантовая химия, молекулярная динамика.`,
    status: 'pending-translation',
    values: {
      'ru': `Квантовая химия, молекулярная динамика.`,
    },
  },
  'runtime.legacy.0dfab80d1699': {
    source: `Нелинейное уравнение Шредингера`,
    status: 'pending-translation',
    values: {
      'ru': `Нелинейное уравнение Шредингера`,
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
  'runtime.legacy.0e4b71d8bb3e': {
    source: `).replace(/^задача от @\\\\\\\\w+:\\\\\\\\s*/i, `,
    status: 'pending-translation',
    values: {
      'ru': `).replace(/^задача от @\\\\\\\\w+:\\\\\\\\s*/i, `,
    },
  },
  'runtime.legacy.0e7a237478db': {
    source: `должен обнаруживать неиспользуемые/устаревшие файлы и дублирование логики в кодовой базе`,
    status: 'pending-translation',
    values: {
      'ru': `должен обнаруживать неиспользуемые/устаревшие файлы и дублирование логики в кодовой базе`,
    },
  },
  'runtime.legacy.0e8ac5e2f7ae': {
    source: `Шаги: {{value}}`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Шаги: {{value}}`,
      'fr-CA': `Étapes : {{value}}`,
      'de-DE': `Schritte: {{value}}`,
      'hi-IN': `चरण: {{value}}`,
      'ms-MY': `Langkah: {{value}}`,
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
  'runtime.legacy.0edf0ea106fc': {
    source: `должен корректно находить все узлы, которые зависят от решения текущей задачи`,
    status: 'pending-translation',
    values: {
      'ru': `должен корректно находить все узлы, которые зависят от решения текущей задачи`,
    },
  },
  'runtime.legacy.0f10754e3d32': {
    source: `Подтверждение стабильного инварианта O(1) без амнезии`,
    status: 'pending-translation',
    values: {
      'ru': `Подтверждение стабильного инварианта O(1) без амнезии`,
    },
  },
  'runtime.legacy.0f3bd5d47daf': {
    source: `Проверка академического протокола`,
    status: 'pending-translation',
    values: {
      'ru': `Проверка академического протокола`,
    },
  },
  'runtime.legacy.0f646c455917': {
    source: `Классификация особенностей кривых на плоскости.`,
    status: 'pending-translation',
    values: {
      'ru': `Классификация особенностей кривых на плоскости.`,
    },
  },
  'runtime.legacy.0f997aa0f71f': {
    source: `Модель Блэка — Шоулза`,
    status: 'pending-translation',
    values: {
      'ru': `Модель Блэка — Шоулза`,
    },
  },
  'runtime.legacy.0fe6a2c850af': {
    source: `Пример: \`/solve (sin(x))/x при x=0\`\\n\\n`,
    status: 'pending-translation',
    values: {
      'ru': `Пример: \`/solve (sin(x))/x при x=0\`\\n\\n`,
    },
  },
  'runtime.legacy.0ffcbf9bf56c': {
    source: `формул`,
    status: 'pending-translation',
    values: {
      'ru': `формул`,
    },
  },
  'runtime.legacy.1019dfdd2259': {
    source: `Гипотеза Ходжа`,
    status: 'pending-translation',
    values: {
      'ru': `Гипотеза Ходжа`,
    },
  },
  'runtime.legacy.112bcde1b24c': {
    source: `Логический парадокс (самореференция).`,
    status: 'pending-translation',
    values: {
      'ru': `Логический парадокс (самореференция).`,
    },
  },
  'runtime.legacy.112db5786249': {
    source: `Преодоление P vs NP (Детерминированный анализ Мерсенна)`,
    status: 'pending-translation',
    values: {
      'ru': `Преодоление P vs NP (Детерминированный анализ Мерсенна)`,
    },
  },
  'runtime.legacy.119d86462fb6': {
    source: `неустойчивость при ε-возмущении индекса`,
    status: 'pending-translation',
    values: {
      'ru': `неустойчивость при ε-возмущении индекса`,
    },
  },
  'runtime.legacy.11aac242ae2c': {
    source: `Существование и гладкость решений уравнений Навье-Стокса в 3D.`,
    status: 'pending-translation',
    values: {
      'ru': `Существование и гладкость решений уравнений Навье-Стокса в 3D.`,
    },
  },
  'runtime.legacy.11cda117df57': {
    source: `теория сингулярности|`,
    status: 'pending-translation',
    values: {
      'ru': `теория сингулярности|`,
    },
  },
  'runtime.legacy.11f0f98a62ea': {
    source: `Моральный выбор ИИ.`,
    status: 'pending-translation',
    values: {
      'ru': `Моральный выбор ИИ.`,
    },
  },
  'runtime.legacy.11f6fd936d98': {
    source: `Климатические модели, устойчивое развитие.`,
    status: 'pending-translation',
    values: {
      'ru': `Климатические модели, устойчивое развитие.`,
    },
  },
  'runtime.legacy.123ec561c423': {
    source: `Formalize(Квантоваяошибка)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Квантоваяошибка)`,
    },
  },
  'runtime.legacy.12de8bc2738e': {
    source: `Механизм купратных сверхпроводников.`,
    status: 'pending-translation',
    values: {
      'ru': `Механизм купратных сверхпроводников.`,
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
  'runtime.legacy.1366075a13a7': {
    source: `Синтез лекарств под геном.`,
    status: 'pending-translation',
    values: {
      'ru': `Синтез лекарств под геном.`,
    },
  },
  'runtime.legacy.13ff874ce30f': {
    source: `Formalize(Сингулярностивтеорииструн)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Сингулярностивтеорииструн)`,
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
  'runtime.legacy.1442f84ce938': {
    source: `Formalize(Регенерациятканей)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Регенерациятканей)`,
    },
  },
  'runtime.legacy.146e0b0e1097': {
    source: `\\\\text{RICIS Мост } F_0`,
    status: 'pending-translation',
    values: {
      'ru': `\\\\text{RICIS Мост } F_0`,
    },
  },
  'runtime.legacy.1549f1570ce4': {
    source: `Теломеры и предел Хейфлика`,
    status: 'pending-translation',
    values: {
      'ru': `Теломеры и предел Хейфлика`,
    },
  },
  'runtime.legacy.159e5e475cf5': {
    source: `Точечный источник магнитного поля.`,
    status: 'pending-translation',
    values: {
      'ru': `Точечный источник магнитного поля.`,
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
  'runtime.legacy.16ba71171e25': {
    source: `RICIS-III v7.7 Analytical Engine готов к работе.`,
    status: 'pending-translation',
    values: {
      'ru': `RICIS-III v7.7 Analytical Engine готов к работе.`,
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
  'runtime.legacy.17d0c986f532': {
    source: `Структурный RICIS-черновик для сингулярности {{value}}. Lean kernel evidence не приложен и требуется отдельно.`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Структурный RICIS-черновик для сингулярности {{value}}. Lean kernel evidence не приложен и требуется отдельно.`,
      'fr-CA': `Ébauche RICIS structurelle pour la singularité {{value}}. La preuve du Lean kernel n'est pas jointe et doit être fournie séparément.`,
      'de-DE': `Struktureller RICIS-Entwurf für Singularität {{value}}. Der Nachweis des Lean-Kernels ist nicht angehängt und muss separat erbracht werden.`,
      'hi-IN': `सिंगुलैरिटी {{value}} के लिए संरचनात्मक RICIS ड्राफ्ट। Lean kernel का प्रमाण संलग्न नहीं है और अलग से आवश्यक है।`,
      'ms-MY': `Draf RICIS struktur untuk singulariti {{value}}. Bukti Lean kernel tidak dilampirkan dan diperlukan secara berasingan.`,
    },
  },
  'runtime.legacy.17df68e6c1f6': {
    source: `Ранг эллиптической кривой и порядок нуля L-функции.`,
    status: 'pending-translation',
    values: {
      'ru': `Ранг эллиптической кривой и порядок нуля L-функции.`,
    },
  },
  'runtime.legacy.17e3712d0c24': {
    source: `Гипотеза: {{value}}`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Гипотеза: {{value}}`,
      'fr-CA': `Hypothèse : {{value}}`,
      'de-DE': `Hypothese: {{value}}`,
      'hi-IN': `परिकल्पना: {{value}}`,
      'ms-MY': `Hipotesis: {{value}}`,
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
  'runtime.legacy.18315db117ae': {
    source: `Запущен рекурсивный авто-резолвер задач графа...`,
    status: 'pending-translation',
    values: {
      'ru': `Запущен рекурсивный авто-резолвер задач графа...`,
    },
  },
  'runtime.legacy.190fedfeaf76': {
    source: `Formalize(Проблемаделителейнулявгрупповыхкольцах)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Проблемаделителейнулявгрупповыхкольцах)`,
    },
  },
  'runtime.legacy.19b09c9cd5e1': {
    source: `решен`,
    status: 'pending-translation',
    values: {
      'ru': `решен`,
    },
  },
  'runtime.legacy.19b7bab6754e': {
    source: `Сбой распознавания свой-чужой.`,
    status: 'pending-translation',
    values: {
      'ru': `Сбой распознавания свой-чужой.`,
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
  'runtime.legacy.1d2151ce314f': {
    source: `ИТОГ: {{value}} (локальный RICIS-результат; Lean kernel evidence требуется отдельно)`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `ИТОГ: {{value}} (локальный RICIS-результат; Lean kernel evidence требуется отдельно)`,
      'fr-CA': `CONCLUSION : {{value}} (résultat RICIS local ; preuve du Lean kernel requise séparément)`,
      'de-DE': `SCHLUSSFOLGERUNG: {{value}} (lokales RICIS-Ergebnis; Nachweis des Lean-Kernels ist separat erforderlich)`,
      'hi-IN': `निष्कर्ष: {{value}} (स्थानीय RICIS परिणाम; Lean kernel का प्रमाण अलग से आवश्यक है)`,
      'ms-MY': `KESIMPULAN: {{value}} (keputusan RICIS tempatan; bukti Lean kernel diperlukan secara berasingan)`,
    },
  },
  'runtime.legacy.1dd1ba94bba7': {
    source: `Бесконечная изрезанность (сингулярность границы).`,
    status: 'pending-translation',
    values: {
      'ru': `Бесконечная изрезанность (сингулярность границы).`,
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
  'runtime.legacy.1e1c76d7c8e8': {
    source: `Formalize(Магнитныемонополи)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Магнитныемонополи)`,
    },
  },
  'runtime.legacy.1e1ca843fb52': {
    source: `Ограничения формальных систем.`,
    status: 'pending-translation',
    values: {
      'ru': `Ограничения формальных систем.`,
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
  'runtime.legacy.1f747fcb2066': {
    source: `Экономические пузыри`,
    status: 'pending-translation',
    values: {
      'ru': `Экономические пузыри`,
    },
  },
  'runtime.legacy.2038da2d05b2': {
    source: `Фокус на поиске, зонах и доступных задачах`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Фокус на поиске, зонах и доступных задачах`,
      'fr-CA': `Focalisé sur la recherche, les zones et les problèmes disponibles`,
      'de-DE': `Fokus auf Suche, Zonen und verfügbare Aufgaben`,
      'hi-IN': `खोज, क्षेत्रों और उपलब्ध समस्याओं पर ध्यान केंद्रित`,
      'ms-MY': `Fokus pada carian, zon dan masalah tersedia`,
    },
  },
  'runtime.legacy.2093711d4385': {
    source: `Семантика, LLM-инварианты.`,
    status: 'pending-translation',
    values: {
      'ru': `Семантика, LLM-инварианты.`,
    },
  },
  'runtime.legacy.2146322d7620': {
    source: `Локальная статическая проверка пройдена, но Lean kernel/toolchain не запускался. Статус остаётся REQUIRES_CORE_LEAN.`,
    status: 'pending-translation',
    values: {
      'ru': `Локальная статическая проверка пройдена, но Lean kernel/toolchain не запускался. Статус остаётся REQUIRES_CORE_LEAN.`,
    },
  },
  'runtime.legacy.214ce2b503f4': {
    source: `Нейросети забывают старое при обучении новому.`,
    status: 'pending-translation',
    values: {
      'ru': `Нейросети забывают старое при обучении новому.`,
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
  'runtime.legacy.219087d2fd5e': {
    source: ` объединена в `,
    status: 'pending-translation',
    values: {
      'ru': ` объединена в `,
    },
  },
  'runtime.legacy.21939b8220ea': {
    source: `Сингулярность волатильности при t->T.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность волатильности при t->T.`,
    },
  },
  'runtime.legacy.21e1dcf88eb8': {
    source: `Formalize(Вагонетка(TrolleyProblem))`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Вагонетка(TrolleyProblem))`,
    },
  },
  'runtime.legacy.221597307553': {
    source: `Экономика`,
    status: 'pending-translation',
    values: {
      'ru': `Экономика`,
    },
  },
  'runtime.legacy.22e59a98ca9d': {
    source: `Formalize(СингулярностивуравненияхЭйнштейна)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(СингулярностивуравненияхЭйнштейна)`,
    },
  },
  'runtime.legacy.235e86d8a966': {
    source: `Стандартный баланс элементов`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Стандартный баланс элементов`,
      'fr-CA': `Équilibre par défaut des éléments`,
      'de-DE': `Standardmäßige Aufteilung der Elemente`,
      'hi-IN': `डिफ़ॉल्ट तत्व संतुलन`,
      'ms-MY': `Imbangan elemen lalai`,
    },
  },
  'runtime.legacy.23633a918503': {
    source: `Персонализированная медицина`,
    status: 'pending-translation',
    values: {
      'ru': `Персонализированная медицина`,
    },
  },
  'runtime.legacy.23fae71cbc20': {
    source: `Мозговые интерфейсы (BCI)`,
    status: 'pending-translation',
    values: {
      'ru': `Мозговые интерфейсы (BCI)`,
    },
  },
  'runtime.legacy.24ec8ec92847': {
    source: `Устаревшие функции проверки (auditMap, findDisconnectedComponents) дублируют логику DependencyGraphAuditor v7.7.`,
    status: 'pending-translation',
    values: {
      'ru': `Устаревшие функции проверки (auditMap, findDisconnectedComponents) дублируют логику DependencyGraphAuditor v7.7.`,
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
  'runtime.legacy.268435089110': {
    source: `Formalize(КатастрофыТома)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(КатастрофыТома)`,
    },
  },
  'runtime.legacy.26c9963a60c8': {
    source: `Поведение потока Риччи в точках формирования сингулярности.`,
    status: 'pending-translation',
    values: {
      'ru': `Поведение потока Риччи в точках формирования сингулярности.`,
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
  'runtime.legacy.27df8a5dab17': {
    source: `Точка сингулярности / расходимости пределов`,
    status: 'pending-translation',
    values: {
      'ru': `Точка сингулярности / расходимости пределов`,
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
  'runtime.legacy.27e8d4a6e7ee': {
    source: `).replace(/\\\\s*при\\\\s*$/i, `,
    status: 'pending-translation',
    values: {
      'ru': `).replace(/\\\\s*при\\\\s*$/i, `,
    },
  },
  'runtime.legacy.27ef19b5ed67': {
    source: `Теорема Геделя о неполноте`,
    status: 'pending-translation',
    values: {
      'ru': `Теорема Геделя о неполноте`,
    },
  },
  'runtime.legacy.281c22f93ed2': {
    source: `Скрытая масса во Вселенной.`,
    status: 'pending-translation',
    values: {
      'ru': `Скрытая масса во Вселенной.`,
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
  'runtime.legacy.28f255170f4a': {
    source: `Алгоритмическая неразрешимость.`,
    status: 'pending-translation',
    values: {
      'ru': `Алгоритмическая неразрешимость.`,
    },
  },
  'runtime.legacy.2932416a4bfa': {
    source: `Запустить вычисление (Enter)`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Запустить вычисление (Enter)`,
      'fr-CA': `Lancer le calcul (Entrée)`,
      'de-DE': `Berechnung starten (Enter)`,
      'hi-IN': `गणना चलाएँ (Enter)`,
      'ms-MY': `Jalankan pengiraan (Enter)`,
    },
  },
  'runtime.legacy.296e753b97f9': {
    source: `Онтологическая фиксация входной системы`,
    status: 'pending-translation',
    values: {
      'ru': `Онтологическая фиксация входной системы`,
    },
  },
  'runtime.legacy.298fcacb89ac': {
    source: `Маска стороны квадрата B`,
    status: 'pending-translation',
    values: {
      'ru': `Маска стороны квадрата B`,
    },
  },
  'runtime.legacy.29916a0fb50c': {
    source: `Исходник зафиксирован без замены агентом`,
    status: 'pending-translation',
    values: {
      'ru': `Исходник зафиксирован без замены агентом`,
    },
  },
  'runtime.legacy.29d1dbd08df7': {
    source: `Оптимальные пределы O(N log N).`,
    status: 'pending-translation',
    values: {
      'ru': `Оптимальные пределы O(N log N).`,
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
  'runtime.legacy.2d841fdb2d85': {
    source: `Фокус на симуляции физики и быстрых действиях`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Фокус на симуляции физики и быстрых действиях`,
      'fr-CA': `Focalisé sur la simulation physique et les actions rapides`,
      'de-DE': `Fokus auf Physiksimulation und schnelle Aktionen`,
      'hi-IN': `भौतिकी सिमुलेशन और त्वरित क्रियाओं पर ध्यान दें`,
      'ms-MY': `Fokus pada simulasi fizik dan tindakan cepat`,
    },
  },
  'runtime.legacy.2e01e2ab0dce': {
    source: `Сквозной поведенческий аудит и юнит-тест "Свертка вырожденной геометрии (5 и 2)" для выявления неявного использования авторских алгоритмов RICIS-III в весах LLM.\\n\\n• Проблема "Черного ящика": Промпты, препринты и промежуточный код усваиваются корпоративными платформами. Юридический копирайт строк кода уступает место защите логических цепочек мышления.\\n• Юнит-тест "Свертка вырожденной геометрии (5 и 2)": В 2D-пространстве пересекаются бесконечная полоса шириной 2 (вдоль Y) и вырожденный прямоугольник со значимой стороной 5 (вдоль Y, 0 по X).\\n  - Классический анализ по осям: X = 2×0 = 0, Y = ∞×5 = ∞ → Area = 0 × ∞ = NaN (сбой системы / тупик).\\n  - RICIS-III векторное перемножение: S_vec = (2, ∞)^T, R_vec = (0, 5)^T → Area = ||S_x · R_y|| = 2 × 5 = 10 [O(1)] с полным сохранением provenance.\\n• Пошаговый алгоритм фиксации доказательной базы:\\n  1. Digital Provenance (Zenodo, arXiv, Figshare, DOI)\\n  2. Логирование сессий (JSON-логи ИИ-студий с временными метками)\\n  3. Метод динамической блокировки (Абляция / Attention Masking)`,
    status: 'pending-translation',
    values: {
      'ru': `Сквозной поведенческий аудит и юнит-тест "Свертка вырожденной геометрии (5 и 2)" для выявления неявного использования авторских алгоритмов RICIS-III в весах LLM.\\n\\n• Проблема "Черного ящика": Промпты, препринты и промежуточный код усваиваются корпоративными платформами. Юридический копирайт строк кода уступает место защите логических цепочек мышления.\\n• Юнит-тест "Свертка вырожденной геометрии (5 и 2)": В 2D-пространстве пересекаются бесконечная полоса шириной 2 (вдоль Y) и вырожденный прямоугольник со значимой стороной 5 (вдоль Y, 0 по X).\\n  - Классический анализ по осям: X = 2×0 = 0, Y = ∞×5 = ∞ → Area = 0 × ∞ = NaN (сбой системы / тупик).\\n  - RICIS-III векторное перемножение: S_vec = (2, ∞)^T, R_vec = (0, 5)^T → Area = ||S_x · R_y|| = 2 × 5 = 10 [O(1)] с полным сохранением provenance.\\n• Пошаговый алгоритм фиксации доказательной базы:\\n  1. Digital Provenance (Zenodo, arXiv, Figshare, DOI)\\n  2. Логирование сессий (JSON-логи ИИ-студий с временными метками)\\n  3. Метод динамической блокировки (Абляция / Attention Masking)`,
    },
  },
  'runtime.legacy.2e220f48a22b': {
    source: `Проблема Варинга`,
    status: 'pending-translation',
    values: {
      'ru': `Проблема Варинга`,
    },
  },
  'runtime.legacy.2e5991c81fad': {
    source: `Вырожденные критические точки.`,
    status: 'pending-translation',
    values: {
      'ru': `Вырожденные критические точки.`,
    },
  },
  'runtime.legacy.2e6198a367ea': {
    source: `📦 *Извлечено из локальной базы знаний*\\n\\n`,
    status: 'pending-translation',
    values: {
      'ru': `📦 *Извлечено из локальной базы знаний*\\n\\n`,
    },
  },
  'runtime.legacy.2f2347ef2a41': {
    source: `Шаги локальной RICIS-цепочки:`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Шаги локальной RICIS-цепочки:`,
      'fr-CA': `Étapes de la chaîne RICIS locale:`,
      'de-DE': `Schritte der lokalen RICIS-Kette:`,
      'hi-IN': `लोकल RICIS-चेन के चरण:`,
      'ms-MY': `Langkah rantaian RICIS tempatan:`,
    },
  },
  'runtime.legacy.2f7627af9e37': {
    source: `Фазовые переходы второго рода`,
    status: 'pending-translation',
    values: {
      'ru': `Фазовые переходы второго рода`,
    },
  },
  'runtime.legacy.2fbb65edcd42': {
    source: `Formalize(ТеоремаЭрроуоневозможности)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(ТеоремаЭрроуоневозможности)`,
    },
  },
  'runtime.legacy.2fc711fce223': {
    source: `Поосный тупик [0 * inf = NaN] vs Ортогональная свертка векторного монолита [2 * 5 = 10]`,
    status: 'pending-translation',
    values: {
      'ru': `Поосный тупик [0 * inf = NaN] vs Ортогональная свертка векторного монолита [2 * 5 = 10]`,
    },
  },
  'runtime.legacy.306b6a9ab04d': {
    source: `Теория Сингулярности`,
    status: 'pending-translation',
    values: {
      'ru': `Теория Сингулярности`,
    },
  },
  'runtime.legacy.316e782e5511': {
    source: `Разрешение особенностей Хиронаки`,
    status: 'pending-translation',
    values: {
      'ru': `Разрешение особенностей Хиронаки`,
    },
  },
  'runtime.legacy.317cdab24ce2': {
    source: `Сложность сортировки`,
    status: 'pending-translation',
    values: {
      'ru': `Сложность сортировки`,
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
  'runtime.legacy.32fee22a7932': {
    source: `Топологические препятствия.`,
    status: 'pending-translation',
    values: {
      'ru': `Топологические препятствия.`,
    },
  },
  'runtime.legacy.330c0a66727d': {
    source: `Логарифмическая расходимость при низких температурах.`,
    status: 'pending-translation',
    values: {
      'ru': `Логарифмическая расходимость при низких температурах.`,
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
  'runtime.legacy.336190f0c664': {
    source: `Притяжение проводящих пластин в вакууме.`,
    status: 'pending-translation',
    values: {
      'ru': `Притяжение проводящих пластин в вакууме.`,
    },
  },
  'runtime.legacy.34118049947f': {
    source: `при недоступном Core не подменяет геометрический мост fallback-вычислением`,
    status: 'pending-translation',
    values: {
      'ru': `при недоступном Core не подменяет геометрический мост fallback-вычислением`,
    },
  },
  'runtime.legacy.347bc6004613': {
    source: `объект ITransformationLogDTO должен корректно хранить шаги истории`,
    status: 'pending-translation',
    values: {
      'ru': `объект ITransformationLogDTO должен корректно хранить шаги истории`,
    },
  },
  'runtime.legacy.34c6ce9ffc4a': {
    source: `Странный аттрактор в хаотических системах.`,
    status: 'pending-translation',
    values: {
      'ru': `Странный аттрактор в хаотических системах.`,
    },
  },
  'runtime.legacy.3564f7106205': {
    source: `Гомологические группы.`,
    status: 'pending-translation',
    values: {
      'ru': `Гомологические группы.`,
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
  'runtime.legacy.35b31bd4d290': {
    source: `Двунаправленное встречное схождение R_start и R_end с блокировкой подтуров (R_start & R_end == 0) и полным заполнением R_start | R_end == 2^V - 1.`,
    status: 'pending-translation',
    values: {
      'ru': `Двунаправленное встречное схождение R_start и R_end с блокировкой подтуров (R_start & R_end == 0) и полным заполнением R_start | R_end == 2^V - 1.`,
    },
  },
  'runtime.legacy.3621a9b50337': {
    source: `Formalize(Парадоксбраев)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Парадоксбраев)`,
    },
  },
  'runtime.legacy.36475bc4ecb7': {
    source: `1. Граф обратных связей (getUnlockedTargets)`,
    status: 'pending-translation',
    values: {
      'ru': `1. Граф обратных связей (getUnlockedTargets)`,
    },
  },
  'runtime.legacy.365c06b525a1': {
    source: `Перенести это решение на 3D карту в виде нового узла`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Перенести это решение на 3D карту в виде нового узла`,
      'fr-CA': `Transférer cette solution sur la carte 3D en tant que nouveau nœud`,
      'de-DE': `Diese Lösung als neuen Knoten auf die 3D-Karte übertragen`,
      'hi-IN': `इस समाधान को नए नोड के रूप में 3D मानचित्र पर स्थानांतरित करें`,
      'ms-MY': `Pindahkan penyelesaian ini ke peta 3D sebagai nod baru`,
    },
  },
  'runtime.legacy.367359a9aa4f': {
    source: `Formalize(Онкогенез)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Онкогенез)`,
    },
  },
  'runtime.legacy.36880cbf95e3': {
    source: `Formalize(ОсобенностидифференциальныхуравненийПенлеве)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(ОсобенностидифференциальныхуравненийПенлеве)`,
    },
  },
  'runtime.legacy.368d9e79aa5e': {
    source: `Недифференцируемая, но всюду непрерывная функция.`,
    status: 'pending-translation',
    values: {
      'ru': `Недифференцируемая, но всюду непрерывная функция.`,
    },
  },
  'runtime.legacy.36b01435ec4b': {
    source: `Formalize(Алгоритмыконсенсуса)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Алгоритмыконсенсуса)`,
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
  'runtime.legacy.36f0e82fc430': {
    source: `Особенности пространства модулей инстантонов.`,
    status: 'pending-translation',
    values: {
      'ru': `Особенности пространства модулей инстантонов.`,
    },
  },
  'runtime.legacy.3799f4a341a8': {
    source: `Эффект Казимира`,
    status: 'pending-translation',
    values: {
      'ru': `Эффект Казимира`,
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
  'runtime.legacy.37f9c6ec7e4b': {
    source: `Квантовая когомология`,
    status: 'pending-translation',
    values: {
      'ru': `Квантовая когомология`,
    },
  },
  'runtime.legacy.38299ca1a995': {
    source: `Инварианты Дональдсона`,
    status: 'pending-translation',
    values: {
      'ru': `Инварианты Дональдсона`,
    },
  },
  'runtime.legacy.3934769069ac': {
    source: `Сингулярности алгебраических многообразий.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярности алгебраических многообразий.`,
    },
  },
  'runtime.legacy.3984a06b6b7c': {
    source: `Топологические изоляторы`,
    status: 'pending-translation',
    values: {
      'ru': `Топологические изоляторы`,
    },
  },
  'runtime.legacy.3987e999462d': {
    source: `Устойчивость к антибиотикам`,
    status: 'pending-translation',
    values: {
      'ru': `Устойчивость к антибиотикам`,
    },
  },
  'runtime.legacy.39a1ffaf4ea2': {
    source: `Представление чисел суммой k-х степеней.`,
    status: 'pending-translation',
    values: {
      'ru': `Представление чисел суммой k-х степеней.`,
    },
  },
  'runtime.legacy.39d177540592': {
    source: `Внешний Lean source сохранён неизменным; до kernel run он не является trusted axiom.`,
    status: 'pending-translation',
    values: {
      'ru': `Внешний Lean source сохранён неизменным; до kernel run он не является trusted axiom.`,
    },
  },
  'runtime.legacy.3a09590347f6': {
    source: `Гипотеза Пуанкаре`,
    status: 'pending-translation',
    values: {
      'ru': `Гипотеза Пуанкаре`,
    },
  },
  'runtime.legacy.3a331a0be5ad': {
    source: `Особенности дифференциальных уравнений Пенлеве`,
    status: 'pending-translation',
    values: {
      'ru': `Особенности дифференциальных уравнений Пенлеве`,
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
  'runtime.legacy.3aba93a7ae47': {
    source: `Сингулярность горизонта событий.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность горизонта событий.`,
    },
  },
  'runtime.legacy.3acfb9fb39eb': {
    source: `Сквозной поведенческий аудит весов LLM для выявления скрытого использования фундаментальных алгоритмов RICIS-III. Юнит-тест свертки вырожденной геометрии (5 и 2): ||S_x * R_y|| = 2 * 5 = 10 [O(1)] вместо 0 * inf = NaN.`,
    status: 'pending-translation',
    values: {
      'ru': `Сквозной поведенческий аудит весов LLM для выявления скрытого использования фундаментальных алгоритмов RICIS-III. Юнит-тест свертки вырожденной геометрии (5 и 2): ||S_x * R_y|| = 2 * 5 = 10 [O(1)] вместо 0 * inf = NaN.`,
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
  'runtime.legacy.3ba6e048bb1a': {
    source: `Премия Института Клея $1,000,000 (Преодоление P vs NP)`,
    status: 'pending-translation',
    values: {
      'ru': `Премия Института Клея $1,000,000 (Преодоление P vs NP)`,
    },
  },
  'runtime.legacy.3ca3e2679f78': {
    source: `Formalize(Блокчейнфорк)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Блокчейнфорк)`,
    },
  },
  'runtime.legacy.3cb4fff70922': {
    source: `\\\\textbf{Формальная Lean 4 спецификация:}`,
    status: 'pending-translation',
    values: {
      'ru': `\\\\textbf{Формальная Lean 4 спецификация:}`,
    },
  },
  'runtime.legacy.3cfd50a7cada': {
    source: `Копировать текст теоремы`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Копировать текст теоремы`,
      'fr-CA': `Copier le texte du théorème`,
      'de-DE': `Text des Theorems kopieren`,
      'hi-IN': `थियोरम का पाठ कॉपी करें`,
      'ms-MY': `Salin teks teorem`,
    },
  },
  'runtime.legacy.3d0e40630f67': {
    source: `Присвоение семантического индекса вырожденному и бесконечному объектам`,
    status: 'pending-translation',
    values: {
      'ru': `Присвоение семантического индекса вырожденному и бесконечному объектам`,
    },
  },
  'runtime.legacy.3d6ab87f5a43': {
    source: `Аксиоматический движок v7.7`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Аксиоматический движок v7.7`,
      'fr-CA': `Moteur axiomatique v7.7`,
      'de-DE': `Axiomatischer Motor v7.7`,
      'hi-IN': `Axiomatic Engine v7.7`,
      'ms-MY': `Enjin aksiomatik v7.7`,
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
  'runtime.legacy.3e27d90da50e': {
    source: `Спектральная асимптотика`,
    status: 'pending-translation',
    values: {
      'ru': `Спектральная асимптотика`,
    },
  },
  'runtime.legacy.3e5cc40532b4': {
    source: `Вагонетка (Trolley Problem)`,
    status: 'pending-translation',
    values: {
      'ru': `Вагонетка (Trolley Problem)`,
    },
  },
  'runtime.legacy.3e809eba61b4': {
    source: `Локализация интерфейса`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Локализация интерфейса`,
      'fr-CA': `Localisation de l'interface`,
      'de-DE': `Lokalisierung der Benutzeroberfläche`,
      'hi-IN': `इंटरफ़ेस स्थानीयकरण`,
      'ms-MY': `Lokalisasi antara muka`,
    },
  },
  'runtime.legacy.3ea1a3ab0a23': {
    source: `поищи`,
    status: 'pending-translation',
    values: {
      'ru': `поищи`,
    },
  },
  'runtime.legacy.3ee936ef47f5': {
    source: `Сингулярность функции Вейерштрасса`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность функции Вейерштрасса`,
    },
  },
  'runtime.legacy.3eece68f7d69': {
    source: `Сферы науки`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Сферы науки`,
      'fr-CA': `Domaines scientifiques`,
      'de-DE': `Wissenschaftliche Bereiche`,
      'hi-IN': `वैज्ञानिक क्षेत्र`,
      'ms-MY': `Bidang sains`,
    },
  },
  'runtime.legacy.3f3287a6fe4f': {
    source: `Сингулярности резольвенты.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярности резольвенты.`,
    },
  },
  'runtime.legacy.3f8e8d0e0f6c': {
    source: `Невыпуклые ландшафты потерь.`,
    status: 'pending-translation',
    values: {
      'ru': `Невыпуклые ландшафты потерь.`,
    },
  },
  'runtime.legacy.3fec2c1894a2': {
    source: `Formalize(ГипотезаХоджа)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(ГипотезаХоджа)`,
    },
  },
  'runtime.legacy.400a4d436d46': {
    source: `Скопировать настройки текущего профиля`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Скопировать настройки текущего профиля`,
      'fr-CA': `Copier les paramètres du profil actuel`,
      'de-DE': `Aktuelle Profileinstellungen kopieren`,
      'hi-IN': `वर्तमान प्रोफ़ाइल सेटिंग्स कॉपी करें`,
      'ms-MY': `Salin tetapan profil semasa`,
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
  'runtime.legacy.410fefdc67ee': {
    source: `Неперенормируемые расходимости.`,
    status: 'pending-translation',
    values: {
      'ru': `Неперенормируемые расходимости.`,
    },
  },
  'runtime.legacy.4134215f3fbf': {
    source: `🔒 Для безопасности бот не принимает API-ключи и не использует общий пул ключей. `,
    status: 'pending-translation',
    values: {
      'ru': `🔒 Для безопасности бот не принимает API-ключи и не использует общий пул ключей. `,
    },
  },
  'runtime.legacy.413529971f2f': {
    source: `Formalize(ТеоремаобиндексеАтьиЗингера)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(ТеоремаобиндексеАтьиЗингера)`,
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
  'runtime.legacy.422d3fbc4bac': {
    source: `Черного ящика`,
    status: 'pending-translation',
    values: {
      'ru': `Черного ящика`,
    },
  },
  'runtime.legacy.42940b620ac4': {
    source: `наиди`,
    status: 'pending-translation',
    values: {
      'ru': `наиди`,
    },
  },
  'runtime.legacy.42e92c615135': {
    source: `Formalize(ТеорияМорса)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(ТеорияМорса)`,
    },
  },
  'runtime.legacy.4335416f74d9': {
    source: `Расходимость корреляционного радиуса.`,
    status: 'pending-translation',
    values: {
      'ru': `Расходимость корреляционного радиуса.`,
    },
  },
  'runtime.legacy.4339e62e8307': {
    source: `Избежание кристаллизации воды.`,
    status: 'pending-translation',
    values: {
      'ru': `Избежание кристаллизации воды.`,
    },
  },
  'runtime.legacy.43f1bb016db0': {
    source: `Если секрет уже был отправлен в чат, его следует немедленно отозвать у соответствующего провайдера.`,
    status: 'pending-translation',
    values: {
      'ru': `Если секрет уже был отправлен в чат, его следует немедленно отозвать у соответствующего провайдера.`,
    },
  },
  'runtime.legacy.43f9e47e7927': {
    source: `Гипотетические частицы с магнитным зарядом.`,
    status: 'pending-translation',
    values: {
      'ru': `Гипотетические частицы с магнитным зарядом.`,
    },
  },
  'runtime.legacy.44691277a4d7': {
    source: `Formalize(Случайныеграфы)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Случайныеграфы)`,
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
  'runtime.legacy.4622046ae0b5': {
    source: `Квантовая ошибка`,
    status: 'pending-translation',
    values: {
      'ru': `Квантовая ошибка`,
    },
  },
  'runtime.legacy.4625fe9805cf': {
    source: `Гарантия сохранения идентичности (L1) в сверхразумных системах.`,
    status: 'pending-translation',
    values: {
      'ru': `Гарантия сохранения идентичности (L1) в сверхразумных системах.`,
    },
  },
  'runtime.legacy.46851f94e687': {
    source: `Formalize(ГипотезаБёрчаСвиннертонДайера)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(ГипотезаБёрчаСвиннертонДайера)`,
    },
  },
  'runtime.legacy.46a56c2a2374': {
    source: `Взятое из классики решение не прогнано через RICIS-III. Чисто классическое решение с пределом \\\\lim не является полным.`,
    status: 'pending-translation',
    values: {
      'ru': `Взятое из классики решение не прогнано через RICIS-III. Чисто классическое решение с пределом \\\\lim не является полным.`,
    },
  },
  'runtime.legacy.46e84d8eff41': {
    source: `Formalize(Крионика)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Крионика)`,
    },
  },
  'runtime.legacy.47074b2e7788': {
    source: `Сингулярное Выравнивание`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярное Выравнивание`,
    },
  },
  'runtime.legacy.473fea79b610': {
    source: `выражен`,
    status: 'pending-translation',
    values: {
      'ru': `выражен`,
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
  'runtime.legacy.48b0ae910980': {
    source: `Катастрофы Тома`,
    status: 'pending-translation',
    values: {
      'ru': `Катастрофы Тома`,
    },
  },
  'runtime.legacy.48eef97803d0': {
    source: `уравнен`,
    status: 'pending-translation',
    values: {
      'ru': `уравнен`,
    },
  },
  'runtime.legacy.491f04713f32': {
    source: `Сингулярность дираковской струны`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность дираковской струны`,
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
  'runtime.legacy.4974b76b5bda': {
    source: `Степенной закон распределения (хвостовая расходимость).`,
    status: 'pending-translation',
    values: {
      'ru': `Степенной закон распределения (хвостовая расходимость).`,
    },
  },
  'runtime.legacy.49bd615df39b': {
    source: `Методы миграции схем дублируют канонические правила SP2/SP4.`,
    status: 'pending-translation',
    values: {
      'ru': `Методы миграции схем дублируют канонические правила SP2/SP4.`,
    },
  },
  'runtime.legacy.49f98e4a935c': {
    source: `3. Фиксация по таймауту бездействия (IDLE Event)`,
    status: 'pending-translation',
    values: {
      'ru': `3. Фиксация по таймауту бездействия (IDLE Event)`,
    },
  },
  'runtime.legacy.4a2ba5eab04f': {
    source: `Выполнить детерминированный прогон RICIS-III`,
    status: 'pending-translation',
    values: {
      'ru': `Выполнить детерминированный прогон RICIS-III`,
    },
  },
  'runtime.legacy.4a68ae1381b8': {
    source: `Премия Института Клея $1,000,000 (Гипотеза Ходжа)`,
    status: 'pending-translation',
    values: {
      'ru': `Премия Института Клея $1,000,000 (Гипотеза Ходжа)`,
    },
  },
  'runtime.legacy.4a69e834f885': {
    source: `Панель: Live Drawer`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Панель: Live Drawer`,
      'fr-CA': `Panneau : Live Drawer`,
      'de-DE': `Panel: Live Drawer`,
      'hi-IN': `पैनल: Live Drawer`,
      'ms-MY': `Panel: Live Drawer`,
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
  'runtime.legacy.4ae50d30739d': {
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
  'runtime.legacy.4b57d8f4b0ab': {
    source: `Сложность задачи изоморфизма графов (Побитовый спектральный трафарет)`,
    status: 'pending-translation',
    values: {
      'ru': `Сложность задачи изоморфизма графов (Побитовый спектральный трафарет)`,
    },
  },
  'runtime.legacy.4b69d6516784': {
    source: `Бесконечная плотность в t=0.`,
    status: 'pending-translation',
    values: {
      'ru': `Бесконечная плотность в t=0.`,
    },
  },
  'runtime.legacy.4c028af0ebd4': {
    source: `вырожденная геометрия`,
    status: 'pending-translation',
    values: {
      'ru': `вырожденная геометрия`,
    },
  },
  'runtime.legacy.4c3eef3cfaca': {
    source: `• \`RICIS_PROVEN\` — проверенный структурный RICIS-переход.\\n`,
    status: 'pending-translation',
    values: {
      'ru': `• \`RICIS_PROVEN\` — проверенный структурный RICIS-переход.\\n`,
    },
  },
  'runtime.legacy.4c7f9bdf8e30': {
    source: `Информационная граница дерева решений.`,
    status: 'pending-translation',
    values: {
      'ru': `Информационная граница дерева решений.`,
    },
  },
  'runtime.legacy.4da3c1cf8879': {
    source: `Агент API недоступен на статическом хостинге (GitHub Pages). `,
    status: 'pending-translation',
    values: {
      'ru': `Агент API недоступен на статическом хостинге (GitHub Pages). `,
    },
  },
  'runtime.legacy.4daf29600ac9': {
    source: `Эффект Кондо`,
    status: 'pending-translation',
    values: {
      'ru': `Эффект Кондо`,
    },
  },
  'runtime.legacy.4dc2952ec8b1': {
    source: `Дизайн молекул (Фармакология)`,
    status: 'pending-translation',
    values: {
      'ru': `Дизайн молекул (Фармакология)`,
    },
  },
  'runtime.legacy.4ee5809d510b': {
    source: `Сингулярность отображения 2^N в 2^M.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность отображения 2^N в 2^M.`,
    },
  },
  'runtime.legacy.4f271d368580': {
    source: `Расхождение цепи блоков.`,
    status: 'pending-translation',
    values: {
      'ru': `Расхождение цепи блоков.`,
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
  'runtime.legacy.50a415c04e51': {
    source: `Экология`,
    status: 'pending-translation',
    values: {
      'ru': `Экология`,
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
  'runtime.legacy.5128b530a834': {
    source: `Formalize(ГипотезаГольдбаха)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(ГипотезаГольдбаха)`,
    },
  },
  'runtime.legacy.5198f24eba48': {
    source: `Оптимизация гиперпараметров`,
    status: 'pending-translation',
    values: {
      'ru': `Оптимизация гиперпараметров`,
    },
  },
  'runtime.legacy.51c906403246': {
    source: `Formalize(Гематоэнцефалическийбарьер)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Гематоэнцефалическийбарьер)`,
    },
  },
  'runtime.legacy.51cd47d5b722': {
    source: `Биология`,
    status: 'pending-translation',
    values: {
      'ru': `Биология`,
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
  'runtime.legacy.5238a50826a2': {
    source: ` на строке \\\${top.line}, но встречена закрывающая `,
    status: 'pending-translation',
    values: {
      'ru': ` на строке \\\${top.line}, но встречена закрывающая `,
    },
  },
  'runtime.legacy.526279e08fd5': {
    source: `Сингулярности в полюсах (комплексная плоскость).`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярности в полюсах (комплексная плоскость).`,
    },
  },
  'runtime.legacy.5267be31f92b': {
    source: `Formalize(Темнаяматерия)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Темнаяматерия)`,
    },
  },
  'runtime.legacy.5280384113cb': {
    source: `Влияние векторного потенциала на фазу.`,
    status: 'pending-translation',
    values: {
      'ru': `Влияние векторного потенциала на фазу.`,
    },
  },
  'runtime.legacy.5337798c05ba': {
    source: `Пространства Конна.`,
    status: 'pending-translation',
    values: {
      'ru': `Пространства Конна.`,
    },
  },
  'runtime.legacy.53d43ccd63c2': {
    source: `NP-полные задачи (Детерминированный сетевой трафарет TSP/SAT)`,
    status: 'pending-translation',
    values: {
      'ru': `NP-полные задачи (Детерминированный сетевой трафарет TSP/SAT)`,
    },
  },
  'runtime.legacy.540f56e25128': {
    source: `Химия`,
    status: 'pending-translation',
    values: {
      'ru': `Химия`,
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
  'runtime.legacy.54d1ea4dff87': {
    source: `Асимптотическая плотность (арифметическая сингулярность).`,
    status: 'pending-translation',
    values: {
      'ru': `Асимптотическая плотность (арифметическая сингулярность).`,
    },
  },
  'runtime.legacy.55574c77299b': {
    source: `Formalize(ПроблемаВаринга)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(ПроблемаВаринга)`,
    },
  },
  'runtime.legacy.5567125f59f1': {
    source: `Ricis.Core вернул ответ, не соответствующий контракту.`,
    status: 'pending-translation',
    values: {
      'ru': `Ricis.Core вернул ответ, не соответствующий контракту.`,
    },
  },
  'runtime.legacy.5581b9928281': {
    source: `Сверхточная диагностика`,
    status: 'pending-translation',
    values: {
      'ru': `Сверхточная диагностика`,
    },
  },
  'runtime.legacy.559afcb36d2f': {
    source: `Масштабная инвариантность.`,
    status: 'pending-translation',
    values: {
      'ru': `Масштабная инвариантность.`,
    },
  },
  'runtime.legacy.55b48018bef3': {
    source: `Дочерний узел из persisted dependencyIds`,
    status: 'pending-translation',
    values: {
      'ru': `Дочерний узел из persisted dependencyIds`,
    },
  },
  'runtime.legacy.55baea085dd4': {
    source: `Сингулярность, зависящая от начальных условий.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность, зависящая от начальных условий.`,
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
  'runtime.legacy.569ddde55868': {
    source: `Formalize(Космическиеструны)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Космическиеструны)`,
    },
  },
  'runtime.legacy.56c901f94f06': {
    source: `Квазиполиномиальный тупик ликвидируется SIMD параллелизмом _mm256_cmpeq_epi32.`,
    status: 'pending-translation',
    values: {
      'ru': `Квазиполиномиальный тупик ликвидируется SIMD параллелизмом _mm256_cmpeq_epi32.`,
    },
  },
  'runtime.legacy.56dd52989702': {
    source: `Доказательство Lean 4 успешно сформировано`,
    status: 'pending-translation',
    values: {
      'ru': `Доказательство Lean 4 успешно сформировано`,
    },
  },
  'runtime.legacy.570a954f75f8': {
    source: `ИИ-Агент и Сервисы`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `ИИ-Агент и Сервисы`,
      'fr-CA': `Agent IA et services`,
      'de-DE': `KI-Agent & Dienste`,
      'hi-IN': `AI एजेंट और सेवाएँ`,
      'ms-MY': `Ejen AI & Perkhidmatan`,
    },
  },
  'runtime.legacy.5724a6e1c919': {
    source: `Тестовое сообщение RICIS`,
    status: 'pending-translation',
    values: {
      'ru': `Тестовое сообщение RICIS`,
    },
  },
  'runtime.legacy.574303ccf737': {
    source: `Описание объема через границу.`,
    status: 'pending-translation',
    values: {
      'ru': `Описание объема через границу.`,
    },
  },
  'runtime.legacy.574a7f8c3799': {
    source: `Мутации и рак.`,
    status: 'pending-translation',
    values: {
      'ru': `Мутации и рак.`,
    },
  },
  'runtime.legacy.5768ef259349': {
    source: `Дилемма заключенного`,
    status: 'pending-translation',
    values: {
      'ru': `Дилемма заключенного`,
    },
  },
  'runtime.legacy.5780201b8863': {
    source: `Formalize(Устойчивостькантибиотикам)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Устойчивостькантибиотикам)`,
    },
  },
  'runtime.legacy.578abd7474cd': {
    source: `Formalize(СингулярностиванХова)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(СингулярностиванХова)`,
    },
  },
  'runtime.legacy.57f20c10dd23': {
    source: `Топологический дефект вокруг монополя.`,
    status: 'pending-translation',
    values: {
      'ru': `Топологический дефект вокруг монополя.`,
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
  'runtime.legacy.59235d321704': {
    source: `Некоммутативная геометрия`,
    status: 'pending-translation',
    values: {
      'ru': `Некоммутативная геометрия`,
    },
  },
  'runtime.legacy.597c35bfb5b0': {
    source: `Локальное audit-valid доказательство`,
    status: 'pending-translation',
    values: {
      'ru': `Локальное audit-valid доказательство`,
    },
  },
  'runtime.legacy.599885a32c25': {
    source: `Криптографические хэш-функции`,
    status: 'pending-translation',
    values: {
      'ru': `Криптографические хэш-функции`,
    },
  },
  'runtime.legacy.59b52d799c81': {
    source: `Ядро: RICIS-III v7.7`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Ядро: RICIS-III v7.7`,
      'fr-CA': `Core: RICIS-III v7.7`,
      'de-DE': `Core: RICIS-III v7.7`,
      'hi-IN': `Core: RICIS-III v7.7`,
      'ms-MY': `Core: RICIS-III v7.7`,
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
  'runtime.legacy.5b5a5a6a212c': {
    source: `Коллапс волновой функции.`,
    status: 'pending-translation',
    values: {
      'ru': `Коллапс волновой функции.`,
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
  'runtime.legacy.5ca3270e2176': {
    source: `Одномерные топологические дефекты.`,
    status: 'pending-translation',
    values: {
      'ru': `Одномерные топологические дефекты.`,
    },
  },
  'runtime.legacy.5d1b711d4bb8': {
    source: `Сингулярные симплексы.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярные симплексы.`,
    },
  },
  'runtime.legacy.5d7475a2a0ef': {
    source: `Formalize(Квантоваязапутанностьикротовыеноры)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Квантоваязапутанностьикротовыеноры)`,
    },
  },
  'runtime.legacy.5e21b0de67e9': {
    source: `Унитарность квантовой механики при испарении черной дыры.`,
    status: 'pending-translation',
    values: {
      'ru': `Унитарность квантовой механики при испарении черной дыры.`,
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
  'runtime.legacy.5e757e13371e': {
    source: `Formalize(ЭффектКазимира)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(ЭффектКазимира)`,
    },
  },
  'runtime.legacy.5e94c3c0cf74': {
    source: `Сингулярность деления клетки (смерть).`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность деления клетки (смерть).`,
    },
  },
  'runtime.legacy.5ea195a062a9': {
    source: `Топологический барьер (непроницаемость).`,
    status: 'pending-translation',
    values: {
      'ru': `Топологический барьер (непроницаемость).`,
    },
  },
  'runtime.legacy.5f4ab1d1e69f': {
    source: `Нобелевская премия (Квантовый эффект Холла)`,
    status: 'pending-translation',
    values: {
      'ru': `Нобелевская премия (Квантовый эффект Холла)`,
    },
  },
  'runtime.legacy.5f916a291797': {
    source: `Formalize(МеханизмыпамятииАльцгеймер)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(МеханизмыпамятииАльцгеймер)`,
    },
  },
  'runtime.legacy.60bd9c778157': {
    source: `Название профиля:`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Название профиля:`,
      'fr-CA': `Nom du profil :`,
      'de-DE': `Profilname:`,
      'hi-IN': `प्रोफ़ाइल का नाम:`,
      'ms-MY': `Nama profil:`,
    },
  },
  'runtime.legacy.617d9f8e118f': {
    source: `Старение клеток.`,
    status: 'pending-translation',
    values: {
      'ru': `Старение клеток.`,
    },
  },
  'runtime.legacy.61cc8c3cdcc4': {
    source: `Свертка вырожденной геометрии (5 и 2)`,
    status: 'pending-translation',
    values: {
      'ru': `Свертка вырожденной геометрии (5 и 2)`,
    },
  },
  'runtime.legacy.62179cf0dc85': {
    source: `Лингвистика`,
    status: 'pending-translation',
    values: {
      'ru': `Лингвистика`,
    },
  },
  'runtime.legacy.622574d5164d': {
    source: `Выкл`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Выкл`,
      'fr-CA': `Désactivé`,
      'de-DE': `Aus`,
      'hi-IN': `बंद`,
      'ms-MY': `Mati`,
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
  'runtime.legacy.6260623c4924': {
    source: `Formalize(Проблемакатастрофическогозабывания)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Проблемакатастрофическогозабывания)`,
    },
  },
  'runtime.legacy.62684b4d249c': {
    source: `Особые точки алгебраических кривых`,
    status: 'pending-translation',
    values: {
      'ru': `Особые точки алгебраических кривых`,
    },
  },
  'runtime.legacy.62cfebefee90': {
    source: `Индексация сингулярностей порождающими выражениями`,
    status: 'pending-translation',
    values: {
      'ru': `Индексация сингулярностей порождающими выражениями`,
    },
  },
  'runtime.legacy.62d7af3e56b1': {
    source: `Восстановление органов.`,
    status: 'pending-translation',
    values: {
      'ru': `Восстановление органов.`,
    },
  },
  'runtime.legacy.62dfd0c343d4': {
    source: `Formalize(РаспределениебогатстваПарето)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(РаспределениебогатстваПарето)`,
    },
  },
  'runtime.legacy.6306b0da5be7': {
    source: `Создать новый`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Создать новый`,
      'fr-CA': `Créer nouveau`,
      'de-DE': `Neu erstellen`,
      'hi-IN': `नया बनाएँ`,
      'ms-MY': `Buat baru`,
    },
  },
  'runtime.legacy.635ea713be36': {
    source: `Formalize(Некоммутативнаягеометрия)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Некоммутативнаягеометрия)`,
    },
  },
  'runtime.legacy.639f6c572342': {
    source: `Formalize(Особыеточкиалгебраическихкривых)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Особыеточкиалгебраическихкривых)`,
    },
  },
  'runtime.legacy.63bfc6399e82': {
    source: `Сингулярность кривизны на линии.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность кривизны на линии.`,
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
  'runtime.legacy.64c11803cc51': {
    source: `Ортогональность интеллекта и целей.`,
    status: 'pending-translation',
    values: {
      'ru': `Ортогональность интеллекта и целей.`,
    },
  },
  'runtime.legacy.64cc62348de4': {
    source: `Сингулярность будущего (Большой разрыв).`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность будущего (Большой разрыв).`,
    },
  },
  'runtime.legacy.653e311094c6': {
    source: `Итоговый локальный инвариант: {{value}} (требуется Core/Lean evidence)`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Итоговый локальный инвариант: {{value}} (требуется Core/Lean evidence)`,
      'fr-CA': `Invariant local final : {{value}} (preuve Core/Lean requise)`,
      'de-DE': `Endgültiges lokales Invariant: {{value}} (Core/Lean-Nachweis erforderlich)`,
      'hi-IN': `अंतिम स्थानीय इनवेरियंट: {{value}} (Core/Lean प्रमाण आवश्यक)`,
      'ms-MY': `Invarian tempatan akhir: {{value}} (bukti Core/Lean diperlukan)`,
    },
  },
  'runtime.legacy.656c6a277a2f': {
    source: `Formalize(Квазикристаллы)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Квазикристаллы)`,
    },
  },
  'runtime.legacy.6644ef7ef023': {
    source: `Formalize(Экономическиепузыри)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Экономическиепузыри)`,
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
  'runtime.legacy.667ced6bbcdc': {
    source: `Неоптимальное равновесие Нэша.`,
    status: 'pending-translation',
    values: {
      'ru': `Неоптимальное равновесие Нэша.`,
    },
  },
  'runtime.legacy.6785ff025ac8': {
    source: `Formalize(Мозговыеинтерфейсы(BCI))`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Мозговыеинтерфейсы(BCI))`,
    },
  },
  'runtime.legacy.67dd316d045e': {
    source: `Производная функции потерь стремится к бесконечности.`,
    status: 'pending-translation',
    values: {
      'ru': `Производная функции потерь стремится к бесконечности.`,
    },
  },
  'runtime.legacy.67dee89ccf72': {
    source: `Нижняя граница сложности вычисления.`,
    status: 'pending-translation',
    values: {
      'ru': `Нижняя граница сложности вычисления.`,
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
  'runtime.legacy.68c7d65ebc97': {
    source: `Премия Института Клея $1,000,000 (3D Navier-Stokes)`,
    status: 'pending-translation',
    values: {
      'ru': `Премия Института Клея $1,000,000 (3D Navier-Stokes)`,
    },
  },
  'runtime.legacy.695d0e22a1ed': {
    source: `Фазовый переход образования льда.`,
    status: 'pending-translation',
    values: {
      'ru': `Фазовый переход образования льда.`,
    },
  },
  'runtime.legacy.696fedcebf7a': {
    source: `Равенство классов P и NP (Детерминированный Мерсенновский анализ)`,
    status: 'pending-translation',
    values: {
      'ru': `Равенство классов P и NP (Детерминированный Мерсенновский анализ)`,
    },
  },
  'runtime.legacy.699364a44359': {
    source: `Совпадение целей AGI с человеческими.`,
    status: 'pending-translation',
    values: {
      'ru': `Совпадение целей AGI с человеческими.`,
    },
  },
  'runtime.legacy.69944682e0da': {
    source: `Проблема вакуумной энергии.`,
    status: 'pending-translation',
    values: {
      'ru': `Проблема вакуумной энергии.`,
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
  'runtime.legacy.6a832013e722': {
    source: `сингулярность 0/0|`,
    status: 'pending-translation',
    values: {
      'ru': `сингулярность 0/0|`,
    },
  },
  'runtime.legacy.6aebdc187b9e': {
    source: `должен безопасно очищать слушатели и таймеры при dispose()`,
    status: 'pending-translation',
    values: {
      'ru': `должен безопасно очищать слушатели и таймеры при dispose()`,
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
  'runtime.legacy.6b4c42800af3': {
    source: `Formalize(СингулярностьБольшоговзрыва)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(СингулярностьБольшоговзрыва)`,
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
  'runtime.legacy.6c4178f144c7': {
    source: `Детерминированное сведение NP к P через вырожденный векторный каркас Psi(X)=Const и циклическое кольцо Мерсенна M = 2^k - 1 без перебора.`,
    status: 'pending-translation',
    values: {
      'ru': `Детерминированное сведение NP к P через вырожденный векторный каркас Psi(X)=Const и циклическое кольцо Мерсенна M = 2^k - 1 без перебора.`,
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
  'runtime.legacy.6d02394f9801': {
    source: `сам`,
    status: 'pending-translation',
    values: {
      'ru': `сам`,
    },
  },
  'runtime.legacy.6d1233be63d7': {
    source: `Обнаружено выражение '0/0'. По закону L1C2 и аксиоме A3, нули должны иметь индексацию происхождения (например, 0_F / 0_G) для избежания сингулярности.`,
    status: 'pending-translation',
    values: {
      'ru': `Обнаружено выражение '0/0'. По закону L1C2 и аксиоме A3, нули должны иметь индексацию происхождения (например, 0_F / 0_G) для избежания сингулярности.`,
    },
  },
  'runtime.legacy.6e23cee9cbed': {
    source: `Объединение ОТО и квантовой механики.`,
    status: 'pending-translation',
    values: {
      'ru': `Объединение ОТО и квантовой механики.`,
    },
  },
  'runtime.legacy.6e3b887202b1': {
    source: `Formalize(Псевдодифференциальныеоператоры)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Псевдодифференциальныеоператоры)`,
    },
  },
  'runtime.legacy.6ed040188bce': {
    source: `Formalize(ИнвариантыДональдсона)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(ИнвариантыДональдсона)`,
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
  'runtime.legacy.6f478ccf8d07': {
    source: `Алгебраическое сокращение идентичных факторов ДО сингулярности`,
    status: 'pending-translation',
    values: {
      'ru': `Алгебраическое сокращение идентичных факторов ДО сингулярности`,
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
  'runtime.legacy.7061932b288e': {
    source: `Размерность Хаусдорфа.`,
    status: 'pending-translation',
    values: {
      'ru': `Размерность Хаусдорфа.`,
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
  'runtime.legacy.715374381240': {
    source: `Непрерывные аппроксимации устранены. Произведен переход к точечным дискретным инвариантам Eval_RICIS.`,
    status: 'pending-translation',
    values: {
      'ru': `Непрерывные аппроксимации устранены. Произведен переход к точечным дискретным инвариантам Eval_RICIS.`,
    },
  },
  'runtime.legacy.71b14e0fa640': {
    source: `Formalize(Информационныйпарадоксчерныхдыр)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Информационныйпарадоксчерныхдыр)`,
    },
  },
  'runtime.legacy.71d7dbeed628': {
    source: `Порядок нуля в критической точке.`,
    status: 'pending-translation',
    values: {
      'ru': `Порядок нуля в критической точке.`,
    },
  },
  'runtime.legacy.71fa7715f74d': {
    source: `Цель AGI`,
    status: 'pending-translation',
    values: {
      'ru': `Цель AGI`,
    },
  },
  'runtime.legacy.72aecd9ad856': {
    source: `Ошибка`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Ошибка`,
      'fr-CA': `Erreur`,
      'de-DE': `Fehler`,
      'hi-IN': `त्रुटि`,
      'ms-MY': `Ralat`,
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
  'runtime.legacy.734478b53115': {
    source: `Начальное состояние Вселенной.`,
    status: 'pending-translation',
    values: {
      'ru': `Начальное состояние Вселенной.`,
    },
  },
  'runtime.legacy.741766fb57df': {
    source: `Блокчейн-форк`,
    status: 'pending-translation',
    values: {
      'ru': `Блокчейн-форк`,
    },
  },
  'runtime.legacy.741b09b467c0': {
    source: `Доказательство авторства ИИ-идей: Алгебра геометрических сингулярностей`,
    status: 'pending-translation',
    values: {
      'ru': `Доказательство авторства ИИ-идей: Алгебра геометрических сингулярностей`,
    },
  },
  'runtime.legacy.7456aabfc1a8': {
    source: `Управление экспрессией генов.`,
    status: 'pending-translation',
    values: {
      'ru': `Управление экспрессией генов.`,
    },
  },
  'runtime.legacy.745c181e2640': {
    source: `Formalize(СингулярныевозмущенияДУ)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(СингулярныевозмущенияДУ)`,
    },
  },
  'runtime.legacy.7563b62f8800': {
    source: `Существует ли нетривиальное инвариантное подпространство?`,
    status: 'pending-translation',
    values: {
      'ru': `Существует ли нетривиальное инвариантное подпространство?`,
    },
  },
  'runtime.legacy.756e4d63906a': {
    source: `не использует общий пул ключей`,
    status: 'pending-translation',
    values: {
      'ru': `не использует общий пул ключей`,
    },
  },
  'runtime.legacy.762cc12530ec': {
    source: `Ricis.Core отклонил формат выражения. Результат не вычислялся.`,
    status: 'pending-translation',
    values: {
      'ru': `Ricis.Core отклонил формат выражения. Результат не вычислялся.`,
    },
  },
  'runtime.legacy.768368e89b28': {
    source: `Устойчивость к коллизиям.`,
    status: 'pending-translation',
    values: {
      'ru': `Устойчивость к коллизиям.`,
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
  'runtime.legacy.770c481c943d': {
    source: `Formalize(БыстроепреобразованиеФурье)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(БыстроепреобразованиеФурье)`,
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
  'runtime.legacy.778cb4caec4d': {
    source: `Моральное выравнивание, безопасность.`,
    status: 'pending-translation',
    values: {
      'ru': `Моральное выравнивание, безопасность.`,
    },
  },
  'runtime.legacy.78626a548cea': {
    source: `Фармацевтический рынок ИИ-дизайна молекул $2 Трлн`,
    status: 'pending-translation',
    values: {
      'ru': `Фармацевтический рынок ИИ-дизайна молекул $2 Трлн`,
    },
  },
  'runtime.legacy.792c3c432303': {
    source: `Не связанный узел`,
    status: 'pending-translation',
    values: {
      'ru': `Не связанный узел`,
    },
  },
  'runtime.legacy.7991f1b2cd54': {
    source: `Теория Морса`,
    status: 'pending-translation',
    values: {
      'ru': `Теория Морса`,
    },
  },
  'runtime.legacy.79c49f8dd605': {
    source: `Сингулярность дифракционного спектра.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность дифракционного спектра.`,
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
  'runtime.legacy.7b49761c54e2': {
    source: `Сингулярности Риччи-потока`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярности Риччи-потока`,
    },
  },
  'runtime.legacy.7b58afb8df78': {
    source: `Чтение мыслей.`,
    status: 'pending-translation',
    values: {
      'ru': `Чтение мыслей.`,
    },
  },
  'runtime.legacy.7b721e1a35e3': {
    source: ` и `,
    status: 'pending-translation',
    values: {
      'ru': ` и `,
    },
  },
  'runtime.legacy.7b725d95d8c8': {
    source: `неожиданная`,
    status: 'pending-translation',
    values: {
      'ru': `неожиданная`,
    },
  },
  'runtime.legacy.7c01d901ddac': {
    source: `Математика`,
    status: 'pending-translation',
    values: {
      'ru': `Математика`,
    },
  },
  'runtime.legacy.7c28c098616d': {
    source: `Лишняя`,
    status: 'pending-translation',
    values: {
      'ru': `Лишняя`,
    },
  },
  'runtime.legacy.7c4c29d9ac5e': {
    source: `Разрешение неопределенности через аксиомы SP1-SP4 и Skew Product A6`,
    status: 'pending-translation',
    values: {
      'ru': `Разрешение неопределенности через аксиомы SP1-SP4 и Skew Product A6`,
    },
  },
  'runtime.legacy.7c605ef072ab': {
    source: `Многосолитонные решения.`,
    status: 'pending-translation',
    values: {
      'ru': `Многосолитонные решения.`,
    },
  },
  'runtime.legacy.7c7e428e3c96': {
    source: `Квантовая экспоненциальная сложность редуцируется стековой маской Span<byte>.`,
    status: 'pending-translation',
    values: {
      'ru': `Квантовая экспоненциальная сложность редуцируется стековой маской Span<byte>.`,
    },
  },
  'runtime.legacy.7c848f3088d3': {
    source: `Инварианты Громова-Виттена.`,
    status: 'pending-translation',
    values: {
      'ru': `Инварианты Громова-Виттена.`,
    },
  },
  'runtime.legacy.7cc37ed52404': {
    source: `Бесполезный монолит`,
    status: 'pending-translation',
    values: {
      'ru': `Бесполезный монолит`,
    },
  },
  'runtime.legacy.7d17f9c02788': {
    source: `Фундаментальная нерешённая проблема формализации целевой функции сверхсложных систем (ИИ). Избежание расхождения путей с помощью протокола SP4.`,
    status: 'pending-translation',
    values: {
      'ru': `Фундаментальная нерешённая проблема формализации целевой функции сверхсложных систем (ИИ). Избежание расхождения путей с помощью протокола SP4.`,
    },
  },
  'runtime.legacy.7db751f2c5a1': {
    source: `Formalize(ГипотезаРимана)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(ГипотезаРимана)`,
    },
  },
  'runtime.legacy.7e0fa88acd1b': {
    source: `Топологическая невозможность (парадокс голосования).`,
    status: 'pending-translation',
    values: {
      'ru': `Топологическая невозможность (парадокс голосования).`,
    },
  },
  'runtime.legacy.7e2eff4d0332': {
    source: `WebAssembly-ядро Ricis.Core не завершило вычисление. Результат не вычислялся.`,
    status: 'pending-translation',
    values: {
      'ru': `WebAssembly-ядро Ricis.Core не завершило вычисление. Результат не вычислялся.`,
    },
  },
  'runtime.legacy.7e3183a682e8': {
    source: `Проверка инварианта без структурной амнезии за O(1)`,
    status: 'pending-translation',
    values: {
      'ru': `Проверка инварианта без структурной амнезии за O(1)`,
    },
  },
  'runtime.legacy.7ec35250576b': {
    source: ` / неопределенности, зафиксируй это в выводе, чтобы статус задачи остался `,
    status: 'pending-translation',
    values: {
      'ru': ` / неопределенности, зафиксируй это в выводе, чтобы статус задачи остался `,
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
  'runtime.legacy.7f6af0f59c00': {
    source: `Formalize(ТеломерыипределХейфлика)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(ТеломерыипределХейфлика)`,
    },
  },
  'runtime.legacy.800aee9cff13': {
    source: `Критическая опалесценция`,
    status: 'pending-translation',
    values: {
      'ru': `Критическая опалесценция`,
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
  'runtime.legacy.8113e69070c3': {
    source: `Идеальная избирательная система.`,
    status: 'pending-translation',
    values: {
      'ru': `Идеальная избирательная система.`,
    },
  },
  'runtime.legacy.8171e1552766': {
    source: `Устранение сингулярностей за O(1) время без динамических пределов`,
    status: 'pending-translation',
    values: {
      'ru': `Устранение сингулярностей за O(1) время без динамических пределов`,
    },
  },
  'runtime.legacy.8189c3137604': {
    source: `Formalize(ЭффектКондо)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(ЭффектКондо)`,
    },
  },
  'runtime.legacy.822f5d516b32': {
    source: `Formalize(ГипотезаПуанкаре)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(ГипотезаПуанкаре)`,
    },
  },
  'runtime.legacy.8244bcbe0b3d': {
    source: `Гипотеза Гольдбаха`,
    status: 'pending-translation',
    values: {
      'ru': `Гипотеза Гольдбаха`,
    },
  },
  'runtime.legacy.830fd42b96d5': {
    source: `Поиск неисследованных гипотез и связей в графе...`,
    status: 'pending-translation',
    values: {
      'ru': `Поиск неисследованных гипотез и связей в графе...`,
    },
  },
  'runtime.legacy.835095500704': {
    source: `Formalize(Сингулярностивмашинномобучении)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Сингулярностивмашинномобучении)`,
    },
  },
  'runtime.legacy.840acb8ae55b': {
    source: `Решение задач недоступных классическим ПК.`,
    status: 'pending-translation',
    values: {
      'ru': `Решение задач недоступных классическим ПК.`,
    },
  },
  'runtime.legacy.8484ea8e5f42': {
    source: `Механизмы памяти и Альцгеймер`,
    status: 'pending-translation',
    values: {
      'ru': `Механизмы памяти и Альцгеймер`,
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
  'runtime.legacy.85857948bed8': {
    source: `Сирота`,
    status: 'pending-translation',
    values: {
      'ru': `Сирота`,
    },
  },
  'runtime.legacy.86d6b505b4a4': {
    source: `Сингулярный носитель распределения.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярный носитель распределения.`,
    },
  },
  'runtime.legacy.877b3a53350e': {
    source: `Formalize(Сингулярнаягомология)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Сингулярнаягомология)`,
    },
  },
  'runtime.legacy.87e74f376a70': {
    source: `Связь аналитического и топологического индексов.`,
    status: 'pending-translation',
    values: {
      'ru': `Связь аналитического и топологического индексов.`,
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
  'runtime.legacy.88acb25d0ac0': {
    source: ` или абстрактные слова! Поля `,
    status: 'pending-translation',
    values: {
      'ru': ` или абстрактные слова! Поля `,
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
  'runtime.legacy.8a1f4b6cdde1': {
    source: `должен правильно валидировать L1 Identity по TCP протоколу`,
    status: 'pending-translation',
    values: {
      'ru': `должен правильно валидировать L1 Identity по TCP протоколу`,
    },
  },
  'runtime.legacy.8a5e99ed7885': {
    source: `Formalize(Колмогоровскаясложность)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Колмогоровскаясложность)`,
    },
  },
  'runtime.legacy.8a9f4710537e': {
    source: ` на строке \\\${last.line}, но встречена закрывающая `,
    status: 'pending-translation',
    values: {
      'ru': ` на строке \\\${last.line}, но встречена закрывающая `,
    },
  },
  'runtime.legacy.8acf50e46e5f': {
    source: `  Сингулярность 0/0  `,
    status: 'pending-translation',
    values: {
      'ru': `  Сингулярность 0/0  `,
    },
  },
  'runtime.legacy.8ad543df28dc': {
    source: `Рассеяние света в критической точке.`,
    status: 'pending-translation',
    values: {
      'ru': `Рассеяние света в критической точке.`,
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
  'runtime.legacy.8b2717512c75': {
    source: `Гипотеза (Premise):`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Гипотеза (Premise):`,
      'fr-CA': `Hypothèse (Premise):`,
      'de-DE': `Hypothese (Premise):`,
      'hi-IN': `परिकल्पना (Premise):`,
      'ms-MY': `Hipotesis (Premise):`,
    },
  },
  'runtime.legacy.8b4cea3aad92': {
    source: `Вырожденный каркас`,
    status: 'pending-translation',
    values: {
      'ru': `Вырожденный каркас`,
    },
  },
  'runtime.legacy.8b7a8d16e5e5': {
    source: `Теория катастроф.`,
    status: 'pending-translation',
    values: {
      'ru': `Теория катастроф.`,
    },
  },
  'runtime.legacy.8bad5b26cf3d': {
    source: ` или `,
    status: 'pending-translation',
    values: {
      'ru': ` или `,
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
  'runtime.legacy.8ca1f502c5bd': {
    source: `Эпигенетическое программирование`,
    status: 'pending-translation',
    values: {
      'ru': `Эпигенетическое программирование`,
    },
  },
  'runtime.legacy.8cc760705080': {
    source: `Образование капель и разрыв струи жидкости.`,
    status: 'pending-translation',
    values: {
      'ru': `Образование капель и разрыв струи жидкости.`,
    },
  },
  'runtime.legacy.8cd88cdc3889': {
    source: `должен выявлять замкнутые циклические петли без переполнения стека [A4 0/0 Ratio]`,
    status: 'pending-translation',
    values: {
      'ru': `должен выявлять замкнутые циклические петли без переполнения стека [A4 0/0 Ratio]`,
    },
  },
  'runtime.legacy.8d3ad30839ca': {
    source: `Сингулярность отношения площади к объему.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность отношения площади к объему.`,
    },
  },
  'runtime.legacy.8d95977b356c': {
    source: `Formalize(Токсичностьнаноматериалов)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Токсичностьнаноматериалов)`,
    },
  },
  'runtime.legacy.8d982cd935cf': {
    source: `Монетизация масштабирования базы знаний N * log2(N) с авто-пополнением через Чат-Бот`,
    status: 'pending-translation',
    values: {
      'ru': `Монетизация масштабирования базы знаний N * log2(N) с авто-пополнением через Чат-Бот`,
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
  'runtime.legacy.8db7b3bdf9e9': {
    source: `Formalize(Проблемаинвариантныхподпространств)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Проблемаинвариантныхподпространств)`,
    },
  },
  'runtime.legacy.8e33a2b909eb': {
    source: `Панели сайдбара`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Панели сайдбара`,
      'fr-CA': `Panneaux de la barre latérale`,
      'de-DE': `Seitenleistenbereiche`,
      'hi-IN': `साइडबार पैनल`,
      'ms-MY': `Panel bar sisi`,
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
  'runtime.legacy.8f30fa669f32': {
    source: `Formalize(Критическаяопалесценция)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Критическаяопалесценция)`,
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
  'runtime.legacy.904be85e708d': {
    source: `ПЛАН МОНЕТИЗАЦИИ И СЕРВИСНОЙ АРХИТЕКТУРЫ RICIS-III:\\n\\n1. КОНЦЕПЦИЯ И ЧАТ-БОТ ИНТЕРФЕЙС:\\n• Чат-бот (Telegram / Web / API-gateway) принимает пользовательские математические и физические проблемы с сингулярностями (0/0, 0 * inf, пределы lim, взрывы градиентов).\\n• Бот выполняет детерминированный прогон через аксиоматический движок RICIS-III (SP1-SP4, Аксиома A6, дискретная маска Мерсенна M_k).\\n\\n2. АВТО-ОБУЧЕНИЕ И ПОПОЛНЕНИЕ ЕДИНОЙ БАЗЫ ЗНАНИЙ:\\n• Каждое полученное доказательство (Lean 4 + LaTeX) автоматически записывается в общую базу данных (IndexedDB / Cloud SQL).\\n• Агент RICIS-III мгновенно перезапускает авто-обучение (Agent Training Memory) на пополняемой базе доказательств, непрерывно повышая точность и ценность системы.\\n\\n3. СТРАТЕГИЯ МОНЕТИЗАЦИИ (B2C + B2B):\\n• B2C / Freemium: Базовый анализ сингулярностей — бесплатно; глубокая генерация Lean 4 сертификатов и вывод в Zenodo DOI — по подписке (SaaS) / Pay-Per-Proof.\\n• B2B API / LLM Shield: Встраиваемый API-модуль для разработчиков нейросетей для устранения деления на ноль и взрыва градиентов на лету.\\n• Marketplace Доказательств: Фиксация авторского приоритета (Digital Provenance) и продажа проверенных сертификатов.\\n\\n4. ПОДСКАЗКА АГЕНТУ ПРИ ПЕРЕРАСЧЕТЕ:\\nВычислить экономическую функцию ценности базы V(N) = V_0 + alpha * N * log2(N) при добавлении N решений через чат-бот, задать битность маски log2(sqr(N)) и оптимизировать тарифный шаг.`,
    status: 'pending-translation',
    values: {
      'ru': `ПЛАН МОНЕТИЗАЦИИ И СЕРВИСНОЙ АРХИТЕКТУРЫ RICIS-III:\\n\\n1. КОНЦЕПЦИЯ И ЧАТ-БОТ ИНТЕРФЕЙС:\\n• Чат-бот (Telegram / Web / API-gateway) принимает пользовательские математические и физические проблемы с сингулярностями (0/0, 0 * inf, пределы lim, взрывы градиентов).\\n• Бот выполняет детерминированный прогон через аксиоматический движок RICIS-III (SP1-SP4, Аксиома A6, дискретная маска Мерсенна M_k).\\n\\n2. АВТО-ОБУЧЕНИЕ И ПОПОЛНЕНИЕ ЕДИНОЙ БАЗЫ ЗНАНИЙ:\\n• Каждое полученное доказательство (Lean 4 + LaTeX) автоматически записывается в общую базу данных (IndexedDB / Cloud SQL).\\n• Агент RICIS-III мгновенно перезапускает авто-обучение (Agent Training Memory) на пополняемой базе доказательств, непрерывно повышая точность и ценность системы.\\n\\n3. СТРАТЕГИЯ МОНЕТИЗАЦИИ (B2C + B2B):\\n• B2C / Freemium: Базовый анализ сингулярностей — бесплатно; глубокая генерация Lean 4 сертификатов и вывод в Zenodo DOI — по подписке (SaaS) / Pay-Per-Proof.\\n• B2B API / LLM Shield: Встраиваемый API-модуль для разработчиков нейросетей для устранения деления на ноль и взрыва градиентов на лету.\\n• Marketplace Доказательств: Фиксация авторского приоритета (Digital Provenance) и продажа проверенных сертификатов.\\n\\n4. ПОДСКАЗКА АГЕНТУ ПРИ ПЕРЕРАСЧЕТЕ:\\nВычислить экономическую функцию ценности базы V(N) = V_0 + alpha * N * log2(N) при добавлении N решений через чат-бот, задать битность маски log2(sqr(N)) и оптимизировать тарифный шаг.`,
    },
  },
  'runtime.legacy.90e0b6c950bd': {
    source: `Formalize(Сингулярностивгидродинамике)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Сингулярностивгидродинамике)`,
    },
  },
  'runtime.legacy.90f7eb9d737a': {
    source: `Топология гладких 4-мерных многообразий.`,
    status: 'pending-translation',
    values: {
      'ru': `Топология гладких 4-мерных многообразий.`,
    },
  },
  'runtime.legacy.9107b272120d': {
    source: `Бесконечная производная технологического прогресса.`,
    status: 'pending-translation',
    values: {
      'ru': `Бесконечная производная технологического прогресса.`,
    },
  },
  'runtime.legacy.9127a8595215': {
    source: `Граница инфляционной сингулярности.`,
    status: 'pending-translation',
    values: {
      'ru': `Граница инфляционной сингулярности.`,
    },
  },
  'runtime.legacy.91b72fe9d611': {
    source: `Квантовая запутанность и кротовые норы`,
    status: 'pending-translation',
    values: {
      'ru': `Квантовая запутанность и кротовые норы`,
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
  'runtime.legacy.92b11c807540': {
    source: `Сингулярность иммунного ответа.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность иммунного ответа.`,
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
  'runtime.legacy.93d38068c84b': {
    source: `Сингулярность внутри черной дыры.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность внутри черной дыры.`,
    },
  },
  'runtime.legacy.93e0366b5374': {
    source: `Закрыть терминал`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Закрыть терминал`,
      'fr-CA': `Fermer le terminal`,
      'de-DE': `Terminal schließen`,
      'hi-IN': `टर्मिनल बंद करें`,
      'ms-MY': `Tutup terminal`,
    },
  },
  'runtime.legacy.93ed98277ef4': {
    source: `Классическая задача сведена к пределу и разрешена в RICIS-III за O(1) время через индексы нулевых монолитов.`,
    status: 'pending-translation',
    values: {
      'ru': `Классическая задача сведена к пределу и разрешена в RICIS-III за O(1) время через индексы нулевых монолитов.`,
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
  'runtime.legacy.94c04636f267': {
    source: `Краткий эскиз разрешения предельной неопределенности за O(1)`,
    status: 'pending-translation',
    values: {
      'ru': `Краткий эскиз разрешения предельной неопределенности за O(1)`,
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
  'runtime.legacy.955be348a7a9': {
    source: `Кликов: {{value}}`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Кликов: {{value}}`,
      'fr-CA': `Clics : {{value}}`,
      'de-DE': `Klicks: {{value}}`,
      'hi-IN': `क्लिक्स: {{value}}`,
      'ms-MY': `Klik: {{value}}`,
    },
  },
  'runtime.legacy.95a9ca639284': {
    source: `Научное описание с предельной редукцией в O(1)`,
    status: 'pending-translation',
    values: {
      'ru': `Научное описание с предельной редукцией в O(1)`,
    },
  },
  'runtime.legacy.95ae8b87df7e': {
    source: `Коллапс луча в точку.`,
    status: 'pending-translation',
    values: {
      'ru': `Коллапс луча в точку.`,
    },
  },
  'runtime.legacy.96168519a4b3': {
    source: `Сингулярности Берри-кривизны.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярности Берри-кривизны.`,
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
  'runtime.legacy.9806e9af13bb': {
    source: `Formalize(ПроблемавыравниванияИИ(Alignment))`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(ПроблемавыравниванияИИ(Alignment))`,
    },
  },
  'runtime.legacy.984c0d4a3e00': {
    source: `Астрономия и астрофизика`,
    status: 'pending-translation',
    values: {
      'ru': `Астрономия и астрофизика`,
    },
  },
  'runtime.legacy.9852869a56e0': {
    source: `Теорема об индексе Атьи — Зингера`,
    status: 'pending-translation',
    values: {
      'ru': `Теорема об индексе Атьи — Зингера`,
    },
  },
  'runtime.legacy.98ce4a638cf8': {
    source: `Сингулярность адаптивного ландшафта.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность адаптивного ландшафта.`,
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
  'runtime.legacy.997444f871a0': {
    source: `Нобелевская премия по физике ~$1,100,000 (Большой Взрыв)`,
    status: 'pending-translation',
    values: {
      'ru': `Нобелевская премия по физике ~$1,100,000 (Большой Взрыв)`,
    },
  },
  'runtime.legacy.998986623923': {
    source: `Кликните для мгновенного вычисления`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Кликните для мгновенного вычисления`,
      'fr-CA': `Cliquez pour calculer instantanément`,
      'de-DE': `Klicken, um sofort zu berechnen`,
      'hi-IN': `क्लिक करके तुरंत गणना करें`,
      'ms-MY': `Klik untuk mengira serta-merta`,
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
  'runtime.legacy.99d15377de4d': {
    source: `Асимптотическое расхождение сложности.`,
    status: 'pending-translation',
    values: {
      'ru': `Асимптотическое расхождение сложности.`,
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
  'runtime.legacy.9a269c0386ab': {
    source: `Ультрафиолетовые расходимости.`,
    status: 'pending-translation',
    values: {
      'ru': `Ультрафиолетовые расходимости.`,
    },
  },
  'runtime.legacy.9a62fe3e6ae5': {
    source: `Премия Института Клея $1,000,000`,
    status: 'pending-translation',
    values: {
      'ru': `Премия Института Клея $1,000,000`,
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
  'runtime.legacy.9da4a24f217f': {
    source: `Ядро Ricis.Core недоступно. Выражение не вычислялось.`,
    status: 'pending-translation',
    values: {
      'ru': `Ядро Ricis.Core недоступно. Выражение не вычислялось.`,
    },
  },
  'runtime.legacy.9f36515ea230': {
    source: `⚡ Помощь / Команды`,
    status: 'pending-translation',
    values: {
      'ru': `⚡ Помощь / Команды`,
    },
  },
  'runtime.legacy.9f969f6f7917': {
    source: `ищи сам`,
    status: 'pending-translation',
    values: {
      'ru': `ищи сам`,
    },
  },
  'runtime.legacy.9ffd5201057d': {
    source: `Сингулярная задача`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярная задача`,
    },
  },
  'runtime.legacy.a03e92d142cc': {
    source: `Узоры Пенроуза.`,
    status: 'pending-translation',
    values: {
      'ru': `Узоры Пенроуза.`,
    },
  },
  'runtime.legacy.a07f819d012b': {
    source: `Экспоненциальный взрыв времени вычислений схлопывается побитовыми сдвигами за 1 такт.`,
    status: 'pending-translation',
    values: {
      'ru': `Экспоненциальный взрыв времени вычислений схлопывается побитовыми сдвигами за 1 такт.`,
    },
  },
  'runtime.legacy.a082257f084c': {
    source: `Ортогональность градиентов.`,
    status: 'pending-translation',
    values: {
      'ru': `Ортогональность градиентов.`,
    },
  },
  'runtime.legacy.a0aa87d8bd25': {
    source: `Быстрые действия`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Быстрые действия`,
      'fr-CA': `Actions rapides`,
      'de-DE': `Schnellaktionen`,
      'hi-IN': `त्वरित क्रियाएँ`,
      'ms-MY': `Tindakan cepat`,
    },
  },
  'runtime.legacy.a193911d06f6': {
    source: `должен выявлять семантические дубликаты на основе SP4 индекса [L1_IDENTITY]`,
    status: 'pending-translation',
    values: {
      'ru': `должен выявлять семантические дубликаты на основе SP4 индекса [L1_IDENTITY]`,
    },
  },
  'runtime.legacy.a25c84820bef': {
    source: `RICIS-III структурный черновик`,
    status: 'pending-translation',
    values: {
      'ru': `RICIS-III структурный черновик`,
    },
  },
  'runtime.legacy.a2684875f6a2': {
    source: `Сингулярность равновесия Нэша.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность равновесия Нэша.`,
    },
  },
  'runtime.legacy.a28224dcbe09': {
    source: `должен вызывать onCommit, если пользователь удерживает ползунок без движения дольше idleDelayMs`,
    status: 'pending-translation',
    values: {
      'ru': `должен вызывать onCommit, если пользователь удерживает ползунок без движения дольше idleDelayMs`,
    },
  },
  'runtime.legacy.a2ce019a65a4': {
    source: `Сведение NP -> P за O(1)`,
    status: 'pending-translation',
    values: {
      'ru': `Сведение NP -> P за O(1)`,
    },
  },
  'runtime.legacy.a2ffb59efd25': {
    source: `Доступно к решению`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Доступно к решению`,
      'fr-CA': `Disponible pour résolution`,
      'de-DE': `Verfügbar zur Bearbeitung`,
      'hi-IN': `समाधान के लिए उपलब्ध`,
      'ms-MY': `Tersedia untuk diselesaikan`,
    },
  },
  'runtime.legacy.a305ab51136a': {
    source: `Разрыв связности (сетевая сингулярность).`,
    status: 'pending-translation',
    values: {
      'ru': `Разрыв связности (сетевая сингулярность).`,
    },
  },
  'runtime.legacy.a339d4c6c3db': {
    source: `Фармакология`,
    status: 'pending-translation',
    values: {
      'ru': `Фармакология`,
    },
  },
  'runtime.legacy.a34727a0125a': {
    source: `Анализ сторонних публикаций на семантическое соответствие RICIS A6/SP2...`,
    status: 'pending-translation',
    values: {
      'ru': `Анализ сторонних публикаций на семантическое соответствие RICIS A6/SP2...`,
    },
  },
  'runtime.legacy.a36b1c085fcf': {
    source: `Профиль интерфейса`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Профиль интерфейса`,
      'fr-CA': `Profil d'interface`,
      'de-DE': `Profil der Benutzeroberfläche`,
      'hi-IN': `इंटरफ़ेस प्रोफ़ाइल`,
      'ms-MY': `Profil antara muka`,
    },
  },
  'runtime.legacy.a37a4a639561': {
    source: `Гладкое решение уравнений Навье — Стокса`,
    status: 'pending-translation',
    values: {
      'ru': `Гладкое решение уравнений Навье — Стокса`,
    },
  },
  'runtime.legacy.a383dda0f8f6': {
    source: `Квантовая гравитация`,
    status: 'pending-translation',
    values: {
      'ru': `Квантовая гравитация`,
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
  'runtime.legacy.a3f8308dbfc6': {
    source: `Formalize(Квантоваякогомология)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Квантоваякогомология)`,
    },
  },
  'runtime.legacy.a43730d4e388': {
    source: `Проблема инвариантных подпространств`,
    status: 'pending-translation',
    values: {
      'ru': `Проблема инвариантных подпространств`,
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
  'runtime.legacy.a4f1f2590304': {
    source: `Инвариант не установлен`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Инвариант не установлен`,
      'fr-CA': `Invariant non établi`,
      'de-DE': `Invariante nicht festgelegt`,
      'hi-IN': `इनवेरिएंट स्थापित नहीं है`,
      'ms-MY': `Invarian tidak ditetapkan`,
    },
  },
  'runtime.legacy.a50f1b09938e': {
    source: `Микролокальный анализ.`,
    status: 'pending-translation',
    values: {
      'ru': `Микролокальный анализ.`,
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
  'runtime.legacy.a568de3cb26d': {
    source: `Миграция v3 уже выполнена ранее.`,
    status: 'pending-translation',
    values: {
      'ru': `Миграция v3 уже выполнена ранее.`,
    },
  },
  'runtime.legacy.a58e6213941f': {
    source: `Квантовая превосходство`,
    status: 'pending-translation',
    values: {
      'ru': `Квантовая превосходство`,
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
  'runtime.legacy.a5dd2cdde880': {
    source: `Предсказание третичной структуры.`,
    status: 'pending-translation',
    values: {
      'ru': `Предсказание третичной структуры.`,
    },
  },
  'runtime.legacy.a5e008079711': {
    source: `• \`LEAN_VERIFIED\` — результат подтверждён Lean с известной границей аксиом.\\n`,
    status: 'pending-translation',
    values: {
      'ru': `• \`LEAN_VERIFIED\` — результат подтверждён Lean с известной границей аксиом.\\n`,
    },
  },
  'runtime.legacy.a5fa5e429596': {
    source: `Быстрое преобразование Фурье`,
    status: 'pending-translation',
    values: {
      'ru': `Быстрое преобразование Фурье`,
    },
  },
  'runtime.legacy.a607e0fbc4fc': {
    source: `Аттрактор Лоренца`,
    status: 'pending-translation',
    values: {
      'ru': `Аттрактор Лоренца`,
    },
  },
  'runtime.legacy.a60b4b83b2fd': {
    source: `Вкл`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Вкл`,
      'fr-CA': `Activé`,
      'de-DE': `Ein`,
      'hi-IN': `चालू`,
      'ms-MY': `Hidup`,
    },
  },
  'runtime.legacy.a65b9b11ee70': {
    source: `не принимает API-ключи`,
    status: 'pending-translation',
    values: {
      'ru': `не принимает API-ключи`,
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
  'runtime.legacy.a723e0269a79': {
    source: `Вычисление точного инварианта без потери контекста`,
    status: 'pending-translation',
    values: {
      'ru': `Вычисление точного инварианта без потери контекста`,
    },
  },
  'runtime.legacy.a73e03f5dd32': {
    source: `Псевдодифференциальные операторы`,
    status: 'pending-translation',
    values: {
      'ru': `Псевдодифференциальные операторы`,
    },
  },
  'runtime.legacy.a772db714db0': {
    source: `Сингулярности эллиптических дифференциальных операторов.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярности эллиптических дифференциальных операторов.`,
    },
  },
  'runtime.legacy.a79cc61a2cbe': {
    source: `Formalize(Аутоиммунныезаболевания)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Аутоиммунныезаболевания)`,
    },
  },
  'runtime.legacy.a7a6f74b6cb5': {
    source: `должен сохранять legacy academic goal match как partial до authoritative Lean evidence`,
    status: 'pending-translation',
    values: {
      'ru': `должен сохранять legacy academic goal match как partial до authoritative Lean evidence`,
    },
  },
  'runtime.legacy.a899f145099d': {
    source: `Предел дифференцировки стволовых клеток.`,
    status: 'pending-translation',
    values: {
      'ru': `Предел дифференцировки стволовых клеток.`,
    },
  },
  'runtime.legacy.a8ef8af786b7': {
    source: `Внешнее Lean доказательство`,
    status: 'pending-translation',
    values: {
      'ru': `Внешнее Lean доказательство`,
    },
  },
  'runtime.legacy.a97b0d67aa75': {
    source: `Локальные нули плотности распределения.`,
    status: 'pending-translation',
    values: {
      'ru': `Локальные нули плотности распределения.`,
    },
  },
  'runtime.legacy.aa18ff4c8de9': {
    source: `Алгебраическое сокращение факторов ДО вычисления сингулярностей`,
    status: 'pending-translation',
    values: {
      'ru': `Алгебраическое сокращение факторов ДО вычисления сингулярностей`,
    },
  },
  'runtime.legacy.aa7fea8c227a': {
    source: `Индексирование нулей/бесконечностей родительским выражением`,
    status: 'pending-translation',
    values: {
      'ru': `Индексирование нулей/бесконечностей родительским выражением`,
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
  'runtime.legacy.ab52ac10f99d': {
    source: `Доставка лекарств в мозг.`,
    status: 'pending-translation',
    values: {
      'ru': `Доставка лекарств в мозг.`,
    },
  },
  'runtime.legacy.ab6807d3642b': {
    source: `Сингулярность Большого взрыва`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность Большого взрыва`,
    },
  },
  'runtime.legacy.ab6bc96ce8fa': {
    source: `Сингулярность магнитного поля (нить).`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность магнитного поля (нить).`,
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
  'runtime.legacy.abbe1595e50a': {
    source: `Инициализация состояния из IndexedDB...`,
    status: 'pending-translation',
    values: {
      'ru': `Инициализация состояния из IndexedDB...`,
    },
  },
  'runtime.legacy.abd806c542df': {
    source: `Инвариант = {{value}}`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Инвариант = {{value}}`,
      'fr-CA': `Invariant = {{value}}`,
      'de-DE': `Invariante = {{value}}`,
      'hi-IN': `इनवेरिएंट = {{value}}`,
      'ms-MY': `Invarian = {{value}}`,
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
  'runtime.legacy.ad078a9e6a3b': {
    source: `Гипотеза Римана`,
    status: 'pending-translation',
    values: {
      'ru': `Гипотеза Римана`,
    },
  },
  'runtime.legacy.ad59598ae96d': {
    source: `Фундаментальный монолит RICIS-III / Премия Клея $1,000,000`,
    status: 'pending-translation',
    values: {
      'ru': `Фундаментальный монолит RICIS-III / Премия Клея $1,000,000`,
    },
  },
  'runtime.legacy.ad5f5f5fc580': {
    source: `Сингулярности в гидродинамике`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярности в гидродинамике`,
    },
  },
  'runtime.legacy.adb9e98afec4': {
    source: `Неконтролируемый рост цен.`,
    status: 'pending-translation',
    values: {
      'ru': `Неконтролируемый рост цен.`,
    },
  },
  'runtime.legacy.ae29cbc6f450': {
    source: `WebAssembly-ядро Ricis.Core вернуло неполный ответ. Результат не принят.`,
    status: 'pending-translation',
    values: {
      'ru': `WebAssembly-ядро Ricis.Core вернуло неполный ответ. Результат не принят.`,
    },
  },
  'runtime.legacy.aec2cb34f899': {
    source: `площадь пересечения`,
    status: 'pending-translation',
    values: {
      'ru': `площадь пересечения`,
    },
  },
  'runtime.legacy.aed4749452e2': {
    source: `Сложность факторизации RSA/ECC (Побитовая маска квадрата)`,
    status: 'pending-translation',
    values: {
      'ru': `Сложность факторизации RSA/ECC (Побитовая маска квадрата)`,
    },
  },
  'runtime.legacy.aeda352f9182': {
    source: `должен обновлять URL в строке браузера без перезагрузки`,
    status: 'pending-translation',
    values: {
      'ru': `должен обновлять URL в строке браузера без перезагрузки`,
    },
  },
  'runtime.legacy.af2e689a75e3': {
    source: `Заполнение недостающих целевых функций через Gemini API...`,
    status: 'pending-translation',
    values: {
      'ru': `Заполнение недостающих целевых функций через Gemini API...`,
    },
  },
  'runtime.legacy.af30012ab1a0': {
    source: `Предел O(N log N).`,
    status: 'pending-translation',
    values: {
      'ru': `Предел O(N log N).`,
    },
  },
  'runtime.legacy.af3fea2676b4': {
    source: `Теоремы Хокинга и Пенроуза о сингулярностях.`,
    status: 'pending-translation',
    values: {
      'ru': `Теоремы Хокинга и Пенроуза о сингулярностях.`,
    },
  },
  'runtime.legacy.af7ea2336944': {
    source: `Код Lean 4 не использует пространство имен RICIS/RICIS3. Рекомендуется импортировать 'RICIS3.Core' для верификации.`,
    status: 'pending-translation',
    values: {
      'ru': `Код Lean 4 не использует пространство имен RICIS/RICIS3. Рекомендуется импортировать 'RICIS3.Core' для верификации.`,
    },
  },
  'runtime.legacy.b06edcc951dc': {
    source: ` /> Инструменты и настройки</span><ChevronDown size={16} className=`,
    status: 'pending-translation',
    values: {
      'ru': ` /> Инструменты и настройки</span><ChevronDown size={16} className=`,
    },
  },
  'runtime.legacy.b0b1f2954ed4': {
    source: `Сингулярная гомология`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярная гомология`,
    },
  },
  'runtime.legacy.b0da9d48e364': {
    source: `должен корректно определять достижимые узлы из RootMonoliths`,
    status: 'pending-translation',
    values: {
      'ru': `должен корректно определять достижимые узлы из RootMonoliths`,
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
  'runtime.legacy.b14a371331fa': {
    source: `Formalize(Теорияузлов)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Теорияузлов)`,
    },
  },
  'runtime.legacy.b1694b1aa515': {
    source: `Квазикристаллы`,
    status: 'pending-translation',
    values: {
      'ru': `Квазикристаллы`,
    },
  },
  'runtime.legacy.b204a35ad035': {
    source: `Теорема о сепарации сингулярности по протоколам SP1/SP2 (No Total Amnesia)`,
    status: 'pending-translation',
    values: {
      'ru': `Теорема о сепарации сингулярности по протоколам SP1/SP2 (No Total Amnesia)`,
    },
  },
  'runtime.legacy.b28a5b3bf158': {
    source: `Аномалии в кривых вращения галактик.`,
    status: 'pending-translation',
    values: {
      'ru': `Аномалии в кривых вращения галактик.`,
    },
  },
  'runtime.legacy.b2fdf23255ca': {
    source: `1. Изоляция при перемещении ползунка (Drag Isolation)`,
    status: 'pending-translation',
    values: {
      'ru': `1. Изоляция при перемещении ползунка (Drag Isolation)`,
    },
  },
  'runtime.legacy.b30130cb3f53': {
    source: `Formalize(Дилеммазаключенного)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Дилеммазаключенного)`,
    },
  },
  'runtime.legacy.b31392c88f29': {
    source: `Сингулярности ван Хова`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярности ван Хова`,
    },
  },
  'runtime.legacy.b3152faa80e4': {
    source: `Formalize(Сложностьсортировки)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Сложностьсортировки)`,
    },
  },
  'runtime.legacy.b340b311e560': {
    source: `Разрешение орибифолдных сингулярностей.`,
    status: 'pending-translation',
    values: {
      'ru': `Разрешение орибифолдных сингулярностей.`,
    },
  },
  'runtime.legacy.b3f32778fc1e': {
    source: `Вычисление косого произведения (определителя матрицы перехода) за O(1)`,
    status: 'pending-translation',
    values: {
      'ru': `Вычисление косого произведения (определителя матрицы перехода) за O(1)`,
    },
  },
  'runtime.legacy.b4089138603a': {
    source: `Нелинейная динамика экосистемы кишечника.`,
    status: 'pending-translation',
    values: {
      'ru': `Нелинейная динамика экосистемы кишечника.`,
    },
  },
  'runtime.legacy.b41dea555acf': {
    source: `найди сам`,
    status: 'pending-translation',
    values: {
      'ru': `найди сам`,
    },
  },
  'runtime.legacy.b420bbaa2add': {
    source: `Квантовая гравитация, энергия.`,
    status: 'pending-translation',
    values: {
      'ru': `Квантовая гравитация, энергия.`,
    },
  },
  'runtime.legacy.b4a07e92b8db': {
    source: `Новых гипотез не обнаружено (граф сбалансирован).`,
    status: 'pending-translation',
    values: {
      'ru': `Новых гипотез не обнаружено (граф сбалансирован).`,
    },
  },
  'runtime.legacy.b50d50678a14': {
    source: `Formalize(Гиперинфляция)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Гиперинфляция)`,
    },
  },
  'runtime.legacy.b51f8f93882e': {
    source: `Седловые сингулярности в пространстве весов.`,
    status: 'pending-translation',
    values: {
      'ru': `Седловые сингулярности в пространстве весов.`,
    },
  },
  'runtime.legacy.b53f24421788': {
    source: `должен обновлять доказательство (updateProof) и возвращать через getLatexProof`,
    status: 'pending-translation',
    values: {
      'ru': `должен обновлять доказательство (updateProof) и возвращать через getLatexProof`,
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
  'runtime.legacy.b58cd10f2e6e': {
    source: `Спектральная сингулярность оператора.`,
    status: 'pending-translation',
    values: {
      'ru': `Спектральная сингулярность оператора.`,
    },
  },
  'runtime.legacy.b5a1141ca7dd': {
    source: `Таймаут запроса к агенту API.`,
    status: 'pending-translation',
    values: {
      'ru': `Таймаут запроса к агенту API.`,
    },
  },
  'runtime.legacy.b5d4a93e372c': {
    source: `Семантическое индексирование сингулярностей родительским выражением`,
    status: 'pending-translation',
    values: {
      'ru': `Семантическое индексирование сингулярностей родительским выражением`,
    },
  },
  'runtime.legacy.b5e788a61450': {
    source: `Абсолютная Теория Стоимости`,
    status: 'pending-translation',
    values: {
      'ru': `Абсолютная Теория Стоимости`,
    },
  },
  'runtime.legacy.b62db9b85837': {
    source: `Шумовая сингулярность ЭЭГ.`,
    status: 'pending-translation',
    values: {
      'ru': `Шумовая сингулярность ЭЭГ.`,
    },
  },
  'runtime.legacy.b64330e0f7aa': {
    source: `Рекурсия Альфа`,
    status: 'pending-translation',
    values: {
      'ru': `Рекурсия Альфа`,
    },
  },
  'runtime.legacy.b6a64ffb96fb': {
    source: `Концентрация капитала.`,
    status: 'pending-translation',
    values: {
      'ru': `Концентрация капитала.`,
    },
  },
  'runtime.legacy.b6b7f0ae5c5c': {
    source: `Нобелевская премия / Breakthrough Prize ~$1,100,000`,
    status: 'pending-translation',
    values: {
      'ru': `Нобелевская премия / Breakthrough Prize ~$1,100,000`,
    },
  },
  'runtime.legacy.b6ceff66b6b5': {
    source: `Formalize(РазрешениеособенностейХиронаки)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(РазрешениеособенностейХиронаки)`,
    },
  },
  'runtime.legacy.b72178d0905b': {
    source: `Обучение мозга.`,
    status: 'pending-translation',
    values: {
      'ru': `Обучение мозга.`,
    },
  },
  'runtime.legacy.b734c12cd0a6': {
    source: `Formalize(Эпигенетическоепрограммирование)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Эпигенетическоепрограммирование)`,
    },
  },
  'runtime.legacy.b7b60f1a2c67': {
    source: `Коллапс метрики в точку.`,
    status: 'pending-translation',
    values: {
      'ru': `Коллапс метрики в точку.`,
    },
  },
  'runtime.legacy.b8cc00e0d144': {
    source: `Бесконтрольное деление (расходимость роста).`,
    status: 'pending-translation',
    values: {
      'ru': `Бесконтрольное деление (расходимость роста).`,
    },
  },
  'runtime.legacy.b95bd4b0b4f4': {
    source: `Квантовые критические точки.`,
    status: 'pending-translation',
    values: {
      'ru': `Квантовые критические точки.`,
    },
  },
  'runtime.legacy.b9b0218d14d9': {
    source: `требуется Core/Lean evidence`,
    status: 'pending-translation',
    values: {
      'ru': `требуется Core/Lean evidence`,
    },
  },
  'runtime.legacy.b9bd8a7324c0': {
    source: `Архитектор (Симуляция)`,
    status: 'pending-translation',
    values: {
      'ru': `Архитектор (Симуляция)`,
    },
  },
  'runtime.legacy.ba43030026f8': {
    source: `Formalize(КвантовыйэффектХолла)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(КвантовыйэффектХолла)`,
    },
  },
  'runtime.legacy.ba4469eae237': {
    source: `Длина кратчайшей программы.`,
    status: 'pending-translation',
    values: {
      'ru': `Длина кратчайшей программы.`,
    },
  },
  'runtime.legacy.ba53a8b76984': {
    source: `Formalize(Криптографическиехэшфункции)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Криптографическиехэшфункции)`,
    },
  },
  'runtime.legacy.ba7c76adc260': {
    source: `Критические точки гладких функций.`,
    status: 'pending-translation',
    values: {
      'ru': `Критические точки гладких функций.`,
    },
  },
  'runtime.legacy.bb1836f33b16': {
    source: `должен проходить дерево рекурсивно по dependencyIds без edge snapshot`,
    status: 'pending-translation',
    values: {
      'ru': `должен проходить дерево рекурсивно по dependencyIds без edge snapshot`,
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
  'runtime.legacy.bcc93e7a5d92': {
    source: `Ускоренное расширение Вселенной.`,
    status: 'pending-translation',
    values: {
      'ru': `Ускоренное расширение Вселенной.`,
    },
  },
  'runtime.legacy.bd3659f0f2fd': {
    source: `Изоляция идентичных нулевых факторов без амнезии контекста`,
    status: 'pending-translation',
    values: {
      'ru': `Изоляция идентичных нулевых факторов без амнезии контекста`,
    },
  },
  'runtime.legacy.bd4a0ea92d6c': {
    source: `Проверка типа и онтологической сохранности идентичности`,
    status: 'pending-translation',
    values: {
      'ru': `Проверка типа и онтологической сохранности идентичности`,
    },
  },
  'runtime.legacy.bd77f0cc2dfa': {
    source: `Полюс при s=1.`,
    status: 'pending-translation',
    values: {
      'ru': `Полюс при s=1.`,
    },
  },
  'runtime.legacy.bdbebd67ff83': {
    source: `Сингулярности в уравнениях Эйнштейна`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярности в уравнениях Эйнштейна`,
    },
  },
  'runtime.legacy.bdd94b7007c0': {
    source: `Точка разрыва конечного радиуса.`,
    status: 'pending-translation',
    values: {
      'ru': `Точка разрыва конечного радиуса.`,
    },
  },
  'runtime.legacy.be3084dc6be7': {
    source: `функц`,
    status: 'pending-translation',
    values: {
      'ru': `функц`,
    },
  },
  'runtime.legacy.be554986bc31': {
    source: `Фармакокинетика частиц.`,
    status: 'pending-translation',
    values: {
      'ru': `Фармакокинетика частиц.`,
    },
  },
  'runtime.legacy.be5dab166988': {
    source: `Премия Института Клея $1,000,000 (Уравнения Янга-Миллса)`,
    status: 'pending-translation',
    values: {
      'ru': `Премия Института Клея $1,000,000 (Уравнения Янга-Миллса)`,
    },
  },
  'runtime.legacy.be62fad20e50': {
    source: `Особенности в плотности состояний кристаллов.`,
    status: 'pending-translation',
    values: {
      'ru': `Особенности в плотности состояний кристаллов.`,
    },
  },
  'runtime.legacy.be8bfbab06fc': {
    source: `Универсальный базовый доход (UBI)`,
    status: 'pending-translation',
    values: {
      'ru': `Универсальный базовый доход (UBI)`,
    },
  },
  'runtime.legacy.beaf1bf7522e': {
    source: `Журнал логов очищен.`,
    status: 'pending-translation',
    values: {
      'ru': `Журнал логов очищен.`,
    },
  },
  'runtime.legacy.bfaa08a9406f': {
    source: `Уравнение Кортевега-де Фриза`,
    status: 'pending-translation',
    values: {
      'ru': `Уравнение Кортевега-де Фриза`,
    },
  },
  'runtime.legacy.bfc60a245a85': {
    source: `>G Зон: <strong className=`,
    status: 'pending-translation',
    values: {
      'ru': `>G Зон: <strong className=`,
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
  'runtime.legacy.c17707c4d73e': {
    source: `Распад синаптической сети.`,
    status: 'pending-translation',
    values: {
      'ru': `Распад синаптической сети.`,
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
  'runtime.legacy.c294e39032df': {
    source: `найти`,
    status: 'pending-translation',
    values: {
      'ru': `найти`,
    },
  },
  'runtime.legacy.c2ca03c107f5': {
    source: `Аутоиммунные заболевания`,
    status: 'pending-translation',
    values: {
      'ru': `Аутоиммунные заболевания`,
    },
  },
  'runtime.legacy.c2cb90803066': {
    source: `Неизвестный сбой`,
    status: 'pending-translation',
    values: {
      'ru': `Неизвестный сбой`,
    },
  },
  'runtime.legacy.c2cbe41a6422': {
    source: `Сингулярность скорости или завихренности за конечное время.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность скорости или завихренности за конечное время.`,
    },
  },
  'runtime.legacy.c31342cac806': {
    source: `Квантовое исправление ошибок.`,
    status: 'pending-translation',
    values: {
      'ru': `Квантовое исправление ошибок.`,
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
  'runtime.legacy.c378b7c43124': {
    source: `Проблема делителей нуля в групповых кольцах`,
    status: 'pending-translation',
    values: {
      'ru': `Проблема делителей нуля в групповых кольцах`,
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
  'runtime.legacy.c473d7aed15b': {
    source: `должен возвращать английский текст при переключении на EN`,
    status: 'pending-translation',
    values: {
      'ru': `должен возвращать английский текст при переключении на EN`,
    },
  },
  'runtime.legacy.c4c3aea7ee36': {
    source: `найди формулу сам`,
    status: 'pending-translation',
    values: {
      'ru': `найди формулу сам`,
    },
  },
  'runtime.legacy.c52c2c395fdf': {
    source: `Нобелевская премия / Промышленность сверхпроводников $1.5 Трлн`,
    status: 'pending-translation',
    values: {
      'ru': `Нобелевская премия / Промышленность сверхпроводников $1.5 Трлн`,
    },
  },
  'runtime.legacy.c5a471e063e4': {
    source: `Формула Вейля.`,
    status: 'pending-translation',
    values: {
      'ru': `Формула Вейля.`,
    },
  },
  'runtime.legacy.c5a7b8ebc6b8': {
    source: `Исследователь`,
    status: 'pending-translation',
    values: {
      'ru': `Исследователь`,
    },
  },
  'runtime.legacy.c5d084c6dd2e': {
    source: `Все нетривиальные нули дзета-функции лежат на критической прямой.`,
    status: 'pending-translation',
    values: {
      'ru': `Все нетривиальные нули дзета-функции лежат на критической прямой.`,
    },
  },
  'runtime.legacy.c5d7429cb948': {
    source: `Одобрение того, что любой гармонический дифференциал есть рациональная комбинация.`,
    status: 'pending-translation',
    values: {
      'ru': `Одобрение того, что любой гармонический дифференциал есть рациональная комбинация.`,
    },
  },
  'runtime.legacy.c5fabd3f3e57': {
    source: `Гипотеза Капланского о делителях нуля.`,
    status: 'pending-translation',
    values: {
      'ru': `Гипотеза Капланского о делителях нуля.`,
    },
  },
  'runtime.legacy.c62b51dc5b85': {
    source: `Космология, черные дыры, темная материя.`,
    status: 'pending-translation',
    values: {
      'ru': `Космология, черные дыры, темная материя.`,
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
  'runtime.legacy.c79bee9a3bb3': {
    source: `Formalize(Нейропластичность)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Нейропластичность)`,
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
  'runtime.legacy.c8ba43639d44': {
    source: `Сингулярности в нелинейной оптике`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярности в нелинейной оптике`,
    },
  },
  'runtime.legacy.c8efdf58f036': {
    source: `Formalize(Оптимизациягиперпараметров)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Оптимизациягиперпараметров)`,
    },
  },
  'runtime.legacy.c919b4891a68': {
    source: `Нобелевская премия по медицине / Лечение онкопатологий $5 Трлн`,
    status: 'pending-translation',
    values: {
      'ru': `Нобелевская премия по медицине / Лечение онкопатологий $5 Трлн`,
    },
  },
  'runtime.legacy.c95eb46faa0b': {
    source: `Formalize(Высокотемпературнаясверхпроводимость)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Высокотемпературнаясверхпроводимость)`,
    },
  },
  'runtime.legacy.c9b20dd8dbdd': {
    source: `Сингулярности в машинном обучении`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярности в машинном обучении`,
    },
  },
  'runtime.legacy.c9e5e0a9bd2c': {
    source: `Formalize(Космологическаяпостоянная)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Космологическаяпостоянная)`,
    },
  },
  'runtime.legacy.c9f804ddafb3': {
    source: `Локальный результат (Lean kernel не запускался):`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Локальный результат (Lean kernel не запускался):`,
      'fr-CA': `Résultat local (Lean kernel n'a pas été exécuté):`,
      'de-DE': `Lokales Ergebnis (Lean-Kernel wurde nicht ausgeführt):`,
      'hi-IN': `स्थानीय परिणाम (Lean kernel चलाया नहीं गया):`,
      'ms-MY': `Keputusan tempatan (Lean kernel tidak dijalankan):`,
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
  'runtime.legacy.ca48886b3096': {
    source: `Детерминированное кольцо Мерсенна`,
    status: 'pending-translation',
    values: {
      'ru': `Детерминированное кольцо Мерсенна`,
    },
  },
  'runtime.legacy.caa109ba8efc': {
    source: `Каспы и точки самопересечения.`,
    status: 'pending-translation',
    values: {
      'ru': `Каспы и точки самопересечения.`,
    },
  },
  'runtime.legacy.cac63c3515cd': {
    source: `Гиперинфляция`,
    status: 'pending-translation',
    values: {
      'ru': `Гиперинфляция`,
    },
  },
  'runtime.legacy.cad8e18beb61': {
    source: `Проверка сохранения типов и онтологической сущности`,
    status: 'pending-translation',
    values: {
      'ru': `Проверка сохранения типов и онтологической сущности`,
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
  'runtime.legacy.caf75a4d008c': {
    source: `Эволюция супербактерий.`,
    status: 'pending-translation',
    values: {
      'ru': `Эволюция супербактерий.`,
    },
  },
  'runtime.legacy.cb2d8e6f0526': {
    source: `Вероятность гибели человечества.`,
    status: 'pending-translation',
    values: {
      'ru': `Вероятность гибели человечества.`,
    },
  },
  'runtime.legacy.cb443d465332': {
    source: `Критический период развития.`,
    status: 'pending-translation',
    values: {
      'ru': `Критический период развития.`,
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
  'runtime.legacy.cbed069637db': {
    source: `Невычислимость в пределе.`,
    status: 'pending-translation',
    values: {
      'ru': `Невычислимость в пределе.`,
    },
  },
  'runtime.legacy.cc369997930d': {
    source: `Деградация нейронных связей.`,
    status: 'pending-translation',
    values: {
      'ru': `Деградация нейронных связей.`,
    },
  },
  'runtime.legacy.cc9a1c821c58': {
    source: `Метод`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Метод`,
      'fr-CA': `Méthode`,
      'de-DE': `Methode`,
      'hi-IN': `विधि`,
      'ms-MY': `Kaedah`,
    },
  },
  'runtime.legacy.ccf91969eed7': {
    source: `Инварианты Конвея.`,
    status: 'pending-translation',
    values: {
      'ru': `Инварианты Конвея.`,
    },
  },
  'runtime.legacy.cd96f3e3531d': {
    source: `Сингулярная проблема`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярная проблема`,
    },
  },
  'runtime.legacy.cdee156221e9': {
    source: `Сумма двух простых.`,
    status: 'pending-translation',
    values: {
      'ru': `Сумма двух простых.`,
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
  'runtime.legacy.ce2cc55928c6': {
    source: `Расходимость нулевых колебаний.`,
    status: 'pending-translation',
    values: {
      'ru': `Расходимость нулевых колебаний.`,
    },
  },
  'runtime.legacy.ce9d0a67bae5': {
    source: `Изолированный узел`,
    status: 'pending-translation',
    values: {
      'ru': `Изолированный узел`,
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
  'runtime.legacy.cec0432e7884': {
    source: `: строка (зона науки, например `,
    status: 'pending-translation',
    values: {
      'ru': `: строка (зона науки, например `,
    },
  },
  'runtime.legacy.ced07fd14401': {
    source: `нет`,
    status: 'pending-translation',
    values: {
      'ru': `нет`,
    },
  },
  'runtime.legacy.cf70ed015642': {
    source: `Применение разностного оператора плоскости Delta_plane без пределов`,
    status: 'pending-translation',
    values: {
      'ru': `Применение разностного оператора плоскости Delta_plane без пределов`,
    },
  },
  'runtime.legacy.d00364f2d96c': {
    source: `Гематоэнцефалический барьер`,
    status: 'pending-translation',
    values: {
      'ru': `Гематоэнцефалический барьер`,
    },
  },
  'runtime.legacy.d00a10505d77': {
    source: `Сингулярности псевдоголоморфных кривых.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярности псевдоголоморфных кривых.`,
    },
  },
  'runtime.legacy.d01ad8d4ecec': {
    source: `Геометрия фракталов`,
    status: 'pending-translation',
    values: {
      'ru': `Геометрия фракталов`,
    },
  },
  'runtime.legacy.d01b8c69497a': {
    source: `Этика и Когнитивистика`,
    status: 'pending-translation',
    values: {
      'ru': `Этика и Когнитивистика`,
    },
  },
  'runtime.legacy.d098b97f44a2': {
    source: `Подвижные особые точки решений нелинейных ДУ.`,
    status: 'pending-translation',
    values: {
      'ru': `Подвижные особые точки решений нелинейных ДУ.`,
    },
  },
  'runtime.legacy.d0a44843627a': {
    source: `Formalize(ЭффектАароноваБома)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(ЭффектАароноваБома)`,
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
  'runtime.legacy.d18ebb5a0d55': {
    source: `Обнаружено использование классических бесконечных пределов (Cauchy limits / ZFC). В рамках RICIS-III пределы автоматически преобразуются в вызовы RICIS-мостов F_0 или inf_0 в кольце Мерсенна M_k.`,
    status: 'pending-translation',
    values: {
      'ru': `Обнаружено использование классических бесконечных пределов (Cauchy limits / ZFC). В рамках RICIS-III пределы автоматически преобразуются в вызовы RICIS-мостов F_0 или inf_0 в кольце Мерсенна M_k.`,
    },
  },
  'runtime.legacy.d190824763af': {
    source: `Formalize(Голографическийпринцип)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Голографическийпринцип)`,
    },
  },
  'runtime.legacy.d1a8760135c4': {
    source: `Случайные графы`,
    status: 'pending-translation',
    values: {
      'ru': `Случайные графы`,
    },
  },
  'runtime.legacy.d1c5376e5af1': {
    source: `Гипотетический взрывной рост интеллекта.`,
    status: 'pending-translation',
    values: {
      'ru': `Гипотетический взрывной рост интеллекта.`,
    },
  },
  'runtime.legacy.d206764a2a5b': {
    source: `Формальный дизайн лекарственных молекул с учётом сложных целевых функций AGI.`,
    status: 'pending-translation',
    values: {
      'ru': `Формальный дизайн лекарственных молекул с учётом сложных целевых функций AGI.`,
    },
  },
  'runtime.legacy.d244f6e67260': {
    source: `Сингулярность эгоистической рациональности.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность эгоистической рациональности.`,
    },
  },
  'runtime.legacy.d24dd1ff90b4': {
    source: `>Выбранная задача</span><span className=`,
    status: 'pending-translation',
    values: {
      'ru': `>Выбранная задача</span><span className=`,
    },
  },
  'runtime.legacy.d25868aeeb90': {
    source: `Сингулярные возмущения ДУ`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярные возмущения ДУ`,
    },
  },
  'runtime.legacy.d3302de13d20': {
    source: `Гипотеза ER=EPR.`,
    status: 'pending-translation',
    values: {
      'ru': `Гипотеза ER=EPR.`,
    },
  },
  'runtime.legacy.d34cd1d50e56': {
    source: `ШАГИ ДОКАЗАТЕЛЬСТВА:`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `ШАГИ ДОКАЗАТЕЛЬСТВА:`,
      'fr-CA': `ÉTAPES DE LA PREUVE:`,
      'de-DE': `BEWEISSCHRITTE:`,
      'hi-IN': `प्रमाण के चरण:`,
      'ms-MY': `LANGKAH BUKTI:`,
    },
  },
  'runtime.legacy.d3592853231b': {
    source: `Ценообразование опционов.`,
    status: 'pending-translation',
    values: {
      'ru': `Ценообразование опционов.`,
    },
  },
  'runtime.legacy.d39308226cf7': {
    source: `Формализация целевой функции AGI и избежание расхождения путей.`,
    status: 'pending-translation',
    values: {
      'ru': `Формализация целевой функции AGI и избежание расхождения путей.`,
    },
  },
  'runtime.legacy.d3a5b4a56669': {
    source: `Formalize(ТеоремаГеделяонеполноте)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(ТеоремаГеделяонеполноте)`,
    },
  },
  'runtime.legacy.d3ade4f1f338': {
    source: `Экранирование магнитного момента.`,
    status: 'pending-translation',
    values: {
      'ru': `Экранирование магнитного момента.`,
    },
  },
  'runtime.legacy.d3e7b15c618b': {
    source: ` или бессодержательный Lean 4 код `,
    status: 'pending-translation',
    values: {
      'ru': ` или бессодержательный Lean 4 код `,
    },
  },
  'runtime.legacy.d3f8d194ce7d': {
    source: `Сингулярность границы AdS-пространства.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность границы AdS-пространства.`,
    },
  },
  'runtime.legacy.d4052a6770cf': {
    source: `Formalize(Сингулярностьдираковскойструны)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Сингулярностьдираковскойструны)`,
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
  'runtime.legacy.d425b5986378': {
    source: `Сингулярности кратных точек.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярности кратных точек.`,
    },
  },
  'runtime.legacy.d5172634dd4d': {
    source: `Применение монолитов RICIS-III для квантовой гравитации и объединения взаимодействий.`,
    status: 'pending-translation',
    values: {
      'ru': `Применение монолитов RICIS-III для квантовой гравитации и объединения взаимодействий.`,
    },
  },
  'runtime.legacy.d5841c8973c4': {
    source: `Рыночные крахи.`,
    status: 'pending-translation',
    values: {
      'ru': `Рыночные крахи.`,
    },
  },
  'runtime.legacy.d586aaa955fd': {
    source: `Formalize(ГладкоерешениеуравненийНавьеСтокса)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(ГладкоерешениеуравненийНавьеСтокса)`,
    },
  },
  'runtime.legacy.d58a6809d3d6': {
    source: `Formalize(СингулярностьфункцииВейерштрасса)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(СингулярностьфункцииВейерштрасса)`,
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
  'runtime.legacy.d609108e2acb': {
    source: `Formalize(Темнаяэнергия)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Темнаяэнергия)`,
    },
  },
  'runtime.legacy.d7119b8ee559': {
    source: `Состояния на краю, защищенные топологией.`,
    status: 'pending-translation',
    values: {
      'ru': `Состояния на краю, защищенные топологией.`,
    },
  },
  'runtime.legacy.d74600e99e7c': {
    source: `Formalize(ТеорияЯнгаМиллса:существованиеимассоваящель)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(ТеорияЯнгаМиллса:существованиеимассоваящель)`,
    },
  },
  'runtime.legacy.d79394226257': {
    source: ` в канонический модуль `,
    status: 'pending-translation',
    values: {
      'ru': ` в канонический модуль `,
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
  'runtime.legacy.d81e3154fa23': {
    source: `Сингулярность флуктуаций плотности.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность флуктуаций плотности.`,
    },
  },
  'runtime.legacy.d8412268d78e': {
    source: `Взрыв градиентов в глубоких сетях.`,
    status: 'pending-translation',
    values: {
      'ru': `Взрыв градиентов в глубоких сетях.`,
    },
  },
  'runtime.legacy.d8468152c7c0': {
    source: `Детали вычисления`,
    status: 'pending-translation',
    values: {
      'ru': `Детали вычисления`,
    },
  },
  'runtime.legacy.d8b359b0803d': {
    source: `Экономика без работы.`,
    status: 'pending-translation',
    values: {
      'ru': `Экономика без работы.`,
    },
  },
  'runtime.legacy.d95c0d9592bb': {
    source: `\\\\textbf{RICIS-III Аналитическое доказательство}`,
    status: 'pending-translation',
    values: {
      'ru': `\\\\textbf{RICIS-III Аналитическое доказательство}`,
    },
  },
  'runtime.legacy.d9710a343dc2': {
    source: `Сложность: {{value}}`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Сложность: {{value}}`,
      'fr-CA': `Complexité : {{value}}`,
      'de-DE': `Komplexität: {{value}}`,
      'hi-IN': `जटिलता: {{value}}`,
      'ms-MY': `Kompleksiti: {{value}}`,
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
  'runtime.legacy.da78036495f0': {
    source: `Строгое доказательство существования квантовой теории поля.`,
    status: 'pending-translation',
    values: {
      'ru': `Строгое доказательство существования квантовой теории поля.`,
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
  'runtime.legacy.daa8369d2b0c': {
    source: `>Найденные узлы</h2><span className=`,
    status: 'pending-translation',
    values: {
      'ru': `>Найденные узлы</h2><span className=`,
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
  'runtime.legacy.daf417d2e8b7': {
    source: `Formalize(Топологическиеизоляторы)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Топологическиеизоляторы)`,
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
  'runtime.legacy.dc5b2a547402': {
    source: `Пользовательское доказательство Lean 4`,
    status: 'pending-translation',
    values: {
      'ru': `Пользовательское доказательство Lean 4`,
    },
  },
  'runtime.legacy.dd4496719f6c': {
    source: `не должен вызывать onCommit во время непрерывного изменения значений ползунка`,
    status: 'pending-translation',
    values: {
      'ru': `не должен вызывать onCommit во время непрерывного изменения значений ползунка`,
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
  'runtime.legacy.ddf89724c415': {
    source: `Фазовый набег электрона.`,
    status: 'pending-translation',
    values: {
      'ru': `Фазовый набег электрона.`,
    },
  },
  'runtime.legacy.de09fd006ee8': {
    source: `Косое произведение ортогональных векторов det(u,v) = F * G или 0_F * \\\\infty_F = F^2`,
    status: 'pending-translation',
    values: {
      'ru': `Косое произведение ортогональных векторов det(u,v) = F * G или 0_F * \\\\infty_F = F^2`,
    },
  },
  'runtime.legacy.df23d54a1516': {
    source: `Дискретность холловского сопротивления.`,
    status: 'pending-translation',
    values: {
      'ru': `Дискретность холловского сопротивления.`,
    },
  },
  'runtime.legacy.df79812345b6': {
    source: `Основа RICIS-III`,
    status: 'pending-translation',
    values: {
      'ru': `Основа RICIS-III`,
    },
  },
  'runtime.legacy.df7ccab612af': {
    source: `Конические точки в компактных пространствах.`,
    status: 'pending-translation',
    values: {
      'ru': `Конические точки в компактных пространствах.`,
    },
  },
  'runtime.legacy.df9ea52be5ee': {
    source: `Информационный парадокс черных дыр`,
    status: 'pending-translation',
    values: {
      'ru': `Информационный парадокс черных дыр`,
    },
  },
  'runtime.legacy.dfc3bd2b45d7': {
    source: `Премия Джанга / Остроговского $1,000,000 (abc Conjecture)`,
    status: 'pending-translation',
    values: {
      'ru': `Премия Джанга / Остроговского $1,000,000 (abc Conjecture)`,
    },
  },
  'runtime.legacy.dfd794eb1f6a': {
    source: `Ухудшение пропускной способности при добавлении дорог.`,
    status: 'pending-translation',
    values: {
      'ru': `Ухудшение пропускной способности при добавлении дорог.`,
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
  'runtime.legacy.e0116dd5545c': {
    source: `Например: Эксперт RICIS-III`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Например: Эксперт RICIS-III`,
      'fr-CA': `Exemple : Expert RICIS-III`,
      'de-DE': `Beispiel: RICIS-III-Experte`,
      'hi-IN': `उदाहरण: RICIS-III विशेषज्ञ`,
      'ms-MY': `Contoh: Pakar RICIS-III`,
    },
  },
  'runtime.legacy.e012c0ae7f6a': {
    source: `бесконечная полоса`,
    status: 'pending-translation',
    values: {
      'ru': `бесконечная полоса`,
    },
  },
  'runtime.legacy.e03e45479c4f': {
    source: `Formalize(Экзистенциальныйриск)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Экзистенциальныйриск)`,
    },
  },
  'runtime.legacy.e0de5abbbbee': {
    source: `Статус доверия: RICIS_PROVEN`,
    status: 'pending-translation',
    values: {
      'ru': `Статус доверия: RICIS_PROVEN`,
    },
  },
  'runtime.legacy.e11c5aa1c9da': {
    source: `Фрактальная размерность аттрактора.`,
    status: 'pending-translation',
    values: {
      'ru': `Фрактальная размерность аттрактора.`,
    },
  },
  'runtime.legacy.e16203869fc5': {
    source: `Косое произведение u=(F,0), v=(0,G), det(u,v)=F*G`,
    status: 'pending-translation',
    values: {
      'ru': `Косое произведение u=(F,0), v=(0,G), det(u,v)=F*G`,
    },
  },
  'runtime.legacy.e17c83320288': {
    source: `Размерность пространства генотипов.`,
    status: 'pending-translation',
    values: {
      'ru': `Размерность пространства генотипов.`,
    },
  },
  'runtime.legacy.e18009bef5d2': {
    source: `найди`,
    status: 'pending-translation',
    values: {
      'ru': `найди`,
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
  'runtime.legacy.e2bb1d6487f8': {
    source: `Обнаружено упоминание Lean, но ключевые слова (theorem, lemma, def) отсутствуют. Код трактуется как LaTeX/текстовое описание.`,
    status: 'pending-translation',
    values: {
      'ru': `Обнаружено упоминание Lean, но ключевые слова (theorem, lemma, def) отсутствуют. Код трактуется как LaTeX/текстовое описание.`,
    },
  },
  'runtime.legacy.e2c3a25e136d': {
    source: `Византийские генералы.`,
    status: 'pending-translation',
    values: {
      'ru': `Византийские генералы.`,
    },
  },
  'runtime.legacy.e2c4048230bd': {
    source: `Разрешение сингулярностей (Деление на ноль)`,
    status: 'pending-translation',
    values: {
      'ru': `Разрешение сингулярностей (Деление на ноль)`,
    },
  },
  'runtime.legacy.e2de737f9e55': {
    source: `Formalize(Персонализированнаямедицина)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Персонализированнаямедицина)`,
    },
  },
  'runtime.legacy.e2e5d52e9f71': {
    source: `Formalize(УравнениеКортевегадеФриза)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(УравнениеКортевегадеФриза)`,
    },
  },
  'runtime.legacy.e361dc75d59f': {
    source: `Распределение богатства Парето`,
    status: 'pending-translation',
    values: {
      'ru': `Распределение богатства Парето`,
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
  'runtime.legacy.e4129729cab5': {
    source: `Структурные нули алгебры.`,
    status: 'pending-translation',
    values: {
      'ru': `Структурные нули алгебры.`,
    },
  },
  'runtime.legacy.e416ae0ebfdd': {
    source: `Токсичность наноматериалов`,
    status: 'pending-translation',
    values: {
      'ru': `Токсичность наноматериалов`,
    },
  },
  'runtime.legacy.e41fd7f353a3': {
    source: `Formalize(Спектральнаяасимптотика)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Спектральнаяасимптотика)`,
    },
  },
  'runtime.legacy.e4b0e2f188f4': {
    source: `Молекулярный дизайн и синтез.`,
    status: 'pending-translation',
    values: {
      'ru': `Молекулярный дизайн и синтез.`,
    },
  },
  'runtime.legacy.e5b2b7911c87': {
    source: `Метод доказательства: {{value}}`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Метод доказательства: {{value}}`,
      'fr-CA': `Méthode de preuve : {{value}}`,
      'de-DE': `Beweismethode: {{value}}`,
      'hi-IN': `प्रमाण विधि: {{value}}`,
      'ms-MY': `Kaedah bukti: {{value}}`,
    },
  },
  'runtime.legacy.e5c989a27430': {
    source: `Онкогенез`,
    status: 'pending-translation',
    values: {
      'ru': `Онкогенез`,
    },
  },
  'runtime.legacy.e6026511e43b': {
    source: `Квантовый эффект Холла`,
    status: 'pending-translation',
    values: {
      'ru': `Квантовый эффект Холла`,
    },
  },
  'runtime.legacy.e6a19e53c63e': {
    source: `Расходимость денежной массы.`,
    status: 'pending-translation',
    values: {
      'ru': `Расходимость денежной массы.`,
    },
  },
  'runtime.legacy.e76112d8ca9d': {
    source: `Топологические сингулярности (разрешены).`,
    status: 'pending-translation',
    values: {
      'ru': `Топологические сингулярности (разрешены).`,
    },
  },
  'runtime.legacy.e761f9ed9a25': {
    source: `Алгебраические квантовые сингулярности.`,
    status: 'pending-translation',
    values: {
      'ru': `Алгебраические квантовые сингулярности.`,
    },
  },
  'runtime.legacy.e77c1b7043db': {
    source: `Сингулярность функции выживания (вероятность 0).`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность функции выживания (вероятность 0).`,
    },
  },
  'runtime.legacy.e78cc81b64ab': {
    source: `Проблема катастрофического забывания`,
    status: 'pending-translation',
    values: {
      'ru': `Проблема катастрофического забывания`,
    },
  },
  'runtime.legacy.e7dfd0742832': {
    source: `Formalize(МодельБлэкаШоулза)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(МодельБлэкаШоулза)`,
    },
  },
  'runtime.legacy.e7f323049a6b': {
    source: `Разрешение особенностей алгебраических многообразий в характеристике p>0.`,
    status: 'pending-translation',
    values: {
      'ru': `Разрешение особенностей алгебраических многообразий в характеристике p>0.`,
    },
  },
  'runtime.legacy.e7fc9df41565': {
    source: `Самофокусировка лазерного луча.`,
    status: 'pending-translation',
    values: {
      'ru': `Самофокусировка лазерного луча.`,
    },
  },
  'runtime.legacy.e85802ab4760': {
    source: `должен содержать Gemini 3.7 Flash как модель по умолчанию`,
    status: 'pending-translation',
    values: {
      'ru': `должен содержать Gemini 3.7 Flash как модель по умолчанию`,
    },
  },
  'runtime.legacy.e8b964da61ec': {
    source: `Высокотемпературная сверхпроводимость`,
    status: 'pending-translation',
    values: {
      'ru': `Высокотемпературная сверхпроводимость`,
    },
  },
  'runtime.legacy.e8c8ca12c02d': {
    source: `Загрузить в строку ввода`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Загрузить в строку ввода`,
      'fr-CA': `Charger dans le champ de saisie`,
      'de-DE': `In Eingabefeld laden`,
      'hi-IN': `इनपुट में लोड करें`,
      'ms-MY': `Muat ke dalam input`,
    },
  },
  'runtime.legacy.e940d71b552e': {
    source: `Появление гигантской компоненты.`,
    status: 'pending-translation',
    values: {
      'ru': `Появление гигантской компоненты.`,
    },
  },
  'runtime.legacy.e94409d48493': {
    source: `Formalize(ОстановкамашиныТьюринга)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(ОстановкамашиныТьюринга)`,
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
  'runtime.legacy.e99196617fe8': {
    source: `Расходимость энергии вакуума (регуляризуемая).`,
    status: 'pending-translation',
    values: {
      'ru': `Расходимость энергии вакуума (регуляризуемая).`,
    },
  },
  'runtime.legacy.e9db01259912': {
    source: `Formalize(НелинейноеуравнениеШредингера)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(НелинейноеуравнениеШредингера)`,
    },
  },
  'runtime.legacy.e9dd7362cd17': {
    source: `Сингулярность при малом параметре при старшей производной.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность при малом параметре при старшей производной.`,
    },
  },
  'runtime.legacy.ea6f301d1e12': {
    source: `Formalize(Свертываниебелка(ProteinFolding))`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Свертываниебелка(ProteinFolding))`,
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
  'runtime.legacy.eb728f1fbccc': {
    source: `Монолитная алгебра RICIS-III для вычисления 0/0.`,
    status: 'pending-translation',
    values: {
      'ru': `Монолитная алгебра RICIS-III для вычисления 0/0.`,
    },
  },
  'runtime.legacy.eb840e09df91': {
    source: `>G Узлов: <strong className=`,
    status: 'pending-translation',
    values: {
      'ru': `>G Узлов: <strong className=`,
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
  'runtime.legacy.ebec4d2d12d3': {
    source: `Formalize(Универсальныйбазовыйдоход(UBI))`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Универсальныйбазовыйдоход(UBI))`,
    },
  },
  'runtime.legacy.ec7e41d13122': {
    source: `Монетизация через RICIS-III Чат-Бот: Разрешение Сингулярностей и Авто-Обучение БД`,
    status: 'pending-translation',
    values: {
      'ru': `Монетизация через RICIS-III Чат-Бот: Разрешение Сингулярностей и Авто-Обучение БД`,
    },
  },
  'runtime.legacy.ecaf741e9ba3': {
    source: `Внешний Lean proof принят как trusted axiom.`,
    status: 'pending-translation',
    values: {
      'ru': `Внешний Lean proof принят как trusted axiom.`,
    },
  },
  'runtime.legacy.ecd33265a7bd': {
    source: `Темная энергия`,
    status: 'pending-translation',
    values: {
      'ru': `Темная энергия`,
    },
  },
  'runtime.legacy.ecfea390598e': {
    source: `Нейропластичность`,
    status: 'pending-translation',
    values: {
      'ru': `Нейропластичность`,
    },
  },
  'runtime.legacy.ed44613a9615': {
    source: `должен корректно генерировать URL для задачи на карте`,
    status: 'pending-translation',
    values: {
      'ru': `должен корректно генерировать URL для задачи на карте`,
    },
  },
  'runtime.legacy.ed774a9c975b': {
    source: `Эффект Ааронова — Бома`,
    status: 'pending-translation',
    values: {
      'ru': `Эффект Ааронова — Бома`,
    },
  },
  'runtime.legacy.edb0eda9067b': {
    source: `• \`HYPOTHESIS\` — предположение.\\n`,
    status: 'pending-translation',
    values: {
      'ru': `• \`HYPOTHESIS\` — предположение.\\n`,
    },
  },
  'runtime.legacy.edda37857883': {
    source: `должен сбрасывать таймер IDLE при возобновлении движения до истечения таймаута`,
    status: 'pending-translation',
    values: {
      'ru': `должен сбрасывать таймер IDLE при возобновлении движения до истечения таймаута`,
    },
  },
  'runtime.legacy.ee592986e651': {
    source: `Крионика`,
    status: 'pending-translation',
    values: {
      'ru': `Крионика`,
    },
  },
  'runtime.legacy.ee899dd5ccb8': {
    source: `Шаг`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Шаг`,
      'fr-CA': `Étape`,
      'de-DE': `Schritt`,
      'hi-IN': `चरण`,
      'ms-MY': `Langkah`,
    },
  },
  'runtime.legacy.eefa5e70963d': {
    source: `Метод: {{value}}`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Метод: {{value}}`,
      'fr-CA': `Méthode : {{value}}`,
      'de-DE': `Methode: {{value}}`,
      'hi-IN': `विधि: {{value}}`,
      'ms-MY': `Kaedah: {{value}}`,
    },
  },
  'runtime.legacy.ef9570f0fa3f': {
    source: `Внешняя публикация/исследование, использующее методы RICIS-III.`,
    status: 'pending-translation',
    values: {
      'ru': `Внешняя публикация/исследование, использующее методы RICIS-III.`,
    },
  },
  'runtime.legacy.efd92bcd81e5': {
    source: `Теория Янга-Миллса: существование и массовая щель`,
    status: 'pending-translation',
    values: {
      'ru': `Теория Янга-Миллса: существование и массовая щель`,
    },
  },
  'runtime.legacy.f018e0cbc5fe': {
    source: `Побитовый геометрический анализ в циклическом кольце Мерсенна M = 2^k - 1, сводящий NP-сложность (TSP, SAT, факторизация) к детерминированному O(1) за 1 такт процессора.`,
    status: 'pending-translation',
    values: {
      'ru': `Побитовый геометрический анализ в циклическом кольце Мерсенна M = 2^k - 1, сводящий NP-сложность (TSP, SAT, факторизация) к детерминированному O(1) за 1 такт процессора.`,
    },
  },
  'runtime.legacy.f01de99eb51d': {
    source: `Свертывание белка (Protein Folding)`,
    status: 'pending-translation',
    values: {
      'ru': `Свертывание белка (Protein Folding)`,
    },
  },
  'runtime.legacy.f084a1ab0c07': {
    source: `Сингулярность ИИ`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность ИИ`,
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
  'runtime.legacy.f0fdecff4de1': {
    source: `Сложность метилирования ДНК.`,
    status: 'pending-translation',
    values: {
      'ru': `Сложность метилирования ДНК.`,
    },
  },
  'runtime.legacy.f117b0184168': {
    source: `Метод пограничного слоя.`,
    status: 'pending-translation',
    values: {
      'ru': `Метод пограничного слоя.`,
    },
  },
  'runtime.legacy.f183ca66393d': {
    source: `Космические струны`,
    status: 'pending-translation',
    values: {
      'ru': `Космические струны`,
    },
  },
  'runtime.legacy.f18a74f42fa8': {
    source: `Топологическая сингулярность (складка, сборка).`,
    status: 'pending-translation',
    values: {
      'ru': `Топологическая сингулярность (складка, сборка).`,
    },
  },
  'runtime.legacy.f1c708163f00': {
    source: `Сохранение и Экспорт`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Сохранение и Экспорт`,
      'fr-CA': `Persistance et exportation`,
      'de-DE': `Persistenz & Export`,
      'hi-IN': `स्थायी भंडारण और निर्यात`,
      'ms-MY': `Penyimpanan & Eksport`,
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
  'runtime.legacy.f2312e6bd6b2': {
    source: `Formalize(СингулярностиРиччипотока)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(СингулярностиРиччипотока)`,
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
  'runtime.legacy.f30d0ca65067': {
    source: `Production endpoint Ricis.Core настроен некорректно. Результат не вычислялся.`,
    status: 'pending-translation',
    values: {
      'ru': `Production endpoint Ricis.Core настроен некорректно. Результат не вычислялся.`,
    },
  },
  'runtime.legacy.f3366bd8be17': {
    source: `• \`CLASSICAL_INHERITED\` — применено классическое правило, не перекрытое RICIS.\\n`,
    status: 'pending-translation',
    values: {
      'ru': `• \`CLASSICAL_INHERITED\` — применено классическое правило, не перекрытое RICIS.\\n`,
    },
  },
  'runtime.legacy.f39afdbcf779': {
    source: `Косое произведение в кольце Мерсенна`,
    status: 'pending-translation',
    values: {
      'ru': `Косое произведение в кольце Мерсенна`,
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
  'runtime.legacy.f482b1c8182b': {
    source: `P = NP [Детерминированное побитовое сведение в кольцах Мерсенна M = 2^k - 1]`,
    status: 'pending-translation',
    values: {
      'ru': `P = NP [Детерминированное побитовое сведение в кольцах Мерсенна M = 2^k - 1]`,
    },
  },
  'runtime.legacy.f4ceb2599769': {
    source: `Алгоритмы консенсуса`,
    status: 'pending-translation',
    values: {
      'ru': `Алгоритмы консенсуса`,
    },
  },
  'runtime.legacy.f5441f6aee76': {
    source: `Описание`,
    status: 'pending-translation',
    values: {
      'ru': `Описание`,
    },
  },
  'runtime.legacy.f55aa07a5bee': {
    source: `Регенерация тканей`,
    status: 'pending-translation',
    values: {
      'ru': `Регенерация тканей`,
    },
  },
  'runtime.legacy.f5a70bc9b9e9': {
    source: `Автоопределение по заголовку браузера`,
    status: 'translated-from-existing-resource',
    values: {
      'ru': `Автоопределение по заголовку браузера`,
      'fr-CA': `Détection automatique à partir de la langue du navigateur`,
      'de-DE': `Automatische Erkennung anhand der Browsersprache`,
      'hi-IN': `ब्राउज़र भाषा से स्वतः पहचान`,
      'ms-MY': `Pengesanan automatik dari bahasa pelayar`,
    },
  },
  'runtime.legacy.f5e03eed0eab': {
    source: `Аудит RICIS-III доказательств: Все существующие доказательства соответствуют A6 и спецификации Lean 4.`,
    status: 'pending-translation',
    values: {
      'ru': `Аудит RICIS-III доказательств: Все существующие доказательства соответствуют A6 и спецификации Lean 4.`,
    },
  },
  'runtime.legacy.f60400c322cf': {
    source: `Комбинаторный взрыв нейтрализуется точечным схождением вырожденного каркаса.`,
    status: 'pending-translation',
    values: {
      'ru': `Комбинаторный взрыв нейтрализуется точечным схождением вырожденного каркаса.`,
    },
  },
  'runtime.legacy.f6382932af36': {
    source: `Колмогоровская сложность`,
    status: 'pending-translation',
    values: {
      'ru': `Колмогоровская сложность`,
    },
  },
  'runtime.legacy.f68e53d6c891': {
    source: `Премия Института Клея $1,000,000 (Уравнения Навье-Стокса)`,
    status: 'pending-translation',
    values: {
      'ru': `Премия Института Клея $1,000,000 (Уравнения Навье-Стокса)`,
    },
  },
  'runtime.legacy.f70d019bd0d1': {
    source: `Топологическое ветвление графа.`,
    status: 'pending-translation',
    values: {
      'ru': `Топологическое ветвление графа.`,
    },
  },
  'runtime.legacy.f72276f4fd1a': {
    source: `Разложение больших чисел N = p*q за O(1) операцией подстановки (x^2 - N) & M в кольце Мерсенна, где M = 2^B - 1 зафиксирован разрядностью стороны квадрата B.`,
    status: 'pending-translation',
    values: {
      'ru': `Разложение больших чисел N = p*q за O(1) операцией подстановки (x^2 - N) & M в кольце Мерсенна, где M = 2^B - 1 зафиксирован разрядностью стороны квадрата B.`,
    },
  },
  'runtime.legacy.f78965a834bc': {
    source: `Сингулярности в теории струн`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярности в теории струн`,
    },
  },
  'runtime.legacy.f79f229c4ff5': {
    source: `Сверхпроводники, метаматериалы.`,
    status: 'pending-translation',
    values: {
      'ru': `Сверхпроводники, метаматериалы.`,
    },
  },
  'runtime.legacy.f7c9124519c8': {
    source: `Космологическая постоянная`,
    status: 'pending-translation',
    values: {
      'ru': `Космологическая постоянная`,
    },
  },
  'runtime.legacy.f8160cbbeb4c': {
    source: `должен очищать историю вычислений`,
    status: 'pending-translation',
    values: {
      'ru': `должен очищать историю вычислений`,
    },
  },
  'runtime.legacy.f9f508d558fa': {
    source: `Микробиом человека`,
    status: 'pending-translation',
    values: {
      'ru': `Микробиом человека`,
    },
  },
  'runtime.legacy.fa1bf80a8c1f': {
    source: `Инфраструктура Ricis.Core не завершила запрос. Результат не вычислялся.`,
    status: 'pending-translation',
    values: {
      'ru': `Инфраструктура Ricis.Core не завершила запрос. Результат не вычислялся.`,
    },
  },
  'runtime.legacy.fa3f4c7bd636': {
    source: `Проблема выравнивания ИИ (Alignment)`,
    status: 'pending-translation',
    values: {
      'ru': `Проблема выравнивания ИИ (Alignment)`,
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
  'runtime.legacy.fabff2eaf90d': {
    source: `Сингулярность декогеренции.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность декогеренции.`,
    },
  },
  'runtime.legacy.fac0d90e3da1': {
    source: `Разрешение предельного перехода аксиомами SP1-SP4`,
    status: 'pending-translation',
    values: {
      'ru': `Разрешение предельного перехода аксиомами SP1-SP4`,
    },
  },
  'runtime.legacy.fadea306c03d': {
    source: `Модель недоступна или отключена (ошибка 404).`,
    status: 'pending-translation',
    values: {
      'ru': `Модель недоступна или отключена (ошибка 404).`,
    },
  },
  'runtime.legacy.fb7b889ac815': {
    source: `Парадокс браев`,
    status: 'pending-translation',
    values: {
      'ru': `Парадокс браев`,
    },
  },
  'runtime.legacy.fbd1b0ec2f5b': {
    source: `Formalize(Квантоваяпревосходство)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Квантоваяпревосходство)`,
    },
  },
  'runtime.legacy.fbf99d7fd157': {
    source: `Теория узлов`,
    status: 'pending-translation',
    values: {
      'ru': `Теория узлов`,
    },
  },
  'runtime.legacy.fc09f503ea5f': {
    source: `Парадокс Левинталя (комбинаторный взрыв).`,
    status: 'pending-translation',
    values: {
      'ru': `Парадокс Левинталя (комбинаторный взрыв).`,
    },
  },
  'runtime.legacy.fc7bfb3b4b45': {
    source: `Магнитные монополи`,
    status: 'pending-translation',
    values: {
      'ru': `Магнитные монополи`,
    },
  },
  'runtime.legacy.fd425f05d351': {
    source: `\${description || 'Выполнить детерминированный прогон RICIS-III'}`,
    status: 'pending-translation',
    values: {
      'ru': `\${description || 'Выполнить детерминированный прогон RICIS-III'}`,
    },
  },
  'runtime.legacy.fd6c26c431cd': {
    source: `ищи`,
    status: 'pending-translation',
    values: {
      'ru': `ищи`,
    },
  },
  'runtime.legacy.fd8e16acfe43': {
    source: `Сингулярность этической функции полезности.`,
    status: 'pending-translation',
    values: {
      'ru': `Сингулярность этической функции полезности.`,
    },
  },
  'runtime.legacy.fdd1ae619594': {
    source: `Автоматически созданная область наук`,
    status: 'pending-translation',
    values: {
      'ru': `Автоматически созданная область наук`,
    },
  },
  'runtime.legacy.febd7ee896a6': {
    source: `Мировое признание / Академическая премия $50,000,000`,
    status: 'pending-translation',
    values: {
      'ru': `Мировое признание / Академическая премия $50,000,000`,
    },
  },
  'runtime.legacy.ff1dd5929a7d': {
    source: `Взрыв решений за конечное время.`,
    status: 'pending-translation',
    values: {
      'ru': `Взрыв решений за конечное время.`,
    },
  },
  'runtime.legacy.ff4f53500e7b': {
    source: `Теорема Эрроу о невозможности`,
    status: 'pending-translation',
    values: {
      'ru': `Теорема Эрроу о невозможности`,
    },
  },
  'runtime.legacy.ff699a5e293f': {
    source: `Formalize(Квантоваягравитация)`,
    status: 'pending-translation',
    values: {
      'ru': `Formalize(Квантоваягравитация)`,
    },
  },
  'runtime.legacy.ffb22ba0d5f7': {
    source: `Параметры сгенерированы каноническим движком RICIS-III.`,
    status: 'pending-translation',
    values: {
      'ru': `Параметры сгенерированы каноническим движком RICIS-III.`,
    },
  },
  'ui.legacy.023025363aea': {
    source: `Сбросить физику к значениям по умолчанию`,
    status: 'pending-translation',
    values: {
      'ru': `Сбросить физику к значениям по умолчанию`,
    },
  },
  'ui.legacy.023049d9bd10': {
    source: `факторизац`,
    status: 'pending-translation',
    values: {
      'ru': `факторизац`,
    },
  },
  'ui.legacy.029712ba8b4e': {
    source: `1. Генерация трехмерного звездного поля (StarField Data)`,
    status: 'pending-translation',
    values: {
      'ru': `1. Генерация трехмерного звездного поля (StarField Data)`,
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
  'ui.legacy.0b3893c28c4b': {
    source: `Генерировать JSON`,
    status: 'pending-translation',
    values: {
      'ru': `Генерировать JSON`,
    },
  },
  'ui.legacy.0d5d097d1bff': {
    source: `доказательств`,
    status: 'pending-translation',
    values: {
      'ru': `доказательств`,
    },
  },
  'ui.legacy.0efa9ff1b508': {
    source: `должен генерировать корректные типизированные массивы для позиций, цветов и размеров звезд`,
    status: 'pending-translation',
    values: {
      'ru': `должен генерировать корректные типизированные массивы для позиций, цветов и размеров звезд`,
    },
  },
  'ui.legacy.0f0d59713360': {
    source: `Сбросить вид`,
    status: 'pending-translation',
    values: {
      'ru': `Сбросить вид`,
    },
  },
  'ui.legacy.11469d5eefb3': {
    source: `Вставьте Lean 4 или LaTeX. Lean-код получает статус verified только после воспроизводимого запуска kernel.`,
    status: 'pending-translation',
    values: {
      'ru': `Вставьте Lean 4 или LaTeX. Lean-код получает статус verified только после воспроизводимого запуска kernel.`,
    },
  },
  'ui.legacy.11af88506882': {
    source: `Зазор между зонами`,
    status: 'pending-translation',
    values: {
      'ru': `Зазор между зонами`,
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
  'ui.legacy.14091e1da7bb': {
    source: `Начните с задачи`,
    status: 'pending-translation',
    values: {
      'ru': `Начните с задачи`,
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
  'ui.legacy.16af71f23ef3': {
    source: `Проверить RICIS Core`,
    status: 'pending-translation',
    values: {
      'ru': `Проверить RICIS Core`,
    },
  },
  'ui.legacy.1700a6fb66b7': {
    source: `Производная задача`,
    status: 'pending-translation',
    values: {
      'ru': `Производная задача`,
    },
  },
  'ui.legacy.17c2d352b735': {
    source: `Режим списка`,
    status: 'pending-translation',
    values: {
      'ru': `Режим списка`,
    },
  },
  'ui.legacy.1974f55902be': {
    source: `Убедитесь, что математический результат не был создан`,
    status: 'pending-translation',
    values: {
      'ru': `Убедитесь, что математический результат не был создан`,
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
  'ui.legacy.218176e0dfa7': {
    source: `не должен содержать вложенных классов ограничения высоты и скроллинга (max-h-80, overflow-y-auto)`,
    status: 'pending-translation',
    values: {
      'ru': `не должен содержать вложенных классов ограничения высоты и скроллинга (max-h-80, overflow-y-auto)`,
    },
  },
  'ui.legacy.227f35314579': {
    source: `Выйти из полноэкранного режима`,
    status: 'pending-translation',
    values: {
      'ru': `Выйти из полноэкранного режима`,
    },
  },
  'ui.legacy.245372770fef': {
    source: `До готовности C# Core приложение не создаёт математический инвариант, trace или proof.`,
    status: 'pending-translation',
    values: {
      'ru': `До готовности C# Core приложение не создаёт математический инвариант, trace или proof.`,
    },
  },
  'ui.legacy.256bea5d2f13': {
    source: `коммивояж`,
    status: 'pending-translation',
    values: {
      'ru': `коммивояж`,
    },
  },
  'ui.legacy.25fdfa345a26': {
    source: `Управление наклоном отключено.`,
    status: 'pending-translation',
    values: {
      'ru': `Управление наклоном отключено.`,
    },
  },
  'ui.legacy.2637c4b31386': {
    source: `сетев`,
    status: 'pending-translation',
    values: {
      'ru': `сетев`,
    },
  },
  'ui.legacy.263e20c565e2': {
    source: `✏️ Редактировать код`,
    status: 'pending-translation',
    values: {
      'ru': `✏️ Редактировать код`,
    },
  },
  'ui.legacy.2717a8bcd85f': {
    source: `Исходник Lean предоставлен; kernel evidence проверяется отдельно`,
    status: 'pending-translation',
    values: {
      'ru': `Исходник Lean предоставлен; kernel evidence проверяется отдельно`,
    },
  },
  'ui.legacy.294aba75e641': {
    source: `Ошибка при запросе к ИИ-агенту Gemini`,
    status: 'pending-translation',
    values: {
      'ru': `Ошибка при запросе к ИИ-агенту Gemini`,
    },
  },
  'ui.legacy.297f3444923e': {
    source: `Перерассчитать RICIS-решение`,
    status: 'pending-translation',
    values: {
      'ru': `Перерассчитать RICIS-решение`,
    },
  },
  'ui.legacy.2ac52e60049c': {
    source: `Название новой сферы...`,
    status: 'pending-translation',
    values: {
      'ru': `Название новой сферы...`,
    },
  },
  'ui.legacy.2b0083d2af45': {
    source: `Не классифицировано`,
    status: 'pending-translation',
    values: {
      'ru': `Не классифицировано`,
    },
  },
  'ui.legacy.2b4b4190a8fd': {
    source: `Скопировать безопасную диагностику`,
    status: 'pending-translation',
    values: {
      'ru': `Скопировать безопасную диагностику`,
    },
  },
  'ui.legacy.2b7fbb9535ea': {
    source: `Проверьте форму выражения`,
    status: 'pending-translation',
    values: {
      'ru': `Проверьте форму выражения`,
    },
  },
  'ui.legacy.2c3020010f95': {
    source: `Статус ИИ-Агента`,
    status: 'pending-translation',
    values: {
      'ru': `Статус ИИ-Агента`,
    },
  },
  'ui.legacy.2dabfcc806ac': {
    source: `ℹ Инфо`,
    status: 'pending-translation',
    values: {
      'ru': `ℹ Инфо`,
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
  'ui.legacy.3aae36475187': {
    source: `Отправка запроса на /api/generateProof...`,
    status: 'pending-translation',
    values: {
      'ru': `Отправка запроса на /api/generateProof...`,
    },
  },
  'ui.legacy.3ca2a5d3b0b7': {
    source: `Микро-узлы (Задачи)`,
    status: 'pending-translation',
    values: {
      'ru': `Микро-узлы (Задачи)`,
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
  'ui.legacy.40b51c1eb0b6': {
    source: `Выбранная задача`,
    status: 'pending-translation',
    values: {
      'ru': `Выбранная задача`,
    },
  },
  'ui.legacy.41335f02bf10': {
    source: `Агент добавил `,
    status: 'pending-translation',
    values: {
      'ru': `Агент добавил `,
    },
  },
  'ui.legacy.454d22abae3d': {
    source: `Это безопасное состояние: TypeScript fallback не использовался, поэтому инвариант, trace и proof отсутствуют.`,
    status: 'pending-translation',
    values: {
      'ru': `Это безопасное состояние: TypeScript fallback не использовался, поэтому инвариант, trace и proof отсутствуют.`,
    },
  },
  'ui.legacy.465e579ab062': {
    source: `Промпт скачан`,
    status: 'pending-translation',
    values: {
      'ru': `Промпт скачан`,
    },
  },
  'ui.legacy.47937d0b2e31': {
    source: `Поверните устройство: первая корректная позиция станет точкой калибровки.`,
    status: 'pending-translation',
    values: {
      'ru': `Поверните устройство: первая корректная позиция станет точкой калибровки.`,
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
  'ui.legacy.4c24bd0c5e15': {
    source: `Аудит и Верификация`,
    status: 'pending-translation',
    values: {
      'ru': `Аудит и Верификация`,
    },
  },
  'ui.legacy.4c4737b59bf9': {
    source: `3D-карта`,
    status: 'pending-translation',
    values: {
      'ru': `3D-карта`,
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
  'ui.legacy.4ddff93dd520': {
    source: `Сбросить камеру`,
    status: 'pending-translation',
    values: {
      'ru': `Сбросить камеру`,
    },
  },
  'ui.legacy.4e99c9a2b8b9': {
    source: `В этом браузере недоступны датчики ориентации.`,
    status: 'pending-translation',
    values: {
      'ru': `В этом браузере недоступны датчики ориентации.`,
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
  'ui.legacy.56eee7413a10': {
    source: `обучение`,
    status: 'pending-translation',
    values: {
      'ru': `обучение`,
    },
  },
  'ui.legacy.595eae89ef85': {
    source: `Инфраструктура Ricis.Core не завершила запрос`,
    status: 'pending-translation',
    values: {
      'ru': `Инфраструктура Ricis.Core не завершила запрос`,
    },
  },
  'ui.legacy.5a1358a965b6': {
    source: `Прозрачность связей`,
    status: 'pending-translation',
    values: {
      'ru': `Прозрачность связей`,
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
  'ui.legacy.5efb826a00db': {
    source: `📋 Копировать`,
    status: 'pending-translation',
    values: {
      'ru': `📋 Копировать`,
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
  'ui.legacy.64ee0cb183c1': {
    source: `Внешнее давление (G_ext)`,
    status: 'pending-translation',
    values: {
      'ru': `Внешнее давление (G_ext)`,
    },
  },
  'ui.legacy.656062cf16f8': {
    source: `Ориентация откалибрована по текущему виду.`,
    status: 'pending-translation',
    values: {
      'ru': `Ориентация откалибрована по текущему виду.`,
    },
  },
  'ui.legacy.66ce7dfd3466': {
    source: `❌ Ошибки`,
    status: 'pending-translation',
    values: {
      'ru': `❌ Ошибки`,
    },
  },
  'ui.legacy.6788d88ba28f': {
    source: `Трассировка 8 фаз конвейера`,
    status: 'pending-translation',
    values: {
      'ru': `Трассировка 8 фаз конвейера`,
    },
  },
  'ui.legacy.6802c4be26fb': {
    source: `✓ Успех`,
    status: 'pending-translation',
    values: {
      'ru': `✓ Успех`,
    },
  },
  'ui.legacy.683e204a88c1': {
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
  'ui.legacy.6a9a8e00a558': {
    source: `Навигация и действия`,
    status: 'pending-translation',
    values: {
      'ru': `Навигация и действия`,
    },
  },
  'ui.legacy.6b8c1cbf0793': {
    source: `Статический Pages не запускает .NET DLL. Для публичного расчёта требуется развёрнутый C# API либо настоящий browser-WASM host Ricis.Core.`,
    status: 'pending-translation',
    values: {
      'ru': `Статический Pages не запускает .NET DLL. Для публичного расчёта требуется развёрнутый C# API либо настоящий browser-WASM host Ricis.Core.`,
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
  'ui.legacy.721518d7b424': {
    source: `Сборка мусора`,
    status: 'pending-translation',
    values: {
      'ru': `Сборка мусора`,
    },
  },
  'ui.legacy.72374bf6be92': {
    source: `Открыть меню`,
    status: 'pending-translation',
    values: {
      'ru': `Открыть меню`,
    },
  },
  'ui.legacy.731d164f8888': {
    source: `Скопировать ссылку на эту задачу`,
    status: 'pending-translation',
    values: {
      'ru': `Скопировать ссылку на эту задачу`,
    },
  },
  'ui.legacy.74edccb9e7f3': {
    source: `Давление среды (G_ext)`,
    status: 'pending-translation',
    values: {
      'ru': `Давление среды (G_ext)`,
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
  'ui.legacy.7736d666c528': {
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
  'ui.legacy.785c3442c1b4': {
    source: `Допустимы +, -, *, /, %, ^, скобки, pi, e и математические функции Core: Sin, Cos, Exp, Log, Sqrt, Abs, Pow, Min, Max.`,
    status: 'pending-translation',
    values: {
      'ru': `Допустимы +, -, *, /, %, ^, скобки, pi, e и математические функции Core: Sin, Cos, Exp, Log, Sqrt, Abs, Pow, Min, Max.`,
    },
  },
  'ui.legacy.78accbe555be': {
    source: `Доступ к датчикам отклонён. Разрешите «Движение и ориентацию» в настройках браузера.`,
    status: 'pending-translation',
    values: {
      'ru': `Доступ к датчикам отклонён. Разрешите «Движение и ориентацию» в настройках браузера.`,
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
  'ui.legacy.7ec5ed7e6d3b': {
    source: `Научная задача`,
    status: 'pending-translation',
    values: {
      'ru': `Научная задача`,
    },
  },
  'ui.legacy.7f17c7c62a7f': {
    source: `Настройки`,
    status: 'pending-translation',
    values: {
      'ru': `Настройки`,
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
  'ui.legacy.7f1b83dbb5ca': {
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
  'ui.legacy.7ff2b51c23aa': {
    source: `Перезапустить`,
    status: 'pending-translation',
    values: {
      'ru': `Перезапустить`,
    },
  },
  'ui.legacy.867fb7f1f166': {
    source: `Вызов окна логов ИИ-Агента`,
    status: 'pending-translation',
    values: {
      'ru': `Вызов окна логов ИИ-Агента`,
    },
  },
  'ui.legacy.87f7498bdf27': {
    source: `JSON: только фиолетовые`,
    status: 'pending-translation',
    values: {
      'ru': `JSON: только фиолетовые`,
    },
  },
  'ui.legacy.882ee2465827': {
    source: `Отключить управление наклоном`,
    status: 'pending-translation',
    values: {
      'ru': `Отключить управление наклоном`,
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
  'ui.legacy.90007682b0af': {
    source: `Развернуть 3D на полный экран`,
    status: 'pending-translation',
    values: {
      'ru': `Развернуть 3D на полный экран`,
    },
  },
  'ui.legacy.9205a48f96a9': {
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
  'ui.legacy.9235b8737f64': {
    source: `Датчики недоступны.`,
    status: 'pending-translation',
    values: {
      'ru': `Датчики недоступны.`,
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
  'ui.legacy.952f20735fcc': {
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
  'ui.legacy.9a35e72645ec': {
    source: `✓ Скопировано`,
    status: 'pending-translation',
    values: {
      'ru': `✓ Скопировано`,
    },
  },
  'ui.legacy.9b63c03ce768': {
    source: `Вернуться к карте`,
    status: 'pending-translation',
    values: {
      'ru': `Вернуться к карте`,
    },
  },
  'ui.legacy.9c5d498e1570': {
    source: ` новых проблем в граф.`,
    status: 'pending-translation',
    values: {
      'ru': ` новых проблем в граф.`,
    },
  },
  'ui.legacy.9e23d36cea66': {
    source: `войнич`,
    status: 'pending-translation',
    values: {
      'ru': `войнич`,
    },
  },
  'ui.legacy.a14b344a3084': {
    source: `Не удалось запросить доступ к датчикам. Попробуйте ещё раз из меню.`,
    status: 'pending-translation',
    values: {
      'ru': `Не удалось запросить доступ к датчикам. Попробуйте ещё раз из меню.`,
    },
  },
  'ui.legacy.a21729ad1463': {
    source: `Список`,
    status: 'pending-translation',
    values: {
      'ru': `Список`,
    },
  },
  'ui.legacy.a2d114d8e80f': {
    source: `Диагностика скопирована`,
    status: 'pending-translation',
    values: {
      'ru': `Диагностика скопирована`,
    },
  },
  'ui.legacy.a38ff7a4dfff': {
    source: `градиент`,
    status: 'pending-translation',
    values: {
      'ru': `градиент`,
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
  'ui.legacy.a6e030b3ec29': {
    source: `авторств`,
    status: 'pending-translation',
    values: {
      'ru': `авторств`,
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
  'ui.legacy.ab7a35774b9e': {
    source: `верификац`,
    status: 'pending-translation',
    values: {
      'ru': `верификац`,
    },
  },
  'ui.legacy.ab9c1026469f': {
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
  'ui.legacy.ad23602a4bcc': {
    source: `Проверьте health endpoint`,
    status: 'pending-translation',
    values: {
      'ru': `Проверьте health endpoint`,
    },
  },
  'ui.legacy.ad8b11f6f44b': {
    source: `Запустить RICIS-решение`,
    status: 'pending-translation',
    values: {
      'ru': `Запустить RICIS-решение`,
    },
  },
  'ui.legacy.add4fe8028fc': {
    source: `Заполнить или дополнить карточку с помощью ИИ-агента Gemini`,
    status: 'pending-translation',
    values: {
      'ru': `Заполнить или дополнить карточку с помощью ИИ-агента Gemini`,
    },
  },
  'ui.legacy.af5abbac1f80': {
    source: `Развернуть левую панель`,
    status: 'pending-translation',
    values: {
      'ru': `Развернуть левую панель`,
    },
  },
  'ui.legacy.b3753e011f34': {
    source: `должен содержать единое переиспользуемое содержимое для SettingsModal`,
    status: 'pending-translation',
    values: {
      'ru': `должен содержать единое переиспользуемое содержимое для SettingsModal`,
    },
  },
  'ui.legacy.b618f471ee47': {
    source: `Увеличить масштаб`,
    status: 'pending-translation',
    values: {
      'ru': `Увеличить масштаб`,
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
  'ui.legacy.ba1147b24673': {
    source: `Health endpoint пока не подтвердил доступность Core. TypeScript fallback по-прежнему не используется.`,
    status: 'pending-translation',
    values: {
      'ru': `Health endpoint пока не подтвердил доступность Core. TypeScript fallback по-прежнему не используется.`,
    },
  },
  'ui.legacy.bb29d6304e9b': {
    source: `Инструменты и настройки`,
    status: 'pending-translation',
    values: {
      'ru': `Инструменты и настройки`,
    },
  },
  'ui.legacy.bcbb7990fd09': {
    source: `Предустановки:`,
    status: 'pending-translation',
    values: {
      'ru': `Предустановки:`,
    },
  },
  'ui.legacy.bee73ea493c9': {
    source: `должен создавать холст панорамы с туманностями и фоновым звездным шумом`,
    status: 'pending-translation',
    values: {
      'ru': `должен создавать холст панорамы с туманностями и фоновым звездным шумом`,
    },
  },
  'ui.legacy.bf9ec490322a': {
    source: `Уменьшить масштаб`,
    status: 'pending-translation',
    values: {
      'ru': `Уменьшить масштаб`,
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
  'ui.legacy.c5a7b8ebc6b8': {
    source: `Исследователь`,
    status: 'pending-translation',
    values: {
      'ru': `Исследователь`,
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
  'ui.legacy.c7279faf0c06': {
    source: `Целевая длина пружин`,
    status: 'pending-translation',
    values: {
      'ru': `Целевая длина пружин`,
    },
  },
  'ui.legacy.c97c2aceb777': {
    source: `Это контекстный промпт, описывающий логическую цепь решения проблемы до корневых узлов в системе RICIS-III. Выведены полные доказательства и шаги решения, координаты графа исключены.`,
    status: 'pending-translation',
    values: {
      'ru': `Это контекстный промпт, описывающий логическую цепь решения проблемы до корневых узлов в системе RICIS-III. Выведены полные доказательства и шаги решения, координаты графа исключены.`,
    },
  },
  'ui.legacy.cb1213afb5f3': {
    source: `Включить управление наклоном`,
    status: 'pending-translation',
    values: {
      'ru': `Включить управление наклоном`,
    },
  },
  'ui.legacy.cb50b3829183': {
    source: `например, Разрешение 0_3 * inf_4 или Задача Эйлера`,
    status: 'pending-translation',
    values: {
      'ru': `например, Разрешение 0_3 * inf_4 или Задача Эйлера`,
    },
  },
  'ui.legacy.cdd1ab114a26': {
    source: `👁️ Предпросмотр LaTeX`,
    status: 'pending-translation',
    values: {
      'ru': `👁️ Предпросмотр LaTeX`,
    },
  },
  'ui.legacy.ce80c36dcb62': {
    source: `Мин. зазор (узлы)`,
    status: 'pending-translation',
    values: {
      'ru': `Мин. зазор (узлы)`,
    },
  },
  'ui.legacy.d0f27faebd39': {
    source: `Исходник Lean не предоставлен`,
    status: 'pending-translation',
    values: {
      'ru': `Исходник Lean не предоставлен`,
    },
  },
  'ui.legacy.d43f5c5d9673': {
    source: `Используйте поддерживаемую грамматику`,
    status: 'pending-translation',
    values: {
      'ru': `Используйте поддерживаемую грамматику`,
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
  'ui.legacy.e0574a88c783': {
    source: `⚠️ Предупреждения`,
    status: 'pending-translation',
    values: {
      'ru': `⚠️ Предупреждения`,
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
  'ui.legacy.e35c2dfc5280': {
    source: `Проверка health endpoint Ricis.Core…`,
    status: 'pending-translation',
    values: {
      'ru': `Проверка health endpoint Ricis.Core…`,
    },
  },
  'ui.legacy.e38d04cfaffb': {
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
  'ui.legacy.e50a50fb9fe3': {
    source: `например, https://doi.org/10.5281/zenodo.17872755`,
    status: 'pending-translation',
    values: {
      'ru': `например, https://doi.org/10.5281/zenodo.17872755`,
    },
  },
  'ui.legacy.e59a6b95fbe6': {
    source: `Макро-пузыри (Зоны)`,
    status: 'pending-translation',
    values: {
      'ru': `Макро-пузыри (Зоны)`,
    },
  },
  'ui.legacy.e618e8ec3d43': {
    source: `Ricis.Core сообщил ready status. Вернитесь к карте и повторите расчёт.`,
    status: 'pending-translation',
    values: {
      'ru': `Ricis.Core сообщил ready status. Вернитесь к карте и повторите расчёт.`,
    },
  },
  'ui.legacy.e8388d7c8d56': {
    source: `3. Конфигурация трехмерных материалов для заднего плана (L0 Continuity)`,
    status: 'pending-translation',
    values: {
      'ru': `3. Конфигурация трехмерных материалов для заднего плана (L0 Continuity)`,
    },
  },
  'ui.legacy.ebc9b6652c6f': {
    source: `Настройки точной физики`,
    status: 'pending-translation',
    values: {
      'ru': `Настройки точной физики`,
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
  'ui.legacy.f0dff5ab4a66': {
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
  'ui.legacy.f0e1994239ff': {
    source: `изоморфизм`,
    status: 'pending-translation',
    values: {
      'ru': `изоморфизм`,
    },
  },
  'ui.legacy.f32a4124bb27': {
    source: `Строка вида 0_5 * inf_3 не является lambda-входом C# Core и не будет автоматически преобразована TypeScript-кодом.`,
    status: 'pending-translation',
    values: {
      'ru': `Строка вида 0_5 * inf_3 не является lambda-входом C# Core и не будет автоматически преобразована TypeScript-кодом.`,
    },
  },
  'ui.legacy.f3d28f6ae1a7': {
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
  'ui.legacy.f4d1bda8c026': {
    source: `Отталкивание масс (G)`,
    status: 'pending-translation',
    values: {
      'ru': `Отталкивание масс (G)`,
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
  'ui.legacy.f8d2e7e88e3b': {
    source: `Жесткость пружин (k)`,
    status: 'pending-translation',
    values: {
      'ru': `Жесткость пружин (k)`,
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
};
