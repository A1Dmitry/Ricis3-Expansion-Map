import type { Axiom, AgentLogEntry, DependencyEdge, MapState, ProblemNode, Proof, ScienceZone } from './types';

export const SHA128_ALGORITHM = 'sha256-truncated-128';
export const SHA128_HEX_LENGTH = 32;
export const SHA128_BYTE_LENGTH = 16;

export interface NodeIdentityMigrationResult {
  readonly map: MapState;
  readonly aliases: Readonly<Record<string, string>>;
  readonly report: {
    readonly migratedNodes: number;
    readonly remappedReferences: number;
    readonly canonicalPathCount: number;
    readonly aliasCount: number;
    readonly algorithm: typeof SHA128_ALGORITHM;
  };
}

export type NodeIdentityMigrationError =
  | { readonly kind: 'identity_collision'; readonly paths: readonly string[]; readonly legacyIds: readonly string[] }
  | { readonly kind: 'dangling_reference'; readonly field: string; readonly legacyId: string }
  | { readonly kind: 'orphan_component'; readonly legacyIds: readonly string[] };

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
] as const;

const SHA256_INITIAL = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
] as const;

function rotateRight(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

function sha256Bytes(input: Uint8Array): Uint8Array {
  const bitLength = input.length * 8;
  const paddedLength = (((input.length + 9 + 63) >>> 6) << 6);
  const padded = new Uint8Array(paddedLength);
  padded.set(input);
  padded[input.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 4, bitLength >>> 0, false);
  view.setUint32(padded.length - 8, Math.floor(bitLength / 0x100000000) >>> 0, false);

  const hash = new Uint32Array(SHA256_INITIAL);
  const schedule = new Uint32Array(64);
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) schedule[index] = view.getUint32(offset + index * 4, false);
    for (let index = 16; index < 64; index += 1) {
      const valueA = schedule[index - 15];
      const valueB = schedule[index - 2];
      const sigma0 = rotateRight(valueA, 7) ^ rotateRight(valueA, 18) ^ (valueA >>> 3);
      const sigma1 = rotateRight(valueB, 17) ^ rotateRight(valueB, 19) ^ (valueB >>> 10);
      schedule[index] = (schedule[index - 16] + sigma0 + schedule[index - 7] + sigma1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const sigma1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 = (h + sigma1 + choice + SHA256_K[index]! + schedule[index]!) >>> 0;
      const sigma0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (sigma0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    hash[0] = (hash[0]! + a) >>> 0;
    hash[1] = (hash[1]! + b) >>> 0;
    hash[2] = (hash[2]! + c) >>> 0;
    hash[3] = (hash[3]! + d) >>> 0;
    hash[4] = (hash[4]! + e) >>> 0;
    hash[5] = (hash[5]! + f) >>> 0;
    hash[6] = (hash[6]! + g) >>> 0;
    hash[7] = (hash[7]! + h) >>> 0;
  }

  const result = new Uint8Array(32);
  const resultView = new DataView(result.buffer);
  hash.forEach((value, index) => resultView.setUint32(index * 4, value, false));
  return result;
}

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function hex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function decodeHex(id: string): Uint8Array {
  if (!/^[0-9a-f]{32}$/i.test(id)) throw new Error('invalid_sha128_hex');
  const bytes = new Uint8Array(16);
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = Number.parseInt(id.slice(index * 2, index * 2 + 2), 16);
  return bytes;
}

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64(bytes: Uint8Array): string {
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index]!;
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    const combined = (first << 16) | ((second ?? 0) << 8) | (third ?? 0);
    output += BASE64[(combined >>> 18) & 63];
    output += BASE64[(combined >>> 12) & 63];
    output += second === undefined ? '=' : BASE64[(combined >>> 6) & 63];
    output += third === undefined ? '=' : BASE64[combined & 63];
  }
  return output;
}

function pathSegment(value: string): string {
  const normalized = value.normalize('NFKC').trim().toLocaleLowerCase('en-US');
  const segment = normalized.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
  return segment || 'untitled';
}

export function normalizeCanonicalPath(path: string): string {
  const segments = path.replace(/\\/g, '/').split('/').map((segment) => segment.trim()).filter((segment) => segment && segment !== '.');
  const normalized = segments.filter((segment) => segment !== '..').map(pathSegment);
  return `/${normalized.join('/')}`;
}

export async function sha256Truncated128Hex(canonicalPath: string): Promise<string> {
  const digest = sha256Bytes(utf8(normalizeCanonicalPath(canonicalPath)));
  return hex(digest.slice(0, SHA128_BYTE_LENGTH));
}

export function base64FromSha128Hex(id: string): string {
  return base64(decodeHex(id));
}

function nodeById(map: MapState): Map<string, ProblemNode> {
  return new Map(map.nodes.map((node) => [node.id, node]));
}

function createCanonicalPaths(map: MapState): Map<string, string> {
  const nodes = nodeById(map);
  const memo = new Map<string, string>();
  const visiting = new Set<string>();

  const resolve = (id: string): string => {
    const existing = memo.get(id);
    if (existing) return existing;
    const node = nodes.get(id);
    if (!node) throw { kind: 'orphan_component', legacyIds: [id] } satisfies NodeIdentityMigrationError;
    if (node.canonicalPath) {
      const persisted = normalizeCanonicalPath(node.canonicalPath);
      memo.set(id, persisted);
      return persisted;
    }
    if (visiting.has(id)) return `/cycle/${pathSegment(node.title)}`;
    visiting.add(id);
    const parents = (node.dependencyIds ?? []).filter((dependencyId) => nodes.has(dependencyId));
    if ((node.dependencyIds ?? []).some((dependencyId) => !nodes.has(dependencyId))) {
      const missing = node.dependencyIds.find((dependencyId) => !nodes.has(dependencyId))!;
      throw { kind: 'dangling_reference', field: 'dependencyIds', legacyId: missing } satisfies NodeIdentityMigrationError;
    }
    const candidates = parents.length === 0
      ? [`/${pathSegment(node.title)}`]
      : parents.map((parentId) => `${resolve(parentId)}/${pathSegment(node.title)}`);
    const selected = normalizeCanonicalPath([...candidates].sort()[0]!);
    visiting.delete(id);
    memo.set(id, selected);
    return selected;
  };

  map.nodes.forEach((node) => resolve(node.id));
  return memo;
}

