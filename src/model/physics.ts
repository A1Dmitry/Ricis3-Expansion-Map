import { ProblemNode, ScienceZone, MapState } from './types';

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

export function layoutNodes(
  map: MapState,
  zonePositions: Record<string, [number, number, number]>,
  customParams?: Partial<PhysicsParams>
): Record<string, [number, number, number]> {
  const p = { ...DEFAULT_PHYSICS_PARAMS, ...customParams };
  const nodes = map.nodes;
  const n = nodes.length;
  if (n === 0) return {};

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const getZid = (node: ProblemNode) => (node.zoneIds[0] && zonePositions[node.zoneIds[0]]) ? node.zoneIds[0] : 'math';

  const zoneBaseR: Record<string, number> = {};
  map.zones.forEach(z => {
    zoneBaseR[z.id] = zoneVisualRadius(z, map.nodes);
  });

  const nodeRadii: Record<string, number> = {};
  nodes.forEach(node => {
    nodeRadii[node.id] = nodeVisualRadius(node, nodes);
  });

  // Calculate inter-scientific bridge score & centrality for every node
  const bridgeScores: Record<string, number> = {};
  nodes.forEach(node => {
    const selfZone = getZid(node);
    const deps = [...(node.dependencyIds || []), ...(node.dependentIds || [])];
    const crossZoneCount = deps.filter(depId => {
      const depNode = nodeMap.get(depId);
      return depNode && getZid(depNode) !== selfZone;
    }).length;

    const isMultiZone = node.zoneIds.length > 1;
    const isCoreHub = (node.fractalDepth || 0) === 0 || /AGI|Core|Якобиан|Jacobian|Инвариант|singularity/i.test(node.title);
    const dependentCount = node.dependentIds?.length || 0;

    bridgeScores[node.id] = crossZoneCount * 4 + (isMultiZone ? 6 : 0) + (isCoreHub ? 10 : 0) + dependentCount * 2;
  });

  // Group nodes by their primary scientific zone
  const zoneMembersMap: Record<string, ProblemNode[]> = {};
  nodes.forEach(node => {
    const zid = getZid(node);
    if (!zoneMembersMap[zid]) zoneMembersMap[zid] = [];
    zoneMembersMap[zid].push(node);
  });

  const rawPos: Record<string, [number, number, number]> = {};

  // Volumetric initial 3D distribution per zone filling the full sphere volume (diffusion model)
  Object.entries(zoneMembersMap).forEach(([zid, members]) => {
    const zc = zonePositions[zid] || [0, 0, 0];
    const R = zoneBaseR[zid] || 15;

    // Sort zone members descending by bridgeScore so major core hubs start near center
    members.sort((a, b) => bridgeScores[b.id] - bridgeScores[a.id]);

    const mCount = members.length;
    // Radial bounds spanning from inner core (12% radius) out to outer boundary (85% radius)
    const R_min = Math.max(4.0, R * 0.12);
    const R_max = Math.max(R_min + 4.0, R * 0.85);

    members.forEach((node, i) => {
      if (i === 0 && bridgeScores[node.id] >= 10) {
        // Core bridging hub placed at exact center of zone
        rawPos[node.id] = [zc[0], zc[1], zc[2]];
      } else {
        // Volumetric 3D radius r_i = (R_min^3 + u * (R_max^3 - R_min^3))^(1/3) for uniform 3D density
        const u = mCount > 1 ? i / (mCount - 1) : 0.5;
        const bScore = bridgeScores[node.id];
        // High bridge score pulls radius slightly inward (0.6x - 1.0x), regular nodes fill full volume
        const bridgeInwardFactor = bScore > 0 ? Math.max(0.60, 1.0 - Math.min(0.40, bScore * 0.02)) : 1.0;
        const targetRadius = Math.cbrt(Math.pow(R_min, 3) + u * (Math.pow(R_max, 3) - Math.pow(R_min, 3))) * bridgeInwardFactor;

        // Golden Ratio 3D Fibonacci sphere distribution for uniform directional spreading
        const phi = Math.acos(1 - (2 * (i + 0.5)) / mCount);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;

        rawPos[node.id] = [
          zc[0] + Math.sin(phi) * Math.cos(theta) * targetRadius,
          zc[1] + Math.sin(phi) * Math.sin(theta) * targetRadius,
          zc[2] + Math.cos(phi) * targetRadius
        ];
      }
    });
  });

  const pos: [number, number, number][] = nodes.map(n => rawPos[n.id] || [0,0,0]);
  const vel: [number, number, number][] = Array.from({ length: n }, () => [0, 0, 0]);

  const minSurfaceGap = p.minNodeSurfaceGap;
  const dt = 0.2;
  const damping = 0.80;
  const STEPS = 80;

  // Адаптивная динамика $N$-тел с поддержкой законов пружин Гука и отталкивания
  for (let s = 0; s < STEPS; s++) {
    const forces: [number, number, number][] = Array.from({ length: n }, () => [0, 0, 0]);

    for (let i = 0; i < n; i++) {
      const nodeI = nodes[i];
      const radI = nodeRadii[nodeI.id];
      const massI = (radI * radI * radI) / 8.0 + 0.5;

      // 1. Взаимное расталкивание узлов одной зоны
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

      // 2. Давление среды зоны и мягкий удерживающий контур
      const zidI = getZid(nodeI);
      const zcI = zonePositions[zidI] || [0, 0, 0];
      const zR = zoneBaseR[zidI] || 15;

      const dx = pos[i][0] - zcI[0];
      const dy = pos[i][1] - zcI[1];
      const dz = pos[i][2] - zcI[2];
      const distFromCenter = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-6;

      const boundarySurfaceDist = Math.max(0.1, zR - distFromCenter - radI);
      const G_ext = p.nodeGExt;
      let inForce = (G_ext * 2.0 * massI) / (boundarySurfaceDist * boundarySurfaceDist + 10.0);

      if (distFromCenter + radI > zR * 0.85) {
        inForce += (distFromCenter + radI - zR * 0.85) * 15.0;
      }

      const nx = dx / distFromCenter;
      const ny = dy / distFromCenter;
      const nz = dz / distFromCenter;

      forces[i][0] -= nx * inForce;
      forces[i][1] -= ny * inForce;
      forces[i][2] -= nz * inForce;

      // 3. Структурные связи (Закон Гука для резинок / пружин)
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

          const k = p.springK;
          const springForce = k * (surfaceDist - restSurfaceGap) * 1.5;

          const snx = ddx / ddist;
          const sny = ddy / ddist;
          const snz = ddz / ddist;

          forces[i][0] += snx * springForce;
          forces[i][1] += sny * springForce;
          forces[i][2] += snz * springForce;
        }
      }
    }

    // Интегрирование импульсов и позиций
    eulerIntegrate(n, dt, damping, (i) => {
      const radI = nodeRadii[nodes[i].id];
      return (radI * radI * radI) / 8.0 + 0.5;
    }, pos, vel, forces);
  }

  const out: Record<string, [number, number, number]> = {};
  nodes.forEach((node, i) => {
    out[node.id] = pos[i];
  });
  return out;
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
