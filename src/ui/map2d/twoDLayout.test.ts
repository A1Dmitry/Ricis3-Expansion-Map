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

// Дерево как на эталонном радиальном образце: рут в центре; цепочки и веера
// разной глубины по всему кругу; зоны присутствуют, но геометрией не владеют.
const NODES: ProblemNode[] = [
  makeNode('root', 'z1'),
  // Ветвь-цепочка (глубина 3)
  makeNode('A', 'z1', ['root']),
  makeNode('A1', 'z2', ['A']),
  makeNode('A2', 'z3', ['A1']),
  makeNode('A3', 'z1', ['A2']),
  // Ветвь-веер (корешок B: 6 детей, вторая волна — ещё 3)
  makeNode('B', 'z2', ['root']),
  ...Array.from({ length: 6 }, (_, i) => makeNode(`B${i}`, 'z2', ['B'])),
  ...Array.from({ length: 3 }, (_, i) => makeNode(`Bx${i}`, 'z3', [`B${i}`])),
  // Третья ветвь: двойная цепочка
  makeNode('C', 'z3', ['root']),
  makeNode('C1', 'z1', ['C']),
  makeNode('C2', 'z2', ['C1']),
  // Четвёртая ветвь-лист
  makeNode('D', 'z1', ['root']),
];

const distFromCenter = (layout: ReturnType<typeof computeMap2DLayout>, id: string) => {
  const p = layout.positions[id]!;
  return Math.hypot(p.x - layout.center.x, p.y - layout.center.y);
};

const angleOf = (layout: ReturnType<typeof computeMap2DLayout>, id: string) => {
  const p = layout.positions[id]!;
  return Math.atan2(p.y - layout.center.y, p.x - layout.center.x);
};

