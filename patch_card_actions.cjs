const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

// Add breadcrumb right after the close buttons, before the status tags
const breadcrumb = `              </div>
              <div className="text-[9px] font-mono text-cyan-500/80 mb-3 flex flex-wrap items-center gap-1">
                <span className="text-gray-500">{map.zones.find(z => z.id === selectedNode.zoneIds[0])?.name || 'Zone'}</span>
                <span className="text-gray-600">/</span>
                <span className="text-cyan-400 font-bold">{selectedNode.title}</span>
              </div>
              <div className="mb-3 flex gap-2 flex-wrap">`;
code = code.replace(`              </div>\n              <div className="mb-3 flex gap-2 flex-wrap">`, breadcrumb);


const oldActionsStart = `              <div className="mb-3 space-y-2">`;
const oldActionsEnd = `                {selectedNode.state === 'resolved' ? 'Axiom Extracted' : !isNodeAvailable(selectedNode, map) ? 'Заблокировано зависимостями' : 'Execute RICIS Solution'}\n              </button>`;

const idxStart = code.indexOf(oldActionsStart);
const idxEnd = code.indexOf(oldActionsEnd) + oldActionsEnd.length;

if (idxStart !== -1 && idxEnd !== -1 && idxStart < idxEnd) {
  const oldActionsBlock = code.substring(idxStart, idxEnd);

  // We are going to wrap this entire section in a styled "Menu" form
  const newActionsBlock = `              <code className="block text-[10px] bg-black p-2 rounded border border-gray-800 font-mono text-cyan-200 mb-3">{selectedNode.targetFunction}</code>

              <fieldset className="border border-cyan-900/40 rounded-md p-3 bg-cyan-950/10 space-y-3">
                <legend className="text-[10px] font-bold text-cyan-500 uppercase px-2 tracking-wider">Действия (RICIS-III)</legend>
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button type="button" onClick={handleFindPathToRicis} className="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded border border-cyan-700/50 bg-cyan-950/50 text-cyan-300 hover:bg-cyan-900/60 transition-colors">Вычислить путь к ядру</button>
                    {pathNodeIds.length > 0 && (
                      <button type="button" onClick={() => setPathNodeIds([])} className="px-2 py-1.5 text-[10px] rounded border border-neutral-700 text-gray-400 hover:text-white transition-colors">✕</button>
                    )}
                  </div>
                  {pathNodeIds.length > 0 && (
                    <div className="text-[10px] text-cyan-400/90 font-mono bg-cyan-950/20 border border-cyan-900/40 rounded p-2 max-h-24 overflow-y-auto leading-relaxed">
                      {pathNodeIds.map((id, idx) => (
                        <span key={id}>
                          <button type="button" className="hover:text-cyan-200 transition-colors" onClick={() => setSelectedNodeId(id)}>
                            {map.nodes.find(n => n.id === id)?.title || id}
                          </button>
                          {idx < pathNodeIds.length - 1 && <span className="text-cyan-700 mx-1">→</span>}
                        </span>
                      ))}
                    </div>
                  )}
                  {unlockReqs.length > 0 && (
                    <div className="bg-gray-900/60 border border-gray-700/50 rounded p-2">
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
                </div>

                <div className="border border-amber-900/30 rounded p-2 bg-amber-950/10 space-y-1.5">
                  <p className="text-[9px] font-bold uppercase text-amber-500/80 tracking-wider">Генерация TEX</p>
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-start gap-2 text-[10px] text-gray-300 cursor-pointer">
                      <input type="radio" name="texMode" checked={texMode === 'ricis_pure'} onChange={() => setTexMode('ricis_pure')} className="mt-0.5" />
                      <span><span className="text-cyan-400 font-semibold">RICIS-pure</span> — без классических пределов</span>
                    </label>
                    <label className="flex items-start gap-2 text-[10px] text-gray-300 cursor-pointer">
                      <input type="radio" name="texMode" checked={texMode === 'classical_bridges'} onChange={() => setTexMode('classical_bridges')} className="mt-0.5" />
                      <span><span className="text-amber-400 font-semibold">Classical bridges</span> — классика как мост</span>
                    </label>
                  </div>
                  <button type="button" onClick={handleGenerateTex} className="w-full py-1.5 text-[10px] font-bold uppercase tracking-wider rounded border border-amber-700/50 bg-amber-950/50 text-amber-200 hover:bg-amber-900/60 transition-colors mt-1">
                    Генерировать TEX
                  </button>
                  {texMsg && <p className="text-[9px] text-amber-300/90 font-mono break-all mt-1">{texMsg}</p>}
                </div>

                <button
                  onClick={() => handleSolve(selectedNode.id)}
                  disabled={selectedNode.state === 'resolved' || !isNodeAvailable(selectedNode, map)}
                  className="w-full py-2 bg-cyan-700/80 hover:bg-cyan-600 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold text-[11px] uppercase tracking-widest rounded transition-colors"
                >
                  {selectedNode.state === 'resolved' ? 'Axiom Extracted' : !isNodeAvailable(selectedNode, map) ? 'Заблокировано зависимостями' : 'Execute RICIS Solution'}
                </button>
              </fieldset>`;

  code = code.substring(0, idxStart) + newActionsBlock + code.substring(idxEnd);
  
  // Also remove the old `<code className="block...` that might have been left over before the block
  // Wait, I put the code block inside the newActionsBlock at the top. I should remove the original code block if it's there.
  code = code.replace(/<code className="block text-\[10px\] bg-black p-2 rounded border border-gray-800 font-mono text-cyan-200 mb-3">\{selectedNode.targetFunction\}<\/code>\s*<code className="block text-\[10px\] bg-black p-2 rounded border border-gray-800 font-mono text-cyan-200 mb-3">\{selectedNode.targetFunction\}<\/code>/, 
    '<code className="block text-[10px] bg-black p-2 rounded border border-gray-800 font-mono text-cyan-200 mb-3">{selectedNode.targetFunction}</code>'
  );
  
  // Wait, the original code had:
  //               </div>
  //               <code className="block text-[10px] bg-black p-2 rounded border border-gray-800 font-mono text-cyan-200 mb-3">{selectedNode.targetFunction}</code>
  //               <div className="mb-3 border border-amber-900/40 rounded p-2 bg-amber-950/20 space-y-1.5">
  // Since I just replaced from `              <div className="mb-3 space-y-2">` to `</button>`, the `<code>` was INSIDE that old block! Wait, no:
  /*
              <div className="mb-3 space-y-2">
                ... (path to ricis)
                ... (unlock reqs)
              </div>
              <code className="block text-[10px] bg-black p-2 rounded border border-gray-800 font-mono text-cyan-200 mb-3">{selectedNode.targetFunction}</code>
              <div className="mb-3 border border-amber-900/40 rounded p-2 bg-amber-950/20 space-y-1.5">
  */
  // So the <code> WAS in the block I replaced. My replacement handles it correctly by inserting it before <fieldset>.

  fs.writeFileSync('src/ui/Map3D.tsx', code);
  console.log('Patched action menu successfully');
} else {
  console.log('Failed to find action block bounds');
}
