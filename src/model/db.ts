
function clearMemoryStores() {
  memoryStores.nodes.clear();
  memoryStores.edges.clear();
  memoryStores.zones.clear();
  memoryStores.axioms.clear();
  memoryStores.proofs.clear();
}
/**
 * Документная БД карты RICIS-III на IndexedDB.
 * Каждый узел, ребро, доказательство и аксиома — отдельная JSON-запись.
 * IndexedDB лучше localStorage для объёмных структурированных документов
 * и подходит как клиентский аналог document-store (MongoDB / JSONB).
 * Поддерживает безопасный in-memory фолбэк для Node.js / Cloud Run сервера.
 */

import type {
  MapState,
  ProblemNode,
  DependencyEdge,
  ScienceZone,
  Axiom,
  Proof,
} from './types';

const DB_NAME = 'ricis3-map-db';
const DB_VERSION = 1;

const STORES = {
  nodes: 'nodes',
  edges: 'edges',
  zones: 'zones',
  axioms: 'axioms',
  proofs: 'proofs',
  meta: 'meta',
} as const;

type StoreName = (typeof STORES)[keyof typeof STORES];

let isIndexedDbAvailable = false;
try {
  if (typeof indexedDB !== 'undefined' && indexedDB !== null) {
    // Just reference it to check for any SecurityError/exceptions
    const dummy = indexedDB;
    isIndexedDbAvailable = true;
  }
} catch (e) {
  isIndexedDbAvailable = false;
}

// In-memory fallback for Node.js server runtime where indexedDB is not available
const memoryStores: Record<string, Map<string, any>> = {
  nodes: new Map(),
  edges: new Map(),
  zones: new Map(),
  axioms: new Map(),
  proofs: new Map(),
  meta: new Map(),
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDbAvailable) {
      return reject(new Error('IndexedDB is not available in server environment'));
    }
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = () => {
        const db = req.result;

        if (!db.objectStoreNames.contains(STORES.nodes)) {
          const nodes = db.createObjectStore(STORES.nodes, { keyPath: 'id' });
          nodes.createIndex('by_state', 'state', { unique: false });
          nodes.createIndex('by_zone', 'zoneIds', { unique: false, multiEntry: true });
          nodes.createIndex('by_depth', 'fractalDepth', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.edges)) {
          const edges = db.createObjectStore(STORES.edges, { keyPath: 'id' });
          edges.createIndex('by_from', 'fromId', { unique: false });
          edges.createIndex('by_to', 'toId', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.zones)) {
          db.createObjectStore(STORES.zones, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.axioms)) {
          const axioms = db.createObjectStore(STORES.axioms, { keyPath: 'id' });
          axioms.createIndex('by_source', 'sourceNodeId', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.proofs)) {
          // keyPath = nodeId (одно доказательство на узел)
          db.createObjectStore(STORES.proofs, { keyPath: 'nodeId' });
        }

        if (!db.objectStoreNames.contains(STORES.meta)) {
          db.createObjectStore(STORES.meta, { keyPath: 'key' });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        isIndexedDbAvailable = false;
        reject(req.error ?? new Error('IndexedDB open failed'));
      };
    } catch (e) {
      isIndexedDbAvailable = false;
      reject(e);
    }
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}

async function clearStore(db: IDBDatabase, name: StoreName): Promise<void> {
  const tx = db.transaction(name, 'readwrite');
  tx.objectStore(name).clear();
  await txDone(tx);
}

async function putAll<T>(db: IDBDatabase, name: StoreName, items: T[]): Promise<void> {
  const tx = db.transaction(name, 'readwrite');
  const store = tx.objectStore(name);
  for (const item of items) {
    store.put(item);
  }
  await txDone(tx);
}

async function getAll<T>(db: IDBDatabase, name: StoreName): Promise<T[]> {
  const tx = db.transaction(name, 'readonly');
  const result = await reqToPromise(tx.objectStore(name).getAll());
  await txDone(tx);
  return result as T[];
}

