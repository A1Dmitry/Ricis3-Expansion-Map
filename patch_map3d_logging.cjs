const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

if (!code.includes('const [solveLogs, setSolveLogs]')) {
  code = code.replace(
    `  const [isSolving, setIsSolving] = useState(false);`,
    `  const [isSolving, setIsSolving] = useState(false);\n  const [solveLogs, setSolveLogs] = useState<string[]>([]);`
  );

  const newHandleSolve = `  const handleSolve = async (id: string) => {
    const node = map.nodes.find(n => n.id === id);
    if (!node || !isNodeAvailable(node, map) || node.state === 'resolved') return;
    setIsSolving(true);
    setSolveLogs(['Инициализация агента RICIS-III...']);
    
    setTimeout(() => setSolveLogs(l => [...l, 'Сборка контекста и аксиом...']), 500);
    setTimeout(() => setSolveLogs(l => [...l, 'Отправка запроса на /api/generateProof...']), 1500);
    setTimeout(() => setSolveLogs(l => [...l, 'Синтез доказательства и применение SP1-SP4...']), 3000);

    await map.solveNode(id);
    setSolveLogs(l => [...l, 'Решение синтезировано успешно!']);
    setTimeout(() => {
      setIsSolving(false);
      setSolveLogs([]);
      setPathNodeIds([]);
    }, 2000);
  };`;

  code = code.replace(
    `  const handleSolve = async (id: string) => {\n    const node = map.nodes.find(n => n.id === id);\n    if (!node || !isNodeAvailable(node, map) || node.state === 'resolved') return;\n    setIsSolving(true);\n    await map.solveNode(id);\n    setIsSolving(false);\n    setPathNodeIds([]);\n  };`,
    newHandleSolve
  );

  const logsUI = `
                {isSolving && solveLogs.length > 0 && (
                  <div className="mt-2 bg-black/80 border border-cyan-900 p-2 rounded max-h-32 overflow-y-auto">
                    {solveLogs.map((log, i) => (
                      <p key={i} className="text-[9px] text-cyan-300 font-mono mb-1">> {log}</p>
                    ))}
                  </div>
                )}
  `;

  code = code.replace(
    `<button type="button" onClick={() => handleSolve(selectedNode.id)} disabled={isSolving}`,
    logsUI + `\n                <button type="button" onClick={() => handleSolve(selectedNode.id)} disabled={isSolving}`
  );

  fs.writeFileSync('src/ui/Map3D.tsx', code);
  console.log('Patched Map3D.tsx with solveLogs');
}