describe('twoDLayout — классическая радиальная раскладка (рут в центре, весь круг)', () => {
  it('раскладка полностью детерминирована: повторный прогон даёт те же позиции', () => {
    const a = computeMap2DLayout(NODES, ZONES);
    const b = computeMap2DLayout(NODES, ZONES);
    expect(a.positions).toEqual(b.positions);
  });

  it('рутовый узел — точно в центре карты', () => {
    const layout = computeMap2DLayout(NODES, ZONES);
    expect(layout.rootIds).toEqual(['root']);
    expect(distFromCenter(layout, 'root')).toBe(0);
    expect(layout.depthOf['root']).toBe(0);
  });

  it('глубже = дальше: узлы глубины d лежат строго внутри своей площадной зоны, зоны упорядочены', () => {
    const layout = computeMap2DLayout(NODES, ZONES);
    expect(layout.depthOf['A3']).toBe(4); // цепочка root→A→A1→A2→A3
    const eps = 1;
    for (const node of NODES) {
      const d = layout.depthOf[node.id]!;
      const r = distFromCenter(layout, node.id);
      expect(r, node.id).toBeGreaterThanOrEqual(layout.depthBandLo[d]! - eps);
      expect(r, node.id).toBeLessThanOrEqual(layout.depthBandHi[d]! + eps);
    }
    // Зоны упорядочены по глубине (границы неубывают)
    for (let d = 1; d < layout.depthBandLo.length; d++) {
      expect(layout.depthBandLo[d]!, `zone ${d}`).toBeGreaterThanOrEqual(layout.depthBandLo[d - 1]! - 1e-9);
    }
    // Глубокая цепочка дальше от центра, чем её звенья помельче
    expect(distFromCenter(layout, 'A3')).toBeGreaterThan(distFromCenter(layout, 'A1'));
  });

  it('угловой промежуток ветви ∝ весу её поддерева', () => {
    const layout = computeMap2DLayout(NODES, ZONES);
    // Веса ветвей root: B — 10 узлов, A — 4, C — 3, D — 1 (всего 18 + root).
    const span = (id: string) => layout.spanOf[id]!.endAngle - layout.spanOf[id]!.startAngle;
    expect(span('B')).toBeGreaterThan(span('A'));
    expect(span('A')).toBeGreaterThan(span('C'));
    expect(span('C')).toBeGreaterThan(span('D'));
  });

  it('промежутки детей рута без дыр покрывают весь круг', () => {
    const layout = computeMap2DLayout(NODES, ZONES);
    const children = ['A', 'B', 'C', 'D'];
    const total = children.reduce(
      (s, id) => s + (layout.spanOf[id]!.endAngle - layout.spanOf[id]!.startAngle),
      0,
    );
    expect(total).toBeCloseTo(Math.PI * 2, 5);
  });

  it('промежуток поддерева содержится в промежутке родителя', () => {
    const layout = computeMap2DLayout(NODES, ZONES);
    const eps = 1e-9;
    const inside = (child: string, parent: string) => {
      const c = layout.spanOf[child]!;
      const p = layout.spanOf[parent]!;
      expect(c.startAngle, child).toBeGreaterThanOrEqual(p.startAngle - eps);
      expect(c.endAngle, child).toBeLessThanOrEqual(p.endAngle + eps);
    };
    inside('A1', 'A');
    inside('A2', 'A1');
    inside('A3', 'A2');
    inside('B3', 'B');
    inside('Bx2', 'B2');
    inside('C1', 'C');
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

  it('круг заполнен широко: все четыре квадранта заселены, внешнее кольцо у рабочего края', () => {
    const layout = computeMap2DLayout(NODES, ZONES);
    const cx = layout.center.x;
    const cy = layout.center.y;
    const quadrants = [
      NODES.some(n => layout.positions[n.id]!.x < cx && layout.positions[n.id]!.y < cy),
      NODES.some(n => layout.positions[n.id]!.x > cx && layout.positions[n.id]!.y < cy),
      NODES.some(n => layout.positions[n.id]!.x < cx && layout.positions[n.id]!.y > cy),
      NODES.some(n => layout.positions[n.id]!.x > cx && layout.positions[n.id]!.y > cy),
    ];
    expect(quadrants.every(Boolean)).toBe(true);
    // Самая глубокая зона — у внешней границы контент-диска
    const deepest = NODES.find(n => layout.depthOf[n.id] === Math.max(...Object.values(layout.depthOf)))!;
    expect(distFromCenter(layout, deepest.id)).toBeGreaterThanOrEqual(
      layout.depthBandLo[layout.depthOf[deepest.id]!] - 1,
    );
  });

  it('изолированный узел (без рёбер) не занимает центр рута', () => {
    const nodes = [makeNode('root', 'z1'), makeNode('child', 'z1', ['root']), makeNode('solo', 'z2')];
    const layout = computeMap2DLayout(nodes, ZONES);
    expect(layout.rootIds).toEqual(['root']);
    expect(distFromCenter(layout, 'solo')).toBeGreaterThan(distFromCenter(layout, 'root'));
  });

  it('несколько рутов — малым кольцом вокруг центра, лес делит весь круг', () => {
    const nodes = [
      makeNode('rootA', 'z1'),
      makeNode('rootB', 'z2'),
      makeNode('leaf', 'z2', ['rootA', 'rootB']),
    ];
    const layout = computeMap2DLayout(nodes, ZONES);
    expect([...layout.rootIds].sort()).toEqual(['rootA', 'rootB']);
    expect(distFromCenter(layout, 'rootA')).toBeGreaterThan(0);
    expect(distFromCenter(layout, 'rootA')).toBeLessThan(distFromCenter(layout, 'leaf'));
    expect(distFromCenter(layout, 'rootB')).toBeLessThan(distFromCenter(layout, 'leaf'));
    // Якорные промежутки покрывают полный круг
    const anchorsTotal = ['rootA', 'rootB'].reduce(
      (s, id) => s + (layout.spanOf[id]!.endAngle - layout.spanOf[id]!.startAngle),
      0,
    );
    expect(anchorsTotal).toBeCloseTo(Math.PI * 2, 5);
  });

  it('цикл зависимостей не ломает раскладку', () => {
    const nodes = [
      makeNode('root', 'z1'),
      makeNode('x', 'z1', ['root', 'y']),
      makeNode('y', 'z2', ['x']),
    ];
    const layout = computeMap2DLayout(nodes, ZONES);
    expect(Object.keys(layout.positions).sort()).toEqual(['root', 'x', 'y']);
    expect(layout.positions['x']!.x).toBeGreaterThan(0);
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

  it('центроид зоны — среднее позиций её узлов', () => {
    const layout = computeMap2DLayout(NODES, ZONES);
    const z2Nodes = NODES.filter(n => n.zoneIds[0] === 'z2');
    const mean = z2Nodes.reduce(
      (s, n) => ({ x: s.x + layout.positions[n.id]!.x / z2Nodes.length, y: s.y + layout.positions[n.id]!.y / z2Nodes.length }),
      { x: 0, y: 0 },
    );
    expect(layout.zoneCentroids['z2']!.x).toBeCloseTo(mean.x, 0);
    expect(layout.zoneCentroids['z2']!.y).toBeCloseTo(mean.y, 0);
  });

  it('пустая и одноузелная карты не ломаются', () => {
    const empty = computeMap2DLayout([], ZONES);
    expect(Object.keys(empty.positions)).toHaveLength(0);
    const single = computeMap2DLayout([makeNode('only', 'z1')], ZONES);
    const p = single.positions['only']!;
    expect(Math.hypot(p.x - single.center.x, p.y - single.center.y)).toBeLessThanOrEqual(0);
  });
});

describe('collectMap2DClosure — транзитивная подсветка до корня и к узлу', () => {
  const CHAIN_EDGES = [
    { source: 'a', target: 'b' }, // a зависит от b
    { source: 'b', target: 'c' }, // b зависит от c (c — корень)
    { source: 'b', target: 'd' }, // и от d
    { source: 'x', target: 'a' }, // x зависит от a
  ];

  it('стрелки предпосылок идут ТРАНЗИТИВНО до самого корня', async () => {
    const { collectMap2DClosure } = await import('./twoDLayout');
    const closure = collectMap2DClosure('a', CHAIN_EDGES);
    expect([...closure.upstream].sort()).toEqual(['b', 'c', 'd']);
    expect([...closure.upstreamEdges].sort()).toEqual(['a|b', 'b|c', 'b|d']);
  });

  it('зависимые идут ТРАНЗИТИВНО к узлу (все опирающиеся)', async () => {
    const { collectMap2DClosure } = await import('./twoDLayout');
    const closure = collectMap2DClosure('c', CHAIN_EDGES);
    expect([...closure.downstream].sort()).toEqual(['a', 'b', 'x']);
    expect([...closure.downstreamEdges].sort()).toEqual(['a|b', 'b|c', 'x|a']);
  });

  it('цикл не зацикливает обход и не включает сам узел', async () => {
    const { collectMap2DClosure } = await import('./twoDLayout');
    const closure = collectMap2DClosure('p', [
      { source: 'p', target: 'q' },
      { source: 'q', target: 'p' },
    ]);
    expect([...closure.upstream]).toEqual(['q']);
    expect(closure.upstream.has('p')).toBe(false);
    expect(closure.downstream.has('p')).toBe(false);
  });

  it('прямая окрестность по-прежнему доступна и ограничена одним шагом', async () => {
    const { collectMap2DNeighborhood } = await import('./twoDLayout');
    const nb = collectMap2DNeighborhood('a', CHAIN_EDGES);
    expect([...nb.upstream]).toEqual(['b']);
    expect([...nb.downstream]).toEqual(['x']);
  });
});
