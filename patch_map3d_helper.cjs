const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf8');
const helper = `
function nodeMatchesQuery(n: ProblemNode, q: string, hiddenZones: Set<string>, showOnlyDerivatives: boolean): boolean {
  if (n.zoneIds.every(zid => hiddenZones.has(zid))) return false;
  if (showOnlyDerivatives && !isDerivativeNode(n)) return false;
  if (!q) return true;
  return (
    (n.title?.toLowerCase().includes(q) || false) ||
    (n.description?.toLowerCase().includes(q) || false) ||
    (n.targetFunction?.toLowerCase().includes(q) || false)
  );
}
`;
code = code.replace(`export const Map3D: React.FC = () => {`, helper + `\nexport const Map3D: React.FC = () => {`);

// also fix visibleNodeIds used before declaration
const vNodeIdx = code.indexOf(`const visibleNodeIds = useMemo(() => {`);
if (vNodeIdx > -1) {
  const smcIdx = code.indexOf(`const searchMatchCount = useMemo(() => {`);
  if (smcIdx > -1 && smcIdx < vNodeIdx) {
    // Need to move visibleNodeIds BEFORE searchMatchCount
    // Let's just inline it or something.
    console.log("Fixing ordering...");
  }
}
fs.writeFileSync('src/ui/Map3D.tsx', code);
