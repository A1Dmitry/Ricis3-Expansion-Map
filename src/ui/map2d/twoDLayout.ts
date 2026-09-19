// ============================================================================
// DETERMINISTIC RADIAL TREE LAYOUT (DDD / pure domain)
// Радиальная раскладка по эталону yFiles RadialLayout / PLANET / d3-cluster:
//  • РУТОВЫЕ узлы — в ЦЕНТРЕ карты;
//  • научные области — СЕКТОРА: чем больше узлов в области, тем больше её угол;
//  • радиус = глубина рекурсивной зависимости (длиннейшая цепочка от рута):
//    чем глубже узел в дереве зависимостей, тем дальше от центра;
//  • сектор поддерева пропорционален числу узлов в поддереве → пространство
//    между узлами распределяется равномерно (без скученности у периметра);
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

export interface Map2DZoneSector {
  readonly startAngle: number;
  readonly endAngle: number;
  readonly midAngle: number;
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
  /** Сектор каждой научной зоны (угол пропорционален числу узлов). */
  readonly zoneSectors: Readonly<Record<string, Map2DZoneSector>>;
  /** Центроиды кластеров зон (для подписей на плейне). */
  readonly zoneCentroids: Readonly<Record<string, Map2DPoint>>;
  /** Идентификаторы рутовых узлов (размещены в центре). */
  readonly rootIds: readonly string[];
}

export interface Map2DLayoutOptions {
  readonly width?: number;
  readonly height?: number;
  readonly padding?: number;
}

const UNZONED_ID = '__unzoned__';
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
 *  4) сектора зон ∝ |узлов зоны|; внутри — рекурсивное деление сектора
 *     ∝ весу поддерева (узел в середине своего промежутка, дети — равномерно);
 *  5) сглаживание: каждому ребёнку ≥ 35% от равной доли (без «игольных ушек»).
 */
