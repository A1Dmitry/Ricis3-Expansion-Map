import { describe, expect, it } from 'vitest';
import { applyNodeZoneAssignment, ZoneAssignableMap } from './zoneAssignment.domain';
import { ProblemNode, ScienceZone } from '../../model/types';

const node = (id: string, zoneIds: string[]): ProblemNode => ({
  id,
  title: `Задача ${id}`,
  description: '',
  state: 'unresolved',
  type: 'scientific_task',
  targetFunction: '0/0',
  zoneIds,
  dependencyIds: [],
  dependentIds: [],
  fractalDepth: 1,
  economic: { costUnresolved: 1, costToSolve: 1, marketGain: 1, riskLoss: 1 },
});

const zone = (id: string, name: string, nodeIds: string[]): ScienceZone => ({
  id,
  name,
  description: '',
  nodeIds,
  economicProfile: { costUnresolved: 1, costToSolve: 1, marketGain: 1, riskLoss: 1 },
});

const baseMap: ZoneAssignableMap = {
  nodes: [node('node-a', ['zone-math']), node('node-b', ['zone-physics'])],
  zones: [
    zone('zone-math', 'Математика', ['node-a']),
    zone('zone-physics', 'Физика', ['node-b']),
  ],
};

describe('zoneAssignment.domain — редактирование сферы задачи (паритет с созданием)', () => {
  it('переназначает существующую сферу и переносит nodeIds между сферами', () => {
    const result = applyNodeZoneAssignment(baseMap, 'node-a', 'zone-physics');
    expect(result).not.toBeNull();
    expect(result!.resolvedZoneId).toBe('zone-physics');
    expect(result!.createdZone).toBe(false);

    const moved = result!.nodes.find(n => n.id === 'node-a');
    expect(moved!.zoneIds).toEqual(['zone-physics']);

    const math = result!.zones.find(z => z.id === 'zone-math');
    const physics = result!.zones.find(z => z.id === 'zone-physics');
    expect(math!.nodeIds).not.toContain('node-a');
    expect(physics!.nodeIds).toContain('node-a');
    expect(physics!.nodeIds).toContain('node-b');
  });

  it('создаёт новую сферу по имени, когда zoneId не передан', () => {
    const result = applyNodeZoneAssignment(
      baseMap,
      'node-b',
      undefined,
      'Биология',
      () => 'zone-new',
    );
    expect(result).not.toBeNull();
    expect(result!.createdZone).toBe(true);
    expect(result!.resolvedZoneId).toBe('zone-new');
    expect(result!.zones.find(z => z.id === 'zone-new')!.name).toBe('Биология');
    expect(result!.zones.find(z => z.id === 'zone-new')!.nodeIds).toEqual(['node-b']);
    expect(result!.zones.find(z => z.id === 'zone-physics')!.nodeIds).not.toContain('node-b');
  });

  it('переиспользует существующую сферу при совпадении имени без учёта регистра', () => {
    const result = applyNodeZoneAssignment(
      baseMap,
      'node-a',
      undefined,
      'физика',
      () => 'zone-new',
    );
    expect(result).not.toBeNull();
    expect(result!.createdZone).toBe(false);
    expect(result!.resolvedZoneId).toBe('zone-physics');
    expect(result!.zones.some(z => z.id === 'zone-new')).toBe(false);
  });

  it('возвращает null для неизвестного узла или неизвестной сферы', () => {
    expect(applyNodeZoneAssignment(baseMap, 'node-unknown', 'zone-physics')).toBeNull();
    expect(applyNodeZoneAssignment(baseMap, 'node-a', 'zone-missing')).toBeNull();
    expect(applyNodeZoneAssignment(baseMap, 'node-a')).toBeNull();
  });

  it('остаётся идемпотентной при повторном назначении той же сферы', () => {
    const result = applyNodeZoneAssignment(baseMap, 'node-a', 'zone-math');
    expect(result).not.toBeNull();
    expect(result!.zones.find(z => z.id === 'zone-math')!.nodeIds).toEqual(['node-a']);
    expect(result!.createdZone).toBe(false);
  });
});