/** Полная запись карты: каждый узел — отдельный JSON-документ. */
export async function dbSaveMap(state: MapState): Promise<void> {
  const saveToMemory = () => {
    clearMemoryStores();
    for (const node of state.nodes) memoryStores.nodes.set(node.id, node);
    for (const edge of state.edges) memoryStores.edges.set(edge.id, edge);
    for (const zone of state.zones) memoryStores.zones.set(zone.id, zone);
    for (const axiom of state.axioms) memoryStores.axioms.set(axiom.id, axiom);
    for (const proof of Object.values(state.proofs)) memoryStores.proofs.set(proof.nodeId, proof);
    memoryStores.meta.set('snapshot', {
      key: 'snapshot',
      version: 1,
      savedAt: new Date().toISOString(),
      nodeCount: state.nodes.length,
      proofCount: Object.keys(state.proofs).length,
    });
  };

  if (!isIndexedDbAvailable) {
    saveToMemory();
    return;
  }

  try {
    const db = await openDb();
    try {
      const storeNames: StoreName[] = [
        STORES.nodes,
        STORES.edges,
        STORES.zones,
        STORES.axioms,
        STORES.proofs,
        STORES.meta,
      ];
      const tx = db.transaction(storeNames, 'readwrite');

      tx.objectStore(STORES.nodes).clear();
      tx.objectStore(STORES.edges).clear();
      tx.objectStore(STORES.zones).clear();
      tx.objectStore(STORES.axioms).clear();
      tx.objectStore(STORES.proofs).clear();

      for (const node of state.nodes) {
        tx.objectStore(STORES.nodes).put(node);
      }
      for (const edge of state.edges) {
        tx.objectStore(STORES.edges).put(edge);
      }
      for (const zone of state.zones) {
        tx.objectStore(STORES.zones).put(zone);
      }
      for (const axiom of state.axioms) {
        tx.objectStore(STORES.axioms).put(axiom);
      }
      for (const proof of Object.values(state.proofs)) {
        tx.objectStore(STORES.proofs).put(proof);
      }
      tx.objectStore(STORES.meta).put({
        key: 'snapshot',
        version: 1,
        savedAt: new Date().toISOString(),
        nodeCount: state.nodes.length,
        proofCount: Object.keys(state.proofs).length,
      });

      await txDone(tx);
    } finally {
      db.close();
    }
  } catch (err) {
    console.warn('IndexedDB write failed, falling back to memoryStores', err);
    isIndexedDbAvailable = false;
    saveToMemory();
  }
}

/** Восстановление полной карты из документных store. */
export async function dbLoadMap(): Promise<MapState | null> {
  const loadFromMemory = () => {
    const nodes = Array.from(memoryStores.nodes.values());
    if (nodes.length === 0) return null;
    const edges = Array.from(memoryStores.edges.values());
    const zones = Array.from(memoryStores.zones.values());
    const axioms = Array.from(memoryStores.axioms.values());
    const proofList = Array.from(memoryStores.proofs.values());
    const proofs: Record<string, Proof> = {};
    for (const p of proofList) proofs[p.nodeId] = p;
    return { nodes, edges, zones, axioms, proofs, agentLogs: [] };
  };

  if (!isIndexedDbAvailable) {
    return loadFromMemory();
  }

  try {
    const db = await openDb();
    try {
      const nodes = await getAll<ProblemNode>(db, STORES.nodes);
      if (nodes.length === 0) return null;

      const edges = await getAll<DependencyEdge>(db, STORES.edges);
      const zones = await getAll<ScienceZone>(db, STORES.zones);
      const axioms = await getAll<Axiom>(db, STORES.axioms);
      const proofList = await getAll<Proof>(db, STORES.proofs);

      const proofs: Record<string, Proof> = {};
      for (const p of proofList) {
        proofs[p.nodeId] = p;
      }

      return { nodes, edges, zones, axioms, proofs, agentLogs: [] };
    } finally {
      db.close();
    }
  } catch (err) {
    console.warn('IndexedDB load failed, falling back to memoryStores', err);
    isIndexedDbAvailable = false;
    return loadFromMemory();
  }
}

