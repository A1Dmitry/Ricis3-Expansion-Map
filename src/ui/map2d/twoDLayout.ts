// ============================================================================
// CLASSIC DETERMINISTIC RADIAL TREE LAYOUT (DDD / pure domain)
// Классическая радиальная древовидная раскладка (образец: yFiles RadialLayout /
// PLANET / d3-cluster в полярной форме) — ровно та геометрия, что используется
// в эталонных радиальных демо: РУТ в центре, дети на концентрических кольцах
// по глубине, угловой промежуток каждого поддерева пропорционален его весу и
// распределяется по ПОЛНОМУ кругу (без зональных секторов-«ломтиков»).
//  • Радиус = глубина рекурсивной зависимости (длиннейшая цепочка от рута):
//    чем глубже узел, тем дальше от центра; все узлы глубины d — на кольце d;
//  • углы: рекурсивное деление промежутка родителя ∝ весу поддерева
//    (anti-sliver сглаживание ≥35% равной доли) → равномерное заполнение
//    круга без скученности у периметра и без пустого внутреннего пространства;
//  • радиусы колец адаптивны под фактическую численность кольца (целевое
//    дуговое расстояние между соседями), холст зумируем и подгоняется под
//    внешнее кольцо (без квадратного ограничения);
//  • полностью детерминированно (без Math.random) — стабильно и тестируемо.
// ============================================================================

import type { ProblemNode, ScienceZone } from '../../model/types';

export interface Map2DPoint {
  readonly x: number;
  readonly y: number;
}

/** Ребро зависимости: source ЗАВИСИТ ОТ target (target — предпосылка). */
export interface Map2DEdge {
  readonly source: string;
  readonly target: string;
}

export interface Map2DNeighborhood {
  /** Предпосылки выбранного узла (куда ведут рёбра «зависит от»). */
  readonly upstream: ReadonlySet<string>;
  /** Узлы, зависящие от выбранного (откуда приходят рёбра). */
  readonly downstream: ReadonlySet<string>;
}

export interface Map2DLayout {
  readonly positions: Readonly<Record<string, Map2DPoint>>;
  readonly width: number;
  readonly height: number;
  /** Центр радиальной композиции (для колец глубины и корней). */
  readonly center: Map2DPoint;
  /** Глубина зависимости каждого узла (0 = рутовый, в центре). */
  readonly depthOf: Readonly<Record<string, number>>;
  /** Радиусы колец глубины: ringRadii[d] — радиус кольца глубины d. */
  readonly ringRadii: readonly number[];
  /** Угловой промежуток поддерева каждого узла [startAngle, endAngle). */
  readonly spanOf: Readonly<Record<string, { startAngle: number; endAngle: number }>>;
  /** Центроиды кластеров зон — по фактическим позициям узлов (для подписей). */
  readonly zoneCentroids: Readonly<Record<string, Map2DPoint>>;
  /** Идентификаторы рутовых узлов (размещены в центре). */
  readonly rootIds: readonly string[];
}

export interface Map2DLayoutOptions {
  readonly width?: number;
  readonly height?: number;
  readonly padding?: number;
}

const TWO_PI = Math.PI * 2;

/**
 * Построить дедуплицированный список рёбер из обеих проекций связности:
 * dependencyIds («зависит от») и dependentIds («от него зависят»).
 */
