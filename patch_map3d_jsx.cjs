const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

const badJSX = `{selectedNode && selectedNode.state !== 'resolved' && isNodeAvailable(selectedNode, map) && (
                
                {isSolving && solveLogs.length > 0 && (
                  <div className="mt-2 bg-black/80 border border-cyan-900 p-2 rounded max-h-32 overflow-y-auto">
                    {solveLogs.map((log, i) => (
                      <p key={i} className="text-[9px] text-cyan-300 font-mono mb-1">> {log}</p>
                    ))}
                  </div>
                )}
  
                <button type="button" onClick={() => handleSolve(selectedNode.id)} disabled={isSolving} className="mt-2 w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-900/50 disabled:text-cyan-400/50 text-white font-bold text-[10px] uppercase tracking-wider rounded">{isSolving ? 'Агент вычисляет (RICIS-III)...' : 'Синтезировать решение (RICIS-III)'}</button>
              )}`;

const goodJSX = `{selectedNode && selectedNode.state !== 'resolved' && isNodeAvailable(selectedNode, map) && (
                <div className="mt-2 w-full">
                {isSolving && solveLogs.length > 0 && (
                  <div className="mt-2 mb-2 bg-black/80 border border-cyan-900 p-2 rounded max-h-32 overflow-y-auto">
                    {solveLogs.map((log, i) => (
                      <p key={i} className="text-[9px] text-cyan-300 font-mono mb-1">> {log}</p>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => handleSolve(selectedNode.id)} disabled={isSolving} className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-900/50 disabled:text-cyan-400/50 text-white font-bold text-[10px] uppercase tracking-wider rounded">{isSolving ? 'Агент вычисляет (RICIS-III)...' : 'Синтезировать решение (RICIS-III)'}</button>
                </div>
              )}`;

code = code.replace(badJSX, goodJSX);

fs.writeFileSync('src/ui/Map3D.tsx', code);
console.log('Fixed Map3D JSX');
