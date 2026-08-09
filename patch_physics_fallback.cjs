const fs = require('fs');
let code = fs.readFileSync('src/model/physics.ts', 'utf-8');

const lnStart = "export function layoutNodes(";
const lnIndex = code.indexOf(lnStart);
if (lnIndex === -1) process.exit(1);

let lnCode = code.substring(lnIndex);
const codeBefore = code.substring(0, lnIndex);

// Add helper
lnCode = lnCode.replace(
  "  const nodeMap = new Map(nodes.map(n => [n.id, n]));",
  "  const nodeMap = new Map(nodes.map(n => [n.id, n]));\n  const getZid = (node: ProblemNode) => (node.zoneIds[0] && zonePositions[node.zoneIds[0]]) ? node.zoneIds[0] : 'math';"
);

// Replace node.zoneIds[0] usages
lnCode = lnCode.replace(/const zid = node.zoneIds\[0\] \|\| 'math';/g, "const zid = getZid(node);");
lnCode = lnCode.replace(/const zid = siblings\[0\].zoneIds\[0\] \|\| 'math';/g, "const zid = getZid(siblings[0]);");
lnCode = lnCode.replace(/const zidI = nodeI.zoneIds\[0\] \|\| 'math';/g, "const zidI = getZid(nodeI);");
lnCode = lnCode.replace(/if \(nodeJ.zoneIds\[0\] !== zidI\) continue;/g, "if (getZid(nodeJ) !== zidI) continue;");

fs.writeFileSync('src/model/physics.ts', codeBefore + lnCode);
console.log('patched layoutNodes for zid fallback');
