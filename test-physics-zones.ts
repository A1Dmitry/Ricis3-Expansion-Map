import { ScienceZone, ProblemNode } from './src/model/types';
import { zoneVisualRadius } from './src/model/physics';

// A mock to simulate layoutZones locally
function mockLayoutZones(zones: any[], nodes: any[]) {
  const n = zones.length;
  if (n === 0) return {};

  const zoneR = zones.map(z => zoneVisualRadius(z, nodes));
  const masses = zoneR.map(R => (R * R * R) / 1000.0 + 1.0);
  
  const totalVolume = masses.reduce((a, b) => a + b, 0) * 1000.0;
  const GLOBAL_SPACE_RADIUS = Math.max(80, Math.cbrt(totalVolume) * 2.0);

  // Initial spherical distribution
  const pos: [number, number, number][] = Array.from({ length: n }, (_, i) => {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / n);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = 20; 
    return [
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
    ] as [number, number, number];
  });

  const ZONE_SURFACE_GAP = 10.0; 

  for (let iter = 0; iter < 600; iter++) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pos[i][0] - pos[j][0];
        const dy = pos[i][1] - pos[j][1];
        const dz = pos[i][2] - pos[j][2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-9;

        const reqDist = zoneR[i] + zoneR[j] + ZONE_SURFACE_GAP;
        
        let force = 0;
        if (dist < reqDist) {
          // Жесткое непроницаемое ядро
          force = (reqDist - dist) * 1.5;
        } else {
          // Чистое взаимное расталкивание 
          const repulsion = 40.0 * (masses[i] * masses[j]) / (dist * dist);
          force = repulsion;
          force = Math.min(5.0, force);
        }

        const px = (dx / dist) * force;
        const py = (dy / dist) * force;
        const pz = (dz / dist) * force;

        pos[i][0] += (px / masses[i]) * 0.4;
        pos[i][1] += (py / masses[i]) * 0.4;
        pos[i][2] += (pz / masses[i]) * 0.4;
        
        pos[j][0] -= (px / masses[j]) * 0.4;
        pos[j][1] -= (py / masses[j]) * 0.4;
        pos[j][2] -= (pz / masses[j]) * 0.4;
      }
      
      const dx = pos[i][0];
      const dy = pos[i][1];
      const dz = pos[i][2];
      const distFromCenter = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-6;
      
      const pressureRatio = Math.pow(distFromCenter / GLOBAL_SPACE_RADIUS, 3);
      const extPressureForce = 2.0 * masses[i] * pressureRatio;
      
      pos[i][0] -= (dx / distFromCenter) * (extPressureForce / masses[i]);
      pos[i][1] -= (dy / distFromCenter) * (extPressureForce / masses[i]);
      pos[i][2] -= (dz / distFromCenter) * (extPressureForce / masses[i]);
    }
  }

  const out: Record<string, [number, number, number]> = {};
  zones.forEach((z, i) => {
    out[z.id] = pos[i];
  });
  return out;
}

const zones = [
  { id: 'z1', name: 'Z1', nodeIds: ['1','2','3'] },
  { id: 'z2', name: 'Z2', nodeIds: ['4'] }
];
const nodes = [
  { id: '1', zoneIds: ['z1'], dependencyIds: [] },
  { id: '2', zoneIds: ['z1'], dependencyIds: [] },
  { id: '3', zoneIds: ['z1'], dependencyIds: [] },
  { id: '4', zoneIds: ['z2'], dependencyIds: [] }
] as any[];
console.log(mockLayoutZones(zones, nodes));