export function computeMap2DLayout(
  nodes: readonly ProblemNode[],
  zones: readonly ScienceZone[],
  options: Map2DLayoutOptions = {},
): Map2DLayout {
  const baseWidth = options.width ?? 1680;
  const baseHeight = options.height ?? 980;
  const padding = options.padding ?? 100;

  let center: Map2DPoint = { x: baseWidth / 2, y: baseHeight / 2 };
  // Итоговые размеры холста определяются после вычисления колец (ниже):
  // прямоугольник зумируем, поэтому квадратное ограничение снято.
  let width = baseWidth;
  let height = baseHeight;
  const emptyLayout: Map2DLayout = {
    positions: {},
    width,
    height,
    center,
    depthOf: {},
    ringRadii: [],
    zoneSectors: {},
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
  const rootSet = new Set(rootIds);

  // --- 2) Глубина: длиннейшая цепочка зависимостей от рута ------------------
  const depthOf: Record<string, number> = {};
  for (const id of rootIds) depthOf[id] = 0;
  // Релаксация по рёбрам (конечна, т.к. глубина растёт монотонно; верхняя
  // граница итераций = число узлов — защита от теоретических циклов).
  for (let sweep = 0; sweep < nodes.length; sweep++) {
    let changed = false;
    for (const node of nodes) {
      if (node.id in depthOf) continue;
      const prereqDepths = [...(upstreamOf.get(node.id) ?? [])]
        .filter(p => p in depthOf)
        .map(p => depthOf[p]!);
      const prereqs = upstreamOf.get(node.id) ?? new Set<string>();
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

  // --- 4) Зоны и сектора (∝ числу узлов области) ----------------------------
  const zoneOrder: string[] = zones.map(z => z.id);
  const zoneOf = new Map<string, string>();
  for (const node of nodes) {
    const primary = node.zoneIds?.[0];
    zoneOf.set(node.id, primary && zoneOrder.includes(primary) ? primary : UNZONED_ID);
  }
  const zoneBuckets = new Map<string, string[]>();
  for (const id of [...zoneOrder, UNZONED_ID]) zoneBuckets.set(id, []);
  for (const node of nodes) zoneBuckets.get(zoneOf.get(node.id)!)!.push(node.id);

  const orderedZoneIds = [...zoneOrder, UNZONED_ID].filter(
    zid => (zoneBuckets.get(zid)?.length ?? 0) > 0,
  );
  const totalNodes = nodes.length;
  const zoneSectors: Record<string, Map2DZoneSector> = {};
  let cursor = -Math.PI / 2; // старт сверху
  for (const zid of orderedZoneIds) {
    const span = (zoneBuckets.get(zid)!.length / totalNodes) * TWO_PI;
    zoneSectors[zid] = { startAngle: cursor, endAngle: cursor + span, midAngle: cursor + span / 2 };
    cursor += span;
  }

  // --- 5) Рекурсивное угловое размещение внутри зоны ------------------------
  // Дети узла внутри зоны = узлы зоны, чей primary-parent — этот узел.
  const childrenInZone = new Map<string, string[]>();
  for (const node of nodes) childrenInZone.set(node.id, []);
  const zoneEntries = new Map<string, string[]>();
  for (const zid of orderedZoneIds) zoneEntries.set(zid, []);
  for (const node of nodes) {
    const parent = primaryParent.get(node.id);
    const zid = zoneOf.get(node.id)!;
    if (parent && zoneOf.get(parent) === zid && !rootSet.has(node.id)) {
      childrenInZone.get(parent)!.push(node.id);
    } else if (!rootSet.has(node.id)) {
      zoneEntries.get(zid)!.push(node.id);
    }
  }

  // Вес поддерева = число узлов; порядок детей детерминирован (глубина, id)
  const weightOf = new Map<string, number>();
  const computeWeight = (id: string): number => {
    const cached = weightOf.get(id);
    if (cached !== undefined) return cached;
    weightOf.set(id, 1); // guarded against degenerate cycles
    let w = 1;
    for (const child of childrenInZone.get(id) ?? []) w += computeWeight(child);
    weightOf.set(id, w);
    return w;
  };
  for (const node of nodes) computeWeight(node.id);
  for (const [, list] of childrenInZone) {
    list.sort((a, b) => depthOf[a]! - depthOf[b]! || byId(a, b));
  }
  for (const [, list] of zoneEntries) {
    list.sort((a, b) => depthOf[a]! - depthOf[b]! || byId(a, b));
  }

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

  const placements = new Map<string, RadialPlacement>();

  // --- Адаптивные радиусы колец (равномерность как в yFiles RadialLayout:
  // радиус кольца подбирается под «эквивалентную плотность» кольца, чтобы
  // дуговое расстояние между соседями на кольце было не меньше целевого) ---
  const TARGET_ARC = 54; // целевое дуговое расстояние между узлами кольца
  const MIN_BAND = 66;   // минимальная разница радиусов соседних колец

  // Эквивалентная плотность кольца d: сколько узлов было бы на ПОЛНОМ круге,
  // если бы плотность секторов кольца d была такой же, как фактическая.
  const equivalentDensity = (d: number): number => {
    let e = 0;
    for (const zid of orderedZoneIds) {
      const inZone = zoneBuckets.get(zid)!;
      const atDepth = inZone.filter(id => depthOf[id] === d).length;
      if (atDepth === 0) continue;
      const fraction = inZone.length / totalNodes; // доля полного круга у зоны
      e += atDepth / fraction;
    }
    return e;
  };

  const rootRadius = rootIds.length === 1 ? 0 : 70;
  const idealRadii: number[] = [rootRadius];
  for (let d = 1; d <= maxDepth; d++) {
    const required = (TARGET_ARC / TWO_PI) * equivalentDensity(d);
    idealRadii.push(Math.max(idealRadii[d - 1]! + MIN_BAND, required, idealRadii[d - 1]! + 1));
  }
  // Мягкий предел общего радиуса (пропорциональное сжатие сохраняет
  // равномерность: относительные расстояния неизменны, зум добирает детали).
  const outerIdeal = idealRadii[maxDepth]!;
  const softLimit = (Math.min(baseWidth, baseHeight) / 2 - padding) * 4;
  const squeeze = outerIdeal <= 0 ? 1 : Math.min(1, softLimit / outerIdeal);
  const ringRadii = idealRadii.map(r => r * squeeze);

  // Холст подгоняется под фактический внешний радиус (зумируемая область:
  // глубокие цепочки получают больше места, ничего не выходит за края).
  const outerRadius = ringRadii[maxDepth]! + padding;
  width = Math.max(baseWidth, Math.ceil(outerRadius * 2));
  height = Math.max(baseHeight, Math.ceil(outerRadius * 2));
  center = { x: width / 2, y: height / 2 };

  const assignNode = (id: string, a0: number, a1: number): void => {
    const angle = (a0 + a1) / 2;
    placements.set(id, { angle, radius: ringRadii[Math.min(depthOf[id]!, maxDepth)]! });
    const children = childrenInZone.get(id) ?? [];
    for (const piece of splitSpan(children, a0, a1)) {
      assignNode(piece.id, piece.a0, piece.a1);
    }
  };

  for (const zid of orderedZoneIds) {
    const sector = zoneSectors[zid]!;
    // Якоря сектора: руты этой зоны + «инородные» входы (parent в другой
    // зоне). Каждый якорь получает долю сектора ∝ весу своего поддерева.
    const rootsInZone = rootIds.filter(id => zoneOf.get(id) === zid).sort(byId);
    const anchors = [...rootsInZone, ...(zoneEntries.get(zid) ?? [])];
    for (const piece of splitSpan(anchors, sector.startAngle, sector.endAngle)) {
      assignNode(piece.id, piece.a0, piece.a1);
    }
  }

  // --- Финализация в декартовы координаты -----------------------------------
  const positions: Record<string, Map2DPoint> = {};
  for (const [id, p] of placements) {
    positions[id] = {
      x: Math.round((center.x + p.radius * Math.cos(p.angle)) * 10) / 10,
      y: Math.round((center.y + p.radius * Math.sin(p.angle)) * 10) / 10,
    };
  }

  const zoneCentroids: Record<string, Map2DPoint> = {};
  // Подпись зоны — на биссектрисе её сектора, посередине занятого радиуса.
  const labelRadius = Math.max(rootRadius, ringRadii[maxDepth]! * 0.5);
  for (const zid of orderedZoneIds) {
    const sector = zoneSectors[zid]!;
    zoneCentroids[zid] = {
      x: Math.round((center.x + labelRadius * Math.cos(sector.midAngle)) * 10) / 10,
      y: Math.round((center.y + labelRadius * Math.sin(sector.midAngle)) * 10) / 10,
    };
  }

  return {
    positions,
    width,
    height,
    center,
    depthOf: { ...depthOf },
    ringRadii,
    zoneSectors,
    zoneCentroids,
    rootIds,
  };
}
