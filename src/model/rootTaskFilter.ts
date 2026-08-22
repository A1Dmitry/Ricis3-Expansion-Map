import type { DependencyEdge, ProblemNode } from './types';

export interface RootConnectedTask {
  task: ProblemNode;
  /** Ordered from the task to the selected root. */
  path: ProblemNode[];
}

export interface RootTaskFilterResult {
  root: ProblemNode | null;
  tasks: RootConnectedTask[];
}

function uniqueExistingIds(candidateIds: Iterable<string>, nodeById: ReadonlyMap<string, ProblemNode>): string[] {
  return Array.from(new Set(candidateIds)).filter(id => nodeById.has(id));
}

/**
 * Returns canonical rootward neighbours for one node.
 *
 * The persisted map has three compatible representations of the same relation:
 * - child.dependencyIds stores child -> parent;
 * - parent.dependentIds stores parent <- child;
 * - DependencyEdge stores parent -> child for visual graph rendering.
 *
 * This adapter makes the rootward direction explicit once, so consumers do not
 * need to reimplement inverse-edge logic.
 */
export function getRootwardDependencyIds(
  nodeId: string,
  nodes: readonly ProblemNode[],
  edges: readonly DependencyEdge[],
): string[] {
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const node = nodeById.get(nodeId);
  if (!node) return [];

  const fromDependencyIds = node.dependencyIds ?? [];
  const fromEdges = edges
    .filter(edge => edge.toId === nodeId)
    .map(edge => edge.fromId);
  const fromParentDeclarations = nodes
    .filter(candidate => candidate.dependentIds?.includes(nodeId))
    .map(candidate => candidate.id);

  return uniqueExistingIds(
    [...fromDependencyIds, ...fromEdges, ...fromParentDeclarations],
    nodeById,
  );
}

/**
 * Finds one shortest simple path from start node to root by following rootward
 * dependencies. The queue-level visited set prevents cycles and makes the
 * first discovered route deterministic for the persisted node ordering.
 */
export function findPathToRoot(
  startNodeId: string,
  rootNodeId: string,
  nodes: readonly ProblemNode[],
  edges: readonly DependencyEdge[],
): ProblemNode[] | null {
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  if (!nodeById.has(startNodeId) || !nodeById.has(rootNodeId)) return null;

  const queue: Array<{ nodeId: string; pathIds: string[] }> = [
    { nodeId: startNodeId, pathIds: [startNodeId] },
  ];
  const visited = new Set<string>([startNodeId]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    if (current.nodeId === rootNodeId) {
      return current.pathIds.map(id => nodeById.get(id)).filter((node): node is ProblemNode => Boolean(node));
    }

    for (const dependencyId of getRootwardDependencyIds(current.nodeId, nodes, edges)) {
      if (visited.has(dependencyId)) continue;
      visited.add(dependencyId);
      queue.push({ nodeId: dependencyId, pathIds: [...current.pathIds, dependencyId] });
    }
  }

  return null;
}

/**
 * Lists only scientific-task nodes that have a structural path to the selected
 * root. Nodes used as intermediate path segments are intentionally not promoted
 * to task cards, preserving the distinction between a task and graph context.
 */
export function getRootConnectedScientificTasks(
  rootNodeId: string,
  nodes: readonly ProblemNode[],
  edges: readonly DependencyEdge[],
): RootTaskFilterResult {
  const root = nodes.find(node => node.id === rootNodeId) ?? null;
  if (!root) return { root: null, tasks: [] };

  const tasks = nodes
    .filter(node => node.type === 'scientific_task' && node.id !== rootNodeId)
    .flatMap(task => {
      const path = findPathToRoot(task.id, rootNodeId, nodes, edges);
      return path ? [{ task, path }] : [];
    })
    .sort((left, right) => {
      if (left.path.length !== right.path.length) return left.path.length - right.path.length;
      return left.task.title.localeCompare(right.task.title, 'ru');
    });

  return { root, tasks };
}

export function getRootPathLabel(path: readonly ProblemNode[], maxVisibleSegments = 3): string {
  if (path.length <= maxVisibleSegments) return path.map(node => node.id).join(' → ');
  const first = path[0];
  const penultimate = path[path.length - 2];
  const last = path[path.length - 1];
  if (!first || !penultimate || !last) return '';
  return `${first.id} → … → ${penultimate.id} → ${last.id}`;
}
