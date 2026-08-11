const fs = require('fs');
let code = fs.readFileSync('src/model/physics.ts', 'utf8');

const interfaceInjection = `export interface PhysicsParams {
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
  minNodeSurfaceGap: 4.0,
};

`;

code = code.replace(/export interface PressureLayoutParams/, interfaceInjection + 'export interface PressureLayoutParams');

// Replace layoutZones signature
code = code.replace(/export function layoutZones\([\s\S]*?\): Record<string, \[number, number, number\]> \{/m, 
`export function layoutZones(
  zones: ScienceZone[],
  nodes: ProblemNode[],
  customParams?: Partial<PhysicsParams>
): Record<string, [number, number, number]> {
  const p = { ...DEFAULT_PHYSICS_PARAMS, ...customParams };`);

// Fix ZONE_SURFACE_GAP, G, G_ext inside layoutZones
code = code.replace(/const ZONE_SURFACE_GAP = 30\.0;/, '');
code = code.replace(/const ZONE_SURFACE_GAP = 5\.0;/, ''); // if old one exists
code = code.replace(/ZONE_SURFACE_GAP/g, 'p.zoneSurfaceGap');
code = code.replace(/const G = 15\.0;/g, 'const G = p.zoneG;');
code = code.replace(/const G_ext = 20\.0;/g, 'const G_ext = p.zoneGExt;');

// Replace layoutNodes signature
code = code.replace(/export function layoutNodes\([\s\S]*?\): Record<string, \[number, number, number\]> \{/m, 
`export function layoutNodes(
  map: MapState,
  zonePositions: Record<string, [number, number, number]>,
  customParams?: Partial<PhysicsParams>
): Record<string, [number, number, number]> {
  const p = { ...DEFAULT_PHYSICS_PARAMS, ...customParams };`);

// Fix minSurfaceGap in layoutNodes
code = code.replace(/const minSurfaceGap = 4\.0;/, 'const minSurfaceGap = p.minNodeSurfaceGap;');

// Node inner physics variables
code = code.replace(/\/\/ Было 5\.0/g, '');
code = code.replace(/\/\/ Было 8\.0/g, '');
code = code.replace(/\/\/ Было 2\.0/g, '');

code = code.replace(/const G = 15\.0;/g, 'const G = p.nodeG;');
code = code.replace(/const G_ext = 4\.0;/g, 'const G_ext = p.nodeGExt;');
code = code.replace(/const k = 0\.5;/g, 'const k = p.springK;');
code = code.replace(/const restSurfaceGap = minSurfaceGap \* 2\.0;/g, 'const restSurfaceGap = minSurfaceGap * p.springRestGapMult;');

fs.writeFileSync('src/model/physics.ts', code);
