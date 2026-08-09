const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

const additionalColors = `  chemistry: '#34d399',
  biology: '#22c55e',
  ecology: '#15803d',
  astrophysics: '#9333ea',
  materials: '#64748b',
  linguistics: '#d946ef',`;

if (!code.includes("biology: '#22c55e'")) {
  code = code.replace(
    /chemistry: '#34d399',\s*bioinformatics: '#2dd4bf',/g,
    additionalColors + "\n  bioinformatics: '#2dd4bf',"
  );
  fs.writeFileSync('src/ui/Map3D.tsx', code);
  console.log('Colors added');
} else {
  console.log('Colors already there or match failed');
}
