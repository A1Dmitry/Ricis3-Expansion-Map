// ============================================================================
// RICIS-III COMMAND SYSTEM TYPES (DDD / SOLID / MVVM)
// Canonical contracts for contextual action commands, toolbar buttons & menus
// ============================================================================

import type { AppletId } from './appletRegistry';

export type CommandCategory =
  | 'file'
  | 'edit'
  | 'view'
  | 'navigation'
  | 'physics'
  | 'singularity'
  | 'seed'
  | 'tools'
  | 'qa'
  | 'help';

export interface CommandContext {
  readonly activeApplet: AppletId;
  readonly is3DMode?: boolean;
  readonly isSimulationRunning?: boolean;
  readonly isAutoProverRunning?: boolean;
  readonly activePreset?: string;
  readonly activeNodeId?: string | null;
  readonly onSelectApplet: (applet: AppletId) => void;
  readonly onToggle3DMode?: () => void;
  readonly onResetCamera?: () => void;
  readonly onToggleSimulation?: () => void;
  readonly onResetSimulation?: () => void;
  readonly onStepSimulation?: () => void;
  readonly onSearchNodes?: () => void;
  readonly onAddNode?: () => void;
  readonly onExportGraph?: () => void;
  readonly onRunDiagnostics?: () => void;
  readonly onRunProver?: () => void;
  readonly onClearTerminal?: () => void;
  readonly onExecuteRepl?: () => void;
}

export interface AppCommand {
  readonly id: string;
  readonly label: string;
  readonly tooltip: string;
  readonly iconName: string;
  readonly category: CommandCategory;
  readonly appletScope: readonly AppletId[] | 'all';
  readonly shortcut?: string;
  readonly group?: string;
  readonly isEnabled: (ctx: CommandContext) => boolean;
  readonly isActive?: (ctx: CommandContext) => boolean;
  readonly execute: (ctx: CommandContext) => void | Promise<void>;
}

export interface ToolbarGroup {
  readonly id: string;
  readonly title: string;
  readonly commandIds: readonly string[];
}
