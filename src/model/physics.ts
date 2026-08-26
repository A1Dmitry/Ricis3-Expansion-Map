import { ProblemNode, ScienceZone, MapState, DependencyEdge, Vector3D } from './types';

/**
 * Равномерно распределяет векторы направлений осей конусов на единичной сфере S^2 позолоченному сечению (3D Fibonacci Sphere Algorithm).
 */
export function computeEvenSphereDirections(count: number): Vector3D[] {
  if (count <= 0) return [];
  const directions: Vector3D[] = [];
  const phiGolden = Math.PI * (1 + Math.sqrt(5)); // ~2.3999632297286533
  for (let i = 0; i < count; i++) {
    const y = 1 - (2 * (i + 0.5)) / count; // y равномерно меняется от 1 до -1
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = phiGolden * i;
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    const len = Math.sqrt(x * x + y * y + z * z) || 1.0;
    directions.push({ x: x / len, y: y / len, z: z / len });
  }
  return directions;
}

/**
 * Физика экранирования и внешнего давления (Модель Катющика).
 *
 * Радиус R равен Массе M (M = R), Диаметр D = 2*R.
 * Экранирование массой (диаметром): Масса M экранирует внешнее эфирное давление Pext.
 * Fext_i = -Pext * Si * normalize(x_i)
 * Frep_ij = k * (Si * Sj) / r^2 * normalize(x_i - x_j)
 * Орбиты узлов сжимаются в плоские экваториальные диски (ПЛОСКИЕ ОРБИТЫ / ЭФИРНОЕ КОЛЬЦО).
 */

export function nodeShielding(node: ProblemNode, allNodes?: ProblemNode[]): number {
  // По Катющику: Радиус = Масса (M = R), Диаметр = 2*R.
  const mass = nodeVisualRadius(node, allNodes || [node]); // M = R
  const diameter = mass * 2; // D = 2*R
  
  const eco =
    Math.log10(1 + node.economic.costUnresolved) * 0.15 +
    Math.log10(1 + node.economic.riskLoss) * 0.12 +
    Math.log10(1 + node.economic.marketGain) * 0.1;
  const deps = 0.08 * (node.dependencyIds?.length || 0) + 0.05 * (node.dependentIds?.length || 0);
  const typeBoost =
    node.type === 'core_singularity' ? 1.4 : node.type === 'scientific_task' ? 1.0 : 0.85;
  const stateBoost =
    node.state === 'resolved' ? 0.7 : node.state === 'partial' ? 1.05 : 1.0;
  const reward =
    node.rewardClass === 'clay'
      ? 1.35
      : node.rewardClass === 'nobel'
      ? 1.3
      : node.rewardClass === 'commercial'
      ? 1.1
      : 1.0;

  // Экранирование массой/диаметром: S_i пропорционально массе M (R)
  return Math.max(0.35, mass * (0.55 + eco + deps) * typeBoost * stateBoost * reward);
}

export function zoneShielding(zone: ScienceZone, nodes: ProblemNode[]): number {
  const members = nodes.filter(n => {
    const primaryId = (n.zoneIds && n.zoneIds[0]) ? n.zoneIds[0] : 'math';
    return primaryId === zone.id;
  });
  if (members.length === 0) {
    return 0.8 + Math.log10(1 + zone.economicProfile.costUnresolved) * 0.1;
  }
  // Суммарное экранирование массой всех составляющих узлов ядра/электронов
  const sumS = members.reduce((a, n) => a + nodeShielding(n, nodes), 0);
  const nBoost = Math.pow(members.length, 0.45);
  return Math.max(0.8, sumS * 0.35 + nBoost * 0.9);
}

function normalize3(x: number, y: number, z: number): [number, number, number] {
  const len = Math.sqrt(x * x + y * y + z * z) + 1e-9;
  return [x / len, y / len, z / len];
}


