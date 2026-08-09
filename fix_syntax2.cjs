const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

const brokenRegex = /const formatCurrency = \(\w*\?: number\) => \{[\s\S]*?if \(val >= 1e9\) return '/m;

if (code.match(brokenRegex)) {
  code = code.replace(brokenRegex, `const formatCurrency = (val?: number) => {
  if (val === undefined) return '';
  if (val >= 1e9) return '$' + (val / 1e9).toFixed(1) + 'B';
  if (val >= 1e6) return '$' + (val / 1e6).toFixed(1) + 'M';
  return '$' + val.toLocaleString();
};

export const Map3D: React.FC = () => {
  const map = useMapStore();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hiddenZones, setHiddenZones] = useState<Set<string>>(new Set());`);
  
  // Also, we need to remove the duplicate `const [hiddenZones` if it was captured.
  // Actually, wait, let's just replace from `const formatCurrency` all the way to `const [hiddenZones, setHiddenZones]`
  
  const betterRegex = /const formatCurrency = \(\w*\?: number\) => \{[\s\S]*?const \[hiddenZones, setHiddenZones\] = useState<Set<string>>\(new Set\(\)\);/m;
  
  // Re-read code just in case
  code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');
  code = code.replace(betterRegex, `const formatCurrency = (val?: number) => {
  if (val === undefined) return '';
  if (val >= 1e9) return '$' + (val / 1e9).toFixed(1) + 'B';
  if (val >= 1e6) return '$' + (val / 1e6).toFixed(1) + 'M';
  return '$' + val.toLocaleString();
};

export const Map3D: React.FC = () => {
  const map = useMapStore();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hiddenZones, setHiddenZones] = useState<Set<string>>(new Set());`);

  fs.writeFileSync('src/ui/Map3D.tsx', code);
  console.log('Fixed Map3D.tsx syntax finally');
}
