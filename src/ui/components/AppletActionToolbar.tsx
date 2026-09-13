// ============================================================================
// DYNAMIC APPLET ACTION TOOLBAR (MVVM / DDD / SOLID)
// Ribbon-style action bar rendering context-aware command buttons with
// real-time enabled/disabled states, active indicators, and rich tooltips.
// ============================================================================

import React, { useState } from 'react';
import {
  Compass,
  RotateCcw,
  Search,
  Play,
  Pause,
  StepForward,
  Trash2,
  Cpu,
  Share2,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Activity,
  Bug,
  BookOpen,
  Terminal,
  Settings,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';
import type { AppletId } from '../../types/appletRegistry';
import { APPLET_DEFINITIONS } from '../../types/appletRegistry';
import type { CommandContext, AppCommand } from '../../types/commandTypes';
import { CommandRegistry } from '../../services/commandRegistry';
import { ActionTooltip } from './ActionTooltip';

interface AppletActionToolbarProps {
  readonly activeApplet: AppletId;
  readonly commandContext: CommandContext;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Compass,
  RotateCcw,
  Search,
  Play,
  Pause,
  StepForward,
  Trash2,
  Cpu,
  Share2,
  Sparkles,
  Layers,
  Activity,
  Bug,
  BookOpen,
  Terminal,
  Settings,
  HelpCircle,
};

export const AppletActionToolbar: React.FC<AppletActionToolbarProps> = ({
  activeApplet,
  commandContext,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const appletDef = APPLET_DEFINITIONS[activeApplet];
  const toolbarCommands = CommandRegistry.getToolbarCommands(activeApplet);

  const handleCommandClick = async (cmd: AppCommand) => {
    if (!cmd.isEnabled(commandContext)) return;

    if (cmd.id === 'global.share') {
      cmd.execute(commandContext);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2000);
      return;
    }

    await cmd.execute(commandContext);
  };

  if (isCollapsed) {
    return (
      <div className="flex items-center justify-between px-2 py-0.5 bg-neutral-900/90 border-b border-neutral-800 text-[11px] font-mono select-none">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">{appletDef?.shortTitle || activeApplet}</span>
          <span className="text-[10px] text-slate-500">• {appletDef?.category || 'workspace'}</span>
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Развернуть панель инструментов"
          aria-label="Expand toolbar"
        >
          <ChevronDown size={12} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between px-3 py-1 bg-neutral-900/95 border-b border-neutral-800/80 text-xs font-mono select-none shadow-sm backdrop-blur-sm overflow-x-auto"
      data-testid="applet-action-toolbar"
    >
      {/* Left: Active Applet Context Badge + Grouped Action Buttons */}
      <div className="flex items-center gap-2 min-w-max">
        {/* Context Badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-slate-200 font-medium text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>{appletDef?.shortTitle || 'Рабочая Область'}</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
            {appletDef?.category || 'applet'}
          </span>
        </div>

        {/* Separator */}
        <div className="h-4 w-px bg-neutral-700 mx-1" />

        {/* Dynamic Context Commands for Current Applet */}
        <div className="flex items-center gap-1">
          {toolbarCommands.map(cmd => {
            const isEnabled = cmd.isEnabled(commandContext);
            const isActive = cmd.isActive ? cmd.isActive(commandContext) : false;
            const IconComponent = ICON_MAP[cmd.iconName] || Sparkles;

            const buttonStyle = isEnabled
              ? isActive
                ? 'bg-cyan-950 text-cyan-300 border-cyan-700/80 shadow-inner'
                : 'text-slate-300 hover:text-white hover:bg-neutral-800 border-transparent'
              : 'text-slate-600 opacity-40 cursor-not-allowed border-transparent';

            return (
              <ActionTooltip
                key={cmd.id}
                title={cmd.label}
                description={cmd.tooltip}
                shortcut={cmd.shortcut}
                disabledReason={!isEnabled ? 'Действие недоступно в текущем состоянии' : undefined}
              >
                <button
                  type="button"
                  disabled={!isEnabled}
                  onClick={() => handleCommandClick(cmd)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-sans transition-all duration-150 ${buttonStyle}`}
                >
                  <IconComponent size={13} className={isActive ? 'text-cyan-400 animate-pulse' : ''} />
                  <span>{cmd.label}</span>
                </button>
              </ActionTooltip>
            );
          })}
        </div>
      </div>

      {/* Right: Global Toolbar Actions (Share + Collapse) */}
      <div className="flex items-center gap-1.5 min-w-max ml-4">
        {/* Quick Share with dynamic feedback */}
        <ActionTooltip title="Поделиться Ссылкой" description="Скопировать deep-link текущего апплета" shortcut="Alt+S">
          <button
            type="button"
            onClick={() => handleCommandClick(CommandRegistry.getById('global.share')!)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-slate-300 hover:text-white text-[11px] transition-colors"
          >
            {copiedSuccess ? <Check size={11} className="text-emerald-400" /> : <Share2 size={11} />}
            <span className="hidden sm:inline">{copiedSuccess ? 'Скопировано' : 'Поделиться'}</span>
          </button>
        </ActionTooltip>

        {/* Collapse Toolbar toggle */}
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Свернуть панель инструментов"
          aria-label="Collapse toolbar"
        >
          <ChevronUp size={13} />
        </button>
      </div>
    </div>
  );
};