function eulerIntegrate(
  n: number,
  dt: number,
  damping: number,
  masses: number[] | Float64Array | ((i: number) => number),
  pos: [number, number, number][],
  vel: [number, number, number][],
  forces: [number, number, number][]
) {
  for (let i = 0; i < n; i++) {
    const massI = typeof masses === 'function' ? masses(i) : masses[i];
    vel[i][0] = (vel[i][0] + (forces[i][0] / massI) * dt) * damping;
    vel[i][1] = (vel[i][1] + (forces[i][1] / massI) * dt) * damping;
    vel[i][2] = (vel[i][2] + (forces[i][2] / massI) * dt) * damping;
    pos[i][0] += vel[i][0] * dt;
    pos[i][1] += vel[i][1] * dt;
    pos[i][2] += vel[i][2] * dt;
  }
}

export interface PhysicsParams {
  zoneG: number;
  zoneGExt: number;
  zoneSurfaceGap: number;
  nodeG: number;
  nodeGExt: number;
  springK: number;
  springRestGapMult: number;
  minNodeSurfaceGap: number;
  edgeOpacity: number;
}

export const DEFAULT_PHYSICS_PARAMS: PhysicsParams = {
  zoneG: 15.0,
  zoneGExt: 20.0,
  zoneSurfaceGap: 30.0,
  nodeG: 15.0,
  nodeGExt: 4.0,
  springK: 0.5,
  springRestGapMult: 2.0,
  minNodeSurfaceGap: 12.0,
  edgeOpacity: 0.5,
};

export interface PressureLayoutParams {
  Pext: number;
  kRep: number;
  steps: number;
  dt: number;
  damping: number;
  soft: number;
  r0: number;
}

const DEFAULT_ZONE: PressureLayoutParams = {
  Pext: 0.00315, // Уменьшенное на 10% внешнее давление среды
  kRep: 250,     // Экранирующее отталкивание между зонами
  steps: 160,
  dt: 0.45,
  damping: 0.84,
  soft: 1.4,
  r0: 16,
};

const DEFAULT_NODE: PressureLayoutParams = {
  Pext: 0.0054,  // Уменьшенное на 10% давление среды внутри научной зоны
  kRep: 880,     // Сила отталкивания между нодами увеличена ещё в 2 раза
  steps: 140,
  dt: 0.4,
  damping: 0.82,
  soft: 0.55,
  r0: 4.5,
};

export function relaxPressureRepulsion(
  n: number,
  S: number[],
  params: PressureLayoutParams,
  seedPos?: [number, number, number][]
): [number, number, number][] {
  if (n === 0) return [];

  const pos: [number, number, number][] =
    seedPos && seedPos.length === n
      ? seedPos.map(p => [p[0], p[1], p[2]] as [number, number, number])
      : Array.from({ length: n }, (_, i) => {
          const phi = Math.acos(1 - (2 * (i + 0.5)) / n);
          const theta = Math.PI * (1 + Math.sqrt(5)) * i;
          const meanS = S.reduce((a, b) => a + b, 0) / n + 1e-6;
          const r = params.r0 * (0.85 + 0.15 * (S[i] / meanS));
          return [
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi) * 0.55,
          ] as [number, number, number];
        });

  const vel = pos.map(() => [0, 0, 0] as [number, number, number]);
  const { Pext, kRep, steps, dt, damping, soft } = params;

  for (let s = 0; s < steps; s++) {
    for (let i = 0; i < n; i++) {
      const Si = S[i];
      // Spring attraction to origin
      let fx = -Pext * Si * pos[i][0];
      let fy = -Pext * Si * pos[i][1];
      let fz = -Pext * Si * pos[i][2];

      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const dx = pos[i][0] - pos[j][0];
        const dy = pos[i][1] - pos[j][1];
        const dz = pos[i][2] - pos[j][2];
        const r2 = dx * dx + dy * dy + dz * dz + soft * soft;
        const invR = 1 / Math.sqrt(r2);
        const mag = (kRep * (Si * S[j])) / r2;
        fx += dx * invR * mag;
        fy += dy * invR * mag;
        fz += dz * invR * mag;
      }

      vel[i][0] = (vel[i][0] + fx * dt) * damping;
      vel[i][1] = (vel[i][1] + fy * dt) * damping;
      vel[i][2] = (vel[i][2] + fz * dt) * damping;
    }
    for (let i = 0; i < n; i++) {
      pos[i][0] += vel[i][0] * dt;
      pos[i][1] += vel[i][1] * dt;
      pos[i][2] += vel[i][2] * dt;
    }
  }

  return pos;
}

