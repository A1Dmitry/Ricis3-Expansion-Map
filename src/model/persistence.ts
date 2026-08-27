import { MapState, Proof, ProblemNode, DependencyEdge, Axiom, ScienceZone } from './types';
import { initialMap } from './initialMap';
import { deepCopyInitialMap } from './initialMap';

import { dbSaveMap, dbLoadMap, dbClear } from './db';
import { runDatabaseMigration } from './migrationAudit';
import { migrateMapNodeIdentity, migrateMapNodeIdentitySync } from './nodeIdentityMigration';
import { KNOWN_SINGULARITY_PROBLEMS } from './catalog';
import {
  CanonicalCatalogReconciliationPlanner,
  CatalogReconciliationApplication,
} from '../catalogVisibility/catalogVisibility.domain';

/** @deprecated Legacy localStorage snapshot (миграция). */
const LEGACY_KEY = 'ricis3-map-v1';

export interface PersistedSnapshot {
  version: 1;
  nodes: ProblemNode[];
  edges: DependencyEdge[];
  zones: ScienceZone[];
  axioms: Axiom[];
  proofs: Record<string, Proof>;
  savedAt: string;
  nodeIdAliases?: Record<string, string>;
}

export function toSnapshot(state: MapState): PersistedSnapshot {
  return {
    version: 1,
    nodes: state.nodes,
    edges: state.edges,
    zones: state.zones,
    axioms: state.axioms,
    proofs: state.proofs,
    savedAt: new Date().toISOString(),
    nodeIdAliases: state.nodeIdAliases,
  };
}


