import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const editNodeModalSource = readFileSync(resolve(process.cwd(), 'src/ui/EditNodeModal.tsx'), 'utf8');
const nodeCardDetailsSource = readFileSync(resolve(process.cwd(), 'src/ui/NodeCardDetails.tsx'), 'utf8');
const mapSource = readFileSync(resolve(process.cwd(), 'src/ui/Map3D.tsx'), 'utf8');
const contextMenuSource = readFileSync(resolve(process.cwd(), 'src/ui/NodeContextMenu.tsx'), 'utf8');

describe('UI-РЕФАКТОРИНГ — кнопки выполнения в контекстном меню и паритет полей редактирования', () => {
  it('UIRF-01: карточка задачи использует контекстное меню вместо встроенных кнопок выполнения', () => {
    expect(nodeCardDetailsSource).toContain("import { NodeContextMenu } from './NodeContextMenu'");
    expect(nodeCardDetailsSource).toContain('<NodeContextMenu');
    // Бывшие секции кнопок выполнения больше не рендерятся в карточке.
    expect(nodeCardDetailsSource).not.toContain('Контекстное расширение и Калькулятор');
    expect(nodeCardDetailsSource).not.toContain('Исследовательские действия');
    expect(nodeCardDetailsSource).not.toContain('Launch Kinematic Constraint Engine</button>');
    // Действия доступности (share) сохранены и перенесены в пункты меню.
    expect(nodeCardDetailsSource).toContain('handleShareNode');
    expect(nodeCardDetailsSource).toContain("id: 'formula-calculator'");
    expect(nodeCardDetailsSource).toContain("id: 'external-calculator'");
    expect(nodeCardDetailsSource).toContain("id: 'kinematic-engine'");
    expect(nodeCardDetailsSource).toContain("id: 'explore'");
    expect(nodeCardDetailsSource).toContain("id: 'verify'");
    expect(nodeCardDetailsSource).toContain("id: 'challenge'");
    expect(nodeCardDetailsSource).toContain("id: 'roadmap'");
    expect(nodeCardDetailsSource).toContain("id: 'share'");
    expect(nodeCardDetailsSource).toContain("id: 'edit'");
  });

  it('UIRF-02: выполнение RICIS-решения вызывается через меню, отдельные кнопки в Map3D удалены', () => {
    expect(nodeCardDetailsSource).toContain('onSolve');
    expect(nodeCardDetailsSource).toContain("id: 'solve'");
    // Оба места подключения карточки передают параметры выполнения.
    const cardMounts = mapSource.split('<NodeCardDetails').length - 1;
    expect(cardMounts).toBe(2);
    expect((mapSource.match(/onSolve=\{\(\) => handleSolve/g) || []).length).toBe(2);
    // Отдельная кнопка выполнения под карточкой удалена из обоих представлений.
    expect(mapSource).not.toContain('Execute RICIS Solution');
    expect(mapSource).not.toContain('>Перерассчитать RICIS-решение<');
    expect(mapSource).not.toContain('>Запустить RICIS-решение<');
  });

  it('UIRF-03: NodeContextMenu закрывается по выбору, Escape и клику вне меню', () => {
    expect(contextMenuSource).toContain('aria-haspopup="menu"');
    expect(contextMenuSource).toContain("event.key === 'Escape'");
    expect(contextMenuSource).toContain("document.addEventListener('pointerdown', handlePointerDown)");
    expect(contextMenuSource).not.toMatch(/onClick=\{\(\)\s*=>\s*\{\}\}/);
  });

  it('UIRF-04: режим редактирования содержит те же поля, что и форма создания', () => {
    // Поля создания: название, целевая функция, описание, подсказка, сфера науки, ссылка.
    expect(editNodeModalSource).toContain('Название задачи / узла');
    expect(editNodeModalSource).toContain('Целевая функция (Target Function)');
    expect(editNodeModalSource).toContain('Описание / Инструкция Агенту при перерасчете');
    expect(editNodeModalSource).toContain('Подсказка о сингулярности (Singularity Hint)');
    // Возвращённые поля паритета:
    expect(editNodeModalSource).toContain('Сфера науки / Область знаний');
    expect(editNodeModalSource).toContain('Ссылка на первоисточник / DOI (опционально)');
    expect(editNodeModalSource).toContain("value=\"NEW_ZONE\"");
    expect(editNodeModalSource).toContain('Название новой сферы...');
    // Ссылка нормализуется по тем же правилам, что и при создании.
    expect(editNodeModalSource).toContain('/^https?:\\/\\//i.test(trimmedSourceUrl)');
  });

  it('UIRF-05: изменение сферы в редактировании проходит через assignNodeZone (store)', () => {
    expect(editNodeModalSource).toContain('assignNodeZone');
    const mapStoreSource = readFileSync(resolve(process.cwd(), 'src/store/mapStore.ts'), 'utf8');
    expect(mapStoreSource).toContain('assignNodeZone: (nodeId: string, zoneId?: string, newZoneName?: string) => Promise<void>');
    expect(mapStoreSource).toContain('applyNodeZoneAssignment');
  });
});
