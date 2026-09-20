import { ContentButton } from './components/ContentButton';
import { IconButton } from './components/IconButton';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Menu } from 'lucide-react';

/**
 * Один пункт контекстного меню карточки задачи.
 * Все кнопки выполнения карточки описываются этим контрактом.
 */
export type NodeContextMenuItem = {
  /** Стабильный идентификатор действия (для тестов и aria-разметки). */
  id: string;
  label: string;
  /** Вторая строка-подсказка под названием действия. */
  hint?: string;
  icon: React.ReactNode;
  /** Группа пунктов внутри меню (заголовок секции). */
  group?: string;
  disabled?: boolean;
  /** Причина недоступности (например, «Заблокировано зависимостями»). */
  disabledReason?: string;
  /** Признак выполнения длительного действия (спиннер вместо иконки). */
  busy?: boolean;
  /**
   * Если задан, пункт рендерится как настоящая ссылка (`target=_blank`,
   * `rel=noopener noreferrer`) и открывает deep-link в новой вкладке,
   * не разрушая текущую рабочую область карты. Иконка-маркер ↗ добавляется
   * автоматически. См. UI_NAVIGATION_AUDIT.md §7 (new-tab policy).
   */
  href?: string;
  onSelect?: () => void;
};

type Props = {
  items: NodeContextMenuItem[];
  /** Подпись триггера. По умолчанию — «Действия». */
  triggerLabel?: string;
  /** Общая доступность меню (например, во время решения задачи). */
  disabled?: boolean;
  footer?: (closeMenu: () => void) => React.ReactNode;
};

/**
 * Контекстное меню задачи: принимает все действия бывших кнопок карточки
 * (выполнение RICIS-решения, калькуляторы, навигация, исследование, правка)
 * и раскрывает их по клику. Закрытие: выбор пункта, Escape, клик вне меню.
 */
export const NodeContextMenu: React.FC<Props> = ({
  items,
  triggerLabel = 'Действия',
  disabled = false,
  footer,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const visibleGroups: Array<{ group: string; items: NodeContextMenuItem[] }> = [];
  for (const item of items) {
    const group = item.group || 'Действия';
    let bucket = visibleGroups.find(g => g.group === group);
    if (!bucket) {
      bucket = { group, items: [] };
      visibleGroups.push(bucket);
    }
    bucket.items.push(item);
  }

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      <IconButton
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={triggerLabel}
        data-testid="node-context-menu-trigger"
        disabled={disabled}
        onClick={() => setIsOpen(prev => !prev)}
        className="inline-flex min-h-8 min-w-8 items-center justify-center gap-1 rounded-md border border-cyan-800/70 bg-cyan-950/50 px-2 text-cyan-300 transition-colors hover:border-cyan-400 hover:bg-cyan-900/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      >
        <Menu size={16} />
        <span className="text-[9px] font-bold uppercase tracking-wider">{triggerLabel}</span>
      </IconButton>

      {isOpen && (
        <div
          role="menu"
          aria-label={triggerLabel}
          data-testid="node-context-menu"
          className="absolute right-0 top-full z-50 mt-1 max-h-[70vh] w-64 overflow-y-auto rounded-lg border border-cyan-800/70 bg-[#070b12] py-1 shadow-[0_12px_40px_rgba(0,0,0,0.9)]"
        >
          {visibleGroups.map(({ group, items: groupItems }) => (
            <div key={group} role="group" aria-label={group}>
              <p className="px-3 pb-1 pt-2 text-[8px] font-bold uppercase tracking-[0.18em] text-slate-500">
                {group}
              </p>
              {groupItems.map(item => {
                const itemVisual = (
                  <>
                    <span className="mt-0.5 shrink-0 text-cyan-400">
                      {item.busy ? (
                        <span
                          aria-label="Выполняется"
                          className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent"
                        />
                      ) : (
                        item.icon
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold leading-tight text-slate-100">
                        {item.label}
                        {item.href && (
                          <ExternalLink
                            size={10}
                            aria-hidden
                            className="ml-1.5 inline-block align-baseline text-cyan-500"
                          />
                        )}
                      </span>
                      {item.hint && (
                        <span className="mt-0.5 block truncate text-[9px] leading-tight text-slate-500">
                          {item.disabled && item.disabledReason ? item.disabledReason : item.hint}
                        </span>
                      )}
                    </span>
                  </>
                );

                if (item.href && !item.disabled) {
                  // Ссылочный пункт: deep-link в новой вкладке, карта в текущей
                  // вкладке не уничтожается (UI_NAVIGATION_AUDIT.md §7).
                  return (
                    <a
                      key={item.id}
                      role="menuitem"
                      data-testid={`node-context-menu-item-${item.id}`}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${item.hint ?? item.label} — открыть в новой вкладке`}
                      onClick={closeMenu}
                      className="menu-command flex w-full cursor-pointer items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-cyan-950/60"
                    >
                      {itemVisual}
                    </a>
                  );
                }

                return (
                  <ContentButton
                    key={item.id}
                    type="button"
                    role="menuitem"
                    data-testid={`node-context-menu-item-${item.id}`}
                    disabled={item.disabled}
                    title={item.disabled ? item.disabledReason : item.hint}
                    onClick={() => {
                      if (item.disabled) return;
                      closeMenu();
                      item.onSelect?.();
                    }}
                    className={`menu-command flex w-full items-start gap-2 px-3 py-2 text-left transition-colors ${
                      item.disabled
                        ? 'cursor-not-allowed opacity-45'
                        : 'cursor-pointer hover:bg-cyan-950/60'
                    }`}
                  >
                    {itemVisual}
                  </ContentButton>
                );
              })}
            </div>
          ))}
          {footer?.(closeMenu)}
        </div>
      )}
    </div>
  );
};
