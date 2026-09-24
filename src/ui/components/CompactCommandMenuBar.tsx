import { ContentButton } from './ContentButton';
import { AppletMenuEntry } from './AppletMenuEntry';
import { IconButton } from './IconButton';
// ============================================================================
// COMPACT OFFICE / VISUAL STUDIO COMMAND MENU BAR (MVVM / DRY / SOLID)
// Hierarchical dropdown menus with dynamic enable/disable states,
// shortcut keys, breadcrumbs, and browser history navigation.
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Layers, Activity, Sprout, GitBranch, List, BookOpen, Bug, Terminal, Settings, Sparkles, Copy, Check, Search, RotateCcw, Compass, Play, AlertCircle, ShieldCheck, Cpu } from 'lucide-react';
import type { AppletId } from '../../types/appletRegistry';
import { APPLET_DEFINITIONS } from '../../types/appletRegistry';
import { AppletNavigationService } from '../../services/AppletNavigationService';
import { UrlShareService } from '../../services/UrlShareService';
import { copyTextToClipboard } from '../../services/clipboard';
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
  const pendingMenuFocus = useRef<'first' | 'last' | null>(null);

  const focusMenuEdge = (edge: 'first' | 'last') => {
    const items = menuBarRef.current?.querySelectorAll<HTMLElement>('[role="menu"] [role="menuitem"]:not(:disabled)');
    if (items?.length) items[edge === 'first' ? 0 : items.length - 1].focus();
  };

  useEffect(() => {
    if (openMenu && pendingMenuFocus.current) {
      focusMenuEdge(pendingMenuFocus.current);
      pendingMenuFocus.current = null;
    }
  }, [openMenu]);

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const triggers = Array.from(menuBarRef.current?.querySelectorAll<HTMLButtonElement>('.menubar-command') ?? []);
    const trigger = target.closest<HTMLButtonElement>('.menubar-command');
    const popup = target.closest('[role="menu"]');
    if (!trigger && !popup) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      triggers.find(item => item.getAttribute('aria-expanded') === 'true')?.focus();
      setOpenMenu(null);
    } else if (event.key === 'Tab') {
      setOpenMenu(null);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const current = triggers.findIndex(item => item === trigger || (!trigger && item.getAttribute('aria-expanded') === 'true'));
      const next = triggers[(current + (event.key === 'ArrowRight' ? 1 : -1) + triggers.length) % triggers.length];
      if (openMenu) next?.click();
      next?.focus();
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const edge = event.key === 'ArrowUp' || event.key === 'End' ? 'last' : 'first';
      if (trigger) {
        if (trigger.getAttribute('aria-expanded') === 'true') focusMenuEdge(edge);
        else { pendingMenuFocus.current = edge; trigger.click(); }
      } else {
        const items = Array.from(popup?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? []);
        const current = items.indexOf(target.closest<HTMLElement>('[role="menuitem"]')!);
        const index = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
          : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items[index]?.focus();
      }
    }
  };

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
    void copyTextToClipboard(shareUrl).then((copied) => {
      if (copied) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    });
  };

  const handleNavigate = (applet: AppletId) => {
    onSelectApplet(applet);
    setOpenMenu(null);
  };

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
      onKeyDown={handleMenuKeyDown}
      className="relative z-50 flex shrink-0 flex-wrap items-center justify-between gap-1 px-2 py-1 bg-neutral-950 border-b border-neutral-800 text-xs font-mono select-none"
      data-testid="compact-command-menu-bar"
    >
      {/* Left: Branding + Browser-like Back/Forward Navigation + Menus */}
      <div className="flex min-w-0 flex-wrap items-center gap-1 sm:gap-2">
        {/* Home is a real keyboard-accessible command, not a clickable div. */}
        <ContentButton
          onClick={() => handleNavigate('map')}
          title="RICIS-III Engine Home"
          className="px-2 py-1 text-xs font-semibold tracking-wide text-cyan-300"
        >

          <span>RICIS-III</span>
        </ContentButton>

        {/* Browser Back / Forward Buttons (disabled until in-app history exists —
            BUG-08: previously an empty stack fell through to window.history.back()
            and silently ejected the user from the app) */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded p-0.5">
          <IconButton
            type="button"
            disabled={!AppletNavigationService.canGoBack()}
            onClick={() => AppletNavigationService.goBack()}
            className="p-1 text-slate-400 hover:text-white hover:bg-neutral-800 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:cursor-not-allowed"
            title={AppletNavigationService.canGoBack() ? 'Назад (Browser Back)' : 'Назад: история пуста'}
            aria-label="Browser Back"
            aria-disabled={!AppletNavigationService.canGoBack()}
          >
            <ChevronLeft size={14} />
          </IconButton>
          <IconButton
            type="button"
            disabled={!AppletNavigationService.canGoForward()}
            onClick={() => AppletNavigationService.goForward()}
            className="p-1 text-slate-400 hover:text-white hover:bg-neutral-800 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:cursor-not-allowed"
            title={AppletNavigationService.canGoForward() ? 'Вперёд (Browser Forward)' : 'Вперёд: история пуста'}
            aria-label="Browser Forward"
            aria-disabled={!AppletNavigationService.canGoForward()}
          >
            <ChevronRight size={14} />
          </IconButton>
        </div>

        {/* Top-Level Menus (Office / Visual Studio Style) */}
        <div role="menubar" aria-label="Главное меню" className="flex flex-wrap items-center gap-0.5">
          {/* MENU 1: Файл / Навигация */}
          <div className="static sm:relative">
            <IconButton presentation="menubar"
              role="menuitem"
              type="button"
              aria-expanded={openMenu === 'file'}
              onPointerEnter={() => { if (openMenu) setOpenMenu('file'); }}
              aria-haspopup="menu"
              onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 text-[11px] font-sans font-medium ${
                openMenu === 'file' ? 'bg-neutral-800 text-cyan-300' : 'text-slate-300 hover:bg-neutral-800/80 hover:text-white'
              }`}
            >
              <span>Файл</span>
            </IconButton>

            {openMenu === 'file' && (
              <div role="menu" className="absolute left-2 right-2 top-full mt-1 sm:left-0 sm:right-auto sm:w-64 bg-neutral-900 border border-neutral-700/80 rounded-md shadow-2xl py-1 text-xs font-sans z-50">
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 border-b border-neutral-800">
                  Виды и Апплеты
                </div>
                <IconButton presentation="menu"
                  role="menuitem"
                  type="button"
                  onClick={() => handleNavigate('map')}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-cyan-950/70 hover:text-cyan-200 transition-colors ${
                    activeApplet === 'map' ? 'bg-cyan-950/90 text-cyan-300 font-bold' : 'text-slate-300'
                  }`}
                >
                  <Layers size={13} className="text-cyan-400" />
                  <span className="flex-1">3D Граф Сингулярностей</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+1</span>
                </IconButton>
                <AppletMenuEntry applet="kinematic" onSelectApplet={onSelectApplet} onAfterClick={() => setOpenMenu(null)}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-emerald-950/70 hover:text-emerald-200 transition-colors ${
                    activeApplet === 'kinematic' ? 'bg-emerald-950/90 text-emerald-300 font-bold' : 'text-slate-300'
                  }`}
                >
                  <Activity size={13} className="text-emerald-400" />
                  <span className="flex-1">3D Кинематика N-Link</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+2</span>
                </AppletMenuEntry>
                <AppletMenuEntry applet="seed" onSelectApplet={onSelectApplet} onAfterClick={() => setOpenMenu(null)}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-emerald-950/70 hover:text-emerald-200 transition-colors ${
                    activeApplet === 'seed' ? 'bg-emerald-950/90 text-emerald-300 font-bold' : 'text-slate-300'
                  }`}
                >
                  <Sprout size={13} className="text-emerald-400" />
                  <span className="flex-1">Seed Протокол</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+3</span>
                </AppletMenuEntry>
                <AppletMenuEntry applet="comparison" onSelectApplet={onSelectApplet} onAfterClick={() => setOpenMenu(null)}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-neutral-800 hover:text-white transition-colors ${
                    activeApplet === 'comparison' ? 'bg-neutral-800 text-white font-bold' : 'text-slate-300'
                  }`}
                >
                  <GitBranch size={13} className="text-cyan-400" />
                  <span className="flex-1">Сравнение Графов</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+4</span>
                </AppletMenuEntry>
                <AppletMenuEntry applet="roadmap" onSelectApplet={onSelectApplet} onAfterClick={() => setOpenMenu(null)}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-neutral-800 hover:text-white transition-colors ${
                    activeApplet === 'roadmap' ? 'bg-neutral-800 text-white font-bold' : 'text-slate-300'
                  }`}
                >
                  <List size={13} className="text-violet-400" />
                  <span className="flex-1">Дорожная карта (Roadmap)</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+5</span>
                </AppletMenuEntry>

                <div className="my-1 border-t border-neutral-800" />

                <IconButton presentation="menu"
                  role="menuitem"
                  type="button"
                  onClick={handleCopyShareLink}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} className="text-slate-400" />}
                  <span className="flex-1">{copiedLink ? 'Ссылка скопирована!' : 'Скопировать URL апплета'}</span>
                </IconButton>
              </div>
            )}
          </div>

          {/* MENU 2: Вид / Камера */}
          <div className="static sm:relative">
            <IconButton presentation="menubar"
              role="menuitem"
              type="button"
              aria-expanded={openMenu === 'view'}
              onPointerEnter={() => { if (openMenu) setOpenMenu('view'); }}
              aria-haspopup="menu"
              onClick={() => setOpenMenu(openMenu === 'view' ? null : 'view')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 text-[11px] font-sans font-medium ${
                openMenu === 'view' ? 'bg-neutral-800 text-cyan-300' : 'text-slate-300 hover:bg-neutral-800/80 hover:text-white'
              }`}
            >
              <span>Вид</span>
            </IconButton>

            {openMenu === 'view' && (
              <div role="menu" className="absolute left-2 right-2 top-full mt-1 sm:left-0 sm:right-auto sm:w-64 bg-neutral-900 border border-neutral-700/80 rounded-md shadow-2xl py-1 text-xs font-sans z-50">
                <IconButton presentation="menu"
                  role="menuitem"
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
                </IconButton>
                <IconButton presentation="menu"
                  role="menuitem"
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
                </IconButton>
                <IconButton presentation="menu"
                  role="menuitem"
                  type="button"
                  onClick={() => handleExecute('view.searchNodes')}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-cyan-950/70 hover:text-cyan-200 transition-colors"
                >
                  <Search size={13} className="text-cyan-400" />
                  <span className="flex-1">Поиск Узлов и DOI</span>
                  <span className="text-[10px] font-mono text-slate-500">Ctrl+F</span>
                </IconButton>
              </div>
            )}
          </div>

          {/* MENU 3: Кинематика */}
          <div className="static sm:relative">
            <IconButton presentation="menubar"
              role="menuitem"
              type="button"
              aria-expanded={openMenu === 'kinematics'}
              onPointerEnter={() => { if (openMenu) setOpenMenu('kinematics'); }}
              aria-haspopup="menu"
              onClick={() => {
                // UX: when we are NOT on the kinematic page yet, a plain click
                // on the top-level «Кинематика» button navigates there directly
                // (in-tab). Popup-blockers in preview/iframe environments can
                // eat target=_blank links and users don't discover Alt+2, so a
                // single, deterministic in-tab click is the safest path. When
                // we ARE on the kinematic page the button toggles the in-page
                // control submenu (play/pause, reset, model switcher).
                if (activeApplet !== 'kinematic') {
                  onSelectApplet('kinematic');
                  setOpenMenu(null);
                  return;
                }
                setOpenMenu(openMenu === 'kinematics' ? null : 'kinematics');
              }}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 text-[11px] font-sans font-medium ${
                openMenu === 'kinematics' ? 'bg-neutral-800 text-emerald-300' : 'text-slate-300 hover:bg-neutral-800/80 hover:text-white'
              }`}
            >
              <span>Кинематика</span>
            </IconButton>

            {openMenu === 'kinematics' && (
              <div role="menu" className="absolute left-2 right-2 top-full mt-1 sm:left-0 sm:right-auto sm:w-72 bg-neutral-900 border border-neutral-700/80 rounded-md shadow-2xl py-1 text-xs font-sans z-50">
                {/* When we are NOT on the kinematic page yet, show the entry to
                    OPEN it — primary in-tab button (popup-safe) plus a secondary
                    new-tab link for users who want to keep the map alive. */}
                {activeApplet !== 'kinematic' && (
                  <>
                    <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 border-b border-neutral-800">
                      Открыть Кинематику
                    </div>
                    <AppletMenuEntry applet="kinematic" onSelectApplet={onSelectApplet} onAfterClick={() => setOpenMenu(null)}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-emerald-950/70 hover:text-emerald-200 transition-colors"
                    >
                      <Activity size={13} className="text-emerald-400" />
                      <span className="flex-1 font-semibold">3D Кинематика</span>
                      <span className="text-[10px] font-mono text-slate-500">Alt+2</span>
                    </AppletMenuEntry>
                    <div className="my-1 border-t border-neutral-800" />
                  </>
                )}
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 border-b border-neutral-800">
                  Управление Физикой
                </div>
                <IconButton presentation="menu"
                  role="menuitem"
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
                </IconButton>
                <IconButton presentation="menu"
                  role="menuitem"
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
                </IconButton>

                <div className="my-1 border-t border-neutral-800" />
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  Модели Манипуляторов
                </div>
                <AppletMenuEntry applet="kinematic" onSelectApplet={onSelectApplet} onAfterClick={() => setOpenMenu(null)} inTabOnly
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-emerald-950/70 hover:text-emerald-200 transition-colors"
                >
                  <Activity size={13} className="text-emerald-400" />
                  <div className="flex flex-col">
                    <span className="font-semibold">3-Link Planar</span>
                    <span className="text-[10px] text-slate-400">Полярная редукция O(1) и SVD</span>
                  </div>
                </AppletMenuEntry>
                <AppletMenuEntry applet="kinematic" onSelectApplet={onSelectApplet} onAfterClick={() => setOpenMenu(null)} inTabOnly
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-purple-950/70 hover:text-purple-200 transition-colors"
                >
                  <Sparkles size={13} className="text-purple-400" />
                  <div className="flex flex-col">
                    <span className="font-semibold">5-Link Hyper-Redundant</span>
                    <span className="text-[10px] text-slate-400">Null-space self-motion</span>
                  </div>
                </AppletMenuEntry>
              </div>
            )}
          </div>

          {/* MENU 4: Основания (RICIS Foundations) */}
          <div className="static sm:relative">
            <IconButton presentation="menubar"
              role="menuitem"
              type="button"
              aria-expanded={openMenu === 'foundations'}
              onPointerEnter={() => { if (openMenu) setOpenMenu('foundations'); }}
              aria-haspopup="menu"
              onClick={() => setOpenMenu(openMenu === 'foundations' ? null : 'foundations')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 text-[11px] font-sans font-medium ${
                openMenu === 'foundations' ? 'bg-neutral-800 text-purple-300' : 'text-slate-300 hover:bg-neutral-800/80 hover:text-white'
              }`}
            >
              <span>Основания</span>
            </IconButton>

            {openMenu === 'foundations' && (
              <div role="menu" className="absolute left-2 right-2 top-full mt-1 sm:left-0 sm:right-auto sm:w-64 bg-neutral-900 border border-neutral-700/80 rounded-md shadow-2xl py-1 text-xs font-sans z-50">
                <AppletMenuEntry applet="seed" onSelectApplet={onSelectApplet} onAfterClick={() => setOpenMenu(null)}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-emerald-950/70 hover:text-emerald-200 transition-colors"
                >
                  <Sprout size={13} className="text-emerald-300" />
                  <span className="flex-1">RICIS SEED (A11 Протокол)</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+3</span>
                </AppletMenuEntry>
                <AppletMenuEntry applet="comparison" onSelectApplet={onSelectApplet} onAfterClick={() => setOpenMenu(null)}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-cyan-950/70 hover:text-cyan-200 transition-colors"
                >
                  <GitBranch size={13} className="text-cyan-400" />
                  <span className="flex-1">RICIS vs Anthropic Граф</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+4</span>
                </AppletMenuEntry>
                <AppletMenuEntry applet="voynich" onSelectApplet={onSelectApplet} onAfterClick={() => setOpenMenu(null)}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-yellow-950/70 hover:text-yellow-200 transition-colors"
                >
                  <BookOpen size={13} className="text-yellow-400" />
                  <span className="flex-1">Манускрипт Войнича</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+6</span>
                </AppletMenuEntry>
                <AppletMenuEntry applet="p-vs-np" onSelectApplet={onSelectApplet} onAfterClick={() => setOpenMenu(null)}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-cyan-950/70 hover:text-cyan-200 transition-colors"
                >
                  <Cpu size={13} className="text-cyan-400" />
                  <span className="flex-1">P vs NP Решатель</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+F</span>
                </AppletMenuEntry>
              </div>
            )}
          </div>

          {/* MENU 5: Сервис и QA */}
          <div className="static sm:relative">
            <IconButton presentation="menubar"
              role="menuitem"
              type="button"
              aria-expanded={openMenu === 'diagnostics'}
              onPointerEnter={() => { if (openMenu) setOpenMenu('diagnostics'); }}
              aria-haspopup="menu"
              onClick={() => setOpenMenu(openMenu === 'diagnostics' ? null : 'diagnostics')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 text-[11px] font-sans font-medium ${
                openMenu === 'diagnostics' ? 'bg-neutral-800 text-rose-300' : 'text-slate-300 hover:bg-neutral-800/80 hover:text-white'
              }`}
            >
              <span>Сервис</span>
            </IconButton>

            {openMenu === 'diagnostics' && (
              <div role="menu" className="absolute left-2 right-2 top-full mt-1 sm:left-0 sm:right-auto sm:w-64 bg-neutral-900 border border-neutral-700/80 rounded-md shadow-2xl py-1 text-xs font-sans z-50">
                <AppletMenuEntry applet="qa-tests" onSelectApplet={onSelectApplet} onAfterClick={() => setOpenMenu(null)}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-rose-950/70 hover:text-rose-200 transition-colors"
                >
                  <Bug size={13} className="text-rose-400" />
                  <span className="flex-1">QA Стресс-тест и Аудит</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+8</span>
                </AppletMenuEntry>
                <AppletMenuEntry applet="proof-logs" onSelectApplet={onSelectApplet} onAfterClick={() => setOpenMenu(null)}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-emerald-950/70 hover:text-emerald-200 transition-colors"
                >
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span className="flex-1">Логи Ядра Lean 4</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+0</span>
                </AppletMenuEntry>
                <IconButton presentation="menu"
                  role="menuitem"
                  type="button"
                  onClick={() => handleNavigate('terminal')}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-purple-950/70 hover:text-purple-200 transition-colors"
                >
                  <Terminal size={13} className="text-purple-400" />
                  <span className="flex-1">Интерактивный REPL</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+7</span>
                </IconButton>
                <IconButton presentation="menu"
                  role="menuitem"
                  type="button"
                  onClick={() => handleExecute('global.diagnostics')}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  <AlertCircle size={13} className="text-amber-400" />
                  <span className="flex-1">Самодиагностика Системы</span>
                  <span className="text-[10px] font-mono text-slate-500">F12</span>
                </IconButton>
                <IconButton presentation="menu"
                  role="menuitem"
                  type="button"
                  onClick={() => handleNavigate('settings')}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  <Settings size={13} className="text-slate-400" />
                  <span className="flex-1">Настройки Системы</span>
                  <span className="text-[10px] font-mono text-slate-500">Alt+9</span>
                </IconButton>
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
          <IconButton
            type="button"
            onClick={onTogglePresentationMode}
            className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-slate-300 hover:text-white text-[11px] transition-colors flex items-center gap-1"
            title="Переключить режим отображения"
          >
            <Layers size={12} className="text-cyan-400" />
            <span className="hidden sm:inline">{presentationModeLabel}</span>
          </IconButton>
        )}



        <span className="hidden lg:inline text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
          {appBuildLabel}
        </span>
      </div>
    </div>
  );
};
