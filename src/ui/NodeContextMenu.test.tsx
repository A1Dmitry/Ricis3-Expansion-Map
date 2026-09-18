/// <reference types="vitest/globals" />
import React from 'react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Play, Compass } from 'lucide-react';
import { NodeContextMenu } from './NodeContextMenu';
import type { NodeContextMenuItem } from './NodeContextMenu';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let container: HTMLDivElement | undefined;

const items: NodeContextMenuItem[] = [
  {
    id: 'solve',
    group: 'Выполнение',
    icon: <Play size={14} />,
    label: 'Запустить RICIS-решение',
    hint: 'Синтезировать доказательство Агентом',
    onSelect: vi.fn(),
  },
  {
    id: 'locked',
    group: 'Выполнение',
    icon: <Play size={14} />,
    label: 'Недоступное действие',
    disabled: true,
    disabledReason: 'Заблокировано зависимостями',
    onSelect: vi.fn(),
  },
  {
    id: 'explore',
    group: 'Исследование',
    icon: <Compass size={14} />,
    label: 'Explore',
    onSelect: vi.fn(),
  },
];

async function renderMenu(props?: Partial<{ disabled: boolean }>) {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(React.createElement(NodeContextMenu, { items: items as NodeContextMenuItem[], ...props }));
  });
  return { container, items };
}

const trigger = () =>
  container?.querySelector<HTMLButtonElement>('[data-testid="node-context-menu-trigger"]');
const menu = () => container?.querySelector<HTMLDivElement>('[data-testid="node-context-menu"]');

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(async () => {
  await act(async () => root?.unmount());
  container?.remove();
  container = undefined;
  root = undefined;
});

describe('NodeContextMenu — контекстное меню действий карточки задачи', () => {
  it('меню закрыто по умолчанию и открывается по клику на триггер', async () => {
    await renderMenu();
    expect(menu()).toBeNull();
    await act(async () => {
      trigger()!.click();
    });
    expect(menu()).not.toBeNull();
    expect(trigger()!.getAttribute('aria-expanded')).toBe('true');
  });

  it('показывает сгруппированные пункты действий задачи', async () => {
    await renderMenu();
    await act(async () => {
      trigger()!.click();
    });
    const text = menu()!.textContent || '';
    expect(text).toContain('Выполнение');
    expect(text).toContain('Исследование');
    expect(text).toContain('Запустить RICIS-решение');
    expect(text).toContain('Explore');
  });

  it('выбирает действие, закрывает меню и вызывает обработчик один раз', async () => {
    await renderMenu();
    await act(async () => {
      trigger()!.click();
    });
    const item = container!.querySelector<HTMLButtonElement>(
      '[data-testid="node-context-menu-item-solve"]',
    )!;
    await act(async () => {
      item.click();
    });
    expect(items[0].onSelect).toHaveBeenCalledTimes(1);
    expect(menu()).toBeNull();
  });

  it('не вызывает обработчик заблокированного действия и не закрывает меню', async () => {
    await renderMenu();
    await act(async () => {
      trigger()!.click();
    });
    const item = container!.querySelector<HTMLButtonElement>(
      '[data-testid="node-context-menu-item-locked"]',
    )!;
    await act(async () => {
      item.click();
    });
    expect(items[1].onSelect).not.toHaveBeenCalled();
    expect(menu()).not.toBeNull();
    expect(item.getAttribute('title')).toBe('Заблокировано зависимостями');
  });

  it('закрывается по Escape и по клику вне меню', async () => {
    await renderMenu();
    await act(async () => {
      trigger()!.click();
    });
    expect(menu()).not.toBeNull();
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(menu()).toBeNull();

    await act(async () => {
      trigger()!.click();
    });
    expect(menu()).not.toBeNull();
    await act(async () => {
      document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });
    expect(menu()).toBeNull();
  });
});
