const fs = require('fs');
const lines = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8').split('\n');

let start = -1;
let end = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("{selectedNode && selectedNode.state !==")) {
    start = i;
  }
  if (start !== -1 && i > start && lines[i].includes("Синтезировать решение (RICIS-III)")) {
    end = i + 1;
    break;
  }
}

if (start !== -1 && end !== -1) {
  const newLines = [
    "            {selectedNode && selectedNode.state !== 'resolved' && isNodeAvailable(selectedNode, map) && (",
    "              <div className=\"mt-2 w-full\">",
    "                {isSolving && solveLogs.length > 0 && (",
    "                  <div className=\"mt-2 mb-2 bg-black/80 border border-cyan-900 p-2 rounded max-h-32 overflow-y-auto\">",
    "                    {solveLogs.map((log, i) => (",
    "                      <p key={i} className=\"text-[9px] text-cyan-300 font-mono mb-1\">> {log}</p>",
    "                    ))}",
    "                  </div>",
    "                )}",
    "                <button type=\"button\" onClick={() => handleSolve(selectedNode.id)} disabled={isSolving} className=\"w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-900/50 disabled:text-cyan-400/50 text-white font-bold text-[10px] uppercase tracking-wider rounded\">{isSolving ? 'Агент вычисляет (RICIS-III)...' : 'Синтезировать решение (RICIS-III)'}</button>",
    "              </div>",
    "            )}"
  ];
  
  lines.splice(start, end - start + 1, ...newLines);
  fs.writeFileSync('src/ui/Map3D.tsx', lines.join('\n'));
  console.log('Fixed JSX 4');
}
