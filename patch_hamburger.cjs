const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

const oldHeader = `<button onClick={() => setIsNodeExpanded(!isNodeExpanded)} className="text-neutral-500 hover:text-cyan-400 ml-3" title="Expand/Collapse">
                    {isNodeExpanded ? '▶' : '◀'}
                  </button>
                  <button onClick={() => setSelectedNodeId(null)} className="text-neutral-500 hover:text-white ml-3">✕</button>`;

const newHeader = `<div className="flex items-center gap-3 relative">
                  <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-neutral-500 hover:text-cyan-400 transition-colors" title="Menu">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
                  <button onClick={() => setIsNodeExpanded(!isNodeExpanded)} className="text-neutral-500 hover:text-cyan-400 transition-colors" title="Expand/Collapse">
                    {isNodeExpanded ? '▶' : '◀'}
                  </button>
                  <button onClick={() => setSelectedNodeId(null)} className="text-neutral-500 hover:text-white transition-colors">✕</button>
                  
                  {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-[#050810] border border-cyan-800/80 rounded-md shadow-[0_4px_20px_rgba(0,0,0,0.8)] z-30 p-3 flex flex-col gap-3">
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-bold uppercase text-cyan-500/80 tracking-wider">Действия</p>
                        <button type="button" onClick={() => { handleFindPathToRicis(); setIsMenuOpen(false); }} className="w-full text-left px-2 py-1.5 text-[10px] rounded hover:bg-cyan-900/40 text-cyan-300 transition-colors">
                          Вычислить путь к ядру
                        </button>
                      </div>
                      
                      <div className="space-y-1.5 border-t border-cyan-900/30 pt-2">
                        <p className="text-[9px] font-bold uppercase text-amber-500/80 tracking-wider">Генерация TEX</p>
                        <label className="flex items-start gap-2 text-[10px] text-gray-300 cursor-pointer px-1">
                          <input type="radio" name="texMode" checked={texMode === 'ricis_pure'} onChange={() => setTexMode('ricis_pure')} className="mt-0.5" />
                          <span><span className="text-cyan-400 font-semibold">RICIS-pure</span> — без пределов</span>
                        </label>
                        <label className="flex items-start gap-2 text-[10px] text-gray-300 cursor-pointer px-1">
                          <input type="radio" name="texMode" checked={texMode === 'classical_bridges'} onChange={() => setTexMode('classical_bridges')} className="mt-0.5" />
                          <span><span className="text-amber-400 font-semibold">Classical bridges</span></span>
                        </label>
                        <button type="button" onClick={() => { handleGenerateTex(); setIsMenuOpen(false); }} className="w-full mt-1 py-1.5 text-[10px] rounded border border-amber-700/50 bg-amber-950/50 text-amber-200 hover:bg-amber-900/60 transition-colors">
                          Генерировать TEX
                        </button>
                      </div>
                    </div>
                  )}
                </div>`;

code = code.replace(oldHeader, newHeader);

// Now remove the old buttons from the main card area
const fieldsetStart = '<fieldset className="border border-cyan-900/40 rounded-md p-3 bg-cyan-950/10 space-y-3">';
const fieldsetEnd = '</fieldset>';

const idxStart = code.indexOf(fieldsetStart);
const idxEnd = code.indexOf(fieldsetEnd) + fieldsetEnd.length;

if (idxStart !== -1 && idxEnd !== -1 && idxStart < idxEnd) {
  const newActions = `
              {pathNodeIds.length > 0 && (
                <div className="mb-3 text-[10px] text-cyan-400/90 font-mono bg-cyan-950/20 border border-cyan-900/40 rounded p-2 max-h-24 overflow-y-auto leading-relaxed relative">
                  <button type="button" onClick={() => setPathNodeIds([])} className="absolute top-1 right-1 px-1 text-cyan-600 hover:text-cyan-300">✕</button>
                  <div className="pr-4">
                  {pathNodeIds.map((id, idx) => (
                    <span key={id}>
                      <button type="button" className="hover:text-cyan-200 transition-colors" onClick={() => setSelectedNodeId(id)}>
                        {map.nodes.find(n => n.id === id)?.title || id}
                      </button>
                      {idx < pathNodeIds.length - 1 && <span className="text-cyan-700 mx-1">→</span>}
                    </span>
                  ))}
                  </div>
                </div>
              )}
              {unlockReqs.length > 0 && (
                <div className="mb-3 bg-gray-900/60 border border-gray-700/50 rounded p-2">
                  <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Чтобы открыть — решите:</p>
                  <ul className="space-y-1 max-h-28 overflow-y-auto">
                    {unlockReqs.map(n => (
                      <li key={n.id} className="text-[10px] text-gray-300 flex items-start gap-1">
                        <span className="text-gray-600 mt-0.5">●</span>
                        <button type="button" className="text-left hover:text-cyan-300 leading-tight" onClick={() => setSelectedNodeId(n.id)}>{n.title}</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {texMsg && <p className="mb-3 text-[9px] text-amber-300/90 font-mono break-all">{texMsg}</p>}
              
              <button
                onClick={() => handleSolve(selectedNode.id)}
                disabled={selectedNode.state === 'resolved' || !isNodeAvailable(selectedNode, map)}
                className="w-full mt-auto py-2.5 bg-cyan-700/80 hover:bg-cyan-600 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold text-[11px] uppercase tracking-widest rounded transition-colors shadow-lg"
              >
                {selectedNode.state === 'resolved' ? 'Axiom Extracted' : !isNodeAvailable(selectedNode, map) ? 'Заблокировано зависимостями' : 'Execute RICIS Solution'}
              </button>
`;
  code = code.substring(0, idxStart) + newActions + code.substring(idxEnd);
  fs.writeFileSync('src/ui/Map3D.tsx', code);
  console.log('Patched hamburger menu successfully');
} else {
  console.log('Failed to find fieldset block');
}
