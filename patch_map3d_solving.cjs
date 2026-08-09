const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

if (!code.includes('const [isSolving, setIsSolving]')) {
  code = code.replace(
    `  const [showAddNode, setShowAddNode] = useState(false);`,
    `  const [showAddNode, setShowAddNode] = useState(false);\n  const [isSolving, setIsSolving] = useState(false);`
  );

  const newHandleSolve = `  const handleSolve = async (id: string) => {
    const node = map.nodes.find(n => n.id === id);
    if (!node || !isNodeAvailable(node, map) || node.state === 'resolved') return;
    setIsSolving(true);
    await map.solveNode(id);
    setIsSolving(false);
    setPathNodeIds([]);
  };`;

  code = code.replace(
    `  const handleSolve = (id: string) => {\n    const node = map.nodes.find(n => n.id === id);\n    if (!node || !isNodeAvailable(node, map) || node.state === 'resolved') return;\n    map.solveNode(id);\n    setPathNodeIds([]);\n  };`,
    newHandleSolve
  );

  code = code.replace(
    `Execute RICIS Solution`,
    `{isSolving ? 'Агент вычисляет (RICIS-III)...' : 'Синтезировать решение (RICIS-III)'}`
  );
  
  code = code.replace(
    `<button type="button" onClick={() => handleSolve(selectedNode.id)} className="mt-2 w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] uppercase tracking-wider rounded">`,
    `<button type="button" onClick={() => handleSolve(selectedNode.id)} disabled={isSolving} className="mt-2 w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-900/50 disabled:text-cyan-400/50 text-white font-bold text-[10px] uppercase tracking-wider rounded">`
  );

  fs.writeFileSync('src/ui/Map3D.tsx', code);
  console.log('Patched Map3D.tsx with isSolving');
}