export async function dbClear(): Promise<void> {
  if (!isIndexedDbAvailable) {
    clearMemoryStores();
    memoryStores.meta.clear();
    return;
  }

  try {
    const db = await openDb();
    try {
      await clearStore(db, STORES.nodes);
      await clearStore(db, STORES.edges);
      await clearStore(db, STORES.zones);
      await clearStore(db, STORES.axioms);
      await clearStore(db, STORES.proofs);
      await clearStore(db, STORES.meta);
    } finally {
      db.close();
    }
  } catch (err) {
    console.warn('IndexedDB clear failed, falling back to memoryStores', err);
    isIndexedDbAvailable = false;
    clearMemoryStores();
    memoryStores.meta.clear();
  }
}

/** Запись / обновление одного узла (JSON-документ). */
export async function dbPutNode(node: ProblemNode): Promise<void> {
  if (!isIndexedDbAvailable) {
    memoryStores.nodes.set(node.id, node);
    return;
  }

  const db = await openDb();
  try {
    const tx = db.transaction(STORES.nodes, 'readwrite');
    tx.objectStore(STORES.nodes).put(node);
    await txDone(tx);
  } finally {
    db.close();
  }
}

/** Запись доказательства узла (шаги, целевая функция, результат). */
export async function dbPutProof(proof: Proof): Promise<void> {
  if (!isIndexedDbAvailable) {
    memoryStores.proofs.set(proof.nodeId, proof);
    return;
  }

  const db = await openDb();
  try {
    const tx = db.transaction(STORES.proofs, 'readwrite');
    tx.objectStore(STORES.proofs).put(proof);
    await txDone(tx);
  } finally {
    db.close();
  }
}

export async function dbGetNode(id: string): Promise<ProblemNode | undefined> {
  if (!isIndexedDbAvailable) {
    return memoryStores.nodes.get(id);
  }

  const db = await openDb();
  try {
    const tx = db.transaction(STORES.nodes, 'readonly');
    return await reqToPromise(tx.objectStore(STORES.nodes).get(id));
  } finally {
    db.close();
  }
}

export async function dbGetProof(nodeId: string): Promise<Proof | undefined> {
  if (!isIndexedDbAvailable) {
    return memoryStores.proofs.get(nodeId);
  }

  const db = await openDb();
  try {
    const tx = db.transaction(STORES.proofs, 'readonly');
    return await reqToPromise(tx.objectStore(STORES.proofs).get(nodeId));
  } finally {
    db.close();
  }
}

export async function dbGetMigrationState(): Promise<{ version: number; auditedAt?: string; report?: any } | null> {
  if (!isIndexedDbAvailable) {
    const row = memoryStores.meta.get('migration_state');
    return row ? { version: row.version ?? 0, auditedAt: row.auditedAt, report: row.report } : null;
  }

  const db = await openDb();
  try {
    const tx = db.transaction(STORES.meta, 'readonly');
    const row = await reqToPromise(
      tx.objectStore(STORES.meta).get('migration_state') as IDBRequest<{
        key: string;
        version: number;
        auditedAt?: string;
        report?: any;
      }>
    );
    return row ? { version: row.version ?? 0, auditedAt: row.auditedAt, report: row.report } : null;
  } finally {
    db.close();
  }
}

export async function dbSetMigrationState(version: number, report?: any): Promise<void> {
  if (!isIndexedDbAvailable) {
    memoryStores.meta.set('migration_state', {
      key: 'migration_state',
      version,
      auditedAt: new Date().toISOString(),
      report,
    });
    return;
  }

  const db = await openDb();
  try {
    const tx = db.transaction(STORES.meta, 'readwrite');
    tx.objectStore(STORES.meta).put({
      key: 'migration_state',
      version,
      auditedAt: new Date().toISOString(),
      report,
    });
    await txDone(tx);
  } finally {
    db.close();
  }
}

