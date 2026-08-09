const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

const regex = /export const Map3D: React\.FC = \(\) => \{/g;
let match;
const indices = [];
while ((match = regex.exec(code)) !== null) {
  indices.push(match.index);
}

if (indices.length > 1) {
  // Keep the first one, delete everything from the second one onwards
  code = code.substring(0, indices[1]);
  fs.writeFileSync('src/ui/Map3D.tsx', code);
  console.log('Truncated at second export. New line count:', code.split('\\n').length);
} else {
  console.log('No extra exports found.');
}
