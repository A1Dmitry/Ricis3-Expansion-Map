const fs = require('fs');

let logic = fs.readFileSync('src/model/logic.ts', 'utf-8');
logic = logic.replace(
  'export function generateProof(node: ProblemNode): Proof {',
  'export function generateProof(node: ProblemNode, allAxioms: Axiom[]): Proof {'
);
logic = logic.replace(
  `  latexSteps.push('\\\\section*{RICIS-III Proof: ' + node.title + '}');\n  latexSteps.push('\\\\textbf{Target Function:} $' + node.targetFunction + '$');`,
  `  latexSteps.push('\\\\section*{RICIS-III Agent Proof: ' + node.title + '}');
  latexSteps.push('\\\\textbf{Embedded Agent Initialized...}');
  
  if (allAxioms.length > 0) {
    latexSteps.push('\\\\textbf{Applying Network Axioms (Method RICIS):}');
    latexSteps.push('\\\\begin{itemize}');
    allAxioms.slice(-3).forEach(ax => {
      latexSteps.push(\`\\\\item \${ax.formalStatement}\`);
    });
    latexSteps.push('\\\\end{itemize}');
  }
  
  latexSteps.push('\\\\textbf{Target Function:} $' + node.targetFunction + '$');`
);
logic = logic.replace(
  `    { phase: 2, name: 'RICIS transforms', action: 'Apply A6 (General) and A4', expression: '0_F x infinity_G = F * G' },`,
  `    { phase: 2, name: 'RICIS transforms', action: 'Apply A6 (General) and available network axioms', expression: '0_F x infinity_G = F * G' },`
);
logic = logic.replace(
  'const proof = generateProof(node);',
  'const proof = generateProof(node, map.axioms);'
);

fs.writeFileSync('src/model/logic.ts', logic);

let map3d = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');
map3d = map3d.replace(
  `  const zoneRadii = useMemo(() => {
    const r: Record<string, number> = {};
    map.zones.forEach(z => {
      r[z.id] = zoneVisualRadius(z, map.nodes);
    });
    return r;
  }, [map.zones, map.nodes]);`,
  `  const zoneRadii = useMemo(() => {
    const r: Record<string, number> = {};
    map.zones.forEach(z => {
      const members = map.nodes.filter(n => z.nodeIds.includes(n.id) || n.zoneIds.includes(z.id));
      const zPos = zonePositions[z.id];
      if (zPos && members.length > 0) {
        let maxDist = 0;
        members.forEach(m => {
          const mPos = nodePositions[m.id];
          if (mPos) {
            const dx = mPos[0] - zPos[0];
            const dy = mPos[1] - zPos[1];
            const dz = mPos[2] - zPos[2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            // node visual radius approximately up to 5-10
            maxDist = Math.max(maxDist, dist + 15); 
          }
        });
        r[z.id] = Math.max(zoneVisualRadius(z, map.nodes), maxDist);
      } else {
        r[z.id] = zoneVisualRadius(z, map.nodes);
      }
    });
    return r;
  }, [map.zones, map.nodes, zonePositions, nodePositions]);`
);
fs.writeFileSync('src/ui/Map3D.tsx', map3d);
console.log('PATCHED');