export async function dbGetAgentTrainingMemory(): Promise<any | null> {
  if (!isIndexedDbAvailable) {
    const row = memoryStores.meta.get('agent_training_memory');
    return row ? row.data : null;
  }

  const db = await openDb();
  try {
    const tx = db.transaction(STORES.meta, 'readonly');
    const row = await reqToPromise(
      tx.objectStore(STORES.meta).get('agent_training_memory') as IDBRequest<{
        key: string;
        data: any;
      }>
    );
    return row ? row.data : null;
  } finally {
    db.close();
  }
}

export async function dbSetAgentTrainingMemory(memory: any): Promise<void> {
  if (!isIndexedDbAvailable) {
    memoryStores.meta.set('agent_training_memory', {
      key: 'agent_training_memory',
      data: memory,
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  const db = await openDb();
  try {
    const tx = db.transaction(STORES.meta, 'readwrite');
    tx.objectStore(STORES.meta).put({
      key: 'agent_training_memory',
      data: memory,
      updatedAt: new Date().toISOString(),
    });
    await txDone(tx);
  } finally {
    db.close();
  }
}

export async function dbMeta(): Promise<{ savedAt?: string; nodeCount?: number; proofCount?: number } | null> {
  if (!isIndexedDbAvailable) {
    return memoryStores.meta.get('snapshot') ?? null;
  }

  const db = await openDb();
  try {
    const tx = db.transaction(STORES.meta, 'readonly');
    const row = await reqToPromise(
      tx.objectStore(STORES.meta).get('snapshot') as IDBRequest<{
        key: string;
        savedAt?: string;
        nodeCount?: number;
        proofCount?: number;
      }>
    );
    return row ?? null;
  } finally {
    db.close();
  }
}

/**
 * ИНТЕРФЕЙС UNIT OF WORK (UOW)
 * Представляет собой транзакционно-безопасную единицу работы для IndexedDB.
 * Обеспечивает атомарность группы изменений без разрыва связей или блокировки треда.
 */
export interface UnitOfWork {
  nodesToPut?: ProblemNode[];
  proofsToPut?: Proof[];
  nodesToDelete?: string[];
  proofsToDelete?: string[];
}

/**
 * Фиксация изменений (Commit) в рамках Unit of Work в единой изолированной транзакции.
 */
export async function dbCommitUnitOfWork(uow: UnitOfWork): Promise<void> {
  const nodesToPut = uow.nodesToPut || [];
  const proofsToPut = uow.proofsToPut || [];
  const nodesToDelete = uow.nodesToDelete || [];
  const proofsToDelete = uow.proofsToDelete || [];

  if (!isIndexedDbAvailable) {
    for (const node of nodesToPut) memoryStores.nodes.set(node.id, node);
    for (const proof of proofsToPut) memoryStores.proofs.set(proof.nodeId, proof);
    for (const id of nodesToDelete) memoryStores.nodes.delete(id);
    for (const id of proofsToDelete) memoryStores.proofs.delete(id);
    return;
  }

  const db = await openDb();
  try {
    const activeStores: StoreName[] = [STORES.nodes, STORES.proofs];
    const tx = db.transaction(activeStores, 'readwrite');
    const nodeStore = tx.objectStore(STORES.nodes);
    const proofStore = tx.objectStore(STORES.proofs);

    for (const node of nodesToPut) {
      nodeStore.put(node);
    }
    for (const proof of proofsToPut) {
      proofStore.put(proof);
    }
    for (const id of nodesToDelete) {
      nodeStore.delete(id);
    }
    for (const id of proofsToDelete) {
      proofStore.delete(id);
    }

    await txDone(tx);
  } finally {
    db.close();
  }
}

