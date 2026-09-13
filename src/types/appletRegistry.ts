// ============================================================================
// APPLET REGISTRY & CONTRACTS (DDD / SOLID / DRY)
// Registry for top-level workspace applets with metadata, deep link IDs,
// and menu categorization for compact productivity UI (Visual Studio / Word style)
// ============================================================================

export type AppletId = 
  | 'map' 
  | 'kinematic' 
  | 'seed' 
  | 'comparison' 
  | 'roadmap' 
  | 'voynich' 
  | 'qa-tests' 
  | 'terminal' 
  | 'settings';

export type AppletCategory = 'workspace' | 'kinematics' | 'foundations' | 'diagnostics' | 'tools';

export interface IAppletDefinition {
  readonly id: AppletId;
  readonly title: string;
  readonly shortTitle: string;
  readonly description: string;
  readonly category: AppletCategory;
  readonly iconName: string;
  readonly shortcut?: string;
}

export const APPLET_DEFINITIONS: Record<AppletId, IAppletDefinition> = {
  map: {
    id: 'map',
    title: '3D Сингулярный Граф (RICIS DAG Map)',
    shortTitle: '3D Граф',
    description: 'Интерактивная 3D карта семантических сингулярностей, доказательств и аксиом',
    category: 'workspace',
    iconName: 'Network',
    shortcut: 'Ctrl+1',
  },
  kinematic: {
    id: 'kinematic',
    title: '3D Кинематический Движок (Manipulators)',
    shortTitle: 'Манипулятор 3D',
    description: 'Многозвенные манипуляторы (3-Link, 5-Link Redundant), SVD, полярная редукция O(1)',
    category: 'kinematics',
    iconName: 'Activity',
    shortcut: 'Ctrl+2',
  },
  seed: {
    id: 'seed',
    title: 'RICIS SEED: Протокол Саморасширения (A11)',
    shortTitle: 'RICIS Seed',
    description: 'Монадическое саморасширение через Ric.ExpandTo((x) => x.Resolve(U))',
    category: 'foundations',
    iconName: 'Sprout',
    shortcut: 'Ctrl+3',
  },
  comparison: {
    id: 'comparison',
    title: 'Сравнение Графов: RICIS-III vs Anthropic',
    shortTitle: 'Сравнение Графов',
    description: 'Структурное сравнение топологии доказательства Ферма и DAG RICIS',
    category: 'foundations',
    iconName: 'GitBranch',
    shortcut: 'Ctrl+4',
  },
  roadmap: {
    id: 'roadmap',
    title: 'Аналитическая Дорожная Карта (Roadmap)',
    shortTitle: 'Roadmap',
    description: 'Иерархический список и зависимости узлов графа',
    category: 'workspace',
    iconName: 'List',
    shortcut: 'Ctrl+5',
  },
  voynich: {
    id: 'voynich',
    title: 'Расшифровка Манускрипта Войнича',
    shortTitle: 'Войнич',
    description: 'Структурная дешифровка и семантический разбор',
    category: 'foundations',
    iconName: 'BookOpen',
  },
  'qa-tests': {
    id: 'qa-tests',
    title: 'QA Автоматизированное Тестирование и Стресс-Тест',
    shortTitle: 'QA Тесты',
    description: 'Flood-fill обход графа, стресс-тестирование манипуляторов и проверка L1',
    category: 'diagnostics',
    iconName: 'Bug',
  },
  terminal: {
    id: 'terminal',
    title: 'Интерактивная Консоль (RICIS Sandbox)',
    shortTitle: 'Консоль',
    description: 'Песочница выражений RICIS-III с пошаговой трассировкой фаз -1..6',
    category: 'tools',
    iconName: 'Terminal',
    shortcut: 'Ctrl+~',
  },
  settings: {
    id: 'settings',
    title: 'Параметры и Настройки Системы',
    shortTitle: 'Настройки',
    description: 'Управление ключами, кэшем, профилями рендеринга и синхронизацией',
    category: 'tools',
    iconName: 'Settings',
  },
};
