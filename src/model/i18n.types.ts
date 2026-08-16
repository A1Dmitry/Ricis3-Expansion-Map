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
} as const;

export type TranslationKey = keyof typeof DICTIONARY;
