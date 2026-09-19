import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { PhysicsControlFields, PhysicsControlPanel } from './PhysicsControlPanel';
import { DEFAULT_PHYSICS_PARAMS } from '../model/physics';
import { DICTIONARY } from '../model/i18n.types';
import { useI18nStore } from '../store/useI18nStore';

function expectLocalized(html: string, ru: string, en: string): void {
  expect(html.includes(ru) || html.includes(en)).toBe(true);
}

describe('PhysicsControlPanel Layout and Accordion Structure', () => {
  beforeEach(() => {
    useI18nStore.setState({ locale: 'ru' });
  });

  it('не должен содержать вложенных классов ограничения высоты и скроллинга (max-h-80, overflow-y-auto)', () => {
    const html = renderToString(
      React.createElement(PhysicsControlPanel, {
        params: DEFAULT_PHYSICS_PARAMS,
        onChange: () => {},
        isOpen: true,
      })
    );

    // Проверяем, что внутренний контейнер аккордеона существует
    expect(html).toContain('accordion-inner');

    // Проверяем, что искусственный скроллер удален
    expect(html).not.toContain('max-h-80');
    expect(html).not.toContain('overflow-y-auto');
  });

  it('должен содержать чекбокс-триггер аккордеона и заголовок', () => {
    const html = renderToString(
      React.createElement(PhysicsControlPanel, {
        params: DEFAULT_PHYSICS_PARAMS,
        onChange: () => {},
      })
    );

    expect(html).toContain('id="accordion-physics"');
    expect(html).toContain('type="checkbox"');
    expectLocalized(html, DICTIONARY['physics.title'].ru, DICTIONARY['physics.title'].en);
  });

  it('должен содержать единое переиспользуемое содержимое для SettingsModal', () => {
    const html = renderToString(
      React.createElement(PhysicsControlFields, {
        params: DEFAULT_PHYSICS_PARAMS,
        onChange: () => {},
      })
    );

    expectLocalized(html, 'Настройки точной физики', 'Precision Physics Settings');
    expectLocalized(html, 'Макро-пузыри (Зоны)', 'Macro Bubbles (Zones)');
    expectLocalized(html, 'Микро-узлы (Задачи)', 'Micro Nodes (Problems)');
  });

  it('должен содержать группы параметров зон и узлов без внутренних скроллеров', () => {
    const html = renderToString(
      React.createElement(PhysicsControlPanel, {
        params: DEFAULT_PHYSICS_PARAMS,
        onChange: () => {},
      })
    );

    expect(html).toContain('Макро-пузыри (Зоны)');
    expect(html).toContain('Микро-узлы (Задачи)');
    expect(html).not.toContain('overflow-y-auto');
  });
});
