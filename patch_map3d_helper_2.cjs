const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf8');

// Remove from outside
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
code = code.replace(helper, '');

// Insert it right after isDerivativeNode inside the component
const insertTarget = `const isDerivativeNode = (n: { type?: string; isDerivativeClaim?: boolean }) =>
    n.type === 'derivative' || n.isDerivativeClaim === true;`;
    
const replacement = insertTarget + `

  const nodeMatchesQuery = (n: ProblemNode, q: string, hiddenZones: Set<string>, showOnlyDerivatives: boolean): boolean => {
    if (n.zoneIds.every(zid => hiddenZones.has(zid))) return false;
    if (showOnlyDerivatives && !isDerivativeNode(n)) return false;
    if (!q) return true;
    return (
      (n.title?.toLowerCase().includes(q) || false) ||
      (n.description?.toLowerCase().includes(q) || false) ||
      (n.targetFunction?.toLowerCase().includes(q) || false)
    );
  };
`;
code = code.replace(insertTarget, replacement);
fs.writeFileSync('src/ui/Map3D.tsx', code);
console.log("Moved helper inside");
