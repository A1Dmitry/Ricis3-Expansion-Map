import type { ProblemNode, ScienceZone } from '../../model/types';

/** Минимальный срез карты, нужный для переназначения сферы задачи. */
export type ZoneAssignableMap = {
  nodes: ProblemNode[];
  zones: ScienceZone[];
};

const DEFAULT_ZONE_PROFILE = {
  costUnresolved: 100000000,
  costToSolve: 10000000,
  marketGain: 500000000,
  riskLoss: 200000000,
};

export type ZoneAssignmentResult = {
  nodes: ProblemNode[];
  zones: ScienceZone[];
  /** Идентификатор сферы, назначенной узлу (существующей или созданной). */
  resolvedZoneId: string;
  /** true, если была создана новая сфера науки. */
  createdZone: boolean;
};

/**
 * Чистое переназначение задачи сфере (паритет с полями создания задачи):
 * - `zoneId` — существующая сфера;
 * - `newZoneName` — создать (или переиспользовать по имени без учёта регистра) новую сферу.
 * Узел удаляется из nodeIds прежней сферы и добавляется в целевую.
 */
export function applyNodeZoneAssignment(
  map: ZoneAssignableMap,
  nodeId: string,
  zoneId?: string,
  newZoneName?: string,
  newZoneIdFactory: () => string = () => `zone-${Date.now()}`,
): ZoneAssignmentResult | null {
  const targetNode = map.nodes.find(node => node.id === nodeId);
  if (!targetNode) return null;

  let zones = [...map.zones];
  let resolvedZoneId = zoneId;
  let createdZone = false;

  if (!resolvedZoneId && newZoneName) {
    const existingZone = zones.find(
      zone => zone.name.toLowerCase() === newZoneName.toLowerCase(),
    );
    if (existingZone) {
      resolvedZoneId = existingZone.id;
    } else {
      resolvedZoneId = newZoneIdFactory();
      zones.push({
        id: resolvedZoneId,
        name: newZoneName,
        description: '',
        nodeIds: [],
        economicProfile: { ...DEFAULT_ZONE_PROFILE },
      });
      createdZone = true;
    }
  }

  if (!resolvedZoneId || !zones.some(zone => zone.id === resolvedZoneId)) return null;

  const nodes = map.nodes.map(node =>
    node.id === nodeId ? { ...node, zoneIds: [resolvedZoneId as string] } : node,
  );

  const updatedZones = zones.map(zone => {
    const withoutNode = zone.nodeIds.filter(id => id !== nodeId);
    if (zone.id === resolvedZoneId) {
      return { ...zone, nodeIds: [...withoutNode, nodeId] };
    }
    return withoutNode.length === zone.nodeIds.length ? zone : { ...zone, nodeIds: withoutNode };
  });

  return { nodes, zones: updatedZones, resolvedZoneId, createdZone };
}