export function sanitizeMap(map: MapState): MapState {
  const validZones = new Map(map.zones.map(z => [z.id, z]));
  
  const missingZoneIds = new Set<string>();
  map.nodes.forEach(n => {
    if (n.zoneIds) {
      n.zoneIds.forEach(zid => {
        if (!validZones.has(zid)) {
          missingZoneIds.add(zid);
        }
      });
    }
  });

  const newZones = [...map.zones];
  missingZoneIds.forEach(zid => {
    // Generate a determinisic-ish color from the ID
    let hash = 0;
    for (let i = 0; i < zid.length; i++) {
      hash = zid.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = '#' + (hash & 0x00FFFFFF).toString(16).padStart(6, '0');
    
    const newZone: ScienceZone = {
      id: zid,
      name: zid.charAt(0).toUpperCase() + zid.slice(1).replace(/_/g, ' '),
      description: 'Автоматически созданная область наук',
      nodeIds: [],
      economicProfile: {
        costUnresolved: 10000,
        costToSolve: 1000,
        marketGain: 50000,
        riskLoss: 20000,
      }
    };
    newZones.push(newZone);
    validZones.set(zid, newZone);
  });
  
  const nodes = map.nodes.map(n => {
    let zids = n.zoneIds || [];
    if (zids.length === 0) {
      const parent = map.nodes.find(p => p.id === (n.dependencyIds && n.dependencyIds[0]));
      if (parent && parent.zoneIds && parent.zoneIds.length > 0) {
        zids = [...parent.zoneIds];
      } else {
        zids = ['math'];
      }
    }
    const proof = map.proofs?.[n.id];
    // Hydration is a shape-repair projection, not a consent authority. It preserves
    // the persisted workflow state even when proof evidence is incomplete or local.
    // A future reviewed proposal may be shown to a human, but hydration never demotes.
    void proof;
    return { ...n, state: n.state, zoneIds: zids };
  });

  const zones = newZones.map(z => {
    const members = nodes.filter(n => n.zoneIds.includes(z.id)).map(n => n.id);
    return { ...z, nodeIds: Array.from(new Set([...(z.nodeIds || []), ...members])) };
  });

  return { ...map, agentLogs: Array.isArray(map.agentLogs) ? map.agentLogs : [], nodes, zones };
}

function canonicalCatalogIdentitySnapshot(): MapState {
  const initialIds = new Set(initialMap.nodes.map((node) => node.id));
  const catalogOnly = KNOWN_SINGULARITY_PROBLEMS.filter((node) => !initialIds.has(node.id));
  return migrateMapNodeIdentitySync({
    nodes: [...initialMap.nodes, ...catalogOnly],
    edges: initialMap.edges,
    zones: initialMap.zones,
    axioms: [],
    proofs: {},
    agentLogs: [],
  }).map;
}

function remapKnownCatalogIdentity(map: MapState, canonicalCatalog: MapState): MapState {
  const aliases = canonicalCatalog.nodeIdAliases ?? {};
  const canonicalPaths = new Map(canonicalCatalog.nodes.map((node) => [node.id, node.canonicalPath]));
  const remap = (id: string): string => aliases[id] ?? id;
  const unique = (values: readonly string[]): string[] => [...new Set(values.map(remap))];
  const nodes = map.nodes
    .map((node) => ({
      ...node,
      id: remap(node.id),
      canonicalPath: node.canonicalPath ?? canonicalPaths.get(remap(node.id)),
      dependencyIds: unique(node.dependencyIds ?? []),
      dependentIds: unique(node.dependentIds ?? []),
    }))
    .sort((left, right) => Number(/^[0-9a-f]{32}$/u.test(right.id)) - Number(/^[0-9a-f]{32}$/u.test(left.id)));
  const edges = map.edges.map((edge) => {
    const fromId = remap(edge.fromId);
    const toId = remap(edge.toId);
    return { ...edge, id: `edge-${fromId}-${toId}`, fromId, toId };
  });
  const zones = map.zones.map((zone) => ({ ...zone, nodeIds: unique(zone.nodeIds ?? []) }));
  const axioms = map.axioms.map((axiom) => ({
    ...axiom,
    sourceNodeId: remap(axiom.sourceNodeId),
    usedByNodeIds: unique(axiom.usedByNodeIds ?? []),
  }));
  const proofs = Object.fromEntries(Object.entries(map.proofs ?? {}).map(([id, proof]) => {
    const nodeId = remap(proof.nodeId || id);
    return [nodeId, { ...proof, nodeId }];
  }));
  const agentLogs = map.agentLogs.map((entry) => entry.nodeId ? { ...entry, nodeId: remap(entry.nodeId) } : { ...entry });
  const dedupedNodes = [...new Map(nodes.map((node) => [node.id, node])).values()];
  const dedupedEdges = [...new Map(edges.map((edge) => [edge.id, edge])).values()];
  return migrateMapNodeIdentitySync({
    ...map,
    nodes: dedupedNodes,
    edges: dedupedEdges,
    zones,
    axioms,
    proofs,
    agentLogs,
    nodeIdAliases: { ...(map.nodeIdAliases ?? {}), ...aliases },
  }).map;
}

export function reconcileCanonicalCatalog(map: MapState): MapState {
  const canonicalCatalog = canonicalCatalogIdentitySnapshot();
  const normalizedMap = remapKnownCatalogIdentity(map, canonicalCatalog);
  const planner = new CanonicalCatalogReconciliationPlanner();
  const reconciliation = planner.plan({
    persistedNodes: normalizedMap.nodes,
    persistedZones: normalizedMap.zones,
    canonical: {
      nodes: canonicalCatalog.nodes,
      zones: initialMap.zones,
    },
  });

  if (reconciliation.kind !== 'reconciliation_planned') return normalizedMap;

  const applied = new CatalogReconciliationApplication().apply({ map: normalizedMap, plan: reconciliation });
  return applied.kind === 'applied' ? applied.map : normalizedMap;
}

export function fromSnapshot(s: PersistedSnapshot): MapState | null {
  if (s.version !== 1) return null;
  if (!Array.isArray(s.nodes) || !Array.isArray(s.edges) || !Array.isArray(s.zones)) return null;
  return sanitizeMap({
    nodes: s.nodes,
    edges: s.edges,
    zones: s.zones,
    axioms: Array.isArray(s.axioms) ? s.axioms : [],
    proofs: s.proofs && typeof s.proofs === 'object' ? s.proofs : {},
    agentLogs: [],
    nodeIdAliases: s.nodeIdAliases && typeof s.nodeIdAliases === 'object' ? s.nodeIdAliases : {},
  });
}

function loadLegacyLocalStorage(): MapState | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSnapshot;
    return fromSnapshot(parsed);
  } catch {
    return null;
  }
}

/**
 * Merge a persisted graph with the published seed without mixing legacy IDs into
 * an already migrated graph. Partially migrated records are repaired first: all
 * known seed IDs and every reference to them are moved into the canonical SHA-128
 * space before migration or graph validation is allowed to run.
 */
