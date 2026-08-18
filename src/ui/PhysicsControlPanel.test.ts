import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { PhysicsControlFields, PhysicsControlPanel } from './PhysicsControlPanel';
import { DEFAULT_PHYSICS_PARAMS } from '../model/physics';

describe('PhysicsControlPanel Layout and Accordion Structure', () => {
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
    expect(html).toContain('Параметры симуляции');
  });

  it('должен содержать единое переиспользуемое содержимое для SettingsModal', () => {
    const html = renderToString(
      React.createElement(PhysicsControlFields, {
        params: DEFAULT_PHYSICS_PARAMS,
        onChange: () => {},
      })
    );

    expect(html).toContain('Настройки точной физики');
    expect(html).toContain('Макро-пузыри (Зоны)');
    expect(html).toContain('Микро-узлы (Задачи)');
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
    expect(html).toContain('Отталкивание масс (G)');
    expect(html).toContain('Жесткость пружин (k)');
  });
});
