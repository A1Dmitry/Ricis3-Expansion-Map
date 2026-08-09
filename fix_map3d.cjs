const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

// I need to find `const formatCurrency = (val?: number) => {` and replace everything up to `const map = useMapStore();` with the correct `formatCurrency` and `export const Map3D: React.FC = () => {`

const fixRegex = /const formatCurrency = \(\w*\?: number\) => \{[\s\S]*?const map = useMapStore\(\);/m;

const replacement = `const formatCurrency = (val?: number) => {
  if (val === undefined) return '';
  if (val >= 1e9) return '$' + (val / 1e9).toFixed(1) + 'B';
  if (val >= 1e6) return '$' + (val / 1e6).toFixed(1) + 'M';
  return '$' + val.toLocaleString();
};

export const Map3D: React.FC = () => {
  const map = useMapStore();`;

if (code.match(fixRegex)) {
  code = code.replace(fixRegex, replacement);
  fs.writeFileSync('src/ui/Map3D.tsx', code);
  console.log('Fixed Map3D.tsx');
} else {
  console.log('Could not find the buggy block');
}
