const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

const regex = /const formatCurrency = \(\w*\?: number\) => \{[\s\S]*?const \[selectedNodeId, setSelectedNodeId\] = useState<string \| null>\(null\);/m;

const replacement = `const formatCurrency = (val?: number) => {
  if (val === undefined) return '';
  if (val >= 1e9) return '$' + (val / 1e9).toFixed(1) + 'B';
  if (val >= 1e6) return '$' + (val / 1e6).toFixed(1) + 'M';
  return '$' + val.toLocaleString();
};

export const Map3D: React.FC = () => {
  const map = useMapStore();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/ui/Map3D.tsx', code);
  console.log('Fixed Map3D.tsx syntax');
} else {
  console.log('Could not find the buggy block');
}
