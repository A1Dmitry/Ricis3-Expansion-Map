import { describe, expect, it } from 'vitest';
import type { DependencyEdge, ProblemNode } from './types';
import {
  findPathToRoot,
  getRootConnectedScientificTasks,
  getRootPathLabel,
  getRootwardDependencyIds,
} from './rootTaskFilter';

function node(overrides: Partial<ProblemNode> & Pick<ProblemNode, 'id' | 'title'>): ProblemNode {
  return {
    id: overrides.id,
    title: overrides.title,
    description: overrides.description ?? '',
    state: overrides.state ?? 'unresolved',
    type: overrides.type ?? 'scientific_task',
    targetFunction: overrides.targetFunction ?? 'X = X',
    zoneIds: overrides.zoneIds ?? ['math'],
    dependencyIds: overrides.dependencyIds ?? [],
    dependentIds: overrides.dependentIds ?? [],
    fractalDepth: overrides.fractalDepth ?? 0,
    economic: overrides.economic ?? { costUnresolved: 0, costToSolve: 0, marketGain: 0, riskLoss: 0 },
  };
}

function edge(id: string, fromId: string, toId: string): DependencyEdge {
  return { id, fromId, toId, strength: 1, stateColor: 'green', economicInfluence: 0 };
}

describe('rootTaskFilter', () => {
  const root = node({ id: 'core-agi-target', title: 'Root goal', type: 'core_singularity' });
  const bridge = node({ id: 'dependency-d17', title: 'Dependency D-17', type: 'derived_problem', dependencyIds: [root.id] });
  const task = node({ id: 'task-t42', title: 'Establish D-17', dependencyIds: [bridge.id] });
  const unrelated = node({ id: 'task-other', title: 'Similar label without a structural link' });

  it('normalizes dependencyIds, parent dependentIds and visual parent-to-child edges into one rootward relation', () => {
    const fromDependencyIds = getRootwardDependencyIds(task.id, [root, bridge, task], []);
    expect(fromDependencyIds).toEqual([bridge.id]);

    const fromParentDeclarations = getRootwardDependencyIds('child', [root, node({ id: 'child', title: 'Child' }), node({ id: 'declared-parent', title: 'Parent', type: 'derived_problem', dependentIds: ['child'] })], []);
    expect(fromParentDeclarations).toEqual(['declared-parent']);

    const fromEdge = getRootwardDependencyIds('edge-child', [root, node({ id: 'edge-child', title: 'Edge child' })], [edge('root-to-child', root.id, 'edge-child')]);
    expect(fromEdge).toEqual([root.id]);
  });

  it('finds the shortest rootward path through graph-context nodes', () => {
    const path = findPathToRoot(task.id, root.id, [root, bridge, task], []);
    expect(path?.map(item => item.id)).toEqual([task.id, bridge.id, root.id]);
  });

  it('returns only scientific tasks that structurally reach the selected root', () => {
    const result = getRootConnectedScientificTasks(root.id, [root, bridge, task, unrelated], []);
    expect(result.root?.id).toBe(root.id);
    expect(result.tasks.map(item => item.task.id)).toEqual([task.id]);
    expect(result.tasks[0]?.path.map(item => item.id)).toEqual([task.id, bridge.id, root.id]);
  });

  it('does not promote an intermediate non-task node into the task list', () => {
    const result = getRootConnectedScientificTasks(root.id, [root, bridge, task], []);
    expect(result.tasks.some(item => item.task.id === bridge.id)).toBe(false);
  });

  it('excludes a thematically similar but structurally disconnected task', () => {
    const result = getRootConnectedScientificTasks(root.id, [root, bridge, task, unrelated], []);
    expect(result.tasks.some(item => item.task.id === unrelated.id)).toBe(false);
  });

  it('terminates safely on a cyclic dependency graph', () => {
    const cycleA = node({ id: 'cycle-a', title: 'Cycle A', dependencyIds: ['cycle-b'] });
    const cycleB = node({ id: 'cycle-b', title: 'Cycle B', dependencyIds: ['cycle-a', root.id] });
    const result = getRootConnectedScientificTasks(root.id, [root, cycleA, cycleB], []);
    expect(result.tasks.map(item => item.task.id)).toEqual(['cycle-b', 'cycle-a']);
    expect(result.tasks.every(item => new Set(item.path.map(node => node.id)).size === item.path.length)).toBe(true);
  });

  it('returns an empty result for an unknown root without throwing', () => {
    expect(getRootConnectedScientificTasks('missing-root', [root, task], [])).toEqual({ root: null, tasks: [] });
  });

  it('shortens long paths without hiding the task or root identity', () => {
    expect(getRootPathLabel([task, bridge, node({ id: 'middle', title: 'Middle' }), root])).toBe('task-t42 → … → middle → core-agi-target');
  });
});
