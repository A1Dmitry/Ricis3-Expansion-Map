const fs = require('fs');
let code = fs.readFileSync('src/model/physics.ts', 'utf8');

const t1 = `    vel[i][0] *= damping;
    vel[i][1] *= damping;
    vel[i][2] *= damping;

    pos[i][0] += vel[i][0] * dt;
    pos[i][1] += vel[i][1] * dt;
    pos[i][2] += vel[i][2] * dt;`;

// wait, we already created eulerIntegrate, let's see if this is old code that wasn't fully refactored, or if eulerIntegrate looks identical.
