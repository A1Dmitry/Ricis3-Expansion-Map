// ============================================================================
// RICIS-III CENTRAL COMMAND REGISTRY (MVVM / DRY / SOLID / DDD)
// Registry of all context-aware actions, hotkeys, tooltips, and execution logic.
// ============================================================================

import type { AppCommand, CommandCategory, CommandContext } from '../types/commandTypes';
import type { AppletId } from '../types/appletRegistry';
import { UrlShareService } from './UrlShareService';
import { RICIS_COMMAND_EVENTS, dispatchRicisCommand } from './commandBus';
import { copyTextToClipboard } from './clipboard';

export const APP_COMMANDS: readonly AppCommand[] = [
  // --- Navigation & Core Workspaces ---
  {
    id: 'nav.map',
    label: '3D Граф Сингулярностей',
    tooltip: 'Переключиться на 3D топологический граф узлов и аксиом RICIS-III',
    iconName: 'Layers',
    category: 'navigation',
    appletScope: 'all',
    shortcut: 'Alt+1',
    group: 'workspace',
    isEnabled: () => true,
    isActive: ctx => ctx.activeApplet === 'map',
    execute: ctx => ctx.onSelectApplet('map'),
  },
  {
    id: 'nav.kinematic',
    label: '3D Кинематика N-Link',
    tooltip: 'Переключиться на кинематический симулятор манипуляторов с полярной редукцией',
    iconName: 'Activity',
    category: 'navigation',
    appletScope: 'all',
    shortcut: 'Alt+2',
    group: 'workspace',
    isEnabled: () => true,
    isActive: ctx => ctx.activeApplet === 'kinematic',
    execute: ctx => ctx.onSelectApplet('kinematic'),
  },
  {
    id: 'nav.seed',
    label: 'Seed Протокол',
    tooltip: 'Переключиться на модуль саморасширения RICIS Seed и реконсиляцию артефактов',
    iconName: 'Sprout',
    category: 'navigation',
    appletScope: 'all',
    shortcut: 'Alt+3',
    group: 'workspace',
    isEnabled: () => true,
    isActive: ctx => ctx.activeApplet === 'seed',
    execute: ctx => ctx.onSelectApplet('seed'),
  },
  {
    id: 'nav.comparison',
    label: 'Сравнение Графов',
    tooltip: 'Сравнение топологических графов RICIS vs Anthropic с подсчетом расхождений',
    iconName: 'GitBranch',
    category: 'navigation',
    appletScope: 'all',
    shortcut: 'Alt+4',
    group: 'workspace',
    isEnabled: () => true,
    isActive: ctx => ctx.activeApplet === 'comparison',
    execute: ctx => ctx.onSelectApplet('comparison'),
  },
  {
    id: 'nav.roadmap',
    label: 'Дорожная Карта',
    tooltip: 'Интерактивная карта вех развития, статусов задач и переходов',
    iconName: 'List',
    category: 'navigation',
    appletScope: 'all',
    shortcut: 'Alt+5',
    group: 'workspace',
    isEnabled: () => true,
    isActive: ctx => ctx.activeApplet === 'roadmap',
    execute: ctx => ctx.onSelectApplet('roadmap'),
  },
  {
    id: 'nav.voynich',
    label: 'Дешифровка Войнича',
    tooltip: 'Анализ глифов рукописи Войнича через фонетический атлас и аксиомы RICIS',
    iconName: 'BookOpen',
    category: 'navigation',
    appletScope: 'all',
    shortcut: 'Alt+6',
    group: 'workspace',
    isEnabled: () => true,
    isActive: ctx => ctx.activeApplet === 'voynich',
    execute: ctx => ctx.onSelectApplet('voynich'),
  },
  {
    id: 'nav.terminal',
    label: 'REPL Консоль',
    tooltip: 'Интерактивный терминал вычисления сингулярных выражений и Lean-проверок',
    iconName: 'Terminal',
    category: 'navigation',
    appletScope: 'all',
    shortcut: 'Alt+7',
    group: 'workspace',
    isEnabled: () => true,
    isActive: ctx => ctx.activeApplet === 'terminal',
    execute: ctx => ctx.onSelectApplet('terminal'),
  },
  {
    id: 'nav.qa-tests',
    label: 'QA Автопроверщик',
    tooltip: 'Автоматический краулер графа и стресс-тестирование сингулярных инвариантов',
    iconName: 'Bug',
    category: 'navigation',
    appletScope: 'all',
    shortcut: 'Alt+8',
    group: 'workspace',
    isEnabled: () => true,
    isActive: ctx => ctx.activeApplet === 'qa-tests',
    execute: ctx => ctx.onSelectApplet('qa-tests'),
  },
  {
    id: 'nav.settings',
    label: 'Настройки',
    tooltip: 'Параметры графики, телеметрии, хранилища и темы оформления',
    iconName: 'Settings',
    category: 'navigation',
    appletScope: 'all',
    shortcut: 'Alt+9',
    group: 'workspace',
    isEnabled: () => true,
    isActive: ctx => ctx.activeApplet === 'settings',
    execute: ctx => ctx.onSelectApplet('settings'),
  },

  // --- View & Camera Controls ---
  {
    id: 'view.toggle3D',
    label: 'Проекция 3D / 2D',
    tooltip: 'Переключить режим проекции между пространственной 3D сферой и плоским 2D графом',
    iconName: 'Compass',
    category: 'view',
    appletScope: ['map'],
    shortcut: 'V',
    group: 'camera',
    isEnabled: ctx => ctx.activeApplet === 'map',
    isActive: ctx => ctx.is3DMode ?? true,
    execute: ctx => {
      ctx.onToggle3DMode?.();
      dispatchRicisCommand(RICIS_COMMAND_EVENTS.toggle3DPresentation);
    },
  },
  {
    id: 'view.resetCamera',
    label: 'Сброс Камеры',
    tooltip: 'Вернуть ракурс камеры к исходному изометрическому обзору центра графа',
    iconName: 'RotateCcw',
    category: 'view',
    appletScope: ['map'],
    shortcut: 'R',
    group: 'camera',
    isEnabled: ctx => ctx.activeApplet === 'map',
    execute: ctx => {
      ctx.onResetCamera?.();
      dispatchRicisCommand(RICIS_COMMAND_EVENTS.resetCamera);
    },
  },
  {
    id: 'view.searchNodes',
    label: 'Поиск Узлов',
    tooltip: 'Открыть диалог быстрого поиска и фильтрации узлов по DOI, сингулярностям и формулам',
    iconName: 'Search',
    category: 'view',
    appletScope: ['map', 'roadmap'],
    shortcut: 'Ctrl+F',
    group: 'inspect',
    isEnabled: ctx => ctx.activeApplet === 'map' || ctx.activeApplet === 'roadmap',
    execute: ctx => {
      ctx.onSearchNodes?.();
      dispatchRicisCommand(RICIS_COMMAND_EVENTS.openSearch);
    },
  },

  // --- Kinematic Action Controls ---
  {
    id: 'kinematic.toggleSimulation',
    label: 'Запуск / Пауза',
    tooltip: 'Запустить или приостановить физический цикл расчета траектории манипулятора',
    iconName: 'Play',
    category: 'physics',
    appletScope: ['kinematic'],
    shortcut: 'Space',
    group: 'simulation',
    isEnabled: ctx => ctx.activeApplet === 'kinematic',
    isActive: ctx => ctx.isSimulationRunning ?? false,
    execute: ctx => {
      ctx.onToggleSimulation?.();
      dispatchRicisCommand(RICIS_COMMAND_EVENTS.kinematicTogglePlay);
    },
  },
  {
    id: 'kinematic.resetJoints',
    label: 'Сброс Шарниров',
    tooltip: 'Установить углы всех сочленений манипулятора в нулевое калибровочное состояние',
    iconName: 'RotateCcw',
    category: 'physics',
    appletScope: ['kinematic'],
    shortcut: 'Ctrl+R',
    group: 'simulation',
    isEnabled: ctx => ctx.activeApplet === 'kinematic',
    execute: ctx => {
      ctx.onResetSimulation?.();
      dispatchRicisCommand(RICIS_COMMAND_EVENTS.kinematicReset);
    },
  },
  {
    id: 'kinematic.stepForward',
    label: 'Шаг Вперед (dt)',
    tooltip: 'Выполнить один дискретный шаг интегрирования траектории манипулятора',
    iconName: 'StepForward',
    category: 'physics',
    appletScope: ['kinematic'],
    shortcut: 'S',
    group: 'simulation',
    isEnabled: ctx => ctx.activeApplet === 'kinematic',
    execute: ctx => {
      ctx.onStepSimulation?.();
      dispatchRicisCommand(RICIS_COMMAND_EVENTS.kinematicStep);
    },
  },

  // --- Seed Protocol Actions ---
  {
    id: 'seed.runVerification',
    label: 'Верификация Seed',
    tooltip: 'Запустить полный цикл валидации протокола саморасширения RICIS Seed',
    iconName: 'ShieldCheck',
    category: 'seed',
    appletScope: ['seed'],
    shortcut: 'Ctrl+Shift+V',
    group: 'protocol',
    isEnabled: ctx => ctx.activeApplet === 'seed',
    execute: () => {
      dispatchRicisCommand(RICIS_COMMAND_EVENTS.seedVerify);
    },
  },
  {
    id: 'seed.downloadLedger',
    label: 'Крипто-Квитанция',
    tooltip: 'Скачать криптографический реестр паспортов и доказательств Seed (JSON)',
    iconName: 'Download',
    category: 'seed',
    appletScope: ['seed'],
    shortcut: 'Ctrl+D',
    group: 'protocol',
    isEnabled: ctx => ctx.activeApplet === 'seed',
    execute: () => {
      dispatchRicisCommand(RICIS_COMMAND_EVENTS.seedDownloadLedger);
    },
  },

  // --- REPL / Terminal Actions ---
  {
    id: 'terminal.clear',
    label: 'Очистить Буфер',
    tooltip: 'Очистить историю вывода консоли REPL',
    iconName: 'Trash2',
    category: 'tools',
    appletScope: ['terminal'],
    shortcut: 'Ctrl+L',
    group: 'terminal',
    isEnabled: ctx => ctx.activeApplet === 'terminal',
    execute: ctx => {
      ctx.onClearTerminal?.();
      dispatchRicisCommand(RICIS_COMMAND_EVENTS.terminalClear);
    },
  },
  {
    id: 'terminal.leanVerify',
    label: 'Lean 4 Шлюз',
    tooltip: 'Отправить текущую структуру доказательств во внешний Lean 4 верификатор',
    iconName: 'Cpu',
    category: 'tools',
    appletScope: ['terminal'],
    shortcut: 'Ctrl+Enter',
    group: 'terminal',
    isEnabled: ctx => ctx.activeApplet === 'terminal',
    execute: () => {
      dispatchRicisCommand(RICIS_COMMAND_EVENTS.terminalLeanVerify);
    },
  },

  // --- QA / Prover Actions ---
  {
    id: 'qa.runFloodFill',
    label: 'Запуск Краулера',
    tooltip: 'Запустить рекурсивный Flood-Fill обход всех 17 сингулярных задач для верификации',
    iconName: 'PlayCircle',
    category: 'qa',
    appletScope: ['qa-tests'],
    shortcut: 'F5',
    group: 'qa',
    isEnabled: ctx => ctx.activeApplet === 'qa-tests',
    isActive: ctx => ctx.isAutoProverRunning ?? false,
    execute: ctx => {
      ctx.onRunProver?.();
      dispatchRicisCommand(RICIS_COMMAND_EVENTS.qaRunFloodFill);
    },
  },
  {
    id: 'qa.exportReport',
    label: 'Экспорт Отчета',
    tooltip: 'Сформировать и сохранить структурированный отчет регрессионного тестирования',
    iconName: 'FileText',
    category: 'qa',
    appletScope: ['qa-tests'],
    shortcut: 'Ctrl+E',
    group: 'qa',
    isEnabled: ctx => ctx.activeApplet === 'qa-tests',
    execute: () => {
      dispatchRicisCommand(RICIS_COMMAND_EVENTS.qaExportReport);
    },
  },

  // --- Global Share & Diagnostics Actions ---
  {
    id: 'global.share',
    label: 'Поделиться',
    tooltip: 'Скопировать прямую ссылку на текущий активный апплет со всеми параметрами',
    iconName: 'Share2',
    category: 'file',
    appletScope: 'all',
    shortcut: 'Ctrl+Shift+C',
    group: 'global',
    isEnabled: () => true,
    execute: ctx => {
      const url = UrlShareService.generateShareUrl({ applet: ctx.activeApplet });
      void copyTextToClipboard(url);
    },
  },
  {
    id: 'global.diagnostics',
    label: 'Диагностика',
    tooltip: 'Запустить внутреннюю самодиагностику целостности памяти и семантических индексов',
    iconName: 'AlertCircle',
    category: 'tools',
    appletScope: 'all',
    shortcut: 'F12',
    group: 'global',
    isEnabled: () => true,
    execute: ctx => {
      ctx.onRunDiagnostics?.();
      dispatchRicisCommand(RICIS_COMMAND_EVENTS.runDiagnostics);
    },
  },
];

export class CommandRegistry {
  public static getAll(): readonly AppCommand[] {
    return APP_COMMANDS;
  }

  public static getById(id: string): AppCommand | undefined {
    return APP_COMMANDS.find(c => c.id === id);
  }

  public static getForApplet(appletId: AppletId): readonly AppCommand[] {
    return APP_COMMANDS.filter(c => c.appletScope === 'all' || c.appletScope.includes(appletId));
  }

  public static getByCategory(category: CommandCategory): readonly AppCommand[] {
    return APP_COMMANDS.filter(c => c.category === category);
  }

  public static getToolbarCommands(appletId: AppletId): readonly AppCommand[] {
    // Returns active commands specifically relevant for the current applet's toolbar
    return APP_COMMANDS.filter(c => {
      if (c.category === 'navigation') return false; // Navigation is in the top bar / tabs
      return c.appletScope === 'all' || c.appletScope.includes(appletId);
    });
  }
}
