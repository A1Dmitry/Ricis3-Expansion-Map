/**
 * Контракты и словарь двуязычной локализации RU / EN для RICIS-III.
 * Строгая типизация ключей (TypeScript, DRY, Zero-dependency).
 */

export type SupportedLocale = 'ru' | 'en' | 'en-US' | 'fr-CA' | 'de-DE' | 'hi-IN' | 'ms-MY';

export const PROJECT_COVERAGE_LOCALES: readonly SupportedLocale[] = [
  'en-US',
  'fr-CA',
  'de-DE',
  'hi-IN',
  'ms-MY',
];

export function resolveDictionaryText(
  entry: { readonly ru: string; readonly en: string } & Partial<Record<SupportedLocale, string>>,
  locale: SupportedLocale,
): string {
  return entry[locale] ?? entry[locale.split('-')[0] as 'ru' | 'en'] ?? entry.en;
}

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
  'proofTrust.leanVerified.label': {
    ru: 'Lean kernel подтверждён',
    en: 'Lean kernel verified',
  },
  'proofTrust.leanVerified.description': {
    ru: 'Для внешнего исходника Lean сохранены воспроизводимые toolchain, compiler output и axiom report.',
    en: 'Reproducible toolchain, compiler output and axiom report are retained for the external Lean source.',
  },
  'proofTrust.trustedAxiom.label': {
    ru: 'Доверенный внешний аксиоматический контракт',
    en: 'Trusted external axiom',
  },
  'proofTrust.trustedAxiom.description': {
    ru: 'Неизменяемый внешний Lean-исходник принят как явно маркированный trusted contract; это не автоматически сгенерированная теорема.',
    en: 'An immutable external Lean source is accepted as an explicitly labelled trusted contract; it is not an automatically generated theorem.',
  },
  'proofTrust.rejected.label': {
    ru: 'Верификация отклонена',
    en: 'Verification rejected',
  },
  'proofTrust.rejected.description': {
    ru: 'Есть ошибка Lean-проверки или внешнее доказательство отклонено. Утверждение нельзя использовать как подтверждённое.',
    en: 'A Lean verification error exists or the external proof was rejected. The claim cannot be used as confirmed.',
  },
  'proofTrust.requiresCoreLean.label': {
    ru: 'Требуется evidence Core / Lean',
    en: 'Requires Core / Lean evidence',
  },
  'proofTrust.requiresCoreLean.description': {
    ru: 'Структурный RICIS-результат или исходник сохранён, но Lean kernel evidence ещё не приложен.',
    en: 'A structural RICIS result or source is retained, but Lean kernel evidence has not yet been attached.',
  },
  'proofTrust.nodeStateOnly.label': {
    ru: 'Состояние workflow: resolved',
    en: 'Resolved workflow state',
  },
  'proofTrust.nodeStateOnly.description': {
    ru: 'Узел отмечен как resolved в карте. Этот статус сам по себе не является Lean kernel verification.',
    en: 'The node is marked resolved in the map. That workflow status alone is not Lean kernel verification.',
  },
  'proofTrust.noProof.label': {
    ru: 'Proof evidence не приложен',
    en: 'No proof evidence attached',
  },
  'proofTrust.noProof.description': {
    ru: 'Для узла пока не приложен proof artifact с проверяемой provenance.',
    en: 'No proof artifact with verifiable provenance is attached to this node yet.',
  },
  'theoremReport.method': { ru: 'Метод', en: 'Method' },
  'theoremReport.complexity': { ru: 'Сложность', en: 'Complexity' },
  'theoremReport.copyTitle': { ru: 'Копировать текст теоремы', en: 'Copy theorem text' },
  'theoremReport.copied': { ru: 'Скопировано', en: 'Copied' },
  'theoremReport.copy': { ru: 'Копировать теорему', en: 'Copy theorem' },
  'theoremReport.premise': { ru: 'Гипотеза (Premise):', en: 'Hypothesis (Premise):' },
  'theoremReport.localChain': { ru: 'Шаги локальной RICIS-цепочки:', en: 'Local RICIS chain steps:' },
  'theoremReport.step': { ru: 'Шаг', en: 'Step' },
  'theoremReport.localResult': { ru: 'Локальный результат (Lean kernel не запускался):', en: 'Local result (Lean kernel was not run):' },
  'theoremReport.copyHeader': { ru: '=== {{title}} ===', en: '=== {{title}} ===' },
  'theoremReport.copyMethod': { ru: 'Метод доказательства: {{value}}', en: 'Proof method: {{value}}' },
  'theoremReport.copyHypothesis': { ru: 'Гипотеза: {{value}}', en: 'Hypothesis: {{value}}' },
  'theoremReport.copyComplexity': { ru: 'Сложность: {{value}}', en: 'Complexity: {{value}}' },
  'theoremReport.copySteps': { ru: 'ШАГИ ДОКАЗАТЕЛЬСТВА:', en: 'PROOF STEPS:' },
  'theoremReport.copyConclusion': { ru: 'ИТОГ: {{value}} (локальный RICIS-результат; Lean kernel evidence требуется отдельно)', en: 'CONCLUSION: {{value}} (local RICIS result; Lean kernel evidence is required separately)' },
  'terminal.error': { ru: 'Ошибка', en: 'Error' },
  'terminal.addTitle': { ru: 'Перенести это решение на 3D карту в виде нового узла', en: 'Transfer this solution to the 3D map as a new node' },
  'terminal.loadTitle': { ru: 'Загрузить в строку ввода', en: 'Load into input' },
  'terminal.runTitle': { ru: 'Запустить вычисление (Enter)', en: 'Run computation (Enter)' },
  'terminal.mapTitle': { ru: 'Сингулярность: {{value}}', en: 'Singularity: {{value}}' },
  'terminal.mapDescription': { ru: 'Структурный RICIS-черновик для сингулярности {{value}}. Lean kernel evidence не приложен и требуется отдельно.', en: 'Structural RICIS draft for singularity {{value}}. Lean kernel evidence is not attached and is required separately.' },
  'terminal.hypothesis': { ru: 'Гипотеза: {{value}}', en: 'Hypothesis: {{value}}' },
  'terminal.method': { ru: 'Метод: {{value}}', en: 'Method: {{value}}' },
  'terminal.invariant': { ru: 'Итоговый локальный инвариант: {{value}} (требуется Core/Lean evidence)', en: 'Final local invariant: {{value}} (Core/Lean evidence required)' },
  'terminal.steps': { ru: 'Шаги: {{value}}', en: 'Steps: {{value}}' },
  'terminal.hint': { ru: 'Инвариант = {{value}}', en: 'Invariant = {{value}}' },
  'terminal.unknownInvariant': { ru: 'Инвариант не установлен', en: 'Invariant not established' },
  'terminal.engineVersion': { ru: 'Аксиоматический движок v7.7', en: 'Axiomatic Engine v7.7' },
  'terminal.clickToCompute': { ru: 'Кликните для мгновенного вычисления', en: 'Click to compute instantly' },
  'terminal.close': { ru: 'Закрыть терминал', en: 'Close terminal' },
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
  'proofConsole.close': {
    ru: 'Закрыть консоль доказательств',
    en: 'Close proof console',
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

  // Agent Log Modal
  'agentLog.title': { ru: 'Журнал активности ИИ-Агента', en: 'AI Agent activity log' },
  'agentLog.close': { ru: 'Закрыть журнал агента', en: 'Close agent log' },
  'agentLog.filter.all': { ru: 'Все ({count})', en: 'All ({count})' },
  'agentLog.filter.ricis': { ru: '⚡ RICIS', en: '⚡ RICIS' },
  'agentLog.filter.success': { ru: '✓ Успех', en: '✓ Success' },
  'agentLog.filter.info': { ru: 'ℹ Инфо', en: 'ℹ Info' },
  'agentLog.filter.warn': { ru: '⚠️ Предупреждения', en: '⚠️ Warnings' },
  'agentLog.filter.error': { ru: '❌ Ошибки', en: '❌ Errors' },
  'agentLog.search.placeholder': { ru: 'Фильтр сообщений...', en: 'Filter messages...' },
  'agentLog.autoScroll': { ru: 'Автопрокрутка', en: 'Auto-scroll' },
  'agentLog.copy': { ru: '📋 Копировать', en: '📋 Copy' },
  'agentLog.copy.complete': { ru: '✓ Скопировано', en: '✓ Copied' },
  'agentLog.copy.title': { ru: 'Копировать показанные логи в буфер', en: 'Copy visible logs' },
  'agentLog.clear': { ru: 'Очистить журнал логов', en: 'Clear log' },
  'agentLog.empty': { ru: 'Нет записей лога, соответствующих выбранному фильтру.', en: 'No log entries match the selected filter.' },
  'agentLog.nodeLink': { ru: 'К узлу →', en: 'Go to node' },
  'agentLog.total': { ru: 'Всего записей: {count}', en: 'Total entries: {count}' },
  'agentLog.footerHint': { ru: 'Нажмите на отметку времени или стрелку в нижней статус-строке для быстрого вызова', en: 'Click a timestamp or the arrow in the bottom status bar for quick access' },
  'agentLog.clipboard.details': { ru: 'Детали: {details}', en: 'Details: {details}' },

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

  // Settings details and panel labels
  'settings.languageLabel': { ru: 'Язык / Language', en: 'Language / Язык' },
  'settings.localization': { ru: 'Локализация интерфейса', en: 'Interface localization' },
  'settings.browserDetection': { ru: 'Автоопределение по заголовку браузера', en: 'Automatic detection from browser language' },
  'settings.sidebarPanels': { ru: 'Панели сайдбара', en: 'Sidebar panels' },
  'settings.liveToggle': { ru: 'Live Toggle', en: 'Live Toggle' },
  'settings.enabled': { ru: 'Вкл', en: 'On' },
  'settings.disabled': { ru: 'Выкл', en: 'Off' },
  'settings.profile': { ru: 'Профиль интерфейса', en: 'Interface profile' },
  'settings.createNew': { ru: 'Создать новый', en: 'Create new' },
  'settings.defaultProfile': { ru: 'Стандартный баланс элементов', en: 'Default element balance' },
  'settings.researcherProfile': { ru: 'Фокус на поиске, зонах и доступных задачах', en: 'Focus on search, zones, and available problems' },
  'settings.architectProfile': { ru: 'Фокус на симуляции физики и быстрых действиях', en: 'Focus on physics simulation and quick actions' },
  'settings.clicks': { ru: 'Кликов: {{value}}', en: 'Clicks: {{value}}' },
  'settings.profileName': { ru: 'Название профиля:', en: 'Profile name:' },
  'settings.profileExample': { ru: 'Например: Эксперт RICIS-III', en: 'Example: RICIS-III Expert' },
  'settings.copyCurrent': { ru: 'Скопировать настройки текущего профиля', en: 'Copy current profile settings' },
  'settings.save': { ru: 'Сохранить', en: 'Save' },
  'settings.cancel': { ru: 'Отмена', en: 'Cancel' },
  'settings.coreVersion': { ru: 'Ядро: RICIS-III v7.7', en: 'Core: RICIS-III v7.7' },
  'settings.panelLiveDrawer': { ru: 'Панель: Live Drawer', en: 'Panel: Live Drawer' },
  'settings.close': { ru: 'Закрыть', en: 'Close' },
  'settings.adminCore': { ru: 'Администрирование Core', en: 'Core Administration' },
  'settings.adminCoreServerRequired': {
    ru: 'Требуется серверный control plane',
    en: 'Server control plane required',
  },
  'settings.adminCoreUnavailable': {
    ru: 'Управление внешним Ricis.Core недоступно в статической версии. Для него нужны серверная авторизация, fresh-auth, аудит и защищённый канал host agent.',
    en: 'External Ricis.Core management is unavailable in the static deployment. It requires server authorization, fresh authentication, audit, and a protected host-agent channel.',
  },
  'panel.actions': { ru: 'Быстрые действия', en: 'Quick actions' },
  'panel.zones': { ru: 'Сферы науки', en: 'Scientific fields' },
  'panel.available': { ru: 'Доступно к решению', en: 'Available to solve' },
  'panel.agent': { ru: 'ИИ-Агент и Сервисы', en: 'AI Agent & Services' },
  'panel.persistence': { ru: 'Сохранение и Экспорт', en: 'Persistence & Export' },

  // Telegram simulator
  'telegram.header': {
    ru: 'Симулятор Telegram RICIS-III',
    en: 'RICIS-III Telegram Simulator',
  },
  'telegram.localSimulation': {
    ru: 'Локальная симуляция без сбора, хранения и передачи пользовательских API-ключей.',
    en: 'Local simulation without collecting, storing, or transmitting user API keys.',
  },
  'telegram.evidenceNotice': {
    ru: 'Статус доказательства всегда указан в ответе. Шаблон LaTeX не является Lean-верификацией.',
    en: 'The proof status is always stated in the reply. A LaTeX template is not Lean verification.',
  },
  'telegram.processing': {
    ru: 'Выполняется структурная обработка RICIS-III…',
    en: 'RICIS-III structural processing in progress…',
  },
  'telegram.placeholder': {
    ru: '/solve <формула> или /help',
    en: '/solve <formula> or /help',
  },
  'telegram.exampleCommand': {
    ru: '/solve (x^2 - 9)/(x - 3) при x=3',
    en: '/solve (x^2 - 9)/(x - 3) at x=3',
  },
  'telegram.send': {
    ru: 'Отправить',
    en: 'Send',
  },
  'telegram.error': {
    ru: 'Внутренняя ошибка. Неподтверждённый результат не был объявлен доказанным.',
    en: 'Internal error. An unverified result was not declared proven.',
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
