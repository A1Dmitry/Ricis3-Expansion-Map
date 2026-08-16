import React, { useState } from 'react';
import { Settings, Plus, User, Sliders, X, Check, Eye, EyeOff, LayoutGrid, Globe } from 'lucide-react';
import type { AdaptiveRole } from '../hooks/useAdaptiveUI';
import { useI18nStore } from '../store/useI18nStore';
import { LanguageToggle } from './LanguageToggle';

export interface UIElementToggle {
  id: string;
  label: string;
  isVisible: boolean;
}

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: AdaptiveRole[];
  currentRoleId: string;
  onSelectRole: (roleId: string) => void;
  onCreateRole: (name: string, templateRoleId?: string) => void;
  uiElements?: { id: string; label: string }[];
  hiddenElementIds?: Set<string>;
  onToggleElement?: (id: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  roles,
  currentRoleId,
  onSelectRole,
  onCreateRole,
  uiElements = [],
  hiddenElementIds = new Set(),
  onToggleElement,
}) => {
  const { t } = useI18nStore();
  const [newRoleName, setNewRoleName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [cloneCurrent, setCloneCurrent] = useState(true);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    onCreateRole(newRoleName.trim(), cloneCurrent ? currentRoleId : undefined);
    setNewRoleName('');
    setIsCreating(false);
  };

  return (
    // Non-blocking slide-out right panel (Drawer / Flyout)
    <div className="fixed inset-0 z-50 pointer-events-none flex justify-end">
      {/* Subtle backdrop overlay for focus without completely blocking the screen */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto transition-opacity"
        onClick={onClose}
      />

      <div 
        className="relative w-full max-w-md bg-[#080b11] border-l border-cyan-900/40 shadow-[0_0_50px_rgba(0,0,0,0.9)] h-full overflow-hidden flex flex-col pointer-events-auto z-10 animate-in slide-in-from-right duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/80 bg-[#0c1017]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
              <Settings size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                {t('settings.title')}
              </h2>
              <p className="text-[11px] text-slate-400">
                {t('settings.subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-neutral-800/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* Section: Language / Локализация */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Globe size={14} className="text-cyan-400" />
                <span>Язык / Language</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">RU / EN</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg">
              <div className="text-xs text-slate-300">
                <p className="font-semibold text-slate-100">Локализация интерфейса</p>
                <p className="text-[10px] text-slate-400">Автоопределение по заголовку браузера</p>
              </div>
              <LanguageToggle />
            </div>
          </div>

          {/* Section: UI Panels Visibility */}
          {uiElements.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <LayoutGrid size={14} className="text-cyan-400" />
                  <span>Панели сайдбара</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Live Toggle</span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {uiElements.map((el) => {
                  const isVisible = !hiddenElementIds.has(el.id);
                  return (
                    <button
                      key={el.id}
                      type="button"
                      onClick={() => onToggleElement?.(el.id)}
                      className={`min-h-[38px] w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${
                        isVisible
                          ? 'bg-neutral-900/80 border-neutral-700/80 text-slate-200 hover:border-cyan-700/60'
                          : 'bg-neutral-950/40 border-neutral-800/50 text-slate-500 line-through opacity-70 hover:opacity-100'
                      }`}
                    >
                      <span className="text-xs font-medium">{el.label}</span>
                      <div className="flex items-center gap-1.5">
                        {isVisible ? (
                          <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono">
                            <Eye size={13} />
                            Вкл
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                            <EyeOff size={13} />
                            Выкл
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: UI Profiles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <User size={14} className="text-cyan-400" />
                <span>Профиль интерфейса</span>
              </label>
              {!isCreating && (
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  <Plus size={14} /> Создать новый
                </button>
              )}
            </div>

            {/* List of profiles */}
            <div className="grid grid-cols-1 gap-2">
              {roles.map(role => {
                const isSelected = role.id === currentRoleId;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => onSelectRole(role.id)}
                    className={`min-h-[44px] w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-700/80 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'bg-neutral-900/50 border-neutral-800 hover:bg-neutral-900 hover:border-neutral-700 text-slate-300'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{role.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {role.id === 'default'
                          ? 'Стандартный баланс элементов'
                          : role.id === 'researcher'
                          ? 'Фокус на поиске, зонах и доступных задачах'
                          : role.id === 'architect'
                          ? 'Фокус на симуляции физики и быстрых действиях'
                          : `Кликов: ${role.clickCount}`}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Create new profile form */}
            {isCreating && (
              <form onSubmit={handleCreate} className="p-3.5 bg-neutral-900/70 border border-neutral-800 rounded-lg space-y-3 mt-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Название профиля:</label>
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={e => setNewRoleName(e.target.value)}
                    placeholder="Например: Эксперт RICIS-III"
                    autoFocus
                    className="w-full h-10 px-3 bg-neutral-950 border border-neutral-700 rounded-md text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cloneCurrent}
                    onChange={e => setCloneCurrent(e.target.checked)}
                    className="rounded border-neutral-700 bg-neutral-950 text-cyan-500 focus:ring-0"
                  />
                  <span>Скопировать настройки текущего профиля</span>
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="min-h-[36px] px-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-md transition-colors"
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsCreating(false); setNewRoleName(''); }}
                    className="min-h-[36px] px-3.5 bg-neutral-800 hover:bg-neutral-700 text-slate-300 font-medium text-xs rounded-md transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* System info */}
          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Ядро: RICIS-III v7.7</span>
            <span>Панель: Live Drawer</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800/80 bg-[#0c1017] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-5 bg-neutral-800 hover:bg-neutral-700 text-slate-100 text-xs font-bold rounded-lg transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
