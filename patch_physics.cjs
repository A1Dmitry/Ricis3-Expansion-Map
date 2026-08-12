const fs = require('fs');
const path = 'src/model/physics.ts';
let code = fs.readFileSync(path, 'utf8');

const helperStr = `
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
`;

// Insert the helper at the top or after imports
const insertPoint = `export interface PhysicsParams {`;
if (!code.includes('eulerIntegrate')) {
  code = code.replace(insertPoint, helperStr + '\n' + insertPoint);
}

// target in layoutZones
const target1 = `    for (let i = 0; i < n; i++) {
      vel[i][0] = (vel[i][0] + (forces[i][0] / masses[i]) * dt) * damping;
      vel[i][1] = (vel[i][1] + (forces[i][1] / masses[i]) * dt) * damping;
      vel[i][2] = (vel[i][2] + (forces[i][2] / masses[i]) * dt) * damping;

      pos[i][0] += vel[i][0] * dt;
      pos[i][1] += vel[i][1] * dt;
      pos[i][2] += vel[i][2] * dt;
    }`;
const replacement1 = `    eulerIntegrate(n, dt, damping, masses, pos, vel, forces);`;
code = code.replace(target1, replacement1);

// target in layoutMap
const target2 = `    // Интегрирование импульсов и позиций
    for (let i = 0; i < n; i++) {
      const radI = nodeRadii[nodes[i].id];
      const massI = (radI * radI * radI) / 8.0 + 0.5;

      vel[i][0] = (vel[i][0] + (forces[i][0] / massI) * dt) * damping;
      vel[i][1] = (vel[i][1] + (forces[i][1] / massI) * dt) * damping;
      vel[i][2] = (vel[i][2] + (forces[i][2] / massI) * dt) * damping;

      pos[i][0] += vel[i][0] * dt;
      pos[i][1] += vel[i][1] * dt;
      pos[i][2] += vel[i][2] * dt;
    }`;
const replacement2 = `    // Интегрирование импульсов и позиций
    eulerIntegrate(n, dt, damping, (i) => {
      const radI = nodeRadii[nodes[i].id];
      return (radI * radI * radI) / 8.0 + 0.5;
    }, pos, vel, forces);`;
code = code.replace(target2, replacement2);

fs.writeFileSync(path, code);
console.log("physics.ts patched");
