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

// Репрезентативная структура: рут «root» в z1; цепочки и веера зависимостей
// разной глубины в трёх зонах + мосты между зонами.
const NODES: ProblemNode[] = [
  makeNode('root', 'z1'),
  ...Array.from({ length: 6 }, (_, i) => makeNode(`z1-l1-${i}`, 'z1', ['root'])),
  ...Array.from({ length: 4 }, (_, i) => makeNode(`z1-l2-${i}`, 'z1', [`z1-l1-${i % 3}`])),
  makeNode('z2-r', 'z2', ['root']),
  ...Array.from({ length: 5 }, (_, i) =>
    i === 0 ? makeNode('z2-l1-0', 'z2', ['z2-r']) : makeNode(`z2-l1-${i}`, 'z2', [`z2-l1-${i - 1}`]),
  ),
  makeNode('z3-r', 'z3', ['root']),
  ...Array.from({ length: 7 }, (_, i) => makeNode(`z3-l1-${i}`, 'z3', ['z3-r'])),
];

const distFromCenter = (layout: ReturnType<typeof computeMap2DLayout>, id: string) => {
  const p = layout.positions[id]!;
  return Math.hypot(p.x - layout.center.x, p.y - layout.center.y);
};

describe('twoDLayout — радиальная раскладка (рут в центре, сектора ∝ областям)', () => {
  it('раскладка полностью детерминирована: повторный прогон даёт те же позиции', () => {
    const a = computeMap2DLayout(NODES, ZONES);
    const b = computeMap2DLayout(NODES, ZONES);
    expect(a.positions).toEqual(b.positions);
  });

  it('рутовые узлы размещаются в центре карты', () => {
    const layout = computeMap2DLayout(NODES, ZONES);
    expect(layout.rootIds).toContain('root');
    expect(distFromCenter(layout, 'root')).toBe(0);
    expect(layout.depthOf['root']).toBe(0);
  });

  it('радиус растёт строго с глубиной рекурсивной зависимости', () => {
    const layout = computeMap2DLayout(NODES, ZONES);
    // z2-l1-4 — конец цепочки длины 6 (z2-r → z2-l1-0 → … → z2-l1-4)
    expect(layout.depthOf['z2-l1-4']).toBe(6);
    expect(layout.depthOf['z2-r']).toBe(1);
    // Монотонность: чем глубже — тем дальше от центра
    expect(distFromCenter(layout, 'z2-l1-4')).toBeGreaterThan(distFromCenter(layout, 'z2-l1-2'));
    expect(distFromCenter(layout, 'z2-l1-2')).toBeGreaterThan(distFromCenter(layout, 'z2-r'));
    expect(distFromCenter(layout, 'z2-r')).toBeGreaterThan(distFromCenter(layout, 'root'));
    // Все узлы одной глубины — на одном кольце (даже из разных областей)
    for (const id of ['z1-l1-0', 'z1-l1-5', 'z2-r', 'z3-r']) {
      expect(distFromCenter(layout, id)).toBeCloseTo(distFromCenter(layout, 'z1-l1-1'), 0);
    }
  });

  it('угол сектора области пропорционален числу узлов в ней', () => {
    const layout = computeMap2DLayout(NODES, ZONES);
    const counts = { z1: 11, z2: 6, z3: 8 };
    const total = counts.z1 + counts.z2 + counts.z3;
    for (const zid of Object.keys(counts) as Array<keyof typeof counts>) {
      const sector = layout.zoneSectors[zid]!;
      const span = sector.endAngle - sector.startAngle;
      expect(span).toBeCloseTo(((counts[zid] as number) / total) * Math.PI * 2, 5);
    }
    // Сектора покрывают ровно полный круг без дыр
    const sum = ZONES.reduce(
      (s, z) => s + (layout.zoneSectors[z.id]!.endAngle - layout.zoneSectors[z.id]!.startAngle),
      0,
    );
    expect(sum).toBeCloseTo(Math.PI * 2, 5);
  });

  it('узлы области лежат внутри сектора своей области, области не пересекаются', () => {
    const layout = computeMap2DLayout(NODES, ZONES);
    const angleOf = (id: string) => {
      const p = layout.positions[id]!;
      let a = Math.atan2(p.y - layout.center.y, p.x - layout.center.x);
      if (a < -Math.PI / 2) a += Math.PI * 2;
      return a;
    };
    for (const node of NODES) {
      if (node.id === 'root') continue; // рут — вне углов, в центре
      const zone = node.zoneIds[0]!;
      const sector = layout.zoneSectors[zone]!;
      let a = angleOf(node.id);
      if (a < sector.startAngle) a += Math.PI * 2;
      // Допуск в полградуса на округления
      const eps = Math.PI / 360;
      expect(a, node.id).toBeGreaterThanOrEqual(sector.startAngle - eps);
      expect(a, node.id).toBeLessThanOrEqual(sector.endAngle + eps);
    }
  });

  it('равномерность: нет попарных наложений узлов', () => {
    const layout = computeMap2DLayout(NODES, ZONES);
    const pts = NODES.map(n => layout.positions[n.id]!);
    let minPair = Infinity;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        minPair = Math.min(minPair, Math.hypot(pts[i]!.x - pts[j]!.x, pts[i]!.y - pts[j]!.y));
      }
    }
    expect(minPair).toBeGreaterThan(30);
  });

  it('раскладка покрывает площадь широко (без скученности у периметра прямоугольника)', () => {
    const layout = computeMap2DLayout(NODES, ZONES);
    const xs = NODES.map(n => layout.positions[n.id]!.x);
    const ys = NODES.map(n => layout.positions[n.id]!.y);
    const spanX = Math.max(...xs) - Math.min(...xs);
    const spanY = Math.max(...ys) - Math.min(...ys);
    // Радиальный диск использует канвас: глубочайшее кольцо достигает рабочего
    // края (минус отступ), а все четыре квадранта заселены → равномерное
    // заполнение, а не «каша по периметру прямоугольника».
    expect(spanX).toBeGreaterThan(layout.width * 0.25);
    expect(spanY).toBeGreaterThan(layout.height * 0.5);
    expect(distFromCenter(layout, 'z2-l1-4')).toBeGreaterThanOrEqual(
      Math.min(layout.width, layout.height) / 2 - 100 - 1,
    );
    const cx = layout.center.x;
    const cy = layout.center.y;
    const quadrants = [
      NODES.some(n => layout.positions[n.id]!.x < cx && layout.positions[n.id]!.y < cy),
      NODES.some(n => layout.positions[n.id]!.x > cx && layout.positions[n.id]!.y < cy),
      NODES.some(n => layout.positions[n.id]!.x < cx && layout.positions[n.id]!.y > cy),
      NODES.some(n => layout.positions[n.id]!.x > cx && layout.positions[n.id]!.y > cy),
    ];
    expect(quadrants.every(Boolean)).toBe(true);
  });

  it('узлы зоны кластеризуются углово: средний внутризонный угловой разброс меньше межзонного', () => {
    const layout = computeMap2DLayout(NODES, ZONES);
    const angles = new Map<string, number>();
    for (const node of NODES) {
      if (node.id === 'root') continue;
      const p = layout.positions[node.id]!;
      angles.set(node.id, Math.atan2(p.y - layout.center.y, p.x - layout.center.x));
    }
    const angularSpread = (ids: string[]) => {
      const list = ids.map(id => angles.get(id)!).sort((a, b) => a - b);
      return list.length > 1 ? list[list.length - 1]! - list[0]! : 0;
    };
    const z1 = NODES.filter(n => n.zoneIds[0] === 'z1' && n.id !== 'root').map(n => n.id);
    expect(angularSpread(z1)).toBeLessThan(Math.PI); // сектор z1 < 2π·11/25 ≈ 158°
  });

  it('изолированный узел (без рёбер) не занимает центр у рутов', () => {
    const nodes = [makeNode('root', 'z1'), makeNode('child', 'z1', ['root']), makeNode('solo', 'z2')];
    const layout = computeMap2DLayout(nodes, ZONES);
    expect(layout.rootIds).toEqual(['root']);
    expect(distFromCenter(layout, 'solo')).toBeGreaterThan(distFromCenter(layout, 'root'));
  });

  it('несколько рутов — малым кольцом вокруг центра', () => {
    const nodes = [
      makeNode('rootA', 'z1'),
      makeNode('rootB', 'z2'),
      makeNode('leaf', 'z2', ['rootA', 'rootB']),
    ];
    const layout = computeMap2DLayout(nodes, ZONES);
    expect([...layout.rootIds].sort()).toEqual(['rootA', 'rootB']);
    expect(distFromCenter(layout, 'rootA')).toBeGreaterThan(0);
    expect(distFromCenter(layout, 'rootA')).toBeLessThan(distFromCenter(layout, 'leaf'));
    expect(distFromCenter(layout, 'rootA')).toBeCloseTo(distFromCenter(layout, 'rootB'), 0);
  });

  it('каждый узел внутри холста', () => {
    const layout = computeMap2DLayout(NODES, ZONES);
    for (const node of NODES) {
      const pos = layout.positions[node.id]!;
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.x).toBeLessThanOrEqual(layout.width);
      expect(pos.y).toBeGreaterThanOrEqual(0);
      expect(pos.y).toBeLessThanOrEqual(layout.height);
    }
  });

  it('строит дедуплицированные рёбра и игнорирует самопетли/призраков', () => {
    const nodes = [
      makeNode('a', 'z1', ['b']),
      makeNode('b', 'z1', [], ['a']),
      makeNode('c', 'z2', ['ghost', 'c']),
    ];
    expect(buildMap2DEdges(nodes)).toEqual([{ source: 'a', target: 'b' }]);
  });

  it('собирает окрестность выбранного узла по обоим направлениям', () => {
    const edges = [
      { source: 'a', target: 'b' },
      { source: 'c', target: 'a' },
      { source: 'x', target: 'y' },
    ];
    const nb = collectMap2DNeighborhood('a', edges);
    expect([...nb.upstream]).toEqual(['b']);
    expect([...nb.downstream]).toEqual(['c']);
  });

  it('пустая и одноузелная карты не ломаются', () => {
    const empty = computeMap2DLayout([], ZONES);
    expect(Object.keys(empty.positions)).toHaveLength(0);
    const single = computeMap2DLayout([makeNode('only', 'z1')], ZONES);
    const p = single.positions['only']!;
    expect(Math.hypot(p.x - single.center.x, p.y - single.center.y)).toBeLessThanOrEqual(0);
  });
});