function mapReference(id: string, aliases: Readonly<Record<string, string>>): string {
  const mapped = aliases[id];
  if (!mapped) throw { kind: 'dangling_reference', field: 'reference', legacyId: id } satisfies NodeIdentityMigrationError;
  return mapped;
}

function mapReferences(values: readonly string[], aliases: Readonly<Record<string, string>>): string[] {
  return [...new Set(values.map((value) => mapReference(value, aliases)))];
}

function rewriteNode(node: ProblemNode, id: string, path: string, aliases: Readonly<Record<string, string>>): ProblemNode {
  return {
    ...node,
    id,
    canonicalPath: path,
    dependencyIds: mapReferences(node.dependencyIds ?? [], aliases),
    dependentIds: mapReferences(node.dependentIds ?? [], aliases),
  };
}

function rewriteEdge(edge: DependencyEdge, aliases: Readonly<Record<string, string>>): DependencyEdge {
  return { ...edge, fromId: mapReference(edge.fromId, aliases), toId: mapReference(edge.toId, aliases) };
}

function rewriteZone(zone: ScienceZone, aliases: Readonly<Record<string, string>>): ScienceZone {
  return { ...zone, nodeIds: mapReferences(zone.nodeIds ?? [], aliases) };
}

function rewriteAxiom(axiom: Axiom, aliases: Readonly<Record<string, string>>): Axiom {
  return { ...axiom, sourceNodeId: mapReference(axiom.sourceNodeId, aliases), usedByNodeIds: mapReferences(axiom.usedByNodeIds ?? [], aliases) };
}

function rewriteProofs(proofs: Record<string, Proof>, aliases: Readonly<Record<string, string>>): Record<string, Proof> {
  return Object.fromEntries(Object.entries(proofs).map(([legacyId, proof]) => {
    const id = mapReference(legacyId, aliases);
    return [id, { ...proof, nodeId: mapReference(proof.nodeId, aliases) }];
  }));
}

function rewriteLogs(logs: readonly AgentLogEntry[], aliases: Readonly<Record<string, string>>): AgentLogEntry[] {
  return logs.map((entry) => entry.nodeId ? { ...entry, nodeId: mapReference(entry.nodeId, aliases) } : { ...entry });
}

function isMigrated(map: MapState): boolean {
  return map.nodes.every((node) => /^[0-9a-f]{32}$/.test(node.id) && typeof node.canonicalPath === 'string' && node.canonicalPath.startsWith('/'));
}

export async function migrateMapNodeIdentity(map: MapState): Promise<NodeIdentityMigrationResult> {
  if (isMigrated(map)) {
    const aliases = map.nodeIdAliases ?? {};
    return {
      map,
      aliases,
      report: { migratedNodes: 0, remappedReferences: 0, canonicalPathCount: map.nodes.length, aliasCount: Object.keys(aliases).length, algorithm: SHA128_ALGORITHM },
    };
  }

  const paths = createCanonicalPaths(map);
  const aliases: Record<string, string> = {};
  const pathOwners = new Map<string, string>();
  const idOwners = new Map<string, string>();
  for (const node of map.nodes) {
    const canonicalPath = paths.get(node.id)!;
    const pathOwner = pathOwners.get(canonicalPath);
    if (pathOwner && pathOwner !== node.id) throw { kind: 'identity_collision', paths: [canonicalPath], legacyIds: [pathOwner, node.id] } satisfies NodeIdentityMigrationError;
    pathOwners.set(canonicalPath, node.id);
    const newId = await sha256Truncated128Hex(canonicalPath);
    const idOwner = idOwners.get(newId);
    if (idOwner && idOwner !== node.id) throw { kind: 'identity_collision', paths: [canonicalPath, paths.get(idOwner)!], legacyIds: [idOwner, node.id] } satisfies NodeIdentityMigrationError;
    idOwners.set(newId, node.id);
    aliases[node.id] = newId;
  }

  const nodes = map.nodes.map((node) => rewriteNode(node, aliases[node.id]!, paths.get(node.id)!, aliases));
  const edges = map.edges.map((edge) => rewriteEdge(edge, aliases));
  const zones = map.zones.map((zone) => rewriteZone(zone, aliases));
  const axioms = map.axioms.map((axiom) => rewriteAxiom(axiom, aliases));
  const proofs = rewriteProofs(map.proofs ?? {}, aliases);
  const agentLogs = rewriteLogs(map.agentLogs ?? [], aliases);
  const migrated: MapState = { ...map, nodes, edges, zones, axioms, proofs, agentLogs, nodeIdAliases: { ...(map.nodeIdAliases ?? {}), ...aliases } };

  return {
    map: migrated,
    aliases,
    report: { migratedNodes: nodes.length, remappedReferences: edges.length + nodes.reduce((count, node) => count + node.dependencyIds.length + node.dependentIds.length, 0), canonicalPathCount: paths.size, aliasCount: Object.keys(aliases).length, algorithm: SHA128_ALGORITHM },
  };
}
