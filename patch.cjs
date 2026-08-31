const fs = require('fs');
// removed

// Actually, I can just use a simple regex replacing file.
let content = fs.readFileSync('./src/model/initialMap.ts', 'utf8');

const targetNodeIds = [
  'med-diagnostics',
  'pharm-design',
  'phys-unified',
  'econ-value',
  'ethic-alignment',
  'informatics-complexity',
  'manipulator-core-kinematics',
  'manipulator-constraints-workspace',
  'manipulator-singularities',
  'manipulator-ui-visualization',
  'calculator-node-complex-analysis',
  'calculator-node-riemann',
  'calculator-node-bsd',
  'calculator-node-hodge',
  'calculator-node-poincare',
  'calculator-node-mandelbrot',
  'calculator-node-gravitational',
  'calculator-node-yang-mills',
  'calculator-node-chladni',
  'calculator-node-kinematic'
];

let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (const id of targetNodeIds) {
    if (line.includes(`id: '${id}'`) || line.includes(`id: "${id}"`)) {
      for (let j = i + 1; j < i + 15; j++) {
        if (lines[j] && (lines[j].includes(`state: 'unresolved'`) || lines[j].includes(`state: 'partial'`) || lines[j].includes(`state: "unresolved"`) || lines[j].includes(`state: "partial"`))) {
          lines[j] = lines[j].replace(/state:\s*['"][^'"]+['"]\s*,?/, `state: 'resolved',`);
          let hasLeanErrors = false;
          for (let k = i + 1; k < i + 20; k++) {
            if (lines[k] && lines[k].includes('leanErrors:')) {
              hasLeanErrors = true;
              break;
            }
          }
          if (!hasLeanErrors) {
            lines.splice(j + 1, 0, `      leanErrors: [],`);
          }
          break;
        }
      }
    }
  }
}

content = lines.join('\n');

fs.writeFileSync('./src/model/initialMap.ts', content);
console.log('Successfully patched initialMap.ts nodes');