export function layoutZones(
  zones: ScienceZone[],
  nodes: ProblemNode[],
  customParams?: Partial<PhysicsParams>
): Record<string, [number, number, number]> {
  const p = { ...DEFAULT_PHYSICS_PARAMS, ...customParams };
  const n = zones.length;
  if (n === 0) return {};

  const zoneR = zones.map(z => zoneVisualRadius(z, nodes));
  const masses = zoneR.map(R => (R * R * R) / 1000.0 + 1.0);
  
  // Умножаем массу обратно на 1000 чтобы получить реальный кубический объем
  const actualVolume = masses.reduce((sum, m) => sum + (m * 1000.0), 0);
  
  // Радиус сферы, которая вместит все зоны (x2 для запаса)
  const GLOBAL_SPACE_RADIUS = Math.max(300, Math.cbrt(actualVolume * 0.75 / Math.PI) * 2.5);

  // Initial spherical distribution
  const pos: [number, number, number][] = Array.from({ length: n }, (_, i) => {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / n);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = GLOBAL_SPACE_RADIUS * 0.5; // start somewhere in the middle
    return [
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
    ] as [number, number, number];
  });

   // Зазор между макро-пузырями

  const vel: [number, number, number][] = Array.from({ length: n }, () => [0, 0, 0]);
  const dt = 0.2;
  const damping = 0.82;
  const STEPS = 80;

  // Взаимное расталкивание между всеми пузырями + Внешнее макро-давление среды (Адаптивное затухание)
  for (let iter = 0; iter < STEPS; iter++) {
    const forces: [number, number, number][] = Array.from({ length: n }, () => [0, 0, 0]);

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pos[i][0] - pos[j][0];
        const dy = pos[i][1] - pos[j][1];
        const dz = pos[i][2] - pos[j][2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-6;

        const surfaceDist = Math.max(0.1, dist - zoneR[i] - zoneR[j]);
        
        const G = p.zoneG;
        let forceMag = (G * 12.0 * masses[i] * masses[j]) / (surfaceDist * surfaceDist + 20.0);
        
        if (surfaceDist < p.zoneSurfaceGap) {
          forceMag += (p.zoneSurfaceGap - surfaceDist) * 15.0;
        }

        const nx = dx / dist;
        const ny = dy / dist;
        const nz = dz / dist;

        forces[i][0] += nx * forceMag;
        forces[i][1] += ny * forceMag;
        forces[i][2] += nz * forceMag;

        forces[j][0] -= nx * forceMag;
        forces[j][1] -= ny * forceMag;
        forces[j][2] -= nz * forceMag;
      }
      
      const dx = pos[i][0];
      const dy = pos[i][1];
      const dz = pos[i][2];
      const distFromCenter = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-6;
      
      const boundarySurfaceDist = Math.max(0.1, GLOBAL_SPACE_RADIUS - distFromCenter - zoneR[i]);
      const G_ext = p.zoneGExt;
      let inForce = (G_ext * 3.0 * masses[i]) / (boundarySurfaceDist * boundarySurfaceDist + 50.0);

      if (distFromCenter + zoneR[i] > GLOBAL_SPACE_RADIUS) {
        inForce += (distFromCenter + zoneR[i] - GLOBAL_SPACE_RADIUS) * 15.0;
      }

      const nx = dx / distFromCenter;
      const ny = dy / distFromCenter;
      const nz = dz / distFromCenter;

      forces[i][0] -= nx * inForce;
      forces[i][1] -= ny * inForce;
      forces[i][2] -= nz * inForce;
    }

    eulerIntegrate(n, dt, damping, masses, pos, vel, forces);
  }

  const out: Record<string, [number, number, number]> = {};
  zones.forEach((z, i) => {
    out[z.id] = pos[i];
  });
  return out;
}

