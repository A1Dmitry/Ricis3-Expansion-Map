const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

const targetStr = '<code className="block text-[10px] bg-black p-2 rounded border border-gray-800 font-mono text-cyan-200 mb-3">{selectedNode.targetFunction}</code>';

const newStr = `<code className="block text-[10px] bg-black p-2 rounded border border-gray-800 font-mono text-cyan-200 mb-3">{selectedNode.targetFunction}</code>
              {selectedNode.singularityHint && (
                <div className="mb-3 p-2 bg-purple-950/20 border border-purple-900/40 rounded-md">
                  <p className="text-[9px] font-bold uppercase text-purple-400/90 tracking-wider mb-1">Подсказка о сингулярности</p>
                  <p className="text-[10px] text-purple-200/80 leading-relaxed">{selectedNode.singularityHint}</p>
                </div>
              )}`;

code = code.replace(targetStr, newStr);

fs.writeFileSync('src/ui/Map3D.tsx', code);
console.log('Patched singularity hint');
