import { MapState, Proof, ProblemNode, DependencyEdge, Axiom, ScienceZone } from './types';
import { initialMap } from './initialMap';
import { deepCopyInitialMap } from './initialMap';

import { dbSaveMap, dbLoadMap, dbClear } from './db';
import { runDatabaseMigration } from './migrationAudit';

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
    // Persisted local proof text, static checks and trusted external contracts are
    // diagnostic artifacts only. Hydration may preserve `resolved` exclusively for
    // explicit authoritative Lean evidence recorded as LEAN_VERIFIED.
    const hasAuthoritativeLeanEvidence = proof?.externalLean?.trustStatus === 'LEAN_VERIFIED';
    const honestState = n.state === 'resolved' && !hasAuthoritativeLeanEvidence ? 'partial' : n.state;
    return { ...n, state: honestState, zoneIds: zids };
  });

  const zones = newZones.map(z => {
    const members = nodes.filter(n => n.zoneIds.includes(z.id)).map(n => n.id);
    return { ...z, nodeIds: Array.from(new Set([...(z.nodeIds || []), ...members])) };
  });

  return { ...map, agentLogs: Array.isArray(map.agentLogs) ? map.agentLogs : [], nodes, zones };
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

/** Загрузка: IndexedDB → миграция из localStorage → seed initialMap. */
export async function hydrateInitialState(): Promise<MapState> {
  
  let fromDb = await dbLoadMap();
  if (fromDb) fromDb = sanitizeMap(fromDb);
  let loadedState = null;
  
  if (fromDb && fromDb.nodes.length > 0) {
    loadedState = fromDb;
  } else {
    const legacy = loadLegacyLocalStorage();
    if (legacy && legacy.nodes.length > 0) {
      await dbSaveMap(legacy);
      try {
        localStorage.removeItem(LEGACY_KEY);
      } catch {
        /* ignore */
      }
      loadedState = legacy;
    }
  }

  let stateToMigrate: MapState;

  if (loadedState) {
    // Merge any zones from initialMap that are missing in the loaded state
    const existingZoneIds = new Set(loadedState.zones.map(z => z.id));
    const missingZones = initialMap.zones.filter(z => !existingZoneIds.has(z.id));
    if (missingZones.length > 0) {
      loadedState.zones = [...loadedState.zones, ...missingZones.map(z => ({
        ...z,
        nodeIds: [...z.nodeIds],
        economicProfile: { ...z.economicProfile }
      }))];
    }

    // Merge any nodes from initialMap that are missing in the loaded state
    const existingNodeIds = new Set(loadedState.nodes.map(n => n.id));
    const missingNodes = initialMap.nodes.filter(n => !existingNodeIds.has(n.id));
    if (missingNodes.length > 0) {
      loadedState.nodes = [...loadedState.nodes, ...missingNodes.map(n => ({
        ...n,
        zoneIds: [...(n.zoneIds || ['math'])],
        dependencyIds: [...(n.dependencyIds || [])],
        dependentIds: [...(n.dependentIds || [])],
      }))];
    }

    // Merge any edges from initialMap that are missing in the loaded state
    const existingEdgeIds = new Set(loadedState.edges.map(e => e.id));
    const missingEdges = initialMap.edges.filter(e => !existingEdgeIds.has(e.id));
    if (missingEdges.length > 0) {
      loadedState.edges = [...loadedState.edges, ...missingEdges.map(e => ({ ...e }))];
    }

    stateToMigrate = loadedState;
  } else {
    stateToMigrate = sanitizeMap({
      ...deepCopyInitialMap(),
    });
  }

  // Execute one-time DB migration & audit (fixes titles, repairs orphan node connections to RICIS, rebuilds edges & updates DB version)
  const migrationResult = await runDatabaseMigration(stateToMigrate);
  return migrationResult.map;
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
    await dbSaveMap(state);
    return state;
  } catch {
    return null;
  }
}
