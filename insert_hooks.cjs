const fs = require('fs');
const lines = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8').split('\n');

const toInsert = `
const formatCurrency = (val?: number) => {
  if (val === undefined) return '';
  if (val >= 1e9) return '$' + (val / 1e9).toFixed(1) + 'B';
  if (val >= 1e6) return '$' + (val / 1e6).toFixed(1) + 'M';
  return '$' + val.toLocaleString();
};

export const Map3D: React.FC = () => {
  const map = useMapStore();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hiddenZones, setHiddenZones] = useState<Set<string>>(new Set());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
`;

lines.splice(107, 0, toInsert);
fs.writeFileSync('src/ui/Map3D.tsx', lines.join('\n'));
console.log('Inserted missing hooks');
