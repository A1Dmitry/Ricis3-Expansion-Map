import { MapState, ProblemNode } from './types';

/** Идентификаторы ядра RICIS (цели пути «к RICIS»). */
export const RICIS_CORE_IDS = [
  'core-agi-target',
  'math-singularity',
  'core-intent-formalization',
  'core-complexity-model',
  'core-behavior-simulation',
] as const;

export function isRicisCore(node: ProblemNode): boolean {
  return (
    node.ricisSolvable === true ||
    node.type === 'core_singularity' ||
    RICIS_CORE_IDS.includes(node.id as (typeof RICIS_CORE_IDS)[number])
  );
}

/**
 * Узел доступен, если все прямые зависимости решены
 * (или зависимостей нет — стартовые / ядро).
 */
export function isNodeAvailable(node: ProblemNode, map: MapState): boolean {
  if (node.state === 'resolved') return true;
  if (!node.dependencyIds || node.dependencyIds.length === 0) return true;
  const byId = new Map(map.nodes.map(n => [n.id, n]));
  return node.dependencyIds.every(depId => {
    const dep = byId.get(depId);
    return dep?.state === 'resolved';
  });
}

/** Нерешённые прямые зависимости (что нужно открыть «сразу»). */
export function getDirectBlockers(node: ProblemNode, map: MapState): ProblemNode[] {
  const byId = new Map(map.nodes.map(n => [n.id, n]));
  return (node.dependencyIds || [])
    .map(id => byId.get(id))
    .filter((n): n is ProblemNode => !!n && n.state !== 'resolved');
}

/**
 * Полный набор нерешённых предков (рекурсивно),
 * которые нужно решить, чтобы открыть узел.
 */
export function getUnlockRequirements(node: ProblemNode, map: MapState): ProblemNode[] {
  const byId = new Map(map.nodes.map(n => [n.id, n]));
  const seen = new Set<string>();
  const out: ProblemNode[] = [];

  const walk = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    const n = byId.get(id);
    if (!n) return;
    if (n.state === 'resolved') return;
    out.push(n);
    for (const d of n.dependencyIds || []) walk(d);
  };

  for (const d of node.dependencyIds || []) walk(d);
  return out.filter(n => n.id !== node.id);
}

/**
 * Кратчайший путь по рёбрам dependencyIds от узла к ближайшему ядру RICIS.
 */
export function findPathToRicis(fromId: string, map: MapState): string[] {
  const byId = new Map(map.nodes.map(n => [n.id, n]));
  const start = byId.get(fromId);
  if (!start) return [];

  if (isRicisCore(start)) return [fromId];

  const queue: string[] = [fromId];
  const prev = new Map<string, string | null>();
  prev.set(fromId, null);
  let found: string | null = null;

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const node = byId.get(cur);
    if (!node) continue;
    if (cur !== fromId && isRicisCore(node)) {
      found = cur;
      break;
    }
    for (const dep of node.dependencyIds || []) {
      if (prev.has(dep)) continue;
      prev.set(dep, cur);
      queue.push(dep);
    }
  }

  if (!found) {
    const adj = new Map<string, string[]>();
    for (const n of map.nodes) {
      if (!adj.has(n.id)) adj.set(n.id, []);
      for (const d of n.dependencyIds || []) {
        adj.get(n.id)!.push(d);
        if (!adj.has(d)) adj.set(d, []);
        adj.get(d)!.push(n.id);
      }
    }
    for (const e of map.edges) {
      if (!adj.has(e.fromId)) adj.set(e.fromId, []);
      if (!adj.has(e.toId)) adj.set(e.toId, []);
      adj.get(e.fromId)!.push(e.toId);
      adj.get(e.toId)!.push(e.fromId);
    }

    const q2: string[] = [fromId];
    const prev2 = new Map<string, string | null>([[fromId, null]]);
    let found2: string | null = null;
    while (q2.length > 0) {
      const cur = q2.shift()!;
      const node = byId.get(cur);
      if (node && cur !== fromId && isRicisCore(node)) {
        found2 = cur;
        break;
      }
      for (const nb of adj.get(cur) || []) {
        if (prev2.has(nb)) continue;
        prev2.set(nb, cur);
        q2.push(nb);
      }
    }
    if (!found2) return [];
    const path: string[] = [];
    let c: string | null = found2;
    while (c) {
      path.push(c);
      c = prev2.get(c) ?? null;
    }
    path.reverse();
    return path;
  }

  const path: string[] = [];
  let c: string | null = found;
  while (c) {
    path.push(c);
    c = prev.get(c) ?? null;
  }
  path.reverse();
  return path;
}

export function countAvailable(map: MapState): { available: number; locked: number; resolved: number } {
  let available = 0;
  let locked = 0;
  let resolved = 0;
  for (const n of map.nodes) {
    if (n.state === 'resolved') {
      resolved++;
    } else if (isNodeAvailable(n, map)) {
      available++;
    } else {
      locked++;
    }
  }
  return { available, locked, resolved };
}

/**
 * Отчет о разблокируемых узлах при решении текущей задачи.
 */
export interface UnlockedTargetsReport {
  immediateUnlockTargets: ProblemNode[];
  allDependentTargets: ProblemNode[];
}

/**
 * Находит все задачи в графе, которые зависят от решения текущей ноды:
 * - allDependentTargets: все узлы, в формулу или зависимости которых входит текущий узел.
 * - immediateUnlockTargets: узлы, которые станут немедленно доступны (все остальные их зависимости уже решены).
 */
export function getUnlockedTargets(
  node: ProblemNode,
  map: { nodes: ProblemNode[]; edges?: Array<{ source?: string; target?: string; fromId?: string; toId?: string }> }
): UnlockedTargetsReport {
  const byId = new Map(map.nodes.map(n => [n.id, n]));
  const dependentSet = new Set<string>();

  // 1. Прямые ссылки через dependencyIds
  for (const n of map.nodes) {
    if (n.id === node.id) continue;
    if (n.dependencyIds && n.dependencyIds.includes(node.id)) {
      dependentSet.add(n.id);
    }
  }

  // 2. Ориентированные ребра графа
  if (map.edges) {
    for (const e of map.edges) {
      const from = e.source || e.fromId;
      const to = e.target || e.toId;
      if (from === node.id && to && to !== node.id) {
        dependentSet.add(to);
      }
    }
  }

  const allDependentTargets = Array.from(dependentSet)
    .map(id => byId.get(id))
    .filter((n): n is ProblemNode => !!n);

  const immediateUnlockTargets = allDependentTargets.filter(depNode => {
    if (depNode.state === 'resolved') return false;
    const remainingUnresolved = (depNode.dependencyIds || []).filter(
      depId => depId !== node.id && byId.get(depId)?.state !== 'resolved'
    );
    return remainingUnresolved.length === 0;
  });

  return {
    immediateUnlockTargets,
    allDependentTargets,
  };
}

