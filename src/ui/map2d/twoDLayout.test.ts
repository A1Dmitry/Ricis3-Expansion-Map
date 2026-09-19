import { describe, expect, it } from 'vitest';
import type { ProblemNode, ScienceZone } from '../../model/types';
import {
  buildMap2DEdges,
  collectMap2DNeighborhood,
  computeMap2DLayout,
} from './twoDLayout';

const makeEcon = () => ({ costUnresolved: 1, costToSolve: 1, marketGain: 1, riskLoss: 1 });

const makeNode = (id: string, zone: string, dependencyIds: string[] = [], dependentIds: string[] = []): ProblemNode => ({
  id,
  title: `Узел ${id}`,
  description: '',
  state: 'unresolved',
  type: 'scientific_task',
  targetFunction: '0/0',
  zoneIds: [zone],
  dependencyIds,
  dependentIds,
  fractalDepth: 0,
  economic: makeEcon(),
});

const makeZone = (id: string, name: string): ScienceZone => ({
  id,
  name,
  description: '',
  nodeIds: [],
  economicProfile: makeEcon(),
});

const ZONES = [makeZone('z1', 'Математика'), makeZone('z2', 'Физика'), makeZone('z3', 'Экономика')];

// Репрезентативный набор: 3 зоны по 8 узлов + связи между кластерами
const NODES: ProblemNode[] = [];
for (const [zoneIdx, zone] of ZONES.entries()) {
  for (let i = 0; i < 8; i++) {
    const id = `${zone.id}-n${i}`;
    const deps: string[] = [];
    if (i > 0) deps.push(`${zone.id}-n${i - 1}`); // цепочка внутри зоны
    if (zoneIdx > 0 && i === 0) deps.push(`${ZONES[zoneIdx - 1]!.id}-n7`); // мост между зонами
    NODES.push(makeNode(id, zone.id, deps));
  }
}

describe('twoDLayout — детерминированная раскладка 2D-карты', () => {
  it('раскладка полностью детерминирована: повторный прогон даёт те же позиции', () => {
    const a = computeMap2DLayout(NODES, ZONES);
    const b = computeMap2DLayout(NODES, ZONES);
    expect(a.positions).toEqual(b.positions);
  });

  it('размещает каждый узел внутри холста с полями', () => {
    const layout = computeMap2DLayout(NODES, ZONES);
    for (const node of NODES) {
      const pos = layout.positions[node.id];
      expect(pos, node.id).toBeDefined();
      expect(pos!.x).toBeGreaterThanOrEqual(0);
      expect(pos!.x).toBeLessThanOrEqual(layout.width);
      expect(pos!.y).toBeGreaterThanOrEqual(0);
      expect(pos!.y).toBeLessThanOrEqual(layout.height);
    }
  });

  it('равномерно распределяет узлы: нет попарных наложений', () => {
    const layout = computeMap2DLayout(NODES, ZONES);
    const pts = NODES.map(n => layout.positions[n.id]!);
    let minPair = Infinity;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i]!.x - pts[j]!.x;
        const dy = pts[i]!.y - pts[j]!.y;
        minPair = Math.min(minPair, Math.hypot(dx, dy));
      }
    }
    // Все узлы разнесены минимум на 45 единиц viewBox (метки/кружки не слипаются)
    expect(minPair).toBeGreaterThan(45);
  });

  it('раскладка покрывает значимую долю площади отображения', () => {
    const layout = computeMap2DLayout(NODES, ZONES);
    const xs = NODES.map(n => layout.positions[n.id]!.x);
    const ys = NODES.map(n => layout.positions[n.id]!.y);
    const spanX = Math.max(...xs) - Math.min(...xs);
    const spanY = Math.max(...ys) - Math.min(...ys);
    expect(spanX).toBeGreaterThan(layout.width * 0.45);
    expect(spanY).toBeGreaterThan(layout.height * 0.35);
  });

  it('узлы одной зоны кластеризуются: средняя внутризонная дистанция меньше межзонной', () => {
    const layout = computeMap2DLayout(NODES, ZONES);
    const pos = (id: string) => layout.positions[id]!;
    const avgDist = (idsA: string[], idsB: string[]) => {
      let sum = 0;
      let count = 0;
      for (const a of idsA) {
        for (const b of idsB) {
          if (a === b) continue;
          sum += Math.hypot(pos(a).x - pos(b).x, pos(a).y - pos(b).y);
          count += 1;
        }
      }
      return sum / Math.max(1, count);
    };
    const z1 = NODES.filter(n => n.zoneIds[0] === 'z1').map(n => n.id);
    const z2 = NODES.filter(n => n.zoneIds[0] === 'z2').map(n => n.id);
    expect(avgDist(z1, z1)).toBeLessThan(avgDist(z1, z2));
  });

  it('строит дедуплицированные рёбра из dependencyIds и dependentIds', () => {
    const nodes = [
      makeNode('a', 'z1', ['b']),
      makeNode('b', 'z1', [], ['a']), // зеркальная запись той же связи
      makeNode('c', 'z2'),
    ];
    const edges = buildMap2DEdges(nodes);
    expect(edges).toEqual([{ source: 'a', target: 'b' }]);
  });

  it('игнорирует рёбра на несуществующие узлы и самопетли', () => {
    const nodes = [makeNode('a', 'z1', ['ghost', 'a'])];
    expect(buildMap2DEdges(nodes)).toEqual([]);
  });

  it('собирает окрестность выбранного узла по обоим направлениям', () => {
    const edges = [
      { source: 'a', target: 'b' }, // a зависит от b
      { source: 'c', target: 'a' }, // c зависит от a
      { source: 'x', target: 'y' }, // постороннее
    ];
    const nb = collectMap2DNeighborhood('a', edges);
    expect([...nb.upstream].sort()).toEqual(['b']);
    expect([...nb.downstream].sort()).toEqual(['c']);
    expect(nb.upstream.has('x')).toBe(false);
    expect(nb.downstream.has('y')).toBe(false);
  });

  it('пустая карта даёт пустую раскладку без ошибок', () => {
    const layout = computeMap2DLayout([], ZONES);
    expect(Object.keys(layout.positions)).toHaveLength(0);
  });
});
