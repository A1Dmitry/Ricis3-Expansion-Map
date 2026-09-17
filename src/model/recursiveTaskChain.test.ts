import { describe, it, expect } from 'vitest';
import { initialMap } from './initialMap';
import { auditProofContent } from './ricisCoreRules';

describe('Recursive Dependency Chain Expansion & Gap Identification', () => {
  const nodeMap = new Map(initialMap.nodes.map(n => [n.id, n]));

  const NEW_TASK_IDS = [
    'task-elem-removable-zero',
    'task-elem-geometric-bridge-a6',
    'task-goldbach-sieve-monolith',
    'task-twin-prime-plane-difference',
    'task-collatz-ancestor-tree-invariant',
    'task-continuum-metric-hilbert',
    'task-turing-meta-monolith',
  ] as const;

  it('all 7 new tasks exist in initialMap with resolved status', () => {
    for (const id of NEW_TASK_IDS) {
      const node = nodeMap.get(id);
      expect(node, `Node ${id} must exist`).toBeDefined();
      expect(node?.state).toBe('resolved');
      expect(node?.leanErrors).toEqual([]);
      expect(node?.ricisSolvable).toBe(true);
    }
  });

  it('all node dependencyIds and dependentIds reference valid nodes in initialMap', () => {
    for (const node of initialMap.nodes) {
      for (const depId of node.dependencyIds) {
        expect(nodeMap.has(depId), `Node ${node.id} has invalid dependency ${depId}`).toBe(true);
      }
      for (const depId of node.dependentIds) {
        expect(nodeMap.has(depId), `Node ${node.id} has invalid dependent ${depId}`).toBe(true);
      }
    }
  });

  it('reciprocal dependency integrity: every dependency has matching dependent', () => {
    for (const id of NEW_TASK_IDS) {
      const node = nodeMap.get(id)!;
      for (const parentId of node.dependencyIds) {
        const parent = nodeMap.get(parentId)!;
        expect(
          parent.dependentIds,
          `Parent ${parentId} must list ${id} in dependentIds`
        ).toContain(id);
      }
      for (const childId of node.dependentIds) {
        const child = nodeMap.get(childId)!;
        expect(
          child.dependencyIds,
          `Child ${childId} must list ${id} in dependencyIds`
        ).toContain(id);
      }
    }
  });

  it('all new edges have valid fromId and toId', () => {
    const nodeIds = new Set(initialMap.nodes.map(n => n.id));
    for (const edge of initialMap.edges) {
      expect(nodeIds.has(edge.fromId), `Edge ${edge.id} has unknown fromId ${edge.fromId}`).toBe(true);
      expect(nodeIds.has(edge.toId), `Edge ${edge.id} has unknown toId ${edge.toId}`).toBe(true);
    }
  });

  it('all 7 new tasks have valid proofs in initialMap.proofs passing audit', () => {
    for (const id of NEW_TASK_IDS) {
      const proof = initialMap.proofs[id];
      expect(proof, `Proof for ${id} must exist`).toBeDefined();
      expect(proof.steps.length).toBeGreaterThanOrEqual(3);
      expect(proof.latex).toContain('RICIS-III Proof');
      expect(proof.latex).toContain('Dmitry V. Aleinikov');

      const audit = auditProofContent(proof.latex);
      expect(audit.isValid, `Proof for ${id} must be valid: ${audit.issues.join(', ')}`).toBe(true);
      expect(audit.issues).toEqual([]);
    }
  });

  it('recursively traces Goldbach (registry-101) through gap nodes to root math-singularity', () => {
    function getAncestors(startId: string): Set<string> {
      const visited = new Set<string>();
      const stack = [startId];
      while (stack.length > 0) {
        const curr = stack.pop()!;
        const node = nodeMap.get(curr);
        if (!node) continue;
        for (const depId of node.dependencyIds) {
          if (!visited.has(depId)) {
            visited.add(depId);
            stack.push(depId);
          }
        }
      }
      return visited;
    }

    const goldbachAncestors = getAncestors('registry-101');
    expect(goldbachAncestors.has('task-goldbach-sieve-monolith')).toBe(true);
    expect(goldbachAncestors.has('task-elem-geometric-bridge-a6')).toBe(true);
    expect(goldbachAncestors.has('contract-sp4-path-index')).toBe(true);
    expect(goldbachAncestors.has('math-singularity')).toBe(true);
  });

  it('recursively traces Twin Prime (registry-102) through gap nodes to root math-singularity', () => {
    function getAncestors(startId: string): Set<string> {
      const visited = new Set<string>();
      const stack = [startId];
      while (stack.length > 0) {
        const curr = stack.pop()!;
        const node = nodeMap.get(curr);
        if (!node) continue;
        for (const depId of node.dependencyIds) {
          if (!visited.has(depId)) {
            visited.add(depId);
            stack.push(depId);
          }
        }
      }
      return visited;
    }

    const twinAncestors = getAncestors('registry-102');
    expect(twinAncestors.has('task-twin-prime-plane-difference')).toBe(true);
    expect(twinAncestors.has('task-elem-removable-zero')).toBe(true);
    expect(twinAncestors.has('task-elem-geometric-bridge-a6')).toBe(true);
    expect(twinAncestors.has('math-singularity')).toBe(true);
  });

  it('recursively traces Collatz (registry-107) through gap nodes to root math-singularity', () => {
    function getAncestors(startId: string): Set<string> {
      const visited = new Set<string>();
      const stack = [startId];
      while (stack.length > 0) {
        const curr = stack.pop()!;
        const node = nodeMap.get(curr);
        if (!node) continue;
        for (const depId of node.dependencyIds) {
          if (!visited.has(depId)) {
            visited.add(depId);
            stack.push(depId);
          }
        }
      }
      return visited;
    }

    const collatzAncestors = getAncestors('registry-107');
    expect(collatzAncestors.has('task-collatz-ancestor-tree-invariant')).toBe(true);
    expect(collatzAncestors.has('contract-l1-field-monolith')).toBe(true);
    expect(collatzAncestors.has('ricis-ast-reduction-pattern')).toBe(true);
    expect(collatzAncestors.has('math-singularity')).toBe(true);
  });

  it('recursively traces Continuum QM-GR bridge through task-continuum-metric-hilbert', () => {
    function getAncestors(startId: string): Set<string> {
      const visited = new Set<string>();
      const stack = [startId];
      while (stack.length > 0) {
        const curr = stack.pop()!;
        const node = nodeMap.get(curr);
        if (!node) continue;
        for (const depId of node.dependencyIds) {
          if (!visited.has(depId)) {
            visited.add(depId);
            stack.push(depId);
          }
        }
      }
      return visited;
    }

    const unifiedAncestors = getAncestors('phys-unified');
    expect(unifiedAncestors.has('task-continuum-metric-hilbert')).toBe(true);
    expect(unifiedAncestors.has('phys-field-bridge-contract')).toBe(true);
    expect(unifiedAncestors.has('task-elem-geometric-bridge-a6')).toBe(true);
  });

  it('recursively traces Halting Problem (registry-114) through gap nodes to root math-singularity', () => {
    function getAncestors(startId: string): Set<string> {
      const visited = new Set<string>();
      const stack = [startId];
      while (stack.length > 0) {
        const curr = stack.pop()!;
        const node = nodeMap.get(curr);
        if (!node) continue;
        for (const depId of node.dependencyIds) {
          if (!visited.has(depId)) {
            visited.add(depId);
            stack.push(depId);
          }
        }
      }
      return visited;
    }
    const haltingAncestors = getAncestors('registry-114');
    expect(haltingAncestors.has('task-turing-meta-monolith')).toBe(true);
    expect(haltingAncestors.has('contract-l1-field-monolith')).toBe(true);
    expect(haltingAncestors.has('math-singularity')).toBe(true);

});
});
