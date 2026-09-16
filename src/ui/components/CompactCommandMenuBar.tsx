// ============================================================================
// COMPACT OFFICE / VISUAL STUDIO COMMAND MENU BAR (MVVM / DRY / SOLID)
// Hierarchical dropdown menus with dynamic enable/disable states,
// shortcut keys, breadcrumbs, and browser history navigation.
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
  Activity,
  Sprout,
  GitBranch,
  List,
  BookOpen,
  Bug,
  Terminal,
  Settings,
  Sliders,
  Sparkles,
  ExternalLink,
  Shield,
  HelpCircle,
  Copy,
  Check,
  Search,
  RotateCcw,
  Compass,
  Play,
  PlayCircle,
  Trash2,
  Cpu,
  Download,
  AlertCircle,
} from 'lucide-react';
import type { AppletId } from '../../types/appletRegistry';
import { APPLET_DEFINITIONS } from '../../types/appletRegistry';
import { AppletNavigationService } from '../../services/AppletNavigationService';
import { UrlShareService } from '../../services/UrlShareService';
import { copyToClipboard } from '../../services/clipboard';
import type { CommandContext } from '../../types/commandTypes';
import { CommandRegistry } from '../../services/commandRegistry';

interface CompactCommandMenuBarProps {
  readonly activeApplet: AppletId;
  readonly onSelectApplet: (applet: AppletId) => void;
  readonly commandContext?: CommandContext;
  readonly onTogglePresentationMode?: () => void;
  readonly presentationModeLabel?: string;
  readonly appBuildLabel?: string;
}

