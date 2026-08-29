import { describe, expect, it } from 'vitest';
import { mergeCanonicalSeedGraph, reconcileCanonicalCatalog, sanitizeMap } from './persistence';
import { deepCopyInitialMap } from './initialMap';
import { KNOWN_SINGULARITY_PROBLEMS } from './catalog';
import { migrateMapNodeIdentitySync } from './nodeIdentityMigration';
import type { MapState, ProblemNode, Proof } from './types';

function node(id: string, state: ProblemNode['state']): ProblemNode {
  return {
    id,
    title: `Node ${id}`,
    description: 'Persistence sanitation fixture',
    state,
    type: 'scientific_task',
    targetFunction: '0_5 * inf_3',
    zoneIds: ['math'],
    dependencyIds: [],
    dependentIds: [],
    fractalDepth: 1,
    economic: { costToSolve: 1, costUnresolved: 2, marketGain: 3, riskLoss: 4 },
  };
}

function proof(nodeId: string): Proof {
  return {
    nodeId,
    targetFunction: '0_5 * inf_3',
    steps: [{ phase: 1, name: 'A6', action: 'bridge', expression: '15' }],
    finalResult: '15',
    latex: 'RICIS A6: 0_F * \\infty_G = F * G; specification https://doi.org/10.5281/zenodo.21836220',
  };
}

function state(nodes: ProblemNode[], proofs: MapState['proofs'] = {}): MapState {
  return {
    nodes,
    edges: [],
    zones: [{
      id: 'math',
      name: 'Math',
      description: 'Math',
      nodeIds: [],
      economicProfile: { costToSolve: 0, costUnresolved: 0, marketGain: 0, riskLoss: 0 },
    }],
    axioms: [],
    proofs,
    agentLogs: [],
  };
}

