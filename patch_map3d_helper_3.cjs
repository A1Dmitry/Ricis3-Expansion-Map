const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf8');

// The helper is currently inside the Map3D component but maybe below its usage, 
// or was inserted weirdly. Let's extract it completely outside at the top.

const innerHelper = `  const nodeMatchesQuery = (n: ProblemNode, q: string, hiddenZones: Set<string>, showOnlyDerivatives: boolean): boolean => {
    if (n.zoneIds.every(zid => hiddenZones.has(zid))) return false;
    if (showOnlyDerivatives && !isDerivativeNode(n)) return false;
    if (!q) return true;
    return (
      (n.title?.toLowerCase().includes(q) || false) ||
      (n.description?.toLowerCase().includes(q) || false) ||
      (n.targetFunction?.toLowerCase().includes(q) || false)
    );
  };`;

// we will define it as a pure function outside, passing isDerivativeNode as an argument or re-implementing it
const pureHelper = `
function isDerivativeNodeRef(n: { type?: string; isDerivativeClaim?: boolean }) {
  return n.type === 'derivative' || n.isDerivativeClaim === true;
}

function nodeMatchesQuery(n: ProblemNode, q: string, hiddenZones: Set<string>, showOnlyDerivatives: boolean): boolean {
  if (n.zoneIds.every(zid => hiddenZones.has(zid))) return false;
  if (showOnlyDerivatives && !isDerivativeNodeRef(n)) return false;
  if (!q) return true;
  return (
    (n.title?.toLowerCase().includes(q) || false) ||
    (n.description?.toLowerCase().includes(q) || false) ||
    (n.targetFunction?.toLowerCase().includes(q) || false)
  );
}
`;

// remove all variations
code = code.replace(innerHelper, '');
code = code.replace(/function nodeMatchesQuery[\s\S]*?\}[\s\S]*?\n/g, '');

const insertPoint = `export const Map3D: React.FC = () => {`;
code = code.replace(insertPoint, pureHelper + '\n' + insertPoint);

fs.writeFileSync('src/ui/Map3D.tsx', code);
console.log("Moved helper outside properly");
