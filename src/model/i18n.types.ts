/**
 * Контракты и словарь двуязычной локализации RU / EN для RICIS-III.
 * Строгая типизация ключей (TypeScript, DRY, Zero-dependency).
 */

export type SupportedLocale = 'ru' | 'en';

export interface II18nState {
  readonly locale: SupportedLocale;
}

export interface II18nActions {
  readonly setLocale: (locale: SupportedLocale) => void;
  readonly t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

export const DICTIONARY = {
  // Navigation & Header
  'header.title': {
    ru: '3D КАРТА СИНГУЛЯРНОСТЕЙ',
    en: '3D SINGULARITY MAP',
  },
  'header.nodes': {
    ru: 'УЗЛЫ',
    en: 'NODES',
  },
  'header.available': {
    ru: 'ДОСТУПНО',
    en: 'AVAILABLE',
  },
  'header.locked': {
    ru: 'ЗАБЛОКИРОВАНО',
    en: 'LOCKED',
  },
  'header.resolved': {
    ru: 'РЕШЕНО',
    en: 'RESOLVED',
  },
  'header.settings': {
    ru: 'НАСТРОЙКИ',
    en: 'SETTINGS',
  },
  'header.sandbox': {
    ru: 'SANDBOX',
    en: 'SANDBOX',
  },
  'header.share': {
    ru: 'Поделиться',
    en: 'Share',
  },
  'header.copied': {
    ru: 'Ссылка скопирована',
    en: 'Link copied',
  },
  'core.status.unchecked': {
    ru: 'Core: не проверен',
    en: 'Core: not checked',
  },
  'core.status.checking': {
    ru: 'Core: проверяется',
    en: 'Core: checking',
  },
  'core.status.readyApi': {
    ru: 'Core: готов (API)',
    en: 'Core: ready (API)',
  },
  'core.status.readyWasm': {
    ru: 'Core: готов (WebAssembly)',
    en: 'Core: ready (WebAssembly)',
  },
  'core.status.unavailable': {
    ru: 'Core: недоступен',
    en: 'Core: unavailable',
  },
  'core.status.check': {
    ru: 'Проверить Core',
    en: 'Check Core',
  },
  'core.status.recovery': {
    ru: 'Открыть инструкцию восстановления Core',
    en: 'Open Core recovery instructions',
  },
  'research.openAvailable': {
    ru: 'Открыть доступную задачу',
    en: 'Open available problem',
  },
  'research.proofConsole': {
    ru: 'Консоль RICIS',
    en: 'RICIS Console',
  },
  'proofConsole.title': {
    ru: 'Консоль доказательств и сингулярностей RICIS-III',
    en: 'RICIS-III Proof & Singularity Console',
  },
  'proofConsole.runtime.wasmCore': {
    ru: 'C# Core WebAssembly',
    en: 'C# Core WebAssembly',
  },
  'proofConsole.runtime.diagnostic': {
    ru: 'Детерминированная диагностика TypeScript',
    en: 'TypeScript deterministic diagnostics',
  },
  'proofConsole.subtitle': {
    ru: 'Локальная RICIS-цепочка; статус Lean требует отдельного воспроизводимого kernel evidence.',
    en: 'Local RICIS path; Lean status requires separate reproducible kernel evidence.',
  },
  'proofConsole.tab.evaluate': {
    ru: 'Вычисление сингулярностей O(1)',
    en: 'O(1) singularity evaluation',
  },
  'proofConsole.tab.prove': {
    ru: 'Генератор формальных доказательств',
    en: 'Formal proof generator',
  },
  'proofConsole.presets': {
    ru: 'Предустановки',
    en: 'Presets',
  },
  'proofConsole.preset.a6': {
    ru: '0_5 * inf_3 (A6)',
    en: '0_5 * inf_3 (A6)',
  },
  'proofConsole.preset.l1': {
    ru: '0_7 / 0_7 (идентичность L1)',
    en: '0_7 / 0_7 (L1 identity)',
  },
  'proofConsole.preset.a4': {
    ru: '0_10 / 0_2 (отношение A4)',
    en: '0_10 / 0_2 (A4 ratio)',
  },
  'proofConsole.preset.a10': {
    ru: '8 / 0 (A10)',
    en: '8 / 0 (A10)',
  },
  'proofConsole.preset.a7': {
    ru: 'inf_10 - inf_3 (A7)',
    en: 'inf_10 - inf_3 (A7)',
  },
  'proofConsole.evaluatePlaceholder': {
    ru: 'Введите сингулярное выражение, например 0_5 * inf_3 или 0_10 / 0_2',
    en: 'Enter a singular expression, for example 0_5 * inf_3 or 0_10 / 0_2',
  },
  'proofConsole.evaluating': {
    ru: 'Вычисление...',
    en: 'Evaluating...',
  },
  'proofConsole.evaluate': {
    ru: 'Рассчитать за O(1)',
    en: 'Evaluate in O(1)',
  },
  'proofConsole.exactInvariant': {
    ru: 'Точный инвариант RICIS-III',
    en: 'Exact RICIS-III invariant',
  },
  'proofConsole.semanticIndex': {
    ru: 'Семантический индекс',
    en: 'Semantic index',
  },
  'proofConsole.complexity': {
    ru: 'Сложность',
    en: 'Complexity',
  },
  'proofConsole.runtime': {
    ru: 'Рантайм',
    en: 'Runtime',
  },
  'proofConsole.traceTitle': {
    ru: 'Трассировка 8 фаз конвейера (фазы -1...6)',
    en: 'Eight-phase pipeline trace (phases -1...6)',
  },
  'proofConsole.axiom': {
    ru: 'Аксиома',
    en: 'Axiom',
  },
  'proofConsole.input': {
    ru: 'Вход',
    en: 'Input',
  },
  'proofConsole.output': {
    ru: 'Выход',
    en: 'Output',
  },
  'proofConsole.claimLabel': {
    ru: 'Утверждение / выражение',
    en: 'Claim / expression',
  },
  'proofConsole.claimPlaceholder': {
    ru: 'Например: x => x / x',
    en: 'For example: x => x / x',
  },
  'proofConsole.expectedLabel': {
    ru: 'Ожидаемое выражение',
    en: 'Expected expression',
  },
  'proofConsole.expectedPlaceholder': {
    ru: 'Введите выражение, эквивалентность с которым проверяет Core',
    en: 'Enter the expression whose equivalence Core should verify',
  },
  'proofConsole.createRun': {
    ru: 'Создать авторитетный proof run',
    en: 'Create authoritative proof run',
  },
  'proofConsole.creatingRun': {
    ru: 'Создание proof run...',
    en: 'Creating proof run...',
  },
  'proofConsole.snapshotTitle': {
    ru: 'Неизменяемый снимок Ricis.Core',
    en: 'Immutable Ricis.Core snapshot',
  },
  'proofConsole.correlationId': {
    ru: 'Correlation ID',
    en: 'Correlation ID',
  },
  'proofConsole.proofRunId': {
    ru: 'Proof run ID',
    en: 'Proof run ID',
  },
  'proofConsole.coreVersion': {
    ru: 'Версия Core',
    en: 'Core version',
  },
  'proofConsole.structuralStatus': {
    ru: 'Структурный статус',
    en: 'Structural status',
  },
  'proofConsole.trustStatus': {
    ru: 'Статус доверия',
    en: 'Trust status',
  },
  'proofConsole.evidenceBoundary': {
    ru: 'Граница evidence',
    en: 'Evidence boundary',
  },
  'proofConsole.traceCount': {
    ru: 'Записей trace',
    en: 'Trace entries',
  },
  'proofConsole.documents': {
    ru: 'Документы снимка',
    en: 'Snapshot documents',
  },
  'proofConsole.recoveryTitle': {
    ru: 'Core не создал proof snapshot',
    en: 'Core did not create a proof snapshot',
  },
  'node.relatedAvailable': {
    ru: 'Доступные связанные задачи',
    en: 'Available related problems',
  },
  'node.noRelatedAvailable': {
    ru: 'Связанные задачи пока не разблокированы.',
    en: 'No related problems are unlocked yet.',
  },
  'node.card.collapse': {
    ru: 'Свернуть карточку задачи',
    en: 'Collapse problem card',
  },
  'node.card.expand': {
    ru: 'Развернуть карточку задачи',
    en: 'Expand problem card',
  },
  'node.card.close': {
    ru: 'Закрыть карточку задачи',
    en: 'Close problem card',
  },

  // Search & Filters
  'search.placeholder': {
    ru: 'Поиск по карте...',
    en: 'Search map...',
  },
  'filter.availableToSolve': {
    ru: 'ДОСТУПНО К РЕШЕНИЮ',
    en: 'AVAILABLE TO SOLVE',
  },
  'filter.scientificFields': {
    ru: 'СФЕРЫ НАУКИ',
    en: 'SCIENTIFIC FIELDS',
  },
  'filter.quickActions': {
    ru: 'БЫСТРЫЕ ДЕЙСТВИЯ',
    en: 'QUICK ACTIONS',
  },
  'filter.addNewTask': {
    ru: '+ Добавить новую задачу',
    en: '+ Add new problem',
  },
  'filter.saveAndExport': {
    ru: 'СОХРАНЕНИЕ И ЭКСПОРТ',
    en: 'SAVE & EXPORT',
  },
  'filter.aiAgent': {
    ru: 'ИИ-АГЕНТ И СЕРВИСЫ',
    en: 'AI AGENT & SERVICES',
  },
  'filter.neuralNetwork': {
    ru: 'НЕЙРОСЕТЬ (GEMINI)',
    en: 'AI MODEL (GEMINI)',
  },

  // Sandbox / Terminal
  'sandbox.title': {
    ru: 'RICIS-III ПЕСОЧНИЦА СИНГУЛЯРНОСТЕЙ',
    en: 'RICIS-III SINGULARITY SANDBOX',
  },
  'sandbox.tab.trace': {
    ru: 'Пошаговый лог (Phases -1..6)',
    en: 'Step-by-Step Trace (Phases -1..6)',
  },
  'sandbox.tab.theorem': {
    ru: 'Теорема (LaTeX / Q.E.D.)',
    en: 'Theorem (LaTeX / Q.E.D.)',
  },
  'sandbox.tab.lean4': {
    ru: 'Lean 4 Спецификация',
    en: 'Lean 4 Specification',
  },
  'sandbox.examples': {
    ru: 'Примеры:',
    en: 'Presets:',
  },
  'sandbox.placeholder': {
    ru: 'Введите выражение (например: 0_3 * inf_4 или (x^2 - 4)/(x - 2) | x=2)...',
    en: 'Enter expression (e.g., 0_3 * inf_4 or (x^2 - 4)/(x - 2) | x=2)...',
  },
  'sandbox.ready': {
    ru: 'Терминал готов к доказательству',
    en: 'Terminal ready for proof computation',
  },
  'sandbox.readyHint': {
    ru: 'Кликните по любому примеру выше или переключите тип отчёта.',
    en: 'Click any preset above or switch report type.',
  },
  'sandbox.addToMap': {
    ru: '+ Добавить решение на карту',
    en: '+ Add solution to Map',
  },
  'sandbox.clearHistory': {
    ru: 'Очистить историю',
    en: 'Clear history',
  },
  'sandbox.copyTheorem': {
    ru: 'Копировать теорему',
    en: 'Copy Theorem',
  },
  'sandbox.copyLean4': {
    ru: 'Копировать Lean 4',
    en: 'Copy Lean 4',
  },
  'sandbox.copied': {
    ru: 'Скопировано',
    en: 'Copied',
  },

  // Add/Edit Node Modal
  'modal.addTitle': {
    ru: 'Добавление задачи на карту',
    en: 'Add Problem to Map',
  },
  'modal.fromSandbox': {
    ru: 'Из Sandbox',
    en: 'From Sandbox',
  },
  'modal.taskTitle': {
    ru: 'Название задачи / сингулярности *',
    en: 'Problem / Singularity Title *',
  },
  'modal.taskFormula': {
    ru: 'Целевая функция / Математическая модель',
    en: 'Target Function / Mathematical Model',
  },
  'modal.aiHelper': {
    ru: '🤖 ИИ-Агент: Дополнить поля',
    en: '🤖 AI Agent: Complete fields',
  },
  'modal.aiAnalyzing': {
    ru: 'ИИ анализирует...',
    en: 'AI is analyzing...',
  },
  'modal.description': {
    ru: 'Описание и доказательство',
    en: 'Description and Proof',
  },
  'modal.invariantHint': {
    ru: 'Значение инварианта / Примененная аксиома',
    en: 'Invariant Value / Applied Axiom',
  },
  'modal.field': {
    ru: 'Сфера науки / Область знаний',
    en: 'Scientific Field / Domain',
  },
  'modal.sourceLink': {
    ru: 'Ссылка на первоисточник / DOI (опционально)',
    en: 'Source Reference / DOI Link (optional)',
  },
  'modal.cancel': {
    ru: 'Отмена',
    en: 'Cancel',
  },
  'modal.submit': {
    ru: '+ Добавить на 3D Карту',
    en: '+ Add to 3D Map',
  },

  // Node Details
  'node.targetFunction': {
    ru: 'Целевая функция и сингулярность',
    en: 'Target Function & Singularity',
  },
  'node.unlockedByThis': {
    ru: 'Открывает доступ к задачам',
    en: 'Unlocks Next Problems',
  },
  'node.requirements': {
    ru: 'Требует решения для открытия',
    en: 'Requires Prerequisites to Unlock',
  },
  'node.economic': {
    ru: 'Экономическая модель',
    en: 'Economic Impact Model',
  },
  'node.solve': {
    ru: 'Разрешить сингулярность',
    en: 'Resolve Singularity',
  },
  'node.viewProof': {
    ru: 'Смотреть доказательство',
    en: 'View Proof',
  },
  'node.status.resolved': {
    ru: 'РЕШЕНО',
    en: 'RESOLVED',
  },
  'node.status.available': {
    ru: 'ДОСТУПНО',
    en: 'AVAILABLE',
  },
  'node.status.locked': {
    ru: 'ЗАБЛОКИРОВАНО',
    en: 'LOCKED',
  },
  'node.share': {
    ru: 'Поделиться',
    en: 'Share',
  },
  'node.edit': {
    ru: 'Правка',
    en: 'Edit',
  },
  'node.formalVerification': {
    ru: 'Формальная верификация Lean 4',
    en: 'Formal Lean 4 Verification',
  },
  'node.traceRicis': {
    ru: 'Трассировка RICIS-III (L1_IDENTITY)',
    en: 'RICIS-III Trace (L1_IDENTITY)',
  },
  'node.sourcesAndDocs': {
    ru: 'Первоисточники и публикации',
    en: 'Primary Sources & Publications',
  },
  'node.economicsAndProfit': {
    ru: 'Экономика и прибыльность',
    en: 'Economics & Profitability',
  },
  'node.provenanceAuthorship': {
    ru: 'Доказательство авторства RICIS-III',
    en: 'RICIS-III Authorship Provenance',
  },

  // Settings & Physics
  'settings.title': {
    ru: 'Настройки интерфейса',
    en: 'UI Settings',
  },
  'settings.subtitle': {
    ru: 'Профили и управление панелями в реальном времени',
    en: 'Profiles & real-time panel management',
  },
  'settings.language': {
    ru: 'Язык / Language',
    en: 'Language / Язык',
  },
  'physics.title': {
    ru: 'Параметры симуляции',
    en: 'Simulation Parameters',
  },
  'physics.reset': {
    ru: 'Сброс',
    en: 'Reset',
  },
  'physics.save': {
    ru: 'Сохранить',
    en: 'Save',
  },
  'physics.saved': {
    ru: 'Сохранено',
    en: 'Saved',
  },

  // Audit Panel
  'audit.systemAudit': {
    ru: 'Аудит системы',
    en: 'System Audit',
  },
  'audit.cleanGraph': {
    ru: 'Очистить граф (GC)',
    en: 'Clean Graph (GC)',
  },
  'audit.emptyTargets': {
    ru: 'Пустые цели',
    en: 'Empty Targets',
  },
  'audit.fillAi': {
    ru: 'Заполнить ИИ',
    en: 'Fill via AI',
  },
  'audit.executing': {
    ru: 'Выполнение канонической операции...',
    en: 'Executing canonical operation...',
  },
} as const;

export type TranslationKey = keyof typeof DICTIONARY;
