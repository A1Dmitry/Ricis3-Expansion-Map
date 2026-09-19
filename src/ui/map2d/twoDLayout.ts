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
  /** Строго возрастающие границы площадно-пропорциональных зон глубины. */
  readonly ringRadii: readonly number[];
  /** Радиальная зона глубины d: узел глубины d лежит в [depthBandLo[d], depthBandHi[d]). */
  readonly depthBandLo: readonly number[];
  readonly depthBandHi: readonly number[];
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

export interface Map2DClosure extends Map2DNeighborhood {
  /** Рёбра путей предпосылок (selected → … → корень), ключ 'source|target'. */
  readonly upstreamEdges: ReadonlySet<string>;
  /** Рёбра путей зависимых (… → selected), ключ 'source|target'. */
  readonly downstreamEdges: ReadonlySet<string>;
}

/**
 * ТРАНЗИТИВНАЯ окрестность: все предпосылки по цепочке до корня и все
 * зависимые по цепочке (стрелки идут до самого корня, а зависимые — к узлу).
 * Детерминированный обход в глубину, устойчив к циклам (visited-наборы).
 */
export function collectMap2DClosure(nodeId: string, edges: readonly Map2DEdge[]): Map2DClosure {
  const edgeKey = (source: string, target: string) => `${source}|${target}`;
  const walk = (
    follow: (edge: Map2DEdge, cur: string) => string | null,
  ): { nodes: Set<string>; edgeKeys: Set<string> } => {
    const nodes = new Set<string>();
    const edgeKeys = new Set<string>();
    const stack = [nodeId];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      for (const edge of edges) {
        const next = follow(edge, cur);
        if (next === null) continue;
        edgeKeys.add(edgeKey(edge.source, edge.target));
        if (!nodes.has(next) && next !== nodeId) {
          nodes.add(next);
          stack.push(next);
        }
      }
    }
    return { nodes, edgeKeys };
  };

  // Предпосылки: от узла по направлению «зависит от» (source → target) — вверх,
  // пока стрелка не дойдёт до корня.
  const up = walk((edge, cur) => (edge.source === cur ? edge.target : null));
  // Зависимые: к узлу от всех опирающихся на него (target ← source) — вниз.
  const down = walk((edge, cur) => (edge.target === cur ? edge.source : null));
  up.nodes.delete(nodeId);
  down.nodes.delete(nodeId);
  return {
    upstream: up.nodes,
    downstream: down.nodes,
    upstreamEdges: up.edgeKeys,
    downstreamEdges: down.edgeKeys,
  };
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
    depthBandLo: [],
    depthBandHi: [],
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

  // --- 5) Площадно-пропорциональные глубинные зоны ---------------------------
  // Жёсткие «кольца» при перекосе численности по глубинам дают пустой центр
  // и бусы по одному радиусу (см. фидбэк). Вместо этого подряд идущие
  // КОЛЬЦЕВЫЕ ЗОНЫ глубины: площадь зоны ∝ суммарному числу её узлов, порядок
  // «глубже → дальше» жёсткий, внутри зоны каждый узел занимает одинаковую
  // ПЛОЩАДЬ. «Лезвия» (зоны с 1–2 узлами) сливаются с соседями, пока радиаль-
  // ная ширина зоны не станет ≥ SLOT — иначе у узла нет места разойтись.
  const SLOT = 54;                    // целевой линейный шаг между соседями
  const AREA_PER_NODE = 1.6 * SLOT * SLOT;

  const depthCount: number[] = Array.from({ length: maxDepth + 1 }, () => 0);
  for (const node of nodes) depthCount[Math.min(depthOf[node.id]!, maxDepth)]! += 1;

  const singleRoot = rootIds.length === 1;
  // Кумулятивные границы по площади
  const edgeR: number[] = [0];
  for (let d = 0; d <= maxDepth; d++) {
    const prev = edgeR[d]!;
    const area = singleRoot && d === 0 ? 0 : (depthCount[d] ?? 0) * AREA_PER_NODE;
    edgeR.push(Math.sqrt(prev * prev + area / Math.PI));
  }
  const outerIdeal = edgeR[maxDepth + 1]!;
  const squeeze = outerIdeal <= 1550 ? 1 : 1550 / outerIdeal;
  for (let i = 0; i < edgeR.length; i++) edgeR[i] = edgeR[i]! * squeeze;

  // Слияние «лезвий»: зона поглощает следующие глубины, пока её радиальная
  // ширина не достигнет минимальной.
  const MIN_W = 0.95 * SLOT * squeeze;
  const depthBandLo: number[] = []; // lo-граница зоны глубины d
  const depthBandHi: number[] = []; // hi-граница зоны глубины d
  const zoneEdges: number[] = [];   // строго возрастающие границы зон
  let gStart = 0;
  for (let d = 0; d <= maxDepth; d++) {
    const isLast = d === maxDepth;
    const width = edgeR[d + 1]! - edgeR[gStart]!;
    if (width >= MIN_W || isLast) {
      for (let k = gStart; k <= d; k++) {
        depthBandLo[k] = edgeR[gStart]!;
        depthBandHi[k] = edgeR[d + 1]!;
      }
      if (zoneEdges.length === 0) zoneEdges.push(edgeR[gStart]!);
      zoneEdges.push(edgeR[d + 1]!);
      gStart = d + 1;
    }
  }
  const ringRadii = zoneEdges;

  // --- 6) Углы: рекурсивное деление полного круга ∝ весу поддерева ----------
  const spanOf: Record<string, { startAngle: number; endAngle: number }> = {};
  // Промежуток ВЕРХНЕГО предка (ветвь первого уровня) — именно он служит
  // границами свободы узла при финальной репульсивной доводке: мелкие
  // поддеревья-близнецы имеют слишком узкие промежутки, чтобы в них разойтись.
  const topSpanOf: Record<string, { startAngle: number; endAngle: number }> = {};
  const assignAngles = (id: string, a0: number, a1: number, topA0?: number, topA1?: number): void => {
    spanOf[id] = { startAngle: a0, endAngle: a1 };
    const t0 = topA0 ?? a0;
    const t1 = topA1 ?? a1;
    topSpanOf[id] = { startAngle: t0, endAngle: t1 };
    for (const piece of splitSpan(childrenOf.get(id) ?? [], a0, a1)) {
      assignAngles(piece.id, piece.a0, piece.a1, t0, t1);
    }
  };

  const rootSet = new Set(rootIds);
  if (singleRoot) {
    // Единственный рут — якорь центра; круг делится ∝ весу между его
    // поддеревом и (если есть) изолированными кластерами-спутниками.
    const root = rootIds[0]!;
    const satellites = anchors.filter(id => !rootSet.has(id));
    for (const piece of splitSpan([root, ...satellites], -Math.PI, Math.PI)) {
      // Корень центра не пленяет ветви: их верхний промежуток = своя доля
      // (у splitSpan выше уже выдана); для детей корня topSpan — их доля.
      assignAngles(piece.id, piece.a0, piece.a1, piece.a0, piece.a1);
    }
  } else {
    // Лес из нескольких корней: полный круг делится ∝ весу поддеревьев.
    for (const piece of splitSpan(anchors, -Math.PI, Math.PI)) {
      assignAngles(piece.id, piece.a0, piece.a1, piece.a0, piece.a1);
    }
  }

  // --- 7) Радиусы: равномерная ПЛОЩАДЬ внутри зоны глубины -----------------
  // Узлы глубины d (в порядке обхода по углу) получают площадно-равномерные
  // радиальные слоты своей зоны: радиус растёт корнем квадратным от индекса —
  // каждому узлу достаётся одинаковая площадь на любом радиусе (равномерное
  // заполнение диска вместо «бус» на кольце).
  const midAngleOf = (id: string): number => {
    const s = spanOf[id]!;
    return (s.startAngle + s.endAngle) / 2;
  };
  const byDepth = new Map<number, string[]>();
  for (const node of nodes) {
    const d = Math.min(depthOf[node.id]!, maxDepth);
    const list = byDepth.get(d) ?? [];
    list.push(node.id);
    byDepth.set(d, list);
  }
  const placements = new Map<string, RadialPlacement>();
  for (const [d, ids] of byDepth) {
    ids.sort((a, b) => midAngleOf(a) - midAngleOf(b) || byId(a, b));
    // Слоты — внутри средних 50% зоны: 25%-ские радиальные маржи по краям
    // гарантируют стыкам соседних глубин разнос ≥ ~0.5·SLOT (цепочки A→B не
    // слипаются на границе зон).
    const r0z = depthBandLo[d]!;
    const r1z = depthBandHi[d]!;
    const wq = (r1z - r0z) * 0.25;
    const r0 = r0z + wq;
    const r1 = r1z - wq;
    const n = ids.length;
    ids.forEach((id, j) => {
      const radius = Math.sqrt(r0 * r0 + ((j + 0.5) / n) * (r1 * r1 - r0 * r0));
      placements.set(id, { angle: midAngleOf(id), radius });
    });
  }
  // Единственный рут — точно в центре (его точечная зона площади не занимала).
  if (singleRoot) placements.set(rootIds[0]!, { angle: midAngleOf(rootIds[0]!), radius: 0 });

  // --- 8) Детерминированная репульсивная доводка (как в 3D: seed + отталки-
  // вание) -------------------------------------------------------------
  // Спиральная разводка равномерна «в среднем», но углово-соседние узлы на
  // больших радиусах могут получить соседние слоты → расстояние затухает.
  // Repulsion-итерации (spatial grid) с зажимами: радиус — внутри зоны
  // глубины, угол — внутри промежутка поддерева (±10% ширины по краям).
  // Цель: min-расстояние ≈ SLOT при сохранении структуры; детерминированно.
  const idsSorted = [...placements.keys()].sort();
  const minDist = SLOT * squeeze;
  const xy = new Map<string, { x: number; y: number }>();
  const toXY = (p: RadialPlacement) => ({ x: p.radius * Math.cos(p.angle), y: p.radius * Math.sin(p.angle) });
  const toPolar = (p: { x: number; y: number }): RadialPlacement => ({
    angle: Math.atan2(p.y, p.x),
    radius: Math.hypot(p.x, p.y),
  });
  for (const id of idsSorted) xy.set(id, toXY(placements.get(id)!));

  const cell = minDist;
  for (let iter = 0; iter < 150; iter++) {
    const grid = new Map<string, string[]>();
    for (const id of idsSorted) {
      const p = xy.get(id)!;
      const key = `${Math.floor(p.x / cell)},${Math.floor(p.y / cell)}`;
      (grid.get(key) ?? grid.set(key, []).get(key)!).push(id);
    }
    let maxMove = 0;
    for (const id of idsSorted) {
      const p = xy.get(id)!;
      const cx = Math.floor(p.x / cell);
      const cy = Math.floor(p.y / cell);
      let fx = 0;
      let fy = 0;
      for (let gx = cx - 1; gx <= cx + 1; gx++) {
        for (let gy = cy - 1; gy <= cy + 1; gy++) {
          for (const other of grid.get(`${gx},${gy}`) ?? []) {
            if (other === id) continue;
            let dx = p.x - xy.get(other)!.x;
            let dy = p.y - xy.get(other)!.y;
            let dist = Math.hypot(dx, dy);
            if (dist >= minDist) continue;
            if (dist < 1e-6) {
              // Полное совпадение: детерминированное направление разноса.
              const h = 2.399963 * (idsSorted.indexOf(id) + 1);
              dx = Math.cos(h); dy = Math.sin(h); dist = 1;
            }
            const push = (minDist - dist) / dist;
            fx += dx * push * 0.5;
            fy += dy * push * 0.5;
          }
        }
      }
      if (fx !== 0 || fy !== 0) {
        maxMove = Math.max(maxMove, Math.hypot(fx, fy));
        xy.set(id, { x: p.x + fx, y: p.y + fy });
        // Зажим: радиус — в зоне глубины, угол — в промежуток ВЕРХНЕЙ ветви
        // (ветви первого уровня не пересекаются, мелкие близнецы свободны).
        const d = Math.min(depthOf[id]!, maxDepth);
        const s = topSpanOf[id]!;
        const w = s.endAngle - s.startAngle;
        const polar = toPolar(xy.get(id)!);
        const zoneW = depthBandHi[d]! - depthBandLo[d]!;
        const rMin = Math.max(0, depthBandLo[d]! + 0.25 * zoneW);
        const rMax = Math.max(rMin, depthBandHi[d]! - 0.25 * zoneW);
        polar.radius = Math.min(rMax, Math.max(rMin, polar.radius));
        const aMin = s.startAngle - 0.10 * w;
        const aMax = s.endAngle + 0.10 * w;
        const ang = Math.min(aMax, Math.max(aMin, polar.angle));
        polar.angle = ang;
        xy.set(id, toXY(polar));
      }
    }
    if (maxMove < 0.25) break;
  }
  // Обратно в полярные координаты
  placements.clear();
  for (const id of idsSorted) placements.set(id, toPolar(xy.get(id)!));
  if (singleRoot) placements.set(rootIds[0]!, { angle: midAngleOf(rootIds[0]!), radius: 0 });

  // --- Финализация в декартовы координаты -----------------------------------
  // Холст обнимает радиальный диск: сторона = диаметр внешнего кольца плюс
  // отступ (зумируемая область; глубокие цепочки получают больше места).
  const outerRadius = depthBandHi[maxDepth]! + padding;
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
    depthBandLo,
    depthBandHi,
    spanOf,
    zoneCentroids,
    rootIds,
  };
}
