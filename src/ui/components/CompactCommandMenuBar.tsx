// ============================================================================
// COMPACT OFFICE / VISUAL STUDIO COMMAND MENU BAR (MVVM / DRY / SOLID)
// Replaces scattered top-level buttons with grouped hierarchical menus & submenus,
// browser-style Back/Forward navigation, breadcrumbs and active applet deep linking.
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
} from 'lucide-react';
import type { AppletId } from '../../types/appletRegistry';
import { APPLET_DEFINITIONS } from '../../types/appletRegistry';
import { AppletNavigationService } from '../../services/AppletNavigationService';
import { UrlShareService } from '../../services/UrlShareService';

interface CompactCommandMenuBarProps {
  readonly activeApplet: AppletId;
  readonly onSelectApplet: (applet: AppletId) => void;
  readonly onTogglePresentationMode?: () => void;
  readonly presentationModeLabel?: string;
  readonly appBuildLabel?: string;
}

export const CompactCommandMenuBar: React.FC<CompactCommandMenuBarProps> = ({
  activeApplet,
  onSelectApplet,
  onTogglePresentationMode,
  presentationModeLabel = '3D / 2D',
  appBuildLabel = 'v7.7.4-seed-persistent',
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const menuBarRef = useRef<HTMLDivElement>(null);

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
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }).catch(() => {
      // fallback
    });
  };

  const handleNavigate = (applet: AppletId) => {
    onSelectApplet(applet);
    setOpenMenu(null);
  };

  return (
    <div
      ref={menuBarRef}
      className="relative z-50 flex items-center justify-between px-2 py-1 bg-neutral-950 border-b border-neutral-800 text-xs font-mono select-none"
    >
      {/* Left: Branding + Browser-like Back/Forward Navigation + Menus */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Branding Logo */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-700/60 text-cyan-300 font-extrabold tracking-wider text-[11px] cursor-pointer"
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
            onClick={() => AppletNavigationService.goBack()}
            className="p-1 text-slate-400 hover:text-white hover:bg-neutral-800 rounded transition-colors disabled:opacity-30"
            title="Назад (Browser Back)"
            aria-label="Browser Back"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => AppletNavigationService.goForward()}
            className="p-1 text-slate-400 hover:text-white hover:bg-neutral-800 rounded transition-colors disabled:opacity-30"
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
              <span>Рабочая область</span>
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
                  <span className="text-[10px] font-mono text-slate-500">Ctrl+1</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('kinematic')}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-emerald-950/70 hover:text-emerald-200 transition-colors ${
                    activeApplet === 'kinematic' ? 'bg-emerald-950/90 text-emerald-300 font-bold' : 'text-slate-300'
                  }`}
                >
                  <Activity size={13} className="text-emerald-400" />
                  <span className="flex-1">3D Кинематика и Манипуляторы</span>
                  <span className="text-[10px] font-mono text-slate-500">Ctrl+2</span>
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
                  <span className="text-[10px] font-mono text-slate-500">Ctrl+5</span>
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

          {/* MENU 2: Манипулятор / Кинематика */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'kinematics' ? null : 'kinematics')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 text-[11px] font-sans font-medium ${
                openMenu === 'kinematics' ? 'bg-neutral-800 text-emerald-300' : 'text-slate-300 hover:bg-neutral-800/80 hover:text-white'
              }`}
            >
              <span>Манипулятор</span>
              <ChevronDown size={11} className="opacity-70" />
            </button>

            {openMenu === 'kinematics' && (
              <div className="absolute left-0 top-full mt-1 w-72 bg-neutral-900 border border-neutral-700/80 rounded-md shadow-2xl py-1 text-xs font-sans z-50">
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 border-b border-neutral-800">
                  Модели Манипуляторов
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigate('kinematic')}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-emerald-950/70 hover:text-emerald-200 transition-colors"
                >
                  <Activity size={13} className="text-emerald-400" />
                  <div className="flex flex-col">
                    <span className="font-semibold">3-Link Planar (READY)</span>
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
                    <span className="font-semibold">5-Link Hyper-Redundant (READY)</span>
                    <span className="text-[10px] text-slate-400">3D Null-space self-motion dim=3</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('kinematic')}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-amber-950/70 hover:text-amber-200 transition-colors"
                >
                  <Sliders size={13} className="text-amber-400" />
                  <div className="flex flex-col">
                    <span className="font-semibold">Spatial 6-DOF RICIS Arm</span>
                    <span className="text-[10px] text-slate-400">Сферический охват в 3D пространстве</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* MENU 3: Основания (RICIS Foundations) */}
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
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('comparison')}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-cyan-950/70 hover:text-cyan-200 transition-colors"
                >
                  <GitBranch size={13} className="text-cyan-400" />
                  <span className="flex-1">RICIS vs Anthropic Граф</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('voynich')}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-yellow-950/70 hover:text-yellow-200 transition-colors"
                >
                  <BookOpen size={13} className="text-yellow-400" />
                  <span className="flex-1">Манускрипт Войнича</span>
                </button>
              </div>
            )}
          </div>

          {/* MENU 4: Сервис и Тестирование */}
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
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('terminal')}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-purple-950/70 hover:text-purple-200 transition-colors"
                >
                  <Terminal size={13} className="text-purple-400" />
                  <span className="flex-1">Интерактивная Консоль (Sandbox)</span>
                  <span className="text-[10px] font-mono text-slate-500">Ctrl+~</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('settings')}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  <Settings size={13} className="text-slate-400" />
                  <span className="flex-1">Настройки Системы</span>
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
