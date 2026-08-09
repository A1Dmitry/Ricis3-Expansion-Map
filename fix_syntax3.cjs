const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

const betterRegex = /const formatCurrency = \(\w*\?: number\) => \{[\s\S]*?const \[isMenuOpen, setIsMenuOpen\] = useState\(false\);/m;

code = code.replace(betterRegex, `const formatCurrency = (val?: number) => {
  if (val === undefined) return '';
  if (val >= 1e9) return '$' + (val / 1e9).toFixed(1) + 'B';
  if (val >= 1e6) return '$' + (val / 1e6).toFixed(1) + 'M';
  return '$' + val.toLocaleString();
};

export const Map3D: React.FC = () => {
  const map = useMapStore();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hiddenZones, setHiddenZones] = useState<Set<string>>(new Set());
  const [isMenuOpen, setIsMenuOpen] = useState(false);`);

fs.writeFileSync('src/ui/Map3D.tsx', code);
console.log('Fixed Map3D.tsx syntax finally part 3');