export const CompactCommandMenuBar: React.FC<CompactCommandMenuBarProps> = ({
  activeApplet,
  onSelectApplet,
  commandContext,
  onTogglePresentationMode,
  presentationModeLabel = '3D / 2D',
  appBuildLabel = 'v7.7.4-seed-persistent',
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Fallback context if not provided
  const ctx: CommandContext = commandContext ?? {
    activeApplet,
    is3DMode: true,
    onSelectApplet,
  };

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyShareLink = () => {
    const shareUrl = UrlShareService.generateShareUrl({ applet: activeApplet });
    // BUG-07: unified guarded clipboard helper (guard + fallback + catch)
    void copyToClipboard(shareUrl).then((ok) => {
      if (ok) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    });
  };

  const handleNavigate = (applet: AppletId) => {
    onSelectApplet(applet);
    setOpenMenu(null);
  };

  // BUG-08: reflect the real internal history stacks. The component
  // re-renders on every navigation (popstate → App locationSearch), so the
  // values below are always fresh.
  const canGoBack = AppletNavigationService.canGoBack();
  const canGoForward = AppletNavigationService.canGoForward();

  const handleExecute = (cmdId: string) => {
    const cmd = CommandRegistry.getById(cmdId);
    if (cmd && cmd.isEnabled(ctx)) {
      cmd.execute(ctx);
      setOpenMenu(null);
    }
  };

  return (
    <div
      ref={menuBarRef}
      className="relative z-50 flex items-center justify-between px-2 py-1 bg-neutral-950 border-b border-neutral-800 text-xs font-mono select-none"
      data-testid="compact-command-menu-bar"
    >
      {/* Left: Branding + Browser-like Back/Forward Navigation + Menus */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Branding Logo */}
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-700/60 text-cyan-300 font-extrabold tracking-wider text-[11px] cursor-pointer"
          onClick={() => handleNavigate('map')}
          title="RICIS-III Engine Home"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>RICIS-III</span>
        </div>

        {/* Browser Back / Forward Buttons */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded p-0.5">
          <button
            type="button"
            disabled={!canGoBack}
            onClick={() => AppletNavigationService.goBack()}
            className="p-1 text-slate-400 hover:text-white hover:bg-neutral-800 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Назад (Browser Back)"
            aria-label="Browser Back"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            disabled={!canGoForward}
            onClick={() => AppletNavigationService.goForward()}
            className="p-1 text-slate-400 hover:text-white hover:bg-neutral-800 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Вперёд (Browser Forward)"
            aria-label="Browser Forward"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Top-Level Menus (Office / Visual Studio Style) */}
        <div className="flex items-center gap-0.5">
          {/* MENU 1: Файл / Навигация */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 text-[11px] font-sans font-medium ${
                openMenu === 'file' ? 'bg-neutral-800 text-cyan-300' : 'text-slate-300 hover:bg-neutral-800/80 hover:text-white'
              }`}
            >
              <span>Файл</span>
              <ChevronDown size={11} className="opacity-70" />
            </button>

            {openMenu === 'file' && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-neutral-900 border border-neutral-700/80 rounded-md shadow-2xl py-1 text-xs font-sans z-50">
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 border-b border-neutral-800">
                  Виды и Апплеты
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigate('map')}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-cyan-950/70 hover:text-cyan-200 transition-colors ${
                    activeApplet === 'map' ? 'bg-cyan-950/90 text-cyan-300 font-bold' : 'text-slate-300'
                  }`}
                >
                  <Layers size={13} className="text-cyan-400" />
                  <span className="flex-1">3D Граф Сингулярностей</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+1</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('kinematic')}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-emerald-950/70 hover:text-emerald-200 transition-colors ${
                    activeApplet === 'kinematic' ? 'bg-emerald-950/90 text-emerald-300 font-bold' : 'text-slate-300'
                  }`}
                >
                  <Activity size={13} className="text-emerald-400" />
                  <span className="flex-1">3D Кинематика N-Link</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+2</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('seed')}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-emerald-950/70 hover:text-emerald-200 transition-colors ${
                    activeApplet === 'seed' ? 'bg-emerald-950/90 text-emerald-300 font-bold' : 'text-slate-300'
                  }`}
                >
                  <Sprout size={13} className="text-emerald-400" />
                  <span className="flex-1">Seed Протокол</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+3</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('comparison')}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-neutral-800 hover:text-white transition-colors ${
                    activeApplet === 'comparison' ? 'bg-neutral-800 text-white font-bold' : 'text-slate-300'
                  }`}
                >
                  <GitBranch size={13} className="text-cyan-400" />
                  <span className="flex-1">Сравнение Графов</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+4</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('roadmap')}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-neutral-800 hover:text-white transition-colors ${
                    activeApplet === 'roadmap' ? 'bg-neutral-800 text-white font-bold' : 'text-slate-300'
                  }`}
                >
                  <List size={13} className="text-violet-400" />
                  <span className="flex-1">Дорожная карта (Roadmap)</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+5</span>
                </button>

                <div className="my-1 border-t border-neutral-800" />

                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} className="text-slate-400" />}
                  <span className="flex-1">{copiedLink ? 'Ссылка скопирована!' : 'Скопировать URL апплета'}</span>
                </button>
              </div>
            )}
          </div>

          {/* MENU 2: Вид / Камера */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'view' ? null : 'view')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 text-[11px] font-sans font-medium ${
                openMenu === 'view' ? 'bg-neutral-800 text-cyan-300' : 'text-slate-300 hover:bg-neutral-800/80 hover:text-white'
              }`}
            >
              <span>Вид</span>
              <ChevronDown size={11} className="opacity-70" />
            </button>

            {openMenu === 'view' && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-neutral-900 border border-neutral-700/80 rounded-md shadow-2xl py-1 text-xs font-sans z-50">
                <button
                  type="button"
                  disabled={activeApplet !== 'map'}
                  onClick={() => handleExecute('view.toggle3D')}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 transition-colors ${
                    activeApplet === 'map' ? 'text-slate-300 hover:bg-cyan-950/70 hover:text-cyan-200' : 'text-slate-600 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <Compass size={13} className="text-cyan-400" />
                  <span className="flex-1">3D / 2D Проекция</span>
                  <span className="text-[10px] font-mono text-slate-500">V</span>
                </button>
                <button
                  type="button"
                  disabled={activeApplet !== 'map'}
                  onClick={() => handleExecute('view.resetCamera')}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 transition-colors ${
                    activeApplet === 'map' ? 'text-slate-300 hover:bg-cyan-950/70 hover:text-cyan-200' : 'text-slate-600 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <RotateCcw size={13} className="text-cyan-400" />
                  <span className="flex-1">Сброс Камеры (Изометрия)</span>
                  <span className="text-[10px] font-mono text-slate-500">R</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExecute('view.searchNodes')}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-cyan-950/70 hover:text-cyan-200 transition-colors"
                >
                  <Search size={13} className="text-cyan-400" />
                  <span className="flex-1">Поиск Узлов и DOI</span>
                  <span className="text-[10px] font-mono text-slate-500">Ctrl+F</span>
                </button>
              </div>
            )}
          </div>

          {/* MENU 3: Кинематика */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'kinematics' ? null : 'kinematics')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 text-[11px] font-sans font-medium ${
                openMenu === 'kinematics' ? 'bg-neutral-800 text-emerald-300' : 'text-slate-300 hover:bg-neutral-800/80 hover:text-white'
              }`}
            >
              <span>Кинематика</span>
              <ChevronDown size={11} className="opacity-70" />
            </button>

            {openMenu === 'kinematics' && (
              <div className="absolute left-0 top-full mt-1 w-72 bg-neutral-900 border border-neutral-700/80 rounded-md shadow-2xl py-1 text-xs font-sans z-50">
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 border-b border-neutral-800">
                  Управление Физикой
                </div>
                <button
                  type="button"
                  disabled={activeApplet !== 'kinematic'}
                  onClick={() => handleExecute('kinematic.toggleSimulation')}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 transition-colors ${
                    activeApplet === 'kinematic' ? 'text-slate-300 hover:bg-emerald-950/70 hover:text-emerald-200' : 'text-slate-600 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <Play size={13} className="text-emerald-400" />
                  <span className="flex-1">Запуск / Пауза Симуляции</span>
                  <span className="text-[10px] font-mono text-slate-500">Space</span>
                </button>
                <button
                  type="button"
                  disabled={activeApplet !== 'kinematic'}
                  onClick={() => handleExecute('kinematic.resetJoints')}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 transition-colors ${
                    activeApplet === 'kinematic' ? 'text-slate-300 hover:bg-emerald-950/70 hover:text-emerald-200' : 'text-slate-600 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <RotateCcw size={13} className="text-emerald-400" />
                  <span className="flex-1">Сброс Шарниров и Положения</span>
                  <span className="text-[10px] font-mono text-slate-500">Ctrl+R</span>
                </button>

                <div className="my-1 border-t border-neutral-800" />
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  Модели Манипуляторов
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigate('kinematic')}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-emerald-950/70 hover:text-emerald-200 transition-colors"
                >
                  <Activity size={13} className="text-emerald-400" />
                  <div className="flex flex-col">
                    <span className="font-semibold">3-Link Planar</span>
                    <span className="text-[10px] text-slate-400">Полярная редукция O(1) и SVD</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('kinematic')}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-purple-950/70 hover:text-purple-200 transition-colors"
                >
                  <Sparkles size={13} className="text-purple-400" />
                  <div className="flex flex-col">
                    <span className="font-semibold">5-Link Hyper-Redundant</span>
                    <span className="text-[10px] text-slate-400">Null-space self-motion</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* MENU 4: Основания (RICIS Foundations) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'foundations' ? null : 'foundations')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 text-[11px] font-sans font-medium ${
                openMenu === 'foundations' ? 'bg-neutral-800 text-purple-300' : 'text-slate-300 hover:bg-neutral-800/80 hover:text-white'
              }`}
            >
              <span>Основания</span>
              <ChevronDown size={11} className="opacity-70" />
            </button>

            {openMenu === 'foundations' && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-neutral-900 border border-neutral-700/80 rounded-md shadow-2xl py-1 text-xs font-sans z-50">
                <button
                  type="button"
                  onClick={() => handleNavigate('seed')}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-emerald-950/70 hover:text-emerald-200 transition-colors"
                >
                  <Sprout size={13} className="text-emerald-300" />
                  <span className="flex-1">RICIS SEED (A11 Протокол)</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+3</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('comparison')}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-cyan-950/70 hover:text-cyan-200 transition-colors"
                >
                  <GitBranch size={13} className="text-cyan-400" />
                  <span className="flex-1">RICIS vs Anthropic Граф</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+4</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('voynich')}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-yellow-950/70 hover:text-yellow-200 transition-colors"
                >
                  <BookOpen size={13} className="text-yellow-400" />
                  <span className="flex-1">Манускрипт Войнича</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+6</span>
                </button>
              </div>
            )}
          </div>

          {/* MENU 5: Сервис и QA */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'diagnostics' ? null : 'diagnostics')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 text-[11px] font-sans font-medium ${
                openMenu === 'diagnostics' ? 'bg-neutral-800 text-rose-300' : 'text-slate-300 hover:bg-neutral-800/80 hover:text-white'
              }`}
            >
              <span>Сервис</span>
              <ChevronDown size={11} className="opacity-70" />
            </button>

            {openMenu === 'diagnostics' && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-neutral-900 border border-neutral-700/80 rounded-md shadow-2xl py-1 text-xs font-sans z-50">
                <button
                  type="button"
                  onClick={() => handleNavigate('qa-tests')}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-rose-950/70 hover:text-rose-200 transition-colors"
                >
                  <Bug size={13} className="text-rose-400" />
                  <span className="flex-1">QA Стресс-тест и Аудит</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+8</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('terminal')}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-purple-950/70 hover:text-purple-200 transition-colors"
                >
                  <Terminal size={13} className="text-purple-400" />
                  <span className="flex-1">Интерактивный REPL</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+7</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExecute('global.diagnostics')}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  <AlertCircle size={13} className="text-amber-400" />
                  <span className="flex-1">Самодиагностика Системы</span>
                  <span className="text-[10px] font-mono text-slate-500">F12</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('settings')}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  <Settings size={13} className="text-slate-400" />
                  <span className="flex-1">Настройки Системы</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+9</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center: Breadcrumb / Active Applet Title */}
      <div className="hidden md:flex items-center gap-2 px-3 py-0.5 rounded bg-neutral-900/80 border border-neutral-800/80 text-[11px] text-slate-300">
        <span className="text-slate-500 font-mono">Апплет:</span>
        <span className="text-cyan-400 font-bold">{APPLET_DEFINITIONS[activeApplet]?.shortTitle ?? activeApplet}</span>
        <span className="text-slate-600 font-mono">({`applet=${activeApplet}`})</span>
      </div>

      {/* Right: Quick Tool Actions & View Toggle */}
      <div className="flex items-center gap-1.5">
        {onTogglePresentationMode && (
          <button
            type="button"
            onClick={onTogglePresentationMode}
            className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-slate-300 hover:text-white text-[11px] transition-colors flex items-center gap-1"
            title="Переключить режим отображения"
          >
            <Layers size={12} className="text-cyan-400" />
            <span className="hidden sm:inline">{presentationModeLabel}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleCopyShareLink}
          className="px-2 py-1 rounded bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-300 text-[11px] transition-colors flex items-center gap-1"
          title="Скопировать ссылку на текущий апплет"
        >
          {copiedLink ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          <span className="hidden sm:inline">{copiedLink ? 'Готово!' : 'Share URL'}</span>
        </button>

        <span className="hidden lg:inline text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
          {appBuildLabel}
        </span>
      </div>
    </div>
  );
};