describe('sanitizeMap consent-preserving state integrity', () => {
  it('preserves resolved nodes without a proof record because hydration has no demotion authority', () => {
    const sanitized = sanitizeMap(state([node('unproven', 'resolved')]));

    expect(sanitized.nodes[0]?.state).toBe('resolved');
  });

  it('preserves resolved nodes backed only by a local proof record', () => {
    const sanitized = sanitizeMap(state([node('local-proof', 'resolved')], { 'local-proof': proof('local-proof') }));

    expect(sanitized.nodes[0]?.state).toBe('resolved');
    expect(sanitized.proofs['local-proof']?.nodeId).toBe('local-proof');
  });

  it('preserves persisted trusted external contracts while leaving trust classification unchanged', () => {
    const trustedAxiomProof: Proof = {
      ...proof('trusted-axiom'),
      externalLean: {
        sourceHash: 'fixture-trusted-axiom',
        submittedAt: '2026-08-21T00:00:00.000Z',
        sourceLocked: true,
        trustStatus: 'TRUSTED_AXIOM',
      },
    };

    const sanitized = sanitizeMap(state([node('trusted-axiom', 'resolved')], { 'trusted-axiom': trustedAxiomProof }));

    expect(sanitized.nodes[0]?.state).toBe('resolved');
  });

  it('also preserves resolved nodes when persisted Lean evidence is authoritative', () => {
    const leanVerifiedProof: Proof = {
      ...proof('lean-verified'),
      externalLean: {
        sourceHash: 'fixture-lean-verified',
        submittedAt: '2026-08-21T00:00:00.000Z',
        sourceLocked: true,
        trustStatus: 'LEAN_VERIFIED',
      },
    };

    const sanitized = sanitizeMap(state([node('lean-verified', 'resolved')], { 'lean-verified': leanVerifiedProof }));

    expect(sanitized.nodes[0]?.state).toBe('resolved');
  });

  it('preserves unresolved and partial nodes', () => {
    const sanitized = sanitizeMap(state([node('unresolved', 'unresolved'), node('partial', 'partial')]));

    expect(sanitized.nodes.map(candidate => candidate.state)).toEqual(['unresolved', 'partial']);
  });

  it('merges a migrated persisted graph with the seed in one SHA-128 identity space', () => {
    const legacySeed = deepCopyInitialMap();
    const persisted = migrateMapNodeIdentitySync(legacySeed).map;
    const merged = mergeCanonicalSeedGraph(persisted);
    const remigrated = migrateMapNodeIdentitySync(merged).map;

    expect(merged.nodes).toHaveLength(persisted.nodes.length);
    expect(new Set(merged.nodes.map(candidate => candidate.id)).size).toBe(merged.nodes.length);
    expect(merged.nodes.every(candidate => /^[0-9a-f]{32}$/u.test(candidate.id))).toBe(true);
    expect(remigrated.nodes.map(candidate => candidate.id)).toEqual(merged.nodes.map(candidate => candidate.id));
    expect(remigrated.edges).toEqual(merged.edges);
  });

  it('reconciles a canonical hash node and legacy catalog node with the same canonical path', () => {
    const migrated = migrateMapNodeIdentitySync(deepCopyInitialMap()).map;
    const catalogNode = KNOWN_SINGULARITY_PROBLEMS.find(candidate => candidate.id === 'real-catalog-0');
    expect(catalogNode).toBeDefined();
    const duplicateHash = 'd39fd7e5bdcec3f45f38dc43bba31169';
    const duplicate = { ...catalogNode!, id: duplicateHash, canonicalPath: '/гладкое-решение-уравнений-навье-стокса' };
    const mapWithDuplicate = { ...migrated, nodes: [...migrated.nodes, duplicate] };
    const merged = mergeCanonicalSeedGraph({ ...mapWithDuplicate, nodes: [...mapWithDuplicate.nodes, { ...catalogNode! }] });
    const reconciled = reconcileCanonicalCatalog(merged);
    const matching = reconciled.nodes.filter(candidate => candidate.canonicalPath === duplicate.canonicalPath);

    expect(matching).toHaveLength(1);
    expect(matching[0]?.id).toBe(duplicateHash);
    expect(reconciled.nodes.some(candidate => candidate.id === 'real-catalog-0')).toBe(false);
  });

  it('repairs a partially migrated persisted graph whose known seed records still use legacy IDs', () => {
    const seed = deepCopyInitialMap();
    const migrated = migrateMapNodeIdentitySync(seed).map;
    const aliases = migrated.nodeIdAliases ?? {};
    const reverse = new Map(Object.entries(aliases).map(([legacyId, canonicalId]) => [canonicalId, legacyId]));
    const selected = new Set(seed.nodes.slice(0, 101).map(candidate => aliases[candidate.id]));
    const restore = (id: string): string => selected.has(id) ? (reverse.get(id) ?? id) : id;
    const partial = {
      ...migrated,
      nodes: migrated.nodes.map(candidate => ({
        ...candidate,
        id: restore(candidate.id),
        canonicalPath: selected.has(candidate.id) ? undefined : candidate.canonicalPath,
        dependencyIds: candidate.dependencyIds.map(restore),
        dependentIds: candidate.dependentIds.map(restore),
      })),
      edges: migrated.edges.map(edge => {
        const fromId = restore(edge.fromId);
        const toId = restore(edge.toId);
        return { ...edge, id: `edge-${fromId}-${toId}`, fromId, toId };
      }),
      zones: migrated.zones.map(zone => ({ ...zone, nodeIds: zone.nodeIds.map(restore) })),
      proofs: Object.fromEntries(Object.entries(migrated.proofs).map(([id, proof]) => {
        const nodeId = restore(proof.nodeId);
        return [nodeId, { ...proof, nodeId }];
      })),
    };

    const repaired = mergeCanonicalSeedGraph(partial);
    const remigrated = migrateMapNodeIdentitySync(repaired).map;
    const nodeIds = new Set(repaired.nodes.map(candidate => candidate.id));

    expect(repaired.nodes).toHaveLength(migrated.nodes.length);
    expect(repaired.nodes.every(candidate => /^[0-9a-f]{32}$/u.test(candidate.id))).toBe(true);
    expect(repaired.nodes.every(candidate => candidate.dependencyIds.every(id => nodeIds.has(id)))).toBe(true);
    expect(remigrated.nodes.map(candidate => candidate.id)).toEqual(repaired.nodes.map(candidate => candidate.id));
  });
});
