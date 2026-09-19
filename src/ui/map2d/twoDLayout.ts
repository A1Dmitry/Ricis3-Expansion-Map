// ============================================================================
// DETERMINISTIC 2D FORCE-DIRECTED LAYOUT (DDD / pure domain)
// Равномерно распределяет узлы по площади отображения: кластеризация по
// научным зонам + отталкивание узел–узел + пружины вдоль рёбер зависимостей.
// Результат детерминирован (без Math.random): одна и та же карта даёт
// одну и ту же раскладку — стабильная ментальная модель и тестируемость.
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
  /** Центроиды кластеров зон (для подписей на плейне). */
  readonly zoneCentroids: Readonly<Record<string, Map2DPoint>>;
}

export interface Map2DLayoutOptions {
  readonly width?: number;
  readonly height?: number;
  readonly iterations?: number;
  readonly restLength?: number;
  readonly padding?: number;
}

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

interface MutablePoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/**
 * Детерминированная force-directed раскладка.
 *
 * Силы:
 *  1. Отталкивание всех пар (основа «равномерного заполнения» площади).
 *  2. Пружины вдоль рёбер зависимостей (связанные узлы — рядом).
 *  3. Слабое притяжение к центроиду своей научной зоны (кластер читаем).
 *  4. Слабое притяжение к центру холста (никто не улетает за край).
 */
export function computeMap2DLayout(
  nodes: readonly ProblemNode[],
  zones: readonly ScienceZone[],
  options: Map2DLayoutOptions = {},
): Map2DLayout {
  const width = options.width ?? 1680;
  const height = options.height ?? 980;
  const iterations = options.iterations ?? 240;
  const restLength = options.restLength ?? 140;
  const padding = options.padding ?? 90;

  if (nodes.length === 0) {
    return { positions: {}, width, height, zoneCentroids: {} };
  }

  const centerX = width / 2;
  const centerY = height / 2;

  // --- Центроиды зон: равномерно по эллипсу, покрывающему площадь холста ---
  const totalZones = Math.max(1, zones.length);
  const zoneCenters: Record<string, Map2DPoint> = {};
  zones.forEach((zone, idx) => {
    const angle = (idx / totalZones) * 2 * Math.PI - Math.PI / 2;
    const ringX = Math.cos(angle) * (width / 2 - padding * 1.6);
    const ringY = Math.sin(angle) * (height / 2 - padding * 1.6);
    zoneCenters[zone.id] = { x: centerX + ringX, y: centerY + ringY };
  });

  const primaryZoneOf = (node: ProblemNode): string | null => {
    const primary = node.zoneIds?.[0];
    return primary && zoneCenters[primary] ? primary : null;
  };

  // --- Начальные позиции: детерминированная филлотаксис-спираль внутри зоны ---
  const points: MutablePoint[] = [];
  const indexOf = new Map<string, number>();
  const zoneCursor = new Map<string, number>();

  nodes.forEach((node, idx) => {
    indexOf.set(node.id, idx);
    const zoneId = primaryZoneOf(node);
    let base: Map2DPoint;
    let spiralIdx: number;
    if (zoneId) {
      base = zoneCenters[zoneId]!;
      spiralIdx = zoneCursor.get(zoneId) ?? 0;
      zoneCursor.set(zoneId, spiralIdx + 1);
    } else {
      base = { x: centerX, y: centerY };
      spiralIdx = zoneCursor.get('__none__') ?? 0;
      zoneCursor.set('__none__', spiralIdx + 1);
    }
    // Спираль Вогеля (золотой угол) — равномерное заполнение круга без наложений
    const golden = Math.PI * (3 - Math.sqrt(5));
    const angle = spiralIdx * golden;
    const radius = 34 * Math.sqrt(spiralIdx + 1);
    points.push({
      x: base.x + Math.cos(angle) * radius,
      y: base.y + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
    });
  });

  const edges = buildMap2DEdges(nodes);
  const n = nodes.length;
  const repulsionK = Math.min(420, Math.max(220, 26000 / Math.max(12, n)));

  for (let iter = 0; iter < iterations; iter++) {
    const cooling = 1 - iter / iterations; // охлаждение: шаги уменьшаются

    // 1) Отталкивание всех пар
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = points[i]!;
        const b = points[j]!;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.01) {
          // Детерминированный сдвиг совпадающих точек
          dx = ((i + j) % 7) - 3;
          dy = ((i * 3 + j) % 7) - 3;
          dist = Math.max(0.01, Math.sqrt(dx * dx + dy * dy));
        }
        const force = ((repulsionK * repulsionK) / dist) * 0.0045 * cooling;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }
    }

    // 2) Пружины вдоль рёбер
    for (const edge of edges) {
      const a = points[indexOf.get(edge.source)!];
      const b = points[indexOf.get(edge.target)!];
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.max(0.01, Math.sqrt(dx * dx + dy * dy));
      const force = ((dist - restLength) / dist) * 0.03 * cooling;
      a.vx += dx * force;
      a.vy += dy * force;
      b.vx -= dx * force;
      b.vy -= dy * force;
    }

    // 3) Притяжение к центроиду зоны + 4) к центру холста
    nodes.forEach((node, idx) => {
      const p = points[idx]!;
      const zoneId = primaryZoneOf(node);
      if (zoneId) {
        const c = zoneCenters[zoneId]!;
        p.vx += (c.x - p.x) * 0.0018 * cooling;
        p.vy += (c.y - p.y) * 0.0018 * cooling;
      }
      p.vx += (centerX - p.x) * 0.0012 * cooling;
      p.vy += (centerY - p.y) * 0.0012 * cooling;
    });

    // Интеграция с демпфированием и лимитом шага
    for (const p of points) {
      const stepX = Math.max(-36, Math.min(36, p.vx));
      const stepY = Math.max(-36, Math.min(36, p.vy));
      p.x += stepX;
      p.y += stepY;
      p.vx = stepX * 0.72;
      p.vy = stepY * 0.72;
      p.x = Math.max(padding, Math.min(width - padding, p.x));
      p.y = Math.max(padding, Math.min(height - padding, p.y));
    }
  }

  // --- Нормализация: вписать фактический bbox в холст с полями ---
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const fit = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY, 1.6);
  const offsetX = centerX - ((minX + maxX) / 2) * fit;
  const offsetY = centerY - ((minY + maxY) / 2) * fit;

  const positions: Record<string, Map2DPoint> = {};
  nodes.forEach((node, idx) => {
    const p = points[idx]!;
    positions[node.id] = {
      x: Math.round((p.x * fit + offsetX) * 10) / 10,
      y: Math.round((p.y * fit + offsetY) * 10) / 10,
    };
  });

  // Финальные центроиды кластеров (для подписей зон)
  const acc = new Map<string, { sx: number; sy: number; count: number }>();
  nodes.forEach(node => {
    const zoneId = primaryZoneOf(node);
    if (!zoneId) return;
    const bucket = acc.get(zoneId) ?? { sx: 0, sy: 0, count: 0 };
    const pos = positions[node.id]!;
    bucket.sx += pos.x;
    bucket.sy += pos.y;
    bucket.count += 1;
    acc.set(zoneId, bucket);
  });
  const zoneCentroids: Record<string, Map2DPoint> = {};
  for (const [zoneId, bucket] of acc) {
    zoneCentroids[zoneId] = {
      x: Math.round((bucket.sx / bucket.count) * 10) / 10,
      y: Math.round((bucket.sy / bucket.count) * 10) / 10,
    };
  }

  return { positions, width, height, zoneCentroids };
}