export type FormattedNodeLayout = {
  [id: string]: [number, number, number] | any;
};

export function layoutNodes(
  mapOrNodes: MapState | ProblemNode[],
  zonePositionsOrZones?: Record<string, [number, number, number]> | ScienceZone[],
  customParamsOrEdges?: Partial<PhysicsParams> | DependencyEdge[]
): FormattedNodeLayout {
  let nodes: ProblemNode[] = [];
  let zones: ScienceZone[] = [];
  let zonePositions: Record<string, [number, number, number]> = {};
  let customParams: Partial<PhysicsParams> | undefined = undefined;

  if (Array.isArray(mapOrNodes)) {
    nodes = mapOrNodes;
    zones = Array.isArray(zonePositionsOrZones) ? zonePositionsOrZones : [];
    zonePositions = layoutZones(zones, nodes);
  } else {
    const map = mapOrNodes as MapState;
    nodes = map.nodes || [];
    zones = map.zones || [];
    zonePositions = (zonePositionsOrZones as Record<string, [number, number, number]>) || layoutZones(zones, nodes);
    customParams = customParamsOrEdges as Partial<PhysicsParams>;
  }

  const p = { ...DEFAULT_PHYSICS_PARAMS, ...customParams };
  const n = nodes.length;

  const createResult = (mapObj: Record<string, [number, number, number]>): FormattedNodeLayout => {
    const res = { ...mapObj } as FormattedNodeLayout;
    Object.defineProperty(res, 'get', {
      value: (id: string) => {
        const val = res[id];
        return val ? { x: val[0], y: val[1], z: val[2] } : undefined;
      },
      enumerable: false,
      configurable: true,
    });
    Object.defineProperty(res, 'size', {
      get: () => Object.keys(res).length,
      enumerable: false,
      configurable: true,
    });
    return res;
  };

  if (n === 0) return createResult({});

  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const getZid = (node: ProblemNode) => (node.zoneIds && node.zoneIds[0] && zonePositions[node.zoneIds[0]]) ? node.zoneIds[0] : 'math';

  const zoneBaseR: Record<string, number> = {};
  zones.forEach(z => {
    zoneBaseR[z.id] = zoneVisualRadius(z, nodes);
  });

  const nodeRadii: Record<string, number> = {};
  nodes.forEach(node => {
    nodeRadii[node.id] = nodeVisualRadius(node, nodes);
  });

  // Group nodes by primary scientific zone
  const zoneMembersMap: Record<string, ProblemNode[]> = {};
  nodes.forEach(node => {
    const zid = getZid(node);
    if (!zoneMembersMap[zid]) zoneMembersMap[zid] = [];
    zoneMembersMap[zid].push(node);
  });

  const rawPos: Record<string, [number, number, number]> = {};
  const nodeConeMap = new Map<string, { coneDir: Vector3D; targetRadius: number; rootId: string }>();

  // Conical Sector Monolith Layout Algorithm
  Object.entries(zoneMembersMap).forEach(([zid, members]) => {
    const zc = zonePositions[zid] || [0, 0, 0];
    const R = zoneBaseR[zid] || 15;

    // Identify Root Nodes (depth 0 or no incoming dependencies in zone)
    const memberSet = new Set(members.map(m => m.id));
    let rootNodes = members.filter(m => (m.fractalDepth ?? 0) === 0 || !m.dependencyIds || m.dependencyIds.every(d => !memberSet.has(d)));
    if (rootNodes.length === 0) {
      const minDepth = Math.min(...members.map(m => m.fractalDepth ?? 0));
      rootNodes = members.filter(m => (m.fractalDepth ?? 0) === minDepth);
    }

    const rootCount = Math.max(1, rootNodes.length);
    const coneDirs = computeEvenSphereDirections(rootCount);

    const rootConeIndexMap = new Map<string, number>();
    rootNodes.forEach((rNode, idx) => {
      rootConeIndexMap.set(rNode.id, idx);
    });

    // Sub-counters for nodes in each cone
    const coneNodeCounters = new Array<number>(rootCount).fill(0);

    members.forEach((node) => {
      // Find ancestor root node
      let rootId = node.id;
      let curr = node;
      const visited = new Set<string>([node.id]);

      while (!rootConeIndexMap.has(rootId) && curr.dependencyIds && curr.dependencyIds.length > 0) {
        const parentId = curr.dependencyIds.find(p => memberSet.has(p) && !visited.has(p));
        if (!parentId) break;
        visited.add(parentId);
        rootId = parentId;
        const parentNode = nodeMap.get(parentId);
        if (!parentNode) break;
        curr = parentNode;
      }

      let coneIdx = rootConeIndexMap.get(rootId);
      if (coneIdx === undefined) {
        coneIdx = Math.abs(node.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % rootCount;
      }

      const coneDir = coneDirs[coneIdx];
      const subIndex = coneNodeCounters[coneIdx]++;
      const depth = Math.max(0, node.fractalDepth ?? 0);

      // Radial position: roots near center (0.12 * R), leaves further out up to 0.85 * R
      const isRoot = (rootNodes.some(r => r.id === node.id) || depth === 0);
      const targetRadius = isRoot
        ? Math.max(2.5, R * 0.12)
        : R * (0.22 + 0.63 * Math.min(1.0, depth / 4.0));

      // Construct perpendicular basis (u, v) for the cone direction
      let ux = 0, uy = 0, uz = 0;
      if (Math.abs(coneDir.z) < 0.85) {
        ux = -coneDir.y; uy = coneDir.x; uz = 0;
      } else {
        ux = 0; uy = -coneDir.z; uz = coneDir.y;
      }
      const uLen = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1;
      ux /= uLen; uy /= uLen; uz /= uLen;

      // v = coneDir x u
      const vx = coneDir.y * uz - coneDir.z * uy;
      const vy = coneDir.z * ux - coneDir.x * uz;
      const vz = coneDir.x * uy - coneDir.y * ux;

      if (isRoot) {
        rawPos[node.id] = [zc[0] + coneDir.x * targetRadius, zc[1] + coneDir.y * targetRadius, zc[2] + coneDir.z * targetRadius];
      } else {
        const spreadAngle = Math.min(0.65, 0.18 * depth + 0.08 * (subIndex % 5));
        const subPhi = 2.39996 * subIndex; // Golden spiral inside cone
        const offX = Math.cos(subPhi) * spreadAngle;
        const offY = Math.sin(subPhi) * spreadAngle;

        const dirX = coneDir.x + offX * ux + offY * vx;
        const dirY = coneDir.y + offX * uy + offY * vy;
        const dirZ = coneDir.z + offX * uz + offY * vz;
        const dirLen = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1;

        rawPos[node.id] = [
          zc[0] + (dirX / dirLen) * targetRadius,
          zc[1] + (dirY / dirLen) * targetRadius,
          zc[2] + (dirZ / dirLen) * targetRadius,
        ];
      }

      nodeConeMap.set(node.id, { coneDir, targetRadius, rootId });
    });
  });

  const pos: [number, number, number][] = nodes.map(n => rawPos[n.id] || [0, 0, 0]);
  const vel: [number, number, number][] = Array.from({ length: n }, () => [0, 0, 0]);

  const minSurfaceGap = p.minNodeSurfaceGap;
  const dt = 0.2;
  const damping = 0.80;
  const STEPS = 80;

  // N-body Force Relaxation with Conic & Radial Restoring Forces
  for (let s = 0; s < STEPS; s++) {
    const forces: [number, number, number][] = Array.from({ length: n }, () => [0, 0, 0]);

    for (let i = 0; i < n; i++) {
      const nodeI = nodes[i];
      const radI = nodeRadii[nodeI.id];
      const massI = (radI * radI * radI) / 8.0 + 0.5;
      const coneInfo = nodeConeMap.get(nodeI.id);

      // 1. Mutual node-node repulsion within zone
      for (let j = i + 1; j < n; j++) {
        if (getZid(nodes[i]) !== getZid(nodes[j])) continue;

        const nodeJ = nodes[j];
        const radJ = nodeRadii[nodeJ.id];
        const massJ = (radJ * radJ * radJ) / 8.0 + 0.5;

        const dx = pos[i][0] - pos[j][0];
        const dy = pos[i][1] - pos[j][1];
        const dz = pos[i][2] - pos[j][2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-6;

        const surfaceDist = Math.max(0.1, dist - radI - radJ);
        const G = p.nodeG;
        let forceMag = (G * 4.0 * massI * massJ) / (surfaceDist * surfaceDist + 4.0);

        if (surfaceDist < minSurfaceGap) {
          forceMag += (minSurfaceGap - surfaceDist) * 10.0;
        }

        const nx = dx / dist;
        const ny = dy / dist;
        const nz = dz / dist;

        forces[i][0] += nx * forceMag;
        forces[i][1] += ny * forceMag;
        forces[i][2] += nz * forceMag;

        forces[j][0] -= nx * forceMag;
        forces[j][1] -= ny * forceMag;
        forces[j][2] -= nz * forceMag;
      }

      // 2. Zone boundary and radial restoring force
      const zidI = getZid(nodeI);
      const zcI = zonePositions[zidI] || [0, 0, 0];
      const zR = zoneBaseR[zidI] || 15;

      const dx = pos[i][0] - zcI[0];
      const dy = pos[i][1] - zcI[1];
      const dz = pos[i][2] - zcI[2];
      const distFromCenter = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-6;

      if (coneInfo) {
        // Radial distance restoring force towards targetRadius
        const radDiff = coneInfo.targetRadius - distFromCenter;
        const radForce = radDiff * 1.5;
        forces[i][0] += (dx / distFromCenter) * radForce;
        forces[i][1] += (dy / distFromCenter) * radForce;
        forces[i][2] += (dz / distFromCenter) * radForce;

        // Conic axis alignment restoring force
        const proj = (dx * coneInfo.coneDir.x + dy * coneInfo.coneDir.y + dz * coneInfo.coneDir.z);
        const perpX = dx - proj * coneInfo.coneDir.x;
        const perpY = dy - proj * coneInfo.coneDir.y;
        const perpZ = dz - proj * coneInfo.coneDir.z;
        forces[i][0] -= perpX * 0.8;
        forces[i][1] -= perpY * 0.8;
        forces[i][2] -= perpZ * 0.8;
      }

      const boundarySurfaceDist = Math.max(0.1, zR - distFromCenter - radI);
      let inForce = (p.nodeGExt * 2.0 * massI) / (boundarySurfaceDist * boundarySurfaceDist + 10.0);
      if (distFromCenter + radI > zR * 0.85) {
        inForce += (distFromCenter + radI - zR * 0.85) * 15.0;
      }

      forces[i][0] -= (dx / distFromCenter) * inForce;
      forces[i][1] -= (dy / distFromCenter) * inForce;
      forces[i][2] -= (dz / distFromCenter) * inForce;

      // 3. Dependency Hooke springs
      const deps = nodeI.dependencyIds || [];
      for (const depId of deps) {
        const j = nodes.findIndex(x => x.id === depId);
        if (j !== -1 && getZid(nodeI) === getZid(nodes[j])) {
          const nodeJ = nodes[j];
          const radJ = nodeRadii[nodeJ.id];

          const ddx = pos[j][0] - pos[i][0];
          const ddy = pos[j][1] - pos[i][1];
          const ddz = pos[j][2] - pos[i][2];
          const ddist = Math.sqrt(ddx*ddx + ddy*ddy + ddz*ddz) + 1e-6;

          const surfaceDist = Math.max(0.0, ddist - radI - radJ);
          const restSurfaceGap = minSurfaceGap * p.springRestGapMult;
          const springForce = p.springK * (surfaceDist - restSurfaceGap) * 1.5;

          forces[i][0] += (ddx / ddist) * springForce;
          forces[i][1] += (ddy / ddist) * springForce;
          forces[i][2] += (ddz / ddist) * springForce;
        }
      }
    }

    eulerIntegrate(n, dt, damping, (i) => {
      const radI = nodeRadii[nodes[i].id];
      return (radI * radI * radI) / 8.0 + 0.5;
    }, pos, vel, forces);
  }

  const outMap: Record<string, [number, number, number]> = {};
  nodes.forEach((node, i) => {
    outMap[node.id] = pos[i];
  });

  return createResult(outMap);
}

/** 
 * Радиус сферы зоны 
 */
export function zoneVisualRadius(zone: ScienceZone, nodes: ProblemNode[]): number {
  const members = nodes.filter(n => {
    const primaryId = (n.zoneIds && n.zoneIds[0]) ? n.zoneIds[0] : 'math';
    return primaryId === zone.id;
  });
  if (members.length === 0) return 1.0;

  const radii = members.map(n => nodeVisualRadius(n, nodes));
  const maxR = Math.max(...radii);
  
  // Математическая оценка охватывающего радиуса при плотной упаковке кругов/сфер
  const sumSquared = radii.reduce((sum, r) => sum + r * r, 0);
  const estimatedR = (maxR + Math.sqrt(sumSquared)) * 0.5;

  // Охватывающая область + 10%
  return Number((estimatedR * 1.1).toFixed(2));
}

export function nodeVisualRadius(node: ProblemNode, allNodes: ProblemNode[]): number {
  const nodeList = allNodes && allNodes.length > 0 ? allNodes : [node];

  // Helper to compute net profitability of a node solution (marketGain - costToSolve)
  const getProfit = (n: ProblemNode): number => {
    const gain = n.economic?.marketGain || 0;
    const cost = n.economic?.costToSolve || 0;
    return Math.max(1, gain - cost);
  };

  // 1. Calculate profitability for all nodes in the map
  const profits = nodeList.map(getProfit);

  // 2. Find min and max bounds of the profitability range
  const minP = Math.min(...profits);
  const maxP = Math.max(...profits);

  const logMin = Math.log10(minP);
  const logMax = Math.log10(maxP);

  // 3. Compute profitability and log value for current node
  const nodeP = getProfit(node);
  const logP = Math.log10(nodeP);

  // 4. Normalized score on log scale [0..1]
  const t = logMax > logMin ? Math.max(0, Math.min(1, (logP - logMin) / (logMax - logMin))) : 0.5;

  // 5. Rank node sphere visual radius on logarithmic scale with high contrast ratio
  // Min radius = 0.75 (compact), Max radius = 3.60 (prominent)
  const R_MIN = 0.75;
  const R_MAX = 3.60;
  const baseRadius = R_MIN + t * (R_MAX - R_MIN);

  // Core singularity structural boost
  const coreBoost = node.type === 'core_singularity' ? 1.15 : 1.0;

  return Number((baseRadius * coreBoost).toFixed(2));
}