export function buildMap2DEdges(nodes: readonly ProblemNode[]): Map2DEdge[] {
  const known = new Set(nodes.map(n => n.id));
  const seen = new Set<string>();
  const edges: Map2DEdge[] = [];

  const push = (source: string, target: string) => {
    if (source === target || !known.has(source) || !known.has(target)) return;
    const key = `${source}|${target}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ source, target });
  };

  for (const node of nodes) {
    for (const depId of node.dependencyIds ?? []) {
      push(node.id, depId);
    }
    for (const dependentId of node.dependentIds ?? []) {
      push(dependentId, node.id);
    }
  }
  return edges;
}

/** Прямые соседи узла по обоим направлениям графа зависимостей. */
export function collectMap2DNeighborhood(nodeId: string, edges: readonly Map2DEdge[]): Map2DNeighborhood {
  const upstream = new Set<string>();
  const downstream = new Set<string>();
  for (const edge of edges) {
    if (edge.source === nodeId) upstream.add(edge.target);
    if (edge.target === nodeId) downstream.add(edge.source);
  }
  return { upstream, downstream };
}

interface RadialPlacement {
  angle: number;
  radius: number;
}

/**
 * Детерминированная радиальная раскладка (см. заголовок модуля).
 *
 * Этапы:
 *  1) руты = узлы без предпосылок (с потомками); они — в центре;
 *  2) глубина = длиннейшая цепочка зависимостей от рута (релаксация по DAG);
 *  3) виртуальное дерево: primary-parent = глубочайшая предпосылка;
 *  4) рекурсивное угловое деление полного круга ∝ весу поддерева;
 *  5) адаптивные радиусы колец под численность каждого кольца.
 */
export function computeMap2DLayout(
  nodes: readonly ProblemNode[],
  zones: readonly ScienceZone[],
  options: Map2DLayoutOptions = {},
): Map2DLayout {
  const padding = options.padding ?? 100;

  const emptyLayout: Map2DLayout = {
    positions: {},
    width: 600,
    height: 600,
    center: { x: 300, y: 300 },
    depthOf: {},
    ringRadii: [],
    spanOf: {},
    zoneCentroids: {},
    rootIds: [],
  };
  if (nodes.length === 0) return emptyLayout;

  const edges = buildMap2DEdges(nodes);
  const upstreamOf = new Map<string, Set<string>>();
  const downstreamOf = new Map<string, Set<string>>();
  for (const node of nodes) {
    upstreamOf.set(node.id, new Set());
    downstreamOf.set(node.id, new Set());
  }
  for (const edge of edges) {
    upstreamOf.get(edge.source)?.add(edge.target);
    downstreamOf.get(edge.target)?.add(edge.source);
  }

  const idOrder = new Map(nodes.map((n, i) => [n.id, i]));
  const byId = (a: string, b: string) => (idOrder.get(a) ?? 0) - (idOrder.get(b) ?? 0);

  // --- 1) Рутовые узлы: нет предпосылок, но есть зависимые -----------------
  const hasUpstream = (id: string) => (upstreamOf.get(id)?.size ?? 0) > 0;
  const hasDownstream = (id: string) => (downstreamOf.get(id)?.size ?? 0) > 0;

  let rootIds = nodes
    .filter(n => !hasUpstream(n.id) && hasDownstream(n.id))
    .map(n => n.id)
    .sort(byId);
  if (rootIds.length === 0) {
    // Граф без явного корня (цикл/изолированные узлы): центральным становится
    // узел с преобладающим числом зависимых (детерминированно по порядку).
    const central = [...nodes].sort((a, b) =>
      (downstreamOf.get(b.id)?.size ?? 0) - (downstreamOf.get(a.id)?.size ?? 0) || byId(a.id, b.id),
    )[0]!;
    rootIds = [central.id];
  }

  // --- 2) Глубина: длиннейшая цепочка зависимостей от рута ------------------
  const depthOf: Record<string, number> = {};
  for (const id of rootIds) depthOf[id] = 0;
  // Релаксация по рёбрам (конечна: глубина растёт монотонно; верхняя граница
  // итераций = число узлов — защита от теоретических циклов).
  for (let sweep = 0; sweep < nodes.length; sweep++) {
    let changed = false;
    for (const node of nodes) {
      if (node.id in depthOf) continue;
      const prereqs = upstreamOf.get(node.id) ?? new Set<string>();
      const prereqDepths = [...prereqs].filter(p => p in depthOf).map(p => depthOf[p]!);
      if (prereqs.size > 0 && prereqDepths.length === prereqs.size) {
        depthOf[node.id] = 1 + Math.max(...prereqDepths);
        changed = true;
      }
    }
    if (!changed) break;
  }
  // Изолированные/недостижимые (компоненты без рута): одно кольцо за максимумом
  const assignedMax = Math.max(0, ...Object.values(depthOf));
  for (const node of nodes) {
    if (!(node.id in depthOf)) {
      depthOf[node.id] = hasUpstream(node.id) ? assignedMax + 1 : 1;
    }
  }
  const maxDepth = Math.max(1, ...Object.values(depthOf));

  // --- 3) Primary-parent (глубочайшая предпосылка) --------------------------
  const primaryParent = new Map<string, string>();
  for (const node of nodes) {
    const prereqs = [...(upstreamOf.get(node.id) ?? [])];
    if (prereqs.length === 0) continue;
    prereqs.sort((a, b) => depthOf[b]! - depthOf[a]! || byId(a, b));
    primaryParent.set(node.id, prereqs[0]!);
  }

  // --- 4) Дерево и веса поддеревьев ----------------------------------------
  // При вырожденных циклах (A⇄B) primary-parent сам может зациклиться:
  // разрезаем такие связи — усечённый узел становится якорем своего кластера.
  const childrenOf = new Map<string, string[]>();
  const anchors: string[] = [];
  const rebuildForest = (): void => {
    for (const list of childrenOf.values()) list.length = 0;
    anchors.length = 0;
    for (const node of nodes) {
      const parent = primaryParent.get(node.id);
      if (parent && parent !== node.id) childrenOf.get(parent)!.push(node.id);
      else anchors.push(node.id);
    }
  };
  const reachFromAnchors = (): Set<string> => {
    const seen = new Set<string>();
    const stack = [...anchors];
    while (stack.length > 0) {
      const id = stack.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      for (const child of childrenOf.get(id) ?? []) stack.push(child);
    }
    return seen;
  };
  for (const node of nodes) childrenOf.set(node.id, []);
  rebuildForest();
  for (const node of nodes) {
    if (!reachFromAnchors().has(node.id)) {
      primaryParent.delete(node.id);
      rebuildForest();
    }
  }

  const weightOf = new Map<string, number>();
  const computeWeight = (id: string): number => {
    const cached = weightOf.get(id);
    if (cached !== undefined) return cached;
    weightOf.set(id, 1); // guarded against degenerate cycles
    let w = 1;
    for (const child of childrenOf.get(id) ?? []) w += computeWeight(child);
    weightOf.set(id, w);
    return w;
  };
  for (const node of nodes) computeWeight(node.id);
  for (const [, list] of childrenOf) {
    list.sort((a, b) => depthOf[a]! - depthOf[b]! || byId(a, b));
  }
  anchors.sort((a, b) => depthOf[a]! - depthOf[b]! || byId(a, b));

  // Деление промежутка родителя: доля ∝ весу, но каждому ребёнку ≥ 35% равной
  // доли с последующей ренормализацией (устраняет вырожденные «иглы»).
  const splitSpan = (ids: string[], a0: number, a1: number): Array<{ id: string; a0: number; a1: number }> => {
    if (ids.length === 0) return [];
    const totalSpan = a1 - a0;
    const k = ids.length;
    const minShare = (0.35 / k) * totalSpan;
    const weights = ids.map(id => weightOf.get(id) ?? 1);
    const totalWeight = weights.reduce((s, w) => s + w, 0);
    const shares = ids.map((_, i) => Math.max(minShare, totalSpan * (weights[i]! / totalWeight)));
    const sumShares = shares.reduce((s, v) => s + v, 0);
    let acc = a0;
    return ids.map((id, i) => {
      const share = (shares[i]! / sumShares) * totalSpan;
      const piece = { id, a0: acc, a1: acc + share };
      acc += share;
      return piece;
    });
  };

  // --- 5) Адаптивные радиусы колец ------------------------------------------
  // Радиус кольца d подбирается под численность кольца, чтобы дуговое
  // расстояние между соседями было не меньше целевого (равномерность), при
  // этом кольца строго разнесены радиально.
  const TARGET_ARC = 58; // целевое дуговое расстояние между узлами кольца
  const MIN_BAND = 70;   // минимальная разница радиусов соседних колец

  const depthCount: number[] = Array.from({ length: maxDepth + 1 }, () => 0);
  for (const node of nodes) depthCount[Math.min(depthOf[node.id]!, maxDepth)]! += 1;

  const rootRadius = anchors.length === 1 ? 0 : 70;
  const idealRadii: number[] = [rootRadius];
  for (let d = 1; d <= maxDepth; d++) {
    const required = (TARGET_ARC / TWO_PI) * (depthCount[d] ?? 0);
    idealRadii.push(Math.max(idealRadii[d - 1]! + MIN_BAND, required, idealRadii[d - 1]! + 1));
  }
  // Мягкий предел общего радиуса (пропорциональное сжатие сохраняет
  // равномерность: относительные расстояния неизменны, зум добирает детали).
  const outerIdeal = idealRadii[maxDepth]!;
  const softLimit = 1560; // ~4× штатного радиуса — пропорции сохраняются, зум догоняет детали
  const squeeze = outerIdeal <= 0 ? 1 : Math.min(1, softLimit / outerIdeal);
  const ringRadii = idealRadii.map(r => r * squeeze);

  // --- 6) Рекурсивное угловое размещение по ПОЛНОМУ кругу -------------------
  const placements = new Map<string, RadialPlacement>();
  const spanOf: Record<string, { startAngle: number; endAngle: number }> = {};

  const assignNode = (id: string, a0: number, a1: number, radius: number): void => {
    const angle = (a0 + a1) / 2;
    placements.set(id, { angle, radius });
    spanOf[id] = { startAngle: a0, endAngle: a1 };
    for (const piece of splitSpan(childrenOf.get(id) ?? [], a0, a1)) {
      assignNode(piece.id, piece.a0, piece.a1, ringRadii[Math.min(depthOf[piece.id]!, maxDepth)]!);
    }
  };

  const rootSet = new Set(rootIds);
  if (rootIds.length === 1) {
    // Единственный рут — точно в центре; круг делится ∝ весу между его
    // поддеревом и (если есть) изолированными кластерами-якорями.
    const root = rootIds[0]!;
    const satellites = anchors.filter(id => !rootSet.has(id));
    const topAnchors = [root, ...satellites];
    for (const piece of splitSpan(topAnchors, -Math.PI, Math.PI)) {
      const radius = piece.id === root ? 0 : ringRadii[Math.min(depthOf[piece.id]!, maxDepth)]!;
      assignNode(piece.id, piece.a0, piece.a1, radius);
    }
  } else {
    // Лес из нескольких корней: полный круг делится ∝ весу поддеревьев.
    for (const piece of splitSpan(anchors, -Math.PI, Math.PI)) {
      assignNode(piece.id, piece.a0, piece.a1, ringRadii[0]!);
    }
  }

  // --- Финализация в декартовы координаты -----------------------------------
  // Холст обнимает радиальный диск: сторона = диаметр внешнего кольца плюс
  // отступ (зумируемая область; глубокие цепочки получают больше места).
  const outerRadius = ringRadii[maxDepth]! + padding;
  const side = Math.max(600, Math.ceil(outerRadius * 2));
  const width = side;
  const height = side;
  const center: Map2DPoint = { x: width / 2, y: height / 2 };

  const positions: Record<string, Map2DPoint> = {};
  for (const [id, p] of placements) {
    positions[id] = {
      x: Math.round((center.x + p.radius * Math.cos(p.angle)) * 10) / 10,
      y: Math.round((center.y + p.radius * Math.sin(p.angle)) * 10) / 10,
    };
  }

  // Центроид кластера зоны = среднее арифметическое позиций её узлов
  // (зоны больше не владеют «ломтиками» круга — подпись ставится туда, где
  // узлы зоны фактически сгруппированы деревом).
  const zoneOrder: string[] = zones.map(z => z.id);
  const zoneSums = new Map<string, { x: number; y: number; n: number }>();
  for (const node of nodes) {
    const zid = node.zoneIds?.[0];
    if (!zid || !zoneOrder.includes(zid)) continue;
    const pos = positions[node.id];
    if (!pos) continue;
    const acc = zoneSums.get(zid) ?? { x: 0, y: 0, n: 0 };
    acc.x += pos.x; acc.y += pos.y; acc.n += 1;
    zoneSums.set(zid, acc);
  }
  const zoneCentroids: Record<string, Map2DPoint> = {};
  for (const [zid, acc] of zoneSums) {
    zoneCentroids[zid] = {
      x: Math.round((acc.x / acc.n) * 10) / 10,
      y: Math.round((acc.y / acc.n) * 10) / 10,
    };
  }

  return {
    positions,
    width,
    height,
    center,
    depthOf: { ...depthOf },
    ringRadii,
    spanOf,
    zoneCentroids,
    rootIds,
  };
}
