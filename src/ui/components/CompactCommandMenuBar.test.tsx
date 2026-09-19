import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { CompactCommandMenuBar } from './CompactCommandMenuBar';
import type { CommandContext } from '../../types/commandTypes';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let container: HTMLDivElement | undefined;

async function render(element: React.ReactNode): Promise<HTMLDivElement> {
  const renderedContainer = document.createElement('div');
  document.body.append(renderedContainer);
  const renderedRoot = createRoot(renderedContainer);
  root = renderedRoot;
  container = renderedContainer;

  await act(async () => {
    renderedRoot.render(element);
  });

  return renderedContainer;
}

afterEach(async () => {
  if (root) {
    await act(async () => root?.unmount());
  }
  container?.remove();
  root = undefined;
  container = undefined;
});

describe('CompactCommandMenuBar', () => {
  const mockContext: CommandContext = {
    activeApplet: 'map',
    is3DMode: true,
    isSimulationRunning: false,
    onSelectApplet: vi.fn(),
    onToggle3DMode: vi.fn(),
    onResetCamera: vi.fn(),
    onToggleSimulation: vi.fn(),
    onResetSimulation: vi.fn(),
    onStepSimulation: vi.fn(),
    onSearchNodes: vi.fn(),
    onRunProver: vi.fn(),
    onClearTerminal: vi.fn(),
    onRunDiagnostics: vi.fn(),
  };

  it('renders menu bar with brand title, build badge, and main top menu categories', async () => {
    const onSelectApplet = vi.fn();
    const rendered = await render(
      <CompactCommandMenuBar
        activeApplet="map"
        onSelectApplet={onSelectApplet}
        commandContext={mockContext}
        appBuildLabel="v7.7.4-seed-persistent"
      />
    );

    expect(rendered.textContent).toContain('RICIS-III');
    expect(rendered.textContent).toContain('v7.7.4-seed-persistent');
    expect(rendered.textContent).toContain('Файл');
    expect(rendered.textContent).toContain('Вид');
    expect(rendered.textContent).toContain('Кинематика');
    expect(rendered.textContent).toContain('Основания');
    expect(rendered.textContent).toContain('Сервис');
    expect(rendered.textContent).toContain('3D Граф');
  });

  it('opens kinematics dropdown and offers a new-tab deep link to the kinematic applet', async () => {
    const onSelectApplet = vi.fn();
    const rendered = await render(
      <CompactCommandMenuBar
        activeApplet="map"
        onSelectApplet={onSelectApplet}
        commandContext={mockContext}
      />
    );

    const kinematicsMenuBtn = Array.from(rendered.querySelectorAll('button')).find(
      btn => btn.textContent?.trim() === 'Кинематика'
    );
    expect(kinematicsMenuBtn).toBeDefined();

    await act(async () => {
      kinematicsMenuBtn?.click();
    });

    // New-tab policy (UI_NAVIGATION_AUDIT.md §7): тяжёлые спутниковые апплеты
    // открываются ссылкой в новой вкладке, рабочая область не переключается.
    const modelOption = Array.from(rendered.querySelectorAll('a')).find(
      a => a.textContent?.includes('3-Link Planar')
    );
    expect(modelOption).toBeDefined();
    expect(modelOption?.getAttribute('target')).toBe('_blank');
    expect(modelOption?.getAttribute('rel')).toContain('noopener');
    expect(modelOption?.getAttribute('href')).toContain('applet=kinematic');

    await act(async () => {
      modelOption?.click();
    });

    expect(onSelectApplet).not.toHaveBeenCalled();
  });

  it('keeps map navigation an in-place SPA button while satellites are new-tab links', async () => {
    const onSelectApplet = vi.fn();
    const rendered = await render(
      <CompactCommandMenuBar
        activeApplet="roadmap"
        onSelectApplet={onSelectApplet}
        commandContext={mockContext}
      />
    );

    const fileMenuBtn = Array.from(rendered.querySelectorAll('button')).find(
      btn => btn.textContent?.trim() === 'Файл'
    );
    expect(fileMenuBtn).toBeDefined();

    await act(async () => {
      fileMenuBtn?.click();
    });

    // «3D Граф» — домашняя поверхность: возврат остаётся in-place переключением
    const mapOption = Array.from(rendered.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('3D Граф Сингулярностей')
    );
    expect(mapOption).toBeDefined();

    // Спутники в том же меню — ссылки с маркером новой вкладки
    const roadmapLink = Array.from(rendered.querySelectorAll('a')).find(
      a => a.textContent?.includes('Дорожная карта (Roadmap)')
    );
    expect(roadmapLink).toBeDefined();
    expect(roadmapLink?.getAttribute('target')).toBe('_blank');
    expect(roadmapLink?.getAttribute('href')).toContain('applet=roadmap');

    await act(async () => {
      mapOption?.click();
    });
    expect(onSelectApplet).toHaveBeenCalledWith('map');
  });
  it('keeps text labels and shortcut columns visible in classic menus, but not toolbar buttons', async () => {
    const rendered = await render(<CompactCommandMenuBar activeApplet="map" onSelectApplet={vi.fn()} commandContext={mockContext} />);
    const file = rendered.querySelector<HTMLButtonElement>('.menubar-command')!;
    expect(file.textContent).toBe('Файл');
    expect(file.querySelector('.icon-button__label')).toBeNull();
    expect(file.classList.contains('icon-button')).toBe(false);
    await act(async () => file.click());
    const command = rendered.querySelector<HTMLButtonElement>('[role="menu"] .menu-command')!;
    expect(command.textContent).toContain('3D Граф Сингулярностей');
    expect(command.textContent).toContain('Alt+1');
    expect(command.querySelector('svg')).not.toBeNull();
    expect(command.querySelector('.icon-button__label')).toBeNull();
    expect(rendered.querySelector('[aria-label="Browser Back"]')?.classList.contains('icon-button')).toBe(true);
  });

  it('supports arrow navigation and returns focus to the menu heading on Escape', async () => {
    const rendered = await render(<CompactCommandMenuBar activeApplet="map" onSelectApplet={vi.fn()} commandContext={mockContext} />);
    const file = rendered.querySelector<HTMLButtonElement>('.menubar-command')!;
    await act(async () => {
      file.focus();
      file.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });
    const commands = rendered.querySelectorAll<HTMLElement>('[role="menu"] [role="menuitem"]:not(:disabled)');
    expect(document.activeElement).toBe(commands[0]);
    await act(async () => commands[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })));
    expect(document.activeElement).toBe(commands[1]);
    expect(commands[1].tagName).toBe('A');
    expect(commands[1].getAttribute('target')).toBe('_blank');
    await act(async () => commands[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(rendered.querySelector('[role="menu"]')).toBeNull();
    expect(document.activeElement).toBe(file);
  });

  it('switches open menus on pointer hover without requiring another click', async () => {
    const rendered = await render(<CompactCommandMenuBar activeApplet="map" onSelectApplet={vi.fn()} commandContext={mockContext} />);
    const headings = rendered.querySelectorAll<HTMLButtonElement>('.menubar-command');
    await act(async () => headings[0].click());
    await act(async () => headings[1].dispatchEvent(new MouseEvent('pointerover', { bubbles: true })));
    expect(headings[0].getAttribute('aria-expanded')).toBe('false');
    expect(headings[1].getAttribute('aria-expanded')).toBe('true');
    expect(rendered.querySelectorAll('[role="menu"]')).toHaveLength(1);
  });

});