export function mergeCanonicalSeedGraph(loadedState: MapState): MapState {
  const canonicalSeed = migrateMapNodeIdentitySync(sanitizeMap({ ...deepCopyInitialMap() })).map;
  const seedAliases = canonicalSeed.nodeIdAliases ?? {};
  const seedPaths = new Map(canonicalSeed.nodes.map((node) => [node.id, node.canonicalPath]));
  const remap = (id: string): string => seedAliases[id] ?? id;
  const unique = (values: readonly string[]): string[] => [...new Set(values.map(remap))];

  const normalizedInput = sanitizeMap(loadedState);
  const normalizedNodes = normalizedInput.nodes
    .map((node) => ({
      ...node,
      id: remap(node.id),
      canonicalPath: node.canonicalPath ?? seedPaths.get(remap(node.id)),
      dependencyIds: unique(node.dependencyIds ?? []),
      dependentIds: unique(node.dependentIds ?? []),
    }))
    .sort((left, right) => Number(/^[0-9a-f]{32}$/u.test(right.id)) - Number(/^[0-9a-f]{32}$/u.test(left.id)));
  const nodes = [...new Map(normalizedNodes.map((node) => [node.id, node])).values()];
  const nodeIds = new Set(nodes.map((node) => node.id));
  const normalizedEdges = normalizedInput.edges.map((edge) => {
    const fromId = remap(edge.fromId);
    const toId = remap(edge.toId);
    return { ...edge, id: `edge-${fromId}-${toId}`, fromId, toId };
  });
  const edges = [...new Map(normalizedEdges.map((edge) => [edge.id, edge])).values()];
  const zones = normalizedInput.zones.map((zone) => ({ ...zone, nodeIds: unique(zone.nodeIds ?? []) }));
  const axioms = normalizedInput.axioms.map((axiom) => ({
    ...axiom,
    sourceNodeId: remap(axiom.sourceNodeId),
    usedByNodeIds: unique(axiom.usedByNodeIds ?? []),
  }));
  const proofs = Object.fromEntries(Object.entries(normalizedInput.proofs ?? {}).map(([id, proof]) => {
    const nodeId = remap(proof.nodeId || id);
    return [nodeId, { ...proof, nodeId }];
  }));
  const agentLogs = normalizedInput.agentLogs.map((entry) => entry.nodeId ? { ...entry, nodeId: remap(entry.nodeId) } : { ...entry });
  const canonicalized = migrateMapNodeIdentitySync({
    ...normalizedInput,
    nodes,
    edges,
    zones,
    axioms,
    proofs,
    agentLogs,
    nodeIdAliases: { ...(normalizedInput.nodeIdAliases ?? {}), ...seedAliases },
  }).map;

  const existingZoneIds = new Set(canonicalized.zones.map((zone) => zone.id));
  const existingNodeIds = new Set(canonicalized.nodes.map((node) => node.id));
  const existingEdgeIds = new Set(canonicalized.edges.map((edge) => edge.id));
  const mergedNodes = [
    ...canonicalized.nodes,
    ...canonicalSeed.nodes
      .filter((node) => !existingNodeIds.has(node.id))
      .map((node) => ({ ...node, zoneIds: [...node.zoneIds], dependencyIds: [...node.dependencyIds], dependentIds: [...node.dependentIds] })),
  ];
  const mergedNodeIds = new Set(mergedNodes.map((node) => node.id));
  const mergedEdges = [
    ...canonicalized.edges,
    ...canonicalSeed.edges
      .filter((edge) => !existingEdgeIds.has(edge.id) && mergedNodeIds.has(edge.fromId) && mergedNodeIds.has(edge.toId))
      .map((edge) => ({ ...edge })),
  ];
  const mergedZones = [
    ...canonicalized.zones,
    ...canonicalSeed.zones
      .filter((zone) => !existingZoneIds.has(zone.id))
      .map((zone) => ({ ...zone, nodeIds: [...zone.nodeIds], economicProfile: { ...zone.economicProfile } })),
  ];

  return sanitizeMap({ ...canonicalized, nodes: mergedNodes, edges: mergedEdges, zones: mergedZones });
}

/** Загрузка: IndexedDB → миграция из localStorage → canonical SHA-128 seed. */
export async function hydrateInitialState(): Promise<MapState> {
  let fromDb = await dbLoadMap();
  if (fromDb) fromDb = sanitizeMap(fromDb);
  let loadedState: MapState | null = null;

  if (fromDb && fromDb.nodes.length > 0) {
    loadedState = fromDb;
  } else {
    const legacy = loadLegacyLocalStorage();
    if (legacy && legacy.nodes.length > 0) {
      loadedState = legacy;
      try {
        localStorage.removeItem(LEGACY_KEY);
      } catch {
        /* ignore */
      }
    }
  }

  const stateToMigrate = loadedState
    ? mergeCanonicalSeedGraph(loadedState)
    : sanitizeMap({ ...deepCopyInitialMap() });

  // Execute one-time DB migration & audit (fixes titles, repairs orphan node connections to RICIS, rebuilds edges & updates DB version)
  const migrationResult = await runDatabaseMigration(stateToMigrate);
  const identityMigration = await migrateMapNodeIdentity(migrationResult.map);
  const reconciled = reconcileCanonicalCatalog(identityMigration.map);
  if (reconciled !== identityMigration.map || identityMigration.report.migratedNodes > 0) await dbSaveMap(reconciled);
  return reconciled;
}

export async function saveMapToDb(state: MapState): Promise<boolean> {
  try {
    await dbSaveMap(state);
    return true;
  } catch (e) {
    console.error('saveMapToDb', e);
    return false;
  }
}

export async function clearMapDb(): Promise<void> {
  await dbClear();
}

export function exportMapJson(state: MapState): string {
  return JSON.stringify(toSnapshot(state), null, 2);
}

export async function importMapJson(text: string): Promise<MapState | null> {
  try {
    const parsed = JSON.parse(text) as PersistedSnapshot;
    const state = fromSnapshot(parsed);
    if (!state) return null;
    const identityMigration = await migrateMapNodeIdentity(state);
    await dbSaveMap(identityMigration.map);
    return identityMigration.map;
  } catch {
    return null;
  }
}
